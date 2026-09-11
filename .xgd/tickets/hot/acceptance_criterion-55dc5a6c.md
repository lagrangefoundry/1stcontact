---
uid: acceptance_criterion-55dc5a6c
id: AC-1712
type: acceptance_criterion
title: A placement that cannot complete is reported as a named failure on a successful
  hand-over, and the file is not lost
created_by: martin-github@westhead.me
created_at: '2026-09-11T05:02:59.207468+00:00'
updated_at: '2026-09-11T05:02:59.207468+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-aacb7060
  kind: behavior
  regression_only: false
---

## Criterion

A placement that cannot complete does not lose the client's file and is never reported as a
failed hand-over. When a file handed over for a site cannot be placed in that site's asset
library — the named site is not available, or the asset store refuses the write — the hand-over
still succeeds: the material is stored, described and findable, and the response reports both
that no site asset was produced and a named reason why.

The reported reason is a description of what went wrong, not a substitute for the file having
arrived, and it carries no platform secret: no configured credential or key value appears in
it, even though the response itself reports success.

## Verification

Hand over a file for the site while naming a site that cannot be written to. Observe that:

- the response is a successful hand-over carrying the material's identifier;
- the material is retrievable afterwards and is findable by search;
- the response states that no site asset was produced and carries a reason naming the placement
  failure;
- the reason contains none of the platform's configured secret values.
