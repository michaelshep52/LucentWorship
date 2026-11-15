import test from 'node:test';
import assert from 'node:assert/strict';
import { createEditorNavigationGuard } from '../src/lib/editor-navigation.js';
const click=patch=>({button:0,prevented:false,preventDefault(){this.prevented=true;},...patch});
test('layout link retains dirty draft and reports reason, but allows clean editor',()=>{
  const guard=createEditorNavigationGuard();let reason='Unsaved';const notices=[];
  guard.registerLeaveGuard(()=>reason,s=>notices.push(s));const blocked=click();guard.handleLinkClick(blocked);
  assert.equal(blocked.prevented,true);assert.deepEqual(notices,['Unsaved']);
  reason='';const allowed=click();guard.handleLinkClick(allowed);assert.equal(allowed.prevented,false);
});
test('guard reads current saving/dirty state at click time',()=>{
  const guard=createEditorNavigationGuard();let pending=false;
  guard.registerLeaveGuard(()=>pending?'Saving':'',()=>{});
  pending=true;const event=click();guard.handleLinkClick(event);assert.equal(event.prevented,true);
});
test('modified clicks retain normal new-tab behavior without discarding current editor',()=>{
  const guard=createEditorNavigationGuard();guard.registerLeaveGuard(()=>assert.fail('must not check'),()=>{});
  for(const patch of [{ctrlKey:true},{metaKey:true},{shiftKey:true},{altKey:true},{button:1},{defaultPrevented:true}]) {const event=click(patch);guard.handleLinkClick(event);assert.equal(event.prevented,false);}
});
test('old route cleanup cannot remove replacement registration; current cleanup releases it',()=>{
  const guard=createEditorNavigationGuard();const old=guard.registerLeaveGuard(()=> 'Old',()=>{});
  const current=guard.registerLeaveGuard(()=> 'New',()=>{});old();
  const first=click();guard.handleLinkClick(first);assert.equal(first.prevented,true);
  current();const second=click();guard.handleLinkClick(second);assert.equal(second.prevented,false);
});
