---
uid: comment-c74424ff
id: COMMENT-1014
type: comment
title: Comment on chat CHAT-23
created_by: xgd
created_at: '2026-08-15T01:15:33.799432+00:00'
updated_at: '2026-08-15T01:46:39.398282+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: chat-06d47a5c
  kind: chat_transcript
---

<!-- xgd-turn id="d29cc14d-2295-40a1-9cca-7c8094bb7907-user" -->

<!-- xgd-chat role="user" ts="2026-08-15T01:15:28.249394+00:00" -->
#### You
I would like to discuss the creation of a login module. This should be created for inclusion in 1stcontact sites but also used by the 1stcontact application itself.

I believe we had a design. The proposal for v1 was passwordless login by email magic link. So sign-up and sign-in are almost identical the difference is just that sign-up requires T&C acceptance.

Note as part of this we will need to create an account object. lets discuss the right data model (account/user/email etc) bearing in mind that CRM-lite is our next feature (I expect). Please review the existing docs on this and consult the chat about email capture

<!-- xgd-turn id="d29cc14d-2295-40a1-9cca-7c8094bb7907-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-15T01:25:44.536434+00:00" -->
#### Claude
I'll dig into the existing design material before we discuss.

I've read the existing design material. Here's what's already committed, and where I think the real decisions are.

## What already exists

| Source | What it commits to |
|---|---|
| **DOC-5** §"Identity and Authentication Decision" | Magic email links, no passwords, no social login for MVP. Identity anchored on verified email. Auth and authz explicitly **separate**. Three access populations sketched: business-owner portal, lead-level access, customer-portal access. |
| **DOC-7** §10 | Magic-link *initiation* lives on the `public-site` Worker; authenticated endpoints on `control-app`. |
| **REQ-123** (decision 4) | **The tenant is the account, and it is the hard information barrier.** A site is an object *inside* a tenant. Site isolation is a predicate (`fields.site_id`), not a structural guarantee. Agency accounts flagged as the known weak spot. |
| **`@lagrangefoundry/ticketing`** | Already has a control-plane `tenants` registry table (`id, name, status, config, created_at`) sitting *above* tenant scoping, with `forTenant()` binding scope into the handle. |
| **CHAT-13** | The email backend design — `EmailProvider` seam, Queue, per-site verified sending identities, nonce/dedupe/rate-limit stack. |

Two things worth flagging before we design anything:

**None of CHAT-13's tickets were ever filed.** No α (capture backend), no β (sending identity + delivery), no γ (custom-domain routing). `db/migrations/` is still empty and there's no D1 binding anywhere. Magic link *is* transactional email, so β is a hard prerequisite — we cannot ship login without it.

**There is no `components/auth` in lagrange-framework.** Given ticketing, ai, knowledge and webui all live there and are consumed here, and given you want this used by both the app and customer sites, I think the auth core belongs there as a component rather than as a package in this repo. Same shape as ticketing: generic, conformance-testable, second consumer already visible.

---

## The structural point: two realms, one mechanism

"Login for 1stcontact sites *and* the 1stcontact app" sounds like one thing. It's two identity populations at different levels of the tenancy tree:

| | **Platform realm** | **Site realm** |
|---|---|---|
| Who | Business owner logging into the builder/portal | The plumber's *customer* viewing their quote |
| Lives | **Above** tenancy — control plane | **Inside** a tenant, attributed to a site |
| Is the same object as | — | the CRM contact / the email-capture subscriber |
| Cookie origin | `app.1stcontact.io` | the customer's own domain |
| Served by | `control-app` (a real app, not a rendered site) | `public-site` + a behavior module |

The magic-link *mechanism* is identical. The identity store, the cookie scope, and the authorization are not. I'd keep them structurally separate — different tables, different session audience, different cookie names — because a single users table serving both puts a site visitor's identity in the same namespace as an account owner's, and that's the classic escalation path. The same human being both (you own an account *and* are a contact on someone else's site) should be two rows, deliberately.

So the honest answer to "one module for both" is: **share the core, not the module.** A framework auth component providing token issue/verify/consume, session mint/verify, rate limits and templates; consumed by control-app routes on one side and an `auth` behavior module + public-site endpoints on the other.

---

## Platform-side data model

Sitting beside the ticketing component's existing `tenants` table, in the control plane — *not* in the tenant-scoped ticket store. That's forced: you can't resolve which tenant a login belongs to from inside a handle that's already tenant-scoped.

```
accounts        → the existing `tenants` row (don't build a second one)
identities      → id, email (unique, normalised), verified_at, created_at, platform_role
memberships     → identity_id, account_id, role, invited_by, invited_at, accepted_at, status
auth_tokens     → hash, realm, purpose, subject, issued_at, expires_at, consumed_at
sessions        → hash, realm, subject, account_id?, issued_at, expires_at, revoked_at
```

Three deliberate choices:

**Membership is a table, not an `account_id` column on the identity.** Two non-speculative reasons: REQ-123 already flags agency accounts (one identity, several unrelated clients), and you need support access into a customer account. With `account_id` on the user, "log in as support" means a duplicate identity row per account — which is exactly how audit trails rot. Membership also gives `role` a natural home (`owner | admin | staff`, per DOC-5's scope list).

**Email is a column on identity, but nothing else joins on it.** DOC-5 says identity is *anchored* on verified email, not equal to it. Keeping `identity_id` as the FK everywhere means adding an `identity_emails` table later (email change, multiple addresses, adding a passkey credential) is additive rather than a reshape. I wouldn't build that table now.

**`auth_tokens` and `sessions` store hashes, never raw values.** A DB leak must not yield usable links.

---

## Site-side: this is where CRM-lite converges

Inside a tenant, one object — **contact** — created by email capture, a contact-form submission, an import, or self-signup at a site login. CHAT-13's `subscribers`, DOC-5's lead, and the site-login member are the same row.

The interesting question is whether contacts are **tickets in the ticket store** or **native D1 rows**. DOC-5 says "a lead is conceptually similar to a ticket", and you now literally have a typed ticket store with status lifecycles, comments, links, human ids and an AI toolbox already declared over it. That's a real pull.

I'd split it, and I think the split is principled rather than a fudge:

| | Where | Why |
|---|---|---|
| **contact** | native D1 table | Hot-path auth lookup, uniqueness constraint on email, high volume (a 50k mailing list is not 50k tickets), single PII-deletion target |
| **lead / deal / quote** | ticket in the store, linked to a contact | Has a lifecycle, a conversation (= comments), links to invoices, and the caretaker AI can already operate on it through `ai_ticketing` with **zero new tool surface** |

The contact is a *record*; the lead is a *process*. Login only ever touches the record, so the auth core never needs the ticket store.

One genuine decision inside this: **is a contact keyed per-tenant or per-site?** I lean tenant-level with site attribution, on the same reasoning REQ-123 used for knowledge — one client's several sites sharing a contact is a feature, not a leak. Consent stays per (contact, list, source), which is what the legal record actually needs anyway. But it's a real call and I'd want you to make it explicitly.

---

## Magic-link mechanics — the parts that actually bite

**Email scanners will burn your tokens.** Outlook SafeLinks and corporate gateways *fetch* every link in an email. A naive single-use GET token is consumed before the human clicks — this is the number one practical failure mode of magic links and it needs designing for in v1, not discovering in production. The fix: the link lands on a page that does **not** consume; it shows a "Continue" button that POSTs. Scanners don't POST. Add a short grace window allowing re-redemption within a few minutes.

**Same-browser binding is a config, not a rule.** Binding the token to a cookie set at request time is stronger, but it breaks "request on laptop, open on phone" — which is a very normal thing for a tradesman. I'd make it strict for the control app and relaxed for site logins.

**`SameSite=Lax`, not `Strict`.** The magic link is a top-level cross-site navigation from a mail client; `Strict` drops the cookie on exactly that first navigation. `__Host-` prefix, `HttpOnly`, `Secure`.

**Put T&C acceptance *after* verification, not before.** You said sign-up differs from sign-in only by T&C acceptance. If the checkbox is on the initial form, showing it conditionally leaks whether an address is registered — and showing it unconditionally is noise for returning users. If instead the link lands on a page that says "you're new here, accept the terms to continue", you get: no enumeration leak at all, and a **stronger consent record** — accepted by someone who has provably controlled the inbox, with the terms version stamped at that moment. I'd recommend this.

**Consume atomically.** `UPDATE ... WHERE consumed_at IS NULL` and check rows-affected — not read-then-write, which races.

**Sessions:** opaque id → D1 lookup for v1. Simple, and revocation is instant. If per-request D1 reads become a cost problem, the upgrade is a short-lived signed cookie refreshed against D1 — bounded revocation lag, cheap verification. Don't reach for KV; eventual consistency and revocation are a bad pairing.

---

## The thing that makes site-side login hard

Published sites are **static snapshots on R2, edge-cached immutable**. A logged-in state cannot be baked into a cached artifact. So site-side login needs either client-side JS fetching session state and pulling gated content, or an authenticated dynamic route on the Worker that bypasses cache. That is a bigger architectural change than "add a form module", and it's the main reason I'd sequence platform login first.

Site login also inherits both of CHAT-13's blockers: the session cookie must be host-only on the *customer's* domain (needs γ, custom-domain routing) and the email must come from the customer's domain or it reads as phishing (needs β's per-site sending identities).

**Platform login has neither problem** — one sending domain you control, one origin you control, an app that already runs dynamically. It can ship on a minimal `EmailProvider` seam without the per-site provisioning story.

---

## Suggested ordering

1. **Email delivery core** — CHAT-13's β, reduced to what platform login needs: `EmailProvider` seam, one verified sending domain, Queue. (Per-site identities can come later.)
2. **Auth core as a framework component** + platform realm: identities, memberships, tokens, sessions; control-app login.
3. **Contacts table + capture backend** — CHAT-13's α, which is where CRM-lite starts.
4. **CRM-lite** as ticket types over contacts.
5. **Site realm** — gated by γ and per-site sending identity.

---

## Decisions I'd like from you

1. **Auth core as a `lagrange-framework` component, or a package here?** I recommend the framework, on the ticketing precedent.
2. **Contact keyed per-tenant or per-site?** I lean per-tenant with site attribution.
3. **Contacts native table + leads as tickets** — agree with that split, or do you want contacts as tickets too?
4. **T&C acceptance after verification** rather than on the request form — agree?
5. **Platform-operator access**: an ambient `platform_role` on the identity, or an explicit time-boxed audited grant (impersonation session)? The second is better hygiene; the first is a day's less work.
6. **Do you want CHAT-13's α/β/γ filed now?** They're unfiled, and β at minimum is on login's critical path.

<!-- xgd-turn id="77bc1ca0-6db3-4b91-89ef-7c5156388b71-user" -->

<!-- xgd-chat role="user" ts="2026-08-15T01:46:39.153455+00:00" -->
#### You
The identity store, the cookie scope, and the authorization are not. I'd keep them structurally separate — different tables, different session audience, different cookie names — because a single users table serving both puts a site visitor's identity in the same namespace as an account owner's, and that's the classic escalation path. <-- aren't they just different roles though in the same db? Let me walk you through my mental model and see if it's wrong: I have a site xgd.dev with users U1..U1000 they are site users. as a site owner I may have a site-user login but to access the site as an owner I login as a 1stcontact user. 1c has users V1...V20000 this is a different tenant but the same table

<!-- xgd-chat-end -->