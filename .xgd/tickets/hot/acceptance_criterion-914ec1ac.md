---
uid: acceptance_criterion-914ec1ac
id: AC-2225
type: acceptance_criterion
title: The builder's avatar dialog links out to the portal in a new tab and adds nothing
  else
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T20:16:21.930427+00:00'
updated_at: '2026-11-01T20:16:21.930427+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-83ff6262
  kind: behavior
  regression_only: false
---

## Criterion
The avatar dialog contains a link labelled "Open your account portal" pointing at /account, opening in a new tab (target=_blank) with rel="noopener noreferrer", followed by a short hint. Apart from that link and hint, the dialog shows only facts about the session (who is signed in and which businesses that identity reaches). The link is present even when the account has no selectable business.

## Verification
Open the avatar dialog in the builder for an account with live businesses and for one whose grants have all lapsed. Check the anchor's text, href, target and rel in both cases, and that the dialog has no other new controls.
