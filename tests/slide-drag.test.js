import test from 'node:test';
import assert from 'node:assert/strict';
import { beginSlideDrag, finishSlideDrag } from '../src/lib/slide-drag.js';
const doc=()=>({id:'p',slides:'abcde'.split('').map(id=>({id,content:id}))});
function drag(d,selected,from,to) { const id=d.slides[from].id; return finishSlideDrag(d,beginSlideDrag(d,selected,from,id),from,to,id); }
test('single drag reaches both ends without mutation',()=>{
 const d=doc(); assert.equal(drag(d,[1],1,4).slides.map(s=>s.id).join(''),'acdeb');
 assert.equal(drag(d,[3],3,0).slides.map(s=>s.id).join(''),'dabce');
 assert.equal(d.slides.map(s=>s.id).join(''),'abcde');
});
test('multi drag reaches end and retains relative order, focus and all slides',()=>{
 const d=doc(); const result=drag(d,[1,2],1,4);
 assert.equal(result.slides.map(s=>s.id).join(''),'adebc');
 assert.deepEqual(result.selectedIndices,[3,4]);assert.equal(result.focusedIndex,3);
 assert.equal(new Set(result.slides).size,5);
 assert.equal(drag(d,[1,3],3,0).slides.map(s=>s.id).join(''),'bdace');
});
test('unselected dragged slide does not move unrelated selection',()=>{
 assert.equal(drag(doc(),[1,2],4,0).slides.map(s=>s.id).join(''),'eabcd');
});
test('changed document, stale identity or destination rejects without overwriting edits',()=>{
 const d=doc(); const snapshot=beginSlideDrag(d,[1],1,'b'); d.slides[1].content='new lyric';
 assert.throws(()=>finishSlideDrag(d,snapshot,1,2,'b'));assert.equal(d.slides[1].content,'new lyric');
 for(const to of [-1,5,1.5,NaN]) assert.throws(()=>drag(doc(),[1],1,to));
 assert.throws(()=>beginSlideDrag(doc(),[9,1],1,'b'));
 assert.throws(()=>beginSlideDrag(doc(),[1],1,'wrong'));
 assert.throws(()=>finishSlideDrag(doc(),null,1,2,'b'));
});
test('no-op drag does not request a save',()=>{assert.equal(drag(doc(),[1,2],1,1).changed,false);});
