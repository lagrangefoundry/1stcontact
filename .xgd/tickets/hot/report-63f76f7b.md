---
uid: report-63f76f7b
id: REPORT-2704
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T05:32:24.858592+00:00'
updated_at: '2026-08-31T05:32:24.858592+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-87b26bca.md` — AA (both added), intent/bookkeeping ticket (2e; outside the sparse-checkout cone, so index-only with no working-tree markers). Rule applied: **strict superset → keep the superset (incoming)**. The two sides are byte-identical apart from one added frontmatter field on the incoming side; there is no competing fact and no field changed differently on the two sides, so no timeline lookup was needed. Resolved with `git checkout --theirs` + `git add --sparse`.

## Incoming changes preserved

- Incoming commit `9ce8a229f389a9a35507a5ebfdd303e9ef21c9ee` ("xgd(ticket): update request request-87b26bca") touches exactly one file. Its only substantive delta versus the HEAD-side blob (`git diff :2:<path> :3:<path>`) is the addition of `fields.chat_comment: comment-c2754894`.
- The staged resolution is byte-identical to the incoming blob `4c7ee0fa0788251371c8a5aa05bcac8b0bade8c7`; `git diff --cached HEAD` shows exactly the `+  chat_comment: comment-c2754894` line and nothing else. The incoming change is present in full.
- No HEAD-side content was lost: every other line of the HEAD blob `a4dcecd6f11086d8478851f516a2ae95a6f571d0` (reconciliation note, pivot plan, phase tickets, coherence review, all other frontmatter fields) is retained verbatim.
- No hunks were dropped; the BUG-1301 precedence exception was not invoked. No code or UAT test files were involved in this conflict.
