---
uid: acceptance_criterion-c16be885
id: AC-2249
type: acceptance_criterion
title: Correcting a contact's address rewrites the primary row, and neither that nor
  changing which address is primary changes any key
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T16:30:33.500509+00:00'
updated_at: '2026-11-04T16:30:33.500509+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a55c2f35
  kind: behavior
  regression_only: false
---

## Criterion

Correcting a contact's address rewrites their primary address in place: afterwards
the person holds the corrected address as primary, the old address no longer
reaches anyone, and no second address was added. A person holding no address at
all gains the corrected one as their primary. Neither the correction nor a change
of which of a person's addresses is primary alters the person's key or any
reference to the person: their memberships, grants, name rows and history stay
attached to the same person.

## Verification

In workerd against real D1: invite a person, provision them a business, and give
them a second address. As the owner, correct their address and assert the primary
is the new value, the person still holds exactly two addresses, and admission with
the old address is refused while the new one admits the same person id. Seed a
person with no address, correct theirs, and assert they now hold one, primary.
Swap the primary flag between a person's two addresses in storage and assert the
person's id, their memberships and their name are unchanged and both addresses
still resolve to them.
