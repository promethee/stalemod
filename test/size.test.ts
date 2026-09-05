import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getDirectorySize } from '../src/size.js';
import { FakeFs, dir, file } from './fake-fs.js';

const now = new Date();

test('sums file sizes recursively across nested directories', async () => {
  const fs = new FakeFs(
    dir({
      node_modules: dir({
        'pkg-a': dir({
          'index.js': file(1000, now),
          'readme.md': file(200, now),
        }),
        'pkg-b': dir({ nested: dir({ 'deep.js': file(300, now) }) }),
      }),
    }),
  );

  const size = await getDirectorySize('node_modules', fs);

  assert.equal(size, 1500);
});

test('returns 0 for an empty directory', async () => {
  const fs = new FakeFs(dir({ empty: dir({}) }));

  const size = await getDirectorySize('empty', fs);

  assert.equal(size, 0);
});

test("returns 0 for a directory that doesn't exist, without throwing", async () => {
  const fs = new FakeFs(dir({}));

  const size = await getDirectorySize('nowhere', fs);

  assert.equal(size, 0);
});
