---
uid: request-407a6fd8
id: REQ-178
type: request
title: 'Identity: an account operates several businesses, not one'
created_by: xgd
created_at: '2026-09-02T23:15:32.712582+00:00'
updated_at: '2026-09-03T00:02:29.031659+00:00'
completed_at: null
last_field_updated: body
status: free_coded
fields:
  priority: high
  story_points: 3
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-be5ca689
  commits:
  - working_sha: b1cafc80b7338b7671b80bd8c2aae2efc2062618
    reconcile_sha: null
    main_sha: null
  - working_sha: 68db3937779cc56162eb55ec146e81ee8c64ec03
    reconcile_sha: null
    main_sha: null
  version: 0.2.51
---

# Identity: an account operates several businesses, not one

## The gap

[[DOC-40]] §2 splits two levels that this codebase had as one: an **account** is
the payer, a **business** is the tenant, and one account may own several
businesses. The schema already supports it — `memberships (user_id, account_id)`
is a join, and `account_id` has always held a tenant id — but `identity.ts` does
not.

`accountFor()` returns a single account id and `Admission` carries it singular:

```ts
type Admission =
  | { ok: true; user: UserRow; accountId: string; entitlement: EntitlementRow }
  | { ok: false; reason: DenialReason; email: string | null }
```

That is **the only place** the one-business-per-account assumption is baked into
shipped code. Everything else already has the right shape: `provisionInvite`
writes the builder user into the *platform* tenant and the business as a separate
`tenants` row, which is the recursion [[DOC-40]] §2.1 describes, already built.

## Admission returns the set

`admit()` returns every business the account may operate, each carrying its own
entitlement:

- memberships for the user, excluding rows with `revoked_at` set or `expires_at`
  in the past
- for each, `bestActiveGrant` against that business — §5's grant is per business,
  so plan and access move down from the admission to the business
- the business's `tenants.name`, because the switcher has to label it with
  something and the id is deliberately opaque

`ok` stays a property of the **person**. What varies per business is access.

## Denial becomes per business, and that is the behaviour change

Today a single lapsed entitlement denies the person. With several businesses that
is wrong: an account whose second business has lapsed must still reach the first.

- **No admissible business at all** — refuse as now, with `DENIED_MESSAGE`.
  `no_membership` and `no_entitlement` keep their meanings at the account level:
  they mean *none of them*, not *this one*.
- **Some admissible, some not** — admit, and still return the lapsed ones,
  marked and unselectable. A business that simply vanishes from the switcher is
  indistinguishable from one that was deleted, which is the wrong thing to tell
  someone whose card expired.

The person-level refusals keep their order and their precedence: `no_email`, then
`no_user`, then `user_inactive`, all decided before any business is looked at.

## Provisioning a second business

`provisionInvite` provisions an account **and** its first business ([[DOC-40]]
§4). A second business is the same rows minus the user — a `tenants` row, a
membership, an entitlement, one site — so it wants a sibling taking an existing
account:

```ts
provisionBusiness(env, { accountUserId, name }): Promise<...>
```

`provisionInvite` calls it rather than inlining the same writes, so the two paths
cannot drift into provisioning differently-shaped businesses. Self-serve creation
is later a second entry point onto this function, not new logic — the same
property [[DOC-40]] §4 claims for just-in-time provisioning.

## What this ticket does not own

- **Which business is selected**, and how a returning operator lands where they
  left — [[REQ-168]] owns resolution and reads what this produces.
- **The endpoint that lists them** for the switcher — [[REQ-180]].
- **The selector itself** — [[REQ-179]].

This ticket answers *which businesses may be operated*. Those answer *which one
is being operated now*, *how the browser learns about them*, and *how a person
picks*.

## Acceptance

- A successful `Admission` carries a non-empty list of businesses, each with its
  own entitlement and its `tenants.name`; a UAT covers an account with two.
- An account with one lapsed and one active business is **admitted**, and the
  lapsed business is present in the list and marked unselectable.
- An account with every business lapsed is refused with `no_entitlement`.
- A revoked or expired membership excludes its business from the list.
- `provisionInvite` and `provisionBusiness` produce the same business shape for
  the same inputs, asserted rather than assumed.
- No caller reads a singular `accountId` off `Admission` — the failure mode is
  one call site left behind, serving the first membership found to a person who
  selected the second.


---

## What was implemented, including consequences of the above

### `Admission` loses `accountId` and `entitlement` rather than keeping them beside the list

The singular fields were **deleted**, not left in place next to `businesses`. A
caller still reading `accountId` would serve whichever business sorted first to
someone who had selected the second — plausible, silent and wrong. Deleting the
fields turns every such call site into a compile error. `apps/control-app/src/index.ts`
was the only shipped consumer and reads `ok` alone, so nothing needed rewiring;
the two existing REQ-167 UATs that read the singular fields were updated.

Each `AdmittedBusiness` carries `{ accountId, name, entitlement, selectable }`.
`selectable` is false exactly when `entitlement` is null.

### Revoked and expired memberships exclude the business entirely

A lapsed *grant* keeps the business in the list, marked. A revoked or expired
*membership* removes it. They are different facts: listing a revoked membership
would tell a former employee which businesses they used to be able to reach.

### The join onto `tenants` is also an integrity guard

`businessesFor` inner-joins `tenants` for the name, which drops a membership
pointing at a business the registry has never heard of — a row `forTenant` would
refuse anyway, so it is better dropped here than surfaced as a switcher entry
that throws when picked.

### Provisioning: what the D1 batch now guarantees

`provisionInvite` previously wrote user + membership + entitlement in one
`DB.batch()`. Extracting `provisionBusiness` splits that, because the user
belongs to the person and the other two belong to the business:

- the user row is written first, on its own
- membership + grant go in `provisionBusiness`'s batch, so a business can never
  exist that nobody may operate or that carries no access

The failure this newly admits is a person with no business. It is **visible** —
they are refused `no_membership` — and it is made **repairable**: re-inviting
someone who holds no live business provisions one. That is not a second account,
because the account is the person and the person already existed; `created`
stays false. Re-inviting someone who *does* hold a business is unchanged — it
reports the first one they hold and writes nothing.

### `provisionBusiness` signature and refusals

```ts
provisionBusiness(env, {
  accountUserId, name, email?, plan?, startsAt?, endsAt?, grantedBy?, note?,
}): Promise<{ accountId, name, siteSlug }>
```

Role is always `owner` and is not a parameter: every business this creates is
created for the person who will own it, and a time-boxed `support` membership
([[DOC-40]] §6) is granted against an *existing* business, so it is a different
operation. An empty `accountUserId` or an empty `name` is refused, because
neither row can be repaired from the outside once written.

`InviteResult.accountId` stays **singular** and that asymmetry is deliberate: an
invite provisions one business, so reporting one id is reporting what happened.
It is admission — "which businesses may be operated" — where a singular answer
would be a guess.

## Test plan

`tests/test_UAT_FC_REQ-178_businesses.workers.test.ts`, in workerd against real
D1 with the deployed migrations, every business provisioned through the shipped
entry points rather than seeded:

- two businesses admitted, each with its own grant and its own `tenants.name`
- the admission object carries no `accountId`/`entitlement` key
- one lapsed among two — admitted, lapsed present, `selectable` false
- every business lapsed — refused `no_entitlement` (driven with two, so it
  cannot pass on code that stops at the first)
- revoked and expired memberships each excluded
- a suspended person holding a live business is still refused `user_inactive`
- invite-provisioned and `provisionBusiness`-provisioned businesses compared
  row-for-row out of D1
- a second business is immediately operable, with a starter page
- both provisioning refusals
- the re-invite repair

Regression scope: `tests/test_UAT_FC_REQ-167_identity.workers.test.ts` (19
tests, two updated for the new shape) and the whole `workers` vitest project
(26 files, 217 tests). The full suite has one pre-existing unrelated failure,
`tests/bug32-webui-scope-rebrand.test.ts`, which fails identically on the base
commit.


### A second commit: repairing a raced merge

`68db393777` is not part of the design above. Merging `free-REQ-178` into
`xgd-working` conflicted only on `package.json`'s version scalar, and another
session's `git commit` landed inside that conflicted merge — committing it
(as `6cddcbb1c4`, labelled for a different ticket) with the conflict markers
still in the file, which made `package.json` unparseable on `xgd-working`.

The repair resolves it to `0.2.51`, above both sides rather than either: the two
version bumps were independent, so neither is a superset of the other. It is
recorded on this ticket because this ticket's merge is what surfaced it and
there is no other commit for it to belong to; it changes no behaviour and needs
no UAT.
