import test from 'node:test';
import assert from 'node:assert/strict';
import { presentationDraftKey, presentationLeaveReason } from '../src/lib/presentation-draft.js';
test('all editable presentation content participates in dirty tracking', () => {
  const clean={title:'Song',status:'draft',date:'',slides:[{content:'Verse'}]};
  const baseline=presentationDraftKey(clean);
  for (const patch of [{title:'New'},{status:'ready'},{date:'2026-11-15'},{slides:[{content:'Chorus'}]},{slides:[]}]) assert.notEqual(presentationDraftKey({...clean,...patch}),baseline);
  assert.equal(presentationDraftKey({...clean,date:undefined}),baseline);
  assert.equal(presentationDraftKey(structuredClone(clean)),baseline);
});
test('acknowledging a save snapshot cannot mark subsequent edits clean', () => {
  const draft={title:'Song',slides:[{content:'Verse'}]};
  const saved=presentationDraftKey(draft);
  draft.slides[0].content='New verse';
  assert.notEqual(presentationDraftKey(draft),saved);
});
test('explicit navigation is allowed only for clean idle drafts', () => {
  assert.equal(presentationLeaveReason({saving:false,dirty:false}),'');
  assert.match(presentationLeaveReason({saving:false,dirty:true}),/unsaved/);
  assert.match(presentationLeaveReason({saving:true,dirty:false}),/save to finish/);
});

test('unconfirmed writes block leaving even after manually reverting to the saved snapshot', () => {
  assert.match(presentationLeaveReason({saving:false,dirty:false,uncertain:true}),/unconfirmed/);
  assert.equal(presentationLeaveReason({saving:false,dirty:false,uncertain:false}),'');
});
