import test from 'node:test';
import assert from 'node:assert/strict';
import { paginateLyrics } from '../src/lib/presentation-slides.js';

test('invalid pagination budgets reject instead of looping or dropping lyrics', () => {
  for (const limit of [0,-1,NaN,Infinity,1.5,'180',Number.MAX_SAFE_INTEGER+1]) assert.throws(()=>paginateLyrics('Words',limit),RangeError);
  for (const text of [null,{},undefined]) assert.throws(()=>paginateLyrics(text),TypeError);
});
test('long Unicode words never split surrogate pairs or lose code points', () => {
  const source='🎵'.repeat(181);
  const pages=paginateLyrics(source);
  assert.deepEqual(pages.map(page=>Array.from(page).length),[180,1]);
  assert.equal(pages.join(''),source);
  assert.ok(pages.every(page=>page.isWellFormed()));
  assert.deepEqual(paginateLyrics('🎵🎶',1),['🎵','🎶']);
});
test('line and word budgets consistently count code points', () => {
  assert.deepEqual(paginateLyrics('🎵 🎶 🎵',3),['🎵 🎶','🎵']);
  assert.deepEqual(paginateLyrics('🎵\n🎶',3),['🎵\n🎶']);
  assert.deepEqual(paginateLyrics('first\r\nsecond',6),['first','second']);
  assert.deepEqual(paginateLyrics('   '),[]);
});
