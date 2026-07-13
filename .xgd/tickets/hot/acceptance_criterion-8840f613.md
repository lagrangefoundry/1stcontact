---
uid: acceptance_criterion-8840f613
id: AC-602
type: acceptance_criterion
title: contentWidth dial narrows a plain prose block's content
created_by: xgd
created_at: '2026-07-13T20:31:53.603777+00:00'
updated_at: '2026-07-13T20:31:53.603777+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-8a42499e
  kind: behavior
  regression_only: false
---

## Criterion
When an author sets the `contentWidth` dial on a prose text block — including an
ordinary block with no contained panel — the block's content is capped to the
requested measure: the block is marked as width-constrained and its content is
limited to the chosen width. The narrower measure takes effect on a plain
(non-panelled) block, not only on a panelled one.

## Verification
Render a `prose`-variant, non-panelled text block with the `contentWidth` dial set
to a narrower measure. Observe that the block reports a width-constraint marker and
that its content column is limited to the requested width rather than the full
container. Confirm the same block WITHOUT a panel is narrowed (the constraint is
not inert on a plain block).
