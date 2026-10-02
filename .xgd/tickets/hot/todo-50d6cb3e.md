---
uid: todo-50d6cb3e
id: TODO-10
type: todo
title: 'Uploads: handle sensitive customer data (card numbers, PII) in client documents'
created_by: CHAT-58
created_at: '2026-10-02T17:48:24.094817+00:00'
updated_at: '2026-10-02T17:48:24.094817+00:00'
completed_at: null
last_field_updated: created_at
status: open
fields:
  kind: user_task
  priority: high
  epic_parent: epic-95bc3b15
  auto_merge_back: true
---

Deferred from CHAT-58 and the "Next hypothesis" design doc §9.

The design invites clients to upload documents (business cards, brochures, price lists, invoice templates) instead of typing facts. Clients will sometimes upload documents containing their customers' data, including names, addresses and payment card numbers. It will happen.

The architecture policy says the platform must not store card data, should collect only necessary data, and must provide deletion. We need to handle this properly:
- detect sensitive content on upload
- decide between refusing, redacting and quarantining
- delete the original
- tell the client what happened and why
- make sure nothing sensitive reaches the AI provider, the knowledge index or the published site

Come back to this once the core panel interaction has been tested.
