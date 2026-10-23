// Pure state functions. Each returns a new array and never mutates its input,
// so the UI can treat every change as "replace the whole list".

// Display order of the groups follows this array.
export const CATEGORIES = [
  { id: 'now', label: '今すぐやる' },
  { id: 'waiting', label: '連絡待ち' },
  { id: 'project', label: 'プロジェクト' },
  { id: 'someday', label: 'いつかやる' },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]['id'];

export type Todo = {
  id: string;
  title: string;
  completed: boolean;
  category: CategoryId;
};

export type Filter = 'all' | 'active' | 'completed';

export const DEFAULT_CATEGORY: CategoryId = 'now';

export function normalizeCategory(category: unknown): CategoryId {
  return CATEGORIES.find(({ id }) => id === category)?.id ?? DEFAULT_CATEGORY;
}

type RandomSource = {
  randomUUID?: () => string;
  getRandomValues: (array: Uint8Array) => Uint8Array;
};

// crypto.randomUUID() only exists in secure contexts (HTTPS or localhost). Opening the app over
// plain HTTP on a LAN address, e.g. from a phone, needs the getRandomValues() fallback.
export function createId(cryptoApi: RandomSource = crypto): string {
  if (typeof cryptoApi.randomUUID === 'function') return cryptoApi.randomUUID();
  const bytes = cryptoApi.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function addTodo(
  todos: readonly Todo[],
  title: string,
  category: unknown,
  id = createId(),
): readonly Todo[] {
  const trimmed = title.trim();
  if (!trimmed) return todos;
  return [...todos, { id, title: trimmed, completed: false, category: normalizeCategory(category) }];
}

export function toggleTodo(todos: readonly Todo[], id: string): readonly Todo[] {
  return todos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo));
}

// A blank title deletes the todo, matching the common TodoMVC behavior.
export function editTodo(todos: readonly Todo[], id: string, title: string): readonly Todo[] {
  const trimmed = title.trim();
  if (!trimmed) return removeTodo(todos, id);
  return todos.map((todo) => (todo.id === id ? { ...todo, title: trimmed } : todo));
}

// The todo keeps its position in the array, so within the new group it sorts by creation order.
export function changeCategory(
  todos: readonly Todo[],
  id: string,
  category: unknown,
): readonly Todo[] {
  const next = normalizeCategory(category);
  return todos.map((todo) => (todo.id === id ? { ...todo, category: next } : todo));
}

export function removeTodo(todos: readonly Todo[], id: string): readonly Todo[] {
  return todos.filter((todo) => todo.id !== id);
}

export function clearCompleted(todos: readonly Todo[]): readonly Todo[] {
  return todos.filter((todo) => !todo.completed);
}

export function filterTodos(todos: readonly Todo[], filter: Filter): readonly Todo[] {
  if (filter === 'active') return todos.filter((todo) => !todo.completed);
  if (filter === 'completed') return todos.filter((todo) => todo.completed);
  return todos;
}

export function countActive(todos: readonly Todo[]): number {
  return todos.filter((todo) => !todo.completed).length;
}

// One entry per category in CATEGORIES order, including empty ones.
export function groupByCategory(todos: readonly Todo[]) {
  return CATEGORIES.map(({ id, label }) => ({
    id,
    label,
    todos: todos.filter((todo) => todo.category === id),
  }));
}
