---
uid: acceptance_criterion-e4c4d77e
id: AC-2049
type: acceptance_criterion
title: A capture that follows more than 5 redirect hops is refused as a redirect loop;
  subresources from many origins do not count as hops
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-27T21:19:35.030326+00:00'
updated_at: '2026-10-27T21:19:35.030326+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-31204812
  kind: behavior
  regression_only: false
---

## Criterion
A capture whose navigation follows more than 5 redirect hops is treated as a redirect loop and refused under `REFUSED`, with a refusal of reason `redirect-cap` naming the URL at which the cap was reached. **Subresources do not count as hops:** a page that loads its images, fonts, scripts and styles from many distinct public origins (more than 5) is captured normally, with no `redirect-cap` refusal.

## Verification
With a doubled network, make a public URL redirect through 6 or more distinct hops and assert `REFUSED` with reason `redirect-cap`. Separately, capture a public page with no redirects whose subresources come from 8 distinct public origins, and assert it succeeds with an empty `refusals` array and every subresource fetched. (The second assertion fails against the code as landed: see *Code issues* item 1 in the story.)
