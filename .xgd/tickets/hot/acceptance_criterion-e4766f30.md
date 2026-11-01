---
uid: acceptance_criterion-e4766f30
id: AC-2214
type: acceptance_criterion
title: The portal is rendered by the same site renderer as previews, and its own assets
  are served under /account
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T20:16:06.438342+00:00'
updated_at: '2026-11-01T20:26:46.172106+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-83ff6262
  kind: behavior
  regression_only: false
---

## Criterion
The HTML at /account/ is byte-identical to what the site preview renderer produces for the same `portal` site definition's draft home page. The page's document-relative sub-resources resolve and are served under the portal path: /account/theme.css and /account/capabilities.js return 200 with the same bytes as the preview renders for that site. No separate template produces the portal.

## Verification
Render the same `portal` definition through the draft preview route and through /account, and compare the HTML and the theme.css and capabilities.js bytes. Check every asset reference in the /account page resolves to a 200 under /account/.