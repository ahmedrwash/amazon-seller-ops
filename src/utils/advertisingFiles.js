// Lossless bounded file reader. Imported cell text is data, never markup/code.
export const ADS_TABLES = ['ad_campaigns','ad_groups','ad_target_daily','ad_target_snapshots','ad_daily_summary','search_terms','keyword_plans','negative_keywords','keyword_change_log'];
const MAX_BYTES = 20 * 1024 * 1024;
export function parseDelimited(text) {
  text = text.replace(/^\uFEFF/, '');
  const separator = text.split(/\r?\n/, 1)[0].includes('\t') ? '\t' : ',';
  const lines = []; let line = [], value = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') { if (quoted && text[i + 1] === '"') { value += '"'; i++; } else if (quoted || !value) quoted = !quoted; else value += c; }
    else if (!quoted && (c === separator || c === '\n' || c === '\r')) {
      line.push(value); value = '';
      if (c !== separator) { if (c === '\r' && text[i + 1] === '\n') i++; lines.push(line); line = []; }
    } else value += c;
  }
  if (quoted) throw new Error('Unclosed quoted field in CSV.');
  if (value || line.length) { line.push(value); lines.push(line); }
  return records(lines);
}
function records(lines) {
  const headers = lines.shift()?.map(v => String(v ?? '').trim());
  if (!headers?.length || headers.some(v => !v) || new Set(headers).size !== headers.length) throw new Error('Missing or duplicate column names.');
  return lines.filter(row => row.some(v => v !== '' && v != null)).map((row, i) => {
    if (row.length > headers.length) throw new Error(`Too many columns at row ${i + 2}.`);
    return { row_number: i + 2, source_payload: Object.fromEntries(headers.map((key, j) => [key, row[j] == null ? null : String(row[j])])) };
  });
}
// Read the ZIP central directory before decompression; reject encryption/ZIP64/bombs.
export async function unzipSelected(bytes, select, inflate = inflateRaw) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength); const decoder = new TextDecoder();
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) if (view.getUint32(i, true) === 0x06054b50) { end = i; break; }
  if (end < 0) throw new Error('Invalid ZIP container.');
  const count = view.getUint16(end + 10, true); let at = view.getUint32(end + 16, true); let expanded = 0; const result = {};
  if (count > 1000) throw new Error('Too many ZIP entries.');
  for (let i = 0; i < count; i++) {
    if (at + 46 > bytes.length || view.getUint32(at, true) !== 0x02014b50) throw new Error('Invalid ZIP directory.');
    const flags = view.getUint16(at + 8, true), method = view.getUint16(at + 10, true), packed = view.getUint32(at + 20, true), size = view.getUint32(at + 24, true);
    const nameLength = view.getUint16(at + 28, true), offset = view.getUint32(at + 42, true);
    const name = decoder.decode(bytes.subarray(at + 46, at + 46 + nameLength));
    at += 46 + nameLength + view.getUint16(at + 30, true) + view.getUint16(at + 32, true);
    if (!select(name)) continue;
    expanded += size;
    if (flags & 1 || size === 0xffffffff || expanded > MAX_BYTES || result[name]) throw new Error('Encrypted, duplicate or oversized ZIP content.');
    if (offset + 30 > bytes.length || view.getUint32(offset, true) !== 0x04034b50) throw new Error('Invalid ZIP member.');
    const start = offset + 30 + view.getUint16(offset + 26, true) + view.getUint16(offset + 28, true);
    if (start + packed > bytes.length) throw new Error('Truncated ZIP content.');
    const compressed = bytes.subarray(start, start + packed);
    const content = method === 0 ? compressed : method === 8 ? await inflate(compressed, size) : null;
    if (!content || content.length !== size) throw new Error('Unsupported or corrupt ZIP entry.');
    result[name] = decoder.decode(content);
  }
  return result;
}
async function inflateRaw(bytes, limit) {
  const reader = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader();
  const chunks = []; let size = 0;
  try { for (;;) { const { value, done } = await reader.read(); if (done) break; size += value.length; if (size > limit || size > MAX_BYTES) throw new Error('Expanded file too large.'); chunks.push(value); } }
  finally { await reader.cancel(); }
  const result = new Uint8Array(size); let at = 0; for (const chunk of chunks) { result.set(chunk, at); at += chunk.length; } return result;
}
function xml(text) {
  if (/<!DOCTYPE|<!ENTITY/i.test(text)) throw new Error('Unsupported XML declarations.');
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length) throw new Error('Invalid workbook XML.'); return doc;
}
function workbookRows(files) {
  const shared = files['xl/sharedStrings.xml'] ? [...xml(files['xl/sharedStrings.xml']).getElementsByTagName('si')].map(si => [...si.getElementsByTagName('t')].map(t => t.textContent).join('')) : [];
  const relations = Object.fromEntries([...xml(files['xl/_rels/workbook.xml.rels']).getElementsByTagName('Relationship')].map(r => [r.getAttribute('Id'), r.getAttribute('Target')]));
  const result = [];
  for (const sheet of xml(files['xl/workbook.xml']).getElementsByTagName('sheet')) {
    const name = sheet.getAttribute('name'); if (!ADS_TABLES.includes(name)) continue;
    const target = relations[sheet.getAttribute('r:id')]; const path = target?.startsWith('/') ? target.slice(1) : `xl/${target}`;
    if (!files[path]) throw new Error(`Missing workbook sheet: ${name}`);
    const lines = [...xml(files[path]).getElementsByTagName('row')].map(row => {
      const cells = [];
      for (const cell of row.getElementsByTagName('c')) {
        const ref = cell.getAttribute('r')?.match(/^[A-Z]+/)?.[0]; if (!ref) throw new Error('Missing cell reference.');
        let column = 0; for (const c of ref) column = column * 26 + c.charCodeAt(0) - 64;
        const raw = cell.getElementsByTagName('v')[0]?.textContent;
        cells[column - 1] = cell.getAttribute('t') === 's' ? shared[Number(raw)] : cell.getAttribute('t') === 'inlineStr' ? [...cell.getElementsByTagName('t')].map(t => t.textContent).join('') : raw ?? '';
      }
      return Array.from({ length: cells.length }, (_, i) => cells[i] ?? '');
    });
    result.push(...records(lines).map(r => ({ ...r, member_name: name })));
  }
  return result;
}
export async function readAdvertisingFile(file, nativeType = 'native_campaign') {
  if (!file.size || file.size > MAX_BYTES) throw new Error('Choose a nonempty file up to 20 MB.');
  const bytes = new Uint8Array(await file.arrayBuffer()); const ext = file.name.split('.').pop().toLowerCase(); let rows;
  if (['csv','tsv','txt'].includes(ext)) rows = parseDelimited(new TextDecoder().decode(bytes)).map(r => ({ ...r, member_name: nativeType }));
  else if (ext === 'zip') {
    const files = await unzipSelected(bytes, name => ADS_TABLES.includes(name.split('/').pop().replace(/\.csv$/i,'')) && /\.csv$/i.test(name));
    rows = Object.entries(files).flatMap(([name, text]) => parseDelimited(text).map(r => ({ ...r, member_name: name.split('/').pop().replace(/\.csv$/i,'') })));
  } else if (ext === 'xlsx') rows = workbookRows(await unzipSelected(bytes, name => /^xl\/(workbook.xml|_rels\/workbook.xml.rels|sharedStrings.xml|worksheets\/sheet\d+.xml)$/.test(name)));
  else throw new Error('Supported files: original CSV/TSV or the supplied LARTIA ZIP/XLSX.');
  if (!rows.length || rows.length > 5000) throw new Error('Upload must contain 1–5,000 advertising rows. Split larger reports.');
  const digest = await crypto.subtle.digest('SHA-256', bytes); const hash = [...new Uint8Array(digest)].map(v => v.toString(16).padStart(2,'0')).join('');
  return { rows, file_sha256: hash, source_format: ext === 'zip' ? 'curated_zip' : ext === 'xlsx' ? 'curated_xlsx' : 'native_report' };
}
