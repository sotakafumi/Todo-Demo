# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A browser TODO app (UI text in Japanese) written in vanilla HTML/CSS/JavaScript with ES modules. There are no dependencies and no build step; `npm install` is not needed. Todos are persisted to `localStorage`.

## Commands

- `npm start` — serve the app at http://localhost:3000 (`PORT` env var overrides). Opening `index.html` directly via `file://` does not work because browsers block ES modules there.
- `npm test` — run all tests with Node's built-in runner (`node --test`, picks up `test/*.test.js`).
- Single file: `node --test test/todo.test.js`
- Single test by name: `node --test --test-name-pattern="editTodo" test/`

## Architecture

- `src/todo.js` — pure state functions (`addTodo`, `toggleTodo`, `editTodo`, ...). Every function takes the todo array and returns a new one without mutating it; tests rely on this by passing frozen arrays. Business rules live here, e.g. a blank title on edit deletes the todo.
- `src/storage.js` — `loadTodos`/`saveTodos` against `localStorage`, with the storage object injectable for tests. Loading validates entries and falls back to `[]` on corrupt data.
- `src/app.js` — DOM layer. All mutations go through `update(next)`, which saves and then calls `render()`, which rebuilds the whole list from state (and restores focus to the same control afterwards). List events are delegated on `#todo-list` and dispatched by `data-action` (`toggle` / `edit` / `remove`). Only this file touches the DOM, so it has no automated tests.
- `scripts/serve.js` — dependency-free static file server for development only (binds to 127.0.0.1, rejects paths outside the repo).

Todo shape: `{ id: string, title: string, completed: boolean }`.

The inline editor ignores Enter while an IME composition is active (`isComposing` / `keyCode === 229`), so Japanese input can confirm a conversion without saving. Keep that guard on any new Enter-key handlers.
