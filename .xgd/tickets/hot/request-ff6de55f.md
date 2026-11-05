---
uid: request-ff6de55f
id: REQ-482
type: request
title: 'Sign-in: land back on the page sign-in started from, signed in'
created_by: EPIC-19
created_at: '2026-10-28T21:07:08.137553+00:00'
updated_at: '2026-10-29T18:58:02.135793+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  parent_uid: epic-96d8aca6
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-53a73c3f
  commits:
  - working_sha: 041dc2f8342a7bb3299fe5714e387c61813ff465
    reconcile_sha: null
    main_sha: null
  - working_sha: ae00f57818655e1f6bfdabadc7ddf2c58773c5c9
    reconcile_sha: null
    main_sha: null
  version: 0.2.701
  story_points: 5
---

## Why

The operator signed in from 1stcontact.io on 2026-10-28: "Sign in" in the header, then the email, then the Continue page. They landed in the builder (`app.1stcontact.io/`). They expected to come back to 1stcontact.io, signed in, with the account controls ("Your account", "My businesses") in the header.

The shared session works: the apex recognises the `.1stcontact.io` cookie and serves the signed-in chrome, as REQ-200 intends. What's missing is where the redeem lands. `sign-in.ts` always answers 303 → `/`, because REQ-202 never recorded where the sign-in began.

## What

1. **The sign-in remembers where it started.**
   - The account-chrome form on a published page, and the builder's own `/sign-in`, send a return address with the email.
   - It's carried through the emailed link (stored with the sign-in token, not as a bare query parameter that can be edited) and used by the redeem's redirect.
2. **Only our own addresses are honoured.**
   - The return address must be an origin this deployment serves: the apex (`APEX_HOST`), the builder host, or a customer domain bound to a site in this store.
   - Anything else, or a missing value, falls back to the builder's `/`, as today.
   - No open redirect: the check is against the deployment's known hosts, never a pattern match on the input.
3. **Where each start lands:**
   - started on 1stcontact.io, or any published site with account-chrome → that same page, signed in;
   - started at the builder (`app.1stcontact.io/sign-in` directly, or a redirect from a builder page) → the builder page that sent them to sign in, else `/`;
   - an invitation link → unchanged (the builder, or wherever the invitation names).
   - the account-chrome form posted with no script (native form POST) → the referring site's home page, since a cross-origin browser referrer carries only the origin.
4. **The builder's draft preview of a page with account-chrome** shows the signed-in state for the person viewing it, as the published site does, so a preview doesn't look signed out when the operator is signed in. Apply the same transform the public-site Worker uses (`account-chrome/session.ts`), or record here why the preview stays signed-out.

## How it is built

- **Stored beside the token.** `login_token_addresses` (the host's per-token row, [[REQ-368]]) gains `return_to` (migration `0036_sign_in_return.sql`). The issue route writes it with the address; `redeemSignIn` reads it before deleting the row and the redeem answers 303 to it, else `/`. The emailed link is unchanged and carries no return value.
- **Checked once, before it is stored** (`apps/control-app/src/sign-in-return.ts`). Accepted when the host is exactly: the host the request arrived at (on its own scheme, so local `http://127.0.0.1` dev works); `APEX_HOST` over https; or an active `site_domains` host over https. A port other than the default, credentials in the URL, or more than 2048 characters is refused. On the builder's own host, `/sign-in…` and `/sign-out…` are refused, since landing there would loop. No suffix or pattern matching.
- **Where the value comes from.**
  - The account-chrome client (`client.js`) sends `return: location.href` with the email.
  - A builder navigation with no session (or the start-of-visit sign-in prompt, [[REQ-231]]) is redirected to `/sign-in?return=<path+query>`. A plain `/` keeps the bare `/sign-in`.
  - `GET /sign-in` puts that value in a hidden `return` field, and the form POST sends it back.
  - With no field, the request's `Referer` is used. That covers the no-script chrome post.
- **`APEX_HOST` is now a control-app var.** It is `1stcontact.io` in production and empty at the top level and in dev, matching `apps/public-site/wrangler.toml`.
- **Draft preview.** The builder's `/preview/<site>/<channel>/` route runs the page through `applyAccountChromeSession` for the admitted viewer: signed in; the businesses marker if they hold any membership; the avatar letter from their current name, else their primary address (the same sources `public-site` reads). Pages without the chrome pass through unchanged.

## Not in this ticket

- On 2026-10-28 the operator, signed in on 1stcontact.io, saw "the old broken links". The likely cause is that the published apex snapshot predates [[BUG-299]], which derived the portal/businesses targets. A published snapshot keeps the hrefs it was rendered with, so republishing the apex site should fix it. No code change is needed.

## Test plan

- `test_UAT_FC_REQ-482_signin_from_apex_returns_to_apex`: the account-chrome client's own `submitAddress`, on an apex page, posts to the Worker. The emailed link's redeem answers 303 to that page, with the session cookie set for the cookie domain.
- `test_UAT_FC_REQ-482_no_script_chrome_post_returns_to_the_referring_site`: a native form post with only a `Referer` of the apex origin redeems to the apex home page.
- `test_UAT_FC_REQ-482_return_outside_the_deployment_falls_back`: a return address on a foreign host, a lookalike host (`apex.evil…`, `evilapex`), a non-https scheme, a non-default port, `javascript:`, protocol-relative, or the builder's own `/sign-in` redeems to the builder's `/`; a host bound to a site in this store (`claimHostname`) is honoured.
- `test_UAT_FC_REQ-482_return_survives_only_through_the_token`: editing a return value on the emailed link's URL does not change where the redeem lands.
- `test_UAT_FC_REQ-482_builder_signin_returns_to_the_builder_page`: a builder page asked for with no session redirects to `/sign-in?return=…`. That page's form carries the value, and the redeem lands on the builder page. `/sign-in` reached directly still lands on `/`.
- `test_UAT_FC_REQ-482_draft_preview_shows_signed_in_chrome`: the builder's draft preview of a page with account-chrome, requested with a live session, renders `data-account-chrome="signed-in"` with the viewer's initial on the avatar.

All in `tests/test_UAT_FC_REQ-482_sign_in_returns.workers.test.ts`. Regression scope: the REQ-202/204/231/368/475/147/200, BUG-76/299/314 sign-in and chrome suites, and the wrangler/migration parity suites. The only red results also fail on clean `xgd-working`: REQ-204's `/api/businesses` key list, REQ-180, REQ-185, REQ-393, REQ-162, BUG-124, and the webui/deploy-smoke reconciliation suites. BUG-310 failed once under batch load and passes on its own.