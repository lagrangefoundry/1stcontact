---
uid: comment-d9b9fc8d
id: COMMENT-3029
type: comment
title: Comment on epic EPIC-16
created_by: xgd
created_at: '2026-09-17T03:34:34.354350+00:00'
updated_at: '2026-09-20T23:39:28.176424+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: epic-96d8aca6
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "e1cc512e-d1e5-4d2c-b490-2e7757b65916",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="cb28a7d9-40f7-4c4f-9bd6-3d5deca0b47e-user" -->

<!-- xgd-chat role="user" ts="2026-09-17T03:34:28.479712+00:00" -->
#### You
This I think is probably getting a little too far over our skis for where we are right now, but I wanted to capture it while it was in my head because I can't see how we could manage without it in a real production environment. The idea here is that we would have a staging environment with some test sites set up with good rich test data and every deploy would go through the staging environment first and run our smoke tests and BFM tests and obviously any deployment migrations just like production. This ticket is to create that staging environment and an automated flow so that once the deployment is triggered it will go through automatically test and assuming all is good go straight to production. And then run another round of tests in production. The automation is critical here because there is literally one operator me. So everything has to run itself. I don't think I want to spend too much time on this epic right now. I think the requirements are relatively straightforward the tests are being handled by other epics so your job is really the deployment pipeline automation and the appropriate creation of test data. There are also some questions about whether we could keep such an environment from being public, and to an extent maybe whether we care? It is desirable that the automation run primarily in the cloud once it has been triggered. I don't want my laptop to be responsible for deployment

<!-- xgd-turn id="cb28a7d9-40f7-4c4f-9bd6-3d5deca0b47e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-17T03:41:09.033647+00:00" -->
#### Claude
EPIC-16 is written up. Title kept, status left at `draft`, no code touched.

**The one finding that changes the shape of the epic** — `.github/workflows/deploy.yml` is not the same deploy as `bin/deploy`. It runs `pnpm -r build` (which is `tsc --noEmit` in both apps, emitting nothing) then two bare `wrangler deploy --env production` calls. So the cloud path:

- never runs the `migrate` hook → **schema migrations are not applied**
- never runs the `secrets` hook → **no secret pushed, none capability-probed** ([[REQ-264]]'s report never happens)
- never runs `1c assets` → `dist-assets` is gitignored, so the control app's `[assets]` directory is absent on a fresh checkout
- never runs `bin/smoke`

Untouched since the scaffold commit `402ae93f1f`. The honest reading is that deploys have been coming off your laptop, which is exactly what you're asking to stop — so **fixing the workflow is child #1 and pays off with or without staging.**

What else the body settles:

- **One implementation, run twice.** `bin/deploy` already takes `--env`, already documents `--env staging`, already passes `DEPLOY_ENV` into hooks. The environment is a configuration exercise. One bug in the way: `bin/deploy.d/migrate/10-d1-site-store` hardcodes the database *name* `1stcontact` while honouring `--env`, so pointed at staging it would migrate production's D1.
- **The real constraint is migrations, not tests.** Code rolls back; D1 doesn't, and there's nobody awake to improvise. So the pipeline needs an expand/contract forward-only policy with a check, not a README paragraph. And without a promote step, the production test round is a postmortem rather than a gate — flagged as an open question since I haven't verified `wrangler versions` against the surface in use.
- **Private staging: yes, and not for embarrassment** — indexed duplicates of canary sites, weaker-by-design config facing the internet, and a real form anyone can fill in. Access on both staging hostnames with probes carrying a service token; [[BUG-59]]'s `SERVICE_TOKEN_IDENTITIES` already built the mechanism, and Access is an edge gate so the Worker path under test stays identical.
- **Test data: one site corpus, two destinations.** [[EPIC-15]] puts canaries in production deliberately; if staging fixtures are authored separately they drift and its open question 7 becomes two problems. Also: `bin/seed`'s safety guard is that `--remote` has to be typed — staging makes typing it a habit, so seeding must *refuse* the production database rather than warn.

I took [[EPIC-15]] §3 at its word and had this epic consume its probes rather than author any; that section was written addressed to this epic before it existed. The one thing I'd push back to it: staging probes need an auth seam to carry a service token, and that's cheaper to say now than after its probe interface settles.

<!-- xgd-turn id="9804a85f-55c1-46f7-8fd1-08db8b0d1fb3-user" -->

<!-- xgd-chat role="user" ts="2026-09-17T21:53:08.709802+00:00" -->
#### You
Please check for security updates in your ticket

<!-- xgd-turn id="9804a85f-55c1-46f7-8fd1-08db8b0d1fb3-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-17T21:57:05.403134+00:00" -->
#### Claude
Checked. An [[EPIC-17]] pass appended a six-clause **Security notes** section to EPIC-16 at 21:33 last night, and EPIC-17's own §5 delegation table names this epic as the owner. I verified each clause against the code and folded them into the plan — body updated, status still `draft`, no code touched.

**The clause that isn't what it looks like.** §4 (pin the `@lagrangefoundry/*` store by digest) reads as hardening. It isn't — it's a prerequisite for child 1. `bin/build`'s first stage is a preflight *because* the store is populated out of band: `@lagrangefoundry` appears zero times in `pnpm-lock.yaml` and in no `package.json`, and resolves through `require.resolve` anchored at the main checkout. So the moment the workflow starts calling `bin/build` it fails at stage 1 until the runner can get the store. "How does CI obtain it" and "pin it by digest" are one question answered once. Added as open question 10 and moved ahead of child 1 rather than after it.

**§2 already has an instance in the repo.** "A staging binding that can write production storage" is exactly `bin/deploy.d/migrate/10-d1-site-store` — it hardcodes the database name `1stcontact` while honouring `--env`, so pointed at staging it migrates production's D1. Already in the body as an audit finding; now labelled as what it is.

**One thing the appended section implies for staging but doesn't state.** `apps/public-site/wrangler.toml` sets `workers_dev = true` (EPIC-17 F8(c)), and `workers_dev` *is* inherited by a named environment — the control app's own comment says so. So `[env.staging]` that says nothing about it ships a `*.workers.dev` hostname no Access policy covers, serving the staging public site and `/api/lead` to anyone who guesses it. The Access application on the staging hostname would look correct and prove nothing. Added to §5. The production instance stays EPIC-17's item 12 and shouldn't wait on this epic.

Also: §1 settles open question 9 (no production data + wipe-and-reseed is one policy, not two); §3 and §6 became children 6 and part of child 4's artifact; §5 was already the shipped behaviour of the secret hooks — restated as a control because the secrets are about to move to GitHub, which is precisely when "just put it in `[vars]` for staging" gets tempting.

<!-- xgd-turn id="b9d586cf-f821-4d6c-899e-001e28e5ee27-user" -->

<!-- xgd-chat role="user" ts="2026-09-20T22:50:37.499294+00:00" -->
#### You
Ok I have changed the name of this epic to Deployment - that does not invalidate anything we have discussed, it just broadens the intended scope of this ticket a little.

Specifically in the short term (i.e. now :-)) I want to do two things:
(1) we seem to have a million build scripts and development servers - 1c <mumble>. I would like to catalog them all and discuss. I am particularly keen to understand asset and build - could we combine? Related I want to understand what kind of changes involve migrations? What changes require I run asset vs build vs server restart vs page reload....
(2) I want to get our current system and my sites copied to Cloud Flare and I want to put LF live and 1st Live on their domains....I would like you to help me do this and discuss the flow for future changes to the sites and/or the builder?

<!-- xgd-turn id="b9d586cf-f821-4d6c-899e-001e28e5ee27-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-20T22:59:27.479541+00:00" -->
#### Claude
Ticket updated (body appended, title and status untouched — still `draft`, no code changed).

## (1) The catalog

**Asset and build are already combined.** `bin/build` is the single path and `1c assets` is stage 2 of 4 inside it — preflight → assets → `pnpm -r build` (typecheck only, emits nothing) → per-app `wrangler deploy --dry-run --outdir dist`. There's no merge left to do in that direction.

Everything divides by *what it acts on*:

| Acts on | Commands |
|---|---|
| Code → artifacts | `bin/build`, `1c preflight`, `1c assets`, `bin/kb-release` |
| Artifacts → cloud | `bin/deploy`, `.github/workflows/deploy.yml` (bypasses it) |
| Content → store | `bin/publish`/`1c push` (draft → D1+R2), `1c publish` (mint a revision) |
| Dev servers | `1c builder` :8788, `pnpm dev:public` :8787, `pnpm dev` (both), `bin/access-sim` :8799, `1c filing`, `bin/repro-console` :8710 |
| Local store | `bin/seed`, `1c reset`, `wrangler d1 migrations apply --local` |
| Gates | `bin/smoke`, `bin/repro-rail`, `1c gate`/`l1-gate`/`values-diff`/`diff`, `bin/access-token` |

`startBuilder`/`startServe` look like servers in the tree but are test transports — a library function a test opens and closes. Not hosting.

**The real gap is the dev loop.** `1c assets` copies `apps/control-app/src/builder/**` verbatim and type-strips the framework bridges. Nothing watches those inputs. `wrangler dev` watches the Worker's module graph *and* `dist-assets`, so it reloads fine — but only after you've remembered to re-run `1c assets`. The failure mode is a stale asset, which is indistinguishable from "my edit didn't work." That's the one item in the catalog that's a defect rather than a fact; the full what-requires-what table is in the ticket (§A).

**Migrations happen for exactly one reason: a D1 schema change.** Sites, pages, palettes, assets, revisions, leads, zones, domains are all rows under a schema that already exists — authoring a site migrates nothing. And never edit an applied migration; always add a numbered file, because wrangler records what it ran and an edit reaches no database.

## (2) Going live — what I found first

I read the account directly rather than guessing, and the state is further back than the conversation has been assuming:

- **Remote D1 has `0001_baseline.sql` and nothing else**, applied 2026-09-06. The repo is at 0018. Production is **17 migrations behind** — no `site_domains`, no `zones`, no `activity_log`.
- **0 sites, 0 users, 0 revisions.** Both Workers last deployed 2026-09-06.
- Production secrets are `ANTHROPIC_API_KEY` and `RESEND_API_KEY`. **`CLOUDFLARE_DNS_TOKEN` is absent** — which is precisely what attaching a custom domain needs (`serving.ts` writes DNS records + a runtime Worker route + the row, in that order).
- `1stcontact.io` 404s because `APEX_SITE_KEY` is `""`. The apex is deployment *configuration*, not a `site_domains` mapping — deliberately, per `routes.ts`.

Three things follow. **The empty database is the cheapest moment this will ever be** — 17 migrations against zero rows carries no data risk. **Custom domains are currently impossible**, not merely unconfigured. And **deploying from CI today would be worse than from your laptop**: `dist-assets` is gitignored and the workflow never runs `1c assets`, so it would upload an *empty* assets directory over a working builder. Child 1 in this epic isn't "incomplete", it's a loaded gun.

The sequence (§C in the ticket) is nine checkable steps: `bin/build` → `bin/deploy --dry-run` → push the two missing secrets → `bin/deploy` (migrations + both Workers) → `bin/access-token` + `bin/publish --production` → mint revisions → set `APEX_SITE_KEY` and redeploy → attach any other domain via the builder → `bin/smoke`.

Steady state afterwards is two lanes that must not blur: **content** (edit in the deployed builder, publish a revision, live — no deploy, no CI) and **code** (`bin/build` + `bin/deploy` today, this epic's pipeline eventually).

## Two things before I touch anything

**Which domain is "LF", and does the site exist?** There's no `lagrangefoundry` site in `storage/sites/` — only `1stcontact`, `gigabytealchemy`, `xgd` — and neither `lagrangefoundry.com` nor `.io` resolves. The apex path and the customer-domain path are different mechanisms, so the answer changes the work.

**Say go before I deploy.** Steps 3–4 push secrets and run 17 migrations against production. I'd rather hear it from you than infer it from "help me do this."

<!-- xgd-turn id="cba17276-26e4-44c8-971e-a487a376183f-user" -->

<!-- xgd-chat role="user" ts="2026-09-20T23:39:27.308221+00:00" -->
#### You
we own lagrangefoundry.ai

So this version of going live will be its own undertaking, no doubt. But I also want to understand:

(1) what is the path to launch new code (a) to dev and (b) to prod
(2) what is the path to copy content (sites, contact data etc) from dev to prod or prod to dev

I think we started a doc ticket but I have lost track

<!-- xgd-chat-end -->