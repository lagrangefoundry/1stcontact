---
uid: acceptance_criterion-3b4b793b
id: AC-2248
type: acceptance_criterion
title: Admission and the invite resolve a person through any of their addresses, including
  an invite or login at a secondary address
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T16:30:31.826740+00:00'
updated_at: '2026-11-04T17:07:23.470809+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

Admission and the invite both find a person through any of the addresses their
business holds for them, not only the primary one. Inviting a person at a
secondary address reports the existing person as not created, writes no second
person, and adds no address to them. A login presenting a secondary address is
admitted as that person, and the admission carries the person's primary address,
whichever address was presented.

## Verification

In workerd against real D1: invite a person at one address, then give them a
second, non-primary address. Invite the second address and assert the response
reports "not created" with the same person id, that the business still holds one
person for the two addresses, and that the person still holds exactly two
addresses. Provision a business for the person, attempt admission with the
secondary address, and assert it is admitted as that person carrying the primary
address.