import { normalizeCategory } from './todo.ts';
import type { Todo } from './todo.ts';

// Same key as the pre-Next.js app, so todos already saved in the browser carry over.
export const STORAGE_KEY = 'todo-app/todos';

type StoredTodo = Omit<Todo, 'category'> & { category?: unknown };

// `storage` is injectable so tests can pass a fake instead of the browser's localStorage.
export function loadTodos(storage: Pick<Storage, 'getItem'> = localStorage): Todo[] {
  try {
    const parsed: unknown = JSON.parse(storage.getItem(STORAGE_KEY) ?? '[]');
    if (!Array.isArray(parsed)) return [];
    // Todos saved before categories existed have none; they land in the default category.
    return parsed
      .filter(isStoredTodo)
      .map((todo) => ({ ...todo, category: normalizeCategory(todo.category) }));
  } catch {
    return [];
  }
}

export function saveTodos(
  todos: readonly Todo[],
  storage: Pick<Storage, 'setItem'> = localStorage,
): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch {
    // Storage is full or blocked (e.g. private mode); keep working with in-memory state.
  }
}

function isStoredTodo(value: unknown): value is StoredTodo {
  if (typeof value !== 'object' || value === null) return false;
  const { id, title, completed } = value as Record<string, unknown>;
  return typeof id === 'string' && typeof title === 'string' && typeof completed === 'boolean';
}
