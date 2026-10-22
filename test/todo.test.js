import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  addTodo,
  clearCompleted,
  countActive,
  editTodo,
  filterTodos,
  removeTodo,
  toggleTodo,
} from '../src/todo.js';

// Frozen so any accidental mutation throws (modules run in strict mode).
const sample = Object.freeze([
  Object.freeze({ id: 'a', title: '牛乳を買う', completed: false }),
  Object.freeze({ id: 'b', title: '洗濯', completed: true }),
]);

test('addTodo appends a trimmed, incomplete todo', () => {
  assert.deepEqual(addTodo(sample, '  掃除  ', 'c'), [
    ...sample,
    { id: 'c', title: '掃除', completed: false },
  ]);
});

test('addTodo ignores blank titles', () => {
  assert.equal(addTodo(sample, '   ', 'c'), sample);
});

test('addTodo generates an id when none is given', () => {
  const [todo] = addTodo([], '掃除');
  assert.equal(typeof todo.id, 'string');
  assert.notEqual(todo.id, '');
});

test('toggleTodo flips only the matching todo', () => {
  assert.deepEqual(toggleTodo(sample, 'a'), [
    { id: 'a', title: '牛乳を買う', completed: true },
    sample[1],
  ]);
});

test('editTodo replaces the title with a trimmed one', () => {
  assert.deepEqual(editTodo(sample, 'a', ' 豆乳を買う '), [
    { id: 'a', title: '豆乳を買う', completed: false },
    sample[1],
  ]);
});

test('editTodo with a blank title removes the todo', () => {
  assert.deepEqual(editTodo(sample, 'a', '  '), [sample[1]]);
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
