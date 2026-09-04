---
uid: report-6b8e4dd6
id: REPORT-3331
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-02T19:30:05.989327+00:00'
updated_at: '2026-09-02T19:30:05.989327+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/request-18a48d63.md` — **UU**, intent/bookkeeping ticket (rule 2e).
  Resolved per-fact, not whole-file:
  - **`fields.commits` (the incoming commit's actual operation)** — no conflict. Both
    sides are byte-identical here: the orphan `working_sha: 7ebc721b…` entry is already
    gone and `7ebc721b83ab6202fdec600cd0493b69964bac39` is already merged into the
    surviving entry's `working_sha_history` between `b71a8641…` and `761b7fbd…`.
    A post-watermark sync already landed this data fix on the bundle branch.
  - **status block (`updated_at`, `completed_at`, `last_field_updated`, `status`)** —
    the only genuinely conflicting fact. Same fields, different values on each side, so
    the timeline rule applies: HEAD's side is later-positioned and was kept.
    - HEAD (`ecd40fbcbd`, 2026-08-31): `status: free_and_reconciled`,
      `completed_at` set, `updated_at: 2026-08-31T14:22:42`.
    - Incoming (`6788b08404`, 2026-08-23): `status: ready_to_reconcile`,
      `completed_at: null`, `updated_at: 2026-08-24T01:14:03`.
    HEAD's lineage runs `ready_to_reconcile` → `bundled` → `free_and_reconciled`
    (`ecd40fbcbd` shows the `bundled` → `free_and_reconciled` transition), so the
    incoming side's `ready_to_reconcile` is an earlier point on that same lifecycle —
    ambient frontmatter carried by a `last_field_updated: commits` write, not a
    competing status intent. The incoming commit message states its operation
    explicitly: "merge orphaned working_sha 7ebc721b … into the surviving entry's
    working_sha_history … no code change." Nothing in it claims the status field.
  - **`fields.bundled_in: bundle-b3b7c399`** — HEAD-only addition, absent from the
    incoming side and untouched by it. Non-overlapping, so it was kept.

No fields were invented, and no `intent_uid`/`story_uid`/`capability_uid` was touched.

## Incoming changes preserved

Confirmed present in the resolved file. The incoming commit `6788b08404` touched
exactly one file and made exactly one substantive change — the `working_sha_history`
data fix (BUG-1265) — and both halves of it are verified in the staged result:

- `7ebc721b83ab6202fdec600cd0493b69964bac39` present in `working_sha_history`
  (line 40), in the incoming's authored position.
- The standalone orphan entry (`working_sha: 7ebc721b…` with `working_sha_history: []`)
  is absent, as the incoming diff requires.

Nothing was dropped under the BUG-1301 precedence exception; no code or test files
were involved in this conflict.

**Note for the finalize step:** the staged tree nets to no diff vs HEAD
(`git diff --cached HEAD` is empty). This is the redundant-commit case
(BUG-1109/BUG-1122), *not* a discard: the incoming commit's key changes are present
in HEAD via an earlier sync, which is precisely the distinction STEP 3 draws. Per
STEP 4 this was staged and exited normally; `--skip` was not called, and the
cherry-pick sequencer state was left intact.
