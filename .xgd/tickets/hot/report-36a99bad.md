---
uid: report-36a99bad
id: REPORT-2765
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T06:42:42.023124+00:00'
updated_at: '2026-08-31T06:42:42.023124+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-37e63e46.md` — **AA (both added)**, intent/bookkeeping
  ticket (REQ-103). Rules applied: **2b** (AA, one side is a strict superset →
  keep the superset) reinforced by **2e** (intent ticket, incoming added a field
  the other side never touched → keep the superset). Resolved with
  `git checkout --theirs` + `git add --sparse` (path is outside the
  sparse-checkout cone, DOC-986 §2/§4.1).

  Both sides carry the same commit subject (`xgd(ticket): update request
  request-37e63e46`), so the enrichment's "intent unknown on one or both sides"
  rule pointed at a timeline decision — but no timeline call was needed: the two
  blobs differ by exactly one added line, with no fact changed differently on
  either side, so this is a superset case, not a competing-fact case.

## Incoming changes preserved

Incoming commit `05177ca06e88f76768b3f22f303849d3345f7304` (Martin Westhead,
2026-08-23) adds this file whole — 184 insertions, 1 file changed. Diffed against
the HEAD-side blob (`f82a60eb`), its entire substantive delta is one line:

```
   bundled_in: bundle-ee56a66e
+  chat_comment: comment-989af6be
```

Confirmed present in the resolved version. `git diff --cached 05177ca0 --
.xgd/tickets/hot/request-37e63e46.md` is **empty** — the staged blob is
byte-identical to the incoming commit's version (`63e800a3`), so no incoming
content was discarded. The staged diff vs HEAD is the single `chat_comment` line
above.

No hunks were dropped; the BUG-1301 precedence exception was not invoked. No code
or UAT test files were involved in this conflict.
