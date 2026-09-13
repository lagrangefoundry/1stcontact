---
uid: report-b23ee3d3
id: REPORT-4140
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-13T21:30:24.055745+00:00'
updated_at: '2026-09-13T21:30:24.055745+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bundle-8eef3846.md` — AA (both added), intent/bookkeeping ticket → rule 2e "one side is a strict superset of the other". Resolved by taking OURS (`git checkout --ours` + `git add --sparse`).

  - Incoming (`c2efcb99` "xgd(ticket): create bundle bundle-8eef3846", 2026-08-31T05:05Z) is the pure 369-line *creation* of the ticket.
  - Ours (692 lines, `updated_at` 2026-09-01T00:00Z, `last_field_updated: result`) is that same ticket already present via the seeded overlay and then advanced by later lifecycle updates.
  - Full-file diff confirms ours contains every line of the incoming version except the initial-state metadata that the later updates legitimately superseded: `updated_at`, `completed_at: null` → `2026-08-31T23:59:50Z`, `last_field_updated: created_at` → `result`, `status: ready_to_reconcile` → `free_and_reconciled`, and the two placeholder `commits[]` entries (`working_sha` 759cd874/29c0e86d, all `main_sha: null`) replaced by the reconciled entry `main_sha: 90527353c0fa4b9fd3ae91ba6285c7d791a25c53`. All prose/body sections are byte-identical on both sides.
  - Same-field conflicts (`status`, `completed_at`, `commits`) resolved per-fact to the later-positioned side, which is ours (2026-09-01 update vs 2026-08-31 create). Taking theirs would have regressed the bundle to `ready_to_reconcile` and discarded the `orphan_commits` mapping.
  - No fields invented; nothing present on either side was dropped.

## Incoming changes preserved

No code/implementation files were in conflict — the sole conflicted path is a bookkeeping ticket (rule 2e), not source.

STEP 3 check on that file: the incoming commit's content is present in HEAD, not absent. Every one of its 369 lines is in the resolved file apart from the initial metadata values that HEAD's own later, legitimate ticket updates advanced. This is the redundant-commit case (BUG-1109/BUG-1122), not a discard — the create's effect arrived via the seeded overlay before the cherry-pick reached it.

Consequently the staged tree nets to no diff vs HEAD (`git diff --cached HEAD` is empty). Per STEP 4 this is not a failure and `--skip` was not called; the finalize step will detect the clean staged diff. `CHERRY_PICK_HEAD` is untouched and still present.

No BUG-1301 precedence drops were needed. No UAT test functions were involved.
