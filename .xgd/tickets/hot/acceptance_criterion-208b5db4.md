---
uid: acceptance_criterion-208b5db4
id: AC-953
type: acceptance_criterion
title: Every stamped address resolves to exactly one node — the one it was derived
  from — and no address repeats within its namespace
created_by: xgd
created_at: '2026-08-06T21:26:38.090635+00:00'
updated_at: '2026-08-16T04:18:42.402190+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-af36c2cb
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Every address stamped on the edit render can be resolved against the definition
the page was rendered from, and resolving it yields exactly one node: the node
whose emission produced that region. The resolved node's kind agrees with the
region kind stamped beside it — a copy address resolves to a text node, an image
address to an image, a container address to a container, a module address to the
seam the behavior is mounted in.

No two regions in the same address namespace carry the same address, so an
address identifies one region unambiguously.

## Verification

Render the edit channel of a seeded page, collect every stamped address and
region kind from the page's own namespace, and resolve each against the stored
definition. Assert every address resolves, that each resolved node's kind matches
the stamped region kind, and that the collected addresses are all distinct.