import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = path => readFileSync(new URL('../src/'+path,import.meta.url),'utf8');
test('presentation slide Save Changes is wired to the existing guarded save UI', () => {
  const page=source('pages/PresentationEditor.jsx');
  assert.match(page, /onSave=\{handleSave\}/);
  assert.match(page, /saveDisabled=\{saving \|\| !title\}/);
  const editor=source('components/presentation/SlideEditor.jsx');
  assert.match(editor, /onClick=\{onSave\} disabled=\{saveDisabled\}/);
});
test('media error target and file reference use the actual DOM element contracts', () => {
  assert.match(source('pages/Media.jsx'),/e\.currentTarget\.style\.display/);
  assert.match(source('pages/MediaLibrary.jsx'),/HTMLInputElement \| null/);
});

test('pending save disables the editor and registers/removes the leave warning', () => {
  const page=source('pages/PresentationEditor.jsx');
  assert.match(page, /<fieldset disabled=\{saving\}/);
  assert.match(page, /<Select disabled=\{saving\}/);
  assert.match(page, /addEventListener\('beforeunload', protect\)/);
  assert.match(page, /removeEventListener\('beforeunload', protect\)/);
  assert.match(page, /onClickCapture=/);
});

test('editor uses cancelable validated loading and refuses editing under a different ID', () => {
  const page=source('pages/PresentationEditor.jsx');
  assert.match(page,/return loadLivePresentation\(presId/);
  assert.match(page,/loading \|\| loadedId !== presId/);
  assert.match(page,/Retry loading/);
  assert.doesNotMatch(page,/Presentation.filter\(\{ id: presId \}\).then/);
});

test('actual routed builder uses cancellable ID-checked loading and retry UI', () => {
  const app=source('App.jsx');
  assert.match(app,/path="\/presentations\/:id" element=\{<PresentationBuilder \/>\}/);
  const builder=source('pages/PresentationBuilder.jsx');
  assert.match(builder,/return loadLivePresentation\(id/);
  assert.match(builder,/String\(presentation.id\) !== String\(id\)/);
  assert.match(builder,/Retry loading/);
  assert.doesNotMatch(builder,/async function loadPresentation/);
});
test('actual routed builder uses snapshot queue and explicit buttons resume paused saving', () => {
  const builder=source('pages/PresentationBuilder.jsx');
  assert.match(builder,/createSnapshotSaveQueue\(/);
  assert.match(builder,/write: snapshot => Presentation.update\(id, snapshot\)/);
  assert.match(builder,/queue.dispose\(\)/);
  assert.match(builder,/onClick=\{\(\) => save\(undefined, true\)\}/);
  assert.match(builder,/onSave=\{\(\) => save\(undefined, true\)\}/);
  assert.match(builder,/save\(updated\)/);
  assert.match(builder,/autosave is paused/);
});

test('actual builder protects its Back/Go Live actions and browser leave warning', () => {
  const builder=source('pages/PresentationBuilder.jsx');
  assert.match(builder,/navigateFromBuilder\("\/presentations"\)/);
  assert.match(builder,/navigateFromBuilder\(`\/live\?presentation=/);
  assert.match(builder,/queue.hasUnconfirmedWork\(\)/);
  assert.match(builder,/addEventListener\('beforeunload', protect\)/);
  assert.match(builder,/removeEventListener\('beforeunload', protect\)/);
});
test('actual layout sidebar and Live link consult the builder leave guard', () => {
  const layout=source('components/Layout.jsx');
  assert.match(layout,/<Outlet context=\{navigation\}/);
  assert.equal((layout.match(/onClick=\{navigation.handleLinkClick\}/g)||[]).length,2);
  const builder=source('pages/PresentationBuilder.jsx');
  assert.match(builder,/useOutletContext\(\)/);
  assert.match(builder,/navigation\?\.registerLeaveGuard/);
});
test('routed builder suppresses destructive shortcuts during picker and stale-route states',()=>{
  const builder=source('pages/PresentationBuilder.jsx');
  assert.match(builder,/getBuilderCommand\(e\)/);
  assert.match(builder,/!presentation \|\| picker \|\| String\(presentation.id\) !== String\(id\)/);
  assert.match(builder,/selectedSlides, picker, id\]/);
});
test('active builder single and multi duplicate actions use validated deep copies',()=>{
  const builder=source('pages/PresentationBuilder.jsx');
  assert.match(builder,/duplicateSlideSelection\(presentation.slides \|\| \[\], indices\)/);
  assert.match(builder,/function duplicateSlide\(index\) \{ duplicateIndices\(\[index\]\); \}/);
  assert.match(builder,/function duplicateSelectedSlides\(\) \{ duplicateIndices\(\[...selectedSlides\]\); \}/);
});
test('active builder single/multi deletion and explicit undo use snapshot recovery',()=>{
  const builder=source('pages/PresentationBuilder.jsx');
  assert.match(builder,/deleteSlidesWithUndo\(presentation, indices\)/);
  assert.match(builder,/function deleteSelectedSlides\(\) \{ deleteIndices\(\[...selectedSlides\]\); \}/);
  assert.match(builder,/undoSlideDeletion\(presentation, deletionUndo\)/);
  assert.match(builder,/disabled=\{!canUndoSlideDeletion\(presentation, deletionUndo\)\}/);
});
test('active builder single and multi move paths validate selections before save',()=>{
  const builder=source('pages/PresentationBuilder.jsx');
  assert.match(builder,/moveSlideSelection\(presentation.slides \|\| \[\], indices, dir, focus\)/);
  assert.match(builder,/if \(!result.changed\) return;/);
  assert.match(builder,/function moveSlide\(index, dir\) \{ moveIndices\(\[index\], dir, index\); \}/);
  assert.match(builder,/function moveSelectedSlides\(dir\) \{ moveIndices\(\[...selectedSlides\], dir, selectedSlide\); \}/);
});
test('actual drag handlers snapshot the document and validate drops before saving',()=>{
 const builder=source('pages/PresentationBuilder.jsx');
 assert.match(builder,/beginSlideDrag\(presentation, \[...selectedSlides\], start.source.index, start.draggableId\)/);
 assert.match(builder,/finishSlideDrag\(presentation, snapshot, result.source.index, result.destination.index, result.draggableId\)/);
 assert.match(builder,/if \(!result.destination \|\| result.reason === 'CANCEL'\) return;/);
 assert.match(builder,/if \(!moved.changed\) return;/);
});
