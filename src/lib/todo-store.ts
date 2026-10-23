import { useSyncExternalStore } from 'react';
import { loadTodos, saveTodos } from './storage.ts';
import type { Todo } from './todo.ts';

// localStorage is the source of truth. The array is cached here because useSyncExternalStore
// needs the same reference back on every read until something changes.
let todos: readonly Todo[] | undefined;
const listeners = new Set<() => void>();

function getTodos(): readonly Todo[] {
  todos ??= loadTodos();
  return todos;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Single path for every state change: persist, then re-render the subscribed components.
export function updateTodos(change: (todos: readonly Todo[]) => readonly Todo[]): void {
  const next = change(getTodos());
  if (next === todos) return;
  todos = next;
  saveTodos(next);
  for (const listener of listeners) listener();
}

// null while prerendering at build time and during hydration: localStorage only exists in the
// browser, and the first client render has to match the prerendered HTML.
export function useTodos(): readonly Todo[] | null {
  return useSyncExternalStore(subscribe, getTodos, () => null);
}
