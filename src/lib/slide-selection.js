/** Duplicate selected originals in place, never fabricating a slide from a stale index. */
export function duplicateSlideSelection(slides, indices, createId = () => crypto.randomUUID()) {
  if (!Array.isArray(slides) || !Array.isArray(indices) || !indices.length) throw new Error('Select an existing slide to duplicate.');
  const selected = [...new Set(indices)].sort((a,b)=>a-b);
  if (selected.some(i=>!Number.isInteger(i)||i<0||i>=slides.length||!slides[i]||typeof slides[i]!=='object'||Array.isArray(slides[i]))) throw new Error('The slide selection changed. Select the slides again.');
  const used = new Set(slides.map(slide=>slide?.id));
  const result = [...slides];
  const newIndices = [];
  for (const [offset,index] of selected.entries()) {
    const id = createId();
    if (typeof id !== 'string' || !id || used.has(id)) throw new Error('A unique slide ID could not be created. Try again.');
    used.add(id);
    const clone = { ...structuredClone(slides[index]), id };
    const insertAt = index + offset + 1;
    result.splice(insertAt,0,clone);
    newIndices.push(insertAt);
  }
  return { slides: result, selectedIndices: newIndices };
}

/** Move valid selections one position; boundary moves are an explicit no-op. */
export function moveSlideSelection(slides, indices, direction, focusedIndex) {
  if (!Array.isArray(slides) || !Array.isArray(indices) || !indices.length) throw new Error('Select an existing slide to move.');
  if (direction !== -1 && direction !== 1) throw new Error('Invalid slide move direction.');
  const selected = [...new Set(indices)].sort((a, b) => a - b);
  if (selected.some(i => !Number.isInteger(i) || i < 0 || i >= slides.length || !slides[i] || typeof slides[i] !== 'object' || Array.isArray(slides[i]))) throw new Error('The slide selection changed. Select the slides again.');
  const focus = selected.includes(focusedIndex) ? focusedIndex : selected[0];
  if (selected[0] + direction < 0 || selected[selected.length - 1] + direction >= slides.length) {
    return { slides, selectedIndices: selected, focusedIndex: focus, changed: false };
  }
  const result = [...slides];
  const ordered = direction === -1 ? selected : [...selected].reverse();
  for (const index of ordered) [result[index], result[index + direction]] = [result[index + direction], result[index]];
  return { slides: result, selectedIndices: selected.map(i => i + direction), focusedIndex: focus + direction, changed: true };
}
