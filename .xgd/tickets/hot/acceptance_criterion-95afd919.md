---
uid: acceptance_criterion-95afd919
id: AC-981
type: acceptance_criterion
title: A region that exposes nothing answers with an empty field list and succeeds,
  rather than failing
created_by: xgd
created_at: '2026-08-07T02:02:08.300539+00:00'
updated_at: '2026-08-10T08:23:48.132352+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-37a3921b
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Requesting the editable fields of a region that exposes nothing — a painted
panel carrying **no** background image, a behavior-module instance — **succeeds**
and returns an empty field list, with a human-readable statement that the region
has nothing to edit. It is not reported as a failure, a missing region, or an
error of any kind.

Which regions these are is decided by the surface's own derivation, not by the
caller, and the set is a shrinking one as region kinds gain fields: an image
region is not one of them, because it exposes which image goes there and its alt
text; nor is a painted panel that carries a background image, because it exposes
which image sits behind it.

## Verification

Address, in a seeded site, a painted panel carrying paint but no background
image and a module-instance region. Assert each request succeeds (success
outcome, zero exit status) and that the returned field list is empty. Contrast
with a copy region of the same page, which returns one field; an image region,
which returns two; and a painted panel carrying a background, which returns one.
