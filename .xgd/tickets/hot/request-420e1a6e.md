---
uid: request-420e1a6e
id: REQ-170
type: request
title: 'The User tab: the people of a business, their membership and their grants'
created_by: xgd
created_at: '2026-09-01T00:51:42.772184+00:00'
updated_at: '2026-09-05T17:30:31.467885+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  story_points: 3
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-a40ed226
  depends_on:
  - REQ-184
  commits:
  - working_sha: 5b6befd15c86e1fe7d41b3e3df18fdb6351b3de5
    reconcile_sha: null
    main_sha: null
  version: 0.2.71
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

### Correction 2026-09-04: four relations, not two ([[DOC-42]] §4 as corrected)

The revision above says the detail pane carries *"the person's record, their
membership on this business, and their grants"*, and that membership is the
primary thing the tab manages. **The concepts hold; one of them named the wrong
table.** [[DOC-42]] §4 has been corrected and this follows it.

`memberships` does not mean *may log in*. `provisionInvite` writes a person's
`users` row into the business's tenant (`identity.ts:398`) while
`provisionBusiness` writes their membership on the business they will *run* — so
an account logs in holding no membership on the business it logs in to. The
member check is the `users` row; the membership row is the right to operate.

So the tab's people carry **four** states, and the detail pane shows three
columns rather than two:

| | means | control |
| --- | --- | --- |
| **Contact** | known here — an email or a phone — and may become a member | the invite promotes them |
| **Member** | may log in here | `users.status`, which `admit` refuses as `user_inactive` |
| **Operator** | may run a business — owner, support | `memberships`, per business |
| **Entitled** | granted access to a thing | `entitlements`, per grant |

**Being in the list is the member relation.** There is no separate login toggle
to render beside it; the control is `users.status`, and revoking it is what stops
someone signing in. `memberships.revoked_at` withdraws the right to *run* a
business and deliberately leaves that person's own Portal reachable.

**The operator column is what the earlier revision already described** — *"the
businesses that person may operate — the membership rows — which is the only
place a second business is visible at all."* Viewed from 1st Contact, Alice's row
shows Alice's Plumbing there. That is unchanged and is now correctly named.

**Contacts appear in the list.** A person the business knows and has not invited
is a row with `invited_at` null, and the tab shows them as such — this is the same
population the CRM reads ([[DOC-42]] §9), and the invite is the transition. A tab
that listed only invited people would be a second population, which is the thing
that must not exist.

#### Two schema gaps this ticket does not close

Both are recorded in [[DOC-42]] §4.1 and neither blocks this tab, because every
person in the 1st Contact business has an email and was invited.

- **A phone-only contact is unrepresentable.** `users.email` is `NOT NULL` and
  identity is the `(tenant_id, email)` index; there is no `phone` column. This
  tab must not assume an email is present in a way that would need unpicking, but
  it cannot fix the schema either.
- **Nothing enforces contact versus member.** `invited_at` is the only marker.
  The tab reads it and does not pretend it is a gate.

---

## What was implemented, including consequences of the above

Commit `5b6befd15c86e1fe7d41b3e3df18fdb6351b3de5` on `free-REQ-170`, version
0.2.71. Ten UATs in `tests/test_UAT_FC_REQ-170_people.workers.test.ts`.

### The tab is `Users`, at `people`, and `/admin` was never built

`PEOPLE_TAB = { id: 'people', label: 'Users', fill: true }` in `config.js`,
third in `TABS`, mounted in `app.js` beside the Library and on the same terms — a
business switch **clears then re-reads** rather than re-filtering, because these
are other people entirely and leaving one business's rows under a header naming
another is the outcome a failed re-read may not produce.

The routes are `/api/people`, not `/api/admin/people`. The prefix was the
decision rather than the spelling: an `admin` segment would encode a
platform-only reading in the URL and be wrong for every customer who reaches it.

### `entitlements.revoked_at` did not exist — 0008 adds it

The body has always said revocation sets `revoked_at` and `status='revoked'`.
`memberships` has held that column since `0004:82`; `entitlements` never did, and
the asymmetry was an omission rather than a decision. `0008` adds it: nullable,
unbackfilled — every existing row is a grant nobody has withdrawn, which is what
NULL means — and **not** part of the access check, because `bestActiveGrant`
already excludes `status='revoked'` and a second condition would give the check
two ways to say no and let them disagree.

### The gate calls [[REQ-185]] rather than reimplementing it

`ownsPlatformBusiness` landed in `identity.ts` while this ticket was being
written, so `people.ts` re-exports it instead of writing a second predicate. That
also keeps `TENANT_ID` at the two readers [[REQ-168]] left it — a predicate
written at the route or in this module would have been the third.

`canFulfil` is reported **with the list** for the chrome to render on, and is
explicitly not the gate: `/api/admin/businesses` asks the same question again for
itself, because a control that is merely unrendered is not refused to anyone who
can type a URL.

### `identityEnv` is hoisted in `router.ts`

It was declared inside the `/api/admin/businesses` handler. Five routes need it
now, and a cast repeated six times is six places for one to drift into a
different assertion.

### [[REQ-161]]'s tab assertion is narrowed, not deleted

It spelled *"the Library is beside the site tab"* as
`toEqual([SITE_TAB.id, LIBRARY_TAB.id])`, which pinned the tab **count** as a
side effect of pinning the relationship — so a third tab failed a claim it does
not contradict. It now asserts the adjacency itself, which stays true however
many tabs exist. Implicit supersession, this ticket being the later one.

### Test plan

Ten UATs, in four groups matching the sections above, inside workerd against
real D1 with the deployed migrations applied. Every row is written through a
shipped entry point — `provisionInvite`, `provisionBusiness`, `openGrant` — so a
divergence between what the product writes and what the tab reads fails here
rather than passes.

- the list answers about the scoped business, and the same function against a
  customer's business does not return our people
- a contact is listed and is distinguishable from a member by `invitedAt`
- a person in another business is indistinguishable from one that does not exist
- **an account logs in holding no membership on the business it logs in to** —
  the corrected reading of [[DOC-42]] §4, asserted rather than described
- `users.status` is the login control, and a suspended person is refused
  `user_inactive`
- the detail lists the businesses that person runs, including a second one
- an account holding two grants shows both, each naming its business
- a grant that names no business is refused
- revocation marks the grant and does not delete it
- the fulfilment control is refused to a customer who owns their own business

Regression scope: `test_UAT_FC_REQ-161_library_tab` and `req115-builder-shell`
pass. Twelve suites fail on this branch and **fail identically on the base
commit** — the knowledge-base cluster (REQ-123/158/159/160/163/165 and the two
`reconciliation-*` files) and `bug32-webui-scope-rebrand` — none touched here.

### Not done, and why

- **The invite.** The tab reads and edits; it does not yet provision. The one
  control that would is `/api/admin/businesses`, which exists ([[REQ-180]] D2)
  and is wired to `canFulfil` but calls no starter-site path of its own.
- **`display_name` editing.** [[REQ-183]] §5 records that `users.display_name`
  and `tenants.name` are changeable by nobody, and calls it a different ticket.