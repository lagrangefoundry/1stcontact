---
uid: report-d0cf7c88
id: REPORT-1517
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-08-07T01:58:03.695347+00:00'
updated_at: '2026-08-07T01:58:03.695347+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-e674c60a
---

Both new files run clean against the neighbouring suites. Here's where things stand.

## What I built

Two UAT files — 21 tests, one per acceptance criterion (AC-959 … AC-979), split by vitest environment as the project already does (node for the origin/Worker, jsdom for the chrome):

- `tests/reconciliation-builder-workspace-origin.test.ts` — 11 UATs driving the builder origin over HTTP (`startBuilder`), the `control-app` Worker under `unstable_dev`, and the `1c` command functions.
- `tests/reconciliation-builder-workspace-chrome.test.ts` — 10 UATs mounting the real workspace in jsdom against the actually-installed components.

No runtime code changed, no existing test touched.

## Test run

```
Tests  21 total — 11 passed | 1 failed | 9 skipped
```

**9 skipped** are the component-mounting suites. The `@gendevlabs/webui-*` components are not installed on this machine (I verified: all three fail `require.resolve`), which is the coverage gap the story's Technical Context declares. They skip with a reported reason rather than passing silently. Where a criterion had a substantial component-independent core (AC-961's vendored-source scan, AC-977's browser-source and three rendered channels, AC-978's two reachable trees, AC-960's source-tree search) I assert that core unconditionally and `console.warn` loudly about the part this machine cannot reach — so those four are producing real evidence rather than nothing.

## One failure — this is a code/AC divergence, not a bad test

`test_UAT_AC978_every_served_tree_refuses_a_request_that_escapes_it` → **expected 403, got 404**.

AC-978 states the refusal explicitly ("returning a forbidden status", and the verification repeats it). The code cannot produce it. In `tools/generate/src/cli/serve.ts:75-76`:

```ts
const abs = path.join(rootDir, path.normalize(rel))
if (!abs.startsWith(rootDir)) return 'forbidden'
```

All three call sites in `builder.ts` pass a `/`-prefixed path, and `path.normalize` collapses leading `..` on an absolute path — so `abs` is always inside `rootDir`, the `'forbidden'` branch is unreachable, and every traversal attempt falls through to a failed `stat` → 404. I probed seven variants (raw `../`, `%2e%2e`, `..%2f`, and mid-path forms) across all three trees; every one returned 404.

The security property itself holds — no targeted file contents leak, and that half of every assertion passed. It is only the status that diverges. I did not weaken the assertion to 404, per the reconciliation rule that the AC is the arbiter; the fix is either making the guard fire before normalisation or amending the AC, and that is the fix-it loop's call, not mine.

One note on scope I should flag: `path.normalize` running before the confinement check also means the existing `test_UAT_FC_REQ-115_static_trees_refuse_traversal` passes only because it accepts `[403, 404]` — so this divergence predates my tests rather than being introduced by them.

```
UATs generated for story story-e674c60a (plan item 1 of 6)

Story: story-e674c60a
Test file(s) created:
  - tests/reconciliation-builder-workspace-origin.test.ts
  - tests/reconciliation-builder-workspace-chrome.test.ts

Tests written: 21
Tests passed: 11
Tests failed: 1
Tests skipped: 9  (webui components not installed — declared coverage gap)

⚠️ TESTS FAILING — downstream fix-it loop required

Failures:
  - test_UAT_AC978_every_served_tree_refuses_a_request_that_escapes_it:
    AC requires a forbidden (403) status for a request escaping any served
    tree; serve.ts:75-76 normalises `..` before the confinement check, making
    the 'forbidden' branch unreachable, so every traversal returns 404.
    No file contents leak — the status alone diverges.

test_files_created:
  - "tests/reconciliation-builder-workspace-origin.test.ts"
  - "tests/reconciliation-builder-workspace-chrome.test.ts"
```
