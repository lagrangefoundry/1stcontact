---
uid: report-bc1821e2
id: REPORT-2720
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T05:49:09.098353+00:00'
updated_at: '2026-08-31T05:49:09.098353+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/chat-2aaa79f4.md` — class **AA** (both added), bookkeeping/intent ticket
  (`chat-*`, STEP 2e) resolved under **2b superset rule**. Both sides added the same 481/482-line
  chat ticket; the only difference is a single frontmatter fact: HEAD has `fields: {}`, the
  incoming `free_coded` commit `58bde6fe48ac2a53475c4894b23445ebfe89ff99` has
  `fields:\n  chat_comment: comment-2c16318b`. The incoming version is a strict superset — the
  entire body and all other frontmatter are byte-identical — so no per-fact timeline lookup was
  needed (no fact is set differently on the two sides; one side simply never set it).
  Resolved with `git checkout --theirs` + `git add --sparse` (path is outside the sparse-checkout
  cone, DOC-986 §2/§4.1). Staged blob is byte-identical to the incoming blob `71caecea40`.

The auto-enrichment flagged "intent unknown on one or both sides → take the more recent commit by
timestamp and flag for post-merge review." That rule is moot here: the two sides are not competing,
one is a proper superset of the other, and taking the incoming side also satisfies the timestamp
rule (incoming is the `free_coded` developer commit). No post-merge review concern beyond noting
that `comment-2c16318b` is now referenced by this chat ticket.

## Incoming changes preserved

- `.xgd/tickets/hot/chat-2aaa79f4.md`: confirmed. `git show 58bde6fe48 -- <file>` is a whole-file
  add of 483 lines; the staged index entry is exactly that blob (`71caecea40`), so 100% of the
  incoming content is present, including the `chat_comment: comment-2c16318b` field that is the
  sole delta against HEAD's version. `git diff --cached` shows precisely that one-fact addition and
  nothing else.

No hunks were dropped; the BUG-1301 precedence exception was not invoked. No code, test, or spec
(2d) files were involved in this conflict. No UAT test functions were touched or deleted.
Cherry-pick sequencer state (`CHERRY_PICK_HEAD`) left intact for
`cherry_pick_finalize_resolution`.
