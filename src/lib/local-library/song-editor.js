/** Preserve imported metadata/arrangement fields while editing known song fields. */
export function songEditorDraft(record = null) {
  const doc = record?.document ?? { title: '', artist: '', sections: [{ type: 'verse', label: 'Verse 1', lyrics: '' }] };
  if (typeof doc.title !== 'string' || (doc.artist !== undefined && typeof doc.artist !== 'string') || !Array.isArray(doc.sections) || doc.sections.some(section => !section || typeof section !== 'object' || Array.isArray(section) || typeof section.lyrics !== 'string' || (section.label !== undefined && typeof section.label !== 'string'))) {
    throw new Error('This song has an unsupported structure. It is preserved in your library and backup; this editor will not rewrite it.');
  }
  return { title: doc.title, artist: doc.artist || '', sections: structuredClone(doc.sections) };
}
export function songDocumentFromDraft(draft, original = {}) {
  if (typeof draft.title !== 'string' || !draft.title.trim()) throw new Error('Give this song a title before saving.');
  if (typeof draft.artist !== 'string' || !Array.isArray(draft.sections) || !draft.sections.length) throw new Error('Add at least one song section.');
  for (const section of draft.sections) {
    if (!section || typeof section !== 'object' || typeof section.lyrics !== 'string' || (section.label !== undefined && typeof section.label !== 'string')) throw new Error('Each section needs valid lyrics and a label.');
  }
  return { ...structuredClone(original), title: draft.title.trim(), artist: draft.artist.trim(), sections: structuredClone(draft.sections) };
}

/** Copy is explicit: retain content/metadata, but never reuse the original ID. */
export function newSongDocumentFromDraft(draft, original = {}) {
  /** @type {ReturnType<typeof songDocumentFromDraft> & { id?: unknown }} */
  const document = songDocumentFromDraft(draft, original);
  delete document.id;
  return document;
}
export function editorNavigationBlock({ dirty, busy }) {
  if (busy) return 'Wait for the current library operation to finish before leaving.';
  if (dirty) return 'Save your changes, save a new copy, or discard them before leaving.';
  return '';
}
