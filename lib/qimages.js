import crypto from 'crypto';
import JSZip from 'jszip';
import { sql } from './db';

/**
 * Pictures in question Excel files.
 * Three ways a picture can sit in a cell, all supported:
 *  1. Floating picture placed over a cell (Insert → Picture) – read by ExcelJS, anchored by its top-left cell.
 *  2. Excel 365 "Place in Cell" picture (cell value is a rich value with vm="…").
 *  3. WPS Office in-cell picture (=DISPIMG("ID_…",1) with xl/cellimages.xml).
 * Pictures are shrunk to ≤ 900 px wide WebP and stored once per content hash (table qimages).
 */

const MAX_W = 900;
const MAX_BYTES = 8 * 1024 * 1024; // one source picture

/** Map column header (en_question, ta_B, …) → image slot ('q', 'A' … 'E'). */
export function slotOf(header) {
  if (header === 'en_question' || header === 'ta_question') return 'q';
  const m = /^(en|ta)_([A-E])$/.exec(header || '');
  return m ? m[2] : null;
}

const colNum = (ref) => { let n = 0; for (const ch of ref.replace(/\d+$/, '')) n = n * 26 + (ch.charCodeAt(0) - 64); return n; };
const rowNum = (ref) => Number(/\d+$/.exec(ref)?.[0] || 0);
const attrs = (tag) => Object.fromEntries([...tag.matchAll(/([\w:]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));
const resolve = (base, target) => {
  if (target.startsWith('/')) return target.slice(1);
  const parts = base.split('/'); parts.pop();
  for (const p of target.split('/')) { if (p === '..') parts.pop(); else if (p !== '.') parts.push(p); }
  return parts.join('/');
};
async function rels(zip, relsPath, basePath) {
  const x = await zip.file(relsPath)?.async('string');
  if (!x) return {};
  return Object.fromEntries([...x.matchAll(/<Relationship\b[^>]*>/g)].map((m) => { const a = attrs(m[0]); return [a.Id, resolve(basePath, a.Target)]; }));
}

/** In-cell pictures (Excel 365 rich values + WPS DISPIMG): [{ row, col, path }] for the first worksheet. */
async function inCellPictures(zip) {
  const out = [];
  const wbx = await zip.file('xl/workbook.xml')?.async('string');
  const firstSheetRid = wbx && attrs(/<sheet\b[^>]*>/.exec(wbx)?.[0] || '')['r:id'];
  const wbRels = await rels(zip, 'xl/_rels/workbook.xml.rels', 'xl/workbook.xml');
  const sheetPath = wbRels[firstSheetRid] || 'xl/worksheets/sheet1.xml';
  const sheet = await zip.file(sheetPath)?.async('string');
  if (!sheet) return out;

  // --- Excel 365 "Place in Cell": cell vm (1-based) → valueMetadata → futureMetadata rvb i → rich value → image
  const vmCells = [...sheet.matchAll(/<c\b[^>]*\bvm="(\d+)"[^>]*>/g)].map((m) => ({ ref: attrs(m[0]).r, vm: Number(m[1]) }));
  if (vmCells.length) {
    const meta = await zip.file('xl/metadata.xml')?.async('string');
    const rv = await zip.file('xl/richData/rdrichvalue.xml')?.async('string');
    const rvs = await zip.file('xl/richData/rdrichvaluestructure.xml')?.async('string');
    const rel = await zip.file('xl/richData/richValueRel.xml')?.async('string');
    if (meta && rv && rel) {
      const fut = /<futureMetadata\b[^>]*name="XLRICHVALUE"[^>]*>([\s\S]*?)<\/futureMetadata>/.exec(meta)?.[1] || '';
      const futIdx = [...fut.matchAll(/<xlrd:rvb\b[^>]*i="(\d+)"/g)].map((m) => Number(m[1]));
      const vmBlock = /<valueMetadata\b[^>]*>([\s\S]*?)<\/valueMetadata>/.exec(meta)?.[1] || '';
      const vmBk = [...vmBlock.matchAll(/<bk>([\s\S]*?)<\/bk>/g)].map((m) => Number(attrs(/<rc\b[^>]*>/.exec(m[1])?.[0] || '').v));
      const structs = rvs ? [...rvs.matchAll(/<s\b[^>]*>([\s\S]*?)<\/s>/g)].map((m) => [...m[1].matchAll(/<k\b[^>]*n="([^"]+)"/g)].map((k) => k[1])) : [];
      const values = [...rv.matchAll(/<rv\b([^>]*)>([\s\S]*?)<\/rv>/g)].map((m) => ({ s: Number(attrs(m[1]).s || 0), v: [...m[2].matchAll(/<v\b[^>]*>([^<]*)<\/v>/g)].map((x) => x[1]) }));
      const relIds = [...rel.matchAll(/<rel\b[^>]*r:id="([^"]+)"/g)].map((m) => m[1]);
      const relMap = await rels(zip, 'xl/richData/_rels/richValueRel.xml.rels', 'xl/richData/richValueRel.xml');
      for (const c of vmCells) {
        const rvIndex = futIdx[vmBk[c.vm - 1]];
        const val = values[rvIndex];
        if (!val) continue;
        const keys = structs[val.s] || [];
        const pos = Math.max(0, keys.indexOf('_rvRel:LocalImageIdentifier'));
        const relId = relIds[Number(val.v[pos])];
        const path = relMap[relId];
        if (path) out.push({ row: rowNum(c.ref), col: colNum(c.ref), path });
      }
    }
  }

  // --- WPS Office: =DISPIMG("ID_…",1)
  const disp = [];
  for (const m of sheet.matchAll(/<c\b([^>]*?)(?<!\/)>([\s\S]*?)<\/c>/g)) {
    const d = /DISPIMG\((?:&quot;|")(ID_[A-Za-z0-9]+)/.exec(m[2]);
    if (d) disp.push({ ref: attrs(m[1]).r, name: d[1] });
  }
  if (disp.length) {
    const ci = await zip.file('xl/cellimages.xml')?.async('string');
    const ciRels = await rels(zip, 'xl/_rels/cellimages.xml.rels', 'xl/cellimages.xml');
    const byName = {};
    if (ci) for (const m of ci.matchAll(/<etc:cellImage>([\s\S]*?)<\/etc:cellImage>/g)) {
      const name = /<xdr:cNvPr\b[^>]*name="([^"]+)"/.exec(m[1])?.[1];
      const rid = /<a:blip\b[^>]*r:embed="([^"]+)"/.exec(m[1])?.[1];
      if (name && rid && ciRels[rid]) byName[name] = ciRels[rid];
    }
    for (const d of disp) {
      const path = byName[d.name];
      if (d.ref && path) out.push({ row: rowNum(d.ref), col: colNum(d.ref), path });
    }
  }
  return out;
}

/**
 * All pictures of the first worksheet: { "row:col": Buffer }.
 * `wb`/`ws` are the ExcelJS workbook / first worksheet (floating pictures), `buf` the raw file (in-cell pictures).
 */
export async function sheetPictures(buf, wb, ws) {
  const pics = {};
  for (const im of ws.getImages?.() || []) {
    const tl = im.range?.tl; if (!tl) continue;
    const row = Math.floor(tl.nativeRow ?? tl.row) + 1, col = Math.floor(tl.nativeCol ?? tl.col) + 1;
    const media = wb.getImage(Number(im.imageId));
    if (media?.buffer) pics[`${row}:${col}`] = Buffer.from(media.buffer);
  }
  try {
    const zip = await JSZip.loadAsync(buf);
    for (const p of await inCellPictures(zip)) {
      const f = zip.file(p.path);
      if (f) pics[`${p.row}:${p.col}`] = await f.async('nodebuffer');
    }
  } catch { /* not a zip / unusual file: floating pictures only */ }
  return pics;
}

/** Shrink + store one picture; returns its id (content hash). */
export async function storePicture(buffer) {
  if (!buffer?.length || buffer.length > MAX_BYTES) throw new Error('படம் 8 MB-க்குள் இருக்க வேண்டும்');
  const sharp = (await import('sharp')).default;
  const img = sharp(buffer, { failOn: 'none' }).rotate();
  const out = await img.resize({ width: MAX_W, withoutEnlargement: true }).flatten({ background: '#ffffff' }).webp({ quality: 80 }).toBuffer({ resolveWithObject: true });
  const id = crypto.createHash('sha1').update(out.data).digest('hex').slice(0, 24);
  await sql`INSERT INTO qimages (id, mime, data, w, h) VALUES (${id}, 'image/webp', ${out.data}, ${out.info.width}, ${out.info.height}) ON CONFLICT (id) DO NOTHING`;
  return id;
}

/** PNG copies of stored pictures (for putting them back into a downloaded Excel template). */
export async function picturesAsPng(ids) {
  if (!ids.length) return {};
  const rows = await sql`SELECT id, data FROM qimages WHERE id = ANY(${ids})`;
  const sharp = (await import('sharp')).default;
  const out = {};
  for (const r of rows) { const { data, info } = await sharp(r.data).png().toBuffer({ resolveWithObject: true }); out[r.id] = { buffer: data, w: info.width, h: info.height }; }
  return out;
}
