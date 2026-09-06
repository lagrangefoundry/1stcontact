---
uid: request-3a032190
id: REQ-192
type: request
title: Regenerate the test data as a command, not as hand-written SQL
created_by: xgd
created_at: '2026-09-05T21:26:15.353111+00:00'
updated_at: '2026-09-06T19:43:45.216782+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  story_points: 3
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-33d260ac
  commits:
  - working_sha: 3d9529a4913eeecc0d6084bb2759170c9e2744d4
    reconcile_sha: null
    main_sha: null
  - working_sha: a89fc80a4304a1f7afd7972025ba81fd172b7e33
    reconcile_sha: null
    main_sha: null
  - working_sha: 7c25b0c830f5bd55912919df264db0e583279214
    reconcile_sha: null
    main_sha: null
  version: 0.2.113
---

# Regenerate the test data as a command, not as hand-written SQL

The rebaseline ([[REQ-190]]) wipes every store, so the data has to come back.
Today it cannot: what is in the local D1 arrived from migration `0005`, a test
fixture, and a series of `wrangler d1 execute` statements typed into a terminal
during [[CHAT-23]]. None of that is repeatable and none of it is written down.

## What is wrong with the current situation

- **`alice@plumbing.example` and `bob@example.com` were inserted by hand**, to
  demonstrate the [[DOC-42]] §1 example, because there was no way to create a
  person through any surface. [[REQ-186]] fixed the invite; the seed was never
  written.
- **Migration `0005` is not test data and is being confused with it.** It seeds
  the operator's membership on the platform business and exists to stop
  [[REQ-168]] locking the operator out of the live deployment. It belongs in the
  baseline ([[REQ-190]]), not here. Seeding it twice, or dropping it as
  "fixtures", are both wrong.
- **There is no way to get a working local stack from a fresh clone**, which is
  the thing this ticket is actually for.

## What the seed must produce

The [[DOC-42]] §1 cast, because it is the example every part of the model is
argued against — and the states that are otherwise only reachable by accident:

| Persona | Level | Exercises |
| --- | --- | --- |
| the operator | 0 | owns the platform business; the fulfilment control |
| Alice | 1 | a member with her own business; the switcher, her own Users tab |
| a second business for Alice's account | 1 | [[REQ-178]]'s several-businesses-per-account |
| Bob | 2 | a member of Alice's business; the level-2 door |
| someone invited who never signed up | — | [[REQ-188]]'s middle state |
| a contact never invited | — | the Contact state, and the CRM/Users overlap |
| a lapsed entitlement | — | a business present and unselectable ([[REQ-178]]) |
| a person with two addresses | — | [[REQ-191]]'s table, including a non-primary one |

The last three are the point. They are the states that are hard to reach by
clicking, easy to break, and currently untested by anything a human looks at.

## Shape

A **command**, not a SQL file: it goes through the same entry points the product
uses — the invite, `provisionBusiness`, `openGrant` — so a seed that succeeds is
evidence those paths work, and a seed that breaks when they change is a signal
rather than drift. A SQL file would keep working long after the code it describes
had stopped agreeing with it.

Idempotent, so re-running it is safe, and explicit about being development-only:
it mints live grants and would be a provisioning bypass anywhere else.

## The login half

Seeded personas are useless if nobody can sign in as them. Local dev has two
modes and neither currently gets you a *person*: `ACCESS_DEV_OPEN` skips identity
entirely and resolves the scope from `TENANT_ID`, and the configured path needs a
real Cloudflare Access token.

[[CHAT-23]] worked around this with a throwaway local Access simulator — a JWKS
endpoint plus a token minter, pointed at by `ACCESS_TEAM_DOMAIN`, which exercises
the *real* gate (`access.ts` accepts an `http://` team domain) with tokens we
mint. It lives in `.xgd/tmp/` and will be lost.

Whether that becomes a supported dev tool is this ticket's one open decision. It
is the difference between a seed you can look at and a seed you can only query.
Recommend yes, alongside the seed, and recorded in `apps/control-app/ACCESS.md`
next to the real settings.

## Not in scope

- Site content. Whatever starter site `provisionBusiness` already creates is
  enough; this is identity fixtures, not a demo corpus.
- The automated suites' own fixtures, which build what they need per test and
  should not start depending on a shared seed.

## Acceptance

- one command, from a fresh clone and an empty D1, produces a working local stack
- the seed uses the product's own entry points, not direct SQL
- re-running it changes nothing
- every persona and every state in the table above is present
- each persona can be signed in as, locally, without a Cloudflare account
- the operator seed is **not** duplicated here; it comes from the baseline


## The Access simulator: decided, 2026-09-05

It is `bin/access-sim`, alongside `bin/access-token` — the one provisions a real
service token, the other stands in for the whole gate locally. This closes the
open decision above.

It exercises the **real** gate rather than bypassing it: `access.ts` verifies
RS256 against the JWKS at `<ACCESS_TEAM_DOMAIN>/cdn-cgi/access/certs` and
`normaliseTeamDomain` accepts an `http://` prefix, so every signature, `aud`,
`iss` and expiry check runs against keys this process minted. Nothing in the
Worker is stubbed or branched.

`--print-env` emits the two vars to layer over `.dev.vars`, and `/login` lists
whoever the local D1 actually holds — read through `wrangler d1 execute` rather
than by opening the SQLite file, so the list cannot drift from the store and a
missing store degrades to the manual path.

Tokens default to 30 days, per [[BUG-52]]: a test session that expires inside a
sitting makes every bug look like the harness running down.

This ticket still owns the seed the simulator signs people in to, and
`apps/control-app/ACCESS.md` should gain a pointer to it.


## Two corrections, 2026-09-05 ([[CHAT-23]])

**The operator seed is gone, not relocated.** This ticket previously said `0005`
was not test data and would come from the baseline. [[REQ-190]] now drops it
entirely: [[REQ-185]]'s `PLATFORM_ADMINS` bootstrap writes the tenant, the user,
the membership and the entitlement, from configuration, without hardcoding an
address. Bringing a deployment up is: set the var, sign in once, empty it. This
ticket seeds nobody privileged and should say so.

**One real artefact has to survive the wipe: the `xgd` site.** Everything else in
the stores is disposable ([[CHAT-23]]).

It is already safe, and this ticket's job is to prove that rather than assume it.
The file-backed store at `storage/sites/xgd/` holds a draft — `site.json`, `pages/`
and 9 assets, last edited 2026-09-01 — which is **newer** than the two published
revisions in D1 (2026-08-21, "hello cloud" and "live edit", 9 assets). So the
current content lives outside the database and `1c push` restores it.

What a wipe does destroy is the two revision *records*: the stamps, messages and
`based_on` chain. That is history, not content, and it is accepted.

A cheap guard is worth more than the assurance: **capture the draft before the
wipe and diff it after the re-push**, so "the site came back" is a check rather
than a look.

## Added acceptance

- the `xgd` site is present and byte-identical after a wipe, baseline and reseed,
  restored from the file-backed store rather than from D1
- the seed creates no platform operator; `PLATFORM_ADMINS` is the documented way
  to bring up an empty deployment


## The bootstrap phase cannot go over HTTP

Established 2026-09-05 ([[CHAT-23]]), and it follows from [[REQ-190]] dropping the
operator seed.

After the wipe and the baseline the database is empty. Every privileged route
needs an `admission`, and `admit` needs a `users` row to produce one — so with no
rows, `/api/admin/businesses` answers 404 and `/api/people/invite` answers 403.
A seed that drives the product over HTTP **cannot make its first call**: there is
nobody to authenticate as. Migration `0005` used to paper over this by putting the
operator in the database ahead of everything; nothing does now, deliberately.

**The escape is that the gates are in the router, not the functions.**
`provisionBusiness`, `invitePerson`, `openGrant` and `ensurePlatformOperator` are
all exported and contain no permission checks — the checks live at `router.ts`
(`ownsPlatformBusiness`, `ownsBusiness`). So an in-process caller with a `DB`
binding can write the first rows, which is exactly how the suites already work.

### Two phases, one command

**Phase 1 — in process, and exactly one call.** `ensurePlatformOperator(env,
address)` writes the tenant, the `users` row, the membership and the entitlement.
It is the same function [[REQ-185]]'s break-glass path invokes, so the seed is not
a second definition of what an operator is — it is the same one, reached without
the var.

**Phase 2 — over HTTP, as that operator**, with a token from `bin/access-sim`.
Every business, invite and grant after the first goes through the real route and
the real gate.

**One command, not two scripts**, and the reason is not tidiness. Two scripts is
one that can be run without the other, or in the wrong order, and the failure is a
half-seeded store that looks seeded. It also keeps this ticket's existing promise
— *one command, from a fresh clone and an empty D1* — literally true.

### Why phase 2 is worth the trouble

An in-process seed all the way through would be simpler and would prove less.
This ticket's rationale is that *a seed which succeeds is evidence those paths
work* — and calling the functions is evidence the **functions** work, not the
routes or their gates.

The gates are the part most likely to be wrong. [[REQ-186]] names substituting
`ownsPlatformBusiness` for `ownsBusiness` as the mistake most likely to be made,
and this session found exactly that substitution once already. A seed that never
issues an HTTP request would never catch it.

So phase 1 is kept to the single call that cannot be made any other way, and
everything reachable over HTTP goes over HTTP.

### The operator address is a parameter

Not a literal in the seed. Hardcoding it here is the same defect [[REQ-190]] just
removed from the migration, with a smaller blast radius but the same shape: a
personal address baked into a path that runs in every environment. A flag or an
env var, defaulted to nothing.

## Added acceptance

- the seed is one command; there is no second script an operator must remember
- phase 1 makes exactly one in-process call, `ensurePlatformOperator`, and writes
  nothing else directly
- every persona, business, invite and grant after the operator is created over
  HTTP through the routes a person would use
- the seed refuses to run against a store that already has an operator, rather
  than half-seeding it
- the operator address is supplied, not hardcoded



## Simplified, 2026-09-06: a SQL file and a runner

The two-phase design above is withdrawn. It is over-built for what this is: a
development fixture that most people will run once, on a laptop, to get a stack
worth looking at. What replaces it is a **SQL file and a shell script that feeds
it to `wrangler d1 execute`** — `db/dev-seed.sql` and `bin/seed`.

**"Through the product's own entry points" is downgraded from a requirement to a
preference, and here it is not taken.** The argument for it stands — a seed that
succeeds is evidence those paths work — but the price is a two-phase command that
needs a running Worker, a minted Access token, a bootstrapped operator and an
in-process D1 binding held by a second process, all so that a fixture can be
written. That is a lot of machinery to maintain for something whose failure mode
is "the test data looks wrong", which is visible immediately. The routes are
covered by [[REQ-180]]'s, [[REQ-186]]'s and [[REQ-188]]'s own suites, which is
where evidence about a route belongs.

So `phase 1` / `phase 2`, the in-process `ensurePlatformOperator` call, and the
"one command, no second script" argument built on top of them are all dropped.
The added acceptance clauses that describe them are superseded by this section.

### What the seed writes

Identity rows only, straight into the tables. Fixed, opaque primary keys —
`usr_…`, `acct_…`, `mem_…`, `ent_…`, minted once and written down — so that
`INSERT OR IGNORE` is the whole of the idempotence and no `WHERE NOT EXISTS`
scaffolding is needed. Fixed rather than random is the one place this file
departs from the baseline's rule, and it departs from the *minting* half only:
the values still carry no meaning and are still never parsed.

| Persona | Where | State |
| --- | --- | --- |
| Alice, `alice@plumbing.example` | a `users` row in the deployment's own business | signed up — she accepted the terms |
| Alice's Plumbing | a business | Alice owns it, with an open-ended grant |
| Alice's Lettings | a second business | the same account, a second business ([[REQ-178]]) |
| Alice's Old Salon | a third business | its grant ended — present and unselectable |
| Bob, `bob@example.com` | a `users` row in Alice's Plumbing | invited, and signed up |
| Carol, `carol@example.com` | a `users` row in Alice's Plumbing | invited, and never came |
| Dave, `dave@example.com` | a `users` row in Alice's Plumbing | a lead — never invited |

Alice holds **no membership on the 1st Contact business** and signs in every day,
which is [[DOC-42]] §4's correction stated as data rather than as prose.

### What it does not write, and says so

- **No platform operator.** `PLATFORM_ADMINS` is the way in, unchanged. Nothing
  in the seed sets `platform_operator` or writes a membership on the deployment's
  own business.
- **No second address for anybody.** [[REQ-191]]'s `user_emails` table does not
  exist yet, so that row of the cast is not reachable by any means, SQL included.
  `bin/seed` prints this as an outstanding gap on every run, naming the ticket, so
  that it stays visible rather than being quietly absent.
- **No sites.** Identity fixtures, not a demo corpus — the businesses come up
  empty and `1c push` puts a site in one. `bin/seed` prints that as the next step.

### The runner

`bin/seed` runs one `wrangler d1 execute DB --file db/dev-seed.sql`, against the
local D1 by default and against the remote one only when `--remote` is typed. It
prints what it wrote, the gap above, and what to do next. `--help` says all of it.

Local by default is a safety property rather than a convenience: a fixture
carrying `alice@plumbing.example` reaching a real deployment is the same defect
[[REQ-190]] just took out of migration `0005`, so the destructive target has to be
named out loud.

### The Access simulator

`bin/access-sim` is committed under this ticket, as the section above decided. It
is what makes the seeded people reachable: a JWKS endpoint and a token minter on
loopback, pointed at by `ACCESS_TEAM_DOMAIN`, so `access.ts` verifies a real RS256
signature against keys this process published. A UAT mints through it and verifies
with `verifyAccessJwt` itself, so the claim that it exercises the real gate rather
than bypassing it is checked rather than asserted.

`apps/control-app/ACCESS.md` gains the pointer to both, as this ticket already
promised.

### Superseded acceptance

These clauses described the two-phase command and go with it:

- ~~the seed is one command; there is no second script an operator must remember~~
- ~~phase 1 makes exactly one in-process call, `ensurePlatformOperator`~~
- ~~every persona, business, invite and grant after the operator is created over HTTP~~
- ~~the seed refuses to run against a store that already has an operator~~
- ~~the operator address is supplied, not hardcoded~~ — nothing seeds an operator, so
  there is no address to supply

### Acceptance, as it now stands

- one command — `bin/seed` — populates an empty local D1 with the cast above
- re-running it changes nothing
- every persona the schema can hold is present; the one it cannot is named on
  every run rather than silently missing
- each seeded person can be signed in as locally, without a Cloudflare account,
  through `bin/access-sim` — and where the product refuses them, the refusal is
  the product's honest answer and not a defect in the fixture
- the seed creates no platform operator
- the seed writes to the local D1 unless `--remote` is typed



## Correction, 2026-09-06: REQ-191 landed, so the cast is complete

The section above said a person with two addresses could not be written by any
means. That was true when it was written and stopped being true during the same
session: [[REQ-191]] merged, `users.email` is gone, and `user_emails` holds the
addresses. The gap is closed and the "still missing" report `bin/seed` was to
print is deleted rather than kept as a paragraph nobody re-reads.

**Alice holds two addresses**, `alice@plumbing.example` (primary) and
`alice@oldsalon.example` (not primary), and that is the row of the cast with the
least else covering it. [[REQ-191]] moved the address off `users` precisely so
that one human could hold several, and nothing reachable by clicking produces the
state — so the claim was asserted by the schema and demonstrated by nothing. Two
things follow and both are checked:

- reached at either address, Alice is the **same `users` row**, holding the same
  three businesses. That is what the table bought: before it, a second address
  was a second human who could never be reconciled with the first
- the primary is still the one **shown**. Signing in at the secondary must not
  silently relabel her, because `PRIMARY_EMAIL_SQL` is one definition site and two
  answers to "which address is hers" is what it exists to prevent
- `is_primary` is set on one and clear on the other. Two primaries violates
  `idx_user_emails_one_primary`, and zero is legal but falls back to the oldest
  address — so one-and-one is the state the detail panel is built to render, and
  the state worth seeding

### The simulator was already broken by it

`bin/access-sim` listed the people to sign in as with `SELECT email FROM users`,
which [[REQ-191]] made a query against a column that no longer exists. It failed
silently, because `knownPeople` swallows a failure by design so that a missing
store degrades to the manual path rather than to a broken page — the degradation
is right, and it hid a real break: the page kept rendering and simply stopped
listing anybody.

It reads `user_emails` now and offers **every** address rather than one per
person, because signing in as the same human at their second address is exactly
the thing that is newly possible. A regression guard pins the query text, since
the one reader that cannot report its own failure is the one that needs it.

## Three properties the implementation added

Each is a consequence of the shape above rather than a new requirement, and each
has a check, so they are written down here rather than discovered later.

- **The seed is not a migration, and must never become one.** `db/migrations/` is
  applied to every environment forever, which is precisely what made `0005` a
  defect. `db/dev-seed.sql` sits beside that directory and is reached only by
  typing the command.
- **The seed names the tenant `wrangler.toml` configures.** Alice's row has to
  land in the business `TENANT_ID` names or she is a person in a tenant this
  deployment never asks about — rows that look perfect and admit nobody. Nothing
  about the value is derivable, so the two literals are compared.
- **A seeded member has accepted the CURRENT terms.** `needsAcceptance` compares
  the stored `tos_version` against `TERMS_VERSION`, not merely the presence of a
  stamp, so a seed carrying an older string produces somebody who is signed up and
  still refused by `guardTerms` — which reads as a broken fixture rather than as
  the re-acceptance it is. Bumping the terms is when this rots, so the two are
  pinned together.

And one for the simulator: **a wrong `aud` is still refused.** "The minted token
passed" is equally consistent with a verifier that checks nothing, so the same
token is put through the same verifier under a different audience and has to fail.
Without that case the claim that the real gate runs is untested.

## Also landed here

- `bin/access-sim` is committed, per the decision above, with
  `apps/control-app/ACCESS.md` gaining the section that explains it beside the
  real settings — including that `PLATFORM_ADMINS` is how somebody privileged
  comes to exist, since the seed creates nobody.
- `.dev.vars` and `.dev.vars.*` are gitignored. `--print-env` writes
  `.dev.vars.local`, and local Access configuration does not belong in the repo.

## Acceptance, final

- one command — `bin/seed` — populates an empty local D1 with the cast
- re-running it changes nothing, asserted as whole rows and not as "it did not error"
- every persona and every state in the table is present, including the two addresses
- each seeded person can be signed in as locally through `bin/access-sim`, without
  a Cloudflare account; where the product refuses them, the refusal is the
  product's honest answer and not a defect in the fixture
- the seed creates no platform operator and confers no hosting capability
- the seed writes to the local D1 unless `--remote` is typed