---
uid: report-555c7e7c
id: REPORT-3376
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-02T22:00:46.803956+00:00'
updated_at: '2026-09-02T22:00:46.803956+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/bundle-b3b7c399.md` — **UU**, intent/bookkeeping ticket (rule **2e**), outside the sparse-checkout cone (staged with `git add --sparse`). Single conflicted hunk: the frontmatter block `updated_at` / `completed_at` / `last_field_updated` / `status`.
  - Incoming (`726b77db28`, 2026-08-27 20:57 -0700, free_coded): `status: reconciling` → `ready_to_reconcile`, `updated_at` → `2026-08-28T03:57:06Z`. Its diff is 2 insertions / 2 deletions and touches no other fact.
  - Ours (`8e07e6015d`, 2026-08-31 07:23 -0700): same bundle already at `status: free_and_reconciled`, with `completed_at: 2026-08-31T14:22:24Z`, `last_field_updated: result`, `result: pass`, `merged_at_commit: eef7a8b48b`, and the `commits` list collapsed to recorded `main_sha` values.
  - Both sides changed the SAME facts (`status`, `updated_at`) differently → genuine per-fact conflict → 2e timeline rule. HEAD is 4 days later and is a strictly later position in this bundle's own lifecycle: `ready_to_reconcile` is an earlier step of the same state machine that HEAD has already run to completion. This also matches the auto-enrichment guidance for this file ("take the more recent commit by timestamp"). Resolved via `git checkout --ours`, keeping HEAD's four frontmatter lines; no other section of the file was altered and no content was invented.
  - Flagged for post-merge review per the enrichment note (intent unknown on one/both sides).

## Incoming changes preserved

No code/implementation files were conflicted — the sole conflict is a bookkeeping ticket resolved under 2e's per-fact timeline rule, so STEP 3's code-discard guard does not apply.

For completeness: the incoming commit's only facts (`status: ready_to_reconcile`, `updated_at: 2026-08-28T03:57:06Z`) are intentionally not present in the resolution. They are superseded, not discarded — HEAD holds a later state of the very same lifecycle field (`free_and_reconciled` + `completed_at` + `result: pass`), written 4 days after the incoming commit. Restoring the incoming values would regress operator-owned bundle status backwards through the state machine.

Consequence: the staged diff for this cherry-pick is empty (no net change vs HEAD). Per STEP 4 this is left for `cherry_pick_finalize_resolution` to detect and skip; `--skip`/`--continue` were not invoked and CHERRY_PICK_HEAD is intact.
