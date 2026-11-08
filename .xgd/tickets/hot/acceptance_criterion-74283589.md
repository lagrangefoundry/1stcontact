---
uid: acceptance_criterion-74283589
id: AC-2449
type: acceptance_criterion
title: Capture records which text runs share an inline flow, and a line break or blockified
  child ends a flow
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T13:28:28.653639+00:00'
updated_at: '2026-11-08T13:38:19.239971+00:00'
completed_at: null
last_field_updated: body
status: pending
fields:
  story_uid: story-1e340c9a
  kind: behavior
  regression_only: false
---

## Criterion
When a page is captured, each text run that shares an inline flow with at least one other run records its inline-flow membership: a flow identifier, its position in that flow, the flow root's rectangle, its text with its own separating spaces kept, and its vertical alignment. A run that is alone in its flow records none of these, so the common single-run case carries no flow information. Runs in one sentence (e.g. a paragraph with an `<em>` word, or two inline spans in one paragraph) share a flow id with ascending positions. A `<br>` starts a new flow, and so does any child the browser blockifies (e.g. the items of a flex row of links), so those runs do not share a flow. When each piece is left as a flow of one, it carries no flow id.

## Verification
Capture fixture pages (browser-backed): a paragraph with an emphasised word — assert its runs share one flow id in order with the paragraph's rect, spaces kept on the flow text, and a superscript's vertical alignment recorded; two inline spans in one paragraph (control) — assert they share a flow id; a paragraph split by `<br>` into one-run lines — assert neither line carries a flow id; a flex row of links — assert no link carries a flow id.
