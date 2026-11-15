import test from 'node:test';
import assert from 'node:assert/strict';
import { duplicateSlideSelection } from '../src/lib/slide-selection.js';
const slides=()=>[{id:'a',content:'A',metadata:{color:'red'}},{id:'b',content:'B'},{id:'c',content:'C'}];
test('multiple duplicates retain original ordering and select their own unique identities',()=>{
  let n=0;const source=slides();const result=duplicateSlideSelection(source,[2,0,0],()=>`copy-${++n}`);
  assert.deepEqual(result.slides.map(s=>s.content),['A','A','B','C','C']);
  assert.deepEqual(result.selectedIndices,[1,4]);assert.equal(new Set(result.slides.map(s=>s.id)).size,5);
  assert.equal(source.length,3);
});
test('duplicate metadata is independent of the source slide',()=>{
  const source=slides();const result=duplicateSlideSelection(source,[0],()=> 'new');
  result.slides[1].metadata.color='blue';assert.equal(source[0].metadata.color,'red');
});
test('empty or stale selections cannot fabricate malformed slides',()=>{
  for(const indices of [[],[3],[-1],[0.5],[0,4]]) assert.throws(()=>duplicateSlideSelection(slides(),indices));
  assert.throws(()=>duplicateSlideSelection([], [0]));
  assert.throws(()=>duplicateSlideSelection([null],[0]));
});
test('ID collisions fail without partially changing the original slides',()=>{
  const source=slides();const before=structuredClone(source);
  assert.throws(()=>duplicateSlideSelection(source,[0],()=> 'a'));
  assert.throws(()=>duplicateSlideSelection(source,[0,1],()=> 'same'));
  assert.deepEqual(source,before);
});
