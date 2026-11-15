import test from 'node:test';
import assert from 'node:assert/strict';
import { getLiveCommand, countdownDuration, createCountdownController } from '../src/lib/live-controls.js';

test('live shortcuts map navigation and presentation actions', () => {
  for (const [key, command] of [['ArrowRight','next'], [' ','next'], ['ArrowUp','previous'], ['B','blank'], ['Escape','unblank'], ['P','presenter']]) assert.equal(getLiveCommand({ key }), command);
  for (const key of ['q', '__proto__', 'constructor', 'toString']) assert.equal(getLiveCommand({ key }), null);
});
test('typing, focused controls, modifier keys, composition and repeats never trigger live commands', () => {
  for (const flag of ['defaultPrevented', 'isComposing', 'repeat', 'ctrlKey', 'metaKey', 'altKey']) assert.equal(getLiveCommand({ key: 'b', [flag]: true }), null);
  assert.equal(getLiveCommand({ key: ' ', target: { isContentEditable: true } }), null);
  assert.equal(getLiveCommand({ key: ' ', target: { closest: () => ({ tagName: 'BUTTON' }) } }), null);
});
test('countdown rejects invalid and zero durations', () => {
  for (const [m,s] of [[0,0],[-1,0],[100,0],[0,60],[1.5,0],[0,NaN],[Infinity,0],['1',0]]) assert.throws(() => countdownDuration(m,s));
  assert.equal(countdownDuration(99,59), 5999);
  assert.equal(countdownDuration(0,1), 1);
});
function clock() {
  let time = 0, next = 0;
  const callbacks = new Map(), canceled = [], events = [];
  const controller = createCountdownController({ now: () => time, schedule: cb => { callbacks.set(++next, cb); return next; }, cancel: id => canceled.push(id), onChange: (remaining,active) => events.push({ remaining,active }) });
  return { controller, callbacks, canceled, events, advance: ms => { time += ms; }, tick: id => callbacks.get(id)() };
}
test('countdown accounts for delayed callbacks instead of losing elapsed seconds', () => {
  const c = clock(); c.controller.start(0,10); c.advance(6500); c.tick(1);
  assert.deepEqual(c.events.at(-1), { remaining: 4, active: true });
  c.advance(5000); c.tick(1);
  assert.deepEqual(c.events.at(-1), { remaining: 0, active: false });
  assert.deepEqual(c.canceled, [1]);
});
test('restart cancels previous timer and ignores its queued callback', () => {
  const c = clock(); c.controller.start(1,0); c.controller.start(0,5);
  const length = c.events.length; c.tick(1);
  assert.equal(c.events.length, length);
  assert.deepEqual(c.canceled, [1]);
  c.advance(1000); c.tick(2);
  assert.equal(c.events.at(-1).remaining, 4);
});
test('stop and unmount disposal suppress queued callbacks', () => {
  const c = clock(); c.controller.start(0,5); c.controller.stop();
  const length = c.events.length; c.tick(1);
  assert.equal(c.events.length, length);
  assert.deepEqual(c.events.at(-1), { remaining: 0, active: false });
  c.controller.start(0,5); c.controller.dispose();
  const after = c.events.length; c.tick(2);
  assert.equal(c.events.length, after);
  assert.throws(() => c.controller.start(0,5), /closed/);
});
test('invalid restart does not disrupt an existing valid countdown', () => {
  const c = clock(); c.controller.start(0,5);
  assert.throws(() => c.controller.start(0,0));
  c.advance(1000); c.tick(1);
  assert.equal(c.events.at(-1).remaining, 4);
  assert.deepEqual(c.canceled, []);
});
