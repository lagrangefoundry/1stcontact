---
uid: acceptance_criterion-c0a874e0
id: AC-2222
type: acceptance_criterion
title: The account line names the caller from their own account facts, falling back
  to the verified email
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T20:16:17.615975+00:00'
updated_at: '2026-11-01T20:26:44.092667+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-83ff6262
  kind: behavior
  regression_only: false
---

## Criterion
After the page loads, its account line is filled from the caller's own account data (the same answer the avatar uses). With both a display name and an email it reads "<name> — <email>". With no display name it reads the verified email alone. With neither, the line is hidden rather than shown blank. The line never describes any account other than the caller's.

## Verification
Serve the portal with the account endpoint returning each of: name+email, email only (empty/whitespace name), neither. Check the line's text and visibility in each case.