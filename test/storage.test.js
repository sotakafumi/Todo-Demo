import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STORAGE_KEY, loadTodos, saveTodos } from '../src/storage.js';

function fakeStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => {
      data[key] = String(value);
    },
  };
}

test('saved todos load back unchanged', () => {
  const storage = fakeStorage();
  const todos = [{ id: 'a', title: '牛乳を買う', completed: false }];
  saveTodos(todos, storage);
  assert.deepEqual(loadTodos(storage), todos);
});

test('loadTodos returns an empty list when nothing is stored', () => {
  assert.deepEqual(loadTodos(fakeStorage()), []);
});

test('loadTodos returns an empty list for corrupt data', () => {
  assert.deepEqual(loadTodos(fakeStorage({ [STORAGE_KEY]: '{not json' })), []);
  assert.deepEqual(loadTodos(fakeStorage({ [STORAGE_KEY]: '{"id":"a"}' })), []);
});

test('loadTodos drops malformed entries', () => {
  const stored = JSON.stringify([
    { id: 'a', title: '牛乳を買う', completed: false },
    { id: 'b', title: 42, completed: false },
    null,
  ]);
  assert.deepEqual(loadTodos(fakeStorage({ [STORAGE_KEY]: stored })), [
    { id: 'a', title: '牛乳を買う', completed: false },
  ]);
});

test('saveTodos does not throw when storage is unavailable', () => {
  const storage = {
    setItem: () => {
      throw new Error('QuotaExceededError');
    },
  };
  assert.doesNotThrow(() => saveTodos([], storage));
});
