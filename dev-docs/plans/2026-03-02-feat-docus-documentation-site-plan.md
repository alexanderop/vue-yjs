---
title: "feat: Add Docus documentation site to monorepo"
type: feat
status: active
date: 2026-03-02
---

# Add Docus Documentation Site to Monorepo

## Overview

Add a documentation site for the vue-yjs library using [Docus v5](https://github.com/nuxt-content/docus) as a new top-level workspace in the pnpm monorepo. The site will include a polished landing page, API reference for all 13 public exports, and live interactive examples powered by `vue-yjs` as a workspace dependency.

## Problem Statement / Motivation

vue-yjs currently has no public-facing documentation beyond the root README. Developers discovering the library have no guided onboarding path, no interactive demos showing real-time collaboration in action, and no structured API reference. A dedicated docs site will:

- Reduce the barrier to adoption with a clear getting-started guide
- Showcase the library's value through live interactive demos
- Provide searchable, structured API documentation for all composables
- Improve discoverability via SEO and AI/LLM indexing

## Proposed Solution

Use Docus v5.7.0 (a Nuxt 4 layer) to build a documentation site at a new top-level `docs/` workspace. This choice aligns with the existing Nuxt expertise in the monorepo and provides built-in `llms.txt` generation, MDC syntax for embedding Vue components in markdown, and Nuxt UI-powered theming.

## Technical Approach

### Phase 1: Monorepo Plumbing

Restructure the repository to accommodate the docs workspace without breaking existing workflows.

#### 1.1 Relocate existing internal docs

The current `docs/` directory contains internal developer guides referenced by `CLAUDE.md`. These must move to make room for the Docus site.

- [ ] Rename `docs/` to `dev-docs/`
- [ ] Update all references in `CLAUDE.md`:
  - `docs/vue-yjs-patterns.md` → `dev-docs/vue-yjs-patterns.md`
  - `docs/nuxt-example-guide.md` → `dev-docs/nuxt-example-guide.md`
  - `docs/testing-guide.md` → `dev-docs/testing-guide.md`
  - `docs/new-composable-checklist.md` → `dev-docs/new-composable-checklist.md`
- [ ] Move `docs/plans/` to `dev-docs/plans/` (update any references)
- [ ] Verify no other files reference `docs/` paths (grep the codebase)

#### 1.2 Create the docs workspace

- [ ] Scaffold Docus project at `docs/`:

```
docs/
├── content/                  # Markdown documentation (MDC)
│   ├── index.md              # Landing / hero page
│   ├── 1.getting-started/
│   └── 2.composables/        # API reference
├── app/
│   ├── app.config.ts         # Docus theming & branding
│   └── components/
│       └── content/          # Custom MDC components (auto-imported)
│           ├── YjsDemo.vue   # Reusable demo wrapper
│           └── SplitPane.vue # Two-panel collaboration demo
├── public/                   # Static assets (logo, favicon, og-image)
├── assets/
│   └── css/
│       └── main.css          # Design token overrides (Vue green)
├── nuxt.config.ts
├── package.json
└── tsconfig.json
```

- [ ] Create `docs/package.json`:

```json
{
  "name": "vue-yjs-docs",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "nuxt dev --extends docus",
    "build": "nuxt build --extends docus",
    "generate": "nuxt generate --extends docus",
    "typecheck": "nuxt typecheck"
  },
  "dependencies": {
    "docus": "^5.7.0",
    "nuxt": "^4.3.0",
    "better-sqlite3": "^12.6.0",
    "vue-yjs": "workspace:*",
    "yjs": "^13.6.0"
  }
}
```

- [ ] Update `pnpm-workspace.yaml`:

```yaml
packages:
  - packages/*
  - examples/*
  - docs
```

- [ ] Update root `package.json` scripts:

```json
{
  "build": "pnpm build:vue-yjs && pnpm --filter 'vue-yjs-example-app' exec -- pnpm build && pnpm --filter 'vue-yjs-example-nuxt-app' exec -- pnpm build && pnpm --filter 'vue-yjs-docs' exec -- pnpm build",
  "typecheck": "pnpm --filter 'vue-yjs' exec -- pnpm typecheck && pnpm --filter 'vue-yjs-example-app' exec -- pnpm typecheck && pnpm --filter 'vue-yjs-example-nuxt-app' exec -- pnpm typecheck && pnpm --filter 'vue-yjs-docs' exec -- pnpm typecheck",
  "dev:docs": "pnpm build:vue-yjs && pnpm --filter 'vue-yjs-docs' dev"
}
```

- [ ] Add `docs/.nuxt/`, `docs/.output/`, `docs/node_modules/` to root `.gitignore`
- [ ] Add docs build output paths to `.oxlintrc.json` `ignorePatterns`
- [ ] Add `vue-yjs-docs` to `.changeset/config.json` `ignore` array

#### 1.3 Create `docs/nuxt.config.ts`

```ts
export default defineNuxtConfig({
  site: {
    name: 'vue-yjs',
    url: 'https://vue-yjs.dev', // TBD: actual domain
  },
  css: ['~/assets/css/main.css'],

  // Required: transpile workspace dependency for Nuxt bundling
  build: {
    transpile: ['vue-yjs'],
  },
})
```

> **Open question**: Confirm the actual domain before deploying. `vue-yjs.dev` is a placeholder.

#### 1.4 Create `docs/app/app.config.ts`

```ts
export default defineAppConfig({
  titleTemplate: '%s - vue-yjs',
  title: 'vue-yjs',
  description: 'Vue 3 composables for Yjs real-time collaboration',
  header: {
    title: 'vue-yjs',
  },
  socials: {
    github: 'https://github.com/<org>/vue-yjs',
    npm: 'https://www.npmjs.com/package/vue-yjs',
  },
  github: {
    url: 'https://github.com/<org>/vue-yjs',
    branch: 'main',
    rootDir: 'docs/content',
  },
  ui: {
    colors: {
      primary: 'green', // Vue green
      neutral: 'slate',
    },
  },
})
```

### Phase 2: Landing Page

Build a polished hero page that immediately communicates the library's value.

- [ ] Create `docs/content/index.md` with:
  - Hero section: tagline ("Vue 3 composables for Yjs") + one-line description
  - Feature grid: Real-time sync, Type-safe, Offline support, Awareness/presence, Undo/redo, Zero-config room setup
  - Before/after code comparison (raw Yjs vs. vue-yjs)
  - Quick install snippet: `pnpm add vue-yjs yjs`
  - CTA buttons: "Get Started" / "View on GitHub"
- [ ] Add logo/favicon to `docs/public/`
- [ ] Configure Vue green theme in `docs/assets/css/main.css`:

```css
@theme {
  --color-primary-500: #42b883;
}
```

### Phase 3: Getting Started Guide

A linear path from zero to a working collaborative app in under 5 minutes.

- [ ] Create `docs/content/1.getting-started/.navigation.yml`:

```yaml
title: Getting Started
icon: i-heroicons-rocket-launch
```

- [ ] Create `docs/content/1.getting-started/1.installation.md`:
  - Prerequisites (Vue 3, Node 18+)
  - Install command (`pnpm add vue-yjs yjs`)
  - Optional peer deps (`y-websocket`, `y-indexeddb`)
- [ ] Create `docs/content/1.getting-started/2.quick-start.md`:
  - Minimal example: `useProvideYDoc` + `useYMap` in two components
  - Explain the provide/inject pattern
  - Link to composable reference for next steps
- [ ] Create `docs/content/1.getting-started/3.concepts.md`:
  - Brief Yjs primer for Vue developers
  - Y.Doc, shared types, providers, awareness
  - Why `shallowRef` (link to architecture decisions)

### Phase 4: API Reference

One page per composable, following a consistent template. Hand-written for quality, with TypeScript signatures extracted from source.

#### Composable page template

Each page follows this structure:

```markdown
---
title: useYMap
description: Reactive binding to a Yjs Y.Map with typed operations
---

# useYMap

Brief description of what this composable does.

## Usage

\`\`\`vue
<script setup lang="ts">
import { useYMap } from 'vue-yjs'
// minimal working example
</script>
\`\`\`

## Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| ... | ... | ... | ... |

## Return Value

| Property | Type | Description |
|----------|------|-------------|
| ... | ... | ... |

## Options

(if applicable)

## Live Demo

::yjs-demo{title="useYMap Demo"}
Interactive demo here
::

## Type Declarations

\`\`\`ts
// Full TypeScript interface
\`\`\`

## Related

- [useY](/composables/use-y) — Generic reactive binding
- [useYArray](/composables/use-y-array) — For array types
```

#### Pages to create

Organized by category in the sidebar:

- [ ] `docs/content/2.composables/.navigation.yml` — Section config
- [ ] **Core**
  - [ ] `docs/content/2.composables/1.core/1.use-provide-y-doc.md` — useProvideYDoc
  - [ ] `docs/content/2.composables/1.core/2.use-y-doc.md` — useYDoc
  - [ ] `docs/content/2.composables/1.core/3.use-y.md` — useY (generic)
  - [ ] `docs/content/2.composables/1.core/4.use-y-room.md` — useYRoom (all-in-one)
- [ ] **Shared Types**
  - [ ] `docs/content/2.composables/2.shared-types/1.use-y-map.md` — useYMap
  - [ ] `docs/content/2.composables/2.shared-types/2.use-y-array.md` — useYArray
  - [ ] `docs/content/2.composables/2.shared-types/3.use-y-text.md` — useYText
- [ ] **Providers**
  - [ ] `docs/content/2.composables/3.providers/1.use-web-socket-provider.md` — useWebSocketProvider
  - [ ] `docs/content/2.composables/3.providers/2.use-indexed-db.md` — useIndexedDB
- [ ] **Collaboration**
  - [ ] `docs/content/2.composables/4.collaboration/1.use-awareness.md` — useAwareness
  - [ ] `docs/content/2.composables/4.collaboration/2.use-undo-manager.md` — useUndoManager
- [ ] **Utilities**
  - [ ] `docs/content/2.composables/5.utilities/1.to-y-type.md` — toYType

### Phase 5: Live Demo Components

Build reusable MDC components for interactive examples. All demos use `<ClientOnly>` to avoid SSR crashes.

#### 5.1 Base demo wrapper — `docs/app/components/content/YjsDemo.vue`

- [ ] Create `YjsDemo.vue`:
  - Wraps content in `<ClientOnly>` with a code-block placeholder for SSR
  - Creates an isolated `Y.Doc` per demo instance (unique room name via `crypto.randomUUID()`)
  - Provides the doc via `useProvideYDoc`
  - Includes a "Reset" button that destroys and recreates the doc
  - Handles errors gracefully with a user-friendly message
  - Cleans up Y.Doc on component unmount

#### 5.2 Split-pane demo — `docs/app/components/content/SplitPane.vue`

- [ ] Create `SplitPane.vue`:
  - Accepts a default slot that receives a `Y.Doc` prop
  - Renders the slot content twice in side-by-side panels, each receiving the same `Y.Doc` instance
  - Both panels call composables independently (e.g., both call `useYMap(doc.getMap('demo'))`) — changes in one panel reactively update the other since they share the underlying Y.Doc
  - Labels: "Client A" / "Client B"
  - No networking needed — a single shared `Y.Doc` is sufficient to demonstrate reactive sync

**Important SSR constraint**: Every demo component that uses vue-yjs composables MUST be wrapped in `<ClientOnly>`. The composables use browser-only APIs (`WebSocket`, `IndexedDB`, DOM). During SSR, Docus renders a static placeholder (e.g., the code snippet the demo illustrates).

> **Out of scope for v1**: Networking demos (WebSocket-connected `useWebSocketProvider`, `useYRoom`, `useAwareness` demos) require a server runtime. These are deferred to a future SSR deployment. For now, these composable pages show static code examples only. The split-pane demos use a shared local `Y.Doc` (no network) which is sufficient to demonstrate reactivity.

### Phase 6: CI & Deployment (SSG)

Deploy as a static site (SSG). This is the simplest path and sufficient for a landing page + API reference.

- [ ] Add docs build to existing CI workflow (`test-and-checks.yml`):
  - Add a `build-docs` job that runs `pnpm --filter vue-yjs-docs generate`
  - Depends on library build completing first
  - Typecheck docs workspace
- [ ] Create deployment workflow (`deploy-docs.yml`):
  - Trigger: push to `main`
  - Build: `pnpm --filter vue-yjs-docs generate`
  - Deploy static output to Vercel (aligns with existing `deploy-example.yml`)
- [ ] Verify search indexes composable pages correctly
- [ ] Verify `llms.txt` is generated in the static output (built into Docus via nuxt-llms)

## Acceptance Criteria

### Functional Requirements

- [ ] `pnpm install` succeeds with the new docs workspace
- [ ] `pnpm dev:docs` starts a local Docus dev server with hot reload
- [ ] Landing page renders with hero, feature grid, and install snippet
- [ ] All 13 composable exports have an API reference page
- [ ] At least 3 composables have working live demos (`useYMap`, `useYArray`, `useYText`)
- [ ] Live demos work in the browser without SSR errors
- [ ] Search (Cmd+K) finds composables by name
- [ ] `llms.txt` is generated at the site root

### Non-Functional Requirements

- [ ] `pnpm build` (root) still succeeds with docs included
- [ ] `pnpm typecheck` (root) includes docs workspace
- [ ] `pnpm lint:check` does not error on docs-generated files
- [ ] Lighthouse performance score > 90 for landing page (SSG)
- [ ] All pages have proper `<title>` and `<meta description>` for SEO
- [ ] Dark mode works out of the box (Docus default)

### Quality Gates

- [ ] No SSR errors during `nuxt build` or `nuxt generate`
- [ ] All demo components clean up Y.Doc instances on unmount (no memory leaks)
- [ ] Existing library tests still pass (`pnpm test`)
- [ ] Existing example apps still build (`pnpm build`)

## Dependencies & Prerequisites

| Dependency | Version | Purpose |
|---|---|---|
| docus | ^5.7.0 | Documentation framework (Nuxt 4 layer) |
| nuxt | ^4.3.0 | Core framework (peer dep of Docus) |
| better-sqlite3 | ^12.6.0 | Nuxt Content local DB (peer dep of Docus) |
| vue-yjs | workspace:* | Library for live demos |
| yjs | ^13.6.0 | Yjs core for demo Y.Doc instances |

**Note**: `better-sqlite3` requires native compilation. CI environments must support building native Node modules.

## Risk Analysis & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| SSR crash from browser-only APIs in demos | High | Build failure | Wrap ALL demos in `<ClientOnly>`. Test `nuxt generate` in CI. |
| `better-sqlite3` build failure in CI | Medium | CI broken | Pin version. Use Node.js version with prebuilt binaries. Add to CI cache. |
| Nuxt version conflict with existing nuxt-app | Low | Build failure | Both use `^4.x`. pnpm resolves independently per workspace. Monitor. |
| Docus breaking change in minor release | Low | Build failure | Pin Docus to `~5.7.0` (patch only) initially. |
| Demo state contamination between page visits | Medium | Bad UX | Unique room names per demo. Destroy Y.Doc on route leave. |
| Docs drifting out of sync with library API | High | Misleading docs | Add a checklist item to `dev-docs/new-composable-checklist.md`: "Create docs page". |

## Future Considerations

- **SSR deployment + networking demos**: Switch from SSG to SSR to enable WebSocket-connected demos, Docus AI assistant, and MCP server for IDE integration. This is the natural next step once the static site is live.
- **Versioned docs**: When vue-yjs hits 1.0, add version selector via branch-based deploys.
- **Auto-generated API reference**: Consider TypeDoc → markdown pipeline if manual maintenance becomes burdensome.

## References & Research

### Internal References

- Library exports: `packages/vue-yjs/src/index.ts`
- Existing README content: `README.md` (247 lines, comprehensive)
- WebSocket server pattern: `examples/nuxt-app/server/routes/_ws.ts`
- Composable JSDoc comments: `packages/vue-yjs/src/use*.ts`
- Current workspace config: `pnpm-workspace.yaml`

### External References

- [Docus v5 documentation](https://docus.dev/en)
- [Docus GitHub repository](https://github.com/nuxt-content/docus)
- [Docus v3 announcement (architecture)](https://content.nuxt.com/blog/docus-v3)
- [MDC syntax reference](https://content.nuxt.com/docs/files/markdown)
- [Nuxt Content v3](https://content.nuxt.com/)
- [nuxt-llms module](https://nuxt.com/modules/llms)
- [Docus issue #1282](https://github.com/nuxt-content/docus/issues/1282) — Sub-route embedding limitations
