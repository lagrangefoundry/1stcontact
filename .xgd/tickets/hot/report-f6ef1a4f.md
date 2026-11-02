---
uid: report-f6ef1a4f
id: REPORT-8075
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-37'
created_by: xgd
created_at: '2026-11-02T00:56:09.862444+00:00'
updated_at: '2026-11-02T00:56:09.862444+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-37
---

## Files resolved

- `.xgd/tickets/hot/request-704fe21e.md` (UU). This is a request ticket, so it counts as an intent/bookkeeping ticket (rule 2e). The rule applied was "one side is a strict superset, keep the superset", and the enrichment rule "take the more recent commit by timestamp" gives the same answer. Kept OURS (HEAD, blob 428f21ef).
  - INCOMING (b74ef6cbcc, "update request request-704fe21e"): its only body changes rename links (`[[REQ-134-sender]]` -> `[[REQ-196]]`, `[[REQ-136]]` -> `[[REQ-198]]`), plus updated_at 2026-09-05T23:44:53 and last_field_updated=body.
  - OURS: the same link renames, word for word, plus newer state: status draft -> bundled, bundled_in bundle-5052a63c, the commits list, version 0.2.103, chat_comment, the "Decisions taken while implementing" section, and updated_at 2026-11-01T23:18:46 (later).
  - The file is outside the sparse cone and its conflict existed only in the index. It was resolved by setting stage 0 to the OURS blob, and its skip-worktree bit was set again.

## Incoming changes preserved

Not a code file. Every change the incoming commit made to the body (the four link renames) is already in HEAD. The only incoming changes not kept are the stale updated_at and last_field_updated values, which HEAD's later values supersede. Once resolved, the staged diff against HEAD is empty: the commit is redundant, nothing was discarded (BUG-1109/BUG-1122 shape). It is left for cherry_pick_finalize_resolution to skip. CHERRY_PICK_HEAD (b74ef6cbcc) is still present.

Not touched: `.xgd/_changes/log.ndjson` and `meta.json` (unstaged xgd bookkeeping) and the untracked `report-bcd0268c.md`.
