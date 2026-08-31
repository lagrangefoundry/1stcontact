---
uid: report-9bd61601
id: REPORT-2867
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T08:48:07.414057+00:00'
updated_at: '2026-08-31T08:48:07.414057+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/chat-f565aaa6.md` — class **AA** (both added), bookkeeping/chat ticket outside the sparse-checkout cone (index-only conflict, no working-tree markers). Rules 2b (AA: one side strictly a superset → keep the superset, incoming wins) and 2e (intent/bookkeeping ticket: incoming only added a field the other side never touched → keep the superset). Resolved with `git checkout --theirs` + `git add --sparse`.

The two sides were byte-identical apart from one frontmatter key:

- ours (HEAD, blob `8de678610d`): `fields: {}`
- theirs (incoming `8c673f867b`, blob `6d38c8dc18`): `fields:` / `  chat_comment: comment-e7de54fa`

No competing fact, no field changed differently on both sides — the incoming side is a pure addition, so no timeline arbitration was needed. Nothing was invented beyond what the incoming side authored.

## Incoming changes preserved

- `.xgd/tickets/hot/chat-f565aaa6.md`: the incoming commit `8c673f867bb9af8f33f793ffaf47ee851e565584` adds this file with `fields.chat_comment: comment-e7de54fa`. The staged blob is `6d38c8dc18ded9d0340d3ae7608e5c4a584b4136` — byte-identical to the blob the incoming commit introduces, including the missing trailing newline. Every line of the incoming diff is present in the resolution.

No hunks were dropped; the BUG-1301 precedence exception was not invoked. No code, test, or UAT files were involved in this conflict.

`git status --porcelain` shows no remaining conflict-class entries; the file is staged as `M`. CHERRY_PICK_HEAD is left intact for `cherry_pick_finalize_resolution`.
