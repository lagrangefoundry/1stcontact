---
uid: request-920e1a2c
id: REQ-196
type: request
title: 'Email sending: a sendEmail port, a Resend adapter, and a verified sending
  domain'
created_by: xgd
created_at: '2026-09-05T23:44:40.147333+00:00'
updated_at: '2026-09-06T19:04:35.054578+00:00'
completed_at: null
last_field_updated: story_points
status: free_coded
fields:
  priority: high
  story_points: 3
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-4f6b5d9b
  commits:
  - working_sha: 164e51cba73f93580ddad61fe30a7332d891092f
    reconcile_sha: null
    main_sha: null
  - working_sha: b3b210b025a0d63a16044f8a0027aff66e0ff17c
    reconcile_sha: null
    main_sha: null
  version: 0.2.98
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
the record of what we sent ([[REQ-198]]). An adapter that discarded it would make
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

- no message bodies — those are templates ([[REQ-197]])
- no record of what was sent — that is [[REQ-198]]
- no bounce handling — the webhook is [[REQ-198]]'s, and this ticket only makes it
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


---

## What landed

`apps/control-app/src/mail.ts` is the whole of the port and both adapters; everything
else is configuration, one operator runbook, and the tests.

### The port, exactly as specified

`sendEmail({ to, from, subject, body }) -> { providerId }`. Three things the shape leaves
open, decided here:

- **`body` is plain text**, sent as Resend's `text`. No HTML alternative: a second field
  is a second thing every template has to decide about, and nothing sends a message yet.
  When [[REQ-197]] writes one that wants markup it is one field here and one line in the
  adapter — a smaller change than carrying the guess now.
- **`from` is an argument, and configuration supplies it.** `MAIL_FROM` is a var in
  `wrangler.toml`, declared at the top level and repeated under `[env.production]`
  because a named environment inherits none. `mailFrom(env)` is the one place it is
  read, and it **throws rather than defaulting** — a fallback would be a second,
  undeclared sending address appearing exactly when the configured one went missing, and
  mail from an address nobody registered is binned, which is indistinguishable from mail
  that was never sent.
- **Accepted-with-no-id is a failure.** A send the provider took and returned no `id` for
  is a success nothing can record, and [[REQ-198]] has no other way to join a bounce back
  to what we sent — so it raises here rather than leaving a hole that first shows up the
  day a message bounces.

### Both adapters agree on what a message is

The `to`/`from`/`subject`/`body` checks are shared, so the local adapter refuses exactly
what the provider refuses. If it accepted more, the suite would prove nothing about
whether a message is sendable — every fixture would pass and the first real send would be
the first check.

The local adapter returns a **`local_`-prefixed `providerId`**, so [[REQ-198]]'s record
path has the same shape in a test as in production, and so a UAT can assert *which*
adapter answered. It also logs one line per message under `wrangler dev`: a development
builder that silently swallowed every message would reproduce locally the exact failure
this ticket exists to remove.

### The credential is the only switch

`mailerFor(env)` returns the Resend adapter when `RESEND_API_KEY` is set and the local one
when it is not. No mode var, no `NODE_ENV`, no "is this a test" predicate — each of those
is a thing that can be set wrongly, and the cost of setting one wrongly is a fixture
mailing somebody on the beta list. A laptop and a test runner hold no key; a deployment
does. That is what closes the falsifier, and a UAT asserts the suite's own runtime carries
no `RESEND_API_KEY`.

`RouterEnv` **extends** `MailEnv` rather than restating the two keys, and `RESEND_API_KEY`
joins `ANTHROPIC_API_KEY` in the router's redaction set — it can send as our own domain
and is the more damaging of the two to leak into a message somebody is shown.

### The secret, and a hook that warns rather than aborts

`bin/deploy.d/secrets/20-resend-api-key` pushes the key into `wrangler secret` on the same
three-way decision `10-anthropic-api-key` uses (supplied → push; stored → leave alone;
neither → say so). It **warns and exits 0** where the model key aborts, and the difference
is deliberate: a control app that cannot take a turn does nothing at all, while one with
no mail credential runs the local adapter — survivable exactly as long as nothing sends.
Aborting every deploy today would stop the pipeline over a capability with no caller and
a DNS dependency that has waiting in it. When [[REQ-197]] lands a caller it becomes a
failure; the branch is already the right shape and the message is already written.

### The sending domain

`apps/control-app/MAIL.md` is the operator runbook: why a provider at all (no SMTP in a
Worker; `send_email` delivers only to pre-verified addresses), the two adapters, and the
SPF/DKIM/DMARC records on `1stcontact.io` that decide whether what we send arrives. It is
written down beside the Worker rather than discovered on the day the beta was meant to
start.

### No caller, and `invitePerson` says so

Nothing sends a message. `invitePerson`'s docstring said *"there is no sender in this
repository"*; it now says there is one, that the invite does not call it, and that the
message is [[REQ-197]]'s and the record [[REQ-198]]'s.

### Tests

- `tests/test_UAT_FC_REQ-196_mail.workers.test.ts` — in workerd, because the adapter is
  built out of that runtime's `fetch`, `Response` and `crypto`. Every send goes through a
  `fetch` double the file hands in.
- `tests/test_UAT_FC_REQ-196_mail_configuration.test.ts` — `MAIL_FROM` declared on both
  sides with the exact address; `RESEND_API_KEY` assigned nowhere committed; the hook's
  decision table.
- `tests/support/secret-hook.ts` — the stub-`npx` harness [[REQ-149]] wrote for one hook,
  extracted so both use it. The contract belongs to the directory rather than to either
  hook, so a second copy would be two descriptions of one thing free to disagree.
  [[REQ-149]]'s UAT moves onto it unchanged in name and assertion.