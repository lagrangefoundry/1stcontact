---
uid: request-1f611f31
id: REQ-387
type: request
title: Builder (delegated worker) cannot read the client's uploaded documents
created_by: xgd
created_at: '2026-10-04T20:37:43.834612+00:00'
updated_at: '2026-10-04T20:37:43.834612+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
---

## What we were trying to do
The consultant delegated a page build and told the builder to take service wording and testimonials verbatim from two client-uploaded Library documents (`role: reference`, `rights: owned`, kind `document`). The consultant can read them through `get_library_item` and `KnowledgeGet` on the `project` knowledge base.

## What stopped us
The builder reported the documents "not accessible" and put a placeholder section on the page instead. That was the right call given what it could see, but it left the first pass visibly incomplete. The builder also spent tool calls searching for the documents, which helped it hit its call limit (`outcome: exhausted`) before it ran any checks.

## What would close the gap
- Give the builder role read access to the client's Library (`list_library` / `get_library_item`) and the `project` knowledge base. Read-only is enough: the builder needs the text, not the right to place reference documents.
- Or let `Delegate` attach named Library items to the brief, so their text is handed to the worker directly.

Workaround for now: the consultant pastes the exact copy into the brief. This costs the consultant's context and depends on it remembering to do so.