---
uid: acceptance_criterion-69086cc3
id: AC-1713
type: acceptance_criterion
title: Material with no file behind it is refused promotion rather than publishing
  an empty asset
created_by: martin-github@westhead.me
created_at: '2026-09-11T05:03:03.322120+00:00'
updated_at: '2026-09-11T05:03:03.322120+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-aacb7060
  kind: behavior
  regression_only: false
---

## Criterion

Material that has no file attached to it is refused promotion, saying there is nothing to
publish and naming the material in question. No asset of any name appears in the site's asset
library as a result.

The same refusal covers material whose record names bytes that are no longer in storage: it is
reported as the file no longer being there rather than as the material not existing, and again
nothing is written to the site.

## Verification

Attempt to promote material that permits republishing but has no attached file. Observe a
refusal whose message says there is nothing to publish and identifies the material, and observe
that the site's asset list is unchanged. Repeat with material whose attached bytes have been
removed from storage and observe a refusal distinguishing that case, with the site's asset list
again unchanged.
