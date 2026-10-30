---
uid: report-3fbd04c6
id: REPORT-5474
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T05:30:16.216344+00:00'
updated_at: '2026-09-29T05:30:16.216344+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bug-93851fea.md` — class **AA** (both added), intent/bookkeeping
  ticket (`bug-*`), STEP 2e. Incoming (`d8ab3ec1b2 xgd(ticket): create bug
  bug-93851fea`) is the ticket's initial creation draft: `title: Untitled`,
  `status: draft`, `last_field_updated: created_at`, `updated_at` ==
  `created_at` (2026-09-01T20:41:58Z), body `(new ticket)`, and `fields`
  limited to `auto_merge_back`/`needs_review`/`priority`. HEAD is the same
  ticket after its full lifecycle: BUG-41, `status: free_and_reconciled`,
  `completed_at: 2026-09-14`, `updated_at: 2026-09-19T15:15:30Z`, plus
  `chat_comment`, `severity`, `commits`, `version`, `story_points`,
  `bundled_in`, and the Symptom / Root cause / Fix / Test plan body.
  HEAD is a **strict superset** of incoming — every fact incoming asserts is
  either present verbatim (`uid`, `id`, `type`, `created_by`, `created_at`,
  and all three incoming `fields` keys with identical values) or is the same
  field carrying a later value from a subsequent documented update. There is
  no field or section where the two sides state the same fact differently and
  incoming's version is lost. Per 2e ("one side a strict superset: keep the
  superset") the HEAD version was taken in full; this also agrees with the
  enrichment's timestamp rule (HEAD 2026-09-19 > incoming 2026-09-01).
  Resolved via `git checkout --ours`, staged with `git add --sparse`
  (`.xgd/tickets/` is outside this worktree's sparse-checkout cone, DOC-986
  §2/§4.1).

## Incoming changes preserved

- No code/implementation files were in conflict — incoming commit `d8ab3ec1b2`
  touches exactly one path, the ticket file above (1 file changed, 18
  insertions).
- No hunk was dropped under the BUG-1301 precedence exception; that exception
  was not invoked. Nothing incoming asserts is absent from the resolved file:
  its 18 inserted lines are the ticket's creation skeleton, and each of those
  facts survives in HEAD either unchanged or as the later value of the same
  field.
- Resulting staged tree is byte-identical to HEAD (`git diff --cached HEAD` is
  empty), so this cherry-pick carries no net change. Staging left clean; no
  `--continue`/`--skip`/`--quit`/`--abort` was run, and CHERRY_PICK_HEAD
  (`d8ab3ec1b26a3d2bc80abcc455efa770f6209af6`) is still present for the
  finalize step.
