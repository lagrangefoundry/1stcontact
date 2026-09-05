---
uid: request-86e78464
id: REQ-183
type: request
title: 'The customer portal: the account''s own surface, rendered by the site pipeline'
created_by: xgd
created_at: '2026-09-04T01:41:53.923078+00:00'
updated_at: '2026-09-05T17:09:55.243104+00:00'
completed_at: null
last_field_updated: story_points
status: free_coded
fields:
  priority: medium
  story_points: 5
  auto_merge_back: true
  needs_review: false
  depends_on:
  - REQ-178
  - REQ-179
  chat_comment: comment-415d6245
  commits:
  - working_sha: 03f961b34c770ab2f83733075f3821b23eb60170
    reconcile_sha: null
    main_sha: null
  - working_sha: 569f5b9553e0570a83ba5d35398398c64d7d4d65
    reconcile_sha: null
    main_sha: null
  version: 0.2.72
---

# The customer portal: the account's own surface, rendered by the site pipeline

## Where this comes from

[[REQ-180]] D1 confirmed the reading and deliberately did not build it. This is
the ticket it split out.

[[DOC-40]] §2.1: the surface showing an account its plan, its invoices and its
details is **the customer portal of the 1st Contact site**, rendered by the code
that will render the portal our customers give their own customers. It appears in
the builder chrome because that is where a person looks for it, not because it
belongs to the builder.

What [[REQ-180]] owed was that building this later requires **no second
implementation** of what it did build. It landed the prohibition — no plan,
billing or invoice view exists as a builder route, asserted — and the avatar
surface ([[REQ-179]]) is bounded to facts about the session: who is signed in,
and which businesses that identity reaches. Nothing has been built here twice.
This ticket has to keep it that way.

## 1. The thing being avoided

[[DOC-40]] §2.1 rule 1 names the failure mode: **the bespoke admin billing
page**. It is the same page a customer needs; building it once for us and once
for them forfeits the whole of §2.1, and the second one gets built by someone
reverse-engineering what the first one decided.

So the test for every decision in this ticket is not "does it work for 1st
Contact" but **"is this the thing a customer's customer will use"**. Anything
that is only ever true of 1st Contact's own account belongs in the admin console
([[REQ-170]]) instead. That line is drawn in §6.

## 2. What it is made of, and why none of it is new

The portal is **a site page, plus a behaviour module, plus an authenticated
API**. That is the shape `contact-form` already has (REQ-93, [[DOC-25]]/[[DOC-26]]):
the fold refuses to synthesize raw controls, a vetted behaviour module binds to a
slot, and the module talks to an endpoint. A portal is that same arrangement with
a different module and an endpoint that requires an identity.

This matters because it is what makes "rendered through the site pipeline" a
buildable sentence rather than an aspiration. The portal is authored as pages in
the platform business's site, edited in the builder like any other page, and
rendered by the renderer that renders everything else. **No new rendering path,
no `apps/control-app` template, no third store adapter.** If this ticket finds
itself adding a rendering path, the reading in §1 has been abandoned and that
needs recording against [[DOC-40]] §2.1 rather than absorbing quietly.

## 3. The decision this ticket has to make first: which origin

**This is the open question, and it should be settled before any of it is
built.** The portal needs a logged-in identity, and the two origins have opposite
properties:

| | `app.1stcontact.io` (control-app) | `1stcontact.io` (public-site) |
| --- | --- | --- |
| identity | Cloudflare Access, verified email, `admit` ([[DOC-40]] §3) | none |
| methods | full | `GET`/`HEAD` only |
| caching | `no-store` on every API answer | edge cache, 60s |
| writes | yes | none — the Worker is read-only by design |

`apps/public-site` is 448 lines whose every property is *public, cacheable,
GET-only*. A per-visitor authenticated surface is the negation of all three, and
the caching one is not a configuration detail: one cached copy of a portal page
is everybody's answer.

**The recommendation is `app.1stcontact.io`, rendered through the site
pipeline.** That is not a retreat to a builder page — the pages are the platform
business's site content and the renderer is the shared one; only the origin
serving them is the already-authenticated one. It buys the identity layer for
free, and [[DOC-40]] §3 already says the credential layer is the rented half:
`users`, `memberships` and `entitlements` do not change when the magic link
replaces Access, so a portal built against `admit` moves to a customer's own
origin without being rewritten. That is precisely the "no second implementation"
property this ticket owes.

**The alternative** — authentication on `public-site` now — buys the level-2
origin sooner and costs the whole of [[DOC-40]] §3's later branch up front:
`auth_tokens`, `sessions`, an email provider, a verified sending domain. It also
makes the read-only Worker a writing one. It is the right eventual answer and the
wrong first step.

If the recommendation is taken, **it must be written down that the origin is
provisional and the pages are not** — otherwise the next hand reads
`app.1stcontact.io` as "the portal is a builder feature after all" and §1's
failure mode arrives by a different door.

## 4. v1 is one page with one button: **Delete account**

**The portal starts with exactly one capability, and it is the one that
disappears if it is scheduled behind the others.**

Everything else an account surface eventually shows — plan, charges, details — is
a convenience whose absence is an inconvenience. This one is different in kind:
[[DOC-37]] is a whole document about it, its absence is a compliance gap rather
than a missing feature, and it is the only portal capability with a deadline
attached that is not ours to set.

It is also the only one that can be built now. Charges need the `subscriptions`
table [[DOC-40]] §5 defers; plan is thin but real; deletion needs **no new data at
all**, because the thing it operates on is the account that already exists. So
the capability that is most owed is also the one with no dependency, which is an
unusually cheap ordering to get right.

And it is the smallest end-to-end slice that proves the whole of §2 and §3. One
page, one control, reached from the avatar, rendered by the site pipeline,
authorised by `admit`. If the pipeline reading is wrong, this is where it fails —
cheaply, before a surface exists that would have to be rebuilt.

[[DOC-37]] §8 makes the same argument from the other end: *registry at limb one*.
The surface arriving before the mechanism means the mechanism has somewhere to
land, rather than a retrofit across five limbs later.

### 4.1 The button is SHOWN and the deletion is NOT BUILT

**Implementing deletion is out of scope.** [[DOC-37]] is the design and it is a
substantial piece of work in its own right: the store registry (§7), the
identity/record separation (§6.3), crypto-shredding for free text and
append-only history (§4.1, §6.3), the suppression hash, the billing redaction. It
is not something to do as the tail of a portal ticket, and this ticket must not
pretend otherwise.

What lands is the surface: the page, the control, and the copy.

### 4.2 …which makes [[DOC-37]] §6.2 a constraint on this ticket, not a later one

> *"delete all my data" is not a promise we can keep, and offering it is worse
> than offering the accurate thing.*

A button that says **Delete account** and does not delete the account is exactly
the inaccurate promise §6.2 forbids, and shipping one would be worse than
shipping no button — it converts a missing feature into a lie, and it is a lie
about the one subject where being caught in one is unrecoverable.

So *"it can show one"* needs a shape, and this is the decision the ticket carries.
Three candidates, and a recommendation:

1. **Present and disabled, with a sentence.** Honest, and reads as unfinished
   software.
2. **Present and live, opening the explanation, ending in "get in touch".** The
   control works; what it starts is a conversation rather than a job. The
   explanation is the part [[DOC-37]] §6.1 says must exist anyway — what is
   destroyed, what survives, and why each survivor serves the person rather than
   us — so writing it now is not throwaway work, it is the copy the built version
   will use unchanged.
3. **Present and live, recording a request.** A row an operator actions. It is
   option 2 plus a table, and the table is a commitment to a queue nobody has
   agreed to staff.

**Recommendation: option 2.** It keeps the promise accurate — the button does
exactly what it says, and what it says is true today — and the explanation is the
durable half. It also puts the honest sentence in front of the operator early,
which is when the retention exceptions in §6.1 are still cheap to argue about.

Whichever is chosen, the acceptance is that **no copy on this surface claims
anything the system does not do**.

## 5. What v1 does NOT show

Named, because each of these is a thing a reasonable hand would add while they
were in there.

- **Plan and charges.** Deferred, not forgotten — see §7. Charges have no data
  behind them at all ([[DOC-40]] §5).
- **Changing details.** `users.display_name` and `tenants.name` are currently
  changeable by nobody, which is a real gap and a different ticket.
- **Adding a business.** [[REQ-180]] D2 closed this: pre-billing,
  `provisionBusiness` writes a live `pro` grant, so a customer-reachable route
  onto it is an unbounded free-plan mint. It is an operator action on
  `POST /api/admin/businesses` until billing exists. A portal that grows an "add a
  business" button has re-opened a closed decision.
- **Export.** [[DOC-37]] §9 asks whether erasure and portability should arrive
  together. They usually do, and the answer is not obviously "yes" here — see §8.

## 6. The line against the admin console

[[REQ-170]] is the operator's tool: every account, every grant, the invite that
provisions one. This is one account's view of itself. The line is worth drawing
once, here, because both surfaces read the same three tables and the tempting
shortcut is one surface with a privilege check in it.

- **Scope.** The portal answers only about the caller's own account and the
  businesses they hold a live membership on. It reads `admit`'s answer and never
  queries by id — which is what stops it becoming the existence oracle
  `identity.ts` and `scope.ts` both refuse to be.
- **Authority.** The portal *reads* and never grants. Creating and revoking
  entitlements is [[REQ-170]]'s, because a surface that can grant itself access is
  not a portal. Deletion is the one act a portal is entitled to ask for, and even
  that is a request about itself and about nothing else.
- **Population.** The admin console's left list is accounts. The portal has no
  list of accounts, in the same way a customer's portal has no list of that
  customer's other customers.

## 7. What is deferred, and what is owed to it

The portal our customers give **their** customers is not built here either. What
this ticket owes is the same thing [[REQ-180]] owed it: building that later must
require no second implementation. Concretely —

- the pages are site content in a business's site, not a route table;
- the API is authorised by an identity resolved from `memberships`, not by
  "is this the platform business";
- nothing in it reads `TENANT_ID` ([[REQ-168]] leaves that variable two readers,
  and a portal is not the third).

If those three hold, the level-2 portal is this portal with a different
credential layer and a different tenant, which is the whole claim of
[[DOC-40]] §2.1 — and [[DOC-37]] §5 already assumes it, since an end customer's
*"delete my data"* link necessarily points at our infrastructure.

## Acceptance

- The origin decision of §3 is recorded before the surface exists, and the losing
  option is recorded as rejected rather than silently not taken.
- The portal's pages are rendered by the shared site pipeline against the
  platform business — no second renderer, no builder-route template.
- It is reached from the avatar ([[REQ-179]]), which links out rather than owning
  the surface; the avatar dialog stays bounded to facts about the session.
- The surface carries a **Delete account** control and the [[DOC-37]] §6.1
  explanation of what erasure destroys, what it retains, and why each survivor
  serves the person.
- **No copy on the surface claims anything the system does not do** ([[DOC-37]]
  §6.2). Whatever the control does when pressed, what it says is what happens.
- No deletion mechanism is built: no store registry, no sweep, no crypto-shred.
  A UAT asserts the account still exists afterwards, so a later hand cannot read
  the button as evidence the machinery is there.
- The portal reads and grants nothing; it answers only about the caller's own
  account, and a request naming another account's business is indistinguishable
  from one naming a business that does not exist.
- There is no way to add a business from the portal, and no plan, charges or
  details surface.
- No user-visible string says "tenant" ([[REQ-180]] §3's guard covers the two
  apps; this must not introduce a third surface outside it).

## 8. Open questions

1. **§3's origin.** The one that should be answered first.
2. **Which of §4.2's three shapes** the shown button takes. Recommendation is
   option 2; the acceptance holds for any of them.
3. **Does "delete account" mean the account or its businesses?** [[DOC-40]] §2
   separates them and an account may hold several. [[DOC-37]] §4 is written about
   *tenant* deletion, which is the business; the portal control is on the
   **account**, which is the payer. An account holding three businesses pressing
   one button is a question [[DOC-37]] does not answer, and the copy cannot be
   written until it is.
4. **Export before delete** ([[DOC-37]] §9). Portability usually ships with
   erasure. Here the export is a site definition and a customer list, which is a
   larger thing than the button — so "together" may be the wrong default for
   once, and that is worth deciding rather than assuming.
5. **Is the 1st Contact marketing site a prerequisite?** `public-site` currently
   serves a placeholder at the apex, held back "until the marketing site exists".
   A portal that is a page of a site nobody has built is reachable but has no
   surroundings — which may be fine, and should be a decision.

---

## Amendment 2026-09-04: what [[DOC-42]] binds on this ticket

[[DOC-42]] is the model written out of the [[REQ-170]] discussion. It confirms
this ticket's §1 reading and adds one dependency that has to be settled before
the surface is built, plus two corrections of detail. §8's open questions are
untouched except where noted.

### B1. The Portal is what membership IS. This is a dependency, and it blocks §4

[[DOC-42]] §5: a member reaches their Portal by virtue of being a member. There
is no free automatic entitlement standing behind it, and there must not be — a
constant modelled as data can go missing, and the failure mode is a person who
can log in but cannot reach the surface where they would fix anything.

**Today they cannot.** `admit` refuses when no business is selectable
(`identity.ts:542`), so an account whose grants have all lapsed is turned away at
the door. That puts §4's whole argument in jeopardy:

- the **Delete account** control — the one capability §4 says disappears if it is
  scheduled behind the others, and the one [[DOC-37]] attaches a deadline to that
  is not ours to set — is unreachable for exactly the population most likely to
  want it
- so is the payment history, and so is the page where they would pay, which is
  the only act that would restore the grant

A compliance surface gated on being paid up is worse than a missing one, for the
same reason §4.2 gives about the button's copy: it converts a missing feature
into a false position, on the one subject where being caught in one is
unrecoverable.

**[[REQ-178]]'s reopen is the fix** — membership admits, `no_entitlement` becomes
a state inside an admitted session — and [[REQ-179]]'s reopen keeps the avatar
and its link out present when nothing is selectable. **This ticket should not be
implemented before both land**, because the surface it builds would be
unreachable for the case that justifies it.

### B2. Terms of service can gate this surface too, and that needs a decision

[[REQ-169]] blocks **every** route until the terms are accepted — *"no route can
be reached by a session that has not accepted"*, assets and API 403 alike. That
is right for the builder and it is the correct direction for a gate to fail in.

Applied to this surface it means a **re-versioned** ToS blocks an existing member
from their own delete button until they accept the new terms — conditioning a
data-rights request on accepting a contract. Unlike B1 it is not a dead end: the
interstitial is served and accepting clears it. But whether erasure may sit
behind it at all is a question for [[DOC-37]], and the copy in §4.2 cannot be
written without an answer.

Added to §8 as a sixth open question rather than decided here.

### B3. §6's line against the admin console holds, and here is the sharper reason

§6 draws the line on scope, authority and population, and all three stand.
[[DOC-42]] §7 supplies what §6 states as a preference: the controls only 1st
Contact sees are **its product-fulfilment actions** — provisioning a business is
us filling an order — rather than administrative privilege. That is why "one
surface with a privilege check in it" is the wrong shortcut: the check is not
about privilege.

Two details in §6 to carry forward rather than repeat as written:

- *"the admin console's left list is accounts"* — true of the 1st Contact
  business specifically. [[DOC-42]] §7: the tab lists **the people of whichever
  business you are in**, and ours happen to be accounts. [[REQ-170]] is retitled
  accordingly and is no longer "the admin console".
- *"the portal reads and never grants"* stands unchanged and is the load-bearing
  half.

### B4. §8 question 3 gains a constraint

*Does "delete account" mean the account or its businesses?* — still open, but
[[DOC-42]] §6 narrows it: **"account" is relative to the business**, as "level"
is. Bob is an account of Alice's Plumbing. So the answer cannot be phrased in
terms of "the platform's account holders" without becoming platform-only
vocabulary, and whatever is decided has to read correctly one level down, where
the account has no businesses at all.


---

## Implementation decisions — 2026-09-04

§8's questions are answered here rather than left open, because the acceptance
requires the origin decision to be recorded *before* the surface exists and the
copy in §4.2 cannot be written until Q3 is settled. Each rejected option is
recorded as rejected rather than silently not taken.

### D1. The origin is `app.1stcontact.io`. It is provisional; the pages are not

§3's recommendation, taken. The control-app origin already carries the identity
layer — Cloudflare Access, a verified email, `admit` — so a portal built against
`admit` costs nothing to reach and moves to a customer's own origin when
[[DOC-40]] §3's later branch replaces the credential layer, because `users`,
`memberships` and `entitlements` do not change when it does.

**`1stcontact.io` (public-site) is REJECTED for v1**, and the reason is not
preference. That Worker is `GET`/`HEAD` only, edge-cached for 60s, and
authenticates nobody; one cached copy of a portal page is everybody's answer.
Authenticating there means building `auth_tokens`, `sessions`, an email provider
and a verified sending domain up front, and turning a deliberately read-only
Worker into a writing one. It is the right eventual answer and the wrong first
step.

**What is provisional is the origin only.** The pages are site content and the
renderer is the shared one; the next hand must not read `app.1stcontact.io` as
"the portal turned out to be a builder feature after all" — that is §1's failure
mode arriving by a different door.

### D2. The host business is the one the account is an account OF

The portal is hosted by the business whose `users` table this account's row
lives in — `admission.user.tenant_id`, read off the admission. Never
`env.TENANT_ID`: §7's third constraint holds, and [[REQ-168]] leaves that
variable exactly two readers.

This is [[DOC-42]] §6's relativity made operational. Alice is an account of 1st
Contact, so her portal is hosted by 1st Contact; Bob is an account of Alice's
Plumbing, so his is hosted by Alice's Plumbing. **The same expression answers
both**, which is the "no second implementation" property this ticket owes. It is
also *not* the business the caller is operating: Alice's scope is Alice's
Plumbing and her portal is still 1st Contact's, so the portal deliberately does
not consult `resolveScope`.

Consequence: the portal answers with **no scope at all**, so an account whose
every grant has lapsed reaches it. That is B1's requirement — the population most
likely to want the delete button is exactly the one a scoped route would refuse.

### D3. The pages are a site under the reserved slug `portal` in the host business's store

Served at `/account` on the control-app origin, rendered by the **existing
request-time renderer** (`PreviewRenderer` -> `renderSiteFiles`) — the same one
`/preview/<slug>/<channel>/…` uses. No second renderer, no `apps/control-app`
template, no third store adapter.

**When the host business's store holds no `portal` site, the same renderer
renders a shipped default definition** through the in-memory `SiteStore`
adapter. One renderer, two sources — and the fallback is what makes the portal
reachable for a business provisioned before this ticket existed, without a
migration that a D1+R2 store cannot express. The moment anyone writes a `portal`
site into a business, that site is what serves, and it is ordinary editable site
content.

Seeding `portal` at provisioning time — so every new business owns its portal as
content from the first day — is the natural next step and is **deliberately not
done here**: it changes `provisionBusiness`, which two other tickets' UATs pin.

### D4. The authenticated API already exists: `/api/businesses`

§2 calls for "an endpoint that requires an identity". [[REQ-179]] built one, and
it answers exactly what the portal needs — the caller's own account, and the
businesses that identity reaches, each marked selectable or lapsed with a reason.
**No second endpoint is added.** Building one would be the same page's worth of
authorisation logic written twice, which is §1's failure mode at endpoint scale.

The page is therefore identical for every visitor and the per-visitor facts
arrive by `fetch` — which is what keeps the page site content rather than a
per-request template, and what lets the same page be served from a cacheable
origin when the portal moves to level 2.

### D5. §4.2's shape is option 2: the control is live and reveals the explanation

Pressing **Delete account** opens the [[DOC-37]] §6.1 explanation — what erasure
destroys, what survives, and why each survivor serves the person — ending in a
way to get in touch. Nothing is deleted and no request is recorded (option 3's
table is a commitment to a queue nobody has agreed to staff; option 1 reads as
unfinished software).

**The no-JavaScript baseline is the explanation shown in full.** The page renders
it visible and the vetted client collapses it behind the control; so a visitor
with no scripting sees more, never a control that claims something it cannot do.

### D6. §8 Q3 — the copy names what would go, computed from the caller's own facts

"Delete account" is a request about the account, and [[DOC-42]] §6 makes an
account relative to the business it is an account of. So the honest sentence is
not a fixed claim about businesses: it is *this ends your relationship with this
business, and here is what that relationship consists of* — and where the account
operates businesses, the explanation **lists them by name**, from the same
`/api/businesses` payload.

That reads correctly one level down, where an account operates nothing and the
sentence about businesses simply does not appear — which is the constraint B4
adds. It also means the copy cannot drift out of date, because it is not copy: it
is the account's own facts, rendered.

### D7. §8 Q4 — export is not shown

[[DOC-37]] §9 asks whether portability ships with erasure. Here the export is a
site definition and a customer list, which is a larger thing than the button, and
"together" would make the compliance surface wait on it. Deferred, deliberately,
and named in §5's list of what v1 does not show.

### D8. §8 Q5 — the marketing site is not a prerequisite

The portal is served on `app.1stcontact.io`, which is behind Access and has never
been the marketing surface. `public-site`'s apex placeholder is untouched.

### D9. §8 Q6 / B2 — the terms gate is left exactly as [[REQ-169]] built it

Not weakened here. A gate that fails closed for every route is the correct
direction, and re-versioned terms are recoverable in one click, unlike B1's dead
end. **Whether a data-rights request may sit behind an unaccepted contract at all
remains open** and belongs to [[DOC-37]]; this ticket records it rather than
deciding it, and changes no behaviour either way.

### D10. The avatar links out, in a new tab

The dialog gains one link and nothing else — its bound stays "facts about the
session" ([[REQ-179]], [[REQ-180]]). A new tab because the portal is a *site
page* and not a builder surface: leaving the builder should look like leaving it,
and the builder's state should survive the visit.

## What this lands

- `account-portal`, a vetted behaviour module in the framework catalog. It paints
  nothing: the portal's whole presentation is L1 in its slots, the account line
  and the business list are invariant elements its client fills from the endpoint,
  and the delete control is an L1 `control` node. Same contract as `contact-form`.
- The shipped default portal site definition, carrying the [[DOC-37]] §6.1 copy.
- `GET /account` (and its sub-resources) on the control-app, rendered through the
  request-time renderer against the host business's store, falling back to the
  shipped default.
- The avatar's link out.

## What this does not land

- No deletion of anything: no store registry, no sweep, no crypto-shred, no
  suppression hash, no billing redaction. [[DOC-37]] is that work and it is not
  the tail of a portal ticket.
- No plan, no charges, no details editing, no export, no way to add a business.
- No new endpoint, no new renderer, no new store adapter, and no reader of
  `TENANT_ID`.


## Behaviour that landed as a consequence, and is therefore specified

Not asked for directly. Each is forced by a decision above, and each is pinned by
a UAT, so each is named here rather than left for reconciliation to discover.

- **The portal is `GET`/`HEAD` only and answers `405` to anything else.** §6 says
  the portal reads and grants nothing; a route with a write verb on it is a place
  for a later hand to hang one. The refusal is the contract, not an omission.
- **It answers `404` when there is neither an admission nor a scope.** A host with
  no identity behind it names no business whose portal this could be, and
  inventing one would render somebody else's page.
- **The portal's own sub-resources are served under its path** — `/account/theme.css`,
  `/account/capabilities.js`. That is the render's document-relative output
  ([[REQ-109]]) arriving through the ordinary channel, and it is what lets the
  same site move to another origin unchanged.
- **A business the caller does not hold and a business that does not exist give
  byte-identical answers.** The `/b/<id>/` prefix reaches the portal like any
  other route, so §6's scope line has to hold there too, or the surface is an
  existence oracle over every business in the system.
- **The erasure explanation names lapsed businesses as well as live ones.** They
  are still the person's, they still hold their site and their customers, and the
  population most likely to be reading this page is exactly the one whose grants
  have lapsed — so omitting them would make the surface understate what erasure
  destroys, which is the one direction §4.2 forbids.
- **An account with no display name is named by its verified email.** That is the
  identity the login established ([[DOC-40]] §2), so it is always true, where a
  display name is a label somebody may never have set. A blank line where a
  person's name goes reads as a failure to load.
- **A refused endpoint costs the facts and nothing else.** The explanation is
  copy and is unaffected; the surface says the details could not be loaded rather
  than showing an empty line. This is D5's "only ever subtracts" at the level of
  a single request.
- **The renderer's store parameter widened from the tenant-scoped handle to the
  `SiteStore` port.** The fallback portal is an in-memory store, and the whole
  point of D3 is that it and an authored portal reach the renderer through one
  interface. The narrower type was never used for anything — `PreviewRenderer`
  already took the port — so this removes an annotation rather than a check.
- **The behaviour module is subject to the [[REQ-180]] §3 vocabulary rule even
  though it lives in the framework.** The guard walks the two apps; this surface
  is user-facing and outside them, so the rule follows it there rather than the
  surface escaping the rule.
- **The portal's `site.json` is derived from the scaffolder's** rather than
  written out, so its theme and nav shape are the ones every new site starts with
  and cannot drift from them.