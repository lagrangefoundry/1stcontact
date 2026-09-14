---
uid: report-0207e6f6
id: REPORT-573
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-6'
created_by: xgd
created_at: '2026-07-19T01:26:40.951571+00:00'
updated_at: '2026-07-19T01:26:40.951571+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-6
---

## Files resolved

- `package.json` — UU (both modified). Version-number collision only: OURS/HEAD `sync_working_to_main` = `0.0.155` (committed 2026-07-18); THEIRS/incoming free_coded = `0.0.119` (committed 2026-07-16). Intent unknown on the ours side → applied metadata rule "take the more recent commit by timestamp": HEAD (Jul 18) is newer, kept `0.0.155`. Incoming's only package.json change was a version bump (`0.0.118 → 0.0.119`), a bookkeeping bump superseded by the newer HEAD bump — no developer code involved. Flagged for post-merge review per rule.

## Non-conflicted incoming code (merged cleanly, staged)

The feature commit's actual code landed without conflict and is staged as M:
- `packages/framework/src/modules/dials.ts` — classifyLength/isLength present (5 symbol hits)
- `packages/framework/src/modules/types.ts` — 'length' schema type present (2 hits)
- `packages/framework/src/modules/validate.ts` — validateLength present (4 hits)
- `tests/req55-content-width.test.ts` — length-model UATs present (20 hits)

## Incoming changes preserved

Confirmed. The incoming commit (02ccf386) touched package.json only for a version bump — no code lost there. Every code/test file from the incoming diff is present in the staged tree with the incoming symbols intact (verified via `git show :<file> | grep`). No conflict markers remain anywhere in the worktree. CHERRY_PICK_HEAD left intact for cherry_pick_finalize_resolution.
