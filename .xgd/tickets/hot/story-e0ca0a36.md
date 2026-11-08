---
uid: story-e0ca0a36
id: STORY-171
type: story
title: 'Passwordless sign-in: a person signs in from an emailed link, and an invite
  link signs its recipient in'
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-07T08:22:22.281446+00:00'
updated_at: '2026-11-08T02:44:47.011099+00:00'
completed_at: null
last_field_updated: status
status: updated
fields:
  intent_uid: bundle-7988e925
  capability_uid: capability-3606e35b
  story_kind: upgrade
  story_points: 3
---

## Story
**As a** person a business knows by email (an operator, or a contact the business has invited), **I want** to sign in by asking for a link at my own address and pressing Continue on the page it opens, and to be signed in straight from an invitation, **so that** I get to the builder or my account without a password and without a second, third-party one-time-PIN challenge.

## Description
REQ-202 is where the control app starts using the shared passwordless component (REQ-134). It covers:

- **Requesting a link** at `/sign-in`. A person enters their address. The answer is the same whether the address belongs to someone, belongs to nobody, or has hit the rate cap. Only an active person whom the business already knows, and who is under the cap, gets mail. That mail goes through the existing template, mailer and message log, so it shows up in the contact's history.
- **Redeeming a link.** Opening the emailed link with GET shows a page with one Continue control and uses nothing up. Pressing Continue (a POST) uses the token, creates a session cookie that both the builder and the apex can read, and redirects. An expired link, a used link and an unknown link all get the same page, which offers a fresh link. A cross-site POST is refused and the token stays unused.
- **Signing out**, from a Sign out control the builder’s Account dialog always shows in its footer beside Close. The control is a plain form that POSTs to `/sign-out`, and the browser follows the server’s redirect. Signing out ends our session and clears our cookie whatever credential admitted the caller, and it succeeds even for a caller who was not signed in. Where you land depends on what the request carries. A request with a Cloudflare Access credential (the forwarded assertion header or a `CF_Authorization` cookie) is sent to the team domain’s Access logout, with a `returnTo` of this origin’s `/sign-in`, so the edge session ends too. Any other request lands on `/sign-in`.
- **The builder accepting a session** as a second way to prove identity, alongside Cloudflare Access. Both produce the same verified email and lead into the same admission, and Access still works on its own. A cookie that resolves to nobody falls through to Access and is not refused.
- **Invites carrying a token.** An invite's call-to-action is a redeemable invite link for that contact, valid for 30 days, and never the bare origin.
- **Withdrawing a login.** Setting a person to any status other than active ends every session they hold, and they can no longer get a fresh link.
- **Cross-origin requests to the issue endpoint.** It answers a CORS preflight from origins inside the session cookie domain and from no others, so the `account-chrome` Sign In control on the apex works.

**Out of scope** (REQ-202 "What this does not do"): self-signup, where an accepted invitee lands (REQ-203), Turnstile, a code sent alongside the link, passwords, OAuth, and any change to admission, scope, the terms gate or the portal.

## Technical Context
- Architecture policy items 20–21 and 25 (magic email links are the only way to authenticate; identity is anchored on the verified email; authentication is separate from authorization). Item 22: public forms stay login-free. Sign-in does not apply to visitors.
- **Tenant scoping.** A subject is resolved within one business only, and that business comes from the host the request arrived on. For now this Worker serves one host, which resolves to the platform business. A lookup with no tenant would leak identities across tenants (REQ-202 falsifier).
- Component defaults are kept as they are: sign-in token 30 min, invite token 30 days, session 90 days, cookie `HttpOnly; Secure; SameSite=Lax`.
- Rate cap: at most 5 sign-in tokens per subject per rolling hour. When the cap is hit the caller gets the normal acknowledgement and the event goes to the invocation log.
- The sign-in, sign-in/<token> and sign-out routes are matched ahead of the Access gate. Deployed, they also need the Access Bypass policy recorded in `apps/control-app/ACCESS.md`. Creating that policy, and installing `auth-passwordless` into the shared store, are steps for the operator to do, not behaviour ACs.
- The baseline schema includes the component's `login_tokens` and `sessions` tables. The wiring UAT (`test_UAT_FC_REQ-202_passwordless_wiring`) compares the migration against the component's `SCHEMA_STATEMENTS` and checks that the cookie vars match on both halves of the control-app config and in public-site. That UAT, and the component conformance suite run against this deployment's D1, are the deployment-contract evidence.
- Related work: CAP-103 (Access gate, which stays as the second producer), the Contacts invite story from plan item 4 (REQ-199, whose invite now carries the token), the account-chrome module from plan item 2 (REQ-200, whose Sign In control posts here), and Admission & Onboarding from plan item 5 (REQ-203, where the invitee lands).

- **Sign-out destination (REQ-204 revision, which supersedes its “Why it is conditional” section).** The destination is chosen from the credential the request presents, not from the producer that admitted it. A caller holding both a session of ours and an Access cookie is admitted on the session, but is still sent to the Access logout. Otherwise the Access cookie would re-admit them on the next navigation. `returnTo` is built only from the request’s own origin, never from caller input, so it cannot become an open redirect. It is a request to the edge, not a guarantee. The team domain (`ACCESS_TEAM_DOMAIN`) is used, so the same expression points at Cloudflare in production and at `bin/access-sim` locally. With no team domain configured, the redirect never leaves our origin.
- The Account dialog is told nothing about which credential the caller holds, and `/api/businesses` carries no `session` field. The destination is decided only on the server.

## Reconciliation Decisions
- **One page and one status (200) for all three refusals** (decided at reconciliation, 2026-11-07): the intent asks for the same wording for expired, used and unknown. It does not mention the HTTP status. The code uses one status for all three so the response does not reveal on the wire what the wording keeps hidden. Formalized in the refusal AC.
- **Failures inside issue are swallowed into the acknowledgement** (decided at reconciliation, 2026-11-07): the intent does not cover what happens when mail or a template fails for a known address. If the caller saw an error page in that case, they could tell the address is a member. The reason goes to the invocation log. Formalized in the indistinguishable-issue AC.
- **Inactive persons get no link** (decided at reconciliation, 2026-11-07): the intent covers only ending sessions on withdrawal. The code also refuses to resolve an inactive person, which makes the withdrawal complete. Formalized in the withdrawal AC.
- **Withdrawal is triggered by the status change, not by deletion** (decided at reconciliation, 2026-11-07): the intent was amended during implementation because this deployment has no route for deleting a contact. Formalized in the withdrawal AC.
- **Redeem answers a See Other redirect to the root** (decided at reconciliation, 2026-11-07): the intent does not say where a successful redemption goes. A redirect keeps a used POST target out of the browser history. Formalized in the redeem AC.
- **Token minted in the inviting business** (decided at reconciliation, 2026-11-07): an invitee from a non-platform business can redeem the link but is not recognised by the builder. REQ-202 explicitly leaves this to REQ-203. No AC asserts where they land.

- **Sign-out with sessions not configured still honours an Access credential** (decided at reconciliation, 2026-11-07): the intent says the cookie is cleared “always” and does not cover a deployment that issues no sessions. On such a deployment the code decides the destination first, so an Access caller is still sent to the edge logout. It sends no clearing cookie, because there is no cookie of ours to clear. The “ends our session and clears our cookie” ACs therefore apply to deployments that issue sessions.
- **Only POST signs out** (decided at reconciliation, 2026-11-07): the intent describes only `POST /sign-out`. A GET to that path is not handled by sign-out and falls through to the normal gated routing. A link or prefetch therefore cannot sign anyone out. No AC asserts the GET path.

## Dependencies
Plan items 2 (account-chrome module), 4 (Contacts invite) and 5 (Admission & Onboarding).

## Story Points
3