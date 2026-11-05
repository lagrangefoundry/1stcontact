---
uid: report-97fc0e15
id: REPORT-1077
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-08-02T17:55:24.186171+00:00'
updated_at: '2026-08-02T17:55:24.186171+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: dccfa99b
  parent_report_uid: report-0d908354
  batch_index: '0'
---

Fixed and verified.

## Diagnosis

The failing test was not a REQ-37 regression — the launcher's HMR fix (`ws: false`) was intact. The actual failure was a workspace-wide module-resolution break:

```
Failed to resolve entry for package "@1stcontact/site-schema".
```

`packages/site-schema/package.json` was the only workspace package still pointing its `exports` at a compiled `./dist/` (`main`/`types`/`exports`/`files` all dist-based, plus a `tsc` build script). `dist/` is gitignored repo-wide and nothing builds it before tests, so in a fresh checkout the entry never existed. `@1stcontact/framework` and `@1stcontact/generate` both export raw source (`"." : "./src/index.ts"`) and are transpiled by Vite/Astro/Vitest — site-schema was a leftover from the original scaffold that had drifted out of that convention.

The launcher's `ssrLoadModule` therefore threw, the CLI exited 1, and `expect(res.status).toBe(0)` failed before the HMR assertions were ever reached. `packages/framework/src/l1/render.ts:14` hit the same wall — the break was suite-wide, not launcher-specific.

## Fix

`packages/site-schema/package.json:6` — replaced the dist-based `main`/`types`/`exports`/`files` and the `build` script with source export `"." : "./src/index.ts"`, matching framework and generate.
`packages/site-schema/tsconfig.json:3` — dropped the now-dead emit config (`noEmit: false`, `outDir`, `declaration`…), matching the framework tsconfig shape. Old config deleted rather than left behind, per the no-legacy-modes rule.

No test file was touched — the test's shape was already correct.

## Verification

- Batch test passes: `tests/req37-launcher.test.ts` — 1 passed.
- **Negative control** — temporarily removed `ws: false` from `tools/generate/bin/1c.mjs` and the test failed with `[ERROR] [vite] WebSocket server error: Port 24678 is already in use`. The evidence is real: the test genuinely proves REQ-37's behaviour rather than passing vacuously. Launcher restored, `git diff` on it clean.
- Full suite: **95 files passed | 3 skipped (98)**, **620 tests passed | 48 skipped** — the fix unblocked the whole suite, no regressions.
- `pnpm --filter @1stcontact/site-schema typecheck` exits 0.

Working diff is limited to the two site-schema manifest files. No commit made — this is a regression sub-process, so commit/ticket handling belongs to the outer workflow.
