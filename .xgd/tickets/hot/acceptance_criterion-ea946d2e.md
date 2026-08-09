---
uid: acceptance_criterion-ea946d2e
id: AC-848
type: acceptance_criterion
title: 'A page whose definition declares no links publishes exactly as it did before
  navigation existed: no links, and every node in its own element type'
created_by: xgd
created_at: '2026-08-06T02:48:29.376969+00:00'
updated_at: '2026-08-09T05:41:19.975937+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-2e4e2c45
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
Navigation is additive. A definition in which no node declares a link target
publishes with no links at all and with every node presented in its own element
type — runs as text blocks, boxes and containers as block elements, images as
media leaves — and with markup and styles otherwise unchanged from before the link
role existed. Adopting navigation on one node changes only that node.

## Verification
Publish a page with runs, boxes, a container and an image, none declaring a link.
Assert the published markup contains no link element and no target attribute, and
that each node appears in its own element type. Then add a link target to one node
only, publish again, and assert that node's element became the link while every
other node's markup and style declarations are byte-identical to the first
publish.