import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { localRoute } from '../src/lib/local-route.js';
test('local preview and audience trailing slashes do not select the cloud application', () => {
  for (const suffix of ['', '/', '//']) {
    assert.equal(localRoute('/local-library'+suffix),'library');
    assert.equal(localRoute('/local-audience'+suffix),'audience');
  }
});
test('unrelated routes retain existing app routing', () => {
  for (const path of ['/', '/LiveMode', '/local-library-old','/local-audience/other',null]) assert.equal(localRoute(path),null);
});
test('audience loader and black fallback share the normalized route decision', () => {
  const source=readFileSync(new URL('../src/main.jsx',import.meta.url),'utf8');
  assert.equal((source.match(/route === 'audience'/g)||[]).length,2);
  assert.match(source,/localRoute\(window.location.pathname\)/);
});
