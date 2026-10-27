---
uid: acceptance_criterion-934e8fdc
id: AC-2027
type: acceptance_criterion
title: All five picture kinds resolve to a picture of what they name, with the documented
  defaults
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-27T19:42:07.448209+00:00'
updated_at: '2026-10-27T19:42:07.448209+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-58b2cec4
  kind: behavior
  regression_only: false
---

## Criterion
Through `screenshot`: a `reference` picture (bundle + viewport) returns the captured screenshot for that viewport; a `draft` picture returns the site's working copy rendered at the page path; an `edit` picture returns the page as served on the edit channel; a `revision` picture returns that published revision rendered; a `url` picture returns the page at that address. `page` defaults to `/` and `viewport` defaults to `desktop`. The text the operation returns names the resolved source back (kind and what it identified).

## Verification
With a stubbed browser and an in-memory store seeded with a reference bundle, a draft and a published revision, take a screenshot of each of the five kinds and assert each returns the expected picture and a label naming its source; assert omitted page/viewport resolve to `/` and `desktop`.
