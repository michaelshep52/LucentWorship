import test from 'node:test';
import assert from 'node:assert/strict';
import { getBuilderCommand } from '../src/lib/builder-shortcuts.js';
test('builder shortcuts recognize deliberate delete, duplicate and move commands',()=>{
  for(const key of ['Backspace','Delete']) assert.equal(getBuilderCommand({key}),'delete');
  assert.equal(getBuilderCommand({key:'d',metaKey:true}),'duplicate');
  assert.equal(getBuilderCommand({key:'D',ctrlKey:true}),'duplicate');
  assert.equal(getBuilderCommand({key:'ArrowUp',ctrlKey:true}),'move-up');
  assert.equal(getBuilderCommand({key:'ArrowDown',metaKey:true}),'move-down');
});
test('held keys, composition, handled events and other modifier chords cannot delete slides',()=>{
  for(const flag of ['repeat','isComposing','defaultPrevented','altKey','shiftKey','metaKey','ctrlKey']) assert.equal(getBuilderCommand({key:'Delete',[flag]:true}),null);
  assert.equal(getBuilderCommand({key:'ArrowDown'}),null);
});
test('typing and focused controls/dialogs never trigger builder commands',()=>{
  assert.equal(getBuilderCommand({key:'Backspace',target:{isContentEditable:true}}),null);
  let selector;
  assert.equal(getBuilderCommand({key:'Delete',target:{closest:value=>{selector=value;return {};}}}),null);
  for(const token of ['input','button','[role="dialog"]','[role="textbox"]']) assert.ok(selector.includes(token));
  assert.equal(getBuilderCommand({key:'Delete',target:{closest:()=>null}}),'delete');
});
