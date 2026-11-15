/** Local-first document repository. No account, network, or Supabase dependency.
 * Driver transactions must serialize read/write work and roll back on failure.
 * Media bytes are deliberately outside this document-only foundation.
 */
const COLLECTIONS = new Set(['songs', 'presentations', 'scripture']);
export class RevisionConflictError extends Error {
  constructor() { super('This item changed. Reload it before saving.'); this.name = 'RevisionConflictError'; }
}
function keyFor(collection, id) {
  if (!COLLECTIONS.has(collection)) throw new Error('Unsupported local collection.');
  if (typeof id !== 'string' || !id.trim() || id.length > 200) throw new Error('A valid local item ID is required.');
  return `${collection}:${id}`;
}
function documentCopy(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('A document object is required.');
  // Reject non-JSON values rather than silently losing fields during backup.
  const seen = new Set();
  const check = v => {
    if (v === null || typeof v === 'string' || typeof v === 'boolean') return;
    if (typeof v === 'number' && Number.isFinite(v)) return;
    if (typeof v !== 'object' || seen.has(v) || (!Array.isArray(v) && Object.getPrototypeOf(v) !== Object.prototype && Object.getPrototypeOf(v) !== null)) throw new Error('Document must contain finite, acyclic JSON data only.');
    if (Object.getOwnPropertySymbols(v).length) throw new Error('Symbol fields cannot be backed up as JSON.');
    if (Array.isArray(v) && Array.from({ length: v.length }, (_, index) => index).some(index => !Object.hasOwn(v, index))) throw new Error('Sparse arrays cannot be backed up without loss.');
    seen.add(v);
    for (const field of Object.values(v)) check(field);
    seen.delete(v);
  };
  check(value);
  const text = JSON.stringify(value);
  if (new TextEncoder().encode(text).byteLength > 2 * 1024 * 1024) throw new Error('Document exceeds the 2 MiB local limit; store media separately.');
  return JSON.parse(text);
}
function requireRevision(revision) {
  if (!Number.isSafeInteger(revision) || revision < 0 || revision >= Number.MAX_SAFE_INTEGER) throw new Error('An explicit non-negative expected revision is required.');
}
const BACKUP_FORMAT = 'lucent-local-library';
const BACKUP_VERSION = 1;
const MAX_BACKUP_BYTES = 16 * 1024 * 1024;
function parseBackup(text) {
  if (typeof text !== 'string' || new TextEncoder().encode(text).byteLength > MAX_BACKUP_BYTES) throw new Error('Backup must be JSON text no larger than 16 MiB.');
  let backup;
  try { backup = JSON.parse(text); } catch { throw new Error('Backup is not valid JSON.'); }
  if (!backup || backup.format !== BACKUP_FORMAT || backup.version !== BACKUP_VERSION || backup.scope !== 'documents-only') throw new Error('Unsupported Lucent backup format, version, or scope.');
  if (!Array.isArray(backup.records) || backup.records.length > 10000) throw new Error('Backup must contain at most 10,000 document records.');
  const keys = new Set();
  for (const record of backup.records) {
    if (!record || typeof record !== 'object' || Array.isArray(record)) throw new Error('Invalid backup record.');
    const key = keyFor(record.collection, record.id);
    if (record.key !== key || keys.has(key)) throw new Error('Backup contains inconsistent or duplicate identities.');
    keys.add(key);
    if (!Number.isSafeInteger(record.revision) || record.revision < 1) throw new Error('Backup contains an invalid revision.');
    if (typeof record.deleted !== 'boolean' || typeof record.updatedAt !== 'string' || !Number.isFinite(Date.parse(record.updatedAt))) throw new Error('Backup contains invalid state metadata.');
    const document = documentCopy(record.document);
    if (document.id !== record.id) throw new Error('Backup document identity does not match its record.');
  }
  return backup;
}
export function inspectLocalLibraryBackup(text) {
  const { records } = parseBackup(text);
  const collections = Object.fromEntries([...COLLECTIONS].map(collection => [collection, { active: 0, deleted: 0 }]));
  for (const record of records) collections[record.collection][record.deleted ? 'deleted' : 'active']++;
  return { version: BACKUP_VERSION, scope: 'documents-only', includesMediaBytes: false, totalRecords: records.length, collections };
}

export function createLocalLibrary(driver, { now = () => new Date().toISOString() } = {}) {
  return {
    async exportBackup() {
      const records = await driver.transaction('readonly', async tx => structuredClone(await tx.getAll()));
      records.sort((a, b) => a.key.localeCompare(b.key));
      const text = JSON.stringify({ format: BACKUP_FORMAT, version: BACKUP_VERSION, scope: 'documents-only', exportedAt: now(), records });
      // Validate our own export before returning a purported backup.
      parseBackup(text);
      return text;
    },
    async restoreIntoEmptyLibrary(text) {
      const backup = parseBackup(text);
      const summary = inspectLocalLibraryBackup(text);
      return driver.transaction('readwrite', async tx => {
        if ((await tx.getAll()).length) throw new Error('Restore requires an empty local library. Existing records, including deleted items, will not be overwritten.');
        for (const record of backup.records) await tx.put(structuredClone(record));
        return summary;
      });
    },
    async get(collection, id) {
      const key = keyFor(collection, id);
      return driver.transaction('readonly', async tx => {
        const record = await tx.get(key);
        return record && !record.deleted ? structuredClone(record) : null;
      });
    },
    async list(collection, { includeDeleted = false } = {}) {
      keyFor(collection, '_validate_');
      return driver.transaction('readonly', async tx => (await tx.getAll())
        .filter(record => record.collection === collection && (includeDeleted || !record.deleted))
        .sort((a, b) => a.id.localeCompare(b.id)).map(record => structuredClone(record)));
    },
    /**
     * @param {string} collection
     * @param {string} id
     * @param {Record<string, unknown>} document
     * @param {{ expectedRevision?: number }} options
     */
    async save(collection, id, document, { expectedRevision } = {}) {
      const key = keyFor(collection, id);
      requireRevision(expectedRevision);
      const data = documentCopy(document);
      if (data.id !== undefined && data.id !== id) throw new Error('Document ID does not match its local ID.');
      return driver.transaction('readwrite', async tx => {
        const previous = await tx.get(key);
        if ((previous?.revision ?? 0) !== expectedRevision) throw new RevisionConflictError();
        if (previous?.deleted) throw new Error('This item is deleted. Restore it explicitly before editing.');
        const record = { key, collection, id, revision: expectedRevision + 1, deleted: false, updatedAt: now(), document: { ...data, id } };
        await tx.put(record);
        return structuredClone(record);
      });
    },
    /**
     * @param {string} collection
     * @param {string} id
     * @param {boolean} deleted
     * @param {{ expectedRevision?: number }} options
     */
    async setDeleted(collection, id, deleted, { expectedRevision } = {}) {
      const key = keyFor(collection, id);
      requireRevision(expectedRevision);
      if (typeof deleted !== 'boolean') throw new Error('Deletion state must be boolean.');
      return driver.transaction('readwrite', async tx => {
        const previous = await tx.get(key);
        if (!previous) throw new Error('Local item was not found.');
        if (previous.revision !== expectedRevision) throw new RevisionConflictError();
        if (previous.deleted === deleted) return structuredClone(previous);
        const record = { ...previous, deleted, revision: expectedRevision + 1, updatedAt: now() };
        await tx.put(record);
        return structuredClone(record);
      });
    },
  };
}
