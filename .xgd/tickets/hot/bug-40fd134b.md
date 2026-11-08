---
uid: bug-40fd134b
id: BUG-382
type: bug
title: 'Sign-in: sessions for unrelated businesses replace each other in one browser'
created_by: EPIC-23
created_at: '2026-11-08T17:04:44.392263+00:00'
updated_at: '2026-11-08T18:25:04.878069+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: high
  priority: high
  story_points: 5
  parent_uid: epic-ee37a03f
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-1701e212
  commits:
  - working_sha: cb59c72d56810c08ae7dffc1336a3c5d5a741d38
    reconcile_sha: null
    main_sha: null
  - working_sha: 53d076964855038028dbada90f22670f86a4be47
    reconcile_sha: null
    main_sha: null
  version: 0.2.827
---

## Symptom

A person who is a contact of two unrelated businesses can be signed in to only one of them per browser. Example: Alice is 1st Contact's customer (she owns a business and uses the builder), and the same address is also a member of Bob's Salon. Signing in to Bob's Salon signs her out of the builder, and signing in to the builder signs her out of Bob's Salon. The two sign-ins should have nothing to do with each other. They are unrelated sites that happen to share an address.

## Root cause

[[REQ-668]] made sign-in per business. Its decision 2 ("a session belongs to one business; signing in to another replaces it") was a wrong call, made on the operator's behalf in the EPIC-23 session and since overruled by the operator (2026-11-08). The mechanics behind it:

- There is one session cookie on the accounts host (`sessionCookie(env)` in `apps/control-app/src/sessions.ts`, one `SESSION_COOKIE_NAME`). A new sign-in overwrites it, whichever business it is for.
- The session's business is read from the person the cookie names (`businessOfSubject`). Every signed-in page therefore serves whichever business was signed in last.
- The portal sits at one fixed path (`PORTAL_PATH`, `/account`) that does not name a business. A page cannot say which business's session it wants.

## Fix (behaviour)

1. **One browser holds an independent session for each business.** Signing in to business B never ends, replaces or reads the session for business A.
2. **Every signed-in page belongs to exactly one business, named by its address, and reads only that business's session.** The builder, console and 1st Contact's own portal belong to 1st Contact. A client business's portal URL names that business. A page whose business has no session in the browser is treated as signed out for that business only.
3. **Signing out is per business.** Signing out of Bob's Salon leaves the builder session alone, and the other way round.
4. **Sending, redeeming and landing are otherwise unchanged from REQ-668.** The business is chosen from where sign-in started, redeeming sets that business's session only, and landing goes to that business's portal or the builder. A sign-in link issued for one business can never set a session for another.
5. **Unchanged:** separate person records per business (no linkage between same-address contacts), the per-business terms gate, rate limits, the single-use POST redemption, and the identical unknown-address answer.

6. **A published site's account box reads only its own business's session.** In a browser signed in to 1st Contact and to Bob's Salon, Bob's Salon's site shows the salon session and 1st Contact's site shows 1st Contact's; a site whose business has no session in the browser is signed out. Its "Your account" link opens that business's portal (`/c/<businessId>/account` on the accounts host), not 1st Contact's.
7. **A client business's terms page posts its acceptance under that business's address**, so agreeing is done with that business's session (it would otherwise be refused as signed out).

This overrules [[REQ-668]] decision 2 and amends its decision 5: a client business's contact with no recorded return address now lands directly on their portal at `/c/<businessId>/account` (previously `/`, then redirected to `/account`).

Mechanism (guidance, not pinned): one cookie per business on the accounts host, with the business in the name or scoped by path, plus a portal URL that carries the business (for example its site key). Moving each business's portal onto its own host ([[DOC-45]] §10) would separate cookies naturally, but that waits on the custom-domain identity design and is not part of this fix.

## Test plan

UATs named `test_UAT_FC_<this ticket>_*`, through the real router and D1:
- The same address signed in to 1st Contact and to a client business in one cookie jar: both the builder and the client portal serve their own business's contact at the same time.
- Signing out of the client business leaves the builder session working, and the other way round.
- A page for a business with no session in the jar is signed out for that business, even while another business's session is present.
- A session for business A is never accepted on a page for business B.

## What was built

- **Cookie per business.** 1st Contact's session keeps the configured name (`session`), so existing builder sessions survive. A client business's is `session-<businessId>` (bytes outside `A-Za-z0-9._~-` percent-encoded). Same `Domain`, `Path=/`. The naming rule, the `/c/` prefix and its helpers live in `packages/framework/src/accounts-host.ts`, shared by both apps and kept out of `account-chrome` (which names no business by design, REQ-200).
- **Page → business.** Under `/c/<businessId>/` a page belongs to that business; every other path is 1st Contact's (`pageBusiness`). `sessionIdentity` reads only that business's cookie, and refuses the session unless its person is that business's contact: a cookie name is only a label. `splitBusinessPrefix` strips the `/c/` prefix first, so the router, the terms gate and the security headers route the same paths beneath it. The built-in portal served under the prefix hands its module the prefixed endpoints (`/c/<id>/api/businesses`, `/api/acceptances`, `/api/account/emails`).
- **Redeem.** The token is redeemed as before; the `Set-Cookie` is re-made under the cookie of the business the token's person belongs to. With no recorded return address it lands on the builder (1st Contact) or `/c/<businessId>/account` (client business).
- **Sign-in from a client portal.** A return address on the accounts host under `/c/<businessId>/` makes the sign-in for that business (if the business exists). A signed-out reader of a client portal is sent to `/sign-in?return=/c/<businessId>/account`, so they sign in to that business.
- **Sign-out.** `POST /sign-out` ends and clears 1st Contact's session only (and still sends an Access holder to the Access logout). `POST /c/<businessId>/sign-out` ends and clears that business's session only, never touches Access, and lands on the sign-in page set to return to that business's portal. `everywhere` ends every session of the one person (per business, since people are per business).
- **Public site.** It reads every `session` / `session-<id>` cookie (up to 8) and accepts one only when its person is a contact of the business that owns the served site (one D1 join) and, for a `session-<id>` cookie, `<id>` is that business. For a client business's session the account box's portal link is rewritten to `/c/<businessId>/account` on the accounts host.

### Known limits

- A business's own authored portal site (rather than the built-in one) keeps whatever endpoints its author configured; served under `/c/<id>/`, absolute `/api/…` endpoints would read 1st Contact's session. The built-in portal is what every business serves today.
- Client-business sessions minted before this fix sit under the old shared `session` name. The control app refuses them on every page (their person is not 1st Contact's), so those contacts sign in once more. The public site cannot tell 1st Contact's tenant id, so on their own business's site such a legacy cookie still shows signed in until it expires.

## Test evidence

- `tests/test_UAT_FC_BUG-382_one_session_per_business.workers.test.ts` (real Worker + D1, one cookie jar): signed in to both at once, each page serves its own record (and re-signing in to 1st Contact replaces neither); sign-out of either leaves the other; a business with no session in the jar is signed out and its portal sends you to sign in for that business; a session moved under another business's cookie name is refused.
- `tests/test_UAT_FC_BUG-382_site_reads_its_own_business_session.test.ts` (public-site Worker): each site shows its own business's session and links to its portal; a site whose business has no session is signed out; a session under another business's cookie name is refused.
- Amended for the new addresses: REQ-668's UATs (client portal and APIs at `/c/<id>/…`, landing on `/c/<id>/account`, `sessionIdentity` given the page's business), REQ-666's UATs (client contact's portal, accept and address calls under `/c/<id>/`, and the page's `data-accept` pinned to the prefixed path), REQ-200's `readSessionIds` assertion.