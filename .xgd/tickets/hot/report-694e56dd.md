---
uid: report-694e56dd
id: REPORT-4113
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-12T19:16:13.461605+00:00'
updated_at: '2026-09-12T19:16:13.461605+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-a98fb3b0.md` — UU, intent/bookkeeping ticket (rule 2e).
  Incoming commit `04957574` ("xgd(ticket): update bug bug-a98fb3b0",
  2026-08-24 15:19:51 -0700) advances BUG-38 out of coding: `status:
  free_coding -> free_coded`, and adds `commits` (working_sha
  `63df97c93542321a3d57d21e2e31a763ed3e4411`, reconcile_sha/main_sha null) and
  `version: 0.2.14`.

  Resolved by keeping the HEAD side. `git diff :2: :3:` shows the sides differ
  only in lifecycle bookkeeping, with HEAD later on every contested fact:
  - `status`: HEAD `free_and_reconciled`; incoming `free_coded` — the immediately
    preceding point on the same lifecycle, not a competing value.
  - `updated_at` / `completed_at`: HEAD `2026-08-31T19:19:34` and completed;
    incoming `2026-08-24T22:19:50` and `completed_at: null`.
  - fields: HEAD carries the incoming `commits` entry and `version: 0.2.14`
    verbatim, and additionally `story_points: 2` and
    `bundled_in: bundle-78f4e2fe`, which incoming does not have.

  The prose body is identical on both sides. Only difference outside the
  lifecycle fields is a trailing newline at EOF (present on HEAD, absent on
  incoming).

  Timeline check (rule 2e's per-fact tiebreak, and the enrichment note's "take
  the more recent commit by timestamp"): the last HEAD-side commit touching this
  file is `01492336` dated 2026-08-31 12:19:34 -0700, a week later than the
  incoming commit's 2026-08-24 15:19:51 -0700. HEAD wins each contested fact.

  Path is outside the sparse-checkout cone, so staging used `git add --sparse`.
  Verified before staging: zero conflict markers in the worktree file, and its
  SHA-1 matches the `:2:` (ours) stage exactly.

## Incoming changes preserved

No code/implementation files were in this conflict — the single conflicted path
is a bookkeeping ticket. Both field additions authored by `04957574` are present
in the resolved file:

- `commits` with `working_sha: 63df97c93542321a3d57d21e2e31a763ed3e4411` —
  present (line 20), same nested shape with `reconcile_sha: null`,
  `main_sha: null`.
- `version: 0.2.14` — present (line 23).

The one incoming value not carried over is `status: free_coded` (with its
matching `updated_at` / `completed_at: null`), superseded by the later HEAD-side
`free_and_reconciled` for the same fact. That is the rule-2e tiebreak operating
per fact, not a discard of developer content — the ticket moved forward through
`free_coded` to `free_and_reconciled`, so HEAD's value already subsumes it.

No hunks were dropped under the BUG-1301 precedence exception; it was not
invoked.

Note for the finalize step: the staged diff against HEAD is empty
(`git diff --cached --stat HEAD` returns nothing), because HEAD already carries
this commit's effect and then some. This is the redundant-commit case of
BUG-1109/BUG-1122, not a discard: STEP 3's test is satisfied because the
incoming commit's key changes are *present* in HEAD rather than absent.
`--skip` was not called; the cherry-pick sequencer state is intact.

This is the third consecutive commit in this bundle (after `1c5985f8` and
`82518d60`) to touch only this ticket and net to no diff — the working-side
lifecycle updates for BUG-38 are being replayed onto a branch that already holds
the ticket's final state.
