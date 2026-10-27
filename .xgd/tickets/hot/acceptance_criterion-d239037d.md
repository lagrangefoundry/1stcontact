---
uid: acceptance_criterion-d239037d
id: AC-2030
type: acceptance_criterion
title: 'The looking surface is bound to one site: no operation or picture names a
  site'
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-27T19:42:14.870822+00:00'
updated_at: '2026-10-27T19:42:14.870822+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-58b2cec4
  kind: behavior
  regression_only: false
---

## Criterion
The looking surface is constructed for exactly one site. No operation declares a site-slug parameter and the picture shape has no site field; a `draft`, `edit` or `revision` picture is always of the site the session belongs to, and there is no way for the model to name another site's draft.

## Verification
Inspect every operation's declared parameters and the picture keys and assert none is a slug/site field. With two sites in the store, build the surface for site A and screenshot `draft`; assert the browser navigated only to site A's preview.
