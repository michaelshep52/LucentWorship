import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { jumpRehearsalSlide } from '../src/lib/local-library/song-presentation.js';
import { audienceMessage } from '../src/lib/audience-protocol.js';
test('direct chorus or page jump retains explicit blanking state',()=>{
 for(const blank of [true,false]) {
  const state={index:3,blank};
  assert.deepEqual(jumpRehearsalSlide(state,1,5),{index:1,blank});
  assert.deepEqual(state,{index:3,blank});
 }
 const state=jumpRehearsalSlide({index:0,blank:true},4,5);
 assert.equal(audienceMessage('s',1,{content:'Chorus',blank:state.blank}).content,'');
});
test('invalid jumps cannot select absent slides',()=>{
 for(const index of [-1,5,1.5,NaN,Infinity,'1']) assert.throws(()=>jumpRehearsalSlide({index:0,blank:false},index,5));
 for(const count of [0,-1,NaN,1.5]) assert.throws(()=>jumpRehearsalSlide({index:0,blank:false},0,count));
});
test('local rehearsal exposes labelled direct page selection and restores keyboard focus',()=>{
 const source=readFileSync(new URL('../src/components/LocalRehearsal.jsx',import.meta.url),'utf8');
 assert.match(source,/aria-label="Jump to lyric page" value=\{state.index\} onChange=\{jumpToSlide\}/);
 assert.match(source,/jumpRehearsalSlide\(previous, index, rehearsal.slides.length\)/);
 assert.match(source,/slideRef.current\?\.focus\(\)/);
});
