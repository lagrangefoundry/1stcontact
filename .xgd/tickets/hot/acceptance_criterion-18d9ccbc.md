---
uid: acceptance_criterion-18d9ccbc
id: AC-556
type: acceptance_criterion
title: Safe URLs render unchanged
created_by: xgd
created_at: '2026-07-10T00:33:46.303199+00:00'
updated_at: '2026-07-10T00:33:46.303199+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-38de5800
  kind: behavior
  regression_only: false
---

## Criterion
A URL that is relative, an in-page `#anchor`, scheme-less, or carries a safe scheme
(`http`, `https`, `mailto`, `tel`) renders unchanged with no error. A
`data:image/*` value renders unchanged when used as an image source (the one
permitted `data:` form). The rendered output contains the value exactly as supplied.

## Verification
Render modules whose link/resource sinks carry each safe URL form; assert the render
succeeds with no content-safety error and the output preserves each URL verbatim.
