---
uid: acceptance_criterion-90483175
id: AC-2338
type: acceptance_criterion
title: Edits in the invite modal apply to that send only and never change the template;
  a body that has dropped the declared {{cta_url}} is refused before anything is sent
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-07T07:23:03.725566+00:00'
updated_at: '2026-11-07T08:05:53.384351+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

Subject and Body edited in the invite modal change what is sent for that send only:
every message in the send carries the edited copy, and the business's `invite`
template is left unchanged. The edit is held to the template's declared tokens: a
body that no longer carries the declared `{{cta_url}}` is refused with a 400 naming
the template and the missing token, and no message is sent to any selected
contact. A send that supplies only one of Subject and Body is sent with the
template's own copy, not a mix of the two.

## Verification

As an owner, read the `invite` template and record its subject and body. Send an
invite to one contact with an edited subject and an edited body that still carries
`{{cta_url}}`; assert the recorded message carries the edited subject and body
(with the link substituted), and re-read the template and assert its subject and
body are unchanged. Send again with a body from which `{{cta_url}}` has been
deleted; assert a 400 whose message names the token, that the mail port recorded
no message, and that the contact's pipeline stage did not move.