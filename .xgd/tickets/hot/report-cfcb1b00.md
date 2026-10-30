---
uid: report-cfcb1b00
id: REPORT-5502
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T07:42:30.957074+00:00'
updated_at: '2026-09-29T07:42:30.957074+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bug-360c5a44.md` — **UU**, intent/bookkeeping ticket
  (`bug-*`, §2e). Incoming commit `6862ea1402` ("xgd(ticket): update bug
  bug-360c5a44", 2026-09-01 22:34:57 -0700) touched only this file. Two
  conflict hunks, both resolved to the HEAD side:

  1. **Frontmatter.** Incoming: `updated_at: 2026-09-01T22:34:57Z`,
     `completed_at: null`, `last_field_updated: body`, `status: draft`.
     HEAD: `updated_at: 2026-09-19T15:15:28Z`,
     `completed_at: 2026-09-14T10:29:01Z`, `last_field_updated: status`,
     `status: free_and_reconciled`. Same facts changed on both sides →
     genuine conflict, later-positioned intent wins per fact. HEAD is 18
     days newer and records the ticket as completed and reconciled; taking
     incoming would have regressed lifecycle state back to `draft` and
     dropped `completed_at`.
  2. **Final test-plan line** (`  turn reporting none leaves it alone.`).
     The two sides are textually identical — a trailing-context artifact of
     the surrounding rewrite, not a semantic disagreement. Resolved to HEAD;
     the resulting line is byte-identical to what incoming asked for.

  Body content required no merging: HEAD already carries every addition this
  commit introduces (see below), so the resolution is HEAD verbatim via
  `git checkout --ours`. `git ls-files -u` is empty, `git status --porcelain`
  is empty (staged result is identical to HEAD, so there is no net change to
  commit — finalize will detect that and skip). CHERRY_PICK_HEAD
  (`6862ea1402`) left in place, untouched.

  This path is outside the worktree's 11% sparse-checkout cone, so staging
  used `git add --sparse` (DOC-986 §2/§4.1).

## Incoming changes preserved

No code/implementation files were involved — the commit is a single
bookkeeping-ticket edit. Its three body additions are nonetheless present
verbatim in the resolved version, confirmed by grep (5/5 distinctive strings
matched):

- New paragraph in `## Fix`: "Reloading a frame is the host's business, and a
  host that fails at it must not take the conversation with it: a callback
  that throws is swallowed and the turn finishes streaming its answer in
  full."
- Test-plan **panel** bullet extended with "carrying the counter", "leaves no
  trace in the conversation", and the throwing-callback assertion.
- New test-plan **app** bullet: "a turn reporting two writes reloads the
  preview frame twice, and a turn reporting none leaves it alone."

The only incoming content not carried forward is the frontmatter lifecycle
regression in hunk 1, which is a genuine per-fact intent conflict decided by
recency — not a dropped hunk. The BUG-1301 precedence exception was not
invoked and no UAT test function was deleted; this conflict touches no test
files.
