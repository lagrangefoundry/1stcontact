---
uid: acceptance_criterion-989dd7f7
id: AC-2515
type: acceptance_criterion
title: A published form carries its instance id; the draft preview posts for real;
  the edit channel still cannot post
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T00:30:39.249919+00:00'
updated_at: '2026-11-09T19:56:13.817355+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-f2e5032c
  kind: behavior
  regression_only: false
---

## Criterion
Every published `contact-form` carries a hidden field holding its own instance id and the honeypot field, so a submission says which form it came from. The draft preview renders the same root-relative `action`, and a POST to it at `/preview/<slug>/draft/api/lead` is captured for real (see the preview-endpoint AC). The edit-channel rendering of the same form has no `method="post"` and no `action`, so it still cannot submit. A lead POST to the edit channel's path (`/preview/<slug>/edit/api/lead`), or to any preview channel other than `draft`, is refused with `404` and writes nothing.

## Verification
Render a form instance with id `beta-form` and assert the hidden instance-id input with value `beta-form` and the honeypot input. Render the same instance in edit mode and assert that `method="post"` and the configured action are absent. POST a valid submission to `/preview/<slug>/edit/api/lead` on the control app and assert `404` and that the tenant gains no contact.
