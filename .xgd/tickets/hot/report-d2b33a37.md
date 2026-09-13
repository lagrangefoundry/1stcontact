---
uid: report-d2b33a37
id: REPORT-4162
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-13T22:47:24.750438+00:00'
updated_at: '2026-09-13T22:47:24.750438+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-119dd4af.md` — UU, intent/bookkeeping ticket
  (rule 2e). Both sides changed the same three facts (`updated_at`,
  `last_field_updated`, `status`), so this is a genuine same-fact conflict,
  resolved per-fact by the later-positioned side — which here is OURS.

  - Incoming (`db39fce0f8`, 2026-08-31T21:56): `status: draft` →
    `free_coding`, `last_field_updated: body` → `status`, `updated_at`
    bumped. Nothing else in the file touched (3 insertions, 3 deletions).
  - Ours (`c14f78d6d2` seed_local_overlay, 2026-09-09T21:32): `status:
    draft` → `bundled`, same two companion fields, plus `fields.commits[0]
    .working_sha: 115f0d39ec`, `fields.version: 0.2.23`, `fields.bundled_in:
    bundle-87be4669`, `fields.chat_comment`, and the full "What landed" body.

  Ours is both the later commit (9 days) and the later lifecycle state:
  `bundled` is strictly downstream of `free_coding`, and the overlay commit
  records the free-coding run's *outcome* (working sha, version, bundle
  membership). The enrichment metadata's rule ("take the more recent commit
  by timestamp") agrees. Taking incoming would have regressed the ticket to
  `free_coding` while `bundled_in` and `commits[].working_sha` stayed
  populated — an internally inconsistent record.

  Resolved file is byte-identical to HEAD's version (`git diff HEAD` on the
  path is empty); no markers remain. The staged diff vs HEAD is therefore
  empty — this cherry-pick is redundant, not discarded (see below). Per
  STEP 4 no `--skip` was issued; finalize will detect the clean staged diff.

## Incoming changes preserved

No code/implementation files were in this conflict — the sole conflicted
path is a bookkeeping ticket.

For that ticket, the incoming commit's only change is the `draft` →
`free_coding` status advance. It is present in HEAD via a different route
rather than discarded: the seeded overlay commit `c14f78d6d2` advanced the
same ticket past that state to `bundled` and carried the artifacts that
state transition produced (`working_sha 115f0d39ec`, `version 0.2.23`,
`bundled_in bundle-87be4669`, the "What landed" section). The free-coding
episode the incoming commit marks the *start* of is the one whose *result*
HEAD already records. This is STEP 3's "redundant" case, not its "absent"
case.

No BUG-1301 precedence exception was invoked; no test functions or code
hunks were dropped.

Flagged for post-merge review per the enrichment rule (intent unknown on
one or both sides): the ticket's status field now reads `bundled` on the
reconcile branch, and the incoming `free_coding` marker is intentionally
not replayed.
