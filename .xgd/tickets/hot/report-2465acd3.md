---
uid: report-2465acd3
id: REPORT-2708
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T05:36:25.776122+00:00'
updated_at: '2026-08-31T05:36:25.776122+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/bug-24975383.md` — class **AA** (both added), intent/bookkeeping
  ticket (2e, applied per the AA rule in 2b: incoming is the strict superset).
  Both sides created the file with byte-identical content except that the incoming
  (free_coded, `c26925da167337ad653d631246156f1904cc7638`, 2026-08-23) side carries one
  additional frontmatter field, `fields.chat_comment: comment-223071e7`, which the
  HEAD side never touched. No field is set differently on the two sides, so there is
  no per-fact conflict and no timeline lookup was needed. Resolved with
  `git checkout --theirs` + `git add --sparse` (the path is outside the sparse-checkout
  cone on this reconcile branch, DOC-986 §2/§4.1).

## Incoming changes preserved

- `.xgd/tickets/hot/bug-24975383.md`: the staged blob is `0148adc3b12fbb757f36bd0bc19bc0b329801f89`,
  byte-identical to the blob the incoming commit adds. Every line of
  `git show c26925da167337ad653d631246156f1904cc7638 -- .xgd/tickets/hot/bug-24975383.md`
  is present in the resolution, including the sole distinguishing line
  `chat_comment: comment-223071e7`. Nothing from the HEAD side was lost either — HEAD's
  content is a subset of the incoming file.

No hunks were dropped; the BUG-1301 precedence exception was not invoked. No code or
test files were involved in this conflict.
