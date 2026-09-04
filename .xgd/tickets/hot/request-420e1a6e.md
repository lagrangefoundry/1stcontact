---
uid: request-420e1a6e
id: REQ-170
type: request
title: 'The User tab: the people of a business, their membership and their grants'
created_by: xgd
created_at: '2026-09-01T00:51:42.772184+00:00'
updated_at: '2026-09-04T23:58:14.207595+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: high
  story_points: 3
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-a40ed226
  depends_on:
  - REQ-184
---

# The admin console: users, entitlements, and the invite that provisions an account

## The gap

[[REQ-167]] puts users, memberships and entitlements in D1 and defines the invite
that provisions an account. Nothing can operate any of it. Without this ticket
onboarding is `wrangler d1 execute` against a production database, which is
survivable for three people and not for thirty.

This is the operator's tool. It is what makes the alpha runnable.

## The console

A `/admin` route in `apps/control-app`, gated by a **`PLATFORM_ADMINS` env var**
listing email addresses. [[DOC-40]] §6: an env var has no bootstrapping problem —
it works before any row exists and cannot lock its holder out of the system that
would grant them the flag. The `users.platform_admin` column is also honoured,
so the two agree; the env var is the seed.

The gate is checked in the Worker, after Access verification, before any admin
asset is served. Same rule as [[REQ-169]] and for the same reason.

## Two panes, from components that exist

`webui/split` beneath `webui/list-detail`, exactly as [[REQ-161]] uses them for
the Library — **users on the left, detail on the right.**

The detail pane is `mountFields` over the user's record. Initially: created,
modified, email, and when the terms were accepted. `mountFields` is generic and
origin-neutral by construction — it takes field descriptors and values and never
reaches for a store — so this is a descriptor list and a save callback, not a
new editing vocabulary.

**Dependency on the asset build.** `webui-list-detail` is not currently in
`apps/control-app/dist-assets/webui` — only `chat`, `fields`, `markdown`,
`shell` and `split` are. [[REQ-161]] adds it as part of the Library tab. If this
ticket lands first it owns that addition to `1c assets`; if [[REQ-161]] lands
first it is already done. A UAT asserts the built assets contain it either way,
so neither ordering leaves it out.

## Entitlements are editable

A second list, or a section of the user's detail, showing the account's grants:
`plan`, `source`, `status`, `starts_at`, `ends_at`, `note`.

The operator can **create a date-bounded grant** (`plan='pro'`,
`source='admin_grant'`) and **revoke** one. Revocation sets `revoked_at` and
`status='revoked'` rather than deleting the row — the history of what access was
given is the thing being kept.

Grants are displayed as a **list**, not as a single current value. An account
accumulates them ([[DOC-40]] §5) and a UI that shows one would misrepresent an
account holding two the moment billing lands.

## The invite

One action, taking an email address and an end date. It calls [[REQ-167]]'s
provisioning function — user, account, membership, entitlement — and creates the
starter site.

### The starter site

**A single blank page reading "Your 1stcontact site".** Not a template, not an
import. The point is that a person who logs in for the first time finds
something to edit rather than an empty tenant and a create-site flow that does
not exist yet.

A UAT asserts a freshly invited account has exactly one site and that it renders.

## Not in scope

Support-access grants, self-service anything, removing a business, and the
payments funnel that an expired grant should eventually lead to.

**Editing memberships was here and is not any more** — see the 2026-09-04
revision. `0005_operator_membership.sql:14` already assigns it to this ticket,
and [[DOC-42]] §4 makes it the primary relation the tab manages.

**Removing a business is new to this list.** It sounds like the other half of
provisioning one and is not: [[DOC-37]] is a whole document about erasure, and
[[REQ-183]] §4.1 deliberately ships a delete control with no delete mechanism
behind it.


---

## Revision: accounts and businesses are two levels ([[DOC-40]] §2)

[[DOC-40]] §2 splits the account from the business after this ticket was drafted.
The console's shape is unaffected — a `/admin` route, `PLATFORM_ADMINS`,
`webui/split` under `webui/list-detail`, `mountFields` on the right. What changes
is what the rows mean.

**The invite provisions an account and its first business.** [[DOC-40]] §4's
table now reads: a `users` row in the 1st Contact business (the account), a `tenants`
row (their first business), a membership, an entitlement, one site. The console
calls [[REQ-178]]'s `provisionBusiness` for the business half rather than writing
those rows itself, so the admin path and the later self-serve path cannot
provision differently-shaped businesses.

**The left list is accounts; businesses are the second dimension.** The detail
pane gains the businesses that person may operate — the membership rows — which
is the only place a second business is visible at all.

**Entitlements are edited against a business, not against a person.**
`entitlements.account_id` holds a tenant id ([[DOC-40]] §5), so an account with
three businesses has up to three grants and the editor must say which one it is
changing. "This user's plan" is the mistake this note exists to prevent: it is
unrepresentable, and code written as though it were will silently edit whichever
grant it found first.

**Granting an existing account a further business** is an admin action here as
well as an account-surface action ([[REQ-180]]); both go through the same
function.

---

## Revision — 2026-09-04: this is the User tab, and it is uniform ([[DOC-42]])

[[DOC-42]] was written out of the discussion that produced this revision. It is
the model; this section is what the model changes here. The earlier revision
above stands except where noted.

### The surface is a tab, not `/admin`

**The tab shows the people of the business you are in.** Not "every account" —
the people of *this* business, read through the tenant-scoped handle. For the
1st Contact business those people are our customers; for a customer's business
they are that customer's customers ([[DOC-42]] §1, §7).

`/admin` is dropped as a route and as a name. It names the privileged additions
rather than the surface, and that naming is precisely what would fix the
platform-only reading in place — [[DOC-40]] §2.1 rule 1's failure mode arriving
through the URL bar. **It is the User tab**, reached in the app like the Library,
scoped by the current business.

That the left list happens to be accounts is a property of *our* business, not
the definition of the tab.

### Two orthogonal columns per person, and membership is the primary one

[[DOC-42]] §4: membership means *this person may log in to this business*, and
nothing else. Entitlement means *this account has been granted access to some
thing*. Neither implies the other, and the code already splits them —
`businessesFor` joins `memberships` (`identity.ts:621`) while
`selectable: entitlement !== null` (`identity.ts:665`).

So the tab manages both, and **membership is what "manage users' site access"
means**. Its removal from *Not in scope* above is this revision's doing.

The detail pane's `mountFields` descriptors therefore carry the person's record,
their membership on this business, and their grants — three things, not one
blended "access" field.

### The entitlement editor must not assume its subject is a business

The earlier revision's *"entitlements are edited against a business, not against
a person"* is true of what exists today and must not be built in as though it
were the model. [[DOC-42]] §6: the subject of a grant is the **account** and the
business is the **object**. Today `entitlements.account_id` holds the object
under the subject's name, which [[DOC-42]] §10.2 records as an amendment owed to
[[DOC-40]] §5.

What this ticket owes is that the editor survives that amendment: it says which
business a grant is about, and it does not encode "the grant *is* the business".
The case that breaks the shortcut is a customer's paywall — two members of one
business, one paying and one not — which is unrepresentable if the grant is the
business.

### The list is the CRM's population, not a second one

[[DOC-42]] §9: a contact is a `users` row with no authentication fields set, in
the same table, under the same `(tenant_id, email)` unique index
(`0004_identity.sql:61`). The CRM and this tab are two views of one list and
**the invite is the verb that moves someone across**.

A UAT asserts that a person who is both is one row: invite an address that
already exists as a contact and the tab must show the same record, not a second.

### The gate is not the word "admin"

The controls only the 1st Contact operator sees are **1st Contact's
product-fulfilment actions** — provisioning a business is us filling an order.
The gate is two conditions ([[DOC-42]] §7):

1. **you are an owner of this business** — uniform; Alice's Plumbing's owner is
   the owner of theirs
2. **this business's product is businesses** — which is what makes the control
   appear for 1st Contact and nowhere else

Today those two select exactly the set `platform_admin` selects, so nothing has
to change in the schema for this ticket to ship. `PLATFORM_ADMINS` survives as
the break-glass seed [[DOC-40]] §6 argues for, and stops being the model
([[DOC-42]] §10.3).

Two consequences:

- **The asset gate mostly dissolves.** The console section above puts the check
  before any admin asset is served. That was right for a platform-only route and
  is wrong for a generic surface — everyone gets the assets. The gate that
  matters is at the API, which is where [[REQ-180]] already put it
  (`router.ts:964`).
- **The support bypass is NOT this ticket's gate.** `scope.ts:237` lets an
  administrator enter a business they hold no membership on. That is the one
  genuinely special power ([[DOC-42]] §8), [[DOC-40]] §7 parks its general form,
  and borrowing it for an ordinary product control would hide it behind one.

### Provisioning is called, not reimplemented

`POST /api/admin/businesses` already exists — [[REQ-180]] D2 landed it gated on
`platform_admin` at `router.ts:964`, deliberately with no control in the product.
This tab is the control. It calls that endpoint and [[REQ-178]]'s
`provisionBusiness` behind it, and writes none of those rows itself.

### There is no extension framework

The additions are one business's product controls. Alice's Plumbing will have
fulfilment actions too and they will look nothing like these, so a plugin
registry built for the single case we have would be the wrong shape for the
second. The seam is a descriptor list, an action list and a condition — all of
which `mountFields` and `webui/list-detail` already take as parameters.

### Dependencies this ticket makes reachable but does not own

Recorded so they are not discovered from inside the implementation.

- **[[DOC-42]] §10.1 — admission requires an entitlement and should require a
  membership.** `admit` refuses when no business is selectable
  (`identity.ts:542`). This tab is what creates lapsed members, so it is what
  makes the lockout reachable: a lapsed customer cannot reach the portal showing
  their payment history, the page where they would pay, or their delete button.
  A UAT here asserts the tab can *produce* that state; fixing the state is
  another ticket.
- **[[DOC-42]] §10.2 — the entitlement subject column**, per the editor
  constraint above.
- **[[DOC-42]] §10.3 — `users.platform_admin` carries two capabilities.** This
  ticket models the gate correctly without needing the column changed.

### Ordering — one edge recorded, two preferences not

`depends_on` carries **[[REQ-184]]** only. That one is real: this ticket's
entitlement editor adds readers of the column [[REQ-184]] renames, so building it
first means writing them twice.

Two others are ordering preferences and are deliberately **not** recorded as
edges, because they would block readiness for something that is not actually a
blocker:

- **[[REQ-179]]** — both touch the builder shell (its switcher and avatar, this
  ticket's new tab). That is a merge conflict to schedule around, not a
  dependency. If this ticket needs to move sooner, its API half — the routes and
  the membership/entitlement endpoints — touches no shell file and can run
  alongside [[REQ-179]], leaving only the client half to follow it.
- **[[REQ-185]]** — the gate reads more cleanly against `memberships.role` than
  against the flag, but [[DOC-42]] §7's two conditions select exactly the set
  `platform_admin` selects today, so this can ship either way. Landing
  [[REQ-185]] first just means writing the check once.

Work lands on `working`, where [[REQ-178]]'s, [[REQ-179]]'s and [[REQ-180]]'s
free-coded commits already sit, so none of this is waiting on reconciliation.
