---
uid: report-535f023a
id: REPORT-4772
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T18:52:26.603045+00:00'
updated_at: '2026-09-21T18:52:26.603045+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/bug-3ade1af4.md` — intent/bookkeeping ticket (STEP 2e;
  `bug-*` lives in hot per tiers.py). Incoming commit `cb4ece9296`
  ("xgd(ticket): update bug bug-3ade1af4"). One conflict hunk, in the YAML
  frontmatter; the `title:` hunk, `fields:`, and the whole Markdown body merged
  cleanly.

  `git show cb4ece9296 -- <path>` shows the commit's one real content change is
  the title rewrite:

      -title: 'Test suite: 23 failures — a half-finished install, a stale asset build, and
      -  ten UATs superseded by later work'
      +title: 'Test suite: 27 failures + 30 collection errors — a half-finished install,
      +  a stale asset build, and eleven UATs superseded by later work'

  HEAD already carries that exact title verbatim (lines 5-6 of the resolved
  file), which is why git merged the hunk without conflict. The incoming
  content is therefore fully present, not discarded.

  What remained in conflict is the same four lifecycle facts both sides set —
  a genuine same-fact conflict, so later-positioned intent wins on each. HEAD
  is eighteen days further along:

  | Fact | HEAD (kept) | Incoming (dropped) |
  |---|---|---|
  | `updated_at` | 2026-09-19T15:15:31 | 2026-09-01T19:30:16 |
  | `completed_at` | 2026-09-14T10:29:13 | `null` |
  | `last_field_updated` | `status` | `title` |
  | `status` | `free_and_reconciled` | `free_coded` |

  `last_field_updated: title` was accurate the moment `cb4ece9296` was written,
  but HEAD has since made a later edit — the transition to
  `free_and_reconciled` — so `status` is the correct marker for HEAD's state.
  Carrying `title` forward would mislabel a field HEAD did not last touch.

  Nothing on the incoming side is disjoint from HEAD, so there was nothing to
  combine in. Matches the auto-enrichment rule for this file ("take the more
  recent commit by timestamp"), applied per-fact rather than wholesale.

## Incoming changes preserved

No code, test, or config files were in conflict — the single conflicted path is
a bookkeeping ticket, so STEP 3's incoming-code verification does not apply and
the BUG-1301 precedence exception was not invoked.

The commit's substantive change — the rewritten title — is present verbatim in
the resolved file. Every other incoming value is a strictly earlier state of a
field HEAD also sets, which is the documented outcome for a genuine same-fact
conflict. Nothing disjoint was discarded.

## Note for the finalize step

The staged tree is byte-identical to HEAD for this path — `git status
--porcelain` is empty and `git diff --cached HEAD` is empty. This cherry-pick
carries no net change, which is correct: its content change was already in HEAD
and its bookkeeping fields are superseded. Per STEP 4 I did not call `--skip`;
CHERRY_PICK_HEAD (`cb4ece9296`) is still present for the next step to act on.

This is the third consecutive commit in the queue to resolve empty against this
same ticket — `08bbde0676` (REPORT-4756), `d975830c32` (REPORT-4757), now
`cb4ece9296`. All three are 2026-09-01 ticket-metadata commits whose effects
are already reflected in HEAD's 2026-09-19 state. Expect the run to continue;
this is a benign replay of ticket bookkeeping, not lost work.
