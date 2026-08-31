---
uid: report-ae68df7b
id: REPORT-2728
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T05:59:03.915591+00:00'
updated_at: '2026-08-31T05:59:03.915591+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-342de4f4.md` — AA (both added), intent/bookkeeping ticket (rule 2e). The two sides are byte-identical except that the incoming (free_coded) side adds one frontmatter field under `fields:`: `chat_comment: comment-ee713574`. Incoming is a strict superset, so 2e's superset clause applies directly — no per-fact timeline lookup needed, since no field present on the HEAD side was changed or dropped. Resolved by `git checkout --theirs` + `git add --sparse` (path is outside the sparse-checkout cone, DOC-986 §2/§4.1).

## Incoming changes preserved

- Incoming commit `96251c37e3b11b1d9c860b66a81e95ecb95779e5` ("xgd(ticket): update request request-342de4f4") touches only this one file. `git diff --cached HEAD` on the resolved path is exactly the single line `+  chat_comment: comment-ee713574` — the incoming change is present in full, and nothing from the HEAD side was lost (all other frontmatter fields, `commits` list, `version: 0.0.39`, `bundled_in`, and the entire body including every Capability 5 section are unchanged and identical on both sides).
- No code/implementation files, UAT test files, or spec tickets were involved. No hunks dropped; the BUG-1301 precedence exception was not invoked.
