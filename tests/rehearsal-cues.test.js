import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { rehearsalCues } from '../src/lib/local-library/song-presentation.js';
import { audienceMessage } from '../src/lib/audience-protocol.js';
const slides=[{content:'Verse',section_label:'Verse 1'},{content:'Chorus',section_label:'Chorus'}];
test('operator can inspect selected and upcoming lyrics without mutating slides',()=>{
 const cues=rehearsalCues(slides,0);
 assert.deepEqual(cues,{current:{number:1,label:'Verse 1',content:'Verse'},next:{number:2,label:'Chorus',content:'Chorus'}});
 cues.current.content='edit'; assert.equal(slides[0].content,'Verse');
 assert.equal(rehearsalCues(slides,1).next,null);
});
test('invalid selection has no misleading cue',()=>{
 for(const i of [-1,2,0.5,NaN]) assert.deepEqual(rehearsalCues(slides,i),{current:null,next:null});
 assert.deepEqual(rehearsalCues([],0),{current:null,next:null});
});
test('operator cues do not change the blanked audience message or enter audience rendering',()=>{
 const cues=rehearsalCues(slides,0);
 assert.equal(audienceMessage('s',1,{content:cues.current.content,blank:true}).content,'');
 const operator=readFileSync(new URL('../src/components/LocalRehearsal.jsx',import.meta.url),'utf8');
 const audience=readFileSync(new URL('../src/pages/LocalAudience.jsx',import.meta.url),'utf8');
 assert.match(operator,/aria-label="Operator-only lyric cues"/);
 assert.doesNotMatch(audience,/rehearsalCues|Up next|Selected cue/);
});
