---
uid: epic-96d8aca6
id: EPIC-16
type: epic
title: Deployment
created_by: martin-github@westhead.me
created_at: '2026-09-17T03:29:16.017843+00:00'
updated_at: '2026-09-20T22:45:29.652968+00:00'
completed_at: null
last_field_updated: title
status: draft
fields:
  priority: medium
  chat_comment: comment-d9b9fc8d
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

None yet. Suggested order, and the first is not about staging at all:

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