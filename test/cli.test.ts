import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDays } from '../src/options.js';

test('parseDays accepts a valid non-negative integer', () => {
  assert.equal(parseDays('30'), 30);
  assert.equal(parseDays('0'), 0);
});

test('parseDays rejects negative numbers', () => {
  assert.equal(parseDays('-5'), null);
});

test('parseDays rejects non-numeric input', () => {
  assert.equal(parseDays('abc'), null);
});
