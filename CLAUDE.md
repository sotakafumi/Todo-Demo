# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A browser TODO app (UI text in Japanese) built with Next.js 16 (App Router), React 19 and TypeScript. It is a static export (`output: 'export'`): `next build` writes plain files to `out/`, there is no server-side code, and todos are persisted to `localStorage`. Requires Node.js 24+, because the tests rely on Node's built-in TypeScript type stripping.

Next.js 16 differs from older versions in APIs and conventions. Read the docs bundled in `node_modules/next/dist/docs/` before using an unfamiliar Next.js API. Running `next dev` from an agent session creates an `AGENTS.md` that says the same.

## Commands

- `npm install` — required before anything else.
- `npm run dev` — dev server at http://localhost:3000.
- `npm run build` — type-checks, then writes the static export to `out/`.
- `npm start` — serve `out/` at http://localhost:3000 with `scripts/serve.js` (`PORT` env var overrides). Run `npm run build` first.
- `npm run start:lan` — same, but listens on all interfaces and prints the LAN URLs, for opening the app from a phone on the same network. Use this rather than `next dev -H 0.0.0.0`: the dev server blocks its dev assets for origins other than localhost (`allowedDevOrigins`).
- `npm test` — run all tests with Node's built-in runner (`node --test "test/**/*.test.ts"`). Node only strips the types, so tests do not type-check; `npm run build` or `npx tsc --noEmit` does.
- Single file: `node --test test/todo.test.ts`
- Single test by name: `node --test --test-name-pattern="editTodo" "test/**/*.test.ts"`
- `npm run test:e2e` — Playwright end-to-end tests in Chromium. Each run rebuilds the static export and serves it with `scripts/serve.js` on port 3100. The first time, download the browser with `npx playwright install chromium`.
- Single e2e test by name: `npx playwright test --grep "IME"`. Add `--headed` to watch it, or `--debug` to step through.

## Deployment

The app is published on GitHub Pages at https://sotakafumi.github.io/Todo-Demo/. `.github/workflows/deploy.yml` runs on every push to `master`: `npm test`, `npm run test:e2e`, then `npm run build`, then it publishes `out/`. A failing test stops the deploy. Playwright traces of failed e2e tests are uploaded as the `playwright-traces` artifact. The repository's Pages source must be set to "GitHub Actions". Check runs with `gh run list --workflow deploy.yml`.

- The site lives under the `/Todo-Demo/` subpath. `next.config.ts` takes `basePath` from `PAGES_BASE_PATH`, which the workflow sets from `actions/configure-pages`; local builds leave it empty so `npm start` serves from the root. Reference pages and assets through Next.js (imports, `next/link`, metadata) so the base path is applied. A hard-coded root path like `/icon.svg` works locally but 404s on Pages.
- To reproduce the Pages build locally in Git Bash, use `MSYS_NO_PATHCONV=1 PAGES_BASE_PATH=/Todo-Demo npm run build`. Without `MSYS_NO_PATHCONV`, Git Bash rewrites the value into a Windows path and the build fails. Rebuild without it afterwards, or `npm start` serves a broken page.
- Pushing changes under `.github/workflows/` needs a token with the `workflow` scope (`gh auth refresh -h github.com -s workflow`).
- The repository is public because the current GitHub plan does not support Pages for private repositories. Everything committed is world-readable.
- Pages is HTTPS, so it is a secure context, unlike the LAN server.

## Architecture

- `src/lib/todo.ts` — types (`Todo`, `CategoryId`, `Filter`) and pure state functions (`addTodo`, `toggleTodo`, `editTodo`, ...). Every function takes a `readonly Todo[]` and returns a new array without mutating it; tests rely on this by passing frozen arrays. Business rules live here, e.g. a blank title on edit deletes the todo. `CATEGORIES` (今すぐやる / 連絡待ち / プロジェクト / いつかやる) is the single source for category ids, labels and display order. `CategoryId` is derived from it, and the UI picker and the grouped list are both generated from it.
- `src/lib/storage.ts` — `loadTodos`/`saveTodos` against `localStorage`, with the storage object injectable for tests. Loading validates entries and falls back to `[]` on corrupt data. It also migrates on read: a missing or unknown `category` becomes `DEFAULT_CATEGORY` (`now`), which covers data saved before categories existed. `STORAGE_KEY` is the same as in the pre-Next.js app so todos already saved in browsers carry over; don't rename it.
- `src/lib/todo-store.ts` — the todo list as an external store. `updateTodos(change)` is the single path for every mutation: it applies one of the pure functions, saves, and re-renders subscribers. `useTodos()` (`useSyncExternalStore`) returns `null` while prerendering and during hydration, so the board, the empty message and the footer render only after hydration. The prerendered HTML contains just the heading and the form.
- `src/app/` — `layout.tsx` and `page.tsx` are Server Components (HTML shell, metadata, heading). `globals.css` holds all styles: plain CSS with custom properties and a dark-mode override.
- `src/components/todo-app.tsx` — client component with the form, the board and the footer. It holds UI state: input text, chosen category, filter, and which todo is being edited. The board shows one section per category that has visible todos, after the すべて/未完了/完了 filter is applied. Moving a todo to another group remounts its row, and closing the editor swaps the row's contents. In both cases `pendingFocus` restores focus afterwards, finding the control by its `data-action`.
- `src/components/todo-item.tsx` — one row, plus the inline editor (`TodoEditor`). Enter saves, Escape cancels, and blur saves; a `finished` ref keeps one edit from finishing twice.
- `scripts/serve.js` — dependency-free static file server for `out/`. Binds to 127.0.0.1 unless `--lan` is passed. Rejects paths outside `out/` and dotfiles.
- `e2e/` — Playwright tests for the UI (`todo.spec.ts`) and their helpers (`fixtures.ts`). Every test gets a fresh browser context, so localStorage starts empty. Its `test` fails any test that logs a console error or warning or throws, which is how hydration mismatches surface. `openApp` waits for the board to render before interacting, because typing before hydration races React. `expectBoard` asserts the whole board as `[category label, ...titles]` per group. Prefer role and label locators (`getByRole('button', { name: '「牛乳を買う」を編集' })`); they double as checks of the aria-labels. The `.edit` class is on both the editor input and the ✎ button.

Files in `src/lib/` are also loaded directly by Node in tests. They import each other with relative paths ending in `.ts` (`./todo.ts`, allowed by `allowImportingTsExtensions`), and must use only erasable TypeScript syntax (`erasableSyntaxOnly`: no enums, namespaces or parameter properties). Components import them as `@/lib/...`. `todo-store.ts` imports React, so unit tests cannot load it. The store and components are covered by the e2e tests instead.

Over a LAN address the page is plain HTTP and therefore not a secure context, so secure-context-only APIs such as `crypto.randomUUID()` are unavailable. Todo IDs come from `createId()`, which falls back to `crypto.getRandomValues()`. Any new browser API needs the same check.

The inline editor ignores Enter while an IME composition is active (`event.nativeEvent.isComposing` / `keyCode === 229`), so Japanese input can confirm a conversion without saving. Keep that guard on any new Enter-key handlers.
