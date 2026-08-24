---
uid: goal-f5be1505
id: GOAL-42
type: goal
title: What gets included in the project KB
created_by: xgd
created_at: '2026-08-24T22:39:56.765122+00:00'
updated_at: '2026-08-24T22:39:56.765122+00:00'
completed_at: null
last_field_updated: created_at
status: concept
fields:
  provenance: discovered
  workstream: false
---

Open question: what belongs in a per-site knowledge base.

The boundary is not obvious and it matters in both directions. Too little and the AI keeps re-asking things the operator already said. Too much and every request drags irrelevant context, which costs tokens and dilutes attention -- DOC-5 is explicit that routine maintenance should be cheap and structured, with expensive AI usage confined to onboarding and site generation.

Specific boundaries to settle:

- The Design Brief. DOC-10 deliberately scoped it OUT of the chat and memory substrate, leaving it to DOC-9 as a site asset. Both documents predate the component substrate. Does it now belong in the project KB?
- Conversation history. DOC-10 commits to unbounded append-only growth with no auto-summarization. Is raw history part of the KB, or a separate store the KB indexes?
- Asset descriptions, and whether they are per-site or shared.
- Business profile, brand and voice, and design decisions with their rationale.
- The split against the system KB: per-site knowledge versus platform knowledge, and what happens to a lesson learned on one site that generalizes to all of them.

That last one is the interesting case -- it is the mechanism by which building sites makes the whole system smarter, which is the DOC-16 design-intelligence thesis.