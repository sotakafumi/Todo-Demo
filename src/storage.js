export const STORAGE_KEY = 'todo-app/todos';

// `storage` is injectable so tests can pass a fake instead of the browser's localStorage.
export function loadTodos(storage = localStorage) {
  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter(isTodo) : [];
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
