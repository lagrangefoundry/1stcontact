---
uid: request-3df2d0e7
id: REQ-180
type: request
title: 'The account surface: the businesses endpoint, the customer portal, and the
  Business vocabulary'
created_by: xgd
created_at: '2026-09-02T23:15:34.866461+00:00'
updated_at: '2026-09-05T00:05:01.877956+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: medium
  story_points: 5
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-a77a9cac
  commits:
  - working_sha: 7b17517616b6ff1149d0749aad12ee84bd335ad5
    reconcile_sha: null
    main_sha: null
  - working_sha: 48054a6864b452df270ece39c18172138704e730
    reconcile_sha: null
    main_sha: null
  version: 0.2.63
---

# The account surface: the businesses endpoint, the customer portal, and the Business vocabulary

## What this covers

Three things that all follow from [[DOC-40]] §2 splitting the account from the business, and that share one decision. They are one ticket because getting the middle one wrong makes the other two wasted work — see _Splitting_ at the end.

1. The endpoint that tells the browser which businesses an account may operate.

2. The **account** surface itself — plan, invoices, details.

3. The user-facing vocabulary: **Business**.

## 1. The businesses endpoint

[[REQ-178]] makes `Admission` carry the set. This exposes it:

- `GET` returning, per business: opaque id, `tenants.name`, whether it is selectable, and — for a lapsed one — enough to say _why_ without saying more than the operator is owed.

- Authorised by the same Access-verified identity every other route uses. It returns **only** businesses the caller holds a live membership for; a caller naming another account's business gets the same answer as one naming a business that does not exist.

It is the contract [[REQ-179]]'s switcher reads. Either ticket may land it, on the [[REQ-170]]/[[REQ-161]] precedent for `webui-list-detail`.

## 2. The account surface is the customer portal

**This is the decision the ticket exists to force, and it should be made before any of it is built.**

[[DOC-40]] §2.1: 1st Contact is built as a 1st Contact business. A customer of ours is a `users` row in the platform tenant — already true in `identity.ts` — with a billing relationship and a login. That is precisely what _their_ customers will be to _them_. So the surface showing an account its plan, its invoices and its details is **the customer portal of the 1st Contact site**, and not a builder page.

The consequence is the whole of [[DOC-40]] §2.1's leverage argument:

- Built as a portal, it is one feature serving both levels, and our customers get it when we do.

- Built as a builder page, it is the _named failure mode_ of §2.1 rule 1 — the bespoke admin billing page — and the portal gets built a second time later, by someone who has to reverse-engineer what this one decided.

What follows from taking the portal reading:

- It renders through the site pipeline against the platform business, not as another `apps/control-app` builder route.

- It is reached from the avatar ([[REQ-179]]) — chrome that links out, rather than a tab that owns a surface.

- Its capabilities are portal capabilities from the start: _see my plan_, _see what I have been charged_, _change my details_. Anything that is only ever true of 1st Contact's own account belongs in the admin console ([[REQ-170]]) instead, and the line between them is worth drawing once, here.

- **Adding a business** is an account-level action and lands here, on [[REQ-178]]'s `provisionBusiness`.

Deferred deliberately: the portal our customers give their customers is not built by this ticket. What this ticket owes is that building it later requires no second implementation of what it does build.

## 3. The vocabulary is Business

The tenant is a **Business** everywhere a person can read it: the switcher, the account surface, the admin console, error copy, help text.

It is not a brand and not a workspace. _Brand_ names why two are separate but reads wrong next to what one actually holds — a brand does not have a calendar, and "your brand's customers" is a phrase this product would have to say on every screen. _Workspace_ claims nothing, which is the wrong claim for software whose pitch is that it runs your business.

**The schema keeps **`tenant_id`**.** This is a label decision, not a rename: `tenant_id` appears in R2 keys and in every store handle, and renaming a column to match a word buys a migration for nothing. The rule is that `tenant` is internal vocabulary and never reaches a screen — [[DOC-40]] §2 states the pairing and this ticket applies it.

## Acceptance

- The endpoint returns exactly the caller's live-membership businesses; a cross-account request is indistinguishable from a nonexistent one.

- Lapsed businesses appear, marked, with a reason.

- The account surface renders against the platform business through the site pipeline, and no billing or plan view exists as a builder-only route.

- Adding a business from the account surface goes through `provisionBusiness`.

- No user-visible string in the builder, the account surface or the admin console says "tenant"; `tenant_id` is untouched in the schema.

## Splitting

Item 2 is the large one and the only one carrying an open decision. If the portal reading is confirmed, item 2 is worth its own ticket and this one keeps 1 and 3; if it is rejected, that rejection needs recording against [[DOC-40]] §2.1 because it costs the leverage argument that section is built on. Either way the decision comes first — it is cheap now and expensive after the surface exists.

---

## Decisions — 2026-09-03

The three questions §2 and _Splitting_ hold open are answered here. Everything above stands as written; this section says which way each went and what that makes buildable now.

### D1. The portal reading is CONFIRMED

The account surface is the customer portal of the 1st Contact site, not a builder page. [[DOC-40]] §2.1's leverage argument holds, and the named failure mode — the bespoke admin billing page — is the thing this decision refuses.

**But confirming the reading is not building the portal, and this ticket does not build it.** `apps/public-site` has no identity, no Access gate and no session; a portal rendered through the site pipeline against the platform business needs all three, plus a surface for plan and invoices when there are no invoices to show and one plan to show them under ([[DOC-40]] §5 defers payment). That is its own ticket, and _Splitting_ is taken: this ticket keeps 1 and 3.

What the decision binds NOW is a prohibition, and it is testable: **no plan, billing or invoice view exists as a builder route.** The avatar surface ([[REQ-179]]) stays what its own doc comment says it is — who is signed in and which businesses that identity reaches — and grows no portal capability. It is chrome that will link out; it is not the surface.

### D2. There is NO self-serve "add a business"

Reversing the fourth bullet of §2. We are pre-billing and pre-proper access control, so a customer-facing control that mints a live `pro` grant is an unbounded free-plan mint ([[DOC-40]] §9 item 4). **The operator adds businesses.** No button, no customer-reachable route.

The API question §2 raised — `POST /api/businesses` on `provisionBusiness` — is answered: not as a self-serve endpoint. What lands instead is the operator's path, which may be entirely manual:

- `POST /api/admin/businesses` — refused to anyone whose admission does not carry `platform_admin` ([[DOC-40]] §6), and refused with the same single message every other refusal uses. It names an existing account by email and calls [[REQ-178]]'s `provisionBusiness` and nothing else.

- Driven by hand by the operator against their own logged-in session. There is no console around it: [[REQ-170]] owns the admin console and this is the contract it will call rather than reimplement.

- **Creating an account already provisions its first business.**`provisionInvite` calls `provisionBusiness`, so the account-creation path and the add-a-business path write identically-shaped businesses. That property is asserted rather than assumed.

### D3. A BUSINESS AND ITS TENANT ARE ONE OPERATION

The model's load-bearing identity is _business == tenant_, so the two must be incapable of coming into existence apart. They already are: `provisionBusiness` is the only path that creates a business, and it writes the `tenants` row, the `owner` membership, the grant and the starter site together.

The one place a `tenants` row appears without a business is `storeFor`'s self-heal, which registers an unknown tenant rather than 503ing a fresh deployment. It cannot mint an orphan for a customer: an admission-derived scope came out of a query that joins `tenants`, so the row already exists by the time `storeFor` sees it, and the self-heal is reachable only for the `TENANT_ID` platform business on the dev-open path. **That reachability is the invariant, and it is asserted.**

### D4. The lapse reason is what item 1 still owes

[[REQ-179]] landed `GET /api/businesses` — the set, the account, lapsed members marked, not an oracle, uncacheable. What §1 asks for and it does not yet carry is _why_ a lapsed business lapsed.

So an unselectable business reports a **lapse**: `expired` (a grant covered it and its end has passed — with the date, which its owner is owed), `revoked` (a grant was withdrawn), `not_yet` (a grant is written and has not started), or `never_granted` (no grant was ever made). A selectable business reports none — the lapse is present exactly when `selectable` is false, so the two cannot disagree.

**IT SAYS NOTHING ABOUT ANYBODY ELSE.** The caller holds a live membership on every business in the answer, so the reason is a fact about their own business; it is owed to them, and the answer for a business they do not hold is unchanged, which is that it is not in the list at all.

**IT REACHES THE PERSON.** A reason computed and not rendered is not a reason, so the account surface states it in words beside the business it belongs to. The switcher keeps the short suffix — an `<option>` is a label and cannot carry a sentence.

### D5. Where the vocabulary rule bites

Users see **the web app and the site**, so that is where §3's rule is enforced: no string literal in the builder client or in `public-site` says "tenant".

Exempt, and the exemption is a rule rather than a list: **SQL**, and **deployment vocabulary** — a string naming `TENANT_ID` or `wrangler.toml` is addressed to whoever edits the deployment, and is reachable only when the app has failed to start. Renaming a configuration variable to match a word on a screen is the migration §3 declines to buy, in the one place the word is the operator's own.

The rule is enforced by a guard rather than by an audit, because the audit passes today: every "tenant" in the two apps is a comment or a query. The failure this protects against is the next one, written by someone who did not read §3.

## Acceptance — as decided

- An unselectable business carries a lapse saying why, and a selectable one carries none.

- An expired lapse carries the date access ended.

- The account surface states each lapsed business's reason in words.

- Adding a business is refused to a caller without `platform_admin`, and goes through `provisionBusiness` when it is allowed.

- Creating an account provisions its first business through that same function.

- A business cannot be created without its tenant; the only path that registers a tenant alone is unreachable for an admission-derived scope.

- No string literal in the builder client or the public site says "tenant", excepting SQL and strings naming `TENANT_ID` or `wrangler.toml`.

- No plan, billing or invoice view exists as a builder route.

- `tenant_id` is untouched in the schema.

### D1 addendum — the portal ticket is [[REQ-183]]

Filed 2026-09-03. It carries the surface D1 confirmed and deliberately did not build, and it opens with the origin question (`app.1stcontact.io` versus `1stcontact.io`) that has to be settled before any of it exists. The prohibitions this ticket landed — no plan/billing/invoice route in the builder, the avatar surface bounded to facts about the session, no self-serve add-a- business — are constraints ON that ticket, not work it supersedes.

---

## Reopened 2026-09-04: three amendments from [[DOC-42]]

Moved back to `draft` from `ready_to_reconcile` to take these before the work
reconciles. **The commits above stand** and no endpoint changes shape — what
changes is the rationale behind D2's gate, the reachability of D4's lapse, and
the extent of D5's rule. [[DOC-42]] is the model these come from, and it was
written out of the discussion that produced this section.

### A1. D2's gate is product fulfilment, not administration

`POST /api/admin/businesses` is right and stays exactly as it is. What is wrong
is the reason given for it.

D2 gates it on `platform_admin` — a flag, i.e. on *being an administrator*.
[[DOC-42]] §7 gives the reason it is actually gated: **provisioning a business is
1st Contact filling an order.** It is our product-fulfilment action, and it needs
privilege because it writes a `tenants` row, not because the caller holds a
badge. Stated as two conditions:

1. **you are an owner of this business** — uniform; a customer is the owner of
   theirs
2. **this business's product is businesses** — which is what confines the control
   to 1st Contact

Today those two select exactly the set `platform_admin` selects, so **nothing
built here has to change**. What changes is that the next hand does not read the
flag as "admins get extra pages" and build a generic privileged-surface
mechanism — which is [[DOC-40]] §2.1 rule 1's failure mode, and which
[[REQ-170]] would be the first to inherit.

`PLATFORM_ADMINS` keeps the role [[DOC-40]] §6 argues for: a break-glass seed
that works before any row exists and cannot lock its holder out. [[DOC-42]] §10.3
records that the **column** carries two separable capabilities — ownership of the
1st Contact business, which is `memberships.role` and not special, and entry into
a business without a membership (`scope.ts:237`), which is genuinely special
because 1st Contact hosts the others. Splitting them is its own ticket and is
not owed by this one.

### A2. D4's lapse does not reach the person it was written for

D4 says it plainly — **IT REACHES THE PERSON** — and it half does. `admit`
refuses when *no* business is selectable, so an account with one live and one
expired business sees the expired one's reason, and an account whose businesses
have **all** lapsed is refused at the door and sees nothing. The `expired` reason
carrying the date access ended is precisely what someone in that state is owed,
and it is exactly they who cannot get to it.

[[REQ-178]]'s reopen is the fix: membership admits, `no_entitlement` becomes a
state inside an admitted session rather than a refusal. This ticket's acceptance
— *"the account surface states each lapsed business's reason in words"* — becomes
satisfiable rather than vacuous for the all-lapsed case.

No change to the lapse values, their derivation, or the rule that a lapse is
present exactly when `selectable` is false.

### A3. D5 extends from the word to the concept

D5 forbids the **string** "tenant" in the builder client and the public site, and
exempts SQL and deployment vocabulary. All of that stands, including the
exemption for `TENANT_ID` and `wrangler.toml` — [[DOC-42]] §2 relies on it.

What D5 does not yet forbid is the **model concept**. §2 of this ticket says a
customer of ours is *"a `users` row in the platform tenant"*. There is no platform
tenant. There is the **1st Contact business**, which owns the 1c site and whose
users are its customers — the same sentence a customer would say about theirs.
The behaviour described is correct; the phrase names a kind of tenant that does
not exist, and once it is in the vocabulary the code follows it into
platform-only capability.

So the rule gains a second half ([[DOC-42]] §2): **no predicate meaning "is this
the platform's own tenant"** outside `TENANT_ID`'s two readers, `identity.ts` and
`scope.ts` ([[REQ-168]]). The guard-rather-than-audit approach D5 already chose
is the right instrument for it.

### What this does not reopen

D1 and D3 are untouched. The portal reading, the prohibition on plan/billing/
invoice views as builder routes, and business-and-tenant-as-one-operation all
stand exactly as decided — [[DOC-42]] §5 and §7 depend on them.


### What the amendments make buildable

A2 lands no code here. Admission is [[REQ-178]]'s and the surface a
nothing-selectable session lands on is [[REQ-183]]'s; what this ticket owes A2 is
that the account surface already states a lapse per business rather than as one
banner, which it does, so the all-lapsed case needs no second rendering path when
that admission change arrives.

A1 and A3 land the same instrument twice, and it is the one D5 already chose: a
**guard, not an audit**. Both audits pass today — `platform_admin` has exactly the
two readers it should, and no predicate anywhere asks whether a business is the
platform's own. So in both cases the thing worth writing down is not a cleanup but
the assertion that the next one cannot appear quietly, which is [[REQ-168]]'s
single-reader idiom applied to a flag and to a concept.

- **A1's guard: `platform_admin` has two readers, and they mean different
  things.** `scope.ts` reads it to enter a business without a membership — the
  genuinely special power, and special because 1st Contact *hosts* the others
  ([[DOC-42]] §8). `router.ts` reads it to gate product fulfilment — provisioning
  is 1st Contact filling an order ([[DOC-42]] §7). A third reader is the generic
  privileged-surface mechanism [[DOC-42]] §7 names as its falsifier and
  [[DOC-40]] §2.1 rule 1 names as its failure mode, so the count is the
  assertion. The declaration of the column and the SQL that writes it are not
  reads and are exempt, on the same rule the vocabulary guard already uses.

- **A3's guard: no predicate asks whether a business is the platform's own.**
  Outside `identity.ts` and `scope.ts` — [[REQ-168]]'s two readers, and the two
  places the question is legitimately asked — nothing may name or test the
  concept. It extends the D5 guard rather than starting a second one, because it
  is the same rule at the level below the word: D5 keeps *tenant* off a screen,
  and this keeps *the platform's tenant* out of the model.

- **The route's stated reason is corrected in place.** `POST /api/admin/businesses`
  does not change shape, and its comment stops giving the flag as the reason. The
  reason is [[DOC-42]] §7's two conditions — you own this business, and this
  business's product is businesses — which select exactly the set the flag selects
  today and will not select a generic admin surface tomorrow.

## Acceptance — as amended

- `platform_admin` is read in exactly two places, and a third read fails the
  build; the column's declaration and the SQL that writes it are not reads.

- No predicate outside `identity.ts` and `scope.ts` names or tests "the
  platform's own tenant".

- Both guards can be shown a violation they must catch and each exemption they
  must excuse.

- Everything D1–D5 landed still passes unchanged: no endpoint changes shape.
