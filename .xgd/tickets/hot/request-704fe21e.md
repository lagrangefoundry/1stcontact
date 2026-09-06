---
uid: request-704fe21e
id: REQ-197
type: request
title: 'The template ticket type: message bodies are content, with a placeholder contract
  that refuses'
created_by: xgd
created_at: '2026-09-05T23:44:41.124618+00:00'
updated_at: '2026-09-06T19:08:25.730046+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  priority: high
  story_points: 2
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-ee83c1ee
  commits:
  - working_sha: 242a8bf969984f641d5c900b74d3d29ef0d69b90
    reconcile_sha: null
    main_sha: null
  - working_sha: bb73eb6d06aa063ee2ace24377823273ca17d98b
    reconcile_sha: null
    main_sha: null
  version: 0.2.103
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


## Decisions taken while implementing

Recorded here because each one is a behaviour the tests pin, and behaviour that
is only in the code is behaviour the matrix cannot see.

**The body is HTML, and it is one part.** The multipart decision stays deferred
as stated above — what is decided is the format of the one body there is. It has
to be markup, because the invite is required to carry its call to action *as a
button* and a button does not exist in plain text. The pasteable-URL fallback is
what carries the recipients whose client mangles the button, which is the same
reason it was required in the first place.

**The type refuses at the write, not at the send.** `template_key` is a closed
vocabulary (`invite` | `signin` | `lapsed`), and `subject` and a non-empty body
are both required, so a template missing any of them is never written. An open
key would let a template be authored as `sign-in` while the sender asks for
`signin`, and the two would never meet — a lookup that finds nothing at the
moment somebody is waiting for mail. `placeholders` is optional: a message that
says the same thing to everybody declares none and renders as written.

**A business that has never had templates is given the three defaults, once.**
Seed-if-absent, on the same principle — and in the same shape — as the tenant
registration in `ticketStoreFor`: a business asked for a template it has never
been given would otherwise fail on a fresh deployment for want of content nobody
knew they had to write. The seed is written *as a ticket*, so the next act on it
is ordinary authoring; it is a starting point, not a fallback the sender reaches
for behind the operator's back. A second pass creates nothing.

**The seed copy names no business.** The same seed is written into whichever
business asks, so naming 1st Contact in it would put our name in a plumber's mail
to their own customers — [[DOC-40]] §2.1 rule 1's failure mode reached from the
copy rather than from the code. Naming the business through a token is worse: it
would make every send depend on a value the sender has no reason to hold, so the
refusal would fire on the ordinary path. Putting the business's own name in is an
edit to the ticket, which is exactly the authoring this type exists for. Each
seed declares one token, `{{cta_url}}` — the link is the only thing that cannot
be written in advance and the only thing whose absence is fatal.

**Newest wins, and the old ticket survives.** Several tickets may carry one key;
the most recently created is the one that sends. Editing in place stays possible
and is the ordinary case for a typo — what the ordering buys is that rewriting
the copy wholesale need not destroy the ticket [[REQ-198]]'s records point at.
(An operator who archives a template will be given the default back the next time
one is asked for. That is the useful failure of the two: a message type with no
template cannot be sent at all.)

**The subject is substituted too, and the declaration is checked against the
body.** A token used in the subject line is filled in; what `placeholders`
promises is about the body, which is where the call to action lives and where an
unfilled token does the damage.

**A token in the copy that was never declared refuses as well.** The falsifier
above is about the rendered *message*, not about the declaration, so a token
somebody added to the copy and forgot to declare is caught by the same gate.
Nothing goes out with a hole in it, however the hole got there.

**`TicketStore.query` gains `sort`.** A technical consequence of "newest wins":
the component's read slice has always taken an order (`field`, or `-field`
descending); this repository simply had no caller that needed one until the
lookup did.