import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CATEGORIES,
  addTodo,
  changeCategory,
  clearCompleted,
  countActive,
  editTodo,
  filterTodos,
  groupByCategory,
  normalizeCategory,
  removeTodo,
  toggleTodo,
} from '../src/todo.js';

// Frozen so any accidental mutation throws (modules run in strict mode).
const sample = Object.freeze([
  Object.freeze({ id: 'a', title: '牛乳を買う', completed: false, category: 'now' }),
  Object.freeze({ id: 'b', title: '見積もりの返事', completed: true, category: 'waiting' }),
]);

test('addTodo appends a trimmed, incomplete todo in the given category', () => {
  assert.deepEqual(addTodo(sample, '  旅行の計画  ', 'someday', 'c'), [
    ...sample,
    { id: 'c', title: '旅行の計画', completed: false, category: 'someday' },
  ]);
});

test('addTodo falls back to the default category for an unknown one', () => {
  const [todo] = addTodo([], '掃除', 'bogus', 'c');
  assert.equal(todo.category, 'now');
});

test('addTodo ignores blank titles', () => {
  assert.equal(addTodo(sample, '   ', 'now', 'c'), sample);
});

test('addTodo generates an id when none is given', () => {
  const [todo] = addTodo([], '掃除', 'now');
  assert.equal(typeof todo.id, 'string');
  assert.notEqual(todo.id, '');
});

test('normalizeCategory keeps known categories and defaults the rest', () => {
  for (const { id } of CATEGORIES) assert.equal(normalizeCategory(id), id);
  assert.equal(normalizeCategory(undefined), 'now');
  assert.equal(normalizeCategory('bogus'), 'now');
});

test('toggleTodo flips only the matching todo', () => {
  assert.deepEqual(toggleTodo(sample, 'a'), [{ ...sample[0], completed: true }, sample[1]]);
});

test('editTodo replaces the title with a trimmed one and keeps the category', () => {
  assert.deepEqual(editTodo(sample, 'a', ' 豆乳を買う '), [
    { id: 'a', title: '豆乳を買う', completed: false, category: 'now' },
    sample[1],
  ]);
});

test('editTodo with a blank title removes the todo', () => {
  assert.deepEqual(editTodo(sample, 'a', '  '), [sample[1]]);
});

test('changeCategory moves only the matching todo and keeps its position', () => {
  assert.deepEqual(changeCategory(sample, 'b', 'now'), [
    sample[0],
    { id: 'b', title: '見積もりの返事', completed: true, category: 'now' },
  ]);
});

test('changeCategory falls back to the default category for an unknown one', () => {
  assert.equal(changeCategory(sample, 'b', 'bogus')[1].category, 'now');
});

test('removeTodo drops the matching todo', () => {
  assert.deepEqual(removeTodo(sample, 'b'), [sample[0]]);
});

test('clearCompleted keeps only active todos', () => {
  assert.deepEqual(clearCompleted(sample), [sample[0]]);
});

test('filterTodos returns the todos for each filter', () => {
  assert.deepEqual(filterTodos(sample, 'all'), sample);
  assert.deepEqual(filterTodos(sample, 'active'), [sample[0]]);
  assert.deepEqual(filterTodos(sample, 'completed'), [sample[1]]);
});

test('countActive counts incomplete todos', () => {
  assert.equal(countActive(sample), 1);
  assert.equal(countActive([]), 0);
});

test('groupByCategory returns every category in order with its todos', () => {
  assert.deepEqual(groupByCategory(sample), [
    { id: 'now', label: '今すぐやる', todos: [sample[0]] },
    { id: 'waiting', label: '連絡待ち', todos: [sample[1]] },
    { id: 'project', label: 'プロジェクト', todos: [] },
    { id: 'someday', label: 'いつかやる', todos: [] },
  ]);
});
