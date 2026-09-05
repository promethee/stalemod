import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getLastSourceModified, daysSince } from '../src/staleness.js';
import { FakeFs, dir, file } from './fake-fs.js';

test('finds the most recent mtime among source files', async () => {
  const oldest = new Date('2026-01-01');
  const middle = new Date('2026-06-01');
  const newest = new Date('2026-08-01');

  const fs = new FakeFs(
    dir({
      'index.ts': file(100, oldest),
      src: dir({ 'util.ts': file(50, newest) }),
      'readme.md': file(10, middle),
    }),
  );

  const result = await getLastSourceModified('.', fs);

  assert.equal(result.toISOString(), newest.toISOString());
});

test('ignores node_modules, .git, dist, and other noise directories', async () => {
  const trueLatest = new Date('2026-01-01');
  const decoyLatest = new Date('2026-09-01'); // newer, but in ignored dirs

  const fs = new FakeFs(
    dir({
      'index.ts': file(100, trueLatest),
      node_modules: dir({ dep: dir({ 'a.js': file(1, decoyLatest) }) }),
      '.git': dir({ HEAD: file(1, decoyLatest) }),
      dist: dir({ 'bundle.js': file(1, decoyLatest) }),
    }),
  );

  const result = await getLastSourceModified('.', fs);

  assert.equal(result.toISOString(), trueLatest.toISOString());
});

test('daysSince computes whole days between a past date and now', () => {
  const fortyDaysAgo = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000);

  assert.equal(daysSince(fortyDaysAgo), 40);
});
