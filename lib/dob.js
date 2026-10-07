/** Allowed DOB window for the date picker (age 14-70), as YYYY-MM-DD. */
export function dobRange(now = new Date()) {
  const y = now.getUTCFullYear(), md = now.toISOString().slice(4, 10);
  return [`${y - 70}${md}`, `${y - 14}${md}`];
}
