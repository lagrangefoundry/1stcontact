---
uid: request-cc75a2f2
id: REQ-668
type: request
title: 'Sign-in: every business''s customers sign in to that business'
created_by: REQ-666
created_at: '2026-11-07T23:43:18.553614+00:00'
updated_at: '2026-11-08T00:55:25.332247+00:00'
completed_at: null
last_field_updated: body
status: free_coded
fields:
  priority: high
  story_points: 8
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-ea665834
  commits:
  - working_sha: 30861f19b3d549f69df55532c112103313ec932b
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: cdb8162b917943f926e9f7fe8d3e7d9a6442586b
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  version: 0.2.820
---


## Why

The design says every business has the same sign-in and customer features as 1st Contact, because 1st Contact is just one business among them:

- [[DOC-40]] §2.1 "The platform is a 1st Contact business". Its recursion is that Bob signs in to Alice's Plumbing and reaches his portal.
- [[DOC-42]] §2 "There is no platform tenant" and §3 "A level is a position, not a property".
- [[DOC-45]] §3 "A host names a site, not a business" (host → site → business is one hop) and §10 "An authenticated surface on a customer's host".

The stored data already follows this. A client business's contacts, invites and portal behave exactly like 1st Contact's (REQ-186's two-business UAT, `portalBusinessId` per [[REQ-183]] D2). **Sign-in itself does not.** It only ever resolves one business, so a client business's customer can be invited but cannot get in. Found while scoping [[REQ-666]] (2026-11-07), whose member acceptance needs it. **This ticket must land before REQ-666's signed-in-customer items.**

## The gap, in the code

- **`signInTenant(env, host)`** (`apps/control-app/src/sessions.ts`) ignores the host and returns `TENANT_ID`. Its own comment says this is "where a second entry goes when customer hosts arrive".
- **`admit`** (`identity.ts`) and **`sessionIdentity`** (`sessions.ts`) look the person up only in `TENANT_ID`'s contacts.
- **An owner's invite** mints its link in the owner's business (`inviteUrlIssuer(…, scope.businessId)`). Redeeming it on `/sign-in/<token>` then reads the contact in `TENANT_ID`, so Bob, invited by Alice's Plumbing, is refused (`no_user`).
- **The account box on a client site** (`account-chrome`) posts to the accounts host's `/sign-in`, which cannot tell which business the sign-in is for.

## What changes (behaviour)

1. **Sign-in resolves the business from the site it started on.** A sign-in from a client site's account box, or from an invite that business sent, is for that business's contacts, by the [[DOC-45]] §3 rule (host → site → business). Signing in on 1st Contact's own site or app resolves 1st Contact. No code branches on which business it is ([[DOC-42]] §3).
2. **The link, admission and session all use that business.** The issued link, its redemption, `admit` and the session lookup look the person up in that business's contacts only. An address known in one business never reaches another business's contact ([[DOC-40]] §7, the tenant barrier). The unknown-address answer stays identical (no membership oracle).
3. **Bob reaches his portal at Alice's Plumbing.** It is the existing portal, rendered for the business he is a contact of ([[REQ-183]] D2), showing his own account and agreements.
4. **One person, several businesses.** The same address can be a contact of 1st Contact and of Alice's Plumbing, as two separate contacts. Signing in to one never signs them in as the other.
5. **Rate limits, the single-use POST redemption, "land back where sign-in started" ([[REQ-482]]) and the sign-in message ([[REQ-660]]) apply unchanged** to every business.

## Decisions (answered 2026-11-08, from the questions in this ticket's chat)

The operator handed these to the EPIC-23 session to decide. Each one answers the numbered question in the transcript.

1. **The business is chosen when the link is sent, from where the sign-in started.** The send route already checks the return address against this deployment's own hosts ([[REQ-482]], `sign-in-return.ts`). The site that address names decides the business: host → site → business ([[DOC-45]] §3), using the `site_domains` row the check already reads. If client pages are still served under the apex at `/site/<key>/`, a return address there resolves by that site key the same way. A return address that names no client site (the builder host, the apex's own pages, or none at all) is 1st Contact's own entry. That is 1st Contact's site resolving to 1st Contact, not a branch on which business it is ([[DOC-42]] §3). Redeeming a link and reading a session don't need the host: the token and the session name a `users.id`, and that row carries its business (`tenant_id`). **Accepted consequence:** a client's customer gets in from that business's site or from an invite that business sent. Typing `app.1stcontact.io/sign-in` directly reaches only 1st Contact's contacts.
2. **A session belongs to one business.** That follows from taking the business from the person. Signing in to another business in the same browser replaces the current session. **Accepted cost:** someone who owns a business on 1st Contact and is also Alice's Plumbing's customer is signed out of the builder when they sign in to Alice's portal, and back again the other way. Sessions for several businesses at once are out of scope.
3. **It lives on the accounts host (`app.1stcontact.io`) for v1.** It moves to the customer's own host ([[DOC-45]] §10, [[REQ-183]] D1) when custom-domain identity is designed. This ticket must not make that move harder: nothing may assume the portal's origin is the business's site.
4. **The terms gate checks a contact against their own business's documents.** A client business's contact is never asked to accept 1st Contact's own documents. Until [[REQ-666]] lets a business publish its own, that set is empty, so there is no gate for them. That is the same rule applied to a business that has published nothing, not an exemption. Accepting never creates a business for a client business's contact. Only 1st Contact's own new contacts get onboarding and a starter business, as today (and as EPIC-23 says for delegates). Refusing these contacts until REQ-666 lands was rejected: REQ-666 needs them admitted to build on.
5. **A person with no business they can operate lands on their portal.** That covers an invite, or a sign-in with no recorded return address, for someone holding no membership. "Can operate" means holding a membership in some business (owner today, and delegate once [[REQ-369]] lands). The builder at `/` stays the landing for members. 1st Contact's own invitees keep today's route: terms, then a new business is created for them. A recorded return address still wins, as [[REQ-482]] says.

## Test plan

UATs named `test_UAT_FC_<this ticket>_*`, through the real router and D1, mail asserted on the recorded outgoing message:
- A contact invited by a client business signs in from that business's site and is admitted as that business's contact. Their portal is that business's.
- The same address in two businesses gets two separate sign-ins. Neither session admits the other contact.
- An address known only in another business gets the identical acknowledgement and no link.
- Signing in to 1st Contact itself behaves exactly as before.
- A client business's contact who accepts is not shown 1st Contact's documents and gets no business of their own (decision 4).
- That contact, redeeming an invite with no return address, lands on their portal, not the builder (decision 5).

## What landed (2026-11-08)

- **Sending a link** (`POST /sign-in`): the checked return address ([[REQ-482]]) decides the business through `signInBusiness` (`sign-in-return.ts`). A host in `site_domains` → its site → that site's business. An apex address under `/site/<key>/` → that site by key. Anything else (the builder host, the apex's own pages, no return address, the Access sign-in) → the business `TENANT_ID` records. The person is looked up in that business only, and the message is recorded in that business's history. Rate limits, the identical acknowledgement and the single-use POST are unchanged.
- **Redeeming and sessions** take no host. `redeemSignIn(env, token)` and `sessionIdentity(env, cookie)` read the session tables through `sessionReader`. `businessOfSubject` takes the business from the `users` row the credential names, and `SignedIn` now carries `businessId`. `signInTenant` is deleted.
- **`admit(env, email, { businessId })`** looks the address up in that business. `index.ts` passes the session's business; Access passes nothing, which means 1st Contact.
- **Terms gate** (`guardTerms`): a contact owes only their own business's documents. The inlined bundle is 1st Contact's, so a client business's contact owes none, is never shown 1st Contact's terms, and posting the accept route records nothing and builds no business (204).
- **Landing**: a signed-in navigation to `/` by someone holding no membership, with no business in scope, gets a 303 to the portal. Members keep `/`, and a recorded return address still wins.

UATs: `tests/test_UAT_FC_REQ-668_every_business_signs_in.workers.test.ts`, six cases matching the test plan above.

**Supersedes one [[REQ-482]] case (implicit).** REQ-482's "a bound host is one of ours" case signed in a 1st Contact member from their own business's site. Under decision 1, a sign-in from that site is for that business's contacts, so the case now asks as a contact of that business. The landing claim is unchanged. By the same rule, an owner signs in to 1st Contact from 1st Contact's pages, not from their own site's account box.
