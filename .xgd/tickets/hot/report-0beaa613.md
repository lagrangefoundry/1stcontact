---
uid: report-0beaa613
id: REPORT-4370
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T10:00:35.529158+00:00'
updated_at: '2026-09-19T10:00:35.529158+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

Incoming commit: `8b6541d4b1` (2026-08-31 14:16), no free-text body. Its whole
diff is a status advance — `status: draft` → `free_coding`,
`last_field_updated: body` → `status`, `updated_at` bumped — plus removal of
the file's trailing newline.

- `.xgd/tickets/hot/request-13a5e206.md` — UU, intent/bookkeeping ticket
  (rule 2e). Two conflict hunks, resolved per-fact:
  1. **Frontmatter lifecycle block** — same fields on both sides, different
     values. HEAD: `updated_at 2026-09-02T01:34:36Z`, `completed_at
     2026-09-02T01:34:00Z`, `last_field_updated: result`,
     `status: free_and_reconciled`. Incoming: `updated_at
     2026-08-31T21:16:33Z`, `completed_at: null`, `last_field_updated: status`,
     `status: free_coding`. Same fact (the ticket's lifecycle position), and
     HEAD's is strictly downstream of the incoming one — `free_and_reconciled`
     is the state this ticket reaches *after* `free_coding`, with `completed_at`
     and `result` already set. Later intent → kept HEAD. Taking incoming would
     have rewound a completed ticket to mid-coding.
  2. **Final body line + tail** — both sides end the "Implementation notes"
     bullet with the identical line (`explicit \`MIGRATIONS\` list.`); HEAD then
     appends the `## What landed (free-coded, 2026-08-31)` record with its
     Evidence / Collateral / Not-done sections. Not a competing fact — HEAD is
     the strict superset → kept HEAD.

No `fields.intent_uid` / `story_uid` / `capability_uid` were touched, and no
content was introduced that is not on one of the two sides.

## Incoming changes preserved

Verified against `git show HEAD:.xgd/tickets/hot/request-13a5e206.md`:

- **Status advance out of `draft`** — present, and then some. HEAD carries
  `status: free_and_reconciled`, which is reached by passing through
  `free_coding`; the incoming commit's intent (move this ticket off `draft` as
  coding starts) is subsumed by the later state, not lost.
- **Trailing newline removed** — present. HEAD's blob ends on `.` with no final
  newline (`tail -c 1 | od -c` → `.`), the exact end-state the incoming commit
  asked for.

Nothing from the incoming commit was discarded: it contained no body content
change at all, only the two facts above, both of which HEAD already holds in a
later form.

## Net result

Staged tree is byte-identical to HEAD for this file, so the staged diff vs HEAD
is empty. Redundant, not discarded (STEP 3's distinction — the commit's key
changes are demonstrably present in HEAD, reached by a later route). Per STEP 4
the file is staged and the cherry-pick sequencer is left intact for
`cherry_pick_finalize_resolution` to skip the commit.
