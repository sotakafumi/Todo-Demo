// Pure state functions. Each returns a new array and never mutates its input,
// so the UI can treat every change as "replace the whole list".

export function addTodo(todos, title, id = crypto.randomUUID()) {
  const trimmed = title.trim();
  if (!trimmed) return todos;
  return [...todos, { id, title: trimmed, completed: false }];
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
