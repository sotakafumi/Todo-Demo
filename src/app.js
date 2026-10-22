import {
  CATEGORIES,
  DEFAULT_CATEGORY,
  addTodo,
  clearCompleted,
  countActive,
  editTodo,
  filterTodos,
  groupByCategory,
  removeTodo,
  toggleTodo,
} from './todo.js';
import { loadTodos, saveTodos } from './storage.js';

const form = document.querySelector('#new-todo-form');
const input = document.querySelector('#new-todo');
const categoryPicker = document.querySelector('#category-picker');
const board = document.querySelector('#todo-groups');
const empty = document.querySelector('#empty');
const footer = document.querySelector('#footer');
const count = document.querySelector('#count');
const clearButton = document.querySelector('#clear-completed');
const filterButtons = document.querySelectorAll('[data-filter]');

let todos = loadTodos();
let filter = 'all';

// Single path for every state change: persist, then redraw from scratch.
function update(next) {
  todos = next;
  saveTodos(todos);
  render();
}

function render() {
  // Rebuilding the list drops focus, so remember which control had it and restore it afterwards.
  const focused = document.activeElement;
  const focusedId = focused?.closest('#todo-groups li')?.dataset.id;
  const focusedAction = focused?.dataset.action;

  const groups = groupByCategory(filterTodos(todos, filter)).filter((group) => group.todos.length > 0);
  board.replaceChildren(...groups.map(renderGroup));

  empty.hidden = groups.length > 0;
  empty.textContent = todos.length === 0 ? 'TODOはまだありません' : '該当するTODOはありません';
  footer.hidden = todos.length === 0;
  count.textContent = `残り ${countActive(todos)} 件`;
  clearButton.hidden = !todos.some((todo) => todo.completed);
  for (const button of filterButtons) {
    button.setAttribute('aria-pressed', String(button.dataset.filter === filter));
  }

  if (focusedId && focusedAction) focusControl(focusedId, focusedAction);
}

function renderGroup({ id, label, todos: items }) {
  const section = document.createElement('section');
  section.className = 'group';
  section.dataset.category = id;

  const heading = document.createElement('h2');
  heading.className = 'group-title';
  const badge = document.createElement('span');
  badge.className = 'group-count';
  badge.textContent = items.length;
  heading.append(label, badge);

  const list = document.createElement('ul');
  list.className = 'todo-list';
  list.append(...items.map(renderItem));

  section.append(heading, list);
  return section;
}

function renderItem(todo) {
  const item = document.createElement('li');
  item.className = todo.completed ? 'todo completed' : 'todo';
  item.dataset.id = todo.id;

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'toggle';
  checkbox.dataset.action = 'toggle';
  checkbox.checked = todo.completed;
  checkbox.setAttribute('aria-label', `「${todo.title}」を完了にする`);

  const title = document.createElement('span');
  title.className = 'title';
  title.textContent = todo.title;

  item.append(
    checkbox,
    title,
    iconButton('edit', '✎', `「${todo.title}」を編集`),
    iconButton('remove', '×', `「${todo.title}」を削除`),
  );
  return item;
}

function iconButton(action, text, label) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `icon-button ${action}`;
  button.dataset.action = action;
  button.textContent = text;
  button.setAttribute('aria-label', label);
  return button;
}

function renderCategoryPicker() {
  for (const { id, label } of CATEGORIES) {
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'category';
    radio.value = id;
    radio.checked = id === DEFAULT_CATEGORY;

    const option = document.createElement('label');
    option.className = 'category-option';
    option.append(radio, label);
    categoryPicker.append(option);
  }
}

function focusControl(id, action) {
  board.querySelector(`li[data-id="${CSS.escape(id)}"] [data-action="${action}"]`)?.focus();
}

function startEditing(item) {
  const { id } = item.dataset;
  const field = document.createElement('input');
  field.className = 'edit';
  field.value = todos.find((todo) => todo.id === id).title;
  field.setAttribute('aria-label', 'TODOを編集');

  // Enter, Escape and blur can all fire for one edit (re-rendering removes the focused field).
  let finished = false;
  const finish = (save, refocus) => {
    if (finished) return;
    finished = true;
    if (save) update(editTodo(todos, id, field.value));
    else render();
    if (refocus) focusControl(id, 'edit');
  };

  field.addEventListener('keydown', (event) => {
    // The Enter that confirms an IME conversion must not save. Safari reports it as keyCode 229.
    if (event.isComposing || event.keyCode === 229) return;
    if (event.key !== 'Enter' && event.key !== 'Escape') return;
    // finish() moves focus to the ✎ button; without this, the same Enter keypress would
    // activate that button and immediately reopen the editor.
    event.preventDefault();
    finish(event.key === 'Enter', true);
  });
  field.addEventListener('blur', () => finish(true, false));

  item.replaceChildren(field);
  field.focus();
  field.select();
}

// The chosen category stays selected after adding, so several todos can go into the same one.
form.addEventListener('submit', (event) => {
  event.preventDefault();
  update(addTodo(todos, input.value, form.elements.category.value));
  input.value = '';
  input.focus();
});

board.addEventListener('change', (event) => {
  if (event.target.dataset.action === 'toggle') {
    update(toggleTodo(todos, event.target.closest('li').dataset.id));
  }
});

board.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const item = button.closest('li');
  if (button.dataset.action === 'edit') startEditing(item);
  if (button.dataset.action === 'remove') update(removeTodo(todos, item.dataset.id));
});

board.addEventListener('dblclick', (event) => {
  if (event.target.matches('.title')) startEditing(event.target.closest('li'));
});

for (const button of filterButtons) {
  button.addEventListener('click', () => {
    filter = button.dataset.filter;
    render();
  });
}

clearButton.addEventListener('click', () => update(clearCompleted(todos)));

renderCategoryPicker();
render();
