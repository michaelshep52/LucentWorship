import test from 'node:test';
import assert from 'node:assert/strict';
import { createSnapshotSaveQueue } from '../src/lib/snapshot-save-queue.js';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function setup() {
  const writes=[],saved=[],states=[],jobs=[];
  const queue=createSnapshotSaveQueue({write:snapshot=>{writes.push(snapshot);return new Promise((resolve,reject)=>jobs.push({resolve,reject}));},onSaved:s=>saved.push(s),onState:s=>states.push(s)});
  return {queue,writes,saved,states,jobs};
}
test('autosave serializes writes and coalesces queued edits to the latest snapshot',async()=>{
  const x=setup();x.queue.request({title:'A'});x.queue.request({title:'B'});x.queue.request({title:'C'});
  assert.deepEqual(x.writes,[{title:'A'}]);
  x.jobs[0].resolve();await tick();assert.deepEqual(x.writes,[{title:'A'},{title:'C'}]);
  x.jobs[1].resolve();await tick();assert.deepEqual(x.saved,[{title:'A'},{title:'C'}]);assert.equal(x.states.at(-1),'idle');
});
test('queued snapshot is detached from subsequent caller edits',async()=>{
  const x=setup();const doc={slides:[{content:'Original'}]};x.queue.request(doc);doc.slides[0].content='Changed';
  assert.equal(x.writes[0].slides[0].content,'Original');x.jobs[0].resolve();await tick();
});
test('failure pauses all queued autosave until explicit save of latest draft',async()=>{
  const x=setup();x.queue.request({title:'A'});x.queue.request({title:'B'});
  x.jobs[0].reject(new Error('network'));await tick();assert.equal(x.states.at(-1),'paused');assert.equal(x.saved.length,0);
  x.queue.request({title:'C'});await tick();assert.equal(x.writes.length,1);
  x.queue.request({title:'D'},{explicit:true});assert.deepEqual(x.writes[1],{title:'D'});
  x.jobs[1].resolve();await tick();assert.deepEqual(x.saved,[{title:'D'}]);
});
test('route disposal suppresses completion callbacks and never sends queued work',async()=>{
  const x=setup();x.queue.request({title:'A'});x.queue.request({title:'B'});x.queue.dispose();
  x.jobs[0].resolve();await tick();assert.equal(x.writes.length,1);assert.equal(x.saved.length,0);
  assert.equal(x.queue.request({title:'C'}),false);
});
test('invalid snapshot cannot replace a valid queued draft',async()=>{
  const x=setup();x.queue.request({title:'A'});x.queue.request({title:'B'});
  assert.throws(()=>x.queue.request({fn:()=>{}}));
  x.jobs[0].resolve();await tick();assert.deepEqual(x.writes[1],{title:'B'});x.jobs[1].resolve();await tick();
});

test('navigation protection remains active across failure until explicit recovery or disposal',async()=>{
  const x=setup();assert.equal(x.queue.status(),'idle');assert.equal(x.queue.hasUnconfirmedWork(),false);
  x.queue.request({title:'A'});assert.equal(x.queue.status(),'saving');assert.equal(x.queue.hasUnconfirmedWork(),true);
  x.jobs[0].reject(new Error('uncertain'));await tick();assert.equal(x.queue.status(),'paused');assert.equal(x.queue.hasUnconfirmedWork(),true);
  x.queue.request({title:'B'},{explicit:true});x.jobs[1].resolve();await tick();
  assert.equal(x.queue.status(),'idle');assert.equal(x.queue.hasUnconfirmedWork(),false);
  x.queue.dispose();assert.equal(x.queue.status(),'closed');assert.equal(x.queue.hasUnconfirmedWork(),false);
});
