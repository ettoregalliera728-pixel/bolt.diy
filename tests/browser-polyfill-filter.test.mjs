Failed to create stream fd: Operation not permitted
Failed to create stream fd: Operation not permitted
Failed to create stream fd: Operation not permitted
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { needsBrowserPolyfills } from '../scripts/browser-polyfill-filter.ts';

const root = '/project/app';
test('app sources using Node globals receive browser shims', () => {
  assert.equal(needsBrowserPolyfills('Buffer.from(data)', '/project/app/example.ts', root), true);
  assert.equal(needsBrowserPolyfills('process.env.MODE', '/project/app/example.ts?client', root), true);
  assert.equal(needsBrowserPolyfills('const value = 42;', '/project/app/example.ts', root), false);
});
test('virtual bundler runtime never imports the shims that depend on it', () => {
  for (const id of ['\0rolldown/runtime.js', 'rolldown:runtime.js', '\0/project/app/generated.ts']) {
    assert.equal(needsBrowserPolyfills('global.Buffer = Buffer;', id, root), false);
  }
});
test('shim modules and unrelated dependencies are never injected into', () => {
  assert.equal(needsBrowserPolyfills('Buffer.from(data)', '/project/node_modules/vite-plugin-node-polyfills/shims/buffer/dist/index.js', root), false);
  assert.equal(needsBrowserPolyfills('process.env.MODE', '/project/node_modules/example/index.js', root), false);
  assert.equal(needsBrowserPolyfills('Buffer.from(data)', '/project/workers/app.ts', root), false);
});
test('path-browserify still receives its required process shim', () => {
  assert.equal(needsBrowserPolyfills('process.cwd()', '/project/node_modules/.pnpm/path-browserify@1/node_modules/path-browserify/index.js', root), true);
});
