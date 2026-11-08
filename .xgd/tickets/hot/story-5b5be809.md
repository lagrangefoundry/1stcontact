---
uid: story-5b5be809
id: STORY-170
type: story
title: 'Local dev fixture: seed a known cast of people and sign in as them without
  Cloudflare'
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T18:16:25.000890+00:00'
updated_at: '2026-11-08T02:03:05.338384+00:00'
completed_at: null
last_field_updated: story_kind
status: completed
fields:
  intent_uid: bundle-5052a63c
  capability_uid: capability-c19c05c5
  story_kind: upgrade
  story_points: 3
---

## Story
**As a** developer working on 1st Contact from a fresh clone, **I want** one command that fills my local store with a known cast of people and businesses, and a local stand-in for the Cloudflare Access edge that lets me sign in as any of them, push sites in with the same service-token pair production uses, and sign out again, **so that** I can look at and exercise the identity-shaped parts of the product (the switcher, the Users tab, the terms gate, several addresses, several names, sign-out) and refill a wiped local store without a Cloudflare account and without typing SQL by hand.

## Description
Two developer tools, delivered together by REQ-192 (with REQ-193's seeded names), with the simulator extended into an edge by BUG-59 and REQ-204:

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

**`bin/access-sim`** is a loopback server that plays both halves of Cloudflare Access: the issuer and the edge.

- *Issuer.* It publishes a JWKS at `/cdn-cgi/access/certs` and mints RS256 Access-shaped tokens (30-day default lifetime) in the two shapes Cloudflare mints: a person's token carries `email`; a service token carries `common_name` and no email. `--print-env` emits the Worker settings that point the real verifier at it (`ACCESS_TEAM_DOMAIN`, `ACCESS_AUD`) and the `SERVICE_TOKEN_IDENTITIES` line that maps the local service token's name to a person. `/login` lists every address in the local store and sets the `CF_Authorization` cookie for the one picked. `/mint?email=` returns a bare person token.
- *Edge.* Every other path is reverse-proxied to the `--builder` origin (default `http://127.0.0.1:8788`). A request carrying the simulator's `CF-Access-Client-Id`/`CF-Access-Client-Secret` pair (well-known defaults, overridable with `--client-id`/`--client-secret`, printed by `--print-token` for `eval`) is forwarded with a freshly minted `cf-access-jwt-assertion` and without the pair. A wrong pair is refused with 403 and never forwarded; half a pair is treated as no pair. A `CF_Authorization` cookie is forwarded untouched. A request with no credential is answered 302 to `/login`. `/cdn-cgi/access/logout` clears the cookie `/login` set and redirects to `returnTo` only when it is on the fronted builder's origin, otherwise to the builder.

So `bin/publish --origin <simulator>` reaches a gated local builder exactly as a production push reaches the deployed edge, and the builder's Sign out (REQ-204) has a local edge to end the Access session at.

`apps/control-app/ACCESS.md` points to both tools next to the real Access settings.

**In scope:** the seed command, its fixture contents, its safety defaults, the simulator (issuer, edge proxy, service-token exchange, logout), and the ACCESS.md pointer.
**Out of scope:** site content (the businesses come up empty; `1c push` adds a site), the automated suites' own per-test fixtures, bringing up a platform operator (`PLATFORM_ADMINS` does that), the Worker's own resolution of `SERVICE_TOKEN_IDENTITIES` (owned by the Operator Access Gate story), and the Worker's `POST /sign-out` destination choice (owned by the sign-out story).

## Technical Context
- The fixture is SQL (`db/dev-seed.sql`) fed to `wrangler d1 execute --file` by `bin/seed`. It sits beside `db/migrations/`, not inside it, so it is never applied to an environment as a migration.
- Idempotence comes from fixed, opaque, 128-bit prefixed primary keys (`usr_`, `acct_`, `biz_`, `eml_`, `nam_`, `mem_`, `ent_`) plus `INSERT OR IGNORE` on every statement.
- Alice's `users` row lands in the tenant that `wrangler.toml`'s `TENANT_ID` names. Seeded members carry the current `TERMS_VERSION`, so `guardTerms` admits them.
- The simulator exercises the real gate described by CAP-103 (Operator Access Gate). `access.ts` accepts an `http://` team domain and verifies `aud`, `iss`, `exp`, `nbf` and `iat` against the published key. Nothing in the Worker is stubbed.
- The seeded identity rows use the data model of CAP-114 (Accounts, Membership & Entitlement) and of plan items 3–4 (user_emails, user_names, accounts).
- Bob, Carol and Dave belong to Alice's business, not to the deployment. If one of them signs in, `admit` answers `no_user`. That is the product's honest answer, not a defect in the fixture.
- Security: the fixture's invented people must never reach a real deployment by default. The simulator cannot authenticate against a deployed Worker, because its keys are generated at boot (`kid` carries the pid, so a restart is seen as a key rotation) and served only from loopback.
- Service-token name: the minted `common_name` is the client id with a trailing `.access` removed (Cloudflare's convention), so the default pair `local-dev.access` acts as `local-dev`. The address it maps to defaults to the first `PLATFORM_ADMINS` entry, read from `apps/control-app/.dev.vars` ahead of `wrangler.toml` (the Worker's order), overridable with `--service-email`. `--print-env` and the running simulator must be given the same flags to agree; the startup banner prints the mapping the running process would exchange.
- The well-known default pair is not a weakening: `/mint` already hands out a token for any address with no credential, and the listener binds to loopback (BUG-59 §6).

## Reconciliation Decisions
- **Seed is SQL, not product entry points** (decided at reconciliation, 2026-11-04): REQ-192's original body required the seed to go through `provisionBusiness`/invite/`openGrant`. The 2026-09-06 "Simplified" section explicitly withdraws that requirement and the two-phase design. The latest intent governs, so the code agrees with intent. No AC asserts entry-point usage.
- **No "missing second address" gap report** (decided at reconciliation, 2026-11-04): an intermediate section required `bin/seed` to print REQ-191 as an outstanding gap. The later "Correction, 2026-09-06" section deletes that report because REQ-191 landed. The code matches the correction.
- **Unknown arguments are refused with exit 2** (decided at reconciliation, 2026-11-04): intent is silent. The landed runner rejects any argument other than `--local`, `--remote` and `--help`, and writes nothing. A typo such as `--remtoe` must never fall through to some default target, so this is formalized as part of the target-selection AC (AC-2313).
- **A remote run warns on stderr** (decided at reconciliation, 2026-11-04): intent requires `--remote` to be typed but is silent about a warning. The code prints a warning that the fixture is going into the database real customers use. Formalized in AC-2313 because it is the visible half of the safety property.
- **Failure guidance** (decided at reconciliation, 2026-11-04): intent is silent. When wrangler refuses the fixture (typically because the schema was not applied), the runner prints wrangler's output plus the migrations-apply command and exits 1. Wrangler's per-statement output is held back on success. Formalized as AC-2315.
- **`/mint` endpoint and empty-store fallback on `/login`** (decided at reconciliation, 2026-11-04): intent names `/login` and says a missing store "degrades to the manual path", but does not specify the bare-token endpoint. The code serves `/mint?email=` (400 without `email`), which the suites and curl use. Formalized in AC-2318. The empty-list fallback is formalized as AC-2321, as stated in intent.
- **Every address, not one per person, on `/login`** (from the 2026-09-06 correction): formalized directly. The listing must read the address table, so Alice's two addresses both appear, adjacent, with the primary first (AC-2320).
- **The `xgd` site restore clause is an operator check, not a seed criterion** (decided at reconciliation, 2026-11-04, BUNDLE-37 review report-d91ea163). REQ-192's 2026-09-05 *Added acceptance* says the `xgd` site is present and byte-identical after a wipe, baseline and reseed, restored from the file-backed store rather than from D1. That clause describes an operator recovery procedure on real data: capture the draft, wipe, apply the baseline, `1c push` the file-backed `xgd` draft, then diff. It is not behaviour of `bin/seed`. The 2026-09-06 simplification limits the seed to identity rows written by a SQL fixture, and the seed neither writes nor reads any site. No code in this bundle automates the capture-and-diff guard, so the clause is not in *Acceptance, final* and has no AC. `1c push` itself is covered by its own story.
- **Part one's address-bound service token is superseded by part two** (decided at reconciliation, 2026-11-07, BUNDLE-39): BUG-59 part one had the simulator mint an `email` token for its pair. Part two ("And the simulator stops deviating") explicitly replaces that with the faithful `common_name`-only shape plus the `--print-env` mapping line. The latest section governs and the code matches it; no AC asserts an email claim on an exchanged token.
- **The `/login` redirect-on-no-credential applies to proxied paths only** (decided at reconciliation, 2026-11-07): the simulator's own paths (`/cdn-cgi/access/certs`, `/login`, `/mint`, `/cdn-cgi/access/logout`) are answered regardless of credential and never forwarded. Intent lists the first three; logout joins them by REQ-204's revision. Formalized in the edge AC.
- **A complete pair with no address to act as is refused at the simulator with 403** (decided at reconciliation, 2026-11-07): intent says "the exchange refuses and says so". The code answers 403 naming both remedies (`PLATFORM_ADMINS` in `.dev.vars`, or `--service-email`) and forwards nothing, rather than letting the Worker answer `no_email`. Formalized in the exchange AC.
- **A wrong complete pair is 403, not a redirect** (decided at reconciliation, 2026-11-07): intent says only "refused". The code answers 403 so that automation presenting a credential is told it is wrong rather than being handed an HTML login page (the BUG-36 failure mode). Half a pair is treated as no pair (intent §2), so it gets the no-credential answer. Formalized in the refusal AC.
- **Proxy fidelity** (decided at reconciliation, 2026-11-07): intent's test plan requires method, path and body of a POST to survive the hop. The code also passes the query string, does not follow the builder's redirects (they are the caller's), preserves the builder's `Set-Cookie` headers, and answers 502 naming the builder when it does not answer. Formalized in the exchange AC as the observable shape of a forwarded request.
- **`--print-token` prints `export` lines** (decided at reconciliation, 2026-11-07): intent says "`NAME=value` form for `eval`". The code prints `export CF_ACCESS_CLIENT_ID='…'` / `export CF_ACCESS_CLIENT_SECRET='…'`, which is that form made usable by `eval` for a child process such as `bin/publish`. Not a contradiction; formalized in the exchange AC.

## Dependencies
- Plan item 3 — Person identity: addresses & names (REQ-191, REQ-193)
- Plan item 4 — Accounts (REQ-194)
- BUNDLE-39 plan item 1 — Access gate / admission: a service token mapped to a person (STORY-120, STORY-146; BUG-59 part two)
- BUNDLE-39 plan item 5 — Sign out: Account dialog control plus Access logout (STORY-171; REQ-204 revision)

## Story Points
3
