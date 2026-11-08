---
uid: acceptance_criterion-89e46f3c
id: AC-2461
type: acceptance_criterion
title: Narrowing a placed material's role is refused 409 and changes nothing
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T13:55:15.548611+00:00'
updated_at: '2026-11-08T13:55:15.548611+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-1500b111
  kind: behavior
  regression_only: false
---

## Criterion

Changing a material's role to *Background information* is refused **409** when its bytes are
already on a site (its *Placed on* is not empty), and nothing changes.

- The refusal says why: the file is live where visitors can see it, so it must be taken off the
  site first. The response names the uid and the sites the material is placed on.
- The stored role, `republishable` and *Placed on* are all exactly as they were.
- **409, not 403**: this is a conflict with the material's current state, not a permission. The
  same change could succeed once the file is off the site.
- In the panel, the select goes back to *Site asset* and the refusal is shown against the field.
- Narrowing an **unplaced** upload is allowed (AC on the role correction).

## Verification

Place an uploaded site asset on the business's site, then POST `/api/material/role` with
`role: 'reference'`. Observe a 409 whose message tells the client to take the file off their site
first, and which carries the uid and `placed_on`. Read the material back and observe `role:
'site'`, `republishable: true` and the same `placed_on`. In the panel, pick *Background
information* on that material and observe the select revert to *Site asset* with the refusal
shown.
