---
uid: acceptance_criterion-e4c4d77e
id: AC-2049
type: acceptance_criterion
title: 'On the Worker host a capture that reaches more than 5 distinct origins, such
  as a long redirect chain, trips the redirect cap: later requests are never sent
  and the trip is reported in refusals, but a reference is still returned'
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-27T21:19:35.030326+00:00'
updated_at: '2026-10-30T20:02:44.501257+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-31204812
  kind: behavior
  regression_only: false
---

## Criterion
On the Worker host, a capture whose navigation follows a redirect chain through more than 5 distinct hosts trips the guard's redirect cap. The request that reaches the cap, and every request after it, is refused at the seam and never sent. `capture_site` still returns a result, and its `refusals` array carries one entry with reason `redirect-cap` naming the URL at which the cap was reached, plus a detail saying it is treated as a redirect loop.

> Aligned to code per fix_plan iteration 6 ruling (aligned_to_tip). Two clauses are retired. (1) "Refused under `REFUSED` with no reference offered": `capture_site` does not check `guard.tripped`, see STORY-159 Known gaps. (2) "Subresources from many origins do not count as hops": the guard counts every distinct origin, and out-of-window BUG-127 changes that behaviour.

## Verification
With a doubled network on the Worker host, make a public URL redirect through 7 distinct hosts. Assert the result is not an error and `refusals` holds exactly one `redirect-cap` entry naming `https://hop6.test/`. Assert hops 1–5 were forwarded and hops 6–8 were not.