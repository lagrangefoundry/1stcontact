---
uid: report-7fb9b75f
id: REPORT-4339
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-18T07:32:57.566667+00:00'
updated_at: '2026-09-18T07:32:57.566667+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-a98fb3b0.md` — class **UU**, rule **2e** (intent/bookkeeping
  ticket). Conflict was confined to the lifecycle block of the frontmatter
  (`updated_at`, `completed_at`, `last_field_updated`, `status`). Both sides changed
  the same facts, so the per-fact timeline rule applies: HEAD is the later-positioned
  side (`updated_at: 2026-08-31T19:19:34Z`) versus incoming
  `0431fed4c6` (`updated_at: 2026-08-25T22:52:44Z`). Resolved with
  `git checkout --ours`, which also preserves HEAD's non-overlapping addition
  `fields.bundled_in: bundle-78f4e2fe` (a field the incoming side never touched).
  No content was invented; no `intent_uid` / `story_uid` / `capability_uid` was altered.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-a98fb3b0.md` — the incoming commit's only substantive change is
  the lifecycle advance `status: free_coded -> ready_to_reconcile` (with the matching
  `last_field_updated: story_points -> status` and `updated_at` bump). That intent is
  **present in HEAD via a later route**, not discarded: HEAD carries the same ticket
  further along the same lifecycle to `status: free_and_reconciled` with
  `completed_at` set and `last_field_updated: status`. `ready_to_reconcile` is an
  intermediate state that `free_and_reconciled` supersedes, so re-applying the incoming
  values would regress the ticket. STEP 3's discard guard therefore does not trigger.

Staged result nets to **no diff vs HEAD** — this is the redundant-commit case described
in STEP 4 (BUG-1109/BUG-1122), not a discarded one. `--skip` was not called; the
cherry-pick sequencer state (`CHERRY_PICK_HEAD`) is left intact for
`cherry_pick_finalize_resolution`.

No code, config, or UAT test files were involved in this conflict; the BUG-1301
precedence exception was not used.
