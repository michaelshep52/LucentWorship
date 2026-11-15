import test from 'node:test';
import assert from 'node:assert/strict';
import { moveSlideSelection } from '../src/lib/slide-selection.js';
const slides = () => 'abcde'.split('').map(id => ({ id, metadata: { label: id } }));
test('moving contiguous and disjoint selections preserves all slide identities and relative order', () => {
  for (const [indices, direction, expected] of [[[1,2],-1,'bcade'],[[1,2],1,'adbce'],[[1,3],-1,'badce'],[[1,3],1,'acbed']]) {
    const source = slides(); const before = structuredClone(source);
    const result = moveSlideSelection(source, indices, direction, indices[0]);
    assert.equal(result.slides.map(s=>s.id).join(''), expected);
    assert.deepEqual(result.selectedIndices, indices.map(i=>i+direction));
    assert.deepEqual(source,before);
    assert.equal(new Set(result.slides).size,source.length);
    assert.ok(result.slides.every(s=>source.includes(s)));
  }
});
test('boundary selections are no-ops without a save-worthy change', () => {
  const source = slides();
  for (const [indices,dir] of [[[0,2],-1],[[2,4],1]]) {
    const result=moveSlideSelection(source,indices,dir,indices[0]);
    assert.equal(result.changed,false); assert.equal(result.slides,source);
  }
});
test('invalid selection or direction cannot create undefined slides or mutate inputs', () => {
  const source = slides(); const before=structuredClone(source);
  for (const indices of [[],[-1],[5],[1.5],[1,9],[NaN]]) assert.throws(()=>moveSlideSelection(source,indices,1,0));
  for (const dir of [0,2,NaN,'1']) assert.throws(()=>moveSlideSelection(source,[1],dir,1));
  assert.throws(()=>moveSlideSelection([null],[0],1,0));
  assert.deepEqual(source,before);
});
test('stale focus follows a selected slide rather than unrelated content',()=>{
  const result=moveSlideSelection(slides(),[3,1,1],1,0);
  assert.deepEqual(result.selectedIndices,[2,4]); assert.equal(result.focusedIndex,2);
  assert.equal(moveSlideSelection(slides(),[1,3],-1,3).focusedIndex,2);
});
