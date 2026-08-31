---
uid: report-faba6ba3
id: REPORT-2735
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T06:07:02.403649+00:00'
updated_at: '2026-08-31T06:07:02.403649+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-873e74dd.md` — AA (both added), out of the
  sparse-checkout cone so the conflict existed index-only. Intent/bookkeeping
  ticket (`request-*`), so rule 2e applied. Diffing the two index blobs
  (stage 2 `e2ffbaf` vs stage 3 `2823ab3`) showed the incoming side is a
  strict superset: identical byte-for-byte except for one added frontmatter
  field, `fields.chat_comment: comment-845f9be0`. No field or section is
  changed differently on the two sides, so no timeline lookup was needed —
  "keep the superset" applies directly. Resolved with
  `git checkout --theirs`, staged with `git add --sparse`.

## Incoming changes preserved

- `.xgd/tickets/hot/request-873e74dd.md` — the staged blob is the incoming
  blob verbatim. `git diff --cached --stat` reports exactly `1 insertion(+)`,
  the `chat_comment: comment-845f9be0` line, which is the whole of the
  incoming commit's delta relative to HEAD's version of this file. Nothing
  from the HEAD side was dropped (HEAD's content is wholly contained in the
  incoming version).

No hunks were dropped; the BUG-1301 precedence exception was not invoked.
No code, test, or config files were involved in this conflict.
