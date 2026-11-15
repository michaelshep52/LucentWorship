import test from 'node:test';
import assert from 'node:assert/strict';
import { deleteSlidesWithUndo, canUndoSlideDeletion, undoSlideDeletion } from '../src/lib/slide-deletion.js';
const document=()=>({id:'p',title:'Song',metadata:{x:1},slides:[{id:'a',content:'A'},{id:'b',content:'B'},{id:'c',content:'C'}]});
test('multi-delete removes each original once and restores full metadata/content',()=>{
  const source=document();const result=deleteSlidesWithUndo(source,[2,0,0]);
  assert.deepEqual(result.document.slides.map(s=>s.id),['b']);assert.equal(result.checkpoint.removedCount,2);
  assert.deepEqual(undoSlideDeletion(result.document,result.checkpoint),source);assert.equal(source.slides.length,3);
});
test('later edits or another presentation cannot be silently overwritten by undo',()=>{
  const result=deleteSlidesWithUndo(document(),[1]);
  for(const patch of [{title:'Changed'},{id:'another'},{slides:[]}]) {
    const edited={...result.document,...patch};assert.equal(canUndoSlideDeletion(edited,result.checkpoint),false);
    assert.throws(()=>undoSlideDeletion(edited,result.checkpoint));
  }
});
test('delete-all leaves valid selection and supports undo; recovery copies are independent',()=>{
  const result=deleteSlidesWithUndo(document(),[0,1,2]);assert.deepEqual(result.document.slides,[]);assert.equal(result.selectedIndex,0);
  const restored=undoSlideDeletion(result.document,result.checkpoint);restored.metadata.x=9;
  assert.equal(result.checkpoint.before.metadata.x,1);
});
test('stale, negative or empty deletion selection leaves source unchanged',()=>{
  const source=document();const before=structuredClone(source);
  for(const indices of [[],[-1],[3],[0.5],[0,99]]) assert.throws(()=>deleteSlidesWithUndo(source,indices));
  assert.deepEqual(source,before);
});
