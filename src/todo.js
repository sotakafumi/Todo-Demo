// Pure state functions. Each returns a new array and never mutates its input,
// so the UI can treat every change as "replace the whole list".

// Display order of the groups follows this array.
export const CATEGORIES = [
  { id: 'now', label: '今すぐやる' },
  { id: 'waiting', label: '連絡待ち' },
  { id: 'project', label: 'プロジェクト' },
  { id: 'someday', label: 'いつかやる' },
];

export const DEFAULT_CATEGORY = 'now';

export function normalizeCategory(category) {
  return CATEGORIES.some(({ id }) => id === category) ? category : DEFAULT_CATEGORY;
}

export function addTodo(todos, title, category, id = crypto.randomUUID()) {
  const trimmed = title.trim();
  if (!trimmed) return todos;
  return [...todos, { id, title: trimmed, completed: false, category: normalizeCategory(category) }];
}

export function toggleTodo(todos, id) {
  return todos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo));
}

// A blank title deletes the todo, matching the common TodoMVC behavior.
export function editTodo(todos, id, title) {
  const trimmed = title.trim();
  if (!trimmed) return removeTodo(todos, id);
  return todos.map((todo) => (todo.id === id ? { ...todo, title: trimmed } : todo));
}

// The todo keeps its position in the array, so within the new group it sorts by creation order.
export function changeCategory(todos, id, category) {
  const next = normalizeCategory(category);
  return todos.map((todo) => (todo.id === id ? { ...todo, category: next } : todo));
}

export function removeTodo(todos, id) {
  return todos.filter((todo) => todo.id !== id);
}

export function clearCompleted(todos) {
  return todos.filter((todo) => !todo.completed);
}

export function filterTodos(todos, filter) {
  if (filter === 'active') return todos.filter((todo) => !todo.completed);
  if (filter === 'completed') return todos.filter((todo) => todo.completed);
  return todos;
}

export function countActive(todos) {
  return todos.filter((todo) => !todo.completed).length;
}

// One entry per category in CATEGORIES order, including empty ones.
export function groupByCategory(todos) {
  return CATEGORIES.map(({ id, label }) => ({
    id,
    label,
    todos: todos.filter((todo) => todo.category === id),
  }));
}
