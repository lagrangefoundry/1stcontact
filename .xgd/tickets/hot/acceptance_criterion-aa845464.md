---
uid: acceptance_criterion-aa845464
id: AC-1338
type: acceptance_criterion
title: Every skip names the one argument that would run it, no check can only skip,
  and --slug/--draft are rejected
created_by: xgd
created_at: '2026-08-20T05:31:31.941022+00:00'
updated_at: '2026-11-07T21:09:20.719451+00:00'
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

A check with nothing to test against is reported as **skipped**, never as passed, and **every skip
names the single argument that would make that check run**:

- run without a site key, the six published-site checks (the unpublished-site comparison, the
  published trailing-slash redirect, the index serving HTML, the published cache policy, the miss
  answering not-found, and the asset crawl) are each skipped naming the site-key option;
- run against an origin that is not the platform's own apex without a control origin, the
  control-origin check is skipped naming the control-origin option;
- run without the platform-default hostname, that check is skipped naming its option.

The origin-level checks always run and report their outcome. **No check can only skip**: with every
input supplied, nothing is skipped. Skipped checks do not make the run fail, and the summary counts
them separately from passes, so a run that proved nothing is visibly a run that proved nothing
rather than a green result.

The site-key option is the only way to name the site under test. The former slug option and the
preview-identifier option no longer exist: supplying either is rejected as an unknown argument with a
non-zero exit, rather than being silently accepted.

## Verification

Run the check against a correct non-apex origin with no other input: the six published-site checks
are skipped each naming the site key, the two operator-surface checks are skipped each naming its
own option, the origin-level checks pass, the exit status is zero, and the summary reports the skip
count separately from the pass count. Run it with the site key, a control origin and the
platform-default hostname supplied: nothing is skipped. Run it with the old slug option, and
separately with the old preview option: each is rejected as an unknown argument and exits non-zero.
