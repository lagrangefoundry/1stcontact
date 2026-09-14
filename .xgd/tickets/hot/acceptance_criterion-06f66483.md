---
uid: acceptance_criterion-06f66483
id: AC-1768
type: acceptance_criterion
title: An absent bundle member is an answer rather than a fault, except the capture
  record, whose absence names the bundle
created_by: martin-github@westhead.me
created_at: '2026-09-14T04:48:58.988275+00:00'
updated_at: '2026-09-14T05:00:55.961300+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-0cb7f25b
  kind: behavior
  regression_only: false
---

## Criterion
Reading a member a bundle does not hold succeeds and reports absence; it does not
raise. This holds identically on every backing:

- the retained observation, the folded document and the structural hints each read
  as absent from a bundle that has none — a bundle predating a member is the
  ordinary case, since several members were added to the artifact over time
- the form model and the mirrored-asset list read as **empty** rather than absent,
  because empty is the honest reading of "this page has no behaviours" and "this
  page mirrored no remote media", not a missing artifact
- enumerating an empty bundle's members yields nothing
- the capture record is the one member a bundle cannot be without: reading it from
  a bundle that has none is refused with a message naming that bundle, rather than
  failing on a parse of nothing

## Verification
Take a handle on a bundle nothing has been written to, on each backing. Assert
each optional member reads absent, the form model and asset list read empty, the
member enumeration is empty, and reading the capture record is refused with the
bundle's name in the message.