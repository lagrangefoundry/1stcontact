---
uid: report-9f0efdad
id: REPORT-2738
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T06:09:44.066323+00:00'
updated_at: '2026-08-31T06:09:44.066323+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/chat-eaa2ce4d.md` — AA (both added), bookkeeping/chat ticket outside the sparse-checkout cone. Rule 2b (both added, one side strictly a superset) + 2e (intent/bookkeeping ticket, incoming is a strict superset). Resolved with `git checkout --theirs` + `git add --sparse`.

Both sides created the same chat ticket with identical frontmatter except the `fields` block:
- HEAD (bundle branch): `fields: {}`
- Incoming (free_coded a15d5e37): `fields:` / `  chat_comment: comment-8cf21123`

The incoming side is a strict superset — same uid/id/title/timestamps/status, plus one additional field. No field is set differently on the two sides, so there is no per-fact conflict and no timeline lookup was needed. Nothing from the HEAD side was lost.

## Incoming changes preserved

- `.xgd/tickets/hot/chat-eaa2ce4d.md`: the staged blob is `c52bcfbdb39831b160ae36306d7d716ca5109a6f`, byte-identical to the incoming commit's version of the file. The only change the incoming commit makes relative to HEAD (`fields: {}` → `fields: {chat_comment: comment-8cf21123}`) is present in the staged result.

No hunks were dropped; the BUG-1301 precedence exception was not invoked. No code/implementation files were involved in this conflict.
