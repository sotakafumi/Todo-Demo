# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A browser TODO app (UI text in Japanese) written in vanilla HTML/CSS/JavaScript with ES modules. There are no dependencies and no build step; `npm install` is not needed. Todos are persisted to `localStorage`.

## Commands

- `npm start` — serve the app at http://localhost:3000 (`PORT` env var overrides). Opening `index.html` directly via `file://` does not work because browsers block ES modules there.
- `npm run start:lan` — same, but listens on all interfaces and prints the LAN URLs, for opening the app from a phone on the same network.
- `npm test` — run all tests with Node's built-in runner (`node --test`, picks up `test/*.test.js`).
- Single file: `node --test test/todo.test.js`
- Single test by name: `node --test --test-name-pattern="editTodo" test/`

## Deployment

The app is published on GitHub Pages at https://sotakafumi.github.io/Todo-Demo/. Pages serves the repository root of the `master` branch as-is (classic branch build, no workflow file), so pushing to `master` deploys. There is no CI, so run `npm test` before pushing. Check the build with `gh api repos/sotakafumi/Todo-Demo/pages/builds/latest --jq .status` (`built` / `building` / `errored`).

- The site lives under the `/Todo-Demo/` subpath, so asset and module paths must stay relative (`src/app.js`, `./todo.js`). A root-absolute path like `/src/app.js` works on `npm start` but 404s on Pages.
- The branch build runs Jekyll, which drops files and folders whose names start with `_` or `.`. Don't give served files such names, or add an empty `.nojekyll` at the root.
- The repository is public because the current GitHub plan does not support Pages for private repositories. Everything committed is world-readable, both on GitHub and on the site.
- Pages is HTTPS, so it is a secure context, unlike the LAN dev server.

## Architecture

- `src/todo.js` — pure state functions (`addTodo`, `toggleTodo`, `editTodo`, ...). Every function takes the todo array and returns a new one without mutating it; tests rely on this by passing frozen arrays. Business rules live here, e.g. a blank title on edit deletes the todo. `CATEGORIES` (今すぐやる / 連絡待ち / プロジェクト / いつかやる) is the single source for category ids, labels and display order. The UI picker and the grouped list are both generated from it.
- `src/storage.js` — `loadTodos`/`saveTodos` against `localStorage`, with the storage object injectable for tests. Loading validates entries and falls back to `[]` on corrupt data. It also migrates on read: a missing or unknown `category` becomes `DEFAULT_CATEGORY` (`now`), which covers data saved before categories existed.
- `src/app.js` — DOM layer. All mutations go through `update(next)`, which saves and then calls `render()`, which rebuilds the whole board from state (and restores focus to the same control afterwards). The board (`#todo-groups`) shows one section per category that has visible todos, after the すべて/未完了/完了 filter is applied. Events are delegated on `#todo-groups` and dispatched by `data-action` (`toggle` / `move` on `change`, `edit` / `remove` on `click`). Only this file touches the DOM, so it has no automated tests.
- `scripts/serve.js` — dependency-free static file server for development only. Binds to 127.0.0.1 unless `--lan` is passed. Rejects paths outside the repo and dotfiles (e.g. `.git`).

Over a LAN address the page is plain HTTP and therefore not a secure context, so secure-context-only APIs such as `crypto.randomUUID()` are unavailable. Todo IDs come from `createId()`, which falls back to `crypto.getRandomValues()`. Any new browser API needs the same check.

Todo shape: `{ id: string, title: string, completed: boolean, category: 'now' | 'waiting' | 'project' | 'someday' }`.

The inline editor ignores Enter while an IME composition is active (`isComposing` / `keyCode === 229`), so Japanese input can confirm a conversion without saving. Keep that guard on any new Enter-key handlers.
