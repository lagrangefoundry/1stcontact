---
uid: report-f48a888d
id: REPORT-2763
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T06:39:24.928299+00:00'
updated_at: '2026-08-31T06:39:24.928299+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-bb28220d.md` — AA (both added), intent/bookkeeping ticket (`request-*`), rule 2e "one side is a strict superset". Resolved by taking the incoming (free_coded) version: `git checkout --theirs` + `git add --sparse` (path is outside the sparse-checkout cone, DOC-986 §2/§4.1).

  Both sides added the same 116-line ticket. A blob-to-blob diff of index stage 2 (`7f5dca99`, from the ours-side `sync_working_to_main` commit "xgd: sync from xgd-working 715a993ebead (post-watermark)") against stage 3 (`67180765`, incoming commit `23d88f46` "xgd(ticket): update request request-bb28220d") shows a single difference: incoming adds `fields.chat_comment: comment-8450be8f`. Every other byte — frontmatter, the 12-entry `commits` list, `version: 0.0.60`, `bundled_in`, and the entire body — is byte-identical. No competing edit to any shared field, so the enrichment note's "take the more recent commit by timestamp" fallback and the 2e superset rule agree on the same outcome; no per-fact timeline lookup was needed.

## Incoming changes preserved

- `.xgd/tickets/hot/request-bb28220d.md` — confirmed. `git show 23d88f46 --stat` reports one file, +116 lines (a whole-file add). The staged result vs HEAD is exactly `+  chat_comment: comment-8450be8f`, i.e. the resolved blob is identical to the incoming blob `67180765`. The other 115 lines of the incoming add are already present in HEAD via the ours-side sync commit, so they show no diff — present via a different route, not discarded (STEP 4 / BUG-1109 distinction).

No hunks were dropped; the BUG-1301 precedence exception was not invoked. No code, test, or UAT files were involved in this conflict.
