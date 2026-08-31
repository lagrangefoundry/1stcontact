---
uid: report-5e929ae7
id: REPORT-2846
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T08:23:49.694462+00:00'
updated_at: '2026-08-31T08:23:49.694462+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-3b78151f.md` — class **AA** (both added), intent/bookkeeping ticket (rule 2e). Both sides carry the same `request-3b78151f` (REQ-44) body verbatim; the only difference is that the incoming (free_coded) side adds one field under `fields:` that the HEAD side never touched: `chat_comment: comment-ef79939e`. Incoming is therefore a strict superset — resolved with `git checkout --theirs`, staged with `git add --sparse` (path is outside the sparse-checkout cone, DOC-986 §2/§4.1).

No other conflict-class entries were present: `git status --porcelain` showed exactly one `AA` line and no `UU`/`DU`/`UD`/`AU`/`UA`.

## Incoming changes preserved

- `.xgd/tickets/hot/request-3b78151f.md` — verified by `git diff --cached 55c36fd750aa79621f952308beefccbe5e85a6bd -- <path>`, which is **empty**: the staged blob is byte-identical to the incoming commit's version of the file. The one substantive incoming addition (`chat_comment: comment-ef79939e`, line 30) is present in the resolved file, and no HEAD-side content was lost (the two sides were otherwise identical, so there was nothing on the HEAD side to preserve separately).

No hunks were dropped; the BUG-1301 precedence exception was not invoked. No code/implementation files were involved in this conflict.

Post-merge review flag (per the enrichment rule, intent unknown on one or both sides): the resolution did not rest on a timeline comparison — it rests on the incoming side being a literal superset of the HEAD side, so there was no competing fact to adjudicate.

Final state: `git status --porcelain` shows `M  .xgd/tickets/hot/request-3b78151f.md` and no conflict-class lines. CHERRY_PICK_HEAD left intact for `cherry_pick_finalize_resolution`.
