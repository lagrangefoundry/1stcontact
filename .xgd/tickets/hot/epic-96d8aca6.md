---
uid: epic-96d8aca6
id: EPIC-16
type: epic
title: Deployment
created_by: martin-github@westhead.me
created_at: '2026-09-17T03:29:16.017843+00:00'
updated_at: '2026-09-25T02:04:37.349968+00:00'
completed_at: null
last_field_updated: body
status: ongoing
fields:
  priority: medium
  chat_comment: comment-d9b9fc8d
  epic_children:
  - request-625707ca
  - request-aab6c72e
  - request-3514cc7e
  - bug-bec99cab
  - request-b9aa241d
  - bug-f177bc6f
  - bug-583068f3
  - bug-f65d693a
  - request-b98dd5a4
  - request-d21899ba
  - request-cf08927d
  - request-16813fa3
  - request-a339a778
  - request-30178935
  - request-0359a45d
---

## What the client asked for

> "This I think is probably getting a little too far over our skis for where we are right now, but I wanted to capture it while it was in my head because I can't see how we could manage without it in a real production environment. The idea here is that we would have a staging environment with some test sites set up with good rich test data and every deploy would go through the staging environment first and run our smoke tests and BFM tests and obviously any deployment migrations just like production. This ticket is to create that staging environment and an automated flow so that once the deployment is triggered it will go through automatically test and assuming all is good go straight to production. And then run another round of tests in production. The automation is critical here because there is literally one operator me. So everything has to run itself. I don't think I want to spend too much time on this epic right now. I think the requirements are relatively straightforward the tests are being handled by other epics so your job is really the deployment pipeline automation and the appropriate creation of test data. There are also some questions about whether we could keep such an environment from being public, and to an extent maybe whether we care? It is desirable that the automation run primarily in the cloud once it has been triggered. I don't want my laptop to be responsible for deployment."

Scope is as stated: **the pipeline and the test data.** The probes it runs are [[EPIC-15]]'s, and this epic consumes them rather than authoring any — on the "two implementations eventually disagree" grounds [[EPIC-15]] §3 already sets out, in a passage written and addressed to this epic before it existed.

## The two principles

**One deploy implementation, run twice.** Staging is not a second pipeline; it is the production pipeline invoked with `--env staging`. The moment there are two, the rehearsal stops proving anything about the real thing. That is exactly the argument `bin/deploy` already makes about `--dry-run` in its own header — _"a rehearsal that took a different route would prove nothing about the real thing"_ — applied one level up. It is also the argument the repository is currently losing: per the audit below, the cloud deploy path and `bin/deploy` are already two different implementations, and the cloud one is the one nobody runs.

**The gate is only ever as good as the rollback behind it.** With no human in the loop, "it promoted and it was wrong" needs an answer that does not require the operator to be awake. Code has one: redeploy the previous version. **Schema does not.** So the real constraint this epic discovers is not a test policy, it is a _migration_ policy — see §6. Most of the rest is configuration.

## What exists today

Better than expected in the parts that were designed, and wrong in the one part that was scaffolded and never revisited.

- `bin/deploy`** already has the seam.** It takes `--env`, defaults to `production`, documents `bin/deploy --env staging control-app` in its own usage text, and runs `migrate` and `secrets` hooks before any upload — with the ordering rationale written down (_"a migration that fails must stop the code that assumes it ran"_). Hooks receive `DEPLOY_ENV` and both shipped hook families pass it through to wrangler. The architecture for this epic exists; the environment does not.

- **The capability report ([[REQ-264]]) is worth more unattended than attended.** Every credential a hook is handed is probed against the permission the product actually uses, and `bin/deploy` prints the rows together at the end. It was built so an operator watching a deploy could read what shipped broken in one place. Headless, it becomes the artifact that says the same thing to an operator who was not watching.

- `bin/smoke`** ([[REQ-144]]/[[BUG-57]]) already takes **`--origin`, and `--control-origin` defaults to `app.<host>` of it, so it can be aimed at a staging pair with no change.

- `.github/workflows/deploy.yml`** is the problem.** It triggers on push to `xgd-stable` (plus `workflow_dispatch`), then runs `pnpm install`, `pnpm -r build`, and two direct `wrangler deploy --env production` invocations. It has not been touched since the scaffold commit `402ae93f1f`. Consequences, in order of severity:

- It **does not call **`bin/deploy`, so no `migrate` hook and no `secrets` hook run. Schema migrations are not applied and no secret is pushed or probed.

- It **does not call **`bin/build`, so `1c assets` never runs. `pnpm -r build` is `tsc --noEmit` in both apps and emits nothing, and `apps/control-app/dist-assets` is gitignored — so the control app's `[assets]` directory is absent on a fresh checkout.

- It **does not call **`bin/smoke`, so nothing verifies the result.

The honest reading is that the cloud deploy path is scaffolding that has never been the real path, and the deploys have been coming off the laptop — which is the thing the client is asking to stop. **Correcting this is the first child and is valuable with or without staging.**

- **Only **`[env.production]`** is defined**, in both `apps/*/wrangler.toml`. A named environment inherits neither `vars` nor bindings ([[DOC-41]] §3), and the existing UATs pin top-level against production. A staging block not pinned the same way will silently ship missing bindings, which is not graceful degradation — every call throws on `undefined`.

- **The migrate hook hardcodes the database _name_.**`bin/deploy.d/migrate/10-d1-site-store` runs `wrangler d1 migrations apply 1stcontact --env "$DEPLOY_ENV"`. It honours the environment and not the database, so pointed at staging it would migrate production's D1. Small fix, unpleasant failure mode: read the name out of `wrangler.toml` for the environment, the way `bin/deploy`'s own `worker_name()` already does for the Worker.

- **Test data exists and is aimed at the wrong target.** `db/dev-seed.sql` (402 lines) plus `bin/seed` ([[REQ-192]]), local by default, `--remote` typed out loud with a printed warning that it puts invented people into the database real customers are in. `storage/sites/` holds three real site definitions (`1stcontact`, `gigabytealchemy`, `xgd`).

- **The service-token pattern for machine callers is already built.**`SERVICE_TOKEN_IDENTITIES` maps a Cloudflare Access service token's `common_name` to a person ([[BUG-59]]), provisioned for `bin/publish`. §5 wants exactly this and does not need to invent it.

## The shape

### 1. Staging is a named environment with its own resources

`[env.staging]` in both `wrangler.toml` files, with **every** var and binding restated, and the existing production-parity UATs extended to cover it.

Separate resources, not shared:

- **Its own D1.** Non-negotiable, and it is the point: if staging shares production's database then the migration rehearsal _is_ the production migration, and the single most valuable thing this pipeline does never happens.

- **Its own R2 buckets** (`SITES`, `BLOBS`). Keys are opaque site ids so collisions are unlikely, but "unlikely" is the wrong standard for a bucket a test suite writes to.

- **Its own Worker names and hostnames**, so `workers_dev` and the Access posture stay per-environment facts rather than shared ones.

Recommendation: same Cloudflare account, separate resources, separate hostnames. A separate account is stronger isolation and materially more setup for one operator; the isolation that actually matters here is the database.

### 2. The pipeline

```
push xgd-stable ──▶ build ──▶ staging: migrate → secrets → deploy
                                │
                                ├─ smoke  (staging origin)
                                └─ BFM    (staging probes — code regressions)
                                │
                          [gate: all green]
                                │
                           production: migrate → secrets → deploy
                                │
                                ├─ smoke  (production origin)
                                └─ BFM    (canary tier — config + integration)
                                │
                          [verify — and see §6]

```

Every deploy stage is `bin/build` then `bin/deploy --env <name>`: the same two commands with a different argument. A failure anywhere stops the run and nothing is promoted. The capability report is emitted per environment and kept as a run artifact.

**The trap, and it is [[EPIC-15]] §3's, restated here because this is the epic that would fall into it:** staging probes cannot be the whole gate. Staging has different DNS, no real MX, test ESP credentials, no real connected accounts and no real customer configuration — so the flows BFM exists for are _precisely the ones that differ between the environments_. Staging catches code regressions, which is genuinely valuable and the fastest feedback available, and is structurally incapable of catching the config and integration failures that break production. Conflating them is much cheaper and the failure is silent: a green gate that never tested the thing that breaks.

### 3. Where it runs

GitHub Actions, triggered by the existing push to `xgd-stable`. That push is already a deliberate operator act distinct from `xgd-working`, which makes it the right trigger and means no new one has to be invented.

What has to move off the laptop with it:

- **Secrets.** Today they are read _"from the operator's own environment or password manager at deploy time"_. Every name under `bin/deploy.d/secrets/` needs a GitHub secret, scoped per environment — GitHub Environments are the right container for the scoping, though not for approval gates, which the no-human requirement rules out. The hooks' existing decision table (supplied → push; else stored → leave alone and say so; else fail loudly) works unchanged.

- **Cloudflare API tokens**, likewise, ideally one per environment for blast radius. A wrong-scoped token is caught by the capability probes rather than discovered by a customer, which is what [[REQ-264]] was for.

- **The knowledge base.** `1c kb build` is _not_ part of `bin/build` ([[DOC-41]] §4), needs Workers AI credentials, and a doc exported but not indexed is invisible to search. A staging control app with an absent or stale KB is a builder whose assistant behaves differently from production's — so the pipeline either builds it or states out loud that it does not. Open question 8.

- **Failure has to reach the operator.** An unattended pipeline that fails silently is worse than no pipeline. This epic _declares_ the event; delivery and channels are [[EPIC-14]]. GitHub Actions' own failure notification is a legitimate day-one answer, and this should not block on [[EPIC-14]] to ship.

One incidental benefit worth naming: the runner is not Cloudflare, which partially answers [[EPIC-15]] §4's "everything shares fate with everything it watches" — for the deploy, though not for monitoring.

### 4. Test data

The requirement is "good rich test data", and the substance of it is that every probe has something real to probe.

**One site corpus, two destinations.** [[EPIC-15]] puts canary sites in the platform tenant _in production_, deliberately, because their value is that they are real. Staging needs its own fixtures. If those are authored separately they will drift, and [[EPIC-15]]'s open question 7 — _"a canary that stopped exercising a feature is a probe that passes for the wrong reason"_ — becomes two problems instead of one. So the site definitions live once in the repository (`storage/sites/` is already that shape), and seeding materialises them into whichever environment it is pointed at. Staging and canary differ in their tenant, credentials and DNS, not in what the sites contain.

The fixture must be **deterministic, reapplicable and idempotent** — a staging database is wiped and refilled routinely, and a seed that only works against an empty database is a seed that stops working on the second run.

**And a safety property degrades the moment staging exists.** `bin/seed`'s guard today is that `--remote` has to be typed and prints a warning. Staging makes typing `--remote` a routine habit, which is precisely how that guard stops working. Seeding must become environment-aware and **refuse the production database outright**, rather than warning about it.

### 5. Keeping staging private

The client asks whether we can, and whether we care. **We care, and the reason is not embarrassment.**

- Staging will carry copies of canary sites that look like real businesses. An indexed staging copy is duplicate content that can outrank the real one.

- Staging runs weaker configuration _by design_ — test ESP credentials, relaxed admin lists, fixture identities. An internet-facing deployment running weaker config is the ordinary breach path.

- A form on a staging site is a real form posting into real intake code. Public means anyone can fill it in, which is [[EPIC-15]]'s gutter problem arriving from outside.

**Recommendation: Cloudflare Access on both staging hostnames, with the probes carrying a service token.** The control app is already Access-gated ([[REQ-147]]); what is new is gating the staging _public_ site, which is public by definition in production. The mechanism costs one Access application and one `SERVICE_TOKEN_IDENTITIES` entry, because [[BUG-59]] already built it.

Two things make this safe rather than a compromise of the test. Access is an **edge** gate, so the Worker code path under test is byte-for-byte the production one. And `workers_dev = false` must be restated under `[env.staging]` for the control app for the same reason it is restated under production — a `workers.dev` hostname that no Access policy covers is exactly the hole the flag exists to close.

**And **`public-site`** is that hole today.** `apps/public-site/wrangler.toml` sets `workers_dev = true` at the top level ([[EPIC-17]] F8(c)), and — unlike vars and bindings — `workers_dev` _is_ inherited by a named environment. So an `[env.staging]` block that says nothing about it ships a `*.workers.dev` hostname no Access policy covers, serving the staging public site and `/api/lead` to anyone who guesses it. The Access application on the staging hostname would look perfectly correct and prove nothing. One line under `[env.staging]`; production's own `workers_dev = true` is [[EPIC-17]]'s item 12 and wants doing regardless.

The cost lands on [[EPIC-15]]: staging probes need an auth seam to carry the token. Worth telling that epic now rather than after its probe interface has settled.

### 6. Rollback, and why it bounds the design

This is what makes "straight to production" defensible for a single operator, and it is where the design is actually constrained.

**Code rolls back; schema does not.** A bad Worker is the previous Worker redeployed. A bad migration against D1 has no equivalent, and there is no operator awake to improvise one.

So the pipeline needs a migration policy, and the policy is **expand/contract, forward-only**: a deploy never ships a destructive migration _and_ the code that depends on its destructive half in the same push. Additive migration first, code that tolerates both shapes, contraction in a later deploy once the previous version is no longer running. A change that cannot be expressed that way is not an automated deploy, and should say so rather than be waved through.

A policy nobody checks is a comment, so this wants a check in the pipeline rather than a paragraph in a README. Whether that check can be mechanical is open question 4.

The corollary for the production round: **without progressive rollout, production verification is a postmortem rather than a gate.** [[EPIC-15]] §3 says the same. Whether Workers versions / gradual deployments give us a real promote step is open question 3, and the answer decides whether the second round of tests is a safety mechanism or a report.

## Boundaries

- **The probes themselves** → [[EPIC-15]]. This epic runs them, aims them at an origin, and gates on their verdict. It authors none.

- **The scheduler, verdict store, continuous monitoring** → [[EPIC-7]]. This pipeline is event-driven off a push; it is not a second scheduler.

- **Notification delivery and channels** → [[EPIC-14]]. This epic declares that a deploy failed and to whom it matters.

- **Anything a customer looks at** → [[EPIC-8]]. Nothing here is customer-facing.

- **The gutter / **`synthetic`** contract** → [[EPIC-15]]. Staging fixtures live in a separate database and need no marker; canary traffic in production does, and that is [[EPIC-15]]'s.

## Open questions

1. **Same Cloudflare account or a separate one?** Recommendation §1: same account, separate resources. Revisit if staging ever holds real customer data, which it should not.

2. **How do staging test sites get addressed?** Host-based resolution is gated on operator DNS work that has not happened ([[DOC-45]] §4), and in the interval `/site/<siteKey>/` still serves. Recommendation: use the path grammar for staging — which is also an argument for not deleting it before staging exists.

3. **Is there a real promote step?** Whether `wrangler versions upload` / `versions deploy` gives deploy-without-routing plus promote is unverified against the wrangler surface in use here. The answer decides §6.

4. **Can the expand/contract rule be checked mechanically**, or only documented?

5. **Who pushes **`xgd-stable`**, and should it ever be automatic?** Today it is a deliberate operator act. Recommendation: keep it manual — it is the one human decision the client has not asked to remove.

6. **Does staging get its own Access application or share production's?** Sharing is simpler; separate lets a staging grant be revoked without touching production's policy.

7. **What does a second full environment cost?** D1 and R2 are near-free at this volume; Browser Rendering and Workers AI are metered and the pipeline will exercise both on every run.

8. **Does the pipeline build the KB for staging?** See §3. A staging assistant answering from a different corpus than production's is a difference the probes will not see and the operator will.

9. **How long is staging data live?** Wipe-and-reseed on every run is the simplest correct answer and makes the seed's idempotence testable by construction. Security note §1 settles the policy half of it: no production data, ever.

10. **How does the CI runner obtain the shared component store?** `bin/build` opens with a preflight precisely because `@lagrangefoundry/*` is populated out of band and `pnpm install` cannot supply it. Until the runner has a way to get the store, the first child cannot run `bin/build` at all — so this question and security note §4's pin are one piece of work, and they gate child 1 rather than following it.

## Children

**Filed 2026-09-20 — the content path, ahead of the pipeline work:**

- [[REQ-289]] **Content copy between stores** — `GET /api/export`, `bin/copy-to-cloud`, `bin/copy-from-cloud`. Covers §G6 steps 1–3. Ahead of everything below because the Lagrange Foundry draft currently has no backup (§F5).

- [[REQ-290]] **Retire the file-backed authoring tier** — `storage/sites/`, `bin/publish`, `1c push`. Covers §G6 steps 4–5. Depends on [[REQ-289]].

Step 6 — the [[DOC-41]] rewrite — is folded into both as an acceptance item rather than filed separately: the document is derived from the scripts, so it changes when they do.

**Still unfiled. Suggested order, and the first is not about staging at all:**

1. **Put the cloud deploy on **`bin/build`** + **`bin/deploy`**.** The workflow is wrong today, in production, and every automated thing after this depends on the cloud path being the same path. Includes the migrate hook's database-name fix (which is security note §2's failure, already present in the repository) and the shared-store pin (security note §4 / open question 10), without which the workflow cannot run `bin/build` at all.

2. `[env.staging]`** and its resources** — wrangler blocks, D1, R2, hostnames, Access, and the parity UATs extended to the new environment. Separate credentials per environment is security note §2; `workers_dev = false` for the staging public site is §5 above.

3. **The seed** — environment-aware, idempotent, production-refusing, sourced from the one site corpus. Refusing production is security note §1's clause as much as §4's of this epic.

4. **The gate** — staging round, promotion, production round, artifacts, and the failure notification. The run artifact is the deploy record of security note §6, and the digest comparison of §4 is one of the gate's conditions.

5. **The migration policy check** (§6), if open question 4 says it can be one.

6. **Deploy identity** (security note §3) — one non-human identity per environment, scoped, rotated on a stated schedule. Separable from 1, which can ship on whatever token the operator holds today; not deferrable past the point where staging exists, because that is when there are two.

## Related

[[EPIC-15]]

BFM — the probes this pipeline runs; §3 of it is addressed to this epic

[[EPIC-7]]

scheduler, verdict store, continuous monitoring

[[EPIC-14]]

notification delivery for a failed unattended run

[[EPIC-8]]

the customer-facing surface none of this draws

[[DOC-41]]

build and deployment — the environment and inheritance rules

[[DOC-45]]

site addressing — §4, what a staging site's URL can be today

[[REQ-144]]

`bin/deploy`, `bin/smoke`, the hook architecture

[[REQ-264]]

the capability report

[[REQ-147]]

Cloudflare Access on the control app

[[BUG-59]]

`SERVICE_TOKEN_IDENTITIES` — how a machine caller gets an identity

[[REQ-192]]

`bin/seed` and `db/dev-seed.sql`

---

## Security notes ([[EPIC-17]])

Added from the [[EPIC-17]] threat-model pass. This epic is the cheapest possible moment for every clause below: once a credential or a dataset is shared between environments, separating them is a migration rather than a decision.

### 1. Staging holds no production data — and if it ever does, it _is_ production

Real contacts in staging are third parties' personal data in a system with weaker controls and more hands. There is no middle state: a staging environment holding real contacts inherits every control production has, or it holds none of them and holds no real data.

### 2. No credential is shared between environments

Separate D1, R2, Access application, service tokens and provider API keys per environment. **A staging binding that can write production storage is the specific failure this clause exists to prevent** — it converts a test deploy into a production incident, and it is invisible until it happens.

### 3. Deploy identity

One non-human identity per environment, scoped to what that environment deploys, rotated on a stated schedule, and never a human's token. `SERVICE_TOKEN_IDENTITIES` ([[BUG-59]]) already maps a machine caller to an identity; what this adds is that its scope and its rotation are stated rather than inherited.

### 4. The component store is pinned and verified

[[EPIC-17]] F7: `@lagrangefoundry/*` — the AI library, the toolbox bridge, the webui components — resolves out of an out-of-repo shared store and appears **zero times in **`pnpm-lock.yaml`. That is the code running the tool loop and the builder chrome, with no version pin and no integrity check.

- resolve by version **and digest**;

- record the resolved digest in the deploy record;

- **refuse a deploy whose digest differs from the one the tests ran against.**

### 5. Secrets reach the platform only through the secret hook

`bin/deploy.d/secrets/` and `wrangler secret` — never `[vars]`, never a repo file. The existing [[REQ-149]] rule (_a deploy refuses when a required secret is absent_) is restated here as what it also is: a fail-closed control, on `access.ts`'s reasoning.

### 6. A deploy is auditable

Which version, which digests, which actor, when. An automated deploy that cannot answer those four is an automated deploy nobody can investigate.

### 7. Where these land — checked against the code, 2026-09-17

Three of the six are already load-bearing in the plan above rather than additions to it, and one of them is not a hardening pass at all.

- **§2 already has a concrete instance in this repository.**`bin/deploy.d/migrate/10-d1-site-store` hardcodes the database _name_`1stcontact` while honouring `--env`, so pointed at staging it migrates production's D1. That is exactly "a staging binding that can write production storage", it exists today, and it is fixed in child 1.

- **§4 is a prerequisite, not a hardening pass.** `bin/build`'s first stage is a preflight _because_ the store is populated out of band and `pnpm install` cannot supply it — `@lagrangefoundry` appears zero times in `pnpm-lock.yaml` and in no `package.json`, and resolves through `require.resolve` anchored at the main checkout. So the cloud deploy cannot run `bin/build` until the store is obtainable in the runner, and "how does CI get it" and "pin it by digest" are one question answered once. Gates child 1. Open question 10.

- **§1 settles open question 9.** No production data in staging, plus wipe-and-reseed on every run, is one policy rather than two.

- **§3 and §6 become children** — deploy identity (child 6) and the deploy record (child 4's artifact).

- **§5 is already the shipped behaviour** of `bin/deploy.d/secrets/`. It is restated here as a control because the secrets are about to move to GitHub, and that is exactly the move during which "just put it in `[vars]` for staging" becomes tempting.

One clause from [[EPIC-17]] that is _not_ restated above because it belongs elsewhere: F8(c)'s `workers_dev = true` on production's public site. Staging inherits the consequence (§5), but the production instance is [[EPIC-17]]'s item 12 and should not wait for this epic.

---

## Scope broadened to **Deployment** (2026-09-20)

The epic was renamed from the staging-pipeline framing to **Deployment**. Nothing above is invalidated — staging, the gate, the seed and the security notes all still stand. What is added is the two things that come _before_ a pipeline can be worth having:

- **the local build and dev loop**, because the pipeline's job is to run the same steps the operator runs, and "the same steps" has to be a list somebody can read; and

- **the first production go-live**, because there is nothing for a pipeline to protect until something is actually serving.

### A. The build and dev loop — the catalog

There is no "million scripts" problem in the _build_ direction: `bin/build` is already the single path and `1c assets` is already a stage inside it (stage 2 of 4 — preflight, assets, `pnpm -r build` typecheck, per-app wrangler bundle). Asset and build are combined and have been since [[REQ-144]].

The scripts divide cleanly by what they act on:

Acts on

Commands

**Code → artifacts**

`bin/build` (preflight → `1c assets` → `pnpm -r build` → bundle), `1c preflight`, `1c assets`, `bin/kb-release` (kb build, _then_ assets — [[BUG-48]]'s ordering)

**Artifacts → cloud**

`bin/deploy` (migrate hook → secrets hooks → `wrangler deploy` → capability report), `.github/workflows/deploy.yml` (bypasses all of it — child 1)

**Content → store**

`bin/publish` / `1c push` (local draft → D1+R2), `1c publish` (mint a revision) — two different operations with confusingly similar names

**Dev servers**

`1c builder` (`wrangler dev`, control app, :8788), `pnpm dev:public` (`wrangler dev`, public site, :8787), `pnpm dev` (both), `bin/access-sim` (:8799, local Access IdP), `1c filing` (loopback defect filing), `bin/repro-console` (:8710)

**Local store**

`bin/seed`, `1c reset`, `wrangler d1 migrations apply … --local`

**Gates / evidence**

`bin/smoke`, `bin/repro-rail`, `1c gate` / `l1-gate` / `values-diff` / `diff`, `bin/access-token`

`startBuilder` and `startServe` are **test transports, not hosting** — they are library functions a test opens and closes. The only supported way to serve a site is a Worker ([[REQ-177]]).

**The real gap is the dev loop, not the build.** `1c assets` copies `apps/control-app/src/builder/**` verbatim, type-strips the framework bridges, and writes `src/generated/importmap.json`. None of that is watched. So every edit to builder browser source or to a framework bridge needs a manual `1c assets` before a reload shows it, and _nothing says so_ — the failure is a stale asset, which looks like the edit not working. `wrangler dev` watches the Worker's own module graph and the `dist-assets` directory and reloads on both; the missing half is a watcher on the _inputs_ to `1c assets`.

**What requires what** — the table this epic should own, and the pipeline should mirror:

Changed

Run

Server

Browser

Worker source, or a `packages/*` module the Worker imports

—

auto-reload

reload

`apps/control-app/src/builder/**` (browser source)

`1c assets`

auto (asset watcher)

reload

`packages/framework/src/l1/*` bridges (`/framework/*.js`)

`1c assets`

auto

hard reload

a webui component in the shared store

reinstall store, `1c preflight`, `1c assets`

restart

reload

KB docs / opted-in doc tickets

`bin/kb-release`

restart

reload

site content under `storage/sites/**`

`bin/publish [slug]`

—

reload

want a frozen revision of a site

`1c publish <slug>`

—

—

**D1 schema**

new `db/migrations/NNNN_*.sql`, then `(cd apps/control-app && npx wrangler d1 migrations apply 1stcontact --local)`

restart (`1c builder` **refuses** while behind — [[REQ-253]])

reload

`wrangler.toml` — bindings, vars, routes, crons

—

restart

reload

`.dev.vars` / `.dev.vars.local`

—

restart

—

dependencies (`package.json`, lockfile)

`pnpm install`

restart

—

**Only D1 schema changes involve a migration.** Sites, pages, palettes, assets, revisions, leads, zones and domains are all _rows and objects_ under a schema that already exists — authoring a site never migrates anything. A migration is needed exactly when a feature needs a new table or column, and the rule every file in `db/migrations/` states is: **never edit an applied migration**, always add a numbered file, because `wrangler d1 migrations apply` records what it has run and an edit reaches no database.

### B. Production state, audited 2026-09-20

Read directly off the account, not inferred:

Fact

Value

Remote D1 `d1_migrations`

`0001_baseline.sql`** only**, applied 2026-09-06

Migrations in `db/migrations/`

0001 … 0018 — so production is **17 behind**

Remote D1 contents

0 sites, 0 users, 0 revisions, 0 pages, 1 tenant

Workers last deployed

both 2026-09-06 (repo is at 0.2.297 with a fortnight of changes since)

Production secrets (control-app)

`ANTHROPIC_API_KEY`, `RESEND_API_KEY` — `OPENAI_API_KEY`** and **`CLOUDFLARE_DNS_TOKEN`** absent**

`app.1stcontact.io`

live, behind Access (302 to the team login)

`1stcontact.io`

Worker answers, **404** — `APEX_SITE_KEY` is `""` in `[env.production.vars]`

R2

`1stcontact-sites`, `1stcontact-material` both present

Three consequences worth stating plainly:

1. **The empty database is the cheapest moment this will ever be.** Seventeen migrations against a database with no rows carries no data risk. Every day production holds real customers, the expand/contract policy in §6 above stops being a policy and starts being a constraint.

2. `CLOUDFLARE_DNS_TOKEN`** absent means custom domains cannot be attached at all.**`serving.ts` composes DNS records + a runtime Worker route + the `site_domains` row; the first two need that token (`Zone:DNS:Edit`, `Workers Routes:Edit`). And `site_domains` does not exist in the remote schema yet — it arrives with migration 0008.

3. **Deploying from CI today would be actively worse than from the laptop.** `dist-assets` is gitignored and the workflow never runs `1c assets`, so a CI deploy of `control-app` uploads an _empty_ assets directory over a working one. This is child 1 restated with a sharper edge: the workflow is not merely incomplete, it is a loaded gun.

### C. First go-live — the sequence

Laptop-driven, once, because the cloud path cannot do it yet (child 1 is what makes the second time different). Each step is checkable before the next:

1. `bin/build` — catches preflight, assets, typecheck and both bundles locally.

2. `bin/deploy --dry-run` — lists the pending migrations and runs every capability probe as a read.

3. Push the two missing secrets (`OPENAI_API_KEY`; `CLOUDFLARE_DNS_TOKEN` scoped `Zone:DNS:Edit` + `Workers Routes:Edit`) — the hooks do this and probe what the key can do.

4. `bin/deploy` — migrations 0002…0018 land, both Workers upload, capability report prints.

5. `bin/access-token`, then `bin/publish --production <slug>` — the local drafts become cloud sites.

6. Mint a revision for each site, so `public-site` has something live to serve.

7. **The apex** is deployment configuration, not a mapping: set `APEX_SITE_KEY` in `[env.production.vars]` of `apps/public-site/wrangler.toml` to the published site's key and redeploy. (`TURNSTILE_SITEKEY` is `""` too — forms on the apex render no widget until it is set.)

8. **Any other domain** goes the customer path: the zone in the account and recorded in `zones` with its `origin` ([[REQ-257]]), then attach from the builder, which writes records, route and row in that order ([[REQ-258]]).

9. `bin/smoke --site-key <key>` — prove it serves.

### D. Steady state — two lanes, and they must not be confused

- **Content lane.** Edit in the deployed builder → publish a revision → live. No deploy, no migration, no CI. `bin/publish --production` is the _import_ path for a locally-authored site and is 409-guarded against overwriting builder edits ([[BUG-51]]) — it is not the everyday path.

- **Code lane.** Today: `bin/build` + `bin/deploy` from the laptop. Target: this epic's pipeline. The first step is child 1, and its value does not depend on staging existing.

### E. Open questions added by the broadened scope

1. **Is **`1c assets --watch`** (or a watching **`1c builder`**) in scope here, or its own ticket?** It is a dev-loop change, not a deployment one — but it is the same "one list of steps" property the pipeline needs, and it is the only thing in section A that is a defect rather than a catalog.

2. **Which domain is the Lagrange Foundry site, and does the site exist?** There is no `lagrangefoundry` site under `storage/sites/` (only `1stcontact`, `gigabytealchemy`, `xgd`), and neither `lagrangefoundry.com` nor `lagrangefoundry.io` resolves. The apex path (step 7) and the customer-domain path (step 8) are different mechanisms; which one applies depends on the answer.

3. **Does the platform's own marketing site go on the apex via **`APEX_SITE_KEY`**, or through **`site_domains`** like a customer's?** The code supports the former for platform hosts and the comment in `routes.ts` is explicit that this is deliberate. Worth confirming it is still the intent before the first deploy pins it.

### F. The doc ticket, and the two paths (2026-09-20)

**The doc ticket is [[DOC-41]] "Build and Deployment".** It already answers question (1) in detail — one-time setup, the local simulation, the Cloudflare path, the credential table per environment, and the order of operations. It is the right home for this material and should stay so. Three things it does **not** say, which this epic owes it:

- it does not mention `.github/workflows/deploy.yml` at all, so nothing in the repo warns that a second, divergent deploy path exists (§B.3);

- it documents no **staging** environment, because there isn't one;

- it documents **no content-copy path in the prod → dev direction**, because there isn't one (see below). DOC-41 §3 documents `bin/publish --production` and stops there.

Updating DOC-41 is a deliverable of child 1 and of the staging children — the doc is derived from the scripts, so it changes when they do.

#### F1. Code → dev

**There is no deployed dev environment.** "Dev" is the _local Cloudflare simulation_: workerd via `wrangler dev`, with D1 and R2 on disk under `apps/*/.wrangler/state/`. Neither `wrangler.toml` declares any environment but `[env.production]`. So:

```
bin/build        # preflight → 1c assets → pnpm -r build (typecheck) → per-app bundle
pnpm dev         # public :8787, control :8788
bin/publish      # seed the local store from storage/sites/

```

After that, §A's table governs what each kind of edit needs. The only genuinely missing piece is a watcher on `1c assets`' inputs (open question 11).

#### F2. Code → prod

```
bin/build
bin/deploy --dry-run    # same code path, hooks run and change nothing, capability probes read
bin/deploy              # migrate hook → secrets hooks → wrangler deploy --env production, per app
bin/smoke               # prove the origin serves

```

From the laptop, today. `.github/workflows/deploy.yml` is a **second and divergent path**: it runs `pnpm -r build` (typecheck only, emits nothing) then two bare `wrangler deploy --env production` calls. It never runs `bin/deploy`, so no migration is applied, no secret is pushed or probed, and `1c assets` never runs — and because `dist-assets` is gitignored, a CI deploy of `control-app` would upload an **empty** assets directory over a working one. Child 1 replaces its body with `bin/build && bin/deploy`; until then the workflow should be treated as disabled.

#### F3. Content → prod (exists, one direction, sites only)

```
bin/access-token                        # provision the Access service-token PAIR, once
bin/publish --production <slug>         # 1c push → POST /api/import → Worker writes D1 + R2
# then mint a revision (builder UI, or POST /api/publish) so public-site has something live

```

Properties worth stating because they are the ones that bite:

- `--production`** has to be typed.** There is no push-everywhere and no default that reaches the cloud.

- **It copies a DRAFT, not a revision.** `bin/publish` moves _where the bytes live_; `1c publish` / `/api/publish` decides _which version is live_. The names are uncomfortably close and this is the single most likely confusion in the whole flow.

- **It is 409-guarded** ([[BUG-51]]): a target with changes made in the builder is refused, and `--force` is how you say you meant it. The guard counts _authored_ changes (`counter`, moved only by `appendChange`), not `version`, so re-running after a purely local edit still works.

- **It is the import path, not the everyday path.** Steady state is §D's content lane: edit in the deployed builder, publish a revision, live.

#### F4. Content → dev (does not exist)

There is no export route and no `1c pull`. `/api/import` has no mirror; `tools/generate/src/cli/` has `push.ts` and nothing opposite it. The three things that look like an answer and are not:

Looks like

What it actually is

`1c builder --remote`

points the local dev server's D1/R2 bindings at the **deployed** store. Not a copy — it is editing production from a laptop, and is off by default for that reason ([[DOC-41]] §2).

`bin/seed`

writes `db/dev-seed.sql`, an **invented** fixture (`alice@plumbing.example`). It is the opposite of a copy: it exists so a fresh clone has people without anyone's real people.

`wrangler d1 export --remote` + `wrangler r2 object get`

the raw primitives a real puller would be built on. Nobody has wired them up, and a site's bytes span D1 plus two R2 buckets (`1stcontact-sites`, `1stcontact-material`), so a hand-rolled version gets it half right.

**Contact data specifically: no path in either direction, and that is the correct default.** Contacts, leads, sessions, grants, messages and the activity log are D1 rows created in the cloud. Copying them down would put real people's data on a laptop and into a dev store with `ACCESS_DEV_OPEN=1` — which is security note 1 above ("staging holds no production data") applied to the dev machine, where it matters more, not less.

**The recommendation this epic should carry.** Split the direction in two:

1. **Structure down, data never.** The supported prod → dev refresh is: apply the same migrations locally, then `bin/seed`. That is already true today and should be _stated_ in DOC-41 as the answer, so the absence reads as a decision rather than a gap.

2. **One site's content down, on request.** The genuinely missing piece is an `/api/export` mirror of `/api/import` plus a `1c pull <slug>` — draft definition, pages and assets, into `storage/sites/<slug>/`, symmetric with push and behind the same Access token. Small, well shaped, and it is what makes "reproduce the customer's bug locally" possible. It also makes the staging seed (§4 above) a _copy of canary sites_ rather than a second corpus authored by hand, which is what open question 7 is really about.

A second, larger version — pull a whole environment including contacts — should be refused by construction, not merely not built: the puller should take a site slug, never a tenant.

#### F5. Lagrange Foundry — open question 12, answered, and §C step 5 invalidated

**Correction to the audit above.** Open question 12 said "there is no `lagrangefoundry` site under `storage/sites/`". That is true and it is the wrong place to have looked. `storage/sites/` is the **git-tracked authoring tier**; the LF site was built **in the builder**, so it lives in the local D1/R2 under `apps/control-app/.wrangler/state/`. Read off that store, 2026-09-20:

Fact

Value

Business

`biz_5b101742d436573a04a2512fb7ecdbb5` "Lagrange Foundry", created 2026-09-09

Site

`site_936dd7c92e5e14df694dd9a80433aa4f`, `kind=site`

Draft

`version` 192, `counter`** 190** — 190 changes authored in the builder

Pages

one, `home.json`, 23.7 KB of L1

Assets

17 (≈50 MB), plus 220 material attachments and 31 material items

Revisions

**0 — and zero for every site in the store.** `base_revision` is empty

Addresses

`site_domains`: `lagrangefoundry.ai` (custom, active, **canonical**) and `www.lagrangefoundry.ai` (custom, active, non-canonical), both 2026-09-16

Zone

`zones` holds `lagrangefoundry.ai`, `cf_zone_id=36c6818172e7b61082bedd6416cb6dc2`, status active, origin `operator`

Last touched

2026-09-20T23:41Z

Open question 12 is therefore **answered**: the domain is `lagrangefoundry.ai`, the zone _is_ in the account, and the site exists. Open question 13 is answered too — LF goes the **customer path** (`site_domains`), not the apex, and the rows to prove it are already written locally.

**But §C step 5 does not work for this site, and that is the finding.** Step 5 says `bin/publish --production <slug>` turns the local drafts into cloud sites. `bin/publish` reads `storage/sites/<slug>/`. **The LF site is not there and never was.** So there is, today, **no command that moves this site to production** — the one content path that exists points the wrong way for the only site that needs to travel.

**And the same gap is a data-loss exposure right now.** The LF draft — a day's work, 190 authored changes, 23.7 KB of tuned L1, 50 MB of assets — exists in exactly one place: a **gitignored** miniflare directory, with **no published revision** to fall back to and **no export path**. `1c reset` is documented as removing precisely that directory. There is no backup and nothing in the system would notice.

This is §F4 restated with the abstraction removed. The missing `/api/export` + `1c pull <slug>` pair is not staging-seed tooling; it is the only thing standing between a day of work and a single command, and it is simultaneously the only non-manual route to go-live for the LF site. **It should be the next child of this epic, ahead of the pipeline work**, and its acceptance should be: `1c pull` the LF site into `storage/sites/lagrangefoundry/`, commit it, and have `bin/publish --production` accept it unchanged.

The three alternatives, for the record, and why they lose:

Option

Why not

Rebuild it in the deployed builder

A day's work again, and it discards 190 changes of journal and the chat transcript that produced them.

Raw `wrangler d1 export --local` → transform → `d1 execute --remote`, plus 17 `r2 object put`

Hand-mapping site/tenant IDs and asset R2 keys across two stores. Gets the asset keys wrong quietly, which looks like a working site with broken images.

`1c builder --remote` and build it against production

Editing production from a laptop, and it still leaves the local 190-change draft as the only copy of the history.

**Two things still block go-live even once the site can travel:**

1. `CLOUDFLARE_DNS_TOKEN`** is absent from production** (§B). Attaching `lagrangefoundry.ai` writes DNS records + a Worker route + the `site_domains` row, and the first two need that token. The local `site_domains` rows describe the **local** store; production has none.

2. **Nothing has ever been published — anywhere.** `site_revisions` is empty for every site in the local store, so `/api/publish` has never minted a revision in this database. `public-site` serves _revisions_, not drafts, so the first publish is also the first exercise of that path. Worth doing locally first, where LF already has the addresses `/api/publish` requires.

## G. The content commands, renamed and re-sourced (2026-09-20)

### G0. `1c pull` does not exist — a correction

§F4 and §F5 above recommend "`/api/export` + `1c pull <slug>`" as though `1c pull` were a thing being extended. **It is not a command. It was a proposed name**, invented while drafting §F4 and then reused as if it existed. `tools/generate/src/cli/` holds `push.ts` and no counterpart; the router has `/api/import` and no `/api/export`. Nothing reads content out of a store, anywhere. Wherever §F names `1c pull`, read it as "the unbuilt export direction".

### G1. `publish` is overloaded, and `bin/publish` loses the name

**The operator's ruling, and it is right.** _Publish_ means one thing: take a draft, freeze it as a version, make that version live. `bin/publish` uses the same word for _copy bytes from this laptop to Cloudflare_, which is a different operation on a different axis. [[DOC-41]] §3 and the header of `bin/publish` both already carry a paragraph apologising for the collision — a comment explaining why two things share a name is the defect, not the mitigation.

`bin/publish` is **deleted**. The replacement is `bin/copy-to-cloud <business>`, and the verb is now unambiguous in both directions: _copy_ moves bytes between stores, _publish_ mints a version.

### G2. It is a rewrite, not a rename — the source tier changes

The crucial point, and the reason this cannot be a `git mv`:

- `bin/publish` / `1c push` read `storage/sites/<slug>/` — the git-tracked file-backed tier.

- The sites that exist read **the local D1/R2** under `apps/control-app/.wrangler/state/` — because they were built in the builder. The Lagrange Foundry site (§F5) is there and has never been in `storage/sites/`.

So the old command's source is the tier being retired, and the new command's source is a store Node cannot open: miniflare's D1 is a SQLite file whose layout is an implementation detail, and R2 is a second SQLite plus a blob directory beside it. Reading those directly is a third store adapter with no contract behind it.

**The design: **`GET /api/export`**, symmetric with **`/api/import`**.** The Worker already writes through the store it serves from, for exactly the reason `import-site.ts` documents — one writer, no second adapter that could disagree about what a site is made of. Export is that argument in reverse, and it makes the command trivially symmetric:

```
bin/copy-to-cloud <business>      # GET localhost:8788/api/export → POST app.1stcontact.io/api/import
bin/copy-from-cloud <business>    # the same two calls with the origins swapped

```

One route to build; three problems solved — go-live for a builder-authored site, a **backup** for a draft that currently exists in one gitignored directory, and the staging seed §4 above wants.

### G3. Addressing by business name

`/api/import` resolves its target from the **authenticated scope**, not from the payload — the `slug` field names the source and addresses nothing ([[REQ-236]]). So `<business>` is resolved on each side independently: locally `tenants.name` → `biz_…`, in the cloud the same lookup under the session the Access token carries.

Two consequences to design for rather than discover:

1. **The cloud business must exist first.** Production holds 1 tenant and 0 sites (§B). Copying to a business that is not there has to fail with "create it in the builder first", not invent one — minting tenants from a laptop script is how a deployment gets a business nobody signed up for.

2. **The >1-site refusal still applies.** `/api/import` refuses a business holding more than one site as unresolvable ambiguity. Every business in the local store holds exactly one, so this is latent today and should stay an explicit refusal rather than a first-match guess.

### G4. Flags, and the one asymmetry that matters

`--site` is the default and the only one built now. The shape is extensible — `--contacts`, and whatever follows — but the two directions are **not** mirror images and the command must not pretend they are:

to cloud

from cloud

`--site`

the go-live path

the backup path

`--contacts`

plausible — laptop fixtures going up

**refused by construction**

Pulling contacts down puts real people's data on a laptop and into a dev store running `ACCESS_DEV_OPEN=1`. That is security note 1 above applied where it matters more, not less. The refusal belongs in the code, not in a warning in the help text.

### G5. What "the old dev path is dead" does and does not cover

`storage/sites/` has **three** uses and only the first is dead. Deleting the tree without separating them breaks the build:

Use

Status

What it needs

**Authoring a real site on disk** — `1c new/publish/checkout` against `--root sites`, then `bin/publish` up. The three sites in the tree (`1stcontact`, `gigabytealchemy`, `xgd`)

**Dead.** Superseded by the builder.

Delete the content; retire `bin/publish`.

**The reproduction substrate** — `1c repro --ref <bundle>` imports a capture as a site, then `render`/`shot`/`diff`/`values-diff`/`gate` run the fidelity loop on it. `storage/sandbox/` holds 7 such trees today

**Load-bearing** — it is the framework-growth loop, and [[DOC-41]] §1 already calls it out as the thing that resembles a raw server and is not.

Keep the fs-store code. Pin the repro loop to `storage/sandbox/` so it never writes to `sites`.

**A corpus of hand-authored L1 for conformance tests** — `req107` AC-4 globs `storage/sites/**`, `req105` globs `storage/sites/*/draft/pages/*.json`, `BUG-101` reads `gigabytealchemy/draft/pages/home.json`

**Load-bearing, narrowly.** Three tests read the _repo's_ tree; every other test builds its own under a temp `cwd`.

Move the corpus to a fixtures directory and repoint those three globs.

So the delete is: the three site trees, `bin/publish`, and `1c push` — **not** the fs-store module, which stays as the reproduction tier's storage and as the test transport dozens of suites open.

### G6. Order

Filed as [[REQ-289]] (1–3) and [[REQ-290]] (4–5); 6 is an acceptance item in each.

1. `GET /api/export` on the Worker, symmetric with `/api/import`.

2. `bin/copy-to-cloud` / `bin/copy-from-cloud` over it, `--site` only.

3. **Back up the LF draft** — the first real use, and the reason this is ahead of the pipeline work.

4. Repoint the three test globs; move the L1 corpus to fixtures.

5. Delete `storage/sites/`'s three trees, `bin/publish`, `1c push`.

6. Rewrite [[DOC-41]] §2 and §3 around the new verbs, and record that `storage/sites/` is no longer an authoring tier.

Steps 1–3 stand alone and are worth doing before 4–6 is scheduled: the backup is the urgent half, the tidy-up is not.

## H. The baseline drifted after it was applied — first deploy attempt, 2026-09-21

`bin/deploy`'s migrate hook failed on the first real run:

```
no such table: sessions: SQLITE_ERROR [code: 7500]

```

### What happened

Remote `d1_migrations`

one row — `0001_baseline.sql`, applied **2026-09-06 17:39:19**

Commits editing `0001_baseline.sql` **after** that

**12**, the first being `fc5c78dbe5` (2026-09-06), which is what added `CREATE TABLE sessions`

Remote tables

14

Tables the current baseline creates

31

`0002_session_rotation.sql`, first statement

`ALTER TABLE sessions RENAME TO sessions_pre_rotation`

The baseline's own header states the premise that licensed this:

> ITS SIBLINGS EDIT IT RATHER THAN FOLLOW IT. REQ-191 (`user_emails`) and REQ-193 (`user_names`) have, and REQ-194 (`accounts`) and REQ-195 (`contact_events`) will, land in THIS file. **Editing a baseline that has never been applied is not a second rebaseline.**

The premise was false by a few hours. It _had_ been applied — to production, that same afternoon. `d1_migrations` records a migration's **name**, not its content, so wrangler considers `0001_baseline.sql` done forever and starts at 0002. The applied migration and the file on disk are now two different schemas wearing one name, and there is no forward path between them.

**This is **`db/migrations/`**'s own rule — never edit an applied migration — broken in the one file that documents it.** Not carelessly: the author checked the premise and the premise was true when they wrote it. What was missing is any mechanism that would have noticed it stop being true.

### The fix: rebaseline, because this is the last free moment

Remote holds 0 sites, 0 users, 0 revisions and one vestigial tenant row (`acct_51a6…`, itself carrying a prefix `TENANT_ID` does not use). Nothing is lost by a wipe, which is [[REQ-190]]'s own argument applied a second time — and §B above already named this: _the empty database is the cheapest moment this will ever be._

`db/ops/rebaseline-remote.sql` drops the twelve app tables and `d1_migrations`, leaving `_cf_KV` (Cloudflare's) and `sqlite_sequence` (SQLite's). Then `wrangler d1 migrations apply DB --remote` replays 0001…0018 into an empty database.

**Verified before proposing**: the full chain 0001→0018 applies clean from an empty SQLite database, producing 31 tables. The failure is specific to the drifted remote, not to the migrations.

### The consequence for the pipeline — this is not a one-off

After the rebaseline, `0001_baseline.sql` is an applied migration again, and the same trap is re-armed for staging and for every future environment. The rule cannot be "remember not to edit it"; that is what just failed.

**Open question 4 now has a concrete answer to give.** The migration policy check (child 5) should compare a **content hash** of every migration file against what the target environment recorded, and fail the deploy when an applied file's bytes have changed — before anything uploads. `d1_migrations` stores only `(id, name, applied_at)`, so the hash has to live somewhere this repo controls; a checked-in manifest of `name → sha256`, verified by the migrate hook, is the smallest thing that works and needs no schema change.

That check would have caught this on 2026-09-06, against a database nobody had deployed to yet, instead of on the first production deploy a fortnight later.

---

## §I — First production deploy: what landed, and why `bin/smoke` failed (2026-09-21)

Read off the account directly after the operator ran the rebaseline, `bin/deploy` and `bin/smoke`. **The deploy worked. The smoke failure is correct behaviour, not a defect** — but it hid two blockers that smoke does not check for.

### I1 — The rebaseline succeeded, and it cleaned up the prefix mismatch for free

Fact

State

`wrangler d1 migrations list --remote`

_No migrations to apply_ — 0001…0018 all recorded

Tables

33 (31 app + `_cf_KV` + `sqlite_sequence`)

Platform tenant

`biz_51a6746495c8057e886ff98d4208e6b9` "1st Contact", created 2026-09-21T01:02:18Z

Control-app secrets

`ANTHROPIC_API_KEY`, `CLOUDFLARE_DNS_TOKEN`, `RESEND_API_KEY`

public-site secrets

**none**

Rows

1 tenant · 0 accounts · 0 users · 0 sites · 0 pages · 0 assets · 0 revisions · 0 domains

The `acct_…`/`biz_…` mismatch flagged in §C is gone: the wipe took the vestigial `acct_` row with it, and the row now present carries the id `TENANT_ID` names. `CLOUDFLARE_DNS_TOKEN` is now present, so the `site_domains` attach path (`serving.ts`) is configured for the first time.

### I2 — Smoke's one failure is a true statement about an empty deployment

Reproduced check by check against the live origins:

Check

Result

`apex_resolves`

**FAIL** — `GET https://1stcontact.io/` → 404 `Not Found`

`unknown_site_not_found`

pass — 404

`control_app_challenges_unauthenticated`

pass — 302 → `lagrangefoundry.cloudflareaccess.com`

`published_*` (6)

skipped — no `--site-key`

`control_app_workers_dev_closed`

skipped — no `--workers-dev-origin`

`APEX_SITE_KEY = ""` under `[env.production.vars]`, and there are zero sites and zero revisions to point it at. The apex 404s exactly as an unpublished site does, which is what `public-site/src/index.ts` says it should do. **Nothing here needs fixing; the apex needs content.** The REQ-147 gate — the assertion that actually matters — passes against a real Access challenge for the first time.

Incidental: neither `1stcontact-public-site.…workers.dev` nor `1stcontact-control-app.…workers.dev` resolves from here, so the `workers_dev = true` exposure recorded in §E is currently inert in production. Unverified rather than disproved — the account's workers.dev subdomain was assumed, not looked up — so EPIC-17 item 12 still stands.

### I3 — BLOCKER: nobody can enter the deployed builder

`PLATFORM_ADMINS = ""` at `apps/control-app/wrangler.toml` line 423, and `users` is empty. `admit()` (`identity.ts:1044`) runs `isPlatformAdminSeed` → false, then `findUser` → null, and denies `no_user`. **Cloudflare Access lets the operator past the edge and the application then turns them away.** Smoke cannot see this: its control-app check asserts a non-200, and a refusal is a non-200.

The same refusal blocks the automation. `SERVICE_TOKEN_IDENTITIES` maps `1stcontact-publish` to `martin-github@westhead.me` — an address with no `users` row — so `bin/copy-to-cloud` passes Access and is refused `no_user` one layer further in.

`PLATFORM_ADMINS`** is exactly the mechanism for this**, and using it is not a workaround. It is deployment configuration, so it works before any row exists; it is idempotent; and `ensurePlatformOperator` (`identity.ts:1196`) _leaves real rows behind_ — the tenant, an account, a `users` row with `platform_operator = 1`, an `owner` membership, an entitlement — so emptying the var afterwards does not undo the repair. That is what makes it break-glass rather than a second authorisation path. DOC-40 §6's promise is precisely that the break-glass capability cannot lock its holder out of the system that grants it.

Two cautions, both already paid for once:

- **Set it under **`[env.production.vars]`** (line 423), not the base **`[vars]`** (line 251).** A named environment inherits neither vars nor bindings — the refrain this file repeats about every key in it.

- **Edit the existing line; do not add a second.** `identity.ts:948` records a lockout caused by a duplicated `PLATFORM_ADMINS` key, where the address the operator signed in with was not the address the deployment named. That incident is why `denyAdmission` logs `platformAdminSeed`, so the same mistake is now diagnosable from `wrangler tail` instead of by reading configuration.

The address must be the exact one in the Access JWT, and both identities need naming: the operator's human address, and `martin-github@westhead.me` for the service token.

### I4 — BLOCKER: every public contact form will refuse

public-site holds **no secrets at all**, and `TURNSTILE_SITEKEY = ""`. `lead.ts:464` fails **closed** for any unidentified caller: with `TURNSTILE_SECRET` unset, `POST /api/lead` returns 503 _"This site cannot take messages at the moment."_ By design — a deployment that forgot the secret is refused, loudly, at the endpoint rather than quietly on the page.

So a site can go live, render correctly, pass every smoke check, and capture no leads — on a platform whose entire purpose is lead capture. **Smoke has no lead check**, which is the gap worth closing: `bin/smoke` asserts that bytes serve and says nothing about whether the form behind them works. That belongs with EPIC-15's probes (its synthetic form-fill is the same assertion), but the _configuration_ half is this epic's, and it is a go-live step rather than a ticket.

### I5 — The ordered path from here

Steps 1–2 and 7 are configuration edits to `wrangler.toml`, which need no ticket. Step 5 is blocked on [[BUG-134]], which is still `draft` and now sits on the critical path.

1. `PLATFORM_ADMINS` at line 423 ← the operator's Access address **and**`martin-github@westhead.me`.

2. `TURNSTILE_SITEKEY` at `apps/public-site/wrangler.toml` line 54, and push `TURNSTILE_SECRET` to public-site — or accept that no form works yet, knowingly.

3. `bin/build && bin/deploy`.

4. Sign in at `https://app.1stcontact.io/`, accept the terms. This writes the rows. If refused, `wrangler tail 1stcontact-control-app --env production` names `admission_denied` with `platformAdminSeed`, which separates "wrong address" from "never invited" without reading configuration.

5. Create **Lagrange Foundry** and **XGD** in the builder by hand — `bin/copy-to-cloud` never mints a tenant, deliberately. Then copy each business up.

6. Publish a revision per site in the deployed builder. This is the first exercise of that path anywhere, locally or in the cloud.

7. `APEX_SITE_KEY` ← the 1st Contact site key; redeploy public-site.

8. `bin/smoke --site-key <key>` — expect all green, including the six published-channel checks that have never run.

9. Attach `lagrangefoundry.ai` through the builder. `CLOUDFLARE_DNS_TOKEN` is present now, so this path is configured for the first time; the zone is in the account (§F5).

### I6 — What §I adds to the epic's standing scope

- **Open question 4's answer is unchanged and now urgent** — the migration content-hash check (child 5) is the control that would have caught the drift before it cost a deploy.

- **A new control for the pipeline**: a deployment whose `PLATFORM_ADMINS` and `users` are both empty is unenterable, and a deployment with no `TURNSTILE_SECRET` captures no leads. Both are silent, both are invisible to `bin/smoke`, and both will recur verbatim when staging is stood up. The migrate/secret hooks already probe what each key can do (REQ-264); **these two belong in the same report** — assert at deploy time that the target environment has an enterable identity and a working lead path, and say so in the deploy output rather than leaving it to be discovered by a person failing to sign in.

### I7 — `wrangler` advises the one change that would open the builder to the world

Every `wrangler` invocation against this app prints:

> _The following vars exist at the top level, but not on _`env.production.vars`_. This is probably not what you want... Please add these vars to _`env.production.vars`_: — _`ACCESS_DEV_OPEN`

`wrangler.toml:416` says the opposite, and it is right: _"No ACCESS_DEV_OPEN here, and that absence is the security control (REQ-145)."_ `ACCESS_DEV_OPEN = "1"` at line 253 bypasses the Access gate for `wrangler dev`. An operator who follows the tool's advice — on the deploy where nothing is working yet and every warning looks like a lead — publishes the builder, the customer data and the AI credentials to anyone who types the hostname.

The warning is generic and cannot be taught the exception, so the mitigation has to be local: the deliberate-absence comment already exists at line 416, but it is 163 lines below the warning's subject and nothing connects them. **The comment at line 136, where **`ACCESS_DEV_OPEN`** is declared, should name the warning verbatim and say to ignore it** — an operator reading the tool's output greps for the var, lands on its declaration, and must meet the refusal there rather than having to find it.

Filed as part of the same control §I6 asks for: the deploy output is what an operator reads at the moment they are most likely to act, and it currently carries a recommendation that is a security incident.

### I8 — Access identity was not readable, and the seed is a superset

`/cdn-cgi/access/get-identity` answered `{"err":"no app token set"}` — the browser held no `CF_Authorization` cookie, so the Access login had not completed. `wrangler tail` was also unavailable at first for an unrelated reason worth recording: **a positional script name plus **`--env production`** makes wrangler compose **`1stcontact-control-app-production`, which does not exist, because `[env.production]` declares `name` explicitly. Dropping the positional name resolves correctly.

Rather than block on discovering the exact JWT string, `PLATFORM_ADMINS` now names every candidate address. This is sound rather than sloppy: the seed fires only for an identity that actually authenticates, so an address that never signs in writes no row, and `user_emails` afterwards states which one fired. The var returns to `""` once the rows exist.

### I9 — The Access identity was recorded in the repository all along

§I8 chased the operator's Access address through `get-identity` (no app token), through `wrangler tail` (wrong script name), and finally through a superset seed. All three were unnecessary. `ACCESS.md`** §"Granted identities" is the record of the policy**, and it names exactly one human: `martin-github@westhead.me`. The file says why the shape is an allow-list rather than a domain rule, and a UAT (`test_UAT_FC_REQ-147_the_access_policy_is_recorded_in_the_repository`) exists to keep it current.

The address tried first, `martin-cloudflaire@westhead.me`, is not on it. Cloudflare's One-time PIN does not email a code to an address no policy admits, so the missing message was the gate working. Confirmed against production at the time: 0 `users`, 0 `login_tokens`, 0 `sessions` — neither the Access path nor the application's own magic-link path had produced anything at all.

`PLATFORM_ADMINS` is therefore a single address, and deliberately the same one `SERVICE_TOKEN_IDENTITIES` maps `1stcontact-publish` to: one seeded `users` row admits both the operator in a browser and `bin/copy-to-cloud` from their laptop.

**The lesson for the pipeline, and it is the same one §I6 and §I7 are circling.** Three diagnostic routes were tried against a live deployment before the checked-in record was read. `ACCESS.md` is exactly the artefact REQ-147 created for this, and nothing pointed at it: not the deploy output, not the refusal, not the runbook. When the identity check proposed in §I6 lands, its failure message should name `ACCESS.md` and quote the granted-identities table — the operator who cannot get in is precisely the reader who needs to be told where the answer is kept.

### I10 — Still outstanding before customers arrive: the Bypass policy

`ACCESS.md` §"Invitee paths" records an item that is not yet done and is not blocking today. The application's blanket policy covers all paths, so an invitee clicking their invitation meets Access first and is challenged with its own one-time-PIN email — two messages, one of which is from a system they have never heard of, and the second gate admits nobody who is not on the operator allow-list. The fix recorded there is a **Bypass** policy ahead of the allow-list, scoped to the sign-in and invitation paths.

Not needed for go-live of the platform's own sites (the operator is the only identity), but required the moment a real customer is invited. Noted here so it is not rediscovered by an invitee failing to accept.

### I11 — The seed worked, and two things §I5 got wrong

Confirmed in production 2026-09-21T20:03Z: one `users` row (`martin-github@westhead.me`, `platform_operator = 1`), one `accounts` row, one `memberships` row, one `entitlements` row, `tos_accepted_at` stamped. The break-glass path did exactly what `identity.ts` says it does, including leaving the terms unaccepted for the operator to accept like anybody else.

**[[BUG-134]] is not blocking.** §I5 named it on the critical path; the fix landed in `87c49670d8 fix(copy): one Access credential per end, chosen by direction [FREE-CODED]`, which is on `xgd-working`, and `bin/copy-to-cloud`'s header documents the two-credential design as shipped. Only the ticket's `status` is stale.

**The apex site does not need creating.** §I5 step 7 assumed the 1st Contact business would need a site and did not check whether one could be made. It could not: `/api/sites` is GET-only, and a site is written only by `provisionBusiness`, which the platform business never went through — `ensurePlatformOperator` calls bare `createTenant`. That would have been a dead end.

It is not one, because the local builder already holds the site, and **both sides resolve **`1st Contact`** to the same id from **`TENANT_ID` (`biz_51a6746495c8057e886ff98d4208e6b9`). `bin/copy-to-cloud "1st Contact"` therefore imports into the business that is already there. The general case is the interesting one: `copy-to-cloud` matches businesses BY NAME because ids are minted independently per side — the platform business is the one business where that is not true, and it is the one this step needs.

Local inventory, read from `apps/control-app/.wrangler/state`:

Business

Site

Version

1st Contact

`site_62d3d0097bbc7b6e86bdcdb3728389a3`

60

Lagrange Foundry

`site_936dd7c92e5e14df694dd9a80433aa4f`

210

XGD

`site_bca807fc7cdd0bf418b15e255f8c45c6`

23

Alice's Plumbing / Lettings / Old Salon

none

—

uat@westhead.me, Felix Test, Gigabyte Alchemy

test

—

`site_revisions` is **0 locally as well as remotely**. Nothing has ever been published in either builder, so the publish step is a first run in the strict sense — not a re-run of a path that works locally.

**A third control for §I6's list.** Both corrections above are the same failure: a runbook step asserted about a system without reading it. The remedy is not more care; it is that the go-live sequence should be _derived_ from the stores rather than written from memory — what businesses exist on each side, which names match, what has a site, what has a revision. That is a report `bin/` could produce and a person cannot reliably hold.

### I12 — `copy-to-cloud`'s local end must be the simulator, not the dev server

`bin/copy-to-cloud`'s `--origin` defaults to `http://localhost:8788`, which is the raw `wrangler dev` builder, and the first attempt was refused there with _"Cloudflare Access rejected this request: no Access token was presented."_ The refusal is BUG-134's fix working: it names the LOCAL end specifically, says which two variables to set, and warns that `--print-token` emits them under the CLOUD names.

**The default is the wrong end for two of the three businesses, and not because of the gate.** `scope.ts:329` records that the dev-open branch answers from `TENANT_ID` and is its last reader — so a connection straight to the dev server can only ever resolve to 1st Contact, whatever credential it carries. `bin/access-sim` (port 8799) is the only local front door that reaches a business other than `TENANT_ID`, which is precisely what the copy of Lagrange Foundry and XGD needs. The header says this in passing (_"in practice _`bin/access-sim`_"_); the DEFAULT says otherwise, and the default is what an operator runs.

Worth considering whether the default should be 8799, or whether the refusal should name the scope consequence rather than only the credential one — an operator who sets `LOCAL_ACCESS_*` and retries against 8788 gets past the gate and then silently copies the wrong business, or finds only one on offer.

### I13 — An unintended business may exist in production

After provisioning, production holds four businesses: 1st Contact (no site yet, as expected — it acquires one by import), Lagrange Foundry, XGD, and **Gigabyte Alchemy**, the last carrying a starter site `site_70772e9206eec9b1313a406b04076c06`.

Gigabyte Alchemy is one of the local builder's test businesses and was not part of the go-live plan. `provisionBusiness` writes a live `pro` grant, so it is a real customer as far as entitlements, quotas and any future billing are concerned. **Open with the operator**: deliberate, or a mis-click while locating the fulfil action.

If it is unintended it is worth more than a tidy-up. There is no route that deletes a business — provisioning is `POST /api/admin/businesses` and nothing undoes it — so a mistake at this control is permanent without hand-editing D1. That asymmetry belongs with the controls §I6 collects: the one operator action that mints a tenant, a membership, a grant and a site has no confirmation step and no inverse.

### I14 — `--backup` is a mode, and its success line reads like a copy

`bin/copy-to-cloud --backup FILE "1st Contact"` was run expecting a copy that also left a committable snapshot. `--backup` is exclusive: line 52 states it _"writes the SOURCE side's export to FILE and touches the destination not at all."_ Nothing reached production; 1st Contact still held no site afterwards.

The documentation is correct and unambiguous. What made the mistake survive is the **success line**:

```
backed up '1st Contact' from http://127.0.0.1:8799
  site    site_62d3d0097bbc7b6e86bdcdb3728389a3
  pages   1 (home.json)
  assets  6
  file    /Users/martin/.../storage/backups/1st-contact.json

```

Every fact there is true, and an operator who believed they had asked for a copy reads it as one completing — the site id, the page count and the asset count are exactly what a successful copy would report, and the word _backed up_ is the only thing separating them. Nothing says the destination was not written.

**The cheap fix is one clause in that line** — `"backed up … (destination not touched)"` — or, better, refusing the combination: `--backup` alongside a copy is a reasonable thing to WANT, and a flag whose presence silently cancels the command's named operation is a shape worth not having. Either the flag becomes additive, or it says plainly that it replaced the copy.

Related to §I12: both entries in this section are the same class of defect. The tool's prose is right, its behaviour is right, and its **operator-facing output** is what misleads — a refusal that names the credential but not the scope consequence, and a success that names the export but not the untouched destination. That is the surface worth auditing before the next environment is stood up, and it is cheaper than any of the controls §I6 proposes.

### I15 — A 403 from the app is not a missing credential, and `copy-to-cloud` says it is

`bin/copy-to-cloud` reached the cloud end and was refused:

```
INTERNAL: Listing the businesses at https://app.1stcontact.io was refused with 403:
1st Contact cannot open this for you at the moment. Please get in touch and we will sort it out.
The CLOUD end is behind Cloudflare Access. Set CF_ACCESS_CLIENT_ID and
CF_ACCESS_CLIENT_SECRET to a service token, or pass --client-id and --client-secret.

```

The quoted body is `DENIED_MESSAGE` (`identity.ts:459`) — **the application's own refusal**. Reaching it means Cloudflare Access ACCEPTED the credential and the Worker turned the caller away afterwards. The advice printed underneath is therefore the opposite of the diagnosis: it tells an operator who has a working credential to go and set one.

`copy-to-cloud` treats any 403 on an end as "no credential for that end". That is right for Access's own 403 and wrong for ours, and the two are distinguishable: a refusal carrying `DENIED_MESSAGE` is an ADMISSION refusal. **The handler should branch on the body it already has** — it quotes it — and say so.

This is the third instance of one defect in this section (§I12 credential-vs-scope, §I14 backup-vs-copy). The pattern: each message is written for the failure its author had in mind, and is emitted for a wider set of failures than that. Worth one pass over `bin/`'s operator-facing output as a unit rather than three separate fixes.

State ruled out before reaching for the log, for the next reader: the operator's `users` row, account, and `owner` memberships on all four businesses are present, `active`, unrevoked and unexpired; the browser path works and provisioned three businesses through it. `entitlements.account_id` is NULL on every row, which LOOKS like the cause and is not — `businessesFor` (`identity.ts:1431`) joins `memberships`, not `entitlements`. The remaining candidate is the service token's identity: the `SERVICE_TOKEN_IDENTITIES` mapping keys on the `common_name` in Cloudflare's JWT, which is the token's NAME and not its client id, so a token provisioned under any other name resolves to no email and is refused `no_email`.

`DENIED_MESSAGE` cannot say which — deliberately, as an anti-oracle — so `denyAdmission`'s structured log is the only route to the reason. That is the second time this section has had to reach for `wrangler tail` to learn something the operator needed (see §I8), which strengthens §I6's case: the deploy-time identity check should report whether the SERVICE TOKEN is admissible, not only whether a human is.

### I16 — BUG: `SERVICE_TOKEN_IDENTITIES` is keyed on a name Cloudflare never sends

The `no_email` refusal in §I15 is not a misconfiguration. It is a defect in [[BUG-59]]'s design, and this is the first time that design has met real Cloudflare Access.

`actingEmail` (`identity.ts:1017`) resolves a service token by comparing the JWT's `common_name` against the left-hand side of each `SERVICE_TOKEN_IDENTITIES` entry. The configured entry was `1stcontact-publish`, which is the **friendly name** passed as `bin/access-token --name`. Cloudflare stores that label in the dashboard and mints the client id separately; the operator's is `29edd0e0ede45619455f21128c7b88ce.access`. The label is not in the token.

So the comparison could never succeed, `actingEmail` returned `null`, and `admit` refused `no_email` with `email: null` — exactly what the log shows.

**Why it was not caught.** `bin/access-sim` is self-consistent: it derives `SERVICE_NAME` from its own `CLIENT_ID` by stripping `.access`, and its `--print-env` emits the matching `SERVICE_TOKEN_IDENTITIES` line. Local runs therefore prove the mechanism works against a simulator that agrees with the assumption, and prove nothing about Cloudflare. `ACCESS.md`'s identity table records `1stcontact-publish` as the identity, so the documentation, the configuration and the simulator all agree with each other and all disagree with the product.

This is the sharpest instance of the pattern EPIC-17 exists for: a component verified end-to-end against a stand-in for the thing it integrates with.

**Interim fix applied** (configuration, `wrangler.toml:447`): the entry names the label AND both spellings of the client id. Unmatched entries cost nothing; a missing one costs the call. The label is retained because it is what `ACCESS.md` names and what a reader looks for.

**The real fix is a ticket, not this edit**, and there are two candidates:

1. `bin/access-token` holds the client id at the moment it creates or rotates a token, and already prints the two `export` lines. It should also print the exact `SERVICE_TOKEN_IDENTITIES` entry to paste — the operator would never have had to learn any of this. Cheapest, and fixes the next environment too.

2. `actingEmail` could accept either spelling of the client id as well as the label, so configuration written from `ACCESS.md` works as documented. More forgiving, but it makes the key ambiguous, which is the opposite of what a mapping wants.

(1) is the recommendation; (2) only if the documented-name form must keep working.

Whichever lands, `ACCESS.md` needs a line saying what the left-hand side actually is, because its identity table is the artefact an operator reaches for and it currently implies the label.

### I17 — The copy works, and publishing has a prerequisite §I5 missed

`bin/copy-to-cloud "1st Contact"` succeeded once the §I16 mapping was deployed (21:40:18Z). The site landed as `site_c4bed79aeb647305a5e3098f70d6dca3` carrying 1 page and 6 assets, verified in production.

**The site id is new on the destination while the business id is not.** Both sides resolve `1st Contact` to `biz_51a6746495c8057e886ff98d4208e6b9` because both read it from `TENANT_ID` (§I11), but the import mints a fresh site key. `APEX_SITE_KEY` must therefore be read from production after the import and never copied from the local store — a mistake that would 404 exactly as an unpublished site does, and would look like the import having failed.

**Publishing requires a public address, and §I5 step 6 did not know it.**`publish.ts:293` refuses with 409 `NO_PUBLIC_ADDRESS` when a site holds zero `site_domains` rows, and production holds zero for every business. The check is over the list's LENGTH only — `[[REQ-238]]` names "a publish check that names the `1stc.site` hostname rather than asking whether any address exists" as its own falsifier — so a claimed hostname and a connected domain satisfy it equally.

`site_domains` is keyed on `id` with `site_id`, `kind`, `status` and `canonical`, so a site holds MANY addresses. Claiming a `1stc.site` hostname is therefore additive and does not commit the business against connecting its real domain later; `canonical` decides which is the public face.

That matters for sequencing. Claiming the hostname unblocks the publish with no DNS dependency, which **separates the first-ever publish from the first-ever domain attach** — two paths that have never run in production and would otherwise fail as one event with one error to interpret.

A correction worth recording against my own advice: this section first framed claiming a `1stc.site` name as something to avoid until the real domain was ready, on the grounds that the namespace is permanent and non-recyclable. The operator's objection is the right one — permanence is the reason to claim `lagrangefoundry.1stc.site` for the Lagrange Foundry business EARLY, not late. It is a first-come namespace; the risk is not spending a name, it is someone else holding the one name that business should have. `hostname.ts`'s permanence argument is about not recycling names between owners, not about hesitating to take the obviously correct one.

### I18 — The deployed builder mounts nothing, and every layer is healthy

After the import, `https://app.1stcontact.io/` renders the boot guard's panel: _"The builder did not start… The document loaded; its client did not."_ Identical in Safari and Firefox, so not a browser-compatibility fault. The only console entry in Firefox is a favicon 404.

**What the panel's own shape rules out.** `boot-guard.ts` renders a _"What failed:"_ line whenever it captured an `error` event or an `unhandledrejection`. That line is ABSENT, so in the 4-second window the guard saw neither. A 404 in the module graph — the most common cause and the one the guard was built for — is therefore excluded, as is a throw during mount and a rejected top-level await.

**What was verified healthy**, each read directly:

`dist-assets`

112 files; all 7 import-map targets and 6 stylesheets present

Asset staleness

18 files newer than the build, all under `tools/generate/src` — Worker code, not client

`/api/sites` (guard's own probe)

200, one site, `latest: null`

`/api/businesses`

200 — person, 4 businesses, every one `selectable: true`, `lapse: null`

`/api/status`

200, `ai: true`

So `main.js`'s top-level `await loadOrSignOut(...)` resolves with good data and `mountBuilder` is called. `mountBuilder` is synchronous and renders through `mountShell(root, …)` (`app.js:221`) — the shared `@lagrangefoundry/webui-shell` component. Something there returns without writing to `#app`.

**The untested path is a fresh origin.** `mountBuilder`'s own documentation notes the remembered business selection lives in "the shell's own namespaced storage". `app.1stcontact.io` has never written that storage; the local builder has had it for months. First-ever load with no stored selection is a state the local builder stopped being able to reach after its first run, and the deployed one is in it permanently until something mounts. **Reproduction to try: the local builder in a private window.**

### I19 — Latent: `fetchBusinesses` turns any non-401 failure into an empty builder

Not today's cause — `/api/businesses` answers 200 — but found while chasing it, and it would have made this hunt far worse.

```
const res = await send(fetchImpl, '/api/businesses')
if (res.status === 401) throw new SessionEndedError(SESSION_EXPIRED)
if (!res.ok) return { person: null, businesses: [] }

```

Only 401 is treated as a session failure. **A 403, a 404, a 500 or a 502 all return an empty business list**, which `loadOrSignOut` reads as success, so `mountBuilder` runs with `businesses: []` and `person: null` and draws nothing. `fetchAiStatus` has the same shape one function above (`if (!res.ok) return { ai: true, message: null }` — and note it defaults `ai` to TRUE, so a failing status probe reports the AI as working).

The result is a blank builder with no throw, no rejection, an empty console and a boot guard that can only say it does not know. Given §I15 established that a 403 carrying `DENIED_MESSAGE` is a routine and expected failure of this exact route, this is a live path and not a hypothetical.

`mountBuilder`'s comment says empty "IS ORDINARY AND MEANS 'NO IDENTITY BEHIND THIS HOST'" — true of the Node transport and a headless suite, and exactly wrong for a browser whose request was refused. The two states are indistinguishable downstream because the distinction is discarded at the fetch. Worth a ticket: a refused fetch should be a third state, not the same value a headless host produces.

### I20 — The builder asks for a site unscoped, and the Worker correctly refuses

The blank builder is not a missing asset. `https://app.1stcontact.io/webui/webui-shell/src/index.js` serves correctly to an authenticated browser, so the module graph is intact and §I18's remaining suspects are all cleared. A back-navigation got the client far enough to issue two requests, and both 404:

```
/api/pages?site=site_23c1afb3739dadf62347a5008e8a7dea
/preview/site_23c1afb3739dadf62347a5008e8a7dea/draft/

```

`site_23c1afb3…` is **Lagrange Foundry's** starter site. Neither URL carries a `/b/<business-id>/` prefix, and that is the whole finding:

```
function scoped(path) {
  return businessScope === null ? path : `/b/${encodeURIComponent(businessScope)}${path}`
}

```

`businessScope` was `null`, so the request went out unscoped, resolved to some other business, and the site was not in scope. The 404 is the Worker being right.

`setBusinessScope` has exactly one caller — `selectBusiness()` (`app.js:1435`) — which sets the scope AND writes the remembered id to storage in the same breath. The client was therefore holding a **remembered site with no matching remembered business**: it knew which site to open and had nothing to open it under.

**Why this is a deployment-shaped bug rather than a local one.** The local builder has had both values in storage since its first run and never revisits the state where one exists without the other. A fresh origin reaches it on the first load, and any interruption between selecting a site and recording its business leaves it there persistently — reloading does not clear it, which is why the symptom looked like a build or asset fault for as long as it did.

Two things worth a ticket, separately from the immediate unblock (clearing storage):

1. `selectBusiness`** writes two facts that must agree, and nothing enforces it.** The site key and the business id are remembered independently; the code that reads them back does not check that the remembered site belongs to the remembered business, and a site key is globally unique so the check is cheap. `app.js`'s own comment argues at length that [[REQ-236]] made the survives-a-switch test exact _because_ a globally unique key allows it — the same reasoning applies one level up and was not taken.

2. **An unscoped request for a scoped resource should not be silently possible.**`scoped()` returning the bare path when `businessScope` is null is correct for the routes that are genuinely unscoped and wrong for `/api/pages`, which cannot mean anything without a business. The failure surfaces as a 404 from the far end rather than as a refusal at the call site, which is what sent this investigation through assets, browsers, import maps and DNS first.

This also resolves the §I18 puzzle. The client was not failing to mount; it was mounting and then asking for something it could not name, and every layer we checked was healthy because every layer was.

### I21 — BUG: the boot guard breaks the builder it was written to diagnose

The blank builder, the collapsed chat composer and the whole of §I18 are one defect. Confirmed by removing the guard's panel from the live page — `document.getElementById('app').firstElementChild.remove()` — after which the chat window appeared and the builder was fully usable.

**The chain.** Mounting in production exceeds `BOOT_DEADLINE_MS = 4000`. That is not a fault: the composer's rich editor is four cross-origin dynamic imports — `https://esm.sh/@tiptap/core@2` and `starter-kit@2` (`webui-markdown/src/editor.js`), `dompurify@3` (`webui-chat/src/sanitize.js`), `marked@9` (`webui-markdown/src/marked.js`) — on top of every module fetch passing through Cloudflare Access. Localhost pays none of that, which is why four seconds was ever enough.

The guard then fires **on a deadline rather than on a failure**, writes its panel into `#app`, and the shell mounts alongside it. The stray unclassed `div` as first child of the mount point breaks the shell's layout, and what collapses is the chat composer.

**The docstring's guarantee is one-directional and the other direction is the one that happens.** `boot-guard.ts` states: _"IT NEVER HIDES A WORKING BUILDER. Every path checks that _`#app`_ is still empty immediately before writing, so a slow-but-successful mount is never replaced by an error panel it raced."_ Both `stillEmpty()` checks guard against the guard OVERWRITING a builder that mounted first. Neither covers the builder mounting SECOND, and the guard has no means to retract what it wrote.

**Why it cost so much to find.** Every symptom pointed away from the guard, because the guard is the thing that reports symptoms. Its panel said the client had not started; the client had started and was slow. It printed no _"What failed:"_ line — correctly, since nothing failed — and that absence was read as "the failure is of a kind the guard cannot see" rather than "there is no failure". The investigation went through assets, staleness, symlinks, import maps, browser compatibility, fresh-origin storage, Access on the asset path, and admission, all of which were healthy, before the panel itself became a suspect.

**Three fixes, and the first two are independent of the third:**

1. **Render outside **`#app`**.** The guard must not put anything inside the element the application mounts into. A fixed-position overlay on `document.body` cannot corrupt a layout whatever else is wrong, and costs nothing.

2. **Retract on arrival.** After writing, observe `#app`; if the builder mounts, remove the panel. The docstring's promise then holds in both directions rather than one.

3. **Fire on failure, not on a timer.** A deadline cannot distinguish "did not start" from "has not started yet", which is the whole defect. `main.js` could set a flag when its module body begins executing, letting the guard tell a module graph that never ran from one that is merely slow — and a slow mount is then reported as slow, which is useful, rather than as broken, which is false.

A raised deadline alone is not a fix: it re-tunes a race against a network whose latency is not ours to predict, and leaves fixes 1 and 2 unmade.

**Adjacent, worth deciding separately.** The builder depends on `esm.sh` at runtime for its editor, sanitizer and markdown renderer. `input.js:511` degrades to a plain textarea when the CDN is unreachable, which is the right instinct — but it makes the product's authoring surface depend on a third party being up, and makes first paint pay four cross-origin round trips. Vendoring those four into `dist-assets` would remove the dependency and the latency that caused this bug in one step.

### I22 — The AI key is invalid, and two capability checks both said otherwise

The first chat turn in the deployed builder returned, verbatim from Anthropic:

```
401 {"type":"error","error":{"type":"authentication_error","message":"API key is invalid."}}

```

So `ANTHROPIC_API_KEY` is present on the Worker and its value is refused. Two separate mechanisms exist to prevent exactly this, and both reported healthy.

**1. **`/api/status`** answers presence, not capability.** It returned `ai: true`, which is what the builder draws its "the assistant is available" state from. Nothing in that path exercises the credential.

**2. The deploy-time probe is skipped for a stored secret.**`bin/deploy.d/secrets/10-anthropic-api-key` states the requirement precisely — _"AND PRESENCE IS NOT CAPABILITY ([[REQ-264]]). A revoked key, or one scoped to the wrong organisation, satisfied every check this hook made and then failed on the first turn a customer took"_ — and probes `GET /v1/models` when a value is SUPPLIED. When the secret is already in the store it reports _"already on … — left alone, not probed"_ (line 134) and the deploy passes.

That branch is the steady state for every deploy after the first, so the probe covers the rotation and leaves the standing credential unexercised — reproducing the exact failure the comment above it describes.

**The rationale for skipping is sound and the conclusion does not follow.** A secret cannot be read back out of Cloudflare, so the deploy host genuinely has nothing to probe. But the thing that holds it can: **the capability question should be asked of the Worker, not of the operator's shell.** A `GET /api/status` that actually exercises the key — or a deploy-time call to an endpoint that does — closes the hole without requiring anybody to re-supply a value Cloudflare already has, which is the practice this hook was deliberately written to avoid.

That also fixes `/api/status` at the same time. Both defects here are one: two places report "the AI works" from the presence of a configuration value, and neither asks the only system that can answer.

Interim: re-supplying the key through `bin/deploy` takes the supplied path and probes it, failing the deploy if Anthropic refuses — which is the behaviour wanted on every deploy, not only on a rotation.


### I23 — The orphaned conversations were repaired in place, and verified

Done, and re-verified against production on 2026-09-22 rather than asserted from memory. Lagrange Foundry now holds exactly two sessions, both addressed to production ids, both carrying their transcripts:

| uid | session_id | backend | transcript |
|---|---|---|---|
| `chat-fa105276` | `site-site_23c1afb3…` | `claude+site:site_23c1afb3…` | 253,272 B chat + 2,020,732 B tool |
| `chat-e3df9535` | `business-biz_33086a94…` | `claude+business:biz_33086a94…` | 4,534 B chat + 3,720 B tool |

No session addressed to a local id remains anywhere in the store, and no duplicate placeholder survives on either production id.

**What the repair did**, in order: backed up all six affected rows to `storage/backups/chat-fix-before.json`; deleted the two auto-created empty placeholder sessions and their comments (313–317 B each, no turns); then repointed **both** `fields.session_id` and `fields.backend` on the two imported sessions.

**`backend` is the field that would have been missed.** `session_id` is the obvious carrier and the one [[BUG-137]] was filed against, but `backend` holds the same id in a second derived form (`claude+site:<id>`) and is what actually binds a session to its subject. Repointing only `session_id` produces a session the builder can find and a backend reference that names nothing — a second, quieter version of the same bug. The fix under BUG-137 must rewrite both.

**Still outstanding, and deliberately not run:** 1st Contact and XGD hold only empty placeholders — their `--chats` copies never ran. Running them now would land orphaned exactly as these did, because BUG-137 is unfixed. Either wait for that fix, or run them and repeat this repoint, which is mechanical now the shape is known.


### I24 — §I23's repair fixed the index and left the payload

The repointed sessions still failed on open, with `Unknown backend "claude+site:site_936dd7c9…"` naming the *old local* site id — the one §I23 recorded as gone. It was not gone, because a chat has **two** places that name its backend and §I23 rewrote one:

- **`fields.session_id` / `fields.backend` on the chat ticket** — the index. What `list` reads, and what the "available backends" half of the error is built from.
- **the `<!-- xgd-session -->` envelope at the head of the `chat_transcript` comment body** — the payload. What the session manager resumes from, carrying its own `id`, `backend`, `backend_ref` and `chat_ticket_uid`.

That split is why the symptom looked incoherent: the session listed correctly and then failed the instant it was opened, and the error's own "available" list was exactly the values §I23 had set. Both halves of the message were reporting the same half-finished repair from opposite sides.

`chat_ticket_uid` was stale too — `chat-50932534` and `chat-3484636f`, neither of which exists in production — so the envelope also pointed its own comment at a ticket that was never copied.

**The fix is header-only, and the boundary is the point.** In `comment-fec1c7d8` the old site id occurs **6 times, 2 of them in the envelope**; the other 4, plus 6 occurrences of the old business id, are inside the conversation, where the ids were discussed in the course of the build. A find-and-replace over the body — the obvious repair — would rewrite what was said. Only the bytes before the first `-->` were replaced.

Byte accounting confirms it: the 253,272-byte transcript is unchanged in length (every substituted token is the same width) and its in-body stale-id counts went 6→4 and 6→6, losing exactly the two envelope occurrences. The 4,534-byte one lost exactly 36 — the stale `backend_ref` UUID from the local run, cleared because it names a conversation on a backend this deployment does not have.

All eight production sessions now agree between index and envelope. Old headers are at `storage/backups/chat-header-before.json`.

**The general lesson for [[BUG-137]]:** the copy path has to rewrite the envelope too, not just the ticket fields. Whatever fix lands there is incomplete if it only repoints the index — this defect will simply reappear on the first `--chats` copy of 1st Contact or XGD.


### I25 — "The connection to this reply was lost" is the Worker dying of memory

Reproduced directly against production, without the operator, by posting a turn to `/b/<biz>/api/ai/prompt` with the `bin/access-token` service credential. Two sessions, same business, same deployment:

| session | chat | tools | result |
|---|---|---|---|
| `business-biz_33086a94…` (settings) | 4.5 KB | 3.7 KB | **200, clean** — text frames + `done` `status:complete`, 4.0 s |
| `site-site_23c1afb3…` (site builder) | 253 KB | 2.02 MB | **200, zero bytes**, 5–15 s, connection closed with no frame |

The tail names it exactly:

```
outcome    = exceededMemory
wallTime   = 14843 ms      cpuTime = 8815 ms
exception  = Error: Worker exceeded memory limit.
route      = /b/biz_33086a94…/api/ai/prompt
```

**Every symptom follows from that one fact.** `streamTurn` returns its `Response` before `start()` runs, so the 200 and its headers are already on the wire when the isolate is killed — the client gets a successful response with an empty body and no terminal frame, which is precisely the condition `follow()`'s `finally` reports as lost. The `catch` that would have turned a failure into a readable `text` frame never runs, because nothing in the isolate runs. The `finally` that flushes the audit dies with it, which is why neither transcript grew by a byte. And it is perfectly deterministic — same session, same data, same death — which is the operator's "100% reproducible".

**It is not delegation, not the credential, and not [[BUG-137]]'s repair.** The settings session proves the turn path, the delegation start-up validation and the Anthropic key are all healthy on this deployment. What §I24 changed was only that this session became *reachable*; the memory ceiling was always behind it, and no one had got past the `Unknown backend` refusal to meet it.

**Rendering is not the problem — prompt construction is.** The browser displays the whole 253 KB transcript without difficulty (§I26's 403s are proof it rendered). What exceeds 128 MB is the Worker materialising the session to build a prompt from it.

The defect is that **nothing bounds what a resume materialises**. A session grows without limit, every turn re-reads the whole archive, and the first turn that crosses the isolate's ceiling kills the conversation permanently — there is no degradation, no warning, and no error the operator can read. The fix is a windowed resume; a session that cannot be re-entered is a session that has been destroyed by its own success.

-

-

-


---

## §J — A deployed `dev` environment (2026-09-23)

The operator asked whether live-changing code can be separated from the development
environment, and specifically for `bin/deploy --env dev` so that a snapshot reaches
dev on their command. Findings, read off the tree rather than recalled.

### J1 — The flag already exists. The script needs nothing.

`bin/deploy` takes `--env <name>` today, defaults it to `production`, exports it to
every hook as `DEPLOY_ENV`, composes `npx wrangler deploy --env "$env_name"`, and
reads the deployed Worker's name out of `[env.<name>].name` rather than assuming it
equals the directory. Its own `--help` already advertises `bin/deploy --env staging
control-app`. So the ask is satisfied by the script as written; what is missing is an
environment for it to point at.

### J2 — The parity UAT already guards a new environment, for free.

`tests/test_UAT_FC_REQ-144_deploy_scripts.test.ts` iterates **every** named
environment in each app's `wrangler.toml` — `for (const envName of envNames)` — and
fails when one does not restate every top-level var and binding. So the moment
`[env.dev]` is added it is held to the same completeness rule as `[env.production]`,
with a message naming exactly what is missing. This is the single biggest reason the
work is tractable: the failure mode a second environment usually introduces (a
binding silently absent, because a named environment inherits nothing) is already
mechanically caught.

Its one exemption is `ACCESS_DEV_OPEN`, and it is scoped to `config.envs.production`
(`test_UAT_FC_REQ-145_build_artifacts.test.ts:84`). That is correct for production
and a **gap for dev**: nothing would stop `ACCESS_DEV_OPEN` being restated under
`[env.dev.vars]`, and a deployed Worker with that var set has no Access gate at all.
The assertion must become "no named environment names it", not "production does not".

### J3 — `bin/deploy --env dev` is dangerous TODAY, and this is the one thing that
must be fixed before the flag is used.

`bin/deploy.d/migrate/10-d1-site-store` honours `DEPLOY_ENV` but names the database
**literally**, three times:

    npx wrangler d1 execute 1stcontact --env "$DEPLOY_ENV" --remote --json ...
    npx wrangler d1 migrations list 1stcontact --env "$DEPLOY_ENV" --remote
    npx wrangler d1 migrations apply 1stcontact --env "$DEPLOY_ENV" --remote

That positional is the database's own name, not the binding's. So `bin/deploy --env
dev` would verify and apply migrations against **production's** D1 while uploading
code to dev. The hook must resolve the name from the env's own `d1_databases` block,
the way it already resolves `migrations_dir` from a single declaration.

`bin/migration-manifest` is fine — it takes `--env` and reports per-environment — but
it scrapes `migrations_dir` and *errors* when more than one distinct value is
declared, on the stated principle that the blocks must agree. A third block under
`[env.dev]` must therefore declare the same `migrations_dir`, which it should.

`bin/build` also hardcodes `--env production` for its per-app `wrangler deploy
--dry-run --outdir dist`, for a good reason (a config error that only exists under
the deployed environment is the class of bug it exists to catch). With two deployed
environments that reasoning now asks for `bin/build --env <name>`, or a build that
rehearses both.

### J4 — What must be provisioned, and what comes free.

Account-side, one-time:

| | |
|---|---|
| D1 | one new database. **18 migrations against an empty database** — the easy case, and the same argument §H made for the rebaseline |
| R2 | two buckets (`SITES`, `BLOBS`) |
| Rate limiter | a second `namespace_id` — an opaque handle chosen per binding, not a secret |
| Durable Object | **free**: a new Worker name gets its own namespace, and `[[env.dev.migrations]]` replays the tag from an empty store |
| Browser / Images / AI | **free**: account-level bindings, no per-environment resource |
| Secrets | **not free, but already automated**: secrets are per-script, so all four must be pushed again. The hooks already do this through `--env`, so exporting the values and running `bin/deploy --env dev` pushes and *probes* them |

`apps/public-site`'s `LEAD_INTAKE` and `ASSET_GATE` are service bindings naming
`1stcontact-control-app` by literal name. Under `[env.dev]` they must name the **dev**
control-app, or a lead captured on dev is written into production's database by a
Worker that never appears in the dev deploy.

### J5 — The decisions, which are the actual work.

1. **Hostnames and Access.** Access attaches to a hostname, so dev needs its own
   application on its own hostname and therefore its own `ACCESS_AUD` — that value is
   per-application. `ACCESS_TEAM_DOMAIN` is shared. The allow-list is the one
   `ACCESS.md` records.
2. **`workers_dev` inheritance.** `apps/public-site/wrangler.toml` sets `workers_dev
   = true` at the top level, and `workers_dev` **is** inherited by a named environment
   — the control-app's own comment records this as the exception to the rule. An
   `[env.dev]` silent about it ships a guessable `*.workers.dev` hostname that no
   Access policy covers, serving the dev public site and `/api/lead`. This is
   [[EPIC-17]] item 12 in a second instance.
3. **`SESSION_COOKIE_DOMAIN`.** Production sets it to `1stcontact.io`. If dev lives at
   a subdomain of that zone and restates the same value, a dev session and a
   production session share one cookie. This is the sharpest trap in the set, because
   the parity UAT will *demand* the var be restated and cannot know the correct value
   differs.
4. **Turnstile.** A second widget scoped to the dev hostnames, or every dev lead 503s
   — `lead.ts` fails closed for anonymous callers (§I).
5. **`TENANT_ID`.** Dev needs its own platform business id; the production value names
   a row in production's database.
6. **Seeding dev with content.** `CLOUD_ORIGIN` in `tools/generate/src/cli/copy.ts` is
   the constant `https://app.1stcontact.io`. `--origin` overrides only the **local**
   end, so `bin/copy-to-cloud` cannot today address a second deployment. A
   `--cloud-origin` (or an `--env`-selected one) is what makes dev seedable from the
   laptop, and it is small.
7. **`bin/smoke`** knows only the production origins.

### J6 — Assessment

The flag is done; the environment is a day's careful configuration, most of which is
mechanical and guarded by an existing test. Three items are genuine code changes and
should not be skipped: the migrate hook's hardcoded database name (J3, a
production-data hazard), the `ACCESS_DEV_OPEN` assertion widening to every named
environment (J2), and a cloud-origin flag on the copy pair (J5.6). `bin/build --env`
is a fourth, smaller one.

The ordering that keeps it safe: fix the migrate hook **first**, then declare
`[env.dev]` and let the parity UAT tell you what is missing, then provision, then
`bin/deploy --dry-run --env dev` — which reaches Cloudflare and lists migrations
without applying them — and only then the real run.


---

## §K — One local dev environment, deployed to rather than edited into (2026-09-23)

§J answered a question the operator did not ask. It is kept because a cloud
staging environment remains a real option and its findings are accurate, but it is
**not** this section's subject. What was actually asked for is a **local** dev
environment, isolated from the working tree, that the scripts treat as a deploy
target — and a single command to start, stop and clean up all of it.

### K1 — What is in place, stated correctly

The current problem is not "there is only production". It is that **locally there
is no boundary at all**.

`pnpm dev` runs `./bin/1c builder`, which composes (`dev-env.ts:184`)
`wrangler dev --port 8788` plus the env-file layering. Three consequences:

- **No `--env`**, so it reads the **top-level** `wrangler.toml` block —
  `d1-migrations.ts:82` states this explicitly as why it reads the top-level block
  too. That block carries `ACCESS_DEV_OPEN = "1"`.
- **`wrangler dev` watches.** Every save rebuilds and reloads, so the running
  Worker and the file being edited are the same bytes, continuously. A
  half-finished function or a just-written migration is immediately what serves.
- **State persists to `apps/control-app/.wrangler/state`** — `reset.ts:17` calls it
  "the whole of what survives a restart … There is no second place."

### K2 — The operator's correction, recorded because it closes a question

Asked whether a deployed dev environment should share `.wrangler/state` or get its
own, the operator's answer was that the question is malformed. The new environment
**REPLACES** today's arrangement entirely. There is **ONE** local dev environment;
the way to use it is to run a deploy; it holds **THE ONLY COPY** of the dev data.
There is therefore nothing to share with and no seeding fork. `.wrangler/state`
does not become a second store — it becomes this environment's store.

This also settles a scoping question that must be explicit because it reaches
several files: `bin/dev up` becomes the **only** way to run the dev environment.
`pnpm dev` / `pnpm dev:control` stop being entry points, and `1c builder` becomes
something `bin/dev up` calls rather than something an operator types. `dev-env.ts`,
the root `package.json` scripts and any doc that says "run `pnpm dev`" are in scope.

### K3 — The isolation mechanism, and why most of it already exists

`wrangler dev` has no `--no-watch`, so the freeze cannot come from a flag. It comes
from **what is watched**: point it at a snapshot directory that nothing writes to
except the next deploy, and the environment is frozen by construction.

Three of the four pieces are already built:

1. **The ceremony.** `bin/deploy --env <name>` already parses, exports `DEPLOY_ENV`
   to the migrate and secrets hooks, reads the Worker name from `[env.<name>].name`
   and prints the capability report. The "looks like a cloud deploy" requirement is
   satisfied by using this path, not by imitating it.
2. **The artifact.** `bin/build` stage 4 runs `wrangler deploy --env production
   --dry-run --outdir dist` and leaves a complete bundled Worker at
   `apps/control-app/dist/worker.js`. It exists on disk today, purely as a
   typecheck gate, and **nothing consumes it**. That bundle is the snapshot.
3. **The runner.** The installed wrangler's `dev` accepts `--no-bundle`,
   `--persist-to`, `--env` and `--port` (verified against `wrangler dev --help`).

What is missing is **the terminal verb**. `bin/deploy` ends in `npx wrangler
deploy`, which uploads. The script's own header says *"ONE CODE PATH. `--dry-run`
is a TARGET, not a different script."* It already has the concept of a target; what
it lacks is a **target table** — given an environment, how do I ship to it — rather
than a hardcoded upload. Adding that is the honest version of this change and is
what keeps the hooks, their ordering and the capability report identical between a
cloud deploy and a local one.

A consequence worth naming: `d1-migrations.ts` deliberately reads the **top-level**
block because that is what `wrangler dev` reads. Once the dev target is
`--env dev`, that reasoning inverts and it must follow the environment.

### K4 — The moving parts, and the zombies they leave (measured, 2026-09-23)

A sweep of every listener in the dev port band on the operator's machine, attributed
by each process's working directory:

| port | proc | cwd | |
|---|---|---|---|
| 8788 | workerd | `1stcontact/apps/control-app` | builder |
| 8790 | node | `1stcontact` | filing server |
| 8799 | node | `1stcontact` | access-sim |
| 8712, 8722, 8733 | node | `1stcontact` | **orphans** |
| 8711, 8719, 8723 | node | `.xgd/worktrees/…/free-REQ-254` | **orphans, worktree gone** |
| 8795 | node | `.xgd/worktrees/…/free-BUG-124` | **orphan, worktree gone** |
| 8889 | python | `/private/tmp/…/garbage-…/test_UAT_FC_REQ_706_stop_port_3` | **orphan, dir deleted** |
| 8766/67/91/93/94, 8888 | python | sibling repos | not this repo's to reap |

**Three** listeners are the dev environment. **Eight** are this repo's zombies.
Nothing has ever reclaimed them and they have plainly been accumulating for a long
time. Note also that 8711 and 8712 are occupied — exactly what `filing.ts:116`
predicted when it chose 8790 over them ("8711 and 8712 are routinely taken on a
working machine"); they are taken by this repo's own strays.

### K5 — `ps` IS BLOCKED; THE REAPER MUST BE BUILT ON `lsof`

Measured, not assumed: `ps aux` returns **zero lines** under the agent sandbox,
while `lsof -nP -iTCP -sTCP:LISTEN` works, and `lsof -a -p <pid> -d cwd -Fn` returns
a usable working directory. The table in K4 was built entirely with the latter.

A reaper written against `ps` would work for the operator and be unusable by any
agent — which is precisely the condition that produced four of the eight zombies.
The **cwd is also the right identity key**: it separates this repo's strays from
lagrange-framework's and xgd's cleanly, so the reaper is safe by construction
rather than by a hand-maintained port allowlist.

### K6 — The commands

- **`bin/dev up`** — build the snapshot, run the migrate hook against the local
  store, start builder, public-site, filing and access-sim, write a pidfile per
  service.
- **`bin/dev down`** — stop everything named in the pidfile, then *verify the ports
  are free* rather than assuming the signal landed.
- **`bin/dev reap`** — the backstop. Every listener in the band whose cwd is under
  this repo **or under an `.xgd` worktree of it**, and which is not in the current
  pidfile, is listed and killed. `--dry-run` first, per this repo's convention.

`reap` is not redundant with `down`: `down` will always be incomplete. A worktree
torn down mid-session takes its pidfile with it, so `down` can never be run there —
four of the eight zombies arrived exactly that way. That is a permanent condition
to have a backstop for, not a bug to fix.

`reap` must also **report what it could not kill**. A detached listener started from
an agent sandbox survives `kill -9` from inside it; only the operator can stop
those, and a reaper that claimed success would be lying.

### K7 — Assessment

Materially easier than §J: no provisioning, no Access application, no `ACCESS_AUD`,
no Turnstile, no DNS, no secrets, no `SESSION_COOKIE_DOMAIN` trap. The account-side
80% of the cloud version does not exist here.

The snapshot deploy is about half a day; `up`/`down`/`reap` about another half, most
of it a pidfile convention and an lsof sweep. There is no clever part. §J3's
hardcoded database name in `bin/deploy.d/migrate/10-d1-site-store` is still worth
fixing on the way past, since it becomes live the moment any second environment
exists.


---

## §L — Retirement is its own step, and what §K does to [[REQ-315]] (2026-09-23)

### L1 — The old path is deleted separately, after the new one is proved

Settled by the operator: **everything we have goes** — `pnpm dev`, `pnpm dev:control`
and `1c builder` as an operator entry point — **but the deletion is a separate step
so the replacement can be proved first.**

That is a sequencing requirement, not a preference, and it shapes the tickets. The
new environment must be able to run **beside** the old one for as long as it takes to
trust it, which means:

- the replacement must not require `.wrangler/state` to move or change shape on day
  one, because the old path reads the same store;
- the new ports must not be the old ports, so both can be up at once;
- nothing is removed from `package.json` or `dev-env.ts` in the first ticket.

Folding the deletion into the build ticket would defeat the purpose: that ticket
could not close until the old path was gone, which is exactly the pressure the
operator asked to remove.

### L2 — [[REQ-315]] anticipated this ticket, and §K resolves its open choice

REQ-315 (`bin/deploy --fonts, and a dev target the font mirror never had`, draft,
under EPIC-21) verified that `bin/deploy --env dev` fails — *"No environment found in
configuration with name 'dev'"* — and built its framing on it: **"this repo's dev
environment is not a deployment at all"**, therefore `--fonts` at the dev target is
**"a local seed, not a deploy"**. It then hedged explicitly against this section:

> If a `[env.dev]` Worker is ever wanted, it is its own ticket and this one does not
> presume it … an argument for selecting the local seed by an explicit flag rather
> than by the absence of `--env`.

That hedge was well-judged. §K is the ticket it hedged against, and its arrival makes
REQ-315 **simpler**, not harder.

**What changes for REQ-315:**

1. **The "seed, not a deploy" framing dissolves.** Under §K a local seed *is* a
   deploy, `bin/deploy --fonts --env dev` reads literally, and the help text no
   longer has to apologise for the asymmetry. The explicit-flag hedge can be dropped.
2. **§K decides REQ-315's open implementation choice, and decides it against the
   cheaper-looking option.** REQ-315 offers two buildable shapes and leaves the
   choice to the implementing session:
   - *seed miniflare's local R2* — costs ~1.35 GB of second copy and "a seeding step
     whose freshness has to be reasoned about";
   - *a loopback origin beside the builder* — "no copy and no staleness", costs a
     second process.

   §K inverts both costs. The second process stops being a cost because
   `bin/dev up/down/reap` owns processes by design. But the loopback origin reads
   `fonts/mirror/` **live out of the working tree**, which makes the fonts the one
   part of the environment that is not frozen — the exact property §K exists to
   abolish. And "freshness that has to be reasoned about" stops being a worry,
   because deploying is *when freshness is decided*.

   **Under §K, seeding the store is the consistent choice and the loopback origin
   becomes actively wrong**, despite being the more attractive of the two on
   REQ-315's own terms. This is worth recording precisely because it reverses on
   arrival of context REQ-315 could not have.
3. **Its acceptance criterion gains an implementation site.** REQ-315 asks that
   "after a mirror completes, the operator starts the builder and fonts work, having
   typed nothing extra and having chosen no environment", and is openly unsure where
   that belongs — "a final step of `1c fonts mirror`, a seed on `1c builder` startup,
   or an explicit target". Under §K the answer is not open: fonts are part of what
   `bin/deploy --env dev` puts **into** the environment, and `bin/dev up` is the
   single start command.
4. **An open question §K may close for free.** REQ-315 flags that `.wrangler/state`
   is **per app directory**, so "the local bucket" is two stores and seeding
   control-app alone leaves a locally-served published site 404ing the fonts the
   preview beside it renders. If §K points both wrangler processes at one
   `--persist-to`, that problem disappears. **Whether two `wrangler dev` processes can
   safely share one persist directory is NOT verified** and must be established
   before it is relied on.

**What does not change:** the `PlatformFontReader` interface decision, the finding
that the Worker cannot read the host disk under `nodejs_compat`, the brotli quality
cliff and mirror cost, and the production publish path.

### L3 — Sequencing

REQ-315 **must not wait** for §K. It has a live driver §K does not: the moment
`1c fonts mirror` completes, the projection fills in every environment while local
bytes exist in none, so local dev trades an honest refusal for a confident bind that
404s — REQ-312's own failure mode, in the environment the work is done in.

It should, however, be implemented **as if §K is coming**: take the store-seeding
shape, drop the explicit-flag hedge, and do not invest in help text explaining that
the dev target is not really a deploy.

REQ-315 is EPIC-21's child, not this epic's. This section records the interaction;
amending REQ-315's own body is that epic's call.


---

## §M — Version skew is a data-loss hazard for §K's single store, and `1c ps` (2026-09-24)

### M1 — `workerd` owns the store's schema, and migrates it forward silently

Measured, from an incident this morning. The builder refused to start:

```
*** Fatal uncaught kj::Exception: workerd/util/sqlite.c++:844: failed: SENTRY_DO
SQLite failed; table _cf_ALARM has 3 columns but 2 values were supplied
```

Neither remedy an operator would reach for is the right one. `_cf_ALARM` is not in
D1, so `wrangler d1 migrations apply` does nothing; a `[[migrations]]` block declares
Durable Object class renames, not workerd's internal table schemas. The cause is that
**the on-disk schema of `.wrangler/state` is owned by `workerd`, which migrates it
forward on open, silently — no log line, no version stamp.**

The skew came from two independently-floating semver ranges each dragging their own
`workerd`: `wrangler ^4.106.0` → workerd 1.20260630.1, and the separately-declared
`miniflare ^4.20260630.0` → workerd 1.20260710.1. The newer one, reached through
`tools/generate/src/fonts/seed.ts` (which imports `Miniflare` as a library to write
the R2 persist directory), ran `ALTER TABLE _cf_ALARM ADD COLUMN actor_name TEXT`
against the R2 stores at 00:18–00:20. The older one died reading them at 10:43.

Two properties make this worse than an annoyance:

- **The migration is one-way.** workerd does not remove the column it added.
- **Recovery was free only because of which table was hit.** `_cf_ALARM` held zero
  rows and was alone in an 8 KB `metadata.sqlite`, so deleting the file was a
  complete fix. The same skew landing on `_mf_objects` would have cost 6,904 objects
  and ~2 GB of blobs, with no undo.

### M2 — Which is why it is a precondition of §K, not adjacent hygiene

§K puts **three** kinds of `workerd`-bringing consumer on one store: `wrangler dev`
(workerd via wrangler's pin), the font seeder (via its own `miniflare`), and
`@cloudflare/vitest-pool-workers` in tests (via its own bundled wrangler). That is
exactly the configuration that broke this morning.

Combine it with **K2** — the operator's decision that the dev environment holds *the
only copy* of the dev data — and version skew stops being an annoyance and becomes
data loss. §K therefore owes the store a guard **on entry**: `bin/dev up` must refuse
to start when more than one `workerd` resolves in the tree, *before* anything opens
the store, rather than trusting the lockfile to stay honest.

[[REQ-316]] builds the pin and the check. §K wires it into the entry point. There is
no third ticket here: the constraint is design context for §K, and its code half is
already owned.

Also worth correcting in passing: `seed.ts`'s header asserts *"Miniflare is not a new
dependency in the tree — it is what `wrangler` already is underneath; declaring it
only makes an existing fact importable."* Declaring it separately made it a second,
independently-floating resolution — which is the defect. REQ-316 carries that
correction.

### M3 — `1c ps`, requested 2026-09-24

The ask: **list every server this project has running, with its PID and port.**

It is **§K6's reaper minus the killing** — the same survey, the same table, the same
identity rules. `reap` is `ps` plus a verb, and `down`'s requirement to *verify* the
ports are free rather than assume the signal landed is a `ps` read. So it belongs in
the supervisor ticket rather than a ticket of its own.

**It must be built on `lsof`, per K5.** `ps aux` returns zero lines under the agent
sandbox while `lsof -nP -iTCP -sTCP:LISTEN` and `lsof -a -p <pid> -d cwd -Fn` both
work. A `ps`-based implementation would serve the operator and be unusable by the
agent that produced four of the eight measured zombies.

**It must answer `reset.ts`'s objection rather than walk past it.** `reset.ts:131`
already documents a deliberate rejection of exactly this mechanism:

> A CONNECT, NOT A PID FILE OR A PROCESS SCAN. … A pid file can be stale; a process
> scan matches another checkout's server, which is a different store entirely.

That reasoning is correct for the question *reset* asks — "is something holding my
store open" — and a connect is the right test for it. `1c ps` asks a different
question — "what is running here, and what would I stop" — which a connect cannot
answer at all, because it yields no PID. The objection to a process scan is answered,
not ignored, by keying rows on **cwd**: a listener whose working directory is another
checkout is reported as that checkout's, never as this one's. The two probes coexist
and neither replaces the other. `1c ps` does not change `1c reset`'s refusal test.

**It should return a value, not print one**, following `filingStatus`
(`filing.ts:471`) and its stated reason: the old filing signal was a `console.log`
from the command that in the failing case was never run, so returning the state lets
a banner render it, a UAT assert it, and a future surface read it without three
descriptions of one fact. `1c ps`'s table is the same kind of thing — `bin/dev down`
and `reap` are its other readers.

**The port→service map cannot be the identity.** Four of the eight zombies measured
in K4 hold ports no constant names (8712, 8722, 8733, 8795). A row must stay legible
with an unrecognised port — naming the cwd and saying the service is unknown — rather
than being omitted, because an unnamed listener in this repo's tree is precisely what
the operator has never been able to see. The known band today is 8710 (repro console),
8787 (public-site), 8788 (builder), 8790 (filing), 8799 (access-sim), 24678 (Vite HMR).

**The classification is the useful column**, because it is what decides whether a row
is safe to stop: this checkout / an `.xgd` worktree of this repo / a sibling project /
undeterminable. K4's sweep found eleven of this repo's own and six belonging to
sibling projects; conflating them is how a reaper becomes dangerous.

**It must report what it could not determine.** `lsof` will not return a cwd for a
process owned by another user, and a detached listener started from an agent sandbox
survives `kill -9` from inside it. A survey that silently omits what it cannot see,
or a reaper that claims a kill it did not achieve, is worse than one that says so.


### M4 — Filed (2026-09-24)

- [[REQ-318]] **A local dev environment that is deployed to, not edited into** — the
  `bin/deploy` target table, `[env.dev]`, the snapshot from `bin/build`'s existing
  unused bundle, `d1-migrations.ts` following the environment, the §M2 workerd guard on
  entry, and §J3's hardcoded database name. Covers §K1–§K3, §K7.
- [[REQ-319]] **`bin/dev up`, `down` and `reap`, and `1c ps` to see what is running** —
  the supervisor and the reaper, with `1c ps` as the survey both read. Covers §K4–§K6
  and §M3.

**Retirement is deliberately unfiled.** §L1 makes it a sequencing requirement that the
deletion of `pnpm dev`, `pnpm dev:control` and `1c builder`-as-entry-point be a separate
step *after* the replacement is proved. Folding it into either ticket above would mean
that ticket could not close until the old path was gone — exactly the pressure the
operator asked to remove. It is filed when REQ-318 and REQ-319 are trusted, and both
tickets say so in their Boundaries.
