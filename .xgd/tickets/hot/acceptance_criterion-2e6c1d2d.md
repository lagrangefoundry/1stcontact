---
uid: acceptance_criterion-2e6c1d2d
id: AC-1339
type: acceptance_criterion
title: Every same-origin asset the published site's index references resolves with
  the right content type, following one level into stylesheets
created_by: xgd
created_at: '2026-08-20T05:31:36.836188+00:00'
updated_at: '2026-11-07T21:09:15.788630+00:00'
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

Given a site key, the asset check covers every **same-origin** asset the **published** site's index
references — the page at `/site/<key>/` on the origin under test — resolved against the page's own
address, and each must respond successfully with the content type its extension implies. Coverage
extends **one level into stylesheets**: assets referenced from within a returned stylesheet — where
web fonts live — are queued and checked too.

References that are not the deploy's business are excluded rather than failed: bare fragments,
inline data, and anything on another origin. A published index that does not answer successfully,
or that references no same-origin asset at all, fails rather than passes, because that is not a
rendered page. The number of assets checked is bounded and configurable, and stopping at that bound
with references still queued is reported as a failure telling the operator to raise it — never as a
silent pass. On success the check reports how many assets it verified.

There is no preview or snapshot-addressed page to crawl: the check runs against the published site
addressed by its key, and without a key it is skipped naming the site-key option.

The content types expected here and those the serving Worker answers with are the same table; the
duplication exists because this check runs outside the deployed bundle, and the two are pinned to
each other rather than left to drift.

## Verification

Give the check a published index referencing a stylesheet, a script, an image, a fragment link, an
inline data image and an off-origin script: exactly the same-origin assets are queued, and the
fragment, data and off-origin references are not. Have the stylesheet declare a web font: the font
is queued and checked. Serve one asset with a content type that does not match its extension, and
separately make one referenced asset not found, and confirm each run fails naming the asset. Serve a
published index with no same-origin references and confirm it fails. Compare every extension in the
expected table against what the serving Worker answers for that extension and confirm they agree.
