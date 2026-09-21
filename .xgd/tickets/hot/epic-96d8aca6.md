---
uid: epic-96d8aca6
id: EPIC-16
type: epic
title: Deployment
created_by: martin-github@westhead.me
created_at: '2026-09-17T03:29:16.017843+00:00'
updated_at: '2026-09-21T00:23:14.370067+00:00'
completed_at: null
last_field_updated: status
status: underway
fields:
  priority: medium
  chat_comment: comment-d9b9fc8d
  epic_children:
  - request-625707ca
  - request-aab6c72e
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

- [[REQ-289]] **Content copy between stores** — `GET /api/export`, `bin/copy-to-cloud`,
  `bin/copy-from-cloud`. Covers §G6 steps 1–3. Ahead of everything below because the Lagrange
  Foundry draft currently has no backup (§F5).
- [[REQ-290]] **Retire the file-backed authoring tier** — `storage/sites/`, `bin/publish`,
  `1c push`. Covers §G6 steps 4–5. Depends on [[REQ-289]].

Step 6 — the [[DOC-41]] rewrite — is folded into both as an acceptance item rather than filed
separately: the document is derived from the scripts, so it changes when they do.

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

The epic was renamed from the staging-pipeline framing to **Deployment**. Nothing above is
invalidated — staging, the gate, the seed and the security notes all still stand. What is added
is the two things that come *before* a pipeline can be worth having:

- **the local build and dev loop**, because the pipeline's job is to run the same steps the
  operator runs, and "the same steps" has to be a list somebody can read; and
- **the first production go-live**, because there is nothing for a pipeline to protect until
  something is actually serving.

### A. The build and dev loop — the catalog

There is no "million scripts" problem in the *build* direction: `bin/build` is already the single
path and `1c assets` is already a stage inside it (stage 2 of 4 — preflight, assets, `pnpm -r build`
typecheck, per-app wrangler bundle). Asset and build are combined and have been since [[REQ-144]].

The scripts divide cleanly by what they act on:

| Acts on | Commands |
|---|---|
| **Code → artifacts** | `bin/build` (preflight → `1c assets` → `pnpm -r build` → bundle), `1c preflight`, `1c assets`, `bin/kb-release` (kb build, *then* assets — [[BUG-48]]'s ordering) |
| **Artifacts → cloud** | `bin/deploy` (migrate hook → secrets hooks → `wrangler deploy` → capability report), `.github/workflows/deploy.yml` (bypasses all of it — child 1) |
| **Content → store** | `bin/publish` / `1c push` (local draft → D1+R2), `1c publish` (mint a revision) — two different operations with confusingly similar names |
| **Dev servers** | `1c builder` (`wrangler dev`, control app, :8788), `pnpm dev:public` (`wrangler dev`, public site, :8787), `pnpm dev` (both), `bin/access-sim` (:8799, local Access IdP), `1c filing` (loopback defect filing), `bin/repro-console` (:8710) |
| **Local store** | `bin/seed`, `1c reset`, `wrangler d1 migrations apply … --local` |
| **Gates / evidence** | `bin/smoke`, `bin/repro-rail`, `1c gate` / `l1-gate` / `values-diff` / `diff`, `bin/access-token` |

`startBuilder` and `startServe` are **test transports, not hosting** — they are library functions a
test opens and closes. The only supported way to serve a site is a Worker ([[REQ-177]]).

**The real gap is the dev loop, not the build.** `1c assets` copies
`apps/control-app/src/builder/**` verbatim, type-strips the framework bridges, and writes
`src/generated/importmap.json`. None of that is watched. So every edit to builder browser source or
to a framework bridge needs a manual `1c assets` before a reload shows it, and *nothing says so* —
the failure is a stale asset, which looks like the edit not working. `wrangler dev` watches the
Worker's own module graph and the `dist-assets` directory and reloads on both; the missing half is
a watcher on the *inputs* to `1c assets`.

**What requires what** — the table this epic should own, and the pipeline should mirror:

| Changed | Run | Server | Browser |
|---|---|---|---|
| Worker source, or a `packages/*` module the Worker imports | — | auto-reload | reload |
| `apps/control-app/src/builder/**` (browser source) | `1c assets` | auto (asset watcher) | reload |
| `packages/framework/src/l1/*` bridges (`/framework/*.js`) | `1c assets` | auto | hard reload |
| a webui component in the shared store | reinstall store, `1c preflight`, `1c assets` | restart | reload |
| KB docs / opted-in doc tickets | `bin/kb-release` | restart | reload |
| site content under `storage/sites/**` | `bin/publish [slug]` | — | reload |
| want a frozen revision of a site | `1c publish <slug>` | — | — |
| **D1 schema** | new `db/migrations/NNNN_*.sql`, then `(cd apps/control-app && npx wrangler d1 migrations apply 1stcontact --local)` | restart (`1c builder` **refuses** while behind — [[REQ-253]]) | reload |
| `wrangler.toml` — bindings, vars, routes, crons | — | restart | reload |
| `.dev.vars` / `.dev.vars.local` | — | restart | — |
| dependencies (`package.json`, lockfile) | `pnpm install` | restart | — |

**Only D1 schema changes involve a migration.** Sites, pages, palettes, assets, revisions, leads,
zones and domains are all *rows and objects* under a schema that already exists — authoring a site
never migrates anything. A migration is needed exactly when a feature needs a new table or column,
and the rule every file in `db/migrations/` states is: **never edit an applied migration**, always
add a numbered file, because `wrangler d1 migrations apply` records what it has run and an edit
reaches no database.

### B. Production state, audited 2026-09-20

Read directly off the account, not inferred:

| Fact | Value |
|---|---|
| Remote D1 `d1_migrations` | **`0001_baseline.sql` only**, applied 2026-09-06 |
| Migrations in `db/migrations/` | 0001 … 0018 — so production is **17 behind** |
| Remote D1 contents | 0 sites, 0 users, 0 revisions, 0 pages, 1 tenant |
| Workers last deployed | both 2026-09-06 (repo is at 0.2.297 with a fortnight of changes since) |
| Production secrets (control-app) | `ANTHROPIC_API_KEY`, `RESEND_API_KEY` — **`OPENAI_API_KEY` and `CLOUDFLARE_DNS_TOKEN` absent** |
| `app.1stcontact.io` | live, behind Access (302 to the team login) |
| `1stcontact.io` | Worker answers, **404** — `APEX_SITE_KEY` is `""` in `[env.production.vars]` |
| R2 | `1stcontact-sites`, `1stcontact-material` both present |

Three consequences worth stating plainly:

1. **The empty database is the cheapest moment this will ever be.** Seventeen migrations against a
   database with no rows carries no data risk. Every day production holds real customers, the
   expand/contract policy in §6 above stops being a policy and starts being a constraint.
2. **`CLOUDFLARE_DNS_TOKEN` absent means custom domains cannot be attached at all.**
   `serving.ts` composes DNS records + a runtime Worker route + the `site_domains` row; the first
   two need that token (`Zone:DNS:Edit`, `Workers Routes:Edit`). And `site_domains` does not exist
   in the remote schema yet — it arrives with migration 0008.
3. **Deploying from CI today would be actively worse than from the laptop.** `dist-assets` is
   gitignored and the workflow never runs `1c assets`, so a CI deploy of `control-app` uploads an
   *empty* assets directory over a working one. This is child 1 restated with a sharper edge: the
   workflow is not merely incomplete, it is a loaded gun.

### C. First go-live — the sequence

Laptop-driven, once, because the cloud path cannot do it yet (child 1 is what makes the second
time different). Each step is checkable before the next:

1. `bin/build` — catches preflight, assets, typecheck and both bundles locally.
2. `bin/deploy --dry-run` — lists the pending migrations and runs every capability probe as a read.
3. Push the two missing secrets (`OPENAI_API_KEY`; `CLOUDFLARE_DNS_TOKEN` scoped
   `Zone:DNS:Edit` + `Workers Routes:Edit`) — the hooks do this and probe what the key can do.
4. `bin/deploy` — migrations 0002…0018 land, both Workers upload, capability report prints.
5. `bin/access-token`, then `bin/publish --production <slug>` — the local drafts become cloud sites.
6. Mint a revision for each site, so `public-site` has something live to serve.
7. **The apex** is deployment configuration, not a mapping: set `APEX_SITE_KEY` in
   `[env.production.vars]` of `apps/public-site/wrangler.toml` to the published site's key and
   redeploy. (`TURNSTILE_SITEKEY` is `""` too — forms on the apex render no widget until it is set.)
8. **Any other domain** goes the customer path: the zone in the account and recorded in `zones`
   with its `origin` ([[REQ-257]]), then attach from the builder, which writes records, route and
   row in that order ([[REQ-258]]).
9. `bin/smoke --site-key <key>` — prove it serves.

### D. Steady state — two lanes, and they must not be confused

- **Content lane.** Edit in the deployed builder → publish a revision → live. No deploy, no
  migration, no CI. `bin/publish --production` is the *import* path for a locally-authored site and
  is 409-guarded against overwriting builder edits ([[BUG-51]]) — it is not the everyday path.
- **Code lane.** Today: `bin/build` + `bin/deploy` from the laptop. Target: this epic's pipeline.
  The first step is child 1, and its value does not depend on staging existing.

### E. Open questions added by the broadened scope

11. **Is `1c assets --watch` (or a watching `1c builder`) in scope here, or its own ticket?** It is
    a dev-loop change, not a deployment one — but it is the same "one list of steps" property the
    pipeline needs, and it is the only thing in section A that is a defect rather than a catalog.
12. **Which domain is the Lagrange Foundry site, and does the site exist?** There is no
    `lagrangefoundry` site under `storage/sites/` (only `1stcontact`, `gigabytealchemy`, `xgd`), and
    neither `lagrangefoundry.com` nor `lagrangefoundry.io` resolves. The apex path (step 7) and the
    customer-domain path (step 8) are different mechanisms; which one applies depends on the answer.
13. **Does the platform's own marketing site go on the apex via `APEX_SITE_KEY`, or through
    `site_domains` like a customer's?** The code supports the former for platform hosts and the
    comment in `routes.ts` is explicit that this is deliberate. Worth confirming it is still the
    intent before the first deploy pins it.

### F. The doc ticket, and the two paths (2026-09-20)

**The doc ticket is [[DOC-41]] "Build and Deployment".** It already answers question (1) in
detail — one-time setup, the local simulation, the Cloudflare path, the credential table per
environment, and the order of operations. It is the right home for this material and should stay
so. Three things it does **not** say, which this epic owes it:

- it does not mention `.github/workflows/deploy.yml` at all, so nothing in the repo warns that a
  second, divergent deploy path exists (§B.3);
- it documents no **staging** environment, because there isn't one;
- it documents **no content-copy path in the prod → dev direction**, because there isn't one
  (see below). DOC-41 §3 documents `bin/publish --production` and stops there.

Updating DOC-41 is a deliverable of child 1 and of the staging children — the doc is derived from
the scripts, so it changes when they do.

#### F1. Code → dev

**There is no deployed dev environment.** "Dev" is the *local Cloudflare simulation*: workerd via
`wrangler dev`, with D1 and R2 on disk under `apps/*/.wrangler/state/`. Neither `wrangler.toml`
declares any environment but `[env.production]`. So:

```
bin/build        # preflight → 1c assets → pnpm -r build (typecheck) → per-app bundle
pnpm dev         # public :8787, control :8788
bin/publish      # seed the local store from storage/sites/
```

After that, §A's table governs what each kind of edit needs. The only genuinely missing piece is a
watcher on `1c assets`' inputs (open question 11).

#### F2. Code → prod

```
bin/build
bin/deploy --dry-run    # same code path, hooks run and change nothing, capability probes read
bin/deploy              # migrate hook → secrets hooks → wrangler deploy --env production, per app
bin/smoke               # prove the origin serves
```

From the laptop, today. `.github/workflows/deploy.yml` is a **second and divergent path**: it runs
`pnpm -r build` (typecheck only, emits nothing) then two bare `wrangler deploy --env production`
calls. It never runs `bin/deploy`, so no migration is applied, no secret is pushed or probed, and
`1c assets` never runs — and because `dist-assets` is gitignored, a CI deploy of `control-app`
would upload an **empty** assets directory over a working one. Child 1 replaces its body with
`bin/build && bin/deploy`; until then the workflow should be treated as disabled.

#### F3. Content → prod (exists, one direction, sites only)

```
bin/access-token                        # provision the Access service-token PAIR, once
bin/publish --production <slug>         # 1c push → POST /api/import → Worker writes D1 + R2
# then mint a revision (builder UI, or POST /api/publish) so public-site has something live
```

Properties worth stating because they are the ones that bite:

- **`--production` has to be typed.** There is no push-everywhere and no default that reaches the
  cloud.
- **It copies a DRAFT, not a revision.** `bin/publish` moves *where the bytes live*; `1c publish`
  / `/api/publish` decides *which version is live*. The names are uncomfortably close and this is
  the single most likely confusion in the whole flow.
- **It is 409-guarded** ([[BUG-51]]): a target with changes made in the builder is refused, and
  `--force` is how you say you meant it. The guard counts *authored* changes (`counter`, moved only
  by `appendChange`), not `version`, so re-running after a purely local edit still works.
- **It is the import path, not the everyday path.** Steady state is §D's content lane: edit in the
  deployed builder, publish a revision, live.

#### F4. Content → dev (does not exist)

There is no export route and no `1c pull`. `/api/import` has no mirror; `tools/generate/src/cli/`
has `push.ts` and nothing opposite it. The three things that look like an answer and are not:

| Looks like | What it actually is |
|---|---|
| `1c builder --remote` | points the local dev server's D1/R2 bindings at the **deployed** store. Not a copy — it is editing production from a laptop, and is off by default for that reason ([[DOC-41]] §2). |
| `bin/seed` | writes `db/dev-seed.sql`, an **invented** fixture (`alice@plumbing.example`). It is the opposite of a copy: it exists so a fresh clone has people without anyone's real people. |
| `wrangler d1 export --remote` + `wrangler r2 object get` | the raw primitives a real puller would be built on. Nobody has wired them up, and a site's bytes span D1 plus two R2 buckets (`1stcontact-sites`, `1stcontact-material`), so a hand-rolled version gets it half right. |

**Contact data specifically: no path in either direction, and that is the correct default.**
Contacts, leads, sessions, grants, messages and the activity log are D1 rows created in the cloud.
Copying them down would put real people's data on a laptop and into a dev store with
`ACCESS_DEV_OPEN=1` — which is security note 1 above ("staging holds no production data") applied
to the dev machine, where it matters more, not less.

**The recommendation this epic should carry.** Split the direction in two:

1. **Structure down, data never.** The supported prod → dev refresh is: apply the same migrations
   locally, then `bin/seed`. That is already true today and should be *stated* in DOC-41 as the
   answer, so the absence reads as a decision rather than a gap.
2. **One site's content down, on request.** The genuinely missing piece is an `/api/export` mirror
   of `/api/import` plus a `1c pull <slug>` — draft definition, pages and assets, into
   `storage/sites/<slug>/`, symmetric with push and behind the same Access token. Small, well
   shaped, and it is what makes "reproduce the customer's bug locally" possible. It also makes the
   staging seed (§4 above) a *copy of canary sites* rather than a second corpus authored by hand,
   which is what open question 7 is really about.

   A second, larger version — pull a whole environment including contacts — should be refused by
   construction, not merely not built: the puller should take a site slug, never a tenant.

#### F5. Lagrange Foundry — open question 12, answered, and §C step 5 invalidated

**Correction to the audit above.** Open question 12 said "there is no `lagrangefoundry` site under
`storage/sites/`". That is true and it is the wrong place to have looked. `storage/sites/` is the
**git-tracked authoring tier**; the LF site was built **in the builder**, so it lives in the local
D1/R2 under `apps/control-app/.wrangler/state/`. Read off that store, 2026-09-20:

| Fact | Value |
|---|---|
| Business | `biz_5b101742d436573a04a2512fb7ecdbb5` "Lagrange Foundry", created 2026-09-09 |
| Site | `site_936dd7c92e5e14df694dd9a80433aa4f`, `kind=site` |
| Draft | `version` 192, **`counter` 190** — 190 changes authored in the builder |
| Pages | one, `home.json`, 23.7 KB of L1 |
| Assets | 17 (≈50 MB), plus 220 material attachments and 31 material items |
| Revisions | **0 — and zero for every site in the store.** `base_revision` is empty |
| Addresses | `site_domains`: `lagrangefoundry.ai` (custom, active, **canonical**) and `www.lagrangefoundry.ai` (custom, active, non-canonical), both 2026-09-16 |
| Zone | `zones` holds `lagrangefoundry.ai`, `cf_zone_id=36c6818172e7b61082bedd6416cb6dc2`, status active, origin `operator` |
| Last touched | 2026-09-20T23:41Z |

Open question 12 is therefore **answered**: the domain is `lagrangefoundry.ai`, the zone *is* in
the account, and the site exists. Open question 13 is answered too — LF goes the **customer path**
(`site_domains`), not the apex, and the rows to prove it are already written locally.

**But §C step 5 does not work for this site, and that is the finding.** Step 5 says
`bin/publish --production <slug>` turns the local drafts into cloud sites. `bin/publish` reads
`storage/sites/<slug>/`. **The LF site is not there and never was.** So there is, today, **no
command that moves this site to production** — the one content path that exists points the wrong
way for the only site that needs to travel.

**And the same gap is a data-loss exposure right now.** The LF draft — a day's work, 190 authored
changes, 23.7 KB of tuned L1, 50 MB of assets — exists in exactly one place: a **gitignored**
miniflare directory, with **no published revision** to fall back to and **no export path**.
`1c reset` is documented as removing precisely that directory. There is no backup and nothing in
the system would notice.

This is §F4 restated with the abstraction removed. The missing `/api/export` + `1c pull <slug>`
pair is not staging-seed tooling; it is the only thing standing between a day of work and a single
command, and it is simultaneously the only non-manual route to go-live for the LF site. **It should
be the next child of this epic, ahead of the pipeline work**, and its acceptance should be:
`1c pull` the LF site into `storage/sites/lagrangefoundry/`, commit it, and have
`bin/publish --production` accept it unchanged.

The three alternatives, for the record, and why they lose:

| Option | Why not |
|---|---|
| Rebuild it in the deployed builder | A day's work again, and it discards 190 changes of journal and the chat transcript that produced them. |
| Raw `wrangler d1 export --local` → transform → `d1 execute --remote`, plus 17 `r2 object put` | Hand-mapping site/tenant IDs and asset R2 keys across two stores. Gets the asset keys wrong quietly, which looks like a working site with broken images. |
| `1c builder --remote` and build it against production | Editing production from a laptop, and it still leaves the local 190-change draft as the only copy of the history. |

**Two things still block go-live even once the site can travel:**

1. **`CLOUDFLARE_DNS_TOKEN` is absent from production** (§B). Attaching `lagrangefoundry.ai` writes
   DNS records + a Worker route + the `site_domains` row, and the first two need that token. The
   local `site_domains` rows describe the **local** store; production has none.
2. **Nothing has ever been published — anywhere.** `site_revisions` is empty for every site in the
   local store, so `/api/publish` has never minted a revision in this database. `public-site` serves
   *revisions*, not drafts, so the first publish is also the first exercise of that path. Worth
   doing locally first, where LF already has the addresses `/api/publish` requires.

## G. The content commands, renamed and re-sourced (2026-09-20)

### G0. `1c pull` does not exist — a correction

§F4 and §F5 above recommend "`/api/export` + `1c pull <slug>`" as though `1c pull` were a thing
being extended. **It is not a command. It was a proposed name**, invented while drafting §F4 and
then reused as if it existed. `tools/generate/src/cli/` holds `push.ts` and no counterpart; the
router has `/api/import` and no `/api/export`. Nothing reads content out of a store, anywhere.
Wherever §F names `1c pull`, read it as "the unbuilt export direction".

### G1. `publish` is overloaded, and `bin/publish` loses the name

**The operator's ruling, and it is right.** *Publish* means one thing: take a draft, freeze it as a
version, make that version live. `bin/publish` uses the same word for *copy bytes from this laptop
to Cloudflare*, which is a different operation on a different axis. [[DOC-41]] §3 and the header of
`bin/publish` both already carry a paragraph apologising for the collision — a comment explaining
why two things share a name is the defect, not the mitigation.

`bin/publish` is **deleted**. The replacement is `bin/copy-to-cloud <business>`, and the verb is
now unambiguous in both directions: *copy* moves bytes between stores, *publish* mints a version.

### G2. It is a rewrite, not a rename — the source tier changes

The crucial point, and the reason this cannot be a `git mv`:

- `bin/publish` / `1c push` read **`storage/sites/<slug>/`** — the git-tracked file-backed tier.
- The sites that exist read **the local D1/R2** under `apps/control-app/.wrangler/state/` — because
  they were built in the builder. The Lagrange Foundry site (§F5) is there and has never been in
  `storage/sites/`.

So the old command's source is the tier being retired, and the new command's source is a store Node
cannot open: miniflare's D1 is a SQLite file whose layout is an implementation detail, and R2 is a
second SQLite plus a blob directory beside it. Reading those directly is a third store adapter with
no contract behind it.

**The design: `GET /api/export`, symmetric with `/api/import`.** The Worker already writes through
the store it serves from, for exactly the reason `import-site.ts` documents — one writer, no second
adapter that could disagree about what a site is made of. Export is that argument in reverse, and it
makes the command trivially symmetric:

```
bin/copy-to-cloud <business>      # GET localhost:8788/api/export → POST app.1stcontact.io/api/import
bin/copy-from-cloud <business>    # the same two calls with the origins swapped
```

One route to build; three problems solved — go-live for a builder-authored site, a **backup** for a
draft that currently exists in one gitignored directory, and the staging seed §4 above wants.

### G3. Addressing by business name

`/api/import` resolves its target from the **authenticated scope**, not from the payload — the
`slug` field names the source and addresses nothing ([[REQ-236]]). So `<business>` is resolved on
each side independently: locally `tenants.name` → `biz_…`, in the cloud the same lookup under the
session the Access token carries.

Two consequences to design for rather than discover:

1. **The cloud business must exist first.** Production holds 1 tenant and 0 sites (§B). Copying to a
   business that is not there has to fail with "create it in the builder first", not invent one —
   minting tenants from a laptop script is how a deployment gets a business nobody signed up for.
2. **The >1-site refusal still applies.** `/api/import` refuses a business holding more than one
   site as unresolvable ambiguity. Every business in the local store holds exactly one, so this is
   latent today and should stay an explicit refusal rather than a first-match guess.

### G4. Flags, and the one asymmetry that matters

`--site` is the default and the only one built now. The shape is extensible — `--contacts`, and
whatever follows — but the two directions are **not** mirror images and the command must not pretend
they are:

| | to cloud | from cloud |
|---|---|---|
| `--site` | the go-live path | the backup path |
| `--contacts` | plausible — laptop fixtures going up | **refused by construction** |

Pulling contacts down puts real people's data on a laptop and into a dev store running
`ACCESS_DEV_OPEN=1`. That is security note 1 above applied where it matters more, not less. The
refusal belongs in the code, not in a warning in the help text.

### G5. What "the old dev path is dead" does and does not cover

`storage/sites/` has **three** uses and only the first is dead. Deleting the tree without separating
them breaks the build:

| Use | Status | What it needs |
|---|---|---|
| **Authoring a real site on disk** — `1c new/publish/checkout` against `--root sites`, then `bin/publish` up. The three sites in the tree (`1stcontact`, `gigabytealchemy`, `xgd`) | **Dead.** Superseded by the builder. | Delete the content; retire `bin/publish`. |
| **The reproduction substrate** — `1c repro --ref <bundle>` imports a capture as a site, then `render`/`shot`/`diff`/`values-diff`/`gate` run the fidelity loop on it. `storage/sandbox/` holds 7 such trees today | **Load-bearing** — it is the framework-growth loop, and [[DOC-41]] §1 already calls it out as the thing that resembles a raw server and is not. | Keep the fs-store code. Pin the repro loop to `storage/sandbox/` so it never writes to `sites`. |
| **A corpus of hand-authored L1 for conformance tests** — `req107` AC-4 globs `storage/sites/**`, `req105` globs `storage/sites/*/draft/pages/*.json`, `BUG-101` reads `gigabytealchemy/draft/pages/home.json` | **Load-bearing, narrowly.** Three tests read the *repo's* tree; every other test builds its own under a temp `cwd`. | Move the corpus to a fixtures directory and repoint those three globs. |

So the delete is: the three site trees, `bin/publish`, and `1c push` — **not** the fs-store module,
which stays as the reproduction tier's storage and as the test transport dozens of suites open.

### G6. Order

Filed as [[REQ-289]] (1–3) and [[REQ-290]] (4–5); 6 is an acceptance item in each.

1. `GET /api/export` on the Worker, symmetric with `/api/import`.
2. `bin/copy-to-cloud` / `bin/copy-from-cloud` over it, `--site` only.
3. **Back up the LF draft** — the first real use, and the reason this is ahead of the pipeline work.
4. Repoint the three test globs; move the L1 corpus to fixtures.
5. Delete `storage/sites/`'s three trees, `bin/publish`, `1c push`.
6. Rewrite [[DOC-41]] §2 and §3 around the new verbs, and record that `storage/sites/` is no longer
   an authoring tier.

Steps 1–3 stand alone and are worth doing before 4–6 is scheduled: the backup is the urgent half,
the tidy-up is not.