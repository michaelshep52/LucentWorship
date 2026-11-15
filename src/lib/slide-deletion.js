/** In-memory one-step recovery; never undo over later content edits. */
export function deleteSlidesWithUndo(document, indices) {
  if (!document || !Array.isArray(document.slides) || !Array.isArray(indices) || !indices.length) throw new Error('Select an existing slide to delete.');
  const selected = [...new Set(indices)].sort((a,b)=>a-b);
  if (selected.some(i=>!Number.isInteger(i)||i<0||i>=document.slides.length)) throw new Error('The selection changed. Select the slides again.');
  const before = structuredClone(document);
  const removed = new Set(selected);
  const after = { ...structuredClone(document), slides: structuredClone(document.slides.filter((_,i)=>!removed.has(i))) };
  return {
    document: after,
    selectedIndex: Math.max(0,Math.min(selected[0]-1,after.slides.length-1)),
    checkpoint: { before, afterKey: JSON.stringify(after), removedCount: selected.length },
  };
}
export function canUndoSlideDeletion(document, checkpoint) {
  return Boolean(checkpoint && JSON.stringify(document) === checkpoint.afterKey);
}
export function undoSlideDeletion(document, checkpoint) {
  if (!canUndoSlideDeletion(document,checkpoint)) throw new Error('Later edits prevent this one-step undo. Nothing was overwritten.');
  return structuredClone(checkpoint.before);
}
