'use client';

import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import {
  CATEGORIES,
  DEFAULT_CATEGORY,
  addTodo,
  changeCategory,
  clearCompleted,
  countActive,
  editTodo,
  filterTodos,
  groupByCategory,
  removeTodo,
  toggleTodo,
} from '@/lib/todo';
import type { CategoryId, Filter } from '@/lib/todo';
import { updateTodos, useTodos } from '@/lib/todo-store';
import { TodoItem } from './todo-item';
import type { TodoAction } from './todo-item';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'すべて' },
  { id: 'active', label: '未完了' },
  { id: 'completed', label: '完了' },
];

export function TodoApp() {
  const todos = useTodos();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CategoryId>(DEFAULT_CATEGORY);
  const [filter, setFilter] = useState<Filter>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  // A control to focus after the next render. Moving a todo to another group remounts its row,
  // and closing the editor swaps the row's contents, so focus would otherwise be lost.
  const pendingFocus = useRef<{ id: string; action: TodoAction } | null>(null);

  useEffect(() => {
    const target = pendingFocus.current;
    if (!target) return;
    pendingFocus.current = null;
    const selector = `li[data-id="${CSS.escape(target.id)}"] [data-action="${target.action}"]`;
    boardRef.current?.querySelector<HTMLElement>(selector)?.focus();
  });

  // The chosen category stays selected after adding, so several todos can go into the same one.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateTodos((current) => addTodo(current, title, category));
    setTitle('');
    inputRef.current?.focus();
  }

  function handleMove(id: string, next: string) {
    updateTodos((current) => changeCategory(current, id, next));
    pendingFocus.current = { id, action: 'move' };
  }

  // `newTitle` is null when editing was cancelled.
  function handleFinishEditing(id: string, newTitle: string | null, refocus: boolean) {
    setEditingId(null);
    if (newTitle !== null) updateTodos((current) => editTodo(current, id, newTitle));
    if (refocus) pendingFocus.current = { id, action: 'edit' };
  }

  const groups = todos
    ? groupByCategory(filterTodos(todos, filter)).filter((group) => group.todos.length > 0)
    : [];

  return (
    <>
      <form className="new-todo" onSubmit={handleSubmit}>
        <div className="new-todo-row">
          <input
            ref={inputRef}
            id="new-todo"
            type="text"
            placeholder="やることを入力して Enter"
            autoComplete="off"
            autoFocus
            aria-label="新しいTODO"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <button type="submit">追加</button>
        </div>
        <div className="category-picker" role="radiogroup" aria-labelledby="category-label">
          <span id="category-label" className="category-label">
            分類
          </span>
          {CATEGORIES.map(({ id, label }) => (
            <label key={id} className="category-option">
              <input
                type="radio"
                name="category"
                value={id}
                checked={category === id}
                onChange={() => setCategory(id)}
              />
              {label}
            </label>
          ))}
        </div>
      </form>

      <div ref={boardRef}>
        {groups.map(({ id, label, todos: items }) => (
          <section key={id} className="group" data-category={id}>
            <h2 className="group-title">
              {label}
              <span className="group-count">{items.length}</span>
            </h2>
            <ul className="todo-list">
              {items.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  editing={todo.id === editingId}
                  onToggle={() => updateTodos((current) => toggleTodo(current, todo.id))}
                  onMove={(next) => handleMove(todo.id, next)}
                  onStartEditing={() => setEditingId(todo.id)}
                  onFinishEditing={(newTitle, refocus) => handleFinishEditing(todo.id, newTitle, refocus)}
                  onRemove={() => updateTodos((current) => removeTodo(current, todo.id))}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>

      {/* Nothing below renders until the todos are read from localStorage after hydration. */}
      {todos && groups.length === 0 && (
        <p className="empty">
          {todos.length === 0 ? 'TODOはまだありません' : '該当するTODOはありません'}
        </p>
      )}

      {todos && todos.length > 0 && (
        <footer className="footer">
          <span>残り {countActive(todos)} 件</span>
          <div className="filters" role="group" aria-label="表示フィルター">
            {FILTERS.map(({ id, label }) => (
              <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}>
                {label}
              </button>
            ))}
          </div>
          {todos.some((todo) => todo.completed) && (
            <button type="button" className="clear" onClick={() => updateTodos(clearCompleted)}>
              完了済みを削除
            </button>
          )}
        </footer>
      )}
    </>
  );
}
