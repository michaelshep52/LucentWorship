import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSongRehearsal, parseSectionOrder, rehearsalTransition } from '../src/lib/local-library/song-presentation.js';
const song = () => ({ title: 'Synthetic song', sections: [{ id: 'v1', label: 'Verse', lyrics: 'Verse words' }, { id: 'c1', label: 'Chorus', lyrics: 'Chorus words' }] });

test('human section order supports repeats and defaults to listed sections', () => {
  assert.deepEqual(parseSectionOrder('', 2), [0,1]);
  assert.deepEqual(parseSectionOrder('1, 2,1,2', 2), [0,1,0,1]);
});
test('invalid and out-of-range section orders are refused', () => {
  for (const value of ['0', '3', '1,,2', '1.5', '-1', '1,', 'foo']) assert.throws(() => parseSectionOrder(value,2));
  assert.throws(() => parseSectionOrder('',0));
  assert.throws(() => parseSectionOrder(Array(1002).fill('1').join(','),2));
});
test('rehearsal keeps explicit repeat order with unique slide identities', () => {
  const source = song();
  const output = buildSongRehearsal(source, [0,1,0,1]);
  assert.deepEqual(output.slides.map(s => s.content), ['Verse words','Chorus words','Verse words','Chorus words']);
  assert.equal(new Set(output.slides.map(s => s.id)).size,4);
  assert.equal(output.scope,'text-only-rehearsal');
  output.slides[0].content = 'Changed';
  assert.equal(source.sections[0].lyrics,'Verse words');
});
test('long lyrics are paginated without dropping words', () => {
  const source = song();source.sections[0].lyrics = Array(100).fill('words').join(' ');
  const output = buildSongRehearsal(source,[0]);
  assert.ok(output.slides.length > 1);
  assert.ok(output.slides.every(s => s.content.length <= 180));
  assert.equal(output.slides.map(s => s.content).join(' ').replace(/\s+/g,' '),source.sections[0].lyrics);
});
test('missing, empty or invalid selected sections do not produce misleading output', () => {
  assert.throws(() => buildSongRehearsal(song(),[2]));
  const empty = song();empty.sections[0].lyrics = '   ';
  assert.throws(() => buildSongRehearsal(empty,[0]),/no lyrics/);
  assert.equal(buildSongRehearsal(empty,[1]).slides.length,1);
  assert.throws(() => buildSongRehearsal(song(),[]));
});
test('rehearsal movement clamps bounds and blanking retains slide position', () => {
  assert.deepEqual(rehearsalTransition({ index:0,blank:false },'previous',2),{ index:0,blank:false });
  assert.deepEqual(rehearsalTransition({ index:1,blank:false },'next',2),{ index:1,blank:false });
  assert.deepEqual(rehearsalTransition({ index:1,blank:false },'blank',2),{ index:1,blank:true });
  assert.deepEqual(rehearsalTransition({ index:1,blank:true },'unblank',2),{ index:1,blank:false });
  assert.deepEqual(rehearsalTransition({ index:1,blank:false },'next',0),{ index:0,blank:true });
});


test('navigating a blanked rehearsal never reveals output, including at boundaries', () => {
  let state={index:0,blank:true};
  state=rehearsalTransition(state,'next',3);
  assert.deepEqual(state,{index:1,blank:true});
  state=rehearsalTransition(state,'previous',3);
  assert.deepEqual(state,{index:0,blank:true});
  assert.deepEqual(rehearsalTransition(state,'previous',3),state);
  assert.deepEqual(rehearsalTransition({index:2,blank:true},'next',3),{index:2,blank:true});
  assert.deepEqual(rehearsalTransition(state,'unblank',3),{index:0,blank:false});
  assert.deepEqual(rehearsalTransition(state,'blank',3),{index:0,blank:false});
});
