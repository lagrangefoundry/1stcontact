---
uid: goal-deb3d7f8
id: GOAL-34
type: goal
title: KM core system
created_by: xgd
created_at: '2026-08-24T22:38:47.035959+00:00'
updated_at: '2026-08-24T23:10:40.968409+00:00'
completed_at: null
last_field_updated: depends_on
status: concept
fields:
  provenance: planned
  workstream: false
  depends_on:
  - goal-4bb0f66d
---

The core knowledge-management machinery: storage, retrieval, and the tool surface the AI uses to consult and write knowledge.

Per REQ-123 this is supplied by components rather than built bespoke -- the chat schema, the Reference Document library and the memory tools all come from the component substrate. The work here is adoption and wiring into the 1st Contact app, not reimplementation.

Architectural home per DOC-5: D1 for structured records, R2 for larger payloads and archived content.

Blocked in practice on the backend data model question -- see the open design questions.