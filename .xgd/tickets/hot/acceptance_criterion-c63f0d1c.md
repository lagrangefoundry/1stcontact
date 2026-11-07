---
uid: acceptance_criterion-c63f0d1c
id: AC-1336
type: acceptance_criterion
title: Against a correctly serving origin with every input supplied all ten smoke
  checks pass and nothing is skipped
created_by: xgd
created_at: '2026-08-20T05:31:20.823028+00:00'
updated_at: '2026-11-07T21:09:25.458450+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-d5167ced
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Against an origin that is serving correctly, given a site key, a control origin and the
platform-default hostname, the smoke check runs all ten checks, every one passes, **nothing is
skipped**, and the command exits zero with a summary stating how many passed and how many were
skipped.

The eight public-serving checks are all on the published channel: the apex resolves; an unknown site
is not found; a site with nothing published is indistinguishable from an unknown one; the published
trailing-slash redirect holds; the published index answers successfully as HTML; the published index
carries the published cache policy; a missing object and a missing directory under a published site
each answer not-found rather than a listing; and every asset the published index references
resolves. The other two assert the operator surface is private.

When fewer inputs are supplied, a passing run may skip, but each skip is **named** and names the
argument it wanted, so "everything applicable passed" and "nothing was left untested" are
distinguishable rather than conflated. Against the platform's own apex with no other argument, three
checks run (the apex, the unknown site, and the control-origin challenge) and seven skip; adding a
site key, nine run and only the platform-default-hostname check skips. A skip is never counted as a
pass and never makes the run fail.

The origin under test is a parameter of the run, so the same checks are used against production and
against any other serving origin.

## Verification

Point the check at a public-serving origin behaving as expected, supplying a site key, a control
origin and a platform-default hostname: the report lists all ten checks as passed, none skipped, and
the exit status is zero. Confirm the asset check reports the number of assets it verified rather than
reporting a pass having verified none. Run it against the apex with only a site key: exactly the
platform-default-hostname check is skipped and named.
