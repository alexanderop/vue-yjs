# vue-yjs

Vue 3 composables for Yjs. pnpm monorepo.

## Structure

- `packages/vue-yjs/` — library (published to npm)
- `examples/app/` — Vite SPA example
- `examples/nuxt-app/` — Nuxt 4 collaborative todo example
- `.react-yjs-reference/` — design reference only, not part of the library
- `docs/` — Docus documentation site (workspace)
- `dev-docs/plans/` — completed implementation plans (read-only reference)

## Commands

pnpm build          # Build library + both examples
pnpm test           # Run all vitest tests (parallel)
pnpm lint:fix       # oxlint auto-fix
pnpm lint:check     # oxlint CI mode (--deny-warnings)
pnpm typecheck      # vue-tsc across all packages
pnpm dev:vue        # Vite example dev server
pnpm dev:nuxt       # Nuxt example dev server

Run `pnpm lint:fix && pnpm typecheck` after code changes.

## Key Conventions

- **shallowRef** for all Yjs reactive state (never ref/reactive)
- **onScopeDispose** for cleanup (never onUnmounted)
- **provideLocal/injectLocal** for same-component provide/inject
- Tests colocated with source: `useY.ts` → `useY.test.ts`
- **withSetup** helper required for testing composables (see `test-utils.ts`)
- oxlint enforces lint rules — do not add manual style rules
- Pre-commit hook runs lint-staged automatically

## Testing

- vitest + happy-dom
- Yjs `observeDeep` fires synchronously — no `await nextTick()` needed
- Auto-created Y.Doc (no arg to useProvideYDoc) is destroyed on scope dispose
- Externally-provided Y.Doc is NOT destroyed — caller manages lifecycle

## Post-Work Validation (MANDATORY)

After completing ANY code changes, **always** spawn a subagent to run `pnpm lint:fix && pnpm typecheck`. If either fails, the subagent must fix all issues before reporting back. The main agent must NOT run these checks directly — delegate to a subagent every time.

## IMPORTANT

Read the relevant dev-docs/ file BEFORE starting work:

- Composable development → `dev-docs/vue-yjs-patterns.md`
- Nuxt example work → `dev-docs/nuxt-example-guide.md`
- Testing → `dev-docs/testing-guide.md`
- Adding a new composable → `dev-docs/new-composable-checklist.md`
