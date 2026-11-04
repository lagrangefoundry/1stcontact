---
uid: acceptance_criterion-c0a874e0
id: AC-2222
type: acceptance_criterion
title: The account line names the caller from their own account facts, falling back
  to the verified email
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T20:16:17.615975+00:00'
updated_at: '2026-11-04T18:54:42.990076+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-83ff6262
  kind: behavior
  regression_only: false
---

## Criterion
After the page loads, its account line is filled from the `person` the caller's own businesses endpoint returns (the same answer the avatar uses): the signed-in human, not the account record, which is the payer (REQ-194). With both a display name and an email it reads "<name> — <email>". With no display name it reads the verified email alone. With neither, or with no `person` in the payload, the line is hidden rather than shown blank. The line never describes anyone other than the caller.

## Verification
Serve the portal with the businesses endpoint returning `person` as each of: name+email, email only (empty/whitespace name), neither, and null; and a payload carrying only a legacy `account` key. Check the line's text and visibility in each case.
