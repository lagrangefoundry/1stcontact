---
uid: acceptance_criterion-934e8fdc
id: AC-2027
type: acceptance_criterion
title: All six picture kinds resolve to a picture of what they name (five page kinds
  plus a stored image), with the documented defaults
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-27T19:42:07.448209+00:00'
updated_at: '2026-11-08T23:02:42.037807+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-58b2cec4
  kind: behavior
  regression_only: false
---

## Criterion
Through `screenshot`, all six picture kinds resolve to a picture of what they name: a `reference` picture (bundle + viewport) returns the captured screenshot for that viewport; a `draft` picture returns the site's working copy rendered at the page path; an `edit` picture returns the page as served on the edit channel; a `revision` picture returns that published revision rendered; a `url` picture returns the page at that address; an `image` picture (REQ-218) returns the stored picture it names. For the five page kinds `page` defaults to `/` and `viewport` defaults to `desktop`; an `image` picture takes no viewport and is reported at its own size (after any reduction). The text the operation returns names the resolved source back (kind and what it identified) — for an `image`, which store holds it (`site` or `library`), its exact name and, when it differs, its Library title.

## Verification
With a stubbed browser and an in-memory store seeded with a reference bundle, a draft, a published revision and a stored PNG site asset, take a screenshot of each of the six kinds and assert each returns the expected picture and a label naming its source; assert omitted page/viewport resolve to `/` and `desktop` for the page kinds; assert the `image` screenshot's label names `site image <filename>` and its size is the stored picture's own dimensions.
