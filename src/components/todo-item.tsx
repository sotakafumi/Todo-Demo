'use client';

import { useEffect, useRef } from 'react';
import { CATEGORIES } from '@/lib/todo';
import type { Todo } from '@/lib/todo';

// Matches the data-action attributes below; TodoApp uses them to restore focus after a render.
export type TodoAction = 'toggle' | 'move' | 'edit' | 'remove';

type TodoItemProps = {
  todo: Todo;
  editing: boolean;
  onToggle: () => void;
  onMove: (category: string) => void;
  onStartEditing: () => void;
  onFinishEditing: (title: string | null, refocus: boolean) => void;
  onRemove: () => void;
};

export function TodoItem({
  todo,
  editing,
  onToggle,
  onMove,
  onStartEditing,
  onFinishEditing,
  onRemove,
}: TodoItemProps) {
  const className = todo.completed ? 'todo completed' : 'todo';

  if (editing) {
    return (
      <li className={className} data-id={todo.id}>
        <TodoEditor title={todo.title} onFinish={onFinishEditing} />
      </li>
    );
  }

  return (
    <li className={className} data-id={todo.id}>
      <input
        type="checkbox"
        className="toggle"
        data-action="toggle"
        checked={todo.completed}
        onChange={onToggle}
        aria-label={`「${todo.title}」を完了にする`}
      />
      <span className="title" onDoubleClick={onStartEditing}>
        {todo.title}
      </span>
      <select
        className="category-select"
        data-action="move"
        value={todo.category}
        onChange={(event) => onMove(event.target.value)}
        aria-label={`「${todo.title}」の分類`}
      >
        {CATEGORIES.map(({ id, label }) => (
          <option key={id} value={id}>
            {label}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="icon-button edit"
        data-action="edit"
        onClick={onStartEditing}
        aria-label={`「${todo.title}」を編集`}
      >
        ✎
      </button>
      <button
        type="button"
        className="icon-button remove"
        data-action="remove"
        onClick={onRemove}
        aria-label={`「${todo.title}」を削除`}
      >
        ×
      </button>
    </li>
  );
}

function TodoEditor({
  title,
  onFinish,
}: {
  title: string;
  onFinish: (title: string | null, refocus: boolean) => void;
}) {
  const fieldRef = useRef<HTMLInputElement>(null);
  // Enter, Escape and blur can all fire for one edit (unmounting the focused field blurs it).
  const finished = useRef(false);

  useEffect(() => {
    fieldRef.current?.focus();
    fieldRef.current?.select();
  }, []);

  function finish(value: string | null, refocus: boolean) {
    if (finished.current) return;
    finished.current = true;
    onFinish(value, refocus);
  }

  return (
    <input
      ref={fieldRef}
      className="edit"
      defaultValue={title}
      aria-label="TODOを編集"
      onKeyDown={(event) => {
        // The Enter that confirms an IME conversion must not save. Safari reports it as keyCode 229.
        if (event.nativeEvent.isComposing || event.keyCode === 229) return;
        if (event.key !== 'Enter' && event.key !== 'Escape') return;
        // Focus moves to the ✎ button afterwards; without this, the same Enter keypress would
        // activate that button and immediately reopen the editor.
        event.preventDefault();
        finish(event.key === 'Enter' ? event.currentTarget.value : null, true);
      }}
      onBlur={(event) => finish(event.currentTarget.value, false)}
    />
  );
}
