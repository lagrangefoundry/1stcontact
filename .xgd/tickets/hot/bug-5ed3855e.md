---
uid: bug-5ed3855e
id: BUG-185
type: bug
title: KnowledgeGet refuses a material uid that KnowledgeSearch just returned (not_in_corpus)
created_by: xgd
created_at: '2026-10-03T19:16:59.056170+00:00'
updated_at: '2026-10-03T19:16:59.056170+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
---

## What happened
`KnowledgeSearch` (kb `project`) returned hits of `type: material` with uids such as `material-2537c2d0` and `material-c271caf3`, both client-uploaded markdown documents. Calling `KnowledgeGet` with those exact uids failed with `not_in_corpus` ("No document with that uid is in this session's knowledge corpus. Uids come from search hits…"), even though they did come from a search hit in the same turn.

`get_library_item` on the same items worked, but it returns only the generated description, not the document text. So the full text of a client's uploaded document cannot be read at all.

## Expected
Any uid that search returns should be readable by `KnowledgeGet`. If not, search should not return it, or the hit should say which tool reads it.

## Reproduce
Upload a markdown document, call `KnowledgeSearch` for its content, then call `KnowledgeGet` with the returned `material-…` uid.