---
uid: report-30126ee6
id: REPORT-4530
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-20T20:05:27.621809+00:00'
updated_at: '2026-09-20T20:05:27.621809+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/bug-db356ff8.md` — **UU**, intent/bookkeeping ticket
  (`bug-*`), STEP 2e. Incoming commit `1524d150` is the ORIGINAL drafting of
  BUG-36 (2026-08-23T22:13Z): it took the ticket from `title: Untitled` /
  body `(new ticket)` to the drafted bug report at `status: draft`,
  `completed_at: null`. HEAD carries that same body verbatim plus everything
  that happened afterwards — implementation, verification, completion
  (2026-08-31T19:19Z), `status: free_and_reconciled`, and the
  `story_points` / `commits[]` / `version: 0.2.10` / `bundled_in:
  bundle-78f4e2fe` fields.

  Applied 2e's **strict-superset** clause for the body, and 2e's
  **later-positioned-intent, per fact** clause for the one genuinely
  competing fact (the status fields + the `## Status` section, which both
  sides wrote differently). Both clauses select HEAD. Three conflict hunks
  resolved to HEAD; resulting blob restored to HEAD's exact bytes, so the
  staged diff is empty and finalize will skip the commit.

## Incoming changes preserved

Verified by `git diff 1524d150 HEAD -- <path>`. The complete set of incoming
lines not present in the resolution is five, and all five are the superseded
status facts:

    -updated_at: '2026-08-23T22:13:33.974071+00:00'
    -completed_at: null
    -last_field_updated: severity
    -status: draft
    -Scope drafted, awaiting operator confirmation before coding.

Every other line introduced by the incoming commit — the title, `severity:
high`, and the entire narrative body (`## Symptom`, `## Diagnosis`,
`## Immediate unblock`, `## Proposed fix`, `## Test plan`) — is present
verbatim in the resolved file. No developer content was discarded: the
dropped lines are stale bookkeeping that HEAD's later, documented intent
supersedes, not disjoint edits.

No code files were in conflict. No UAT test functions were touched, so
neither 2f nor the BUG-1301 precedence exception was engaged.
