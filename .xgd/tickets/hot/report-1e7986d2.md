---
uid: report-1e7986d2
id: REPORT-1525
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-08-07T02:36:14.003031+00:00'
updated_at: '2026-08-07T02:36:14.003031+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-3bf94bd4
---

UATs written and passing. No runtime code and no existing tests were touched.

## What I did

Read the story and all 14 ACs, then the code that delivers the gesture: `packages/framework/src/l1/edit-client.ts` (the bridge), `packages/site-schema/src/l1/edit.ts` (the stamp contract and field derivation), `apps/control-app/src/builder/{editor,api,main,app}.js` (the host half), and `tools/generate/src/cli/builder.ts` (the origin, including the `/framework/*.js` type-strip route and `/api/copy`). Matched the existing patterns in `req117-copy-editing.test.ts`, `req117-modal-dismiss.test.ts` and `reconciliation-builder-workspace-origin.test.ts`.

Two files, split by what they can measure without the out-of-band `@gendevlabs/webui-*` install:

- **`tests/reconciliation-copy-edit-gesture.test.ts`** (node env) — the pointer, address resolution, the origin round trip, and the page the operator is left looking at. Drives real `1c render --edit` bytes through a real DOM and real HTTP against a real builder origin. Two criteria get **real browser evidence** here without needing the components at all, by loading `/preview/…/edit/` and injecting the origin's own `/framework/edit-client.js`: AC-993 measures every region's `getBoundingClientRect()` before and while hovered (the geometry claim), and AC-1006 proves the served module actually imports and runs in a browser.
- **`tests/reconciliation-copy-edit-gesture-modal.test.ts`** (jsdom env) — the dialog the gesture opens, driving the real `defaultModal` (not the injected double that once hid the temporal-dead-zone bug), with the only shim being the URL rebasing a browser supplies for free.

## Coverage caveat, reported not hidden

`@gendevlabs/webui-*` is absent in this worktree (`webuiPackageDir` resolves upward from the worktree and the artifact store lives under `~/lagrangefoundry/`), so the form component cannot mount. Following the story's stated policy and the pattern in the adjacent bundle tests, each affected criterion asserts its component-independent core unconditionally and prints a loud `NOT VERIFIED` line for the rest; AC-1002 is *entirely* about the dialog's dismissal routes, so it skips outright rather than claiming a green it didn't earn. Components are never mocked.

## One pre-existing failure, not mine

`tests/reconciliation-edit-render-channel.test.ts > test_UAT_AC950_carousel_slides_are_all_visible…` fails on its own, with my files absent. It belongs to a different plan item in this bundle; I left it alone per the no-existing-test-modification constraint.

```
UATs generated for story story-3bf94bd4 (plan item 3 of 6)

Story: story-3bf94bd4
Test file(s) created:
  - tests/reconciliation-copy-edit-gesture.test.ts
  - tests/reconciliation-copy-edit-gesture-modal.test.ts

Tests written: 14   (one per AC: AC-993 … AC-1006)
Tests passed:  13
Tests skipped:  1   (AC-1002 — webui components not installed)
Tests failed:   0

test_files_created:
  - "tests/reconciliation-copy-edit-gesture.test.ts"
  - "tests/reconciliation-copy-edit-gesture-modal.test.ts"
```
