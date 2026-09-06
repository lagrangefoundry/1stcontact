---
uid: request-e7b562a1
id: REQ-202
type: request
title: 'Consume auth-passwordless: sessions, sign-in routes, and the invite link carries
  a token'
created_by: CHAT-39
created_at: '2026-09-06T23:18:52.431716+00:00'
updated_at: '2026-09-06T23:47:57.287358+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  priority: high
  story_points: 5
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-6a277a28
---

**Design ref:** [[CHAT-39]]. Consumes `@lagrangefoundry/auth-passwordless` ([[REQ-134]] in
lagrange-framework). Unblocks the invitee half of [[REQ-199]] and the Sign In control of
[[REQ-200]].

## The hole this fills

[[REQ-134]] was built and nothing consumes it. There is no `login_tokens` table and no
`sessions` table in `0001_baseline.sql`, no issue route, and no redeem route. Two
surfaces are already built against an endpoint that does not exist:

- **[[REQ-200]]**'s `account-chrome` renders a Sign In control whose `signIn` config URL
  has nothing behind it.
- **[[REQ-199]]**'s invite sets `ctaUrl` to `new URL(request.url).origin` — the bare
  front door — because there was no token to build a link from.

The second is not a design choice and should not be read as one. An invitee who clicks
that link meets Cloudflare Access, which challenges them with **its own OTP email**: two
messages per invite, the first of them Cloudflare-branded. Locally there is no Access to
challenge anybody, so the same link is a flat refusal — `no Access token was presented`.
Either way the invite does not deliver the person it was sent to.

## What the component gives us

`new PasswordlessAuth(db, config)`, with three REQUIRED ports and everything else
defaulted:

| Port | The host answers |
| --- | --- |
| `resolveSubject(email)` | `subjectId` or `null` |
| `sendLoginEmail({to, url, code})` | delivery |
| `buildUrl({token, purpose})` | where the emailed link points |

Methods used here: `issue`, `redeem`, `resolveFromCookie`, `endSession`,
`endSessionsForSubject`, `cookieFor`, `clearCookie`, `recentTokenCount`.

Defaults are already what [[CHAT-39]] settled and are not overridden: sign-in token 30
minutes, invite token 30 days, session 90 days, cookie `HttpOnly; Secure; SameSite=Lax`.
`ISSUE_ACK` is one frozen value returned for known and unknown addresses alike;
`REDEEM_STATUS` distinguishes `ok`, `expired`, `used`, `unknown`.

## `resolveSubject` answers WITHIN A TENANT, and the tenant is not ambient

This is the question the component cannot answer and the one most able to do harm.
`idx_users_tenant_email` is tenant-scoped deliberately: the same address may be two
different contacts in two businesses ([[REQ-191]] keeps that true across `user_emails`).
So "resolve this address to a subject" has no answer without a tenant, and a
`resolveSubject` that searched every tenant would be a cross-tenant identity leak
wearing a helper function.

**The tenant comes from the host the request arrived on.** The builder and the platform
apex resolve within the 1st Contact business; a customer's site resolves within that
site's business. One `PasswordlessAuth` instance per resolved tenant, constructed where
the tenant is already known.

**Falsifier:** a `resolveSubject` whose query carries no `tenant_id`.

## Sending goes through what already exists

`sendLoginEmail` is not a second sender. It renders the `signin` or `invite` template
([[REQ-197]]), sends through `mailerFor` ([[REQ-196]]), and records the message
([[REQ-198]]) — so a sign-in link appears in the contact's history beside their invite,
and a bounced sign-in address is as visible as a bounced invite.

The template's `{{cta_url}}` is the component's `url`. Nothing else changes: the
placeholder contract still refuses a send whose token did not substitute.

## The emailed link lands on a page with a Continue control

[[REQ-134]] redeems on `POST` and never on `GET`, because mail scanners fetch every URL
in a message and a token consumed by a scanner is consumed before the recipient clicks.
So this ticket serves that page.

**It is served by the control-app**, not the public site, because redemption sets the
session and the control-app is where identity already lives. The page states who the
link is for, carries one Continue button, and posts to the redeem route. A `GET` of it
changes nothing and may be repeated.

`REDEEM_STATUS` is worded rather than passed through: `expired` and `used` both tell the
reader to request a fresh link and offer the Sign In control, because a dead end at this
exact point loses a person we already persuaded. `unknown` says the same thing and no
more.

## `access.ts` gains a second producer of the same fact

`admit` consumes a verified identity and nothing else, so this is additive: the entry
point tries `resolveFromCookie` first and falls back to the Access JWT. Both produce the
same verified email; nothing downstream — scope, the terms gate, the portal — changes.

**Access stays**, per [[CHAT-39]]: it is the operator's own route in and a way back if
this path breaks. It is a second supported producer, not a legacy mode.

## The invite link becomes a token

`invites.ts` stops using the request origin. `ctaUrl` becomes
`buildUrl({token, purpose: 'invite'})` for a token issued to that contact, so the invite
carries the person it was sent to and lands them in a session rather than at a gate.

This is in the same ticket as the wiring because separating them ships a half that
changes nothing observable: the invite is broken until both exist.

## Rate limiting

The issue route is the one endpoint that cannot have access controls — it is what an
anonymous person calls in order to become authenticated. `recentTokenCount` caps
sign-in mail per subject. **Turnstile is not in this ticket** and is named here so its
absence is deliberate rather than forgotten: the route is not an open relay, because an
unknown address sends nothing, so the exposure is nuisance and provider cost rather than
domain reputation.

## Erasure

Deleting a contact calls `endSessionsForSubject`. A session outliving the person it
identifies is a live credential for a deleted account ([[DOC-37]]).

## What this does not do

- **no self-signup** — an unknown address sends nothing and mints nothing
- **no answer to where an accepted invitee lands.** They authenticate and then meet
  `no_membership`. That is the next ticket and it needs a decision, not code.
- no Turnstile, no code-alongside-link, no password, no OAuth
- no change to `admit`, scope, the terms gate or the portal

## Acceptance

- `@lagrangefoundry/auth-passwordless` is consumed the way other shared components are,
  and `1c preflight` reports it
- a migration applies the component's `SCHEMA_STATEMENTS`; `login_tokens` and `sessions`
  exist
- the component's conformance suite (`assertPasswordlessContract`) passes against this
  deployment's D1
- all three ports are supplied; `resolveSubject` queries within one tenant and that
  tenant comes from the request's host
- `sendLoginEmail` renders through [[REQ-197]], sends through [[REQ-196]] and records
  through [[REQ-198]]
- issuing for a known and an unknown address are indistinguishable to the caller
- the emailed URL serves a page with a Continue control; a `GET` leaves `used_at` null
- redeeming sets a session cookie scoped so the builder and the apex both read it
- `expired`, `used` and `unknown` each render a page offering a fresh link
- `access.ts` admits on a valid session **or** a valid Access JWT, and both reach the
  same `admit`
- an invite's `{{cta_url}}` is a redeemable invite URL and is never the bare origin
- clicking an invite link signs the contact in without any Cloudflare Access challenge
- sign-in mail per subject is capped using `recentTokenCount`
- deleting a contact ends their sessions