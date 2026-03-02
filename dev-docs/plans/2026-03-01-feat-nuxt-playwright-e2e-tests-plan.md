---
title: "feat: Add Playwright E2E Tests for Nuxt Collaborative Todo Example"
type: feat
status: active
date: 2026-03-01
---

# Add Playwright E2E Tests for Nuxt Collaborative Todo Example

## Overview

Add end-to-end tests using Playwright for the Nuxt 4 collaborative todo example app (`examples/nuxt-app/`). The app is a real-time collaborative todo list with WebSocket sync (Yjs), presence indicators, undo/redo, drag-to-reorder, and both client-side (IndexedDB) and server-side (SQLite) persistence.

The test suite will verify single-user CRUD operations, multi-user real-time collaboration, presence features, connection status, undo/redo, and persistence — covering the most critical user flows while deferring inherently flaky scenarios (drag-to-reorder) to a follow-up.

## Problem Statement / Motivation

The Nuxt example app currently relies on **manual testing only** (opening 2+ browser tabs and clicking around). There is zero automated E2E test coverage. This means:

- Regressions in the collaborative sync can go undetected
- Changes to `vue-yjs` composables may break the example without anyone noticing
- CI/CD has no way to validate that the full stack (client + WebSocket + server + persistence) works

Adding Playwright e2e tests provides confidence that the example app works end-to-end as a real user would experience it.

## Proposed Solution

### 1. Playwright Configuration (`examples/nuxt-app/`)

Install `@playwright/test` as a devDependency in the Nuxt app package. Use Playwright's native `webServer` config (not `@nuxt/test-utils/playwright`) for maximum stability and control with Nuxt 4.

**File: `examples/nuxt-app/playwright.config.ts`**

Key settings:
- `webServer.command`: Build the vue-yjs library, build the Nuxt app, then run `nuxt preview` for production-like testing
- `webServer.url`: `http://localhost:3000` (poll until ready)
- `webServer.reuseExistingServer`: `true` locally, `false` in CI
- `workers: 1` — SQLite does not support concurrent writes
- `retries: 1` in CI for flake tolerance
- `trace: 'on-first-retry'` for debugging failures
- `timeout: 30_000` per test (generous for WebSocket handshakes)
- `testDir: './e2e'`
- Single browser project: Chromium only (sufficient for this app)

### 2. Test Directory Structure

```
examples/nuxt-app/
  e2e/
    todo-crud.spec.ts           # Single-user add, toggle, edit, delete
    todo-collaboration.spec.ts  # Two-user sync for all CRUD operations
    presence.spec.ts            # Presence dots, username edit, connection status
    undo-redo.spec.ts           # Undo/redo buttons and keyboard shortcuts
    persistence.spec.ts         # Reload persistence via IndexedDB
    fixtures/
      collab.ts                 # Custom fixtures: waitForSync helper, multi-user setup
  playwright.config.ts
```

### 3. Add `data-testid` Attributes to Source Components

Add stable test selectors to key interactive elements. These never change for cosmetic reasons and make tests resilient to CSS class renames.

| Component | Element | `data-testid` |
|---|---|---|
| `TodoInput.vue` | Text input | `todo-input` |
| `TodoInput.vue` | Add button | `add-button` |
| `TodoItem.vue` | Item container | `todo-item` |
| `TodoItem.vue` | Checkbox | `todo-checkbox` |
| `TodoItem.vue` | Text span | `todo-text` |
| `TodoItem.vue` | Edit input | `todo-edit-input` |
| `TodoItem.vue` | Delete button | `delete-button` |
| `TodoItem.vue` | Drag handle | `drag-handle` |
| `TodoApp.vue` | Empty state | `empty-state` |
| `TodoApp.vue` | Undo button | `undo-button` |
| `TodoApp.vue` | Redo button | `redo-button` |
| `TodoApp.vue` | Todo list container | `todo-list` |
| `PresenceBar.vue` | Presence dot | `presence-dot` |
| `PresenceBar.vue` | Name edit input | `name-edit-input` |
| `ConnectionStatus.vue` | Status label | `connection-status` |

### 4. Test Isolation Strategy

**Server-side state**: Delete `data/collab.db` in a `globalSetup` script before the test suite runs. Since `workers: 1`, tests run sequentially — each test file uses `beforeEach`/`afterEach` to ensure clean state via a shared cleanup utility (either delete the DB file and reload, or add todos and remove them).

**Client-side state**: Each test gets a fresh `browser.newContext()` with empty localStorage and IndexedDB. No cross-test leakage.

**"Wait for ready" pattern**: Every test waits for the connection status to display "Synced" before interacting. This confirms: hydration complete, WebSocket connected, initial Yjs sync done.

### 5. Custom Fixtures

A `collab.ts` fixture file provides:

- **`todoPage`**: Opens a page, waits for "Synced" status, returns the page
- **`twoUsers`**: Creates two separate browser contexts (User A, User B), navigates both to the app, waits for both to show "Synced", returns both pages
- **`addTodo(page, text)`**: Helper that types text, clicks Add, and waits for the todo to appear in the list
- **`cleanDb()`**: Utility to delete `data/collab.db` for fresh state

### 6. Test Scenarios by File

#### `todo-crud.spec.ts` (Tier 1 — implement first)
- Add a new todo → appears in list, input clears
- Toggle todo done → strikethrough style applied
- Toggle todo undone → strikethrough removed
- Edit todo via double-click → inline input appears, commit with Enter
- Edit todo → cancel with Escape (text unchanged)
- Delete todo → hover to reveal button, click, todo removed
- Cannot add empty/whitespace todo → add button disabled
- Empty state message shows when no todos exist
- Empty state hides after adding a todo
- Empty state reappears after deleting the last todo

#### `todo-collaboration.spec.ts` (Tier 2)
- User A adds a todo → User B sees it appear
- User B toggles done → User A sees the strikethrough
- User A edits text → User B sees updated text
- User A deletes → User B sees it removed
- Both users see same todo count at all times

#### `presence.spec.ts` (Tier 2)
- Single user sees own presence dot with "(you)" label
- Two users → both see two presence dots
- User edits username → other user sees updated name
- Connection status shows "Synced" after load

#### `undo-redo.spec.ts` (Tier 2–3)
- Add todo, click undo → todo disappears
- Click redo → todo reappears
- Undo button disabled when nothing to undo
- Redo button disabled when nothing to redo
- Keyboard shortcut Ctrl+Z undoes last action
- Keyboard shortcut Ctrl+Y redoes

#### `persistence.spec.ts` (Tier 3)
- Add todos, reload page within same context → todos persist (via IndexedDB)
- Username persists across reload (localStorage)

### 7. Package Scripts

**`examples/nuxt-app/package.json`**:
- `"test:e2e": "playwright test"`
- `"test:e2e:ui": "playwright test --ui"` (local interactive mode)

**Root `package.json`**:
- `"test:e2e": "pnpm --filter vue-yjs-example-nuxt-app test:e2e"`

## Technical Considerations

**WebSocket experimental flag**: Nitro's WebSocket support (`nitro.experimental.websocket: true`) must work in preview mode, not just dev mode. This is already the case for the current Nuxt/Nitro versions.

**SQLite concurrency**: With `workers: 1`, only one test runs at a time. The SQLite database is safe from concurrent write conflicts. If parallelism is needed later, consider per-worker database files.

**SortableJS drag-and-drop**: Deferred to a follow-up. SortableJS uses JS pointer events internally, making `locator.dragTo()` unreliable. Manual `page.mouse` simulation with intermediate steps is needed. A placeholder/skipped test will be added.

**Delete button opacity:0**: Playwright considers `opacity: 0` elements visible, but for user-like behavior, the tests will hover the parent todo item first to trigger the CSS `:hover` state, then click the delete button.

**Batched persistence**: The server batches SQLite writes every 500ms. Persistence tests should wait for propagation or assert with retries.

**Mac vs Linux keyboard shortcuts**: The code handles both `metaKey` and `ctrlKey`. Tests use `Control+z` / `Control+y` which works on all CI platforms (Linux runners).

## Acceptance Criteria

- [ ] `@playwright/test` installed in `examples/nuxt-app/` devDependencies
- [ ] `playwright.config.ts` created with `webServer`, `workers: 1`, trace config
- [ ] `data-testid` attributes added to all components listed in section 3
- [ ] `e2e/fixtures/collab.ts` provides `todoPage`, `twoUsers`, and helper utilities
- [ ] `e2e/todo-crud.spec.ts` — all 10 scenarios pass
- [ ] `e2e/todo-collaboration.spec.ts` — all 5 scenarios pass
- [ ] `e2e/presence.spec.ts` — all 4 scenarios pass
- [ ] `e2e/undo-redo.spec.ts` — all 6 scenarios pass
- [ ] `e2e/persistence.spec.ts` — all 2 scenarios pass
- [ ] `pnpm test:e2e` works from both root and `examples/nuxt-app/`
- [ ] Tests pass with `workers: 1` against a production build (`nuxt preview`)
- [ ] No flaky tests on 3 consecutive CI-like runs
- [ ] `.gitignore` updated for `test-results/`, `playwright-report/`, `blob-report/`
- [ ] Drag-to-reorder test placeholder exists (skipped, with TODO comment)

## Success Metrics

- 27 e2e test cases covering single-user CRUD, collaboration sync, presence, undo/redo, and persistence
- All tests pass deterministically with `workers: 1`
- Test suite completes in under 60 seconds on a local machine
- Tests use stable `data-testid` selectors (not CSS classes)

## Dependencies & Risks

**Dependencies:**
- `@playwright/test` (latest stable, ~1.58)
- Playwright Chromium browser binary (installed via `npx playwright install chromium`)
- `vue-yjs` library must be built before the Nuxt app can build

**Risks:**
| Risk | Impact | Mitigation |
|---|---|---|
| WebSocket sync flakiness | Tests fail intermittently | Auto-retrying assertions with 5s timeout for cross-context checks |
| SQLite state leaking between tests | False positives/negatives | Global setup deletes DB; sequential execution |
| SortableJS drag simulation | Tests unreliable | Deferred to follow-up PR |
| Nuxt preview mode WebSocket issues | Server doesn't start correctly | Fallback to `nuxt dev` if needed |
| Awareness cleanup timing | Presence tests flaky | Auto-retry assertions on presence dot count |

## References & Research

### Internal References
- Nuxt example guide: `docs/nuxt-example-guide.md`
- Testing guide: `docs/testing-guide.md`
- Nuxt app components: `examples/nuxt-app/app/components/`
- Server WebSocket handler: `examples/nuxt-app/server/routes/_ws.ts`
- Persistence logic: `examples/nuxt-app/server/utils/yjs-persistence.ts`

### External References
- [Playwright docs: webServer config](https://playwright.dev/docs/test-webserver)
- [Playwright docs: browser contexts](https://playwright.dev/docs/browser-contexts)
- [Playwright docs: auto-retrying assertions](https://playwright.dev/docs/test-assertions)
- [Playwright docs: locators best practices](https://playwright.dev/docs/locators)
- [Playwright docs: CI integration](https://playwright.dev/docs/ci-intro)
