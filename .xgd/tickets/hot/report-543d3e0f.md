---
uid: report-543d3e0f
id: REPORT-3191
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T02:48:20.577993+00:00'
updated_at: '2026-09-01T02:48:20.577993+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/bug-6612c4b7.md` — UU, intent/bookkeeping ticket (rule 2e).
  Sparse-excluded path, so staged with `git add --sparse`.
  Incoming commit `e81f695e` ("xgd(ticket): update bug bug-6612c4b7",
  2026-08-24T21:57:19Z). Two conflict hunks, both confined to the YAML
  metadata block; bodies are byte-identical on both sides.

  1. `updated_at` / `last_field_updated` / `status` — same fields changed
     differently on each side, so the per-fact timeline rule applies. Ours is
     the later-positioned intent (`updated_at 2026-08-26T17:36:27Z`,
     `status: bundled`) vs incoming (`2026-08-24T21:57:19Z`,
     `status: free_coded`). Kept ours.
  2. `bundled_in: bundle-78f4e2fe` — present only on ours; the incoming side
     never had this field, so this is a HEAD-only addition, not a competing
     edit. Kept ours as the superset.

  No field from either side was invented or dropped beyond the superseded
  older bookkeeping values in hunk 1.

## Incoming changes preserved

Incoming `e81f695e`'s substantive payload is the `fields.commits[]` expansion
and version bump: `working_sha_history: []` on the first entry, two new
`working_sha` entries (`0fe586d1...`, `999579b3...`), and `version: 0.2.11`
-> `0.2.13`. All of it is already present in HEAD's blob (`54e03170`) — it
auto-merged as shared context (no conflict hunk covered that region), and
`git show HEAD:<path>` confirms the lines at L23, L24, L27 and L30.

The staged tree therefore nets to no diff vs HEAD (`git diff --cached --stat
HEAD` is empty). This is the BUG-1109/BUG-1122 redundant-commit case, not a
discard: STEP 3's distinguishing check passes because the incoming commit's
key changes are present in HEAD rather than absent. Per STEP 4, `--skip` was
not called; `CHERRY_PICK_HEAD` (`e81f695e`) remains in place for the finalize
step.

No code/implementation files, no UAT test files, and no spec tickets were
involved in this conflict. No hunk was dropped under the BUG-1301 precedence
exception.
