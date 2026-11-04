---
uid: acceptance_criterion-9653d8dc
id: AC-2320
type: acceptance_criterion
title: The simulator's /login lists every address in the local store and signs in
  as the chosen one
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T18:17:23.427465+00:00'
updated_at: '2026-11-04T21:15:16.840664+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-5b5be809
  kind: behavior
  regression_only: false
---

## Criterion
`GET /login` on the simulator returns an HTML page that links every address held in the local store's address table, not one per person. A person's addresses appear together, with the primary first, so after seeding both of Alice's addresses are listed. Choosing an address responds with a redirect to the builder and sets a `CF_Authorization` cookie that carries a token for that address.

## Verification
Seed, start the simulator and fetch `/login`. Assert that all five seeded addresses are present, with `alice@plumbing.example` immediately before `alice@oldsalon.example`. Follow one link and assert a 302 to the builder URL, with a `CF_Authorization` cookie whose token's email matches the chosen address.