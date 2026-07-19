---
uid: report-d6fd60ec
id: REPORT-583
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-6'
created_by: xgd
created_at: '2026-07-19T01:39:45.297191+00:00'
updated_at: '2026-07-19T01:39:45.297191+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-6
---

## Files resolved

- `package.json` — class UU (both modified). Rule: version-field bookkeeping conflict. Ours (HEAD, `sync_working_to_main`) at `0.0.155`; incoming (`free_coded`, "remaining length dials are absolute-or-overlay") bumped `0.0.124→0.0.125`. Kept HEAD's `0.0.155` — never regress the reconciled version; incoming's version delta is churn, not developer code. All 6 code/test files in the incoming commit applied cleanly (no conflict) and are byte-identical to the incoming version.

## Incoming changes preserved

Verified via `git diff 8d9ce579 045887d2 -- <file>` (incoming SHA vs resolved commit) — IDENTICAL for every code/test file:
- `packages/framework/src/modules/header/index.astro` — IDENTICAL
- `packages/framework/src/modules/hero/index.astro` — IDENTICAL
- `packages/framework/src/modules/services-grid/index.astro` — IDENTICAL
- `packages/framework/src/modules/text-block/index.astro` — IDENTICAL
- `tests/req36-heading-treatment.test.ts` — IDENTICAL
- `tests/req49-fidelity-primitives.test.ts` — IDENTICAL

The only incoming change NOT carried forward is the `package.json` version bump to `0.0.125`, deliberately superseded by HEAD's later `0.0.155`. No developer code discarded.

## State note

The conflict was resolved and the cherry-pick was already continued/committed in the preceding step: HEAD is now the resolved incoming commit `045887d2`, `CHERRY_PICK_HEAD` is absent, and the tree is clean (`git status --porcelain` empty). No further git state transition performed by this step.
