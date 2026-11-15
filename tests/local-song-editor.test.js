import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { songEditorDraft, songDocumentFromDraft, newSongDocumentFromDraft, editorNavigationBlock } from '../src/lib/local-library/song-editor.js';

test('new local song starts with an editable verse without backend state', () => {
  const draft = songEditorDraft();
  assert.equal(draft.title, '');
  assert.equal(draft.sections[0].type, 'verse');
  assert.throws(() => songDocumentFromDraft(draft), /title/);
});
test('editing preserves section order, custom metadata and original IDs', () => {
  const document = { id: 'original', title: 'Song', ccli_number: '123', custom: { arrangement: ['v1', 'c1', 'v1'] }, sections: [{ id: 'v1', type: 'verse', label: 'Verse 1', lyrics: 'Before', chordMap: { key: 'G' } }, { id: 'c1', type: 'chorus', label: 'Chorus', lyrics: 'Chorus text' }] };
  const draft = songEditorDraft({ document });
  draft.title = ' Updated '; draft.sections[0].lyrics = 'After';
  const saved = songDocumentFromDraft(draft, document);
  assert.equal(saved.title, 'Updated');
  assert.equal(saved.id, 'original');
  assert.equal(saved.ccli_number, '123');
  assert.deepEqual(saved.custom, document.custom);
  assert.deepEqual(saved.sections.map(s => s.id), ['v1', 'c1']);
  assert.equal(saved.sections[0].chordMap.key, 'G');
  assert.equal(document.sections[0].lyrics, 'Before');
});
test('unsupported song structures are refused rather than silently rewritten', () => {
  for (const document of [{ title: 42, sections: [] }, { title: 'Song', sections: 'lyrics' }, { title: 'Song', sections: [null] }, { title: 'Song', sections: [{ lyrics: 42 }] }]) assert.throws(() => songEditorDraft({ document }), /preserved/);
});
test('song save validates title and sections', () => {
  for (const draft of [{ title: ' ', artist: '', sections: [] }, { title: 'T', artist: '', sections: [] }, { title: 'T', artist: '', sections: [{ lyrics: null }] }]) assert.throws(() => songDocumentFromDraft(draft));
});
test('local entry stays opt-in and has no Supabase or auth imports', () => {
  const main = readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf8');
  assert.match(main, /React\.lazy/);
  assert.match(main, /React\.Suspense/);
  const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');
  assert.doesNotMatch(css, /https?:\/\//);
  assert.match(main, /localRoute\(window.location.pathname\)/);
  assert.match(main, /route === 'library'/);
  assert.doesNotMatch(main, /import App from/);
  const local = readFileSync(new URL('../src/pages/LocalLibrary.jsx', import.meta.url), 'utf8');
  assert.doesNotMatch(local, /import .*?(supabase|AuthContext|api\/entities)/i);
});


test('explicit save-as-copy strips only root identity and preserves unsaved content', () => {
  const original = { id: 'old', title: 'Original', artist: '', arrangement: ['v1'], sections: [{ id: 'v1', lyrics: 'Original lyric' }] };
  const draft = songEditorDraft({ document: original }); draft.sections[0].lyrics = 'Unsaved work';
  const copy = newSongDocumentFromDraft(draft, original);
  assert.equal(Object.hasOwn(copy, 'id'), false);
  assert.equal(copy.sections[0].id, 'v1');
  assert.equal(copy.sections[0].lyrics, 'Unsaved work');
  assert.deepEqual(copy.arrangement, ['v1']);
  assert.equal(original.sections[0].lyrics, 'Original lyric');
});
test('leaving via app link is blocked during work or while edits are unsaved', () => {
  assert.match(editorNavigationBlock({ dirty: false, busy: true }), /Wait/);
  assert.match(editorNavigationBlock({ dirty: true, busy: false }), /Save/);
  assert.equal(editorNavigationBlock({ dirty: false, busy: false }), '');
});
