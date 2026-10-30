---
uid: report-ab19dca2
id: REPORT-4615
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T04:11:28.200023+00:00'
updated_at: '2026-09-21T04:11:28.200023+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/doc-8d51d90d.md` — **AA (both added)**, intent/bookkeeping ticket (`doc-*`, STEP 2b + 2e). Conflict was confined to the YAML frontmatter; the document body was byte-identical on both sides. Resolved to the HEAD side per the later-positioned-intent rule, applied per fact:
  - `updated_at`: `2026-09-11T09:33:35Z` (HEAD) over `2026-08-31T19:43:20Z` (incoming)
  - `last_field_updated`: `doc_kind` (HEAD) over `system_kb` (incoming)
  - `fields.doc_kind`: `system_kb` (HEAD) over `architecture` (incoming)

## Incoming changes preserved

Nothing from the incoming side was discarded. The intent ledger shows the two lineages are the same ledger, replayed:

- HEAD: `fcf397a99f` → `d61bd41c2e` → `8179f38266` (2026-08-31 12:43:20) → `1d4f51b394` (2026-09-11 02:33:35)
- Incoming: `fcf397a99f` → `d61bd41c2e` → `0d11a0146e` (xgd-resync; listed in this run's `skipped_commits`) → `e6f718b389` (2026-08-31 12:43:20)

The incoming commit `e6f718b389` is **byte-identical** to `8179f38266`, which is already in HEAD's history (verified: `git diff 8179f38266:<path> e6f718b389:<path>` is empty; same author timestamp). HEAD then carries a strictly later edit, `1d4f51b394`, which re-set `fields.doc_kind` from `architecture` to `system_kb`.

So every fact asserted by the incoming side is either already present in HEAD verbatim, or is the *earlier* state of the same field that a later commit on the same ledger deliberately changed. Taking the incoming frontmatter would have silently reverted the 2026-09-11 `doc_kind` decision. No BUG-1301 precedence exception was needed; no content was dropped.

Result: the staged tree is identical to HEAD (no net change), as expected for a replayed-duplicate commit. `CHERRY_PICK_HEAD` left intact for the finalize step.
