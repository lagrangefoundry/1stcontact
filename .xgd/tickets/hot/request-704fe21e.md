---
uid: request-704fe21e
id: REQ-197
type: request
title: 'The template ticket type: message bodies are content, with a placeholder contract
  that refuses'
created_by: xgd
created_at: '2026-09-05T23:44:41.124618+00:00'
updated_at: '2026-09-05T23:44:53.977151+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: high
  story_points: 2
  auto_merge_back: true
  needs_review: false
---

**Design ref:** [[CHAT-39]]. Depends on [[REQ-196]] for delivery; independent of it for authoring.

## A message body is content, and this repository already has a place for content

The invite mail, the sign-in mail and the lapse mail all need copy that changes
without a deploy. That is what the ticket store is for, so a template is a ticket.

**It lives in the tenant's own store, and that is the whole reason to do it this
way.** Templates written for the 1st Contact business are 1st Contact's; the same
mechanism gives a customer their own templates for their own contacts, with no
second code path and no platform-only branch. [[DOC-40]] §2.1 rule 1 names the
alternative — a capability built only for the platform — as the failure mode, and
a hardcoded string in the Worker would be exactly that.

## The type

```
type: template
fields:
  template_key   'invite' | 'signin' | 'lapsed'   required
  subject        string                            required
  placeholders   list                              the tokens this body must contain
body:            the message
```

**`template_key` and not the ticket id** is what the sender looks a template up by,
so replacing a template is writing a new ticket rather than editing a live one in
place — and the record of what was sent last month still points at the ticket that
said it ([[REQ-198]]).

## Placeholders are declared, and a missing one refuses the send

The body carries tokens — `{{cta_url}}`, `{{name}}` — and the template declares
which it requires. At render, a declared token with nothing to substitute, or a
required token absent from the body, **refuses**. It does not send with a blank.

The failure this prevents is concrete and silent: an invite whose `{{cta_url}}`
never got substituted is a mail with a dead button, which reaches the recipient
looking entirely normal and produces a beta user who cannot get in and does not
know why. Refusing is loud, happens to the operator, and happens before anybody
is emailed.

**Falsifier:** a rendered message containing an unsubstituted token, or a token
substituted with an empty string.

## The invite template must carry all three parts

Stated here because the copy is content and content is what gets forgotten:

1. a welcome message
2. a **call to action as a button**
3. **the same URL in full, as text, with wording telling the reader to paste it if
   the button does not work**

Part 3 is not decoration. A meaningful share of mail clients strip or mangle
styled anchors, and the button is the only route in; without the fallback those
recipients are simply lost, and they are lost silently.

## Authoring, for now, is the ticket

There is no template-editing UI in this ticket. Templates are created and edited
as tickets, which is enough for the beta and is why the type carries its structure
in fields rather than in prose. A proper editing surface is a later ticket and
should not be smuggled into this one.

## What this does not do

- no sending — [[REQ-196]]
- no record of what was sent — [[REQ-198]]
- no editing UI
- no per-recipient personalisation beyond token substitution
- no HTML/text multipart decision; the body is one thing until there is a reason

## Acceptance

- a `template` ticket type exists with the fields above and is registered in
  `productTypePack()`
- templates are read from the tenant's own ticket store, and a customer's business
  can hold its own with no code change
- rendering substitutes declared tokens
- rendering **refuses** when a declared token has no value, and when a required
  token is missing from the body; neither case sends
- the refusal names the template and the token
- three templates exist: `invite`, `signin`, `lapsed`
- the `invite` template contains a welcome message, a button CTA, and the full URL
  as pasteable text with wording explaining why
