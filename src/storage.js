import { normalizeCategory } from './todo.js';

export const STORAGE_KEY = 'todo-app/todos';

// `storage` is injectable so tests can pass a fake instead of the browser's localStorage.
export function loadTodos(storage = localStorage) {
  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY) ?? '[]');
    if (!Array.isArray(parsed)) return [];
    // Todos saved before categories existed have none; they land in the default category.
    return parsed
      .filter(isTodo)
      .map((todo) => ({ ...todo, category: normalizeCategory(todo.category) }));
  } catch {
    return [];
  }
}

export function saveTodos(todos, storage = localStorage) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch {
    // Storage is full or blocked (e.g. private mode); keep working with in-memory state.
  }
}

function isTodo(value) {
  return (
    typeof value?.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.completed === 'boolean'
  );
}
