---
uid: acceptance_criterion-e19026fa
id: AC-2213
type: acceptance_criterion
title: A business's authored portal site is served at /account; a business without
  one gets the shipped default portal
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T20:16:05.002297+00:00'
updated_at: '2026-11-01T20:16:05.002297+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-83ff6262
  kind: behavior
  regression_only: false
---

## Criterion
If the host business's store holds a site under the reserved slug `portal`, /account serves that site's current draft content. If it does not, /account serves the shipped default portal: a single home page titled "Your account" whose site settings (theme and navigation shape) match the starter site every new site is created with, with the business name shown as "Your account". Once a `portal` site is written into the business, the next request serves it instead of the default.

## Verification
With no `portal` site in the host store, request /account and check the default page (title "Your account", Delete account control, erasure explanation) whose theme matches a freshly scaffolded site. Write a `portal` site draft with distinctive text, request /account again, and check the distinctive text is served and the default is not.
