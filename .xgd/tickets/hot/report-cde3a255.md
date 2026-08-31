---
uid: report-cde3a255
id: REPORT-3100
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-22'
created_by: xgd
created_at: '2026-08-31T22:06:43.968175+00:00'
updated_at: '2026-08-31T22:06:43.968175+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-22
---

## Files resolved

- `.xgd/tickets/hot/bug-23d1ec27.md` — UU, intent/bookkeeping ticket (rule 2e,
  "same field changed differently on each side" → later-positioned intent, per
  fact). Path is outside the sparse-checkout cone, so the conflict existed in
  the index only, with no working-tree markers; resolved with
  `git checkout --ours` + `git add --sparse`.

  Incoming commit `93b031a3` (`xgd(ticket): update bug bug-23d1ec27`,
  2026-08-25 16:21 -0700) changes exactly three frontmatter fields off base
  `90cfbfc9`:
  - `updated_at`: `2026-08-24T22:25:21` → `2026-08-25T23:21:06`
  - `last_field_updated`: `created_at` → `status`
  - `status`: `draft` → `free_coding`

  HEAD (`01eb488d`, last written by `9a853c57`,
  `xgd(ticket): seed_local_overlay bug bug-23d1ec27`, 2026-08-31 12:21 -0700)
  holds:
  - `updated_at`: `2026-08-31T05:05:09`
  - `last_field_updated`: `status` — identical to incoming, not in conflict
  - `status`: `bundled`
  plus fields incoming never touched (`chat_comment`, `commits`,
  `version: 0.2.15`, `story_points: 3`, `bundled_in: bundle-8eef3846`) and the
  rewritten "Fix — as landed" body.

  Per-fact adjudication of the two genuinely competing fields:
  - `status` — `bundled` is downstream of `free_coding` in the ticket
    lifecycle, and HEAD's `bundled_in: bundle-8eef3846` names this very
    reconcile bundle. The incoming `free_coding` transition is an earlier step
    of the same progression, not a rival claim. HEAD wins.
  - `updated_at` — HEAD's 2026-08-31 stamp is later than incoming's 2026-08-25,
    and matches the winning `status`. HEAD wins.

  Both facts resolve the same way, so HEAD is kept whole. Nothing from the
  incoming side is dropped in favour of an older value.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-23d1ec27.md` — this is not a code file, so there is no
  implementation hunk to check. The incoming commit's intent (advance the
  ticket off `draft` and stamp the field update) is present in HEAD via a later
  route: `status` has already advanced past `free_coding` to `bundled`, and
  `last_field_updated: status` is byte-identical on both sides. No incoming
  fact is absent; each is either present or superseded by its own successor
  value.

No hunks were dropped, so the BUG-1301 precedence exception was not used.

Note: because HEAD already carries the incoming commit's effect via a later
lifecycle state, this resolution stages to no net diff vs HEAD. Per STEP 4 that
is not a failure and `--skip` was not called — the finalize step will detect the
empty staged diff. This is the redundant case, not the discarded one: STEP 3's
check passes because the incoming transition is present in HEAD's own history
of this field, not merely missing.
