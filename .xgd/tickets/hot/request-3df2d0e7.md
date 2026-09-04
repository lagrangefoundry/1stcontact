---
uid: request-3df2d0e7
id: REQ-180
type: request
title: 'The account surface: the businesses endpoint, the customer portal, and the
  Business vocabulary'
created_by: xgd
created_at: '2026-09-02T23:15:34.866461+00:00'
updated_at: '2026-09-04T00:05:31.552592+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: medium
  story_points: 5
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-a77a9cac
---

# The account surface: the businesses endpoint, the customer portal, and the Business vocabulary

## What this covers

Three things that all follow from [[DOC-40]] §2 splitting the account from the
business, and that share one decision. They are one ticket because getting the
middle one wrong makes the other two wasted work — see *Splitting* at the end.

1. The endpoint that tells the browser which businesses an account may operate.
2. The **account** surface itself — plan, invoices, details.
3. The user-facing vocabulary: **Business**.

## 1. The businesses endpoint

[[REQ-178]] makes `Admission` carry the set. This exposes it:

- `GET` returning, per business: opaque id, `tenants.name`, whether it is
  selectable, and — for a lapsed one — enough to say *why* without saying more
  than the operator is owed.
- Authorised by the same Access-verified identity every other route uses. It
  returns **only** businesses the caller holds a live membership for; a caller
  naming another account's business gets the same answer as one naming a
  business that does not exist.

It is the contract [[REQ-179]]'s switcher reads. Either ticket may land it, on
the [[REQ-170]]/[[REQ-161]] precedent for `webui-list-detail`.

## 2. The account surface is the customer portal

**This is the decision the ticket exists to force, and it should be made before
any of it is built.**

[[DOC-40]] §2.1: 1st Contact is built as a 1st Contact business. A customer of
ours is a `users` row in the platform tenant — already true in `identity.ts` —
with a billing relationship and a login. That is precisely what *their* customers
will be to *them*. So the surface showing an account its plan, its invoices and
its details is **the customer portal of the 1st Contact site**, and not a builder
page.

The consequence is the whole of [[DOC-40]] §2.1's leverage argument:

- Built as a portal, it is one feature serving both levels, and our customers get
  it when we do.
- Built as a builder page, it is the *named failure mode* of §2.1 rule 1 — the
  bespoke admin billing page — and the portal gets built a second time later, by
  someone who has to reverse-engineer what this one decided.

What follows from taking the portal reading:

- It renders through the site pipeline against the platform business, not as
  another `apps/control-app` builder route.
- It is reached from the avatar ([[REQ-179]]) — chrome that links out, rather
  than a tab that owns a surface.
- Its capabilities are portal capabilities from the start: *see my plan*, *see
  what I have been charged*, *change my details*. Anything that is only ever true
  of 1st Contact's own account belongs in the admin console ([[REQ-170]])
  instead, and the line between them is worth drawing once, here.
- **Adding a business** is an account-level action and lands here, on
  [[REQ-178]]'s `provisionBusiness`.

Deferred deliberately: the portal our customers give their customers is not built
by this ticket. What this ticket owes is that building it later requires no
second implementation of what it does build.

## 3. The vocabulary is Business

The tenant is a **Business** everywhere a person can read it: the switcher, the
account surface, the admin console, error copy, help text.

It is not a brand and not a workspace. *Brand* names why two are separate but
reads wrong next to what one actually holds — a brand does not have a calendar,
and "your brand's customers" is a phrase this product would have to say on every
screen. *Workspace* claims nothing, which is the wrong claim for software whose
pitch is that it runs your business.

**The schema keeps `tenant_id`.** This is a label decision, not a rename:
`tenant_id` appears in R2 keys and in every store handle, and renaming a column
to match a word buys a migration for nothing. The rule is that `tenant` is
internal vocabulary and never reaches a screen — [[DOC-40]] §2 states the pairing
and this ticket applies it.

## Acceptance

- The endpoint returns exactly the caller's live-membership businesses; a
  cross-account request is indistinguishable from a nonexistent one.
- Lapsed businesses appear, marked, with a reason.
- The account surface renders against the platform business through the site
  pipeline, and no billing or plan view exists as a builder-only route.
- Adding a business from the account surface goes through `provisionBusiness`.
- No user-visible string in the builder, the account surface or the admin console
  says "tenant"; `tenant_id` is untouched in the schema.

## Splitting

Item 2 is the large one and the only one carrying an open decision. If the
portal reading is confirmed, item 2 is worth its own ticket and this one keeps 1
and 3; if it is rejected, that rejection needs recording against [[DOC-40]] §2.1
because it costs the leverage argument that section is built on. Either way the
decision comes first — it is cheap now and expensive after the surface exists.


---

## Decisions — 2026-09-03

The three questions §2 and *Splitting* hold open are answered here. Everything
above stands as written; this section says which way each went and what that
makes buildable now.

### D1. The portal reading is CONFIRMED

The account surface is the customer portal of the 1st Contact site, not a
builder page. [[DOC-40]] §2.1's leverage argument holds, and the named failure
mode — the bespoke admin billing page — is the thing this decision refuses.

**But confirming the reading is not building the portal, and this ticket does
not build it.** `apps/public-site` has no identity, no Access gate and no
session; a portal rendered through the site pipeline against the platform
business needs all three, plus a surface for plan and invoices when there are no
invoices to show and one plan to show them under ([[DOC-40]] §5 defers payment).
That is its own ticket, and *Splitting* is taken: this ticket keeps 1 and 3.

What the decision binds NOW is a prohibition, and it is testable: **no plan,
billing or invoice view exists as a builder route.** The avatar surface
([[REQ-179]]) stays what its own doc comment says it is — who is signed in and
which businesses that identity reaches — and grows no portal capability. It is
chrome that will link out; it is not the surface.

### D2. There is NO self-serve "add a business"

Reversing the fourth bullet of §2. We are pre-billing and pre-proper access
control, so a customer-facing control that mints a live `pro` grant is an
unbounded free-plan mint ([[DOC-40]] §9 item 4). **The operator adds businesses.**
No button, no customer-reachable route.

The API question §2 raised — `POST /api/businesses` on `provisionBusiness` — is
answered: not as a self-serve endpoint. What lands instead is the operator's
path, which may be entirely manual:

- `POST /api/admin/businesses` — refused to anyone whose admission does not
  carry `platform_admin` ([[DOC-40]] §6), and refused with the same single
  message every other refusal uses. It names an existing account by email and
  calls [[REQ-178]]'s `provisionBusiness` and nothing else.
- Driven by hand by the operator against their own logged-in session. There is
  no console around it: [[REQ-170]] owns the admin console and this is the
  contract it will call rather than reimplement.
- **Creating an account already provisions its first business.**
  `provisionInvite` calls `provisionBusiness`, so the account-creation path and
  the add-a-business path write identically-shaped businesses. That property is
  asserted rather than assumed.

### D3. A BUSINESS AND ITS TENANT ARE ONE OPERATION

The model's load-bearing identity is *business == tenant*, so the two must be
incapable of coming into existence apart. They already are:
`provisionBusiness` is the only path that creates a business, and it writes the
`tenants` row, the `owner` membership, the grant and the starter site together.

The one place a `tenants` row appears without a business is `storeFor`'s
self-heal, which registers an unknown tenant rather than 503ing a fresh
deployment. It cannot mint an orphan for a customer: an admission-derived scope
came out of a query that joins `tenants`, so the row already exists by the time
`storeFor` sees it, and the self-heal is reachable only for the `TENANT_ID`
platform business on the dev-open path. **That reachability is the invariant,
and it is asserted.**

### D4. The lapse reason is what item 1 still owes

[[REQ-179]] landed `GET /api/businesses` — the set, the account, lapsed members
marked, not an oracle, uncacheable. What §1 asks for and it does not yet carry is
*why* a lapsed business lapsed.

So an unselectable business reports a **lapse**: `expired` (a grant covered it
and its end has passed — with the date, which its owner is owed), `revoked` (a
grant was withdrawn), `not_yet` (a grant is written and has not started), or
`never_granted` (no grant was ever made). A selectable business reports none —
the lapse is present exactly when `selectable` is false, so the two cannot
disagree.

**IT SAYS NOTHING ABOUT ANYBODY ELSE.** The caller holds a live membership on
every business in the answer, so the reason is a fact about their own business;
it is owed to them, and the answer for a business they do not hold is unchanged,
which is that it is not in the list at all.

**IT REACHES THE PERSON.** A reason computed and not rendered is not a reason, so
the account surface states it in words beside the business it belongs to. The
switcher keeps the short suffix — an `<option>` is a label and cannot carry a
sentence.

### D5. Where the vocabulary rule bites

Users see **the web app and the site**, so that is where §3's rule is enforced:
no string literal in the builder client or in `public-site` says "tenant".

Exempt, and the exemption is a rule rather than a list: **SQL**, and
**deployment vocabulary** — a string naming `TENANT_ID` or `wrangler.toml` is
addressed to whoever edits the deployment, and is reachable only when the app has
failed to start. Renaming a configuration variable to match a word on a screen is
the migration §3 declines to buy, in the one place the word is the operator's own.

The rule is enforced by a guard rather than by an audit, because the audit passes
today: every "tenant" in the two apps is a comment or a query. The failure this
protects against is the next one, written by someone who did not read §3.

## Acceptance — as decided

- An unselectable business carries a lapse saying why, and a selectable one
  carries none.
- An expired lapse carries the date access ended.
- The account surface states each lapsed business's reason in words.
- Adding a business is refused to a caller without `platform_admin`, and goes
  through `provisionBusiness` when it is allowed.
- Creating an account provisions its first business through that same function.
- A business cannot be created without its tenant; the only path that registers a
  tenant alone is unreachable for an admission-derived scope.
- No string literal in the builder client or the public site says "tenant",
  excepting SQL and strings naming `TENANT_ID` or `wrangler.toml`.
- No plan, billing or invoice view exists as a builder route.
- `tenant_id` is untouched in the schema.
