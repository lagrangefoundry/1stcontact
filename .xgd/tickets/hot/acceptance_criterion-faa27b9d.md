---
uid: acceptance_criterion-faa27b9d
id: AC-2342
type: acceptance_criterion
title: Accepting from /terms itself goes to the builder root, where the Site tab is
  the default; accepting elsewhere reloads the requested URL
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-07T08:09:49.429556+00:00'
updated_at: '2026-11-07T22:33:01.171426+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-0cd18650
  kind: behavior
  regression_only: false
---

## Criterion

After a successful acceptance, the terms interstitial sends the person to the builder,
where the Site tab is the default tab. Because the interstitial is served at whatever
URL was requested, accepting from any builder URL reloads that URL, which now answers
normally. Accepting from `/terms` itself goes to the builder root (`/`) instead, because
reloading `/terms` would only show the terms again (it stays readable after
acceptance). This would leave a new member reading the document they have just
accepted.

## Verification

Serve the interstitial at a builder URL, accept, and assert the page reloads that URL.
Serve the terms at `/terms`, accept, and assert the page navigates to `/` rather than
reloading `/terms`. Then assert the builder root loads with the Site tab active.