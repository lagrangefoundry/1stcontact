---
uid: report-ae0b086a
id: REPORT-4169
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-13T23:15:34.093171+00:00'
updated_at: '2026-09-13T23:15:34.093171+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-26dafd83.md` — UU, intent/bookkeeping ticket
  (rule 2e). Kept HEAD (`git checkout --ours` + `git add --sparse`; the
  path is outside the sparse cone).

  Incoming commit cfe4aca5 ("xgd(ticket): update request request-26dafd83",
  2026-09-01T18:35:57) changes exactly two lines relative to its base
  719299e8: `updated_at` and `last_field_updated: status -> story_points`.
  Notably it does NOT change `fields.story_points` — the value is 8 on the
  base, on the incoming side, and on HEAD. The commit is a re-set of
  story_points to its existing value, so its only real content is
  bookkeeping metadata.

  The single conflict region (lines 8-18) covers `updated_at` /
  `last_field_updated` / `status`. Same facts changed differently on each
  side, so the per-fact timeline rule applies: HEAD's intent is later
  (`updated_at 2026-09-09T21:32:49` vs incoming `2026-09-01T18:35:57`) and
  its `status: bundled` is the downstream lifecycle state of the incoming
  `free_coded`. HEAD's values kept.

  Everything else in the incoming blob is already byte-identical on HEAD
  and sat outside the markers: `fields.story_points: 8`, `priority: high`,
  `auto_merge_back`, `needs_review`, `chat_comment`, `fields.commits` (all
  three working_shas), `fields.version: 0.2.31`, and the whole body. HEAD
  additionally carries `fields.bundled_in: bundle-87be4669`, which the
  incoming side never had — so HEAD is a strict superset.

  No field invented; no field dropped except the superseded scalars above.

## Incoming changes preserved

Verified with `git show cfe4aca5 -- .xgd/tickets/hot/request-26dafd83.md`
against the resolved file:
- `fields.story_points: 8` (the field the commit claims to update) —
  present, same value
- `status` advanced off `free_coding` — present (HEAD carries it further,
  to `bundled`)
- `fields.commits`, `fields.version: 0.2.31` — present

The only incoming lines not in the resolution are the `updated_at` and
`last_field_updated` scalars, superseded per the timeline rule above.

The staged diff against HEAD is therefore empty. This is the
redundant-commit case (BUG-1109/BUG-1122, seeded local overlay already
carrying the incoming fields), not a discard: the incoming commit's
substantive change is present in HEAD rather than absent. `--skip` was NOT
called; the finalize step will detect the clean staged diff.
CHERRY_PICK_HEAD left intact.

No code/implementation files, UAT tests, or spec tickets were involved.
No BUG-1301 precedence drops were needed.
