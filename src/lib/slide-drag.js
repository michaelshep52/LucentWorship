/** Capture the exact document and selection; never apply a drag to changed content. */
export function beginSlideDrag(document, indices, from, draggableId) {
  const slides = document?.slides;
  if (!Array.isArray(slides) || !Number.isInteger(from) || from < 0 || from >= slides.length) throw new Error('The dragged slide changed. Start the drag again.');
  const ids = slides.map((slide, index) => slide?.id || String(index));
  if (ids[from] !== draggableId || new Set(ids).size !== ids.length) throw new Error('The dragged slide identity is ambiguous.');
  const selected = [...new Set(indices.includes(from) ? indices : [from])].sort((a,b)=>a-b);
  if (selected.some(i=>!Number.isInteger(i)||i<0||i>=slides.length||!slides[i]||typeof slides[i]!=='object')) throw new Error('The slide selection changed. Select it again.');
  return { documentKey: JSON.stringify(document), selected, from, draggableId };
}

/** Destination is the final index of the dragged slide, clamped to fit its selection block. */
export function finishSlideDrag(document, snapshot, from, to, draggableId) {
  if (!snapshot || snapshot.documentKey !== JSON.stringify(document) || snapshot.from !== from || snapshot.draggableId !== draggableId) throw new Error('The presentation changed during the drag. Nothing was moved; try again.');
  const slides = document.slides;
  if (!Number.isInteger(to) || to < 0 || to >= slides.length) throw new Error('Invalid slide drop destination.');
  if (from === to) return { slides, selectedIndices: snapshot.selected, focusedIndex: from, changed: false };
  const selected = new Set(snapshot.selected);
  const moving = snapshot.selected.map(i=>slides[i]);
  const remaining = slides.filter((_,i)=>!selected.has(i));
  const offset = snapshot.selected.indexOf(from);
  const insertAt = Math.max(0, Math.min(to - offset, remaining.length));
  const result = [...remaining.slice(0,insertAt), ...moving, ...remaining.slice(insertAt)];
  return { slides: result, selectedIndices: moving.map((_,i)=>insertAt+i), focusedIndex: insertAt+offset, changed: result.some((slide,i)=>slide!==slides[i]) };
}
