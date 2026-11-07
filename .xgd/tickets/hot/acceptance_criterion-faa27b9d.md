---
uid: acceptance_criterion-faa27b9d
id: AC-2342
type: acceptance_criterion
title: Accepting from /terms itself goes to the builder root, where the Site tab is
  the default; accepting elsewhere reloads the requested URL
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-07T08:09:49.429556+00:00'
updated_at: '2026-11-07T22:33:14.716753+00:00'
completed_at: null
last_field_updated: body
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

Serve the interstitial at a builder URL and the terms at `/terms` to an unaccepted
contact. Assert both pages carry the accept control, and that the control's success
branch navigates to `/` when the current path is `/terms` and reloads the current URL
otherwise (the page script is self-contained and is not executed in the workerd test
runtime, so the branch is asserted on the served script). Accept through the
interstitial's own JSON POST, then assert the builder root loads the builder (not the
terms) and that the Site tab is the first, default tab. Assert `/terms` still answers
with the terms and the acceptance record instead of the control.
