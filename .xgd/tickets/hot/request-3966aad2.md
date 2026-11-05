---
uid: request-3966aad2
id: REQ-475
type: request
title: 'Sign-in: one login — the builder behind 1stcontact''s own sign-in, Cloudflare
  Access only on operator paths'
created_by: EPIC-19
created_at: '2026-10-27T20:30:06.515453+00:00'
updated_at: '2026-10-27T21:33:34.604644+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  parent_uid: epic-96d8aca6
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-05e1e267
  commits:
  - working_sha: 7edc635fc9bc7323f9abf2ada155eaf74a2c1550
    reconcile_sha: null
    main_sha: null
  - working_sha: 66e105d034af1f6d63ecd773ea5933275962708c
    reconcile_sha: null
    main_sha: null
  version: 0.2.683
  story_points: 8
---

## Why

Beta testers (Faelan, Josh) sign in twice on production. Cloudflare Access stops them first: a PIN email at least once a day. Then the app may ask for its own magic-link sign-in, whose page also sits behind Access. REQ-147 put Access in front of the whole builder as a zero-code gate, before 1stcontact had its own sign-in. That sign-in now exists (REQ-202, "Consume auth-passwordless"), so Access in front of the builder is a second lock with a worse experience, and every new tester has to be added to the Access allow-list by hand. This was raised in EPIC-19's session on 2026-10-26 as "Option A".

## What

**1. One login for clients and testers: 1stcontact's own magic-link sign-in.**
- `app.1stcontact.io`'s builder paths, the sign-in pages and the sign-in routes are public at the edge.
- No Cloudflare Access challenge or PIN reaches a client.

**2. Access stays where it is the operator's own lock.**
- It stays on `/api/admin/*` and any other operator-only path. List them in this ticket when you make the change.
- The operator's way in (CHAT-39) is unchanged.

**3. The app's sign-in alone gates everything that was behind Access. Before the edge opens, verify and pin:**
- every builder page and `/b/<business>/api/*` route refuses a request with no session cookie: no data, no business list, no AI session;
- the Access-identity fallback in `access.ts` can't be reached from a public path, so a forged or absent `cf-access-jwt-assertion` header admits nothing;
- the terms gate and per-business scoping apply to every admitted request;
- sign-in requests are rate-limited, and Turnstile is on the sign-in form if it isn't already (DOC-5 rules 20–23);
- an expired session lands on the sign-in page, not on an empty account (BUG-52's case).

**4. The Access application change is made in Cloudflare by the operator, not by this ticket's code.** The deliverables are:
- the exact path rules to set;
- a smoke check (`bin/` script or test) that, against a deployed environment, confirms a builder page shows the app's sign-in with no Access challenge, and that `/api/admin/*` still demands Access;
- the matching change to `bin/access-sim` for local dev, so dev behaves like production.

## What landed

**The gate (`apps/control-app/src/index.ts`).** A live session is the only identity the builder accepts. On every path outside `OPERATOR_PATHS`, a request with no session gets **303 → `/sign-in`** for a browser navigation (`Sec-Fetch-Mode: navigate`) and **401 `Sign in to continue.`** for everything else. The builder client reads that 401 as "your session ended" (BUG-52), and its "Sign in again" button reloads, which is a navigation, so it lands on `/sign-in`. A `cf-access-jwt-assertion` header or `CF_Authorization` cookie on those paths is never read, so the Access verifier never runs there. `admit`, the terms gate and per-business scoping run unchanged on every admitted request.

**The operator paths: one list, `apps/control-app/src/operator-paths.js` (`OPERATOR_PATHS`, `isOperatorPath`).** It is written in Cloudflare's path syntax. The Worker, `bin/access-sim` and the smoke check all read it, and ACCESS.md lists it. The Access fallback (session first, then Access) is consulted only on these paths:

| Path | Why |
|---|---|
| `/api/admin/*`, `/b/*/api/admin/*` | the platform console's API (the router strips `/b/<id>`, so both forms reach it) |
| `/sign-in/access` | the operator's way in (below) |
| `/api/export`, `/api/import`, `/api/chats/export`, `/api/chats/import` and their `/b/*/…` forms | the copy automation (`bin/copy-to-cloud` / `copy-from-cloud`). It uses an Access service token, and the edge only exchanges that token on a covered path. |

**The operator's way in (CHAT-39): `GET /sign-in/access`** (`sign-in.ts`, `accessSignIn`). Access guards it at the edge. The Worker verifies the Access identity and runs `admit`, so `PLATFORM_ADMINS` break glass still seeds an empty deployment. It then mints an ordinary session using the component's own `issue` (with the mail port keeping the link instead of sending it) followed by `redeemSignIn`, and answers 303 → `/`. A service token, an address with no account, or a refused person gets 403. The operator uses this path when the console is needed, because the console's `/api/admin/*` calls need the Access cookie that visit leaves in the browser. It is also the way in when mail is down.

**Cloudflare: the change the operator makes.** Narrow the Access application's destinations on `app.1stcontact.io` from "all paths" to exactly the table above (ACCESS.md, "The Access application"). Any bypass policies for `/sign-in`, `/sign-out` and the email webhook are then redundant and can be deleted.

**Smoke check (`bin/smoke`, `tools/generate/bin/smoke.mjs`).** Two checks replace `control_app_challenges_unauthenticated`:
- `control_app_builder_shows_sign_in`: `GET /` as a navigation is a redirect to `/sign-in`, never to `cloudflareaccess.com`, and `/sign-in` serves the form.
- `control_app_admin_demands_access`: `GET /api/admin/sites` is an Access challenge, meaning a redirect to `*.cloudflareaccess.com`. The Worker's own 401 fails this check, because it means the edge lost the path.

Run it after the Access change.

**Local dev (`bin/access-sim`).** It imports `isOperatorPath` and guards only those paths. Everything else is forwarded untouched, with no challenge and no pair exchange, so the Worker's own sign-in answers it, as in production. `/login?email=` still sets the Access cookie and then redirects to the front's `/sign-in/access`. So picking a seeded person still signs you in as them, now with an app session.

**Copy automation (`tools/generate/src/cli/copy.ts`).** `/api/businesses` is a public path now, so a service token is refused there. `resolveBusiness` therefore asks the platform directory (`/api/admin/sites`, an operator path) before reporting that refusal.

**Docs.** ACCESS.md gains a "One login" section, the destination table, and an updated terms-acceptance recipe that exchanges first. The `dev-env.ts` half-pair warning now says that operator paths, not every request, will 503.

## Decisions made during implementation

- **The fallback is path-scoped in the Worker, not just at the edge.** The Worker reads the same list as the edge, so it accepts Access exactly where the edge demands it. Even a genuine Access token is ignored on a public path, which is stronger than "a forged one fails the signature".
- **The operator's way in is an exchange, not a second admission producer on the builder.** Inside the builder there is one producer, the session. Access becomes a way to obtain one.
- **The copy routes are operator paths.** Without this, the service-token automation breaks the moment the edge opens.
- **Rate limit.** Sign-in issue was already capped per subject (`SIGNIN_RATE_LIMIT`, pinned by `test_UAT_FC_REQ-202_sign_in_mail_is_capped_per_subject`), and an unknown address sends nothing. That is unchanged.
- **Turnstile is NOT added.** `/sign-in` was already public at the edge through a bypass policy (REQ-202), so opening the builder does not change the sign-in form's exposure. Adding Turnstile also needs the widget on the apex `account-chrome` sign-in, which posts JSON cross-origin, plus a framework egress allowance. REQ-202 explicitly decided against it. This is left as an open decision for the operator rather than bundled here.

## Test plan

- `test_UAT_FC_REQ-475_builder_refuses_without_a_session` (workers): with no session cookie and no Access header, `/` → 303 `/sign-in`. `/api/businesses`, `/api/sites`, `/api/status`, `POST /api/ai/prompt`, `/b/<biz>/api/sites` and the shell asset all → 401 `Sign in to continue.`, with no data and no JWKS fetch.
- `test_UAT_FC_REQ-475_an_expired_session_lands_on_the_sign_in_page` (workers, BUG-52's case): after a session is ended, a navigation → 303 `/sign-in` and the API → 401.
- `test_UAT_FC_REQ-475_forged_access_header_admits_nothing` (workers): forged, garbage and genuine Access tokens, as header or cookie, are all refused on public paths, and the verifier never runs. The genuine token is still admitted on `/api/admin/sites`. A bare request to `/api/admin/sites` still gets Access's 401.
- `test_UAT_FC_REQ-475_signed_in_once_reaches_the_builder` (workers): a magic link alone reaches `/` and `/api/businesses`, which lists the person's own business and not another's. `/b/<theirs>/api/sites` → 403.
- `test_UAT_FC_REQ-475_the_terms_gate_applies_to_a_session` (workers): a session for a person who has not accepted the terms → 403 `TERMS_REQUIRED_MESSAGE`.
- `test_UAT_FC_REQ-475_the_operator_signs_in_through_access` (workers): `/sign-in/access` with a valid Access identity → 303 `/` plus a session that reaches the builder. No token → 401. An unknown address or a service token → 403 with no cookie.
- `test_UAT_FC_REQ-475_admin_still_needs_access` (node, real `bin/access-sim`): `/api/admin/sites` with no credential → 302 `/login` and is not forwarded. Builder paths are forwarded untouched with no assertion. A service-token pair is exchanged only on an operator path.
- `test_UAT_FC_REQ-475_picking_a_person_ends_on_the_app_sign_in_exchange` (node): `/login` sets `CF_Authorization` and redirects to `<browse>/sign-in/access`.
- `test_UAT_FC_REQ-475_the_path_rules_are_one_list` (node): `/sign-in/access` and the admin and copy paths are operator paths, and builder paths are not. Every rule appears in ACCESS.md. The simulator's exchange path equals the Worker's.
- Existing suites that used an Access JWT to *be* somebody on builder routes now sign in with a real session through `tests/support/signed-in.ts` (about 24 workers suites). Suites about the Access producer itself (REQ-147 gate, BUG-59 service tokens, BUG-146, REQ-167 denials, REQ-202's coexistence cases) now prove their property on an operator path. The smoke suites (REQ-147, BUG-57, REQ-144 and the AC1336–1338 reconciliation suite) model the new deployment.