---
uid: report-462aadb5
id: REPORT-2823
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T07:55:33.466707+00:00'
updated_at: '2026-08-31T07:55:33.466707+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-07d0e3e1.md` — AA (both added), intent/bookkeeping
  ticket (`request-*`), rule 2e. Outside the sparse-checkout cone, so resolved
  via `git checkout --theirs` + `git add --sparse`.

  The two sides are byte-identical except for a single added frontmatter field
  on the incoming side:

      fields:
        version: 0.0.137
      +  chat_comment: comment-bfd601b7

  Incoming is a strict superset of HEAD (it only appends a field HEAD never
  touched; no field, section, or narrative differs). Per 2e's superset rule the
  incoming version was kept whole. No timeline lookup was needed — there is no
  competing fact.

## Incoming changes preserved

- `.xgd/tickets/hot/request-07d0e3e1.md`: the incoming commit
  32a4385410508639137473bffe45240f6f98fa05 (`xgd(ticket): update request
  request-07d0e3e1`) adds the whole file at 140 lines; relative to HEAD its only
  net content is `chat_comment: comment-bfd601b7`. That line is present in the
  resolved/staged file — `git diff --cached` against HEAD shows exactly that one
  insertion and nothing else. Nothing from either side was dropped.

No code/implementation files were involved, and no hunks were dropped under the
BUG-1301 precedence exception.
