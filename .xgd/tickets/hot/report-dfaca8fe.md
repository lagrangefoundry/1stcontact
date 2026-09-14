---
uid: report-dfaca8fe
id: REPORT-4198
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-14T02:51:05.118922+00:00'
updated_at: '2026-09-14T02:51:05.118922+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-93851fea.md` — UU, intent/bookkeeping ticket
  (rule 2e). Sparse-excluded path, so the conflict existed only in the
  index (DOC-986 §2/§4.1): resolved with `git checkout --ours` +
  `git add --sparse`.

  Incoming commit `dadea5a` (`xgd(ticket): update bug bug-93851fea`,
  2026-09-01T20:46) fills the ticket out from its stub: title, `severity:
  medium`, `status: free_coding`, and the full Symptom / Root cause / Fix
  / Test plan body. Ours is the seeded local overlay (`8d296f24`,
  `updated_at` 2026-09-11T18:53).

  Per-fact comparison of ours (blob `5285540c`) against theirs (blob
  `e14b489d`):
  - `title`, `last_field_updated`, `severity`, and the entire markdown
    body — **identical on both sides**, nothing to choose.
  - `fields` — ours is a strict superset: it additionally carries
    `commits` (working_sha `d019bab7`), `version: 0.2.35`,
    `story_points: 2`, `bundled_in: bundle-8e1807f6`. Theirs adds no
    field ours lacks.
  - `status` — the one genuine per-fact conflict: ours `bundled`, theirs
    `free_coding`. Resolved by the 2e timeline rule in ours' favour:
    ours is the later-positioned intent (`updated_at` 2026-09-11 vs
    2026-09-01), and its `bundled_in` names bundle-8e1807f6 — the very
    bundle this reconcile is applying. Theirs' `free_coding` is the
    earlier lifecycle state; taking it would walk the ticket's status
    backwards and drop `bundled_in` along with it.
  - `updated_at` — same fact, same resolution: ours is later.

  Only cosmetic difference not taken from theirs: theirs ends with a
  trailing newline, ours does not. Not a fact; left as ours to avoid a
  spurious diff.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-93851fea.md`: every substantive change in
  `dadea5a` — the title, `severity: medium`, and the complete
  Symptom/Root cause/Fix/Test plan body — is present verbatim in the
  resolved file. The only incoming values not carried through are
  `status: free_coding` and the older `updated_at`, both superseded
  per-fact by the later-positioned overlay as recorded above. That is a
  timeline resolution, not a discard.

No hunks were dropped; the BUG-1301 precedence exception was not needed.

Note: the resolution nets to no diff vs HEAD, because HEAD's seeded
overlay already contained the incoming commit's entire substantive
effect. This is the redundant-commit case (BUG-1109/BUG-1122), not a
discard — STEP 3's check confirms the incoming content is present in
HEAD rather than absent. Per STEP 4, `--skip` was NOT called; the tree
is left staged and clean for `cherry_pick_finalize_resolution`.
CHERRY_PICK_HEAD (`dadea5a`) is still present.
