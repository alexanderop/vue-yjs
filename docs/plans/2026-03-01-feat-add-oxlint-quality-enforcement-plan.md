---
title: Add oxlint for Code Quality Enforcement
type: feat
status: active
date: 2026-03-01
---

# Add oxlint for Code Quality Enforcement

Add [oxlint](https://oxc.rs) as the project's linter with CI enforcement and pre-commit hooks to catch bugs and enforce quality standards across the monorepo.

## Acceptance Criteria

- [ ] `.oxlintrc.json` at root with TypeScript + Vue plugins enabled
- [ ] `pnpm lint:check` runs oxlint across all packages with zero violations
- [ ] `pnpm lint:fix` auto-fixes what it can
- [ ] Pre-commit hook via `simple-git-hooks` + `lint-staged` blocks commits with lint errors
- [ ] New `lint` job in `.github/workflows/test-and-checks.yml` runs in parallel with test/build
- [ ] Existing codebase passes lint with zero errors

## Configuration

### `.oxlintrc.json` (root)

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["typescript", "unicorn", "oxc", "import", "vue", "vitest"],
  "categories": {
    "correctness": "error",
    "suspicious": "warn"
  },
  "rules": {},
  "overrides": [
    {
      "files": ["**/*.test.ts", "**/test-utils.ts"],
      "rules": {
        "typescript/no-non-null-assertion": "off"
      }
    }
  ],
  "ignorePatterns": [
    "dist/**",
    "**/*.vue.js",
    ".react-yjs-reference/**",
    ".changeset/**",
    "coverage/**"
  ]
}
```

**Rule choices:**
- `correctness: "error"` — catches definite bugs (on by default, upgrade to error for CI)
- `suspicious: "warn"` — catches likely bugs, promoted to errors in CI via `--deny-warnings`
- `pedantic`, `perf`, `style`, `restriction`, `nursery` — off (tighten later as needed)
- Test files relax `no-non-null-assertion` for the `let result!: T` pattern in `test-utils.ts`

**Plugins:**
- `typescript` — TS-specific rules (syntax-aware, no tsconfig needed)
- `vue` — Vue SFC `<script>` linting (`vue/prefer-import-from-vue`, `vue/no-import-compiler-macros`, etc.)
- `vitest` — test-specific rules
- `unicorn`, `oxc`, `import` — general quality rules

### Known Limitation: Vue Templates

oxlint lints `<script>` blocks in `.vue` files but **cannot lint `<template>` expressions**. This is an accepted trade-off because:
- `vue-tsc` already runs in the example app build (`vue-tsc && vite build`) and catches template type errors
- The library package (`packages/vue-yjs`) has no `.vue` files — only `.ts`
- Full Vue template support is on oxlint's [Q1 2026 roadmap](https://github.com/oxc-project/oxc/issues/15761)

## Dependencies to Install (root devDependencies)

```bash
pnpm add -Dw oxlint simple-git-hooks lint-staged
```

## Scripts (`package.json` root)

Replace the stale `lint:check` and add new scripts:

```json
{
  "scripts": {
    "lint:check": "oxlint -c .oxlintrc.json --deny-warnings",
    "lint:fix": "oxlint -c .oxlintrc.json --fix",
    "prepare": "simple-git-hooks"
  }
}
```

- `--deny-warnings` makes warnings fail CI (equivalent to old `--max-warnings=0`)
- `prepare` ensures hooks are installed on `pnpm install` for new contributors

## Pre-commit Hook Config (`package.json` root)

```json
{
  "simple-git-hooks": {
    "pre-commit": "pnpm exec lint-staged"
  },
  "lint-staged": {
    "*.{ts,vue}": "oxlint -c .oxlintrc.json --deny-warnings"
  }
}
```

The glob `*.{ts,vue}` naturally excludes `*.vue.js` generated files.

## CI: New `lint` Job

Add to `.github/workflows/test-and-checks.yml` as a parallel job:

```yaml
lint:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v4
    - uses: actions/setup-node@v4
      with:
        node-version: "20"
        cache: pnpm
    - run: pnpm install --frozen-lockfile
    - run: pnpm lint:check
```

## Implementation Steps

1. Install dependencies: `pnpm add -Dw oxlint simple-git-hooks lint-staged`
2. Create `.oxlintrc.json` at root with the config above
3. Update root `package.json`: replace `lint:check`, add `lint:fix`, add `prepare`, add `simple-git-hooks` + `lint-staged` config
4. Run `pnpm lint:check` — fix any violations in the existing codebase
5. Run `pnpm prepare` to install the git hook
6. Add `lint` job to `.github/workflows/test-and-checks.yml`
7. Test: stage a file with `debugger;`, confirm commit is blocked, then remove it

## References

- [oxlint docs](https://oxc.rs/docs/guide/usage/linter/config)
- [oxlint CI integration](https://oxc.rs/docs/guide/usage/linter/ci)
- Current stale lint script: `package.json:6` — references ESLint which is not installed
- CI workflow: `.github/workflows/test-and-checks.yml`
- Test utils with `!` assertion: `packages/vue-yjs/src/test-utils.ts:3`
