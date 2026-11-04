---
uid: story-5b5be809
id: STORY-170
type: story
title: 'Local dev fixture: seed a known cast of people and sign in as them without
  Cloudflare'
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T18:16:25.000890+00:00'
updated_at: '2026-11-04T18:16:25.000890+00:00'
completed_at: null
last_field_updated: created_at
status: unplanned
fields:
  intent_uid: bundle-5052a63c
  capability_uid: capability-c19c05c5
  story_kind: feature
  story_points: 2
---

## Story
**As a** developer working on 1st Contact from a fresh clone, **I want** one command that fills my local store with a known cast of people and businesses, and a local stand-in for Cloudflare Access that lets me sign in as any of them, **so that** I can look at and exercise the identity-shaped parts of the product (the switcher, the Users tab, the terms gate, several addresses, several names) without a Cloudflare account and without typing SQL by hand.

## Description
Two developer tools, delivered together by REQ-192 (with REQ-193's seeded names):

**`bin/seed`** applies a written-down development fixture to the control app's D1. It targets the local D1 unless `--remote` is typed explicitly. Re-running it changes nothing. On success it prints a report: who was seeded, what was deliberately not seeded (the platform operator, any site), and how to sign in. The cast covers states that nothing reachable by clicking produces:

| Persona | State |
| --- | --- |
| Alice (`alice@plumbing.example`, primary; `alice@oldsalon.example`, not primary) | one person with two addresses; signed up at the current terms; a user of the deployment's own business with **no** membership on it |
| Alice's Plumbing / Alice's Lettings | two businesses on Alice's one account, each with an open-ended grant |
| Alice's Old Salon | a third business whose grant has ended: present, but cannot be selected |
| Bob (`bob@example.com`) | in Alice's Plumbing: invited and signed up |
| Carol (`carol@example.com`) | in Alice's Plumbing: invited, never came |
| Dave (`dave@example.com`) | in Alice's Plumbing: a lead, never invited |

The people also carry REQ-193's name shapes: a title, a known-as, a former name and a corrected name (Alice); a supersession with no reason (Bob); a mononym (Carol); and no known-as (Dave).

**`bin/access-sim`** is a loopback server that publishes a JWKS and mints RS256 Access-shaped tokens (30-day default lifetime). Pointing `ACCESS_TEAM_DOMAIN`/`ACCESS_AUD` at it with `--print-env` means the Worker's real verifier checks every token. `/login` lists every address in the local store and sets the `CF_Authorization` cookie for the one picked. `/mint?email=` returns a bare token.

`apps/control-app/ACCESS.md` points to both tools next to the real Access settings.

**In scope:** the seed command, its fixture contents, its safety defaults, the simulator, and the ACCESS.md pointer.
**Out of scope:** site content (the businesses come up empty; `1c push` adds a site), the automated suites' own per-test fixtures, and bringing up a platform operator (`PLATFORM_ADMINS` does that).

## Technical Context
- The fixture is SQL (`db/dev-seed.sql`) fed to `wrangler d1 execute --file` by `bin/seed`. It sits beside `db/migrations/`, not inside it, so it is never applied to an environment as a migration.
- Idempotence comes from fixed, opaque, 128-bit prefixed primary keys (`usr_`, `acct_`, `biz_`, `eml_`, `nam_`, `mem_`, `ent_`) plus `INSERT OR IGNORE` on every statement.
- Alice's `users` row lands in the tenant that `wrangler.toml`'s `TENANT_ID` names. Seeded members carry the current `TERMS_VERSION`, so `guardTerms` admits them.
- The simulator exercises the real gate described by CAP-103 (Operator Access Gate). `access.ts` accepts an `http://` team domain and verifies `aud`, `iss`, `exp`, `nbf` and `iat` against the published key. Nothing in the Worker is stubbed.
- The seeded identity rows use the data model of CAP-114 (Accounts, Membership & Entitlement) and of plan items 3–4 (user_emails, user_names, accounts).
- Bob, Carol and Dave belong to Alice's business, not to the deployment. If one of them signs in, `admit` answers `no_user`. That is the product's honest answer, not a defect in the fixture.
- Security: the fixture's invented people must never reach a real deployment by default. The simulator cannot authenticate against a deployed Worker, because its keys are generated at boot and served only from loopback.

## Reconciliation Decisions
- **Seed is SQL, not product entry points** (decided at reconciliation, 2026-11-04): REQ-192's original body required the seed to go through `provisionBusiness`/invite/`openGrant`. The 2026-09-06 "Simplified" section explicitly withdraws that requirement and the two-phase design. The latest intent governs, so the code agrees with intent. No AC asserts entry-point usage.
- **No "missing second address" gap report** (decided at reconciliation, 2026-11-04): an intermediate section required `bin/seed` to print REQ-191 as an outstanding gap. The later "Correction, 2026-09-06" section deletes that report because REQ-191 landed. The code matches the correction.
- **Unknown arguments are refused with exit 2** (decided at reconciliation, 2026-11-04): intent is silent. The landed runner rejects any argument other than `--local`, `--remote` and `--help`, and writes nothing. A typo such as `--remtoe` must never fall through to some default target, so this is formalized as part of the target-selection AC.
- **A remote run warns on stderr** (decided at reconciliation, 2026-11-04): intent requires `--remote` to be typed but is silent about a warning. The code prints a warning that the fixture is going into the database real customers use. Formalized with the remote-target AC because it is the visible half of the safety property.
- **Failure guidance** (decided at reconciliation, 2026-11-04): intent is silent. When wrangler refuses the fixture (typically because the schema was not applied), the runner prints wrangler's output plus the migrations-apply command and exits 1. Wrangler's per-statement output is held back on success. Formalized as its own failure-path AC.
- **`/mint` endpoint and empty-store fallback on `/login`** (decided at reconciliation, 2026-11-04): intent names `/login` and says a missing store "degrades to the manual path", but does not specify the bare-token endpoint. The code serves `/mint?email=` (400 without `email`), which the suites and curl use. Formalized as part of the minting AC. The empty-list fallback is formalized as stated in intent.
- **Every address, not one per person, on `/login`** (from the 2026-09-06 correction): formalized directly. The listing must read the address table, so Alice's two addresses both appear, adjacent, with the primary first.

## Dependencies
- Plan item 3 — Person identity: addresses & names (REQ-191, REQ-193)
- Plan item 4 — Accounts (REQ-194)

## Story Points
2
