/** Compare editable document content, not selection or request state. */
export function presentationDraftKey({ title = '', status = 'draft', date = '', slides = [] } = {}) {
  return JSON.stringify({ title, status, date: date || '', slides });
}
export function presentationLeaveReason({ saving, dirty, uncertain = false }) {
  if (saving) return 'Wait for the current save to finish before leaving.';
  if (uncertain) return 'The last save is unconfirmed. Verify the library and explicitly save your retained draft before leaving.';
  if (dirty) return 'Save your presentation before leaving. Your unsaved edits are still here.';
  return '';
}
