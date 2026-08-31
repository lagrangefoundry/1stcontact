---
uid: report-f16532d2
id: REPORT-2721
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T05:50:40.071867+00:00'
updated_at: '2026-08-31T05:50:40.071867+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/bug-5cabb340.md` — class **AA** (both added; no merge base in
  the index, stages 2 and 3 only). Bookkeeping/intent ticket (a `bug-*` ticket,
  not a matrix-defining spec ticket), so rules **2b** (AA: one side a strict
  superset → keep the superset, incoming wins when incoming is larger) and **2e**
  (intent ticket: keep the superset when incoming only added a field the other
  side never touched) both point the same way. Resolved by taking the incoming
  (free_coded) side: `git checkout --theirs`, then `git add --sparse`.

  The two sides are byte-identical except for a single added frontmatter field on
  the incoming side:

      fields:
        merged_at_commit: 125f1dccf1d687ee30cea8ee6db751175296bc31
      +  chat_comment: comment-bc71b831

  No field is changed differently on the two sides, so there is no per-fact
  conflict and no timeline lookup was needed. The enrichment metadata's fallback
  rule ("intent unknown on one or both sides → take the more recent commit and
  flag for post-merge review") is moot here: the superset relation is exact, and
  taking incoming loses nothing from the HEAD side.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-5cabb340.md` — confirmed. The incoming commit
  `0511bdf17af2fd9920410d088088adc9a078049f` touches only this file (119
  insertions, whole-file add). The resolved working-tree file hashes to
  `c2ec42638193600cf8c50d017811115b2da8fec6`, which is exactly the incoming
  stage-3 blob, so 100% of the incoming content is present verbatim. The
  distinguishing field `chat_comment: comment-bc71b831` is present at line 26.

No code/implementation files were in conflict. No test functions were touched,
so rule 2f is not engaged. No hunks were dropped, so the BUG-1301 precedence
exception was not invoked and nothing requires post-merge review on that basis.

Staging verified clean: no `UU`/`AA`/`DU`/`UD` lines remain; the file shows as
`M ` (staged modification). `CHERRY_PICK_HEAD` is still present at
`0511bdf17af2fd9920410d088088adc9a078049f` — no cherry-pick state transition was
performed.
