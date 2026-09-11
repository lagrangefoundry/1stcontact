---
uid: acceptance_criterion-e573b281
id: AC-1644
type: acceptance_criterion
title: Every definition in a generated reference stands on its own, citing no internal
  ticket
created_by: martin-github@westhead.me
created_at: '2026-09-11T02:36:29.953146+00:00'
updated_at: '2026-09-11T02:36:29.953146+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-5836022a
  kind: behavior
  regression_only: false
---

## Criterion

Every sentence a generated reference carries stands on its own for the person
reading it: a definition that cannot be stated without pointing at an internal
work item is left out rather than carried across, so no generated reference sends
the assistant — or the client reading its answer — to an internal ticket.

The sources' own comments are full of the engineering record; that record is
written for a different reader, and a client-facing reference that ends in a
ticket reference is a dead end for the reader it was written for.

## Verification

Scan the body of each generated reference for internal work-item references (the
ticket-identifier forms this project uses): none is present. Confirm the rule is
by omission and not by luck — a source comment whose definition is expressed only
in terms of a ticket reference produces no definition in the document, while the
field itself is still listed with its type and requiredness.
