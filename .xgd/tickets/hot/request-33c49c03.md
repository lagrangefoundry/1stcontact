---
uid: request-33c49c03
id: REQ-205
type: request
title: 'Email deliverability: a derived plain-text part, a per-template sending address,
  and a named sender'
created_by: CHAT-42
created_at: '2026-09-07T22:21:01.960360+00:00'
updated_at: '2026-09-08T01:38:56.810857+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  priority: high
  story_points: 3
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-96f1d1b9
---

**Design ref:** [[CHAT-42]]. Follows [[REQ-196]] (the sender), [[REQ-197]] (the
templates) and [[REQ-199]] (the first real send). Operator dependency: [[TODO-5]].

## The mail authenticates and still lands in spam

A real invite, delivered 2026-09-07, to a Gmail-hosted address:

```
From:    no-reply@1stcontact.io
Subject: Your invitation
SPF:     PASS   DKIM: PASS (1stcontact.io)   DMARC: PASS
```

All three pass and it went to spam. **Authentication is not reputation.** SPF,
DKIM and DMARC prove the message was not forged; they say nothing about whether
it is wanted, and a filter that has no reputation history for a domain falls back
to what the message looks like. This one looks like phishing.

## What it looks like to a filter

The seed copy in `SEED_TEMPLATES` renders, for the invite, as:

> Hello,
> You have been invited to set up your account. Everything is ready — the link
> below takes you straight in, and there is no password to choose.
> **[Accept your invitation]**
> If that button does not work, copy the address below and paste it into your
> browser:
> https://app.1stcontact.io/…
> If you were not expecting this, you can ignore it and nothing will happen.

Anonymous sender with no display name, a generic subject, no addressee, **no
statement of who is inviting or to what**, a button plus a bare pasted URL, and a
disclaimer inviting the reader to ignore it. Structurally that is a credential-
phishing mail. A filter does not need reputation data to be suspicious of it.

The irony is that the seed is *deliberately* business-neutral — its own docstring
says naming 1st Contact there "would put our name in a plumber's mail to their own
customers" — and that neutrality is exactly what makes our own mail anonymous.
**That decision stands.** The fix for our copy is editing our tenant's template
ticket, which is the authoring the type exists for, and is not this ticket.

## This ticket is the part that is code

Three changes. None of them is a rewrite, and none of them touches the port's
shape.

### 1. Every message carries a plain-text alternative, derived from the HTML

`mail.ts` sends `html` only. `Message.body`'s docstring defends that, and its
reasoning was about *authoring*: "a second `text` alternative is a second thing
every template must decide about and a second body that can disagree with the
first."

That reasoning survives intact, because the text part is **derived, not
authored**. One body is still written; two parts are sent. No template gains a
field, no operator writes anything twice, and the two parts cannot disagree
because one is a function of the other.

HTML-only is among the most commonly weighted spam heuristics, and this is the
single largest technical lever available without changing provider.

The derivation:

- anchors render as their link text followed by the URL — `Accept your
  invitation <https://…>`
- block-level elements become line breaks; remaining tags are stripped
- HTML entities are decoded; runs of blank space collapse

**The invariant that matters, and the one to falsify against:** every URL that
appears in an `href` in the HTML part appears verbatim in the text part. A text
alternative that has quietly lost the only route in is worse than none — the
recipient whose client prefers text gets a message with no way to act on it, and
nothing on our side looks wrong.

Deriving empty text from a non-empty body is refused, in `check()`, alongside the
existing empty-body refusal. It means the derivation has failed on a body it did
not understand, and sending an empty text part is the failure it is meant to
prevent.

### 2. The sending address is per-template, and is no longer `no-reply@`

Two problems with one address:

**`no-reply@` is a negative signal**, and more practically it makes replies
impossible. A reply is one of the strongest positive engagement signals a
recipient can generate, and we are currently refusing every one of them. Somebody
*will* reply to an invitation.

**`MAIL_FROM` is deployment-wide.** It is read by the invite path
(`router.ts:1685`), the sign-in path (`sign-in.ts:163`) and the modal prefill
(`router.ts:1599`) alike, so there is exactly one address for all three templates.
Setting it to `invite@` would send sign-in links from `invite@`.

So the address becomes the template's, with `MAIL_FROM` as the fallback:

- the `template` type gains an **optional `from` field**; absent means
  `MAIL_FROM`, which is what every existing template ticket already means
- `MessageCopy` carries it, alongside the subject and body it already carries
- `invite` sends from **`invite@1stcontact.io`**
- `signin` and `lapsed` fall back to `MAIL_FROM` until somebody decides otherwise

This is the extension `Message.from` was written for: "the day a second address is
wanted (a reply-to that reaches a human, a per-business sender) the choice belongs
to the caller that knows which message this is."

**The modal's `from` stays display-only.** `inviteDraft` shows the address and
refuses to take an edit, and `router.ts` does not read a `from` off the POST. That
does not change — an operator-set sender fails DKIM and lands in spam, which is
the failure this whole ticket is about. What changes is only *which* address the
server resolves and displays.

### 3. The From carries a display name

`MAIL_FROM` becomes `1st Contact <no-reply@1stcontact.io>` and the invite's
template `from` becomes `1st Contact <invite@1stcontact.io>`. RFC 5322
display-name form, which Resend accepts as-is.

`mailFrom()` trims and checks non-empty and passes the string through, so this
form already flows end to end. What it needs is to not be *broken* by anything
downstream: the address is carried verbatim to the provider, and the record
[[REQ-198]] writes stores what was actually sent.

## Not in scope, deliberately

**`List-Unsubscribe`.** It is required by Gmail's bulk-sender rules and this is
1:1 transactional mail, where an unsubscribe header on a sign-in link is
incoherent — the recipient asked for the message thirty seconds ago. It becomes
right if 1st Contact ever sends marketing mail, which [[TODO-5]] §3 already says
should live on a separate subdomain with separate reputation.

**Moving to Postmark.** [[REQ-196]] built the port so that this is one adapter and
no call sites, and it stays the answer if the changes here do not move placement.
It is not a first move.

**Our tenant's invite copy.** Authoring, not code.

## Accompanying operator work — none of it code

Recorded here so it is not lost. These are what make the change above worth
anything:

1. **`invite@1stcontact.io` must receive.** Cloudflare Email Routing catch-all to
   a real mailbox, which [[TODO-5]] §6 left as an open decision and which sending
   from a repliable address now forces. A repliable address that bounces is worse
   than `no-reply@`.
2. **Edit our own tenant's `invite` template ticket** — name the inviter and the
   product in the subject, say what 1st Contact is, sign it, add a footer with the
   company name and a postal address. The link-to-prose ratio is currently the
   worst thing about the body.
3. **Register `1stcontact.io` in Google Postmaster Tools.** Verification and data
   collection both take time to start, so it is worth doing before there is a
   question to answer with it.
4. **Move DMARC from `p=none` to `p=quarantine`** once reports show clean
   alignment. [[TODO-5]] §2 published it at `p=none` deliberately; a committed
   policy is itself a mild positive signal, and alignment has now been observed
   passing on a real send.

## Acceptance

- A message sent through the Resend adapter carries both an `html` part and a
  `text` part.
- Every URL appearing in an `href` in the HTML part appears verbatim in the text
  part.
- A body from which no text can be derived is refused before any network call, by
  the same check both adapters share.
- The local capturing adapter and the Resend adapter agree on what a sendable
  message is, as they do today — the derivation happens for both.
- A template ticket carrying a `from` sends from that address; one with no `from`
  sends from `MAIL_FROM`.
- The invite sends from `invite@1stcontact.io`; sign-in does not.
- The invite modal displays the invite's own sending address, and still refuses to
  take an edit to it.
- A `From` in RFC 5322 display-name form reaches the provider verbatim.

**Falsifier:** a text part that reaches a recipient without the link the HTML part
carries.