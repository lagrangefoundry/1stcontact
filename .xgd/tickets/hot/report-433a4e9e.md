---
uid: report-433a4e9e
id: REPORT-2862
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T08:42:38.033875+00:00'
updated_at: '2026-08-31T08:42:38.033875+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/bug-e4af6a67.md` — **AA** (both added), intent/bookkeeping ticket
  (2e + 2b superset rule). Both sides added the same BUG-10 ticket file. The two
  versions are byte-identical except that the incoming (free_coded) side carries one
  additional frontmatter field: `chat_comment: comment-dc289615`. Incoming is a strict
  superset, so the incoming version was taken whole
  (`git checkout --theirs` + `git add --sparse`). No content was invented, and no field
  present on the HEAD side was dropped.

  Path is under `.xgd/tickets/` and outside the sparse-checkout cone on this reconcile
  branch (DOC-986 §2/§4.1), so staging used `git add --sparse`.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-e4af6a67.md` — the incoming commit `fef82cd6` is a pure file
  add (73 insertions, single file). The staged blob (`:0:`) is identical to the
  incoming blob (`:3:`), so every line the incoming commit authored is present,
  including the sole distinguishing field `chat_comment: comment-dc289615` (line 25).
  Verified by diffing `:2:` against `:3:` (single-line delta) and by grepping the
  staged result for that field.

No hunks were dropped; the BUG-1301 precedence exception was not needed. No code or
UAT test files were involved in this conflict.
