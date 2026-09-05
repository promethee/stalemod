import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scanRoot } from '../src/scanner.js';
import { FakeFs, dir, file } from './fake-fs.js';

const now = new Date();
const oldDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000); // 60 days ago

test('detects a project with both node_modules and .stalemod marker', async () => {
  const fs = new FakeFs(
    dir({
      'my-project': dir({
        '.stalemod': file(0, now),
        'index.ts': file(100, oldDate),
        node_modules: dir({
          'some-dep': dir({ 'index.js': file(2048, now) }),
        }),
      }),
    }),
  );

  const results = await scanRoot('.', fs);

  assert.equal(results.length, 1);
  assert.equal(results[0].projectPath, 'my-project');
  assert.equal(results[0].sizeBytes, 2048);
});

test('ignores a project with node_modules but no marker file', async () => {
  const fs = new FakeFs(
    dir({
      'not-opted-in': dir({
        node_modules: dir({ dep: dir({ 'a.js': file(500, now) }) }),
      }),
    }),
  );

  const results = await scanRoot('.', fs);

  assert.equal(results.length, 0);
});

test('does not descend into node_modules looking for markers', async () => {
  const fs = new FakeFs(
    dir({
      project: dir({
        node_modules: dir({
          'sneaky-dep': dir({ '.stalemod': file(0, now) }),
        }),
      }),
    }),
  );

  const results = await scanRoot('.', fs);

  assert.equal(results.length, 0);
});

test('skips hidden directories (e.g. .git) when walking', async () => {
  const fs = new FakeFs(
    dir({
      '.git': dir({
        node_modules: dir({}),
        '.stalemod': file(0, now),
      }),
      'real-project': dir({
        '.stalemod': file(0, now),
        node_modules: dir({}),
      }),
    }),
  );

  const results = await scanRoot('.', fs);

  assert.equal(results.length, 1);
  assert.equal(results[0].projectPath, 'real-project');
});

test("gracefully skips directories it can't read, without throwing", async () => {
  const fs = new FakeFs(
    dir({
      'locked-project': dir({
        '.stalemod': file(0, now),
        node_modules: dir({}),
      }),
      'readable-project': dir({
        '.stalemod': file(0, now),
        node_modules: dir({ dep: dir({ 'a.js': file(100, now) }) }),
      }),
    }),
  );
  fs.denyReaddir('locked-project/node_modules');

  const results = await scanRoot('.', fs);

  const locked = results.find((r) => r.projectPath === 'locked-project');
  const readable = results.find((r) => r.projectPath === 'readable-project');
  assert.equal(locked?.sizeBytes, 0);
  assert.equal(readable?.sizeBytes, 100);
});

test("returns an empty array for a root path that doesn't exist", async () => {
  const fs = new FakeFs(dir({}));

  const results = await scanRoot('does-not-exist', fs);

  assert.deepEqual(results, []);
});
