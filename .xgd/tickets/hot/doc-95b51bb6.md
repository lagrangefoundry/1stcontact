---
uid: doc-95b51bb6
id: DOC-42
type: doc
title: 'Two levels, two relations: the model behind the User tab'
created_by: xgd
created_at: '2026-09-04T23:20:47.206764+00:00'
updated_at: '2026-09-05T00:10:36.084101+00:00'
completed_at: null
last_field_updated: body
status: open
fields:
  doc_kind: architecture
---

# Two levels, two relations: the model behind the User tab

## Why this document exists

[[DOC-40]] §2 splits the account from the business and §2.1 states the recursion
— 1st Contact is built as a 1st Contact business. Both are correct and neither is
enough to build the User tab from, because the working-out took several passes
and each pass produced a plausible wrong answer that survives in the vocabulary.

This document is that working-out. It is short because the model is small. It is
separate because the model is not obvious, and because three of the ten rules
below say that something already written down is wrong.

Every rule carries a **falsifier** — the observation that would show it has been
broken — because the failure mode here is not disagreement, it is code that
quietly assumes one of the wrong answers.

## 1. The example. Hold this and the rest follows

- **Alice** is a customer of 1st Contact. She has a business, **Alice's Plumbing**.
- **Bob** is a customer of Alice's Plumbing.

Bob logs in to Alice's Plumbing and reaches a **User Portal**: his payments to
Alice, his details, his delete button.

Alice logs in to 1st Contact and reaches **her** User Portal: her payments to
1st Contact, her details, her delete button.

**Those two are the same thing.** Not analogous, not one level up — the same
surface, the same code, pointed at a different business.

Alice's login *also* reaches **the 1st Contact app** — the builder, the library,
the CRM, the User tab. Bob's login reaches no app, because Alice's Plumbing does
not have one. That is a difference between what two businesses sell, not a
difference between two levels.

## 2. There is no platform tenant

There is a **1st Contact tenant**. It owns the 1c site. Its users are its
customers. That is the same sentence Alice would say about hers.

"Platform tenant" names a *kind* of tenant, and no such kind exists. Once the
phrase is in the vocabulary the code follows it, and the result is capability
built platform-only — [[DOC-40]] §2.1 rule 1's named failure mode.

`TENANT_ID` is exempt and stays. It says which tenant this deployment's app runs
against, which is a fact about the deployment and not about the model.
[[REQ-180]] D5 already classified it as deployment vocabulary for this reason.

**Falsifier:** any predicate meaning "is this the platform's own tenant" outside
`TENANT_ID`'s two readers (`identity.ts`, `scope.ts`).

## 3. A level is a position, not a property

Alice is level 1 relative to 1st Contact. Bob is level 2. But *level* is a
distance from wherever you are standing: your User tab shows the people of your
business, and that is the whole rule. It reads as "level 1" from 1st Contact and
"level 2" from Alice's Plumbing because those are different vantage points.

The recursion is exactly two deep ([[DOC-40]] §2.1 rule 2) — Bob never becomes a
tenant — but nothing in the code needs to know how deep it is standing.

**Falsifier:** a `level` column, an `is_platform_user` predicate, or any query
that branches on which level a row belongs to. Today only `tenant_id` is
consulted, which is correct.

## 4. Membership and entitlement are orthogonal

Two relations, two questions, no layering between them:

| | means | table |
| --- | --- | --- |
| **Membership** | this person may log in to this business | `memberships` |
| **Entitlement** | this account has been granted access to some thing | `entitlements` |

Membership is *not* "operator of the business" and *not* a paid tier. It is the
login relation and nothing else. `memberships.role` (`owner`, `support`) says
what kind of member; Bob is a third kind.

The code already implements this split correctly:

- `businessesFor` joins through `memberships` (`identity.ts:621`) — membership
  puts a business in your set.
- `selectable: entitlement !== null` (`identity.ts:665`) — the entitlement is
  what lets you in.

**Falsifier:** anything that treats holding a membership as implying a grant, or
that reaches for `memberships` to answer "has this person paid for X".

## 5. The Portal is what membership IS. It is not a grant

A member reaches their User Portal by virtue of being a member. There is no
free automatic entitlement row standing behind it.

The reason is not tidiness. The Portal is where a person sees what they have
paid, changes their details, and asks for erasure ([[DOC-37]]). If that access
were a row, it could be absent — a failed insert, a partial provision, a
migration that missed a backfill — and the failure mode is a person who can log
in but cannot reach the surface where they would fix anything, including their
delete button. A constant that can go missing is strictly worse than a constant.

It would also cause a control to exist that should not: if Portal access were a
grant, someone will build *revoke Portal access*, which is close to blocking an
erasure request. Withdrawing a login is already expressible —
`memberships.revoked_at`, which refuses independently of any date (0004:63).

This gives the line for what needs a grant and what does not:

> **A fact about this person's relationship with this business** → membership, no
> grant. Their payments, their details, their delete button.
> **Something the business provides** → entitlement. The 1c app; Alice's
> paywalled pages.

**Falsifier:** an entitlement row that is created for every member and revoked
for none.

## 6. An entitlement grants an ACCOUNT access to a THING

The subject is the **account**, not the person and not the business. Today one
user is one account; the model must not foreclose an account with several users.

The object is the thing being accessed — for 1st Contact's product, a business.

**"Account" is relative to the business, like level is.** Bob is an account *of
Alice's Plumbing*. Defining an account as "a `users` row in the 1st Contact
tenant" makes it platform-only vocabulary and breaks the first time Alice bills
two people at one address.

Per-business capacity and per-account access are **different grants**, not one
generalised. "Alice's Plumbing holds a pro plan" must not require re-granting
every member as they join. So the subject is an addition to the table, not a
replacement for what is there.

**Falsifier:** a `users.id` written into a column whose contract is an account,
or a paywall implemented by granting each member individually.

## 7. The User tab is uniform. The additions are product fulfilment

The tab shows **the people of the business you are in**, and per person, the two
relations of §4: may they log in, and what have they been granted.

- Yours, tenancy = 1st Contact: Alice is a member, and her account is entitled to
  Alice's Plumbing.
- Alice's, tenancy = Alice's Plumbing: Bob is a member, and someday his account is
  entitled to her paywalled pages.

The controls only you see are **1st Contact's product-fulfilment actions**.
Provisioning a business is 1st Contact filling an order; it writes a `tenants`
row, which is why it needs privilege. Alice will have fulfilment actions too,
they will look nothing like these, and they will not live behind the same check.

So the gate is two conditions, and neither is the word *admin*:

1. **you are an owner of this business** — uniform; Alice is, of hers
2. **this business's product is businesses** — which is what makes the control
   appear for 1st Contact and nowhere else

Today those two select exactly the set `platform_admin` selects, so this costs
nothing to model correctly now.

**Falsifier:** a generic "admin extension" mechanism. One business has these
controls today and the next business's will not fit the same shape.

## 8. What is actually distinguished about 1st Contact

Three facts about what that business does. None of them is a kind of tenant.

- **The app is deployed against it** — `TENANT_ID`, a deployment fact (§2).
- **It hosts the others**, which is why support access into them is possible at
  all — `scope.ts:237`'s bypass over membership. This is the one genuinely
  special power, and it is special because of hosting, not because of level.
  [[DOC-40]] §7 parks its general form.
- **Its product is other businesses**, which is why `provisionBusiness` is its
  fulfilment action (§7).

## 9. Contacts and users are one population

[[DOC-40]] *Contacts are users*: a contact is a `users` row in that tenant with
no authentication fields set — explicitly not a second table, with
`(tenant_id, email)` unique as the one place identity is decided (0004:61).

So the CRM and the User tab are two views of one list, and **the invite is the
verb that moves someone across**: capture a visitor → see them in the CRM →
invite them in. Your CRM is prospects who landed on the 1c site; your Users are
the ones who accepted.

One tab with a facet, or two tabs over one query, is open. Two lists is not.

**Falsifier:** a User list and a CRM list that can disagree about a person who is
both.

## 10. Amendments this model owes to what is already written

Three of them, and none is a mistake by the ticket that landed it — each was
correct for what was asked at the time and became an amendment only once the
model above was worked out. None is owned by this document. Where each one now
lives is recorded with it.

[[REQ-178]], [[REQ-179]] and [[REQ-180]] were moved back to `draft` from
`ready_to_reconcile` on 2026-09-04 to take these before their work reconciles;
their commits stand — they are already on `working` — and the amendments are
deltas on top of them. [[DOC-40]]
carries the same four corrections in an appended section, its own §2/§5/§6 left
as written because in-flight tickets cite them as rationale.

### 10.1 Admission requires an entitlement, and should require a membership

**Owned by [[REQ-178]]** (the refusal) and [[REQ-179]] (what the chrome does with
nothing selectable). **Blocks [[REQ-183]] §4**, whose delete control is otherwise
unreachable for the population most likely to want it.

`admit` refuses when no business is selectable (`identity.ts:542`,
`no_entitlement`). Under §5 that is a lockout loop: a lapsed customer cannot
reach the Portal showing their payment history — including the page where they
would pay, which is the only thing that would restore the grant — nor their
delete button, which [[DOC-37]] makes an obligation rather than a feature.

`no_membership` stays a refusal. `no_entitlement` should become a state inside an
admitted session: you are logged in, the app is not open to you, here is why.

[[DOC-40]] §5 half-anticipates this — *"for the alpha an expired grant denies
with a message; read-only access to one's own site is the better product
answer"*. §5 above gives it a stronger reason than product preference.

### 10.2 `entitlements.account_id` holds a business — **taken, 2026-09-04**

**Owned by [[REQ-184]]**, filed 2026-09-04 and landed the same day in
`db/migrations/0006_entitlement_subject.sql`. [[REQ-167]] wrote the schema and is
`bundled`, so it could not take this. It constrained [[REQ-170]]'s entitlement
editor in the meantime, which had to not be built as though the subject were
always a business; that constraint is now discharged.

[[DOC-40]] §5 said so plainly: *"`account_id` here is a business"*. Under §6 the
subject is the account and the business is the object, so the column that said
`account_id` was the one that was not. The name would have produced a bug —
someone writes a user id into it because the name tells them to, and it
half-works.

**Which way it went.** Both halves landed together, as this section asked
("rather than twice"):

- `entitlements.account_id` → **`business_id`**, the object.
- `entitlements` gains a new **`account_id`**, the subject. `NULL` is a
  first-class value meaning *no account named*, which is a per-business
  **capacity** grant — every row written before this migration is one, and
  provisioning still writes one.
- The capacity check (`bestActiveGrant`) reads
  `business_id = ? AND account_id IS NULL`, so an account-subject grant cannot
  make a business selectable for everyone holding a membership on it, and the
  converse — a capacity grant answering an `account_id = ?` lookup — is
  foreclosed by the same one column rather than by a second table or a `kind`
  enum.
- **No index on the subject yet**, deliberately: nothing reads it, and an index
  without a reader is a guess at a query nobody has written.

**And `memberships.account_id` was renamed too**, which is required by the above
rather than tidying alongside it. That column has always held a business, and
leaving it alone was defensible while `account_id` meant *business* everywhere
([[DOC-40]] §2). The moment `entitlements.account_id` starts meaning an actual
account, two adjacent tables carry that name with opposite meanings — strictly
worse than the state this section set out to fix, and exactly the trap that
produces a silently-empty query. `tenant_id` is untouched, per [[REQ-180]] §3:
that column is correct and merely internal, where these two were wrong.

### 10.3 `users.platform_admin` bundles two capabilities

**Rationale amended in [[REQ-180]]** A1; the column split itself is
**[[REQ-185]]**, filed 2026-09-04. [[REQ-170]] does not depend on it — §7's two conditions select
exactly the set the flag selects today, so the gate can be modelled correctly
without the column changing.

- **owner of the 1st Contact business** — not special; `memberships.role='owner'`,
  which exists.
- **may enter a business without a membership** — `scope.ts:237`, genuinely
  special per §8.

[[DOC-40]] §6 defends the flag on bootstrapping grounds: *"it works before any
membership row exists, and it cannot lock its holder out of the system that
grants it."* That defence carries the **`PLATFORM_ADMINS` env var**, which is a
break-glass seed and should stay. It does not carry the **column**, which is a
persistent model fact and is exactly §2.1 rule 1's shape: a platform-only flag
standing in for a capability every business owner needs.

§6 already names the replacement for the second half — time-boxed `support`
membership rows, *"the auditable alternative, and the table exists for them from
day one"*. What is new here is that the first half should not be a flag at all.
