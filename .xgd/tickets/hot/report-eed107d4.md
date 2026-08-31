---
uid: report-eed107d4
id: REPORT-2972
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-21'
created_by: xgd
created_at: '2026-08-31T15:37:49.114319+00:00'
updated_at: '2026-08-31T15:37:49.114319+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-21
---

## Files resolved

- `.xgd/tickets/hot/bug-db356ff8.md` — **UU**, intent/bookkeeping ticket (rule 2e).
  Index-only conflict: the path is outside the sparse-checkout cone
  (`!/.xgd/tickets/**`, DOC-986 §2/§4.1), so there were no working-tree markers.
  Resolved with `git checkout --ours` + `git add --sparse`.

  **Rule applied: "one side is a strict superset of the other — keep the
  superset."** Here the superset is OURS, not incoming. Diffing the two index
  stages directly (`git diff <theirs:863e47ac> <ours:3e669318>`) shows the only
  content present in theirs and absent from ours is:

  - `updated_at: '2026-08-23T23:42:40'` (ours carries the later `2026-08-26T17:36:27`)
  - `last_field_updated: body` / `status: draft` (ours: `status`, `bundled`)
  - the superseded body line "Scope drafted, awaiting operator confirmation
    before coding."

  Every one of those is a same-fact conflict resolved by the per-fact timeline
  rule in ours' favour: ours is the later-positioned state on every axis
  (`updated_at` three days later; HEAD-side commit `7a8d0abd29` dated
  2026-08-31 vs incoming `6ffb45e6e6` dated 2026-08-23), and ours' `status:
  bundled` / `fields.bundled_in: bundle-78f4e2fe` is precisely the bookkeeping
  for the intent being reconciled in this run — taking theirs would revert this
  ticket to `draft` and un-bundle it from its own bundle. Ours' Status paragraph
  likewise supersedes the incoming one: it was written after both halves landed
  and describes them, where the incoming line still says coding had not started.

  No fields were invented; nothing was taken from outside the two sides.
  `fields.intent_uid` / `story_uid` / `capability_uid` were not touched.

## Incoming changes preserved

Confirmed. The incoming commit `6ffb45e6e6a1946f9fbf1eabc76afb39aa31c025`
("xgd(ticket): update bug bug-db356ff8", 42 insertions / 1 deletion) made
exactly two changes: an `updated_at` bump, and the appended body section
`## Implementation — landed and verified end to end (2026-08-23)` with its two
subsections ("A third finding, met while running it" and "The client secret was
never printed into the session").

That entire 42-line section is present **verbatim** in the resolved file — HEAD
already carried it, having arrived via a different route, and then appended a
further `# Implementation — the tenant fix` section on top of it. The
`git diff theirs..ours` output quoted above is the proof: it contains no
deletion of any line from that section.

This is therefore the BUG-1109/BUG-1122 redundant-commit case, not a discard.
Per STEP 3's test, the incoming commit's key changes are *present in HEAD*
rather than *absent*, so the resolution correctly stages to no diff vs HEAD.
Per STEP 4, `--skip` was NOT called; the staged tree is left clean for
`cherry_pick_finalize_resolution` to detect and skip. `CHERRY_PICK_HEAD` is
intact.

No code, test, or UAT files were involved in this conflict, so no hunks were
dropped and the BUG-1301 precedence exception did not arise.
