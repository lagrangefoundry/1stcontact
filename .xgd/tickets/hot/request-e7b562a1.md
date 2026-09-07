---
uid: request-e7b562a1
id: REQ-202
type: request
title: 'Consume auth-passwordless: sessions, sign-in routes, and the invite link carries
  a token'
created_by: CHAT-39
created_at: '2026-09-06T23:18:52.431716+00:00'
updated_at: '2026-09-07T00:31:45.135788+00:00'
completed_at: null
last_field_updated: body
status: free_coded
fields:
  priority: high
  story_points: 5
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-6a277a28
  commits:
  - working_sha: fc5c78dbe58c66501a8238e1350fd20c7767b2ad
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 170dce5d581a50a870945a59ff9f83c347684d62
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: c35972e365e22f5e7223d9b2fb19437b4868ece4
    reconcile_sha: null
    main_sha: null
  version: 0.2.125
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
- withdrawing a contact's login ends every session they hold, and they are sent no
  fresh link

  *(amended during implementation. The ticket said "deleting a contact"; there is no
  contact-deletion route in this deployment — [[DOC-37]] erasure is a request an
  operator answers, not a button — so the call lands on the act that does exist,
  `setPersonStatus` to anything but `active`. The defect is the same one: a session is
  ninety days of opaque bytes in a browser, so withdrawing a login without ending them
  leaves a live credential for an account the business has just closed. When a deletion
  route arrives it calls the same `endSessionsFor`.)*

### Also accepted — behaviour added as a consequence of the above

- a `POST /sign-out` ends the session **and** clears the cookie, and succeeds for a
  caller who was not signed in. `endSession` and `clearCookie` are named in *What the
  component gives us* and this is what uses them; half of the pair is either a live
  credential in whatever else holds it or a browser presenting a dead one forever
- a session cookie that resolves to nobody — expired, withdrawn, never minted — falls
  through to the Access gate rather than refusing. Refusing would make a stale cookie in
  some browser a lockout from a builder Access would have let its holder into
- `SESSION_COOKIE_NAME` / `SESSION_COOKIE_DOMAIN` are declared on **both** halves of
  `apps/control-app/wrangler.toml` and carry the same values as
  `apps/public-site/wrangler.toml`. A named environment inherits no vars; and the two
  Workers are a pair — this one writes the cookie [[REQ-200]]'s chrome reads — so they
  share a session precisely when the two files agree
- the issue endpoint answers a CORS preflight for any origin **inside the session cookie
  domain** and for no other. `account-chrome` on the public apex posts here and its
  client sends JSON, which is a preflighted request; without this the Sign In control
  fails in a browser console and works nowhere, which is the hole this ticket set out to
  fill. The cookie domain is the rule rather than a list somebody maintains: the origins
  that could usefully ask for a session are exactly the hosts that can read one
- redeeming refuses a cross-site `POST` and leaves the token unused. An attacker holding
  a live link could otherwise navigate somebody else's browser into *their* session, and
  the victim then works believing it is their own account
- `apps/control-app/ACCESS.md` records the **Bypass policy** the deployment needs for
  `/sign-in`, `/sign-in/*` and `/sign-out`. Access enforces on a hostname, so without it
  the edge challenges an invitee before this Worker sees the request — the exact failure
  this ticket exists to remove, with the code complete and nothing able to detect it at
  runtime

## What was built

| Where | What |
| --- | --- |
| `db/migrations/0001_baseline.sql` | `SCHEMA_STATEMENTS` transcribed — `login_tokens`, `sessions` and their four indexes. Transcribed rather than imported because wrangler's migration runner reads `.sql` off disk; a UAT compares the file to the component's own statements, exactly as [[REQ-162]] does for the ticket store |
| `tools/generate/src/cli/shared-store.ts` | `auth-passwordless` added to `SHARED_SERVER_COMPONENTS`, so `1c preflight` and `1c assets` refuse by name and command rather than leaving an unresolved specifier |
| `tools/generate/src/cli/assets.ts` | `src/generated/auth-passwordless.js` and a second shim for the component's `./conformance` subpath — the same single-resolution-point treatment the other three shared components get. Nothing on a request path imports the conformance file, so the harness reaches no deployed bundle |
| `apps/control-app/src/sessions.ts` | **new.** The whole of this deployment's answer to the three ports, plus `sessionIdentity`, `endSessionsFor` and the invite's token issuer. Nothing else constructs a `PasswordlessAuth` |
| `apps/control-app/src/sign-in.ts` | **new.** `GET`/`POST /sign-in`, `GET`/`POST /sign-in/<token>`, `POST /sign-out`, and the four pages they serve |
| `apps/control-app/src/index.ts` | the sign-in routes matched ahead of the Access gate, and the session tried ahead of the JWT |
| `apps/control-app/src/invites.ts` | `ctaUrl: string` → `inviteUrl: (email) => Promise<string \| null>` |
| `apps/control-app/src/people.ts` | `setPersonStatus` ends sessions when the status is not `active` |
| `apps/control-app/src/identity.ts` | `requirePlatformTenant` exported — the sign-in routes run ahead of `admit`, so they cannot take a tenant from an admission |
| `apps/control-app/wrangler.toml`, `ACCESS.md` | the cookie vars on both halves; the Bypass policy recorded |

## Decisions taken during implementation

**The Continue page reads no token.** The component offers exactly one token-consuming
method and no way to inspect a token without consuming it. A `GET` that looked the token
up to word the page would be a read a scanner could turn into a probe; a `GET` that
consumed it is the failure the `POST` exists to prevent. So the page states which service
the link is for and nothing it would need a lookup to know, and whether the link still
works is answered on the `POST`, by using it.

**All three refusals are one page at one status (200).** The ticket asks for the same
words; three different statuses would distinguish on the wire what the copy deliberately
does not. The Sign In form is on that page rather than linked from it.

**The invite mints through the component rather than beside it.** `invites.ts` keeps its
own sender — it renders the `invite` template including the operator's edit, records the
message and moves the pipeline — so what it needs from the component is a *token*, and
`issue` is the only way to mint one. `inviteUrlFor` therefore constructs an instance whose
mail port captures the URL instead of delivering it. The alternative was a second minting
path writing rows in a table the component owns, which is the fork this arrangement exists
to avoid.

**`resolveSubject` refuses an inactive person.** `admit` already refuses them, so a link
mailed to a suspended contact is a link that cannot be used — and mailing it anyway would
be mail this business chose to send to somebody it had just withdrawn. It is also what
makes the withdrawal above complete: no new link, and the ones they hold ended.

**A failure inside `issue` is swallowed into the acknowledgement.** A template that
refuses, an unconfigured `MAIL_FROM`, a store that will not open — all of these can only
happen for an address that resolved, so an error page for known addresses would be the
membership oracle `ISSUE_ACK` exists to prevent, restored one layer up. The reason goes to
the invocation log.

**The invite's token is minted in the *inviting* business, not the platform's.** An
operator of Alice's Plumbing invites Alice's contacts, and `resolveSubject` has no answer
without a tenant. The consequence is the one the ticket already parks: a level-2 contact
redeems successfully, gets a session, and the builder's `sessionIdentity` — which resolves
within the platform business — does not recognise them, so they meet the front door. That
is the same "where does an accepted invitee land" question, and it is still the next
ticket.

## Test plan

- `tests/test_UAT_FC_REQ-202_passwordless_wiring.test.ts` — the preflight registration, the
  migration against `SCHEMA_STATEMENTS`, the cookie vars on both halves and against
  `public-site`, and the recorded Bypass policy.
- `tests/test_UAT_FC_REQ-202_conformance.workers.test.ts` — the component's own contract
  suite against this deployment's D1, over the applied migration.
- `tests/test_UAT_FC_REQ-202_sign_in.workers.test.ts` — fourteen cases through
  `worker.fetch` in workerd against real D1: indistinguishable issue, the rendered and
  recorded message, the rate cap, the withdrawn contact, the `GET` that consumes nothing,
  the cookie the apex can read, the three identical refusals, CORS, login-CSRF, the
  session that reaches the builder with Access unstubbed, Access still admitting without
  one, sign-out, the stale cookie, and the invite's redeemable link driven through
  `/api/people/invite`.

Regression scope touched and updated: `REQ-186`, `REQ-188` and `REQ-199`'s invite suites
(the deps shape and the session cookie the invite now needs), and `REQ-190`'s key census
(two more `TEXT PRIMARY KEY` columns).

## Not done — needs an operator action

`@lagrangefoundry/auth-passwordless` is **not yet in the shared artifact store** at
`../node_modules/@lagrangefoundry/`. It was installed into this repository's own
`node_modules/` to develop and test against, which resolves and is pruned by the next
`pnpm install`. Before this lands anywhere else:

```
cd ../lagrange-framework && bin/install --lang js --component auth-passwordless
```

And the Access **Bypass** policy in `ACCESS.md` has to be created in the Cloudflare
dashboard, or the deployed invite still meets a one-time-PIN challenge.

-