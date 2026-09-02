---
uid: acceptance_criterion-a788800d
id: AC-1490
type: acceptance_criterion
title: The material store is declared for both the local and the deployed halves of
  the configuration, naming the same target in each
created_by: xgd
created_at: '2026-09-02T00:17:32.809209+00:00'
updated_at: '2026-09-02T00:17:32.809209+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a7a12d81
  kind: behavior
  regression_only: false
---

## Criterion

The control application's deployment configuration declares a destination for attachment bytes in
both of its halves, and the two agree:

- The half the local development runtime reads declares it.
- The named deployed half declares it too, restated rather than inherited — a named deployment
  environment inherits neither configuration values nor bindings, so an omitted restatement leaves the
  deployed application with no destination at all.
- Both halves name the **same** target, so the local runtime and the deployment are exercising one
  store and not two that could diverge.

The consequence of the deployed half omitting it is not a silent degradation: obtaining a store fails
outright with a named error (asserted separately on this capability's store story), which is a
deployment that refuses uploads rather than one that loses them.

## Verification

Read the control application's deployment configuration, split into its default half and its named
deployed half, and confirm the attachment destination is present in both, paired by the binding name
rather than counted across the file, and that the target named on each side is identical.
