import test from 'node:test';
import assert from 'node:assert/strict';
import { loadLivePresentation } from '../src/lib/live-presentation.js';
const flush = () => new Promise(resolve => setImmediate(resolve));
const row = id => ({ id, slides: [{ id: 'slide', type: 'text', content: 'Lyrics' }] });

test('selection clears old output before loading a valid set', async () => {
  const states = [];
  loadLivePresentation('a', async () => [row('a')], state => states.push(state));
  assert.equal(states[0].status, 'loading');
  assert.equal(states[0].presentation, null);
  await flush();
  assert.equal(states.at(-1).presentation.id, 'a');
});
test('slow previous request cannot overwrite newer selected set', async () => {
  let resolveOld;
  const states = [];
  const cancel = loadLivePresentation('old', () => new Promise(resolve => { resolveOld = resolve; }), state => states.push(state));
  await flush();
  cancel();
  loadLivePresentation('new', async () => [row('new')], state => states.push(state));
  await flush();
  resolveOld([row('old')]);
  await flush();
  assert.equal(states.at(-1).presentation.id, 'new');
  assert.equal(states.filter(s => s.status === 'ready').length, 1);
});
test('cancel prevents updates after unmount and skips an unstarted request', async () => {
  const states = [];
  let calls = 0;
  loadLivePresentation('a', async () => { calls++; return [row('a')]; }, s => states.push(s))();
  await flush();
  assert.equal(calls, 0);
  assert.equal(states.length, 1);
});
test('deselection clears output without making a backend call', async () => {
  const states = [];
  loadLivePresentation('', () => assert.fail('must not fetch'), s => states.push(s));
  await flush();
  assert.deepEqual(states, [{ status: 'idle', presentation: null, error: '' }]);
});
test('network failure clears output and produces safe actionable error', async () => {
  const states = [];
  loadLivePresentation('a', async () => { throw new Error('private diagnostic'); }, s => states.push(s));
  await flush();
  assert.equal(states.at(-1).status, 'error');
  assert.equal(states.at(-1).presentation, null);
  assert.doesNotMatch(states.at(-1).error, /private/);
});
test('missing, mismatched and malformed presentations never become live', async () => {
  for (const rows of [[], [row('wrong')], [{ id: 'a', slides: null }], [{ id: 'a', slides: [null] }]]) {
    const states = [];
    loadLivePresentation('a', async () => rows, s => states.push(s));
    await flush();
    assert.equal(states.at(-1).status, 'error');
    assert.equal(states.at(-1).presentation, null);
  }
});
test('stale rejection cannot replace a newer success', async () => {
  let rejectOld;
  const states = [];
  const cancel = loadLivePresentation('old', () => new Promise((_, reject) => { rejectOld = reject; }), s => states.push(s));
  await flush(); cancel();
  loadLivePresentation('new', async () => [row('new')], s => states.push(s));
  await flush(); rejectOld(new Error('offline')); await flush();
  assert.equal(states.at(-1).presentation.id, 'new');
});
