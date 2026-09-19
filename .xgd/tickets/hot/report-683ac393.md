---
uid: report-683ac393
id: REPORT-4371
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T10:02:18.635271+00:00'
updated_at: '2026-09-19T10:02:18.635271+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

Incoming commit: `76cd837f38` (2026-08-31 14:18) — "content edit: correct the
prerequisite — REQ-104 is on xgd-working; only the shared artifact store is
stale, so bin/install is the whole fix".

**The message outruns the diff.** The commit announces a body correction but
carries none: its entire diff is `updated_at` bumped,
`last_field_updated: status` → `body`, and a trailing newline re-added. The
announced prose edit arrives in a following commit under the same message —
the familiar xgd pair, one commit announcing and the next delivering. Nothing
in this commit's diff touches the `## Prerequisite` section.

- `.xgd/tickets/hot/request-13a5e206.md` — UU, intent/bookkeeping ticket
  (rule 2e). Two conflict hunks, resolved per-fact:
  1. **Frontmatter lifecycle block** — HEAD: `updated_at 2026-09-02T01:34:36Z`,
     `completed_at 2026-09-02T01:34:00Z`, `last_field_updated: result`,
     `status: free_and_reconciled`. Incoming: `updated_at
     2026-08-31T21:18:30Z`, `completed_at: null`, `last_field_updated: body`,
     `status: free_coding`. Same fact (lifecycle position), HEAD's is strictly
     downstream → kept HEAD. Taking incoming would rewind a completed ticket to
     mid-coding.
  2. **Tail of the body** — HEAD-only append of the `## What landed
     (free-coded, 2026-08-31)` record with its Evidence / Collateral /
     Not-done sections. The incoming side of this hunk holds nothing but the
     re-added file-final newline. Not a competing fact → kept HEAD.

No `fields.intent_uid` / `story_uid` / `capability_uid` were touched, and no
content was introduced that is not on one of the two sides.

## Incoming changes preserved

Verified against `git show HEAD:.xgd/tickets/hot/request-13a5e206.md`:

- **The correction the commit message announces is already in HEAD** — HEAD
  carries `## Prerequisite: refresh the installed component` (line 559) with
  `bin/install --lang js --component ticketing --env
  /Users/martin/lagrangefoundry` (line 572), i.e. exactly "REQ-104 is on
  xgd-working; only the shared artifact store is stale, so bin/install is the
  whole fix". So even the intent this commit declares but does not carry is
  satisfied in the resolution.
- **`last_field_updated`/`updated_at` bump and the advance out of `draft`** —
  subsumed by HEAD's later `result` / `free_and_reconciled` state.
- **Re-added trailing newline** — the newline after `explicit \`MIGRATIONS\`
  list.` is present in HEAD (108 further lines follow it). HEAD's own
  file-final byte is `.` with no newline, a separate fact settled later on the
  HEAD timeline.

Nothing from the incoming commit was discarded: it contained no body content
change at all.

## Net result

Staged tree is byte-identical to HEAD for this file, so the staged diff vs HEAD
is empty. Redundant, not discarded (STEP 3's distinction — the commit's key
changes, and the edit its message announces, are demonstrably present in HEAD).
Per STEP 4 the file is staged and the cherry-pick sequencer is left intact for
`cherry_pick_finalize_resolution` to skip the commit.
