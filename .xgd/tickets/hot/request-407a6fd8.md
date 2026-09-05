---
uid: request-407a6fd8
id: REQ-178
type: request
title: 'Identity: an account operates several businesses, not one'
created_by: xgd
created_at: '2026-09-02T23:15:32.712582+00:00'
updated_at: '2026-09-05T00:25:00.346922+00:00'
completed_at: null
last_field_updated: body
status: free_coded
fields:
  priority: high
  story_points: 4
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-be5ca689
  commits:
  - working_sha: b1cafc80b7338b7671b80bd8c2aae2efc2062618
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 68db3937779cc56162eb55ec146e81ee8c64ec03
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: fa0b857db76c343f68b579e7003fb30207840fdb
    reconcile_sha: null
    main_sha: null
  - working_sha: cd6002e17da483e8e2d7c1defa7fb90540bb0336
    reconcile_sha: null
    main_sha: null
  version: 0.2.68
---

# Identity: an account operates several businesses, not one

## The gap

[[DOC-40]] §2 splits two levels that this codebase had as one: an **account** is the payer, a **business** is the tenant, and one account may own several businesses. The schema already supports it — `memberships (user_id, account_id)` is a join, and `account_id` has always held a tenant id — but `identity.ts` does not.

`accountFor()` returns a single account id and `Admission` carries it singular:

```
type Admission =
  | { ok: true; user: UserRow; accountId: string; entitlement: EntitlementRow }
  | { ok: false; reason: DenialReason; email: string | null }

```

That is **the only place** the one-business-per-account assumption is baked into shipped code. Everything else already has the right shape: `provisionInvite` writes the builder user into the _platform_ tenant and the business as a separate `tenants` row, which is the recursion [[DOC-40]] §2.1 describes, already built.

## Admission returns the set

`admit()` returns every business the account may operate, each carrying its own entitlement:

- memberships for the user, excluding rows with `revoked_at` set or `expires_at` in the past

- for each, `bestActiveGrant` against that business — §5's grant is per business, so plan and access move down from the admission to the business

- the business's `tenants.name`, because the switcher has to label it with something and the id is deliberately opaque

`ok` stays a property of the **person**. What varies per business is access.

## Denial becomes per business, and that is the behaviour change

Today a single lapsed entitlement denies the person. With several businesses that is wrong: an account whose second business has lapsed must still reach the first.

- **No admissible business at all** — refuse as now, with `DENIED_MESSAGE`. `no_membership` and `no_entitlement` keep their meanings at the account level: they mean _none of them_, not _this one_.

- **Some admissible, some not** — admit, and still return the lapsed ones, marked and unselectable. A business that simply vanishes from the switcher is indistinguishable from one that was deleted, which is the wrong thing to tell someone whose card expired.

The person-level refusals keep their order and their precedence: `no_email`, then `no_user`, then `user_inactive`, all decided before any business is looked at.

## Provisioning a second business

`provisionInvite` provisions an account **and** its first business ([[DOC-40]] §4). A second business is the same rows minus the user — a `tenants` row, a membership, an entitlement, one site — so it wants a sibling taking an existing account:

```
provisionBusiness(env, { accountUserId, name }): Promise<...>

```

`provisionInvite` calls it rather than inlining the same writes, so the two paths cannot drift into provisioning differently-shaped businesses. Self-serve creation is later a second entry point onto this function, not new logic — the same property [[DOC-40]] §4 claims for just-in-time provisioning.

## What this ticket does not own

- **Which business is selected**, and how a returning operator lands where they left — [[REQ-168]] owns resolution and reads what this produces.

- **The endpoint that lists them** for the switcher — [[REQ-180]].

- **The selector itself** — [[REQ-179]].

This ticket answers _which businesses may be operated_. Those answer _which one is being operated now_, _how the browser learns about them_, and _how a person picks_.

## Acceptance

- A successful `Admission` carries a non-empty list of businesses, each with its own entitlement and its `tenants.name`; a UAT covers an account with two.

- An account with one lapsed and one active business is **admitted**, and the lapsed business is present in the list and marked unselectable.

- An account with every business lapsed is refused with `no_entitlement`.

- A revoked or expired membership excludes its business from the list.

- `provisionInvite` and `provisionBusiness` produce the same business shape for the same inputs, asserted rather than assumed.

- No caller reads a singular `accountId` off `Admission` — the failure mode is one call site left behind, serving the first membership found to a person who selected the second.

---

## What was implemented, including consequences of the above

### `Admission` loses `accountId` and `entitlement` rather than keeping them beside the list

The singular fields were **deleted**, not left in place next to `businesses`. A caller still reading `accountId` would serve whichever business sorted first to someone who had selected the second — plausible, silent and wrong. Deleting the fields turns every such call site into a compile error. `apps/control-app/src/index.ts` was the only shipped consumer and reads `ok` alone, so nothing needed rewiring; the two existing REQ-167 UATs that read the singular fields were updated.

Each `AdmittedBusiness` carries `{ accountId, name, entitlement, selectable }`. `selectable` is false exactly when `entitlement` is null.

### Revoked and expired memberships exclude the business entirely

A lapsed _grant_ keeps the business in the list, marked. A revoked or expired _membership_ removes it. They are different facts: listing a revoked membership would tell a former employee which businesses they used to be able to reach.

### The join onto `tenants` is also an integrity guard

`businessesFor` inner-joins `tenants` for the name, which drops a membership pointing at a business the registry has never heard of — a row `forTenant` would refuse anyway, so it is better dropped here than surfaced as a switcher entry that throws when picked.

### Provisioning: what the D1 batch now guarantees

`provisionInvite` previously wrote user + membership + entitlement in one `DB.batch()`. Extracting `provisionBusiness` splits that, because the user belongs to the person and the other two belong to the business:

- the user row is written first, on its own

- membership + grant go in `provisionBusiness`'s batch, so a business can never exist that nobody may operate or that carries no access

The failure this newly admits is a person with no business. It is **visible** — they are refused `no_membership` — and it is made **repairable**: re-inviting someone who holds no live business provisions one. That is not a second account, because the account is the person and the person already existed; `created` stays false. Re-inviting someone who _does_ hold a business is unchanged — it reports the first one they hold and writes nothing.

### `provisionBusiness` signature and refusals

```
provisionBusiness(env, {
  accountUserId, name, email?, plan?, startsAt?, endsAt?, grantedBy?, note?,
}): Promise<{ accountId, name, siteSlug }>

```

Role is always `owner` and is not a parameter: every business this creates is created for the person who will own it, and a time-boxed `support` membership ([[DOC-40]] §6) is granted against an _existing_ business, so it is a different operation. An empty `accountUserId` or an empty `name` is refused, because neither row can be repaired from the outside once written.

`InviteResult.accountId` stays **singular** and that asymmetry is deliberate: an invite provisions one business, so reporting one id is reporting what happened. It is admission — "which businesses may be operated" — where a singular answer would be a guess.

## Test plan

`tests/test_UAT_FC_REQ-178_businesses.workers.test.ts`, in workerd against real D1 with the deployed migrations, every business provisioned through the shipped entry points rather than seeded:

- two businesses admitted, each with its own grant and its own `tenants.name`

- the admission object carries no `accountId`/`entitlement` key

- one lapsed among two — admitted, lapsed present, `selectable` false

- every business lapsed — refused `no_entitlement` (driven with two, so it cannot pass on code that stops at the first)

- revoked and expired memberships each excluded

- a suspended person holding a live business is still refused `user_inactive`

- invite-provisioned and `provisionBusiness`-provisioned businesses compared row-for-row out of D1

- a second business is immediately operable, with a starter page

- both provisioning refusals

- the re-invite repair

Regression scope: `tests/test_UAT_FC_REQ-167_identity.workers.test.ts` (19 tests, two updated for the new shape) and the whole `workers` vitest project (26 files, 217 tests). The full suite has one pre-existing unrelated failure, `tests/bug32-webui-scope-rebrand.test.ts`, which fails identically on the base commit.

### A second commit: repairing a raced merge

`68db393777` is not part of the design above. Merging `free-REQ-178` into `xgd-working` conflicted only on `package.json`'s version scalar, and another session's `git commit` landed inside that conflicted merge — committing it (as `6cddcbb1c4`, labelled for a different ticket) with the conflict markers still in the file, which made `package.json` unparseable on `xgd-working`.

The repair resolves it to `0.2.51`, above both sides rather than either: the two version bumps were independent, so neither is a superset of the other. It is recorded on this ticket because this ticket's merge is what surfaced it and there is no other commit for it to belong to; it changes no behaviour and needs no UAT.

---

## Reopened 2026-09-04: admission is membership, not entitlement ([[DOC-42]])

Moved back to `draft` from `ready_to_reconcile` to take this amendment before the
work reconciles. **The commits above stand** — what is written here is a delta on
top of them, not a repudiation of them. [[DOC-42]] is the model this comes from.

### The amendment extends this ticket's own argument by one step

*Denial becomes per business* already says it:

> an account whose second business has lapsed must still reach the first
>
> a business that simply vanishes from the switcher is indistinguishable from one
> that was deleted, which is the wrong thing to tell someone whose card expired

[[DOC-42]] §4 and §5 carry that one step further. **Membership means the person
may log in; entitlement means their account has been granted access to some
thing.** They are orthogonal, and this ticket's code already splits them —
`businessesFor` joins `memberships`, `selectable` is `entitlement !== null`. What
remains joined is the refusal at the door.

So the acceptance criterion *"an account with every business lapsed is refused
with `no_entitlement`"* is the one line that has to change, along with the UAT
driving it.

### What replaces it

- **`no_membership` stays a refusal.** No membership anywhere is no relationship
  with anything, and there is nothing to admit someone to.
- **`no_entitlement` stops being a refusal** and becomes a state inside an
  admitted session: the person is logged in, no business is selectable, and the
  reason is [[REQ-180]] D4's lapse.

`ok` staying a property of the person, which this ticket already establishes, is
what makes the change small: the set simply comes back with nothing selectable in
it, and callers that consult `selectable` already handle that shape.

### Why it is not a preference

A lapsed account refused at the door cannot reach the surface where they would
see what they were charged, cannot reach the page where they would **pay** —
which is the only act that would restore the grant — and cannot reach their
delete button, which [[DOC-37]] makes an obligation rather than a feature. The
refusal removes the remedy along with the access.

[[DOC-40]] §5 anticipates the product half of this — *"for the alpha an expired
grant denies with a message; read-only access to one's own site is the better
product answer"* — and treats it as deferred. [[DOC-42]] §5 supplies the reason it
cannot wait: the Portal is what membership **is**, not something granted, so
membership alone has to admit.

### Consequences for what was implemented

- The `every business lapsed → no_entitlement` UAT inverts: two lapsed
  businesses now **admit**, with both present and neither selectable.
- `DenialReason` keeps `no_entitlement` as a value — an operator debugging
  "it says no" still needs the distinction, and [[DOC-40]] §5's rule that the
  distinction reaches the log and never the wire is unchanged. What changes is
  that it no longer produces `ok: false`.
- The person-level refusals keep their order and precedence exactly as written:
  `no_email`, `no_user`, `user_inactive`, all decided before any business is
  looked at.
- **What a session with nothing selectable may reach** is not settled here.
  This ticket owns admission; the surface that such a session lands on is
  [[REQ-183]]'s, and [[REQ-170]] is what creates lapsed members in the first
  place.

### Vocabulary

*The gap* says `provisionInvite` writes the builder user into the "platform
tenant". [[DOC-42]] §2: there is no platform tenant, there is the **1st Contact
business**, which owns the 1c site and whose users are its customers. The
behaviour described is correct; the phrase names a kind of tenant that does not
exist. `TENANT_ID` is untouched and stays — it is deployment configuration
([[REQ-180]] D5), not a model concept.


---

## What the amendment landed, and its consequences

`admit` no longer refuses `no_entitlement`. Everything below is the technical
consequence of that one deletion — recorded here because each piece is behaviour
that did not previously exist, not merely a line moved.

### The refusal is deleted; the reason is not

`no_membership` still refuses. `no_entitlement` is gone from `admit` and stays a
`DenialReason` value, because the state it names is still the first thing an
operator needs when a customer says "it says no". What moved is **where it is
recorded**: off the admission decision, which now admits, and onto the resolver,
which is where the consequence now is. `index.ts` logs
`{event: 'no_business', reason: 'no_entitlement', email}` when a route that
needs a business is reached by an account that has none.

### The resolver gains a fourth answer: no business

`resolveScope` returns `Scope | null`. Null exactly when the admission is `ok`,
no target was named, and nothing is selectable. `firstAdmissible` used to throw
on that state, with a comment saying it was a broken invariant — this amendment
is precisely what widened `admit`'s success case past it, and left unchanged the
throw would have made every request from a lapsed customer a **503**: a
configuration failure an operator can act on, shown to the one person whose
problem is a payment.

**A named target is unaffected.** Asking for a specific lapsed business is a
different act from asking for whichever one is open, and it still raises
`ScopeRefusedError('no_entitlement')`. Only the unnamed case was widened.

### `route` takes a nullable scope, and one place turns it into a refusal

`route(request, env, scope: Scope | null, deps, ctx)` — still a required
argument with no default, so nothing acquires the deployment's own business by
omission; what it may now carry is "there is no business to be in". Inside the
table a single `requireScope()` throws `NoBusinessError`, and every route that
needs a business already reaches it through one of three memoised openers
(`openStore`, `openTickets`, `ingestDeps`) plus `chatHost`. So the null is
handled once rather than per route, and a route added later cannot forget it.

The routes above the store keep answering with no null check at all — the
chrome, `/api/status`, `/api/businesses`. That set is the point rather than a
side effect: **the chrome is the document that draws the switcher, and the
switcher is the only surface that says why each business is closed**
([[REQ-179]], [[REQ-180]] §1). A session refused the chrome would be told
nothing at all.

### `NoBusinessError` is rethrown from the router, in two places

The route table's own handler catches everything and answers 500, so the error
has to escape it to reach the frame that knows who the caller is. It is
rethrown beside `TenantNotConfiguredError` for the same stated reason, and again
from `/api/import`'s local catch — that route opens the store itself rather than
through the memoised opener, so it is the one place the refusal would otherwise
be swallowed.

### The refusal is a 403 with its own message

`NO_BUSINESS_MESSAGE`, not `DENIED_MESSAGE`. The latter says one thing to
everybody because the caller might not be anybody — naming the reason to a
refused visitor is an account-existence oracle. Nobody reaches this one without
a live membership, so it is a fact about the reader's own account, owed to them
and disclosing nothing about anybody else's: the same argument `BusinessLapse`
is already carried on the wire under. It points at the switcher rather than
restating the per-business reason, so there is one copy of that sentence.

403 and not 402: "payment required" is the honest status and there is nothing to
pay with yet ([[REQ-183]] owns that surface), so it would name a remedy this
deployment cannot offer.

### `businessesPayload` takes a nullable scope

It reads the scope only on the no-admission branch, so the admitted lapsed
account gets its full list — every business present, each unselectable, each
carrying its `lapse`. A null scope with no admission answers an empty list; that
pair is not constructible today (the dev-open path resolves from `TENANT_ID` or
refuses outright) and is written rather than asserted because an empty list is
true whatever produced it, where an invented id would be a business the chrome
would then try to open.

### No client change was needed

`resolveBusiness` already returns null when nothing is selectable, and
`selectBusiness(null)` sets no prefix and swallows the site-list failure — so
the shell loads, the switcher lists both businesses marked with their reason,
and the site pane is empty. [[REQ-179]] built that path for browser storage
outliving a grant; the amendment is the case that finally reaches it. Asserted
end-to-end through the Worker rather than assumed.

### What REQ-167's grant-window UATs now observe

Four UATs in `test_UAT_FC_REQ-167_identity.workers.test.ts` used admission's
refusal as the observable for a claim about the grant **window**. The claims are
unchanged — an end date in the past stops covering, a start date in the future
does not yet cover, a revoked status refuses whatever the dates say — so they
now assert on the business's `selectable`/`entitlement` instead of on `ok`.

The fourth, `the_refusal_does_not_say_which_check_failed`, is the oracle claim:
two refusals for different reasons must be one identical response. A lapsed
grant is no longer one of the two, so it is driven with a **withdrawn
membership** against a stranger — `no_membership` versus `no_user`, which is
exactly the pair an existence oracle would distinguish.

## Test plan (amendment)

`tests/test_UAT_FC_REQ-178_lapsed_session.workers.test.ts` — seven UATs. The
resolver cases call `resolveScope` directly, because "returns no business" has
no HTTP shape of its own; the HTTP cases drive the **Worker's own `fetch`** with
a real RS256 Access token against a real JWKS, inside workerd against real D1:

- a wholly lapsed account resolves to no business
- naming a lapsed business is still refused
- one live business among lapsed ones still resolves — to the first *selectable*
- the chrome loads, 200, for a wholly lapsed account
- `/api/businesses` answers with every business present, unselectable, each with
  its lapse reason
- a business-scoped route (`/api/sites`) refuses **403, not 503**, with the
  account-level message
- the control: an account with a live business is unaffected

In `tests/test_UAT_FC_REQ-178_businesses.workers.test.ts`, the every-lapsed UAT
inverts (admitted, both present, neither selectable, each `lapse.reason` =
`expired`), driven with two businesses so it cannot pass on code that stops at
the first, and a new UAT asserts `no_membership` still refuses — so removing one
refusal cannot quietly remove the other.

Regression scope: the whole suite. 33 failures remain, in eleven files, every
one of which fails identically on the unmodified base commit — the KB
corpus/index suites and `bug32-webui-scope-rebrand`. Two further files
(`req115-builder-shell`, `reconciliation-l1-navigation`) failed once under full
parallel load and pass in isolation.


### A fourth commit: REQ-184's UAT lost the same observable

`cd6002e17d` moves one UAT in
`tests/test_UAT_FC_REQ-184_entitlement_subject.workers.test.ts` — *an account-subject
grant does not satisfy a business capacity check* — off `admission.ok` and onto the
business's `selectable` and `never_granted` lapse, for the same reason REQ-167's four
moved. Its claim is unchanged; only the surface the answer appears on is.

It is a separate commit rather than part of the merge because [[REQ-184]] landed on
`xgd-working` after this branch was cut, so the file did not exist on the branch and the
fix had nowhere there to live. A merge commit is not cherry-picked at reconcile, so
conflict-resolution content that matters has to be its own commit — which is also why
the merge resolves `package.json` to `xgd-working`'s `0.2.67` (the incoming `0.2.66` is
bookkeeping) and this commit carries the bump to `0.2.68`.