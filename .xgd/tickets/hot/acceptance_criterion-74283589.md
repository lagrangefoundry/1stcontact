---
uid: acceptance_criterion-74283589
id: AC-2449
type: acceptance_criterion
title: Capture records which text runs share an inline flow, and a line break or blockified
  child ends a flow
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T13:28:28.653639+00:00'
updated_at: '2026-11-08T13:28:28.653639+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-1e340c9a
  kind: behavior
  regression_only: false
---

## Criterion
When a page is captured, each captured text run records its inline-flow membership: a flow identifier, its position in that flow, the flow root's rectangle, its text with its own separating spaces kept, and its vertical alignment. Runs in one sentence (e.g. a paragraph with an `<em>` word) share a flow id with ascending positions. A `<br>` starts a new flow, and so does any child the browser blockifies (e.g. the items of a flex row of links), so those runs do not share a flow.

## Verification
Capture fixture pages (browser-backed): a paragraph with an emphasised word — assert its runs share one flow id in order with the paragraph's rect; a paragraph split by `<br>` — assert two flows; a flex row of links — assert the links are not one flow.
