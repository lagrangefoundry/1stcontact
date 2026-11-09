---
uid: acceptance_criterion-989dd7f7
id: AC-2515
type: acceptance_criterion
title: A published form carries its instance id; the draft preview posts for real;
  the edit channel still cannot post
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T00:30:39.249919+00:00'
updated_at: '2026-11-09T20:26:14.055125+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-f2e5032c
  kind: behavior
  regression_only: false
---

## Criterion
Every published `contact-form` carries a hidden field holding its own instance id and the honeypot field, so a submission says which form it came from.

The draft preview renders the form with `method="post"` and the instance's configured `action`, emitted verbatim. A form whose `action` is the document-relative `api/lead` resolves, against the draft preview page at `/preview/<slug>/draft/`, to `/preview/<slug>/draft/api/lead`, and a submission sent there is captured for real (see the preview-endpoint AC). The same value resolves to `/site/<key>/api/lead` on the published site, so one `action` is correct in both places and the renderer never learns which channel it is in.

The edit-channel rendering of the same form has no `method="post"` and no `action`, so it still cannot submit. A lead POST to the edit channel's path (`/preview/<slug>/edit/api/lead`), or to any preview channel other than `draft`, is refused with `404` and writes nothing.

Out of this criterion: the renderer does not rewrite a root-relative `action` such as `/api/lead`. Against a preview page that resolves to the builder's own `/api/lead`, not to the preview lead route, so a form authored that way does not submit from the draft preview. This is recorded as a finding at the BUNDLE-43 reconciliation review, not claimed here.

## Verification
1. Render a form instance with id `beta-form` and assert the hidden instance-id input with value `beta-form` and the honeypot input. Render the same instance in edit mode and assert that `method="post"` and the configured action are absent.
2. POST a valid submission to `/preview/<slug>/edit/api/lead` (and to the `published` channel's lead path) on the control app and assert `404` and that the tenant gains no contact.
3. End to end: write a draft whose page mounts the form with `action: "api/lead"`, GET `/preview/<slug>/draft/` from the control app, resolve the rendered form's `action` against that page URL and assert it is `/preview/<slug>/draft/api/lead`; assert the rendered hidden input carries the instance id; POST a native form submission to the resolved URL and assert one lead lands in the tenant. GET `/preview/<slug>/edit/` and assert its form has no `action` and no `method="post"`.
