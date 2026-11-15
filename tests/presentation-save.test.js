import test from 'node:test';
import assert from 'node:assert/strict';
import { createPresentationSaveGuard, protectPendingSave } from '../src/lib/presentation-save.js';
test('two Save buttons cannot issue overlapping requests before React rerenders', async () => {
  const guard=createPresentationSaveGuard();let finish;let calls=0;
  const pending=guard.run(()=>{calls++;return new Promise(resolve=>{finish=resolve;});});
  assert.deepEqual(await guard.run(()=>{calls++;}),{status:'busy'});
  assert.equal(calls,1);finish('id');
  assert.deepEqual(await pending,{status:'saved',value:'id'});
  assert.equal((await guard.run(()=> 'next')).value,'next');
});
test('rejection is uncertain, never auto-retried, and releases the save lock', async () => {
  const guard=createPresentationSaveGuard();let calls=0;
  assert.deepEqual(await guard.run(async()=>{calls++;throw new Error('network');}),{status:'uncertain'});
  assert.equal(calls,1);
  assert.equal((await guard.run(()=> 'manual')).status,'saved');
});
test('synchronous validation/clone failure also releases the lock', async () => {
  const guard=createPresentationSaveGuard();
  assert.equal((await guard.run(()=>{throw new Error('invalid');})).status,'uncertain');
  assert.equal((await guard.run(()=>null)).status,'saved');
});


test('pending-save leave guard tracks the synchronous lock and releases on rejection', async () => {
  const guard=createPresentationSaveGuard();let reject;
  const event={prevented:0,returnValue:undefined,preventDefault(){this.prevented++;}};
  protectPendingSave(event,guard.isSaving());assert.equal(event.prevented,0);
  const pending=guard.run(()=>new Promise((_,fail)=>{reject=fail;}));
  assert.equal(guard.isSaving(),true);
  protectPendingSave(event,guard.isSaving());assert.equal(event.prevented,1);assert.equal(event.returnValue,'');
  reject(new Error('network'));await pending;
  assert.equal(guard.isSaving(),false);
  protectPendingSave(event,guard.isSaving());assert.equal(event.prevented,1);
});
