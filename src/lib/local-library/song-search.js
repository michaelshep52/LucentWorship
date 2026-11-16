const normalize = value => typeof value === 'string' ? value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase() : '';
/** Literal, accent-insensitive local search; never requests or modifies cloud data. */
export function filterLocalSongs(records, query = '', status = 'all') {
  if (!Array.isArray(records) || typeof query !== 'string' || !['all', 'active', 'archived'].includes(status)) throw new Error('Invalid local song search.');
  const terms = normalize(query.slice(0, 200)).split(/\s+/u).filter(Boolean);
  return records.filter(record => {
    if (status === 'active' && record.deleted || status === 'archived' && !record.deleted) return false;
    const doc = record.document || {};
    const fields = [doc.title, doc.artist, ...(Array.isArray(doc.sections) ? doc.sections.map(section => section?.lyrics) : [])];
    const text = fields.map(normalize).join(' ');
    return terms.every(term => text.includes(term));
  });
}
