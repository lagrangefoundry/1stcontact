---
uid: goal-f7ce1efe
id: GOAL-33
type: goal
title: Knowledge management
created_by: xgd
created_at: '2026-08-24T22:38:42.816121+00:00'
updated_at: '2026-08-24T22:38:42.816121+00:00'
completed_at: null
last_field_updated: created_at
status: concept
fields:
  provenance: planned
  workstream: false
---

Bring the knowledge-management system into the 1st Contact app.

DOC-10 commits to the substrate: per-site chat sessions, unbounded append-only growth, tail-prime, infinite scroll, no auto-summarization, plus a platform-level Reference Document library the AI consults on demand. REQ-123 revised that document -- the chat schema, the Reference Document library and the four memory tools are now supplied by COMPONENTS rather than built bespoke here. The design intent did not change; the implementation route did.

Scope boundary per DOC-10: this is the conversation-history and AI-consulted-reference substrate. It does NOT cover the per-site Design Brief, which is owned by DOC-9 and stored as a site asset.

Evidence: no knowledge-management code in this repo yet -- the substrate arrived elsewhere. This goal is the adoption into the 1c app.

Children: core system, system KB, project KB.