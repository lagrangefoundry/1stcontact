---
uid: goal-deb3d7f8
id: GOAL-34
type: goal
title: KM core system
created_by: xgd
created_at: '2026-08-24T22:38:47.035959+00:00'
updated_at: '2026-08-25T05:39:31.959049+00:00'
completed_at: null
last_field_updated: body
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

Blocked in practice on the backend data model question -- see the open design questions. Now recorded as a real `depends_on` edge to GOAL-43 rather than only as prose, so the readiness rule can see it.

## Open, raised 2026-08-24 evening -- resolve before implementation

The operator named this the first of four next priorities, phrased as *"get the KMS system **with ticket backing** running on 1c"*.

**Ticket backing is not what this goal currently says.** The paragraph above commits to D1 for structured records and R2 for payloads, per DOC-5. There are at least two readings of the operator phrasing and they imply different data models:

1. **Compatible reading** -- KB entries are ticket-shaped records (as xgd docs already are), persisted in D1 underneath. Ticket backing describes the record model, not the storage engine. Nothing here changes.
2. **Substrate reading** -- the ticketing store itself becomes the KB backing store, the way it already is for xgd docs and chats. That is a different architecture from the D1/R2 split above, and it would inherit the ticketing store operational characteristics -- including, as of this week, the overlay-routing and index-staleness work still settling in xgd (REQ-816 and its fallout).

This matters more than a wording nit because **GOAL-43 (what the backend data model really looks like) is the open question this goal already depends on**, and it explicitly lists the two knowledge bases as entities that "have no home in the entity list" from DOC-5. The ticket-backing question is not separate from GOAL-43; it is part of it, and answering it is most of what unblocks this goal.

Worth deciding before any code, not during -- the last three permissions rounds each cost a day by encoding the model wrong first.