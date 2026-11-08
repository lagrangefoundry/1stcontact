---
uid: acceptance_criterion-f5c9d0d8
id: AC-2371
type: acceptance_criterion
title: The sending address is the template's own when it names one and MAIL_FROM otherwise,
  resolved once per send so the delivered message and the outgoing record carry the
  same address; the invite form shows the address and refuses an edit, and the send
  route ignores any from on the request
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T04:11:58.521483+00:00'
updated_at: '2026-11-08T04:11:58.521483+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-7d255580
  kind: behavior
  regression_only: false
---

## Criterion
A message is sent from the address its template names when the template names one. When the template names none, or names one that is empty or only whitespace, the message is sent from the deployment's fallback address (`MAIL_FROM`). The address is not token-substituted and reaches the provider unchanged. It is resolved once per send, so the delivered message and the outgoing record carry the same address.

With the seeded templates, an invitation is sent from `1st Contact <invite@1stcontact.io>`, and a sign-in link is sent from the fallback address, never from the invite address.

The invite form displays the address the invite will be sent from and refuses an edit to it. The invite send route uses the address the server resolved and ignores any `from` supplied on the request.

## Verification
In a business seeded with the default templates:
- **Invite send.** Send an invitation. Assert the provider (or the local capture) received `from` = `1st Contact <invite@1stcontact.io>`, and that the outgoing record for that send names the same address.
- **Template with no address.** Write a newer `invite` template with no `from` (and one with a blank `from`), send, and assert the message and the record both carry `MAIL_FROM`.
- **Sign-in link.** Request a sign-in link and assert its `from` is `MAIL_FROM`, not the invite address.
- **Invite form.** Open the invite form and assert it displays the invite template's address as read-only.
- **Forged sender.** POST an invite carrying `from: attacker@example.com`, and assert the message is sent from the template's address.
