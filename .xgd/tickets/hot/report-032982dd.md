---
uid: report-032982dd
id: REPORT-3334
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-02T19:36:33.316140+00:00'
updated_at: '2026-09-02T19:36:33.316140+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/bug-db356ff8.md` — UU, index-only conflict (path is outside
  the sparse-checkout cone, so there were no working-tree markers; resolved with
  `git checkout --ours` + `git add --sparse` per DOC-986 §2/§4.1).
  Class: intent/bookkeeping ticket → STEP 2 rule **2e**, applied per-fact.

  Incoming commit: `5af1ff949d4069fada2d2f0b4e17871aec5980c6` (2026-08-23,
  `xgd(ticket): update bug bug-db356ff8`).
  HEAD-side commit: `fefe99569a4a95eec545673c3249acf67d62a6f0` (2026-09-02,
  same subject).

  Per-fact analysis against the merge base (`863e47ac`):

  | Fact | Base | Incoming | HEAD | Kept |
  |---|---|---|---|---|
  | body — `## Status` paragraph rewrite | "Scope drafted…" | "Both halves landed and verified…" | identical to incoming | incoming (already in HEAD) |
  | body — `# Implementation — the tenant fix` section (+107 lines) | absent | added | identical to incoming | incoming (already in HEAD) |
  | `status` | draft | draft | free_and_reconciled | HEAD |
  | `completed_at` | null | null | 2026-08-31T19:19:38 | HEAD |
  | `last_field_updated` | body | body | status | HEAD |
  | `updated_at` | 2026-08-23T23:42 | 2026-08-24T01:48 | 2026-08-31T19:19 | HEAD |
  | `fields.story_points` / `fields.commits` / `fields.version` / `fields.bundled_in` | absent | absent | present | HEAD |

  HEAD is a strict superset: it carries the incoming commit's body edits
  verbatim, plus reconcile bookkeeping the incoming side never touched
  (`working_sha: ea48502d…`, `version: 0.2.10`, `bundled_in: bundle-78f4e2fe`)
  and the operator-owned status advance to `free_and_reconciled`. The only facts
  where the two sides disagree are the four frontmatter scalars above, and on
  every one of them the incoming value is the *older* state that HEAD's later
  intent has since superseded — taking the incoming side there would revert a
  completed, bundled ticket back to `draft` and drop the commit/version records.
  No field is present on the incoming side and absent from HEAD, so nothing had
  to be composed by hand and no content was invented.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-db356ff8.md` — confirmed. `git diff HEAD 5af1ff94 --
  .xgd/tickets/hot/bug-db356ff8.md` returns frontmatter hunks only; the entire
  body delta of the incoming commit (the `## Status` rewrite and the 107-line
  `# Implementation — the tenant fix` section documenting the `storeFor`
  bootstrap, the `UnknownTenantError.reason` split, and the five
  `test_UAT_FC_BUG-36_tenant_bootstrap` cases) is already byte-identical in
  HEAD. Nothing was discarded.

## Note on the staged result

The resolution nets to no diff vs HEAD — the staged blob is `6d962ce5db`, which
is HEAD's own blob. This is the redundant-commit case (BUG-1109/BUG-1122), not a
discard: STEP 3's distinguishing check passes, since the incoming commit's key
changes are *present* in HEAD via the post-watermark sync rather than merely
absent. Per STEP 4 I did not call `--skip`; the staged tree is left for
`cherry_pick_finalize_resolution` to detect and skip. `CHERRY_PICK_HEAD` is
untouched.

No code, test, or UAT files were involved in this conflict, so the BUG-1301
precedence exception did not arise.
