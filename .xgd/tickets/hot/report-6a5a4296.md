---
uid: report-6a5a4296
id: REPORT-2861
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T08:41:25.366158+00:00'
updated_at: '2026-08-31T08:41:25.366158+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-72e890ab.md` — class **AA** (both added), intent/bookkeeping ticket (§2e).
  Both sides added byte-identical content except that the incoming (free_coded)
  side carries one extra key in `fields`: `chat_comment: comment-a86c1b28`.
  Incoming is a strict superset of ours, so the superset rule applies — no
  field is changed differently on the two sides, so no timeline arbitration
  was needed. Resolved with `git checkout --theirs` + `git add --sparse`
  (path is outside the sparse-checkout cone, DOC-986 §2/§4.1).

## Incoming changes preserved

- `.xgd/tickets/hot/request-72e890ab.md`: the incoming commit
  `d0b685b67e5db98cb613114070c2628a624d482f` ("xgd(ticket): update request
  request-72e890ab") adds this file as 42 lines. The staged blob is
  `4c6c1ad0afa0a3396db4768ac940c3503f00ec24`, byte-identical to the incoming
  (stage 3) blob, so 100% of the incoming content is present. The staged diff
  vs HEAD is exactly one added line, `  chat_comment: comment-a86c1b28`,
  which is precisely the incoming side's contribution. Nothing from the HEAD
  side was dropped (HEAD's version is a subset of the result).

No hunks were dropped; the BUG-1301 precedence exception was not invoked.
No code, test, or spec-ticket files were involved in this conflict.
