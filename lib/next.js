/** Only same-site paths are allowed as post-login destinations. */
export const safeNext = (v) => (typeof v === 'string' && v.startsWith('/') && !v.startsWith('//') && !v.includes('\\') && v.length < 300 ? v : null);
/** Home page login box that returns to `path` afterwards. */
export const loginUrl = (path) => `/login?next=${encodeURIComponent(path)}`;
