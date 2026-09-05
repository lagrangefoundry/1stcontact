---
uid: request-3a032190
id: REQ-192
type: request
title: Regenerate the test data as a command, not as hand-written SQL
created_by: xgd
created_at: '2026-09-05T21:26:15.353111+00:00'
updated_at: '2026-09-05T23:45:10.090840+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: high
  story_points: 3
  auto_merge_back: true
  needs_review: false
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