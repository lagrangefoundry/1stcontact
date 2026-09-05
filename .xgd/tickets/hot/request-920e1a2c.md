---
uid: request-920e1a2c
id: REQ-196
type: request
title: 'Email sending: a sendEmail port, a Resend adapter, and a verified sending
  domain'
created_by: xgd
created_at: '2026-09-05T23:44:40.147333+00:00'
updated_at: '2026-09-05T23:44:40.147333+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  story_points: 2
  auto_merge_back: true
  needs_review: false
---

**Design ref:** [[CHAT-39]]. First of the onboarding set; the others depend on it.

## There is no sender in this repository

`invitePerson` says so in its own docstring, and says why it says so: *"an
'invite' that silently sends nothing is a feature an operator will assume exists
and will not check."* This ticket makes it exist.

Two facts make this a decision rather than a line of code:

- **Workers have no SMTP.** There is no outbound port 25, so sending is always an
  HTTPS call to somebody else's service.
- **Cloudflare's own `send_email` binding cannot do it.** It delivers only to
  addresses pre-verified in the account, which is exactly the set an invitee is
  not in. It is the obvious-looking answer and it does not work for the one case
  we need.

## A port, with Resend behind it

```
sendEmail({ to, from, subject, body }) -> { providerId }
```

**Resend** is the chosen provider: it is the least work inside a Worker and its
free tier covers the beta. The port exists so that is a reversible decision —
deliverability reputation is the kind of thing that becomes a reason to move to
Postmark, and when it does the change should be one adapter and no call sites.

**`providerId` is returned and is not optional.** It is the provider's message id,
and it is the only thing that can later join a delivery or bounce webhook back to
the record of what we sent ([[REQ-136]]). An adapter that discarded it would make
bounce handling unimplementable without a second round trip.

## The local adapter records and does not send

Development and the test suite get an implementation that captures messages in
memory and delivers nothing. This is not a convenience: a suite that can reach a
real provider is a suite that can mail a real person from a fixture, and the first
time it happens it will be to somebody on the beta list.

**Falsifier:** a code path where running the tests can send mail.

## The sending domain is the long pole, and it is not code

`no-reply@1stcontact.io` is the From address. For mail from it to be accepted
rather than binned, three DNS records must exist on `1stcontact.io`:

- **SPF** — a TXT record naming who may send as the domain
- **DKIM** — a public key in DNS, whose private half signs each message, so a
  recipient can prove it was not forged
- **DMARC** — what a recipient should do when the first two fail, and where to
  report

In practice: add the domain in Resend, paste the records it gives back into
Cloudflare DNS, verify. It is an operator task rather than a coding one, and it is
called out here because it is the only part of this work with *waiting* in it and
therefore the part that decides when the beta can start.

Replies to `no-reply@` go nowhere by design. If a reply-to that reaches a human is
wanted, it is a separate address and a separate decision.

## What this does not do

- no message bodies — those are templates ([[REQ-135]])
- no record of what was sent — that is [[REQ-136]]
- no bounce handling — the webhook is [[REQ-136]]'s, and this ticket only makes it
  possible by returning `providerId`
- no rate limiting; the only caller so far is an authenticated operator pressing a
  button

## Acceptance

- a `sendEmail` port exists with exactly the shape above, and every caller uses it
  rather than an HTTP client
- the Resend adapter sends a message and returns the provider's message id
- the local adapter captures messages and performs no network call, and is what the
  test suite and `wrangler dev` use
- no test can reach a real provider
- the API key is a secret and is not present in `wrangler.toml` or any committed file
- the From address is `no-reply@1stcontact.io` and is configuration rather than a
  literal at a call site
- a send failure is reported to the caller rather than swallowed
