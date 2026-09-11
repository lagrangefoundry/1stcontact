---
uid: acceptance_criterion-9522297b
id: AC-1710
type: acceptance_criterion
title: Material whose rights record forbids republishing is refused promotion by every
  route, with nothing written to the site
created_by: martin-github@westhead.me
created_at: '2026-09-11T05:02:51.081307+00:00'
updated_at: '2026-09-11T05:13:45.185468+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-aacb7060
  kind: behavior
  regression_only: false
---

## Criterion

Material whose own rights record does not permit republishing is refused promotion into any
site's asset library, and the refusal happens before anything is written: the site's asset
library is exactly what it was, and no asset becomes servable.

The decision is taken from the material's stored rights record and from nothing a caller
supplies, so the same request is refused or permitted purely as a function of that record. A
file the client handed over stating it was only for the platform to read is therefore refused
by this same rule rather than by not being routed anywhere: the hand-over succeeds, the
material is stored and findable, and it produces no site asset.

The refusal is stated as a rule rather than as a malformed request or a platform failure, in
words that tell the client the material came from elsewhere and may be used as reference
instead.

## Verification

With a site that already has a known set of assets:

- attempt promotion of material whose rights record forbids republishing; observe the refusal,
  its rule-shaped wording, and that the site's asset list is unchanged afterwards;
- hand over a file stating it is only for the platform to read while a site is selected;
  observe that the material is created, that its rights record forbids republishing, that the
  response reports no site asset, and that the site's asset count is unchanged;
- observe that promoting material whose record does permit republishing succeeds under
  otherwise identical inputs, so the outcome follows the record.