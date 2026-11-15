import { songEditorDraft, newSongDocumentFromDraft } from '../src/lib/local-library/song-editor.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createLocalLibrary, RevisionConflictError, inspectLocalLibraryBackup } from '../src/lib/local-library/repository.js';
import { openLocalLibraryDatabase } from '../src/lib/local-library/indexeddb.js';

// Transactional contract double; real IndexedDB behavior needs a browser test.
function memoryDriver() {
  let data = new Map();
  let pending = Promise.resolve();
  return { transaction(mode, work) {
    const next = pending.then(async () => {
      const working = structuredClone(data);
      const result = await work({
        get: async key => structuredClone(working.get(key)),
        getAll: async () => structuredClone([...working.values()]),
        put: async record => { if (mode !== 'readwrite') throw new Error('readonly'); working.set(record.key, structuredClone(record)); },
      });
      if (mode === 'readwrite') data = working;
      return result;
    });
    pending = next.catch(() => {});
    return next;
  } };
}
const options = { now: () => '2026-11-15T00:00:00.000Z' };
const create = () => createLocalLibrary(memoryDriver(), options);

test('creates and reads a local library without any network or login adapter', async () => {
  const library = create();
  const record = await library.save('songs', 'one', { title: 'Test', sections: [] }, { expectedRevision: 0 });
  assert.equal(record.revision, 1);
  assert.equal((await library.get('songs', 'one')).document.title, 'Test');
  assert.equal(await library.get('songs', 'missing'), null);
});
test('reads and writes isolate mutable caller objects', async () => {
  const library = create();
  const source = { slides: [{ content: 'Original' }] };
  await library.save('presentations', 'one', source, { expectedRevision: 0 });
  source.slides[0].content = 'Changed';
  const result = await library.get('presentations', 'one');
  result.document.slides[0].content = 'Also changed';
  assert.equal((await library.get('presentations', 'one')).document.slides[0].content, 'Original');
});
test('rejects missing revision and stale edits without losing saved content', async () => {
  const library = create();
  await assert.rejects(library.save('songs', 'one', {}), /revision/i);
  await library.save('songs', 'one', { title: 'First' }, { expectedRevision: 0 });
  await assert.rejects(library.save('songs', 'one', { title: 'Stale' }, { expectedRevision: 0 }), RevisionConflictError);
  assert.equal((await library.get('songs', 'one')).document.title, 'First');
});
test('serialized simultaneous editors produce one winner and one explicit conflict', async () => {
  const driver = memoryDriver();
  const a = createLocalLibrary(driver, options), b = createLocalLibrary(driver, options);
  const results = await Promise.allSettled([
    a.save('songs', 'same', { title: 'A' }, { expectedRevision: 0 }),
    b.save('songs', 'same', { title: 'B' }, { expectedRevision: 0 }),
  ]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(results.filter(r => r.status === 'rejected' && r.reason instanceof RevisionConflictError).length, 1);
});
test('soft delete retains document and requires explicit restore', async () => {
  const library = create();
  await library.save('songs', 'one', { title: 'Recover me' }, { expectedRevision: 0 });
  await library.setDeleted('songs', 'one', true, { expectedRevision: 1 });
  assert.equal(await library.get('songs', 'one'), null);
  assert.deepEqual(await library.list('songs'), []);
  assert.equal((await library.list('songs', { includeDeleted: true }))[0].document.title, 'Recover me');
  await assert.rejects(library.save('songs', 'one', {}, { expectedRevision: 2 }), /restore/i);
  const restored = await library.setDeleted('songs', 'one', false, { expectedRevision: 2 });
  assert.equal(restored.revision, 3);
  assert.equal((await library.get('songs', 'one')).document.title, 'Recover me');
});
test('collection IDs cannot collide and lists are collection-scoped', async () => {
  const library = create();
  await library.save('songs', 'same', { title: 'Song' }, { expectedRevision: 0 });
  await library.save('presentations', 'same', { title: 'Set' }, { expectedRevision: 0 });
  assert.equal((await library.list('songs')).length, 1);
  assert.equal((await library.get('presentations', 'same')).document.title, 'Set');
});
test('rejects invalid identifiers, mismatched IDs and lossy document values', async () => {
  const library = create();
  const invalid = [undefined, null, [], { value: Infinity }, { value: undefined }, { value: new Date() }];
  const cycle = {}; cycle.self = cycle; invalid.push(cycle);
  for (const doc of invalid) await assert.rejects(library.save('songs', 'one', doc, { expectedRevision: 0 }));
  await assert.rejects(library.save('unknown', 'one', {}, { expectedRevision: 0 }));
  await assert.rejects(library.save('songs', '', {}, { expectedRevision: 0 }));
  await assert.rejects(library.save('songs', 'one', { id: 'another' }, { expectedRevision: 0 }));
  await assert.rejects(library.save('songs', 'one', { huge: 'x'.repeat(2 * 1024 * 1024) }, { expectedRevision: 0 }));
  assert.deepEqual(await library.list('songs'), []);
});
test('storage failure surfaces rather than claiming save success', async () => {
  const library = createLocalLibrary({ transaction: async () => { throw new Error('Quota exceeded'); } });
  await assert.rejects(library.save('songs', 'one', {}, { expectedRevision: 0 }), /Quota/);
});
test('unavailable IndexedDB fails explicitly without falling back to cloud', async () => {
  await assert.rejects(openLocalLibraryDatabase({ indexedDB: null }), /unavailable/);
});

test('rejects revision overflow and values that JSON would silently reshape', async () => {
  const library = create();
  await assert.rejects(library.save('songs', 'one', {}, { expectedRevision: Number.MAX_SAFE_INTEGER }));
  await assert.rejects(library.save('songs', 'one', { holes: Array(2) }, { expectedRevision: 0 }));
  await assert.rejects(library.save('songs', 'one', { [Symbol('hidden')]: 'value' }, { expectedRevision: 0 }));
});


test('backup round trip preserves documents, revisions and recoverable deletions', async () => {
  const source = create();
  await source.save('songs', 'one', { title: 'Original', customMetadata: { arrangement: ['verse', 'chorus'] } }, { expectedRevision: 0 });
  await source.save('presentations', 'two', { slides: [{ content: 'Lyrics', background_image: 'https://example.invalid/media.png' }] }, { expectedRevision: 0 });
  await source.setDeleted('songs', 'one', true, { expectedRevision: 1 });
  const text = await source.exportBackup();
  const preview = inspectLocalLibraryBackup(text);
  assert.equal(preview.includesMediaBytes, false);
  assert.equal(preview.collections.songs.deleted, 1);
  assert.equal(preview.totalRecords, 2);
  const restored = create();
  await restored.restoreIntoEmptyLibrary(text);
  assert.deepEqual(await restored.list('songs', { includeDeleted: true }), await source.list('songs', { includeDeleted: true }));
  assert.deepEqual(await restored.list('presentations'), await source.list('presentations'));
});
test('restore never overwrites existing records, even when only tombstones remain', async () => {
  const library = create();
  await library.save('songs', 'one', { title: 'Keep me' }, { expectedRevision: 0 });
  const text = await library.exportBackup();
  await assert.rejects(library.restoreIntoEmptyLibrary(text), /empty local library/);
  await library.setDeleted('songs', 'one', true, { expectedRevision: 1 });
  await assert.rejects(library.restoreIntoEmptyLibrary(text), /empty local library/);
  assert.equal((await library.list('songs', { includeDeleted: true }))[0].revision, 2);
});
test('restore rejects bad format, newer schema, duplicate IDs and corrupt records before writing', async () => {
  const source = create();
  await source.save('songs', 'one', { title: 'Test' }, { expectedRevision: 0 });
  const base = JSON.parse(await source.exportBackup());
  const cases = ['not json', JSON.stringify({ ...base, version: 2 }), JSON.stringify({ ...base, scope: 'full-media' }), JSON.stringify({ ...base, records: [...base.records, ...base.records] })];
  for (const mutate of [r => { r.key = 'wrong'; }, r => { r.document.id = 'wrong'; }, r => { r.revision = 0; }, r => { r.deleted = 'yes'; }]) {
    const copy = structuredClone(base); mutate(copy.records[0]); cases.push(JSON.stringify(copy));
  }
  for (const text of cases) {
    const destination = create();
    await assert.rejects(destination.restoreIntoEmptyLibrary(text));
    assert.deepEqual(await destination.list('songs'), []);
  }
});
test('restore storage failure rolls back the entire import', async () => {
  const source = create();
  await source.save('songs', 'one', {}, { expectedRevision: 0 });
  await source.save('songs', 'two', {}, { expectedRevision: 0 });
  const driver = memoryDriver();
  let writes = 0;
  const failingDriver = { transaction: (mode, work) => driver.transaction(mode, tx => work({ ...tx, put: async value => {
    if (++writes === 2) throw new Error('Synthetic quota failure');
    return tx.put(value);
  } })) };
  const destination = createLocalLibrary(failingDriver);
  await assert.rejects(destination.restoreIntoEmptyLibrary(await source.exportBackup()), /quota/);
  assert.deepEqual(await destination.list('songs'), []);
});


test('conflicting local edits can be recovered as a new song without touching the winner', async () => {
  const library = create();
  const initial = await library.save('songs', 'original', { title: 'Song', artist: '', sections: [{ lyrics: 'Start' }] }, { expectedRevision: 0 });
  const draft = songEditorDraft(initial); draft.sections[0].lyrics = 'My unsaved work';
  await library.save('songs', 'original', { title: 'Newer edit', sections: [{ lyrics: 'Other editor' }] }, { expectedRevision: 1 });
  await assert.rejects(library.save('songs', 'original', { ...initial.document, ...draft }, { expectedRevision: 1 }), RevisionConflictError);
  await library.save('songs', 'recovery-copy', newSongDocumentFromDraft(draft, initial.document), { expectedRevision: 0 });
  assert.equal((await library.get('songs', 'original')).document.sections[0].lyrics, 'Other editor');
  assert.equal((await library.get('songs', 'recovery-copy')).document.sections[0].lyrics, 'My unsaved work');
});
