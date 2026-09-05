---
uid: request-93cc89ff
id: REQ-185
type: request
title: platform_admin is two capabilities wearing one flag
created_by: xgd
created_at: '2026-09-04T23:51:48.220142+00:00'
updated_at: '2026-09-05T00:56:03.334410+00:00'
completed_at: null
last_field_updated: body
status: free_coding
fields:
  priority: medium
  story_points: 2
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-a924b82f
  depends_on:
  - REQ-184
---

# `platform_admin` is two capabilities wearing one flag

## The gap

[[DOC-42]] §10.3, and the [[DOC-40]] §6 amendment it drives. `users.platform_admin`
answers two questions that have nothing to do with each other:

- **Am I an owner of the 1st Contact business?** Not special in any way. Every
  business has an owner; a customer is the owner of theirs. This is
  `memberships.role = 'owner'`, and the table already holds it —
  `provisionBusiness` writes exactly that row for every business it creates.
- **May I enter a business I hold no membership on?** `scope.ts:237`. Genuinely
  special, and special because 1st Contact **hosts** the others ([[DOC-42]] §8),
  not because of any level or seniority.

Bundling them is [[DOC-40]] §2.1 rule 1's shape: a platform-only flag standing in
for a capability every business owner needs. The cost is not theoretical —
[[REQ-170]] is the first surface to inherit it, and a hand reading the flag as
"admins get extra pages" will build a generic privileged-surface mechanism rather
than the two conditions [[DOC-42]] §7 actually describes.

## What replaces it

**The ownership half moves to `memberships.role`.** The 1st Contact business gets
an `owner` membership like every other business, and "may I use the controls this
business's product needs" is answered the same way for every business.

**The hosting half keeps a column, and the column gets an honest name.** Entry
without membership is real, it is ours alone, and [[DOC-40]] §7 parks its general
form. What it must stop doing is doubling as a statement about ownership. The
name is worth deciding rather than defaulting — `platform_operator` says what it
does; `platform_admin` retained for just this half would leave the old reading
available to anyone who does not read this ticket.

**`PLATFORM_ADMINS` stays exactly as [[DOC-40]] §6 argues.**

## The bootstrapping constraint is the hard part

[[DOC-40]] §6's defence of an ambient flag is load-bearing and this ticket must
not break it:

> it works before any membership row exists, and it cannot lock its holder out of
> the system that grants it

Moving ownership to `memberships.role` puts it behind a row — and a missing row
is precisely the lockout §6 exists to prevent. So the env var has to remain able
to confer **both** halves, not just the bypass: a holder of `PLATFORM_ADMINS`
must be able to operate the 1st Contact business on a database where their
membership row does not yet exist, and the act of using it should leave the row
behind rather than depend on it forever.

`0005_operator_membership.sql` already writes that membership idempotently by
`WHERE NOT EXISTS` against a looked-up user id, which is the shape this needs.

## What this does not change

- **`scope.ts:237`'s behaviour.** The bypass is over membership only; the grant is
  still required, a deactivated business is still refused, and what comes back is
  an ordinary business handle indistinguishable from the owner's. That design is
  correct and this ticket only changes what the check reads.
- **Time-boxed `support` memberships.** [[DOC-40]] §6 says they are the answer the
  moment there is a second operator and that they need no migration. Still true,
  still not now.
- **[[REQ-170]].** It does not depend on this. [[DOC-42]] §7's two conditions
  select exactly the set the flag selects today, so the User tab's gate can be
  modelled correctly whether or not this has landed — it is just written against
  a cleaner check afterwards.

## Acceptance

- No single predicate answers both "is this person an owner here" and "may this
  person enter a business they are not a member of".
- Owning the 1st Contact business is expressed the same way as owning any other
  business, and a UAT asserts the two are indistinguishable to a caller.
- A holder of `PLATFORM_ADMINS` can operate the 1st Contact business against a
  database carrying no membership row for them, and is not locked out by the
  absence — asserted, because this is the property [[DOC-40]] §6 exists to
  protect.
- The bypass's existing refusals are unchanged: no grant still refuses, a
  deactivated business still refuses, and the handle it returns still carries no
  extra scope.
- Whatever the retained column is called, no reader treats it as a statement
  about ownership.
## How it lands

The decisions above leave a handful of mechanical consequences. They are written
down here because each one is asserted, and a UAT with no sentence behind it is
indistinguishable from drift.

**The rename is a migration, ordered after [[REQ-184]]'s.** That ticket renames
`memberships.account_id` to `business_id` — the very column the ownership half
moves onto — so the two cannot be reordered. `ALTER TABLE ... RENAME COLUMN`
carries no `IF NOT EXISTS`, which breaks 0003–0005's convention; what makes that
safe is that `wrangler d1 migrations apply` records what it has run. `0004` and
`0005` keep naming the old column, because they are history and ran against a
schema where it had that name. A suite re-applying `0005` maps the rename forward,
which is the form [[REQ-184]] already established.

**`PLATFORM_ADMINS` is deployment configuration, declared on both sides of the
inheritance line and empty by default.** A named wrangler environment inherits no
vars, so a break-glass key declared once is one that does not exist in production
— discovered at the only moment it is ever reached for. Empty means nobody, for
the reason an unset `ACCESS_TEAM_DOMAIN` means deny; a value checked in would be
a standing grant no `memberships` row records.

**The seed runs inside `admit`, before the user lookup, and is idempotent.**
Before the lookup because the lockout it repairs includes having no `users` row
at all. Idempotent because every admission by a holder runs it, so a second
membership row per login would corrupt the table admission is decided from. It
writes rows and does not synthesise an admission: the holder is then admitted by
the same reads as everybody else, against rows that are now there. `admit`
otherwise still creates nothing — the exception is bounded by the var and by
nothing else, and an address the var does not name is refused exactly as before.

**The admitted business carries its `role`.** That is what lets ownership be read
without a second query that could disagree with the one admission was decided
from, and it is `null` exactly on the bypass path — so entering a business you
host can never be read back as owning it. It is unconstrained text, like `plan`
and `status`, so a role added when seats land is a code change and not a
migration.

**[[REQ-180]]'s reader-count guard tightens rather than moving.** It held the
count at two while the column was one column, explicitly so this split would be
cheap; with the split made, the retained column has exactly one reader and no
route among them. Two of its UATs are renamed to say one where they said two.
