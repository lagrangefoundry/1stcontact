---
uid: request-7d9f8b2e
id: REQ-223
type: request
title: 'Public forms accept a submission: lead capture, asset delivery, and the controls
  that keep it safe'
created_by: BUG-78
created_at: '2026-09-10T22:59:48.855411+00:00'
updated_at: '2026-09-10T22:59:48.855411+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  auto_merge_back: true
  needs_review: false
---

# Public forms accept a submission

A visitor fills in a form on a published site, their address lands in that
site's contact database, and any asset the form promised is delivered — without
the endpoint becoming a way to mail strangers, flood a contact list, or burn the
sending domain's reputation.

**Every public form in the product is currently broken, and none of them is
broken by a bug.** The endpoint they post to has never existed.

## 1. What is true today

Verified 2026-09-10 against the code and against production.

**There is no form-submission endpoint anywhere.** `public-site` answers any
method other than GET/HEAD with `405` by construction (`apps/public-site/src/index.ts`),
and `control-app` gates every request through `guardAccess` (`apps/control-app/src/index.ts`).
`/api/lead` does not exist; neither does `/beta-apply`.

**Three forms are shipped and pointed at nothing:**

| Site | Form | Action configured | Reality |
| --- | --- | --- | --- |
| `1stcontact` home | "Apply to join the early beta" | `https://app.1stcontact.io/beta-apply` | route does not exist; host is behind Access |
| `xgd` home | "Join the waitlist" | `/api/lead` | route does not exist |
| `xgd` whitepapers | "Send me both papers" | `/api/lead` | route does not exist |

The visitor sees **"Could not reach the server. Please try again."** — the
`catch` in `contact-form/client.js`, reached because the cross-origin JSON POST's
CORS preflight is answered `403` by Cloudflare Access before any Worker runs
([[BUG-78]] carries the full trace).

**The two sites disagree about where a form posts.** XGD uses a relative,
same-origin `/api/lead`; the 1st Contact homepage uses an absolute cross-origin
URL. §3 settles this: the relative form is correct and the absolute one is the
anomaly.

**Prior record.** [[CHAT-56]] already logged this: *"Whitepaper delivery has no
artifact and no backend. No PDFs exist in either repo; the papers are ticket
bodies. `/api/lead` does not exist. Deferred by the operator as 'easy
mechanics'."* This ticket un-defers it. The same entry records the missing
mailing-list opt-in (§7).

**The spam controls are half-built and unowned.** `contact-form/component.ts`
already renders both the honeypot (`hp_company_url` — hidden, off the tab order,
`data-fc-invariant` so a designer cannot restyle it visible) and the Turnstile
mount (`data-turnstile-target`). `client.js` deliberately sends the honeypot in
the payload, its comment saying *"the honeypot field rides along so the server
can reject filled-honeypot submissions"*. The server half has never existed
because the server has never existed. Code comments say Turnstile is "wired in
REQ-7"; **[[REQ-7]] is an abandoned D1-schema ticket**, so those references are
stale and nothing owns this work.

**The strategy is already written down.** [[DOC-5]] *Public Form Strategy*:
public forms must not require login, because *"lead capture must be as
frictionless as possible"*, and spam is handled by Turnstile, rate limiting,
honeypot fields, AI spam detection and reputation checks. This ticket implements
the first three; the last two are named as out of scope in §9 so their absence
is a decision.

## 2. What a visitor gets

Submitting a public form:

- **always returns the same acknowledgement**, whatever happened behind it. A
  known address, a new one, a rate-limited one and a discarded one are
  indistinguishable to the caller. This is the property `account-chrome`'s client
  already honours by never reading the response body, and it is what stops the
  endpoint being used to test whether an address is already a contact;
- **adds them to that site's contact database** as a `lead`, once;
- **delivers the asset the form promised**, if it promised one, exactly once
  (§5);
- **works with JavaScript disabled.** `contact-form` renders a real
  `<form method="post" action=…>` and the client only upgrades it. A no-JS
  submission must land the same row and receive an ordinary HTML confirmation
  page rather than JSON.

## 3. Where the endpoint lives

**`POST /api/lead`, served by `public-site`, on the same origin as the page.**

The site the submission belongs to is taken from the **URL**, through the
grammar `parseRoute` already implements — the apex site for a bare `/api/lead`,
and the keyed site for one under `/site/<siteKey>/`. It is never taken from the
request body.

Four reasons, and the fourth is the one that matters most:

1. **No CORS.** Same-origin, so no preflight, so nothing for Access to answer
   `403` to.
2. **The site key is not caller-controlled.** It arrives as part of the path
   the server resolves, so a spammer cannot retarget another tenant's contact
   list by editing the form's action.
3. **Relative URLs are environment-portable.** `/api/lead` is correct in local
   dev, in preview and in production. The absolute `https://app.1stcontact.io/…`
   on the 1st Contact homepage is broken locally for exactly that reason.
4. **No Access bypass policy is required.** The write is handed to `control-app`
   over a **service binding**, and a service-binding call never traverses the
   edge. This matters because the bypass policies are currently missing: I
   verified that `GET /sign-in` and `GET /api/email/webhook` both answer `302`
   to the Access login origin in production today, so both REQ-198's webhook and
   REQ-202's sign-in routes are unreachable there. Lead capture must not inherit
   that dependency.

### 3.1 `public-site` stops being read-only, narrowly and deliberately

`apps/public-site/src/index.ts` states that it serves pages and receives
nothing, and answers every non-GET with `405`. This ticket amends that for
**exactly one path and one method**. Everything else must still answer `405`,
and a UAT must prove it — the amendment is a doorway, not a change of character,
and the file's header comment must be updated to say so rather than left to
contradict the code.

### 3.2 The internal surface is an RPC entrypoint, not a path

`control-app` owns identity writes and must keep owning them: `addContact`
(`apps/control-app/src/people.ts`) is the one definition of how a person enters a
tenant, and a second implementation in `public-site` would be two answers to that
question, free to drift.

The seam between the two Workers **must not be an HTTP path.** A path is
something a request can name, so an internal route reachable at
`app.1stcontact.io/internal/…` is one Access misconfiguration away from being
public — the specific failure `access.ts` argues against at length. Use a named
`WorkerEntrypoint` RPC method instead: it is reachable over the binding and
there is no URL that reaches it at all.

## 4. What lands in the database

A submission calls `addContact` — it is not reimplemented. That gives, for free,
the properties this ticket needs:

- **idempotent on `(tenant_id, email)`**, so a resubmitted address never becomes
  a second person. [[DOC-42]] §9 names the duplicate row as the failure the one
  contacts table exists to prevent;
- `pipeline_stage = 'lead'`, which is what a captured visitor is;
- the person, their account and their address written as one batch.

**The submission itself is recorded as a contact event.** `contact_events` is
append-only (there is an `ABORT` trigger on UPDATE) and its `kind` is a dotted
string with no `CHECK` constraint — `builder/contact-events.js` says so
explicitly, anticipating exactly this kind of growth. So a new kind is added
there with its label, and no migration is needed.

The event's `detail` carries what the row cannot: **which site and page the
submission came from, which form instance, what the submit button said, the
other fields the visitor filled in (a `message` textarea, say), and the consent
wording they were shown (§7).** This is the provenance record. It is
unreconstructable later, and for an IE tenant it is what evidences consent.

Extra form fields must not be dropped on the floor. A form is authorable with
arbitrary `text|email|tel|textarea` fields, and a visitor who typed a paragraph
into "What are you building?" has said something the business needs to see.

## 5. Asset delivery, and why "at most once" is the design

The whitepaper forms promise *"Send me both papers"* and *"On their way — check
your inbox."* So the endpoint must mail an address it has never seen. That is
inherent to an email-gated asset and cannot be designed away.

**It is not an open relay**, because a relay is one where the attacker controls
the recipient *and* the content. The content here is ours entirely: our
template, our links, our sending domain. What remains is narrower and must be
addressed directly — mail-bombing a victim, damaging deliverability, burning
send quota, and poisoning the contact list.

**Deliverability is the one that hurts most.** Unsolicited mail earns spam
complaints, complaints degrade the sending domain, and the first casualty is
sign-in links not arriving. Abuse of a marketing form breaks the login.

The rule:

> A public endpoint sends **at most one** message per address per asset, with
> content we author, and never to an address that has bounced or complained.

- **At most one, ever.** A second request for the same asset by the same address
  is acknowledged identically and sends nothing. This bounds a victim's exposure
  to a single message — the same exposure as any newsletter signup, and the
  floor for an email-gated asset. It is answerable from data we already keep:
  the contact event log says whether this address has been sent this asset.
- **This is deliberately not a rate limit, and must not be "fixed" into one.**
  A per-day cap still permits sustained harassment. The cost is real — someone
  who loses the email cannot re-request it — and the intended remedy is an
  operator re-send from the contacts surface, which is a different, authenticated
  act. Do not add a public re-send path.
- **Suppression on bounce or complaint.** REQ-198's delivery webhook already
  brings outcomes back and records them against the contact. An address that
  hard-bounced or complained is never mailed again by this endpoint.
- **Sending goes through what already exists** — the mail port, the templates,
  and the message recording — so a delivered asset appears in the contact's
  history beside their invites, and a bounce is as visible as any other. There is
  no second sender.

**The artifacts do not exist yet.** [[CHAT-56]]: no PDFs in either repo; the
papers are ticket bodies. This does not block the ticket: build delivery against
the asset as an abstraction, prove it with a test fixture, and leave the real
files to the content work. The 1st Contact beta form promises no artifact at
all — a place on a list is its whole deliverable — so it is fully satisfied by
capture alone and should be the first thing made to work.

## 6. The controls, and what each is actually for

None of these is sufficient alone; they fail in different directions.

**Honeypot.** Discard silently when `hp_company_url` is non-empty — same
acknowledgement, nothing written, nothing sent. Free, and catches only
unsophisticated bots. The field is already rendered and already arrives in the
payload; this is the missing server half.

**Turnstile.** Cloudflare's own product: free on every plan, and *not a new
dependency* — a script tag from `challenges.cloudflare.com` plus one server-side
`fetch` to the siteverify endpoint with a secret. Both halves are needed: the
widget rendered into the existing `data-turnstile-target` mount, and the token
verified server-side before anything is written. **A submission with a missing or
invalid token is refused** — verification that only runs when a token happens to
be present is not verification.

Configuration is a sitekey (public) and a secret, per deployment. **Absent
configuration must fail closed**, on `access.ts`'s reasoning: a deployment that
forgot the secret is refused, not opened.

**Rate limiting.** Cloudflare provides this natively and it should be used
rather than hand-rolled — the Workers rate-limiting binding is declared in
`wrangler.toml` and needs no external service. Key it on what the caller
*cannot* vary: the **site** and the **source IP**. Everything in the body is
caller-chosen and worthless as a key.

Note the tension, and record it rather than resolving it silently: a per-site cap
is itself a denial-of-service against that customer, since filling the bucket
refuses their real enquiries. So the cap is a backstop set generously, and
Turnstile is the sharp instrument. Zone-level WAF rate limiting rules are
complementary and are configuration, not code.

**Body limits, enforced before parsing.** A maximum body size, a maximum field
count and a maximum per-field length, refused early. A large body must be
rejected rather than read.

**Content that arrives in mail is attacker-controlled.** Nothing a visitor typed
may reach a mail header, and it must be escaped wherever it reaches a body.

**CORS is not a security control.** It constrains browsers and nothing else;
`curl` ignores it. Every control above must hold for a caller that is not a
browser at all, and the UATs should be written from that assumption.

## 7. The opt-in checkbox

`contact-form` supports `text|email|tel|textarea` only
(`packages/framework/src/modules/contact-form/meta.ts`). [[CHAT-56]] records
that the mailing-list opt-in is consequently absent from the XGD page and that a
checkbox, being behavioural, belongs as a module addition.

It is in this ticket because it is the **consent record**, not a separate
feature: it is how a captured address acquires a lawful basis, and the tenant is
IE. Add `checkbox` as a field type, render it with the same programmatic-label
treatment the other controls get, carry its value in the submission, and store
**both the answer and the wording the visitor was shown** in the contact event
detail (§4). Wording alone, stored later, cannot evidence what was on the page
that day.

Capture itself does not depend on the box being ticked — asking for a whitepaper
is its own request. What the box governs is being added to a mailing list, which
is a separate purpose and must be separately evidenced.

## 8. Acceptance criteria

1. `POST /api/lead` on a published site's own origin accepts a JSON submission
   and answers a single frozen acknowledgement.
2. The same acknowledgement is returned for: a new address, an address already a
   contact, a rate-limited submission, a filled honeypot, and an address that
   has already been sent the asset. A test asserts the responses are byte-identical.
3. A submission with no JavaScript — an ordinary form POST — lands the same row
   and receives an HTML confirmation rather than JSON.
4. The submission creates exactly one `users` row in the site's tenant, at
   `pipeline_stage = 'lead'`; a second submission of the same address creates
   none.
5. The tenant is derived from the request URL. A submission cannot name another
   tenant, and a body field claiming to is ignored. Asserted by attempting it.
6. A contact event records the submission with its provenance: site, page, form
   instance, the other fields submitted, and the consent wording if shown.
7. A filled honeypot writes nothing and sends nothing.
8. A missing or invalid Turnstile token is refused. With Turnstile unconfigured,
   the endpoint refuses rather than accepts.
9. Rate limiting is keyed on site and source IP, and exceeding it writes
   nothing, sends nothing, and is indistinguishable in the response.
10. An oversized body, an excessive field count, or an over-long field is
    refused before the body is parsed.
11. An asset-bearing form delivers its asset exactly once per address; a second
    request delivers nothing. Asserted by reading the message record, not the
    status code.
12. An address recorded as bounced or complained is never sent to.
13. Every method other than the one POST, on every other path of `public-site`,
    still answers `405`.
14. The internal seam to `control-app` is not reachable by any URL.
15. `contact-form` renders a `checkbox` field, and its answer and wording reach
    the stored provenance.

## 9. Out of scope

- **Notifying the business owner** that an enquiry arrived. Operator decision,
  2026-09-10: the contact database is the deliverable for now. Worth noting the
  cost — an enquiry in a list nobody logs into is a soft version of the failure
  [[DOC-47]] warns about — so this wants its own ticket before a customer relies
  on it.
- **AI spam detection and reputation checks**, the remaining two limbs of
  [[DOC-5]]'s strategy. Named here so their absence is a decision.
- **The whitepaper PDFs.** Content (§5).
- **Fixing sign-in in production.** `/sign-in` stays cross-origin on
  `control-app` and remains blocked by the missing Access bypass (§10). Routing
  it through `public-site` the way §3 routes lead capture would fix it, and is a
  reasonable follow-up, but it is not this ticket.
- **The `contact-form` configuration UI.** Authors set `action` by hand today.
  The builder offering the right endpoint for the current site is a real
  ergonomic gap and a separate piece of work.

## 10. Deployment steps (configuration, not code)

1. **Turnstile keys.** Create a Turnstile widget; set the sitekey and secret for
   each deployment. Absent them the endpoint fails closed, so this is required
   before the forms work anywhere.
2. **The Access bypass policies, which are owed regardless of this ticket.**
   `GET /sign-in` and `GET /api/email/webhook` both answered `302` to the Access
   login origin in production on 2026-09-10, meaning REQ-198's webhook and
   REQ-202's sign-in routes are unreachable there. Lead capture does not depend
   on this (§3), but sign-in does, and the homepage's sign-in dialog will stay
   broken until it is set.
3. **The service binding** between `public-site` and `control-app`, declared in
   both `wrangler.toml`s, including under `[env.production]` — a named
   environment inherits no bindings.

## 11. Once this lands

[[BUG-78]] closes by pointing the 1st Contact homepage's `beta-form.action` at
`/api/lead` and restoring `account-chrome.signIn` to `https://app.1stcontact.io/sign-in`,
the value [[REQ-200]] set before something replaced it with a route that has
never existed.
