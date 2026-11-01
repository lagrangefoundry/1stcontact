---
uid: acceptance_criterion-4b7c7e75
id: AC-2097
type: acceptance_criterion
title: Describing a document opens one tool-less, unprimed describer session that
  writes no conversation record and is closed afterwards
created_by: xgd
created_at: '2026-11-01T03:16:54.517390+00:00'
updated_at: '2026-11-01T03:16:54.517390+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-4cabde9a
  kind: behavior
  regression_only: false
---

## Criterion

The platform's default document describer reaches the model through the platform's own AI host
as a **lightweight session**, observable at the model boundary and in the store:

- the model is offered **no tools**;
- its system instruction is the fixed document-digest instruction and nothing else — no
  landscape of the client's material, no toolbox manual;
- describing a document creates **no conversation record** (no `chat` ticket) in the client's
  store;
- each document gets its **own session**, so two documents described in turn never share
  context — the second request carries none of the first's text;
- the session is closed after the reply, **including when the model call fails**, and the
  failure still surfaces to the description step rather than being swallowed there;
- the describer reports the model that answered, which is what is recorded as the describer.

## Verification

Build the default text describer over a fake model client at the network boundary. Describe two
different documents in turn and inspect the requests the fake received: assert each offers no
tools, carries the digest instruction as its only system content, and the second carries none of
the first document's text. Assert no `chat` ticket exists afterwards and no session remains open.
Make the fake throw and assert the describer rejects and the session is still closed.
