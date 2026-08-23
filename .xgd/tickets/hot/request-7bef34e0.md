---
uid: request-7bef34e0
id: REQ-144
type: request
title: Build, deploy and smoke-test scripts, and the [vars] inheritance bug behind
  the production 503
created_by: xgd
created_at: '2026-08-15T20:32:18.642216+00:00'
updated_at: '2026-08-20T12:49:55.550441+00:00'
completed_at: '2026-08-20T12:49:55.550441+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  priority: high
  story_points: 5
  auto_merge_back: true
  needs_review: false
  ready_since: '2026-08-15T20:34:18.239366+00:00'
  depends_on: []
  commits:
  - working_sha: 4fb1e2a5ff34c77dbfcf28fe137d2d7f8930ce80
    reconcile_sha: null
    main_sha: null
    working_sha_history:
    - cd6f00c6e0802569098bbfccc0befd33bc9d78b4
  version: 0.1.50
  bundled_in: bundle-77b28def
  chat_comment: comment-5dcdad31
---

# Build, deploy and smoke-test scripts — and the `[vars]` bug that makes production 503

One command to build, one to deploy, one to prove the deploy worked. Plus the configuration bug
that means `app.1stcontact.io` cannot currently work at all.

## 1. The bug

`apps/control-app/wrangler.toml` declares `BUILDER_ORIGIN` under a **top-level `[vars]`** and
does not repeat it under `[env.production]`. Wrangler does **not** inherit `vars` into named
environments, so the deployed Worker sees no `BUILDER_ORIGIN` and returns its own 503:

> `BUILDER_ORIGIN is not configured. Start the builder origin with '1c builder' ...`

The repository already knows this rule and states it — `apps/public-site/wrangler.toml` repeats
its R2 binding under `[env.production]` with the comment *"a named environment does not inherit
bindings"*. control-app simply did not follow it.

Note the 503 is **not** the whole problem: `BUILDER_ORIGIN` points at `http://localhost:8790`,
and a deployed Worker cannot reach localhost by any value of that variable. So this ticket makes
the failure *honest and diagnosable*; the origin only stops being a laptop when [[REQ-145]] and
[[REQ-146]] land.

## 2. Why scripts, and what they must not be

`package.json` has `deploy:public` / `deploy:control` / `dryrun:*`. What is missing is
everything around them: nothing builds the builder client, applies D1 migrations, pushes
secrets, or checks afterwards that the thing that deployed actually serves.

The scripts are **one path**, used by the operator and by any future automation alike. A deploy
that is done differently by hand than by script is a deploy whose failures nobody can reproduce.

## 3. Deliverables

- `bin/build` — builds every deployable artifact; fails loudly on a missing shared-store
  component rather than emitting a broken import map.
- `bin/deploy` — deploys the Workers and reports what moved. Takes a target so `--dry-run` and a
  real deploy are the same code path. It provides the **hooks** for migrations and secrets;
  it does not itself know about D1 or any particular key. [[REQ-143]] wires its migrations into
  that hook, [[REQ-146]] wires `ANTHROPIC_API_KEY` into it. **This is deliberate** — it is what
  keeps this ticket free of a dependency on the store chain, so the scripts and [[REQ-147]] are
  not serialised behind it.
- `bin/smoke` — post-deploy assertions against the **live** origin, exiting non-zero on failure.
  Must cover what [[CHAT-11]] verified by hand for `public-site`: apex resolves, the
  trailing-slash 301 holds, a rendered snapshot's referenced assets all return 200 with correct
  content types, `cache-control` and `x-robots-tag` are right on the draft channel, and an
  unknown slug 404s without leaking a distinction.
- A documented mechanism for pushing secrets via `wrangler secret`, never committed. No secret is
  named or required by this ticket; the mechanism is proved with a throwaway value.

## 4. Acceptance criteria

1. `[env.production]` carries every var and binding control-app needs; a dry-run deploy shows
   them resolved rather than absent.
2. A UAT asserts that for each Worker, every top-level `vars`/binding key is also present under
   `[env.production]`. This class of bug does not recur silently — it is the second time
   inheritance has bitten this repo.
3. `bin/build` from a clean checkout produces every artifact the deploy needs.
4. `bin/smoke` passes against the current live `public-site` **before** anything else changes,
   proving the script tests reality rather than encoding hopes.
5. `bin/smoke` fails non-zero, with a message naming the failed assertion, against a
   deliberately broken deploy.
6. No secret value appears in the repository, in `wrangler.toml`, or in script output.

## Origin

[[CHAT-25]] — operator asked explicitly for build/deploy scripts. The `[vars]` bug was found
while reading control-app's config during that conversation; production has been returning 503
since it was deployed.

---

# Implementation (free-coded, commit `cd6f00c6e`)

## What changed

**The `[vars]` fix.** `apps/control-app/wrangler.toml` gained an `[env.production.vars]` block
repeating `BUILDER_ORIGIN`. Before: `wrangler deploy --env production --dry-run` printed the
inheritance warning and `No bindings found.` After: it prints
`env.BUILDER_ORIGIN ("http://localhost:8790")` — AC1, observed rather than asserted.

**The recurrence guard (AC2).** `tests/support/wrangler-toml.ts` reads enough TOML to answer one
question — is everything at the top level repeated under each named environment? — and
`test_UAT_FC_REQ-144_named_environments_repeat_every_top_level_var_and_binding` asks it of every
`apps/*/wrangler.toml`. Two decisions worth keeping:

- **Bindings are identified structurally**: any table declaring `binding = "…"`, keyed
  `<table>:<name>`. A hardcoded list of table names would silently stop covering the first
  binding kind nobody remembered to add to it.
- **The guard is pointed at the config that actually shipped.** A second UAT feeds it
  control-app's pre-fix TOML and asserts it reports `BUILDER_ORIGIN` missing. A guard that has
  never been shown catching its bug is a guard nobody should trust.

**`bin/build`** — `1c preflight`, then `pnpm -r build`, then a per-app
`wrangler deploy --env production --dry-run --outdir dist`. Three notes:

- `--env production` deliberately: a config error that only exists under `[env.production]` is
  the entire subject of this ticket, and building the default environment would miss every one.
- **`1c preflight` is new** (`tools/generate/src/cli/shared-store.ts` + a CLI verb). It reports
  every shared-store component and every declared package, then exits 6 naming what is absent.
  It exists because the shared components are installed out of band: `pnpm install` cannot
  supply them and the lockfile cannot notice them missing — and a missing **browser** component
  yields an import map that loads, renders chrome, and dies at the first `import`, in the
  operator's browser. Resolution goes through `webuiPackageDir`, the single resolution point;
  the scope literal is not restated.
- The bundle in `dist/` is **evidence, not input**: `wrangler deploy` rebuilds from source and
  does not consume it. It becomes a genuinely needed artifact when [[REQ-145]] makes the builder
  client a build output.

**`bin/deploy`** — `--dry-run` is a *target*: the same hooks run and the same command line is
composed, with one flag appended. Hooks are any **executable** file in `bin/deploy.d/migrate/`
or `bin/deploy.d/secrets/`, run in sorted order before the upload, receiving `DEPLOY_APP`,
`DEPLOY_APP_DIR`, `DEPLOY_ENV`, `DEPLOY_WORKER_NAME`, `DEPLOY_DRY_RUN`, `DEPLOY_REPO_ROOT`. A
hook exiting non-zero aborts that app before anything uploads — a migration that fails must stop
the code that assumes it ran, and a UAT asserts exactly that ordering. Non-executable files are
ignored, so each directory's `README.md` lives beside its hooks.

**`bin/smoke`** — a launcher over `tools/generate/bin/smoke.mjs`. Nine checks:
`apex_resolves`, `unknown_slug_not_found`, `unpublished_slug_indistinguishable`,
`published_root_redirects`, `draft_root_redirects`, `draft_index_serves_html`,
`draft_cache_and_robots_policy`, `draft_miss_is_noindex_404`, `draft_assets_resolve`.

- Asset discovery follows attribute references **and one level into CSS**, which is where
  `@font-face` lives; a missing font is invisible in a screenshot and obvious to a reader.
- The 404-leak check compares an unknown slug against a known-but-unpublished one and requires
  identical status *and body*. A 404 that says which would answer questions about sites the
  asker has no business knowing exist.
- Checks with nothing to test against report **skip**, never quiet success.
- Plain JavaScript, no transform, no dependency: it runs straight after a deploy on whatever
  Node is there. Exported, so the UATs drive its failure path against a fake origin rather than
  by breaking a real deploy.

**Secrets (AC6).** `bin/deploy.d/secrets/README.md` documents the mechanism: value piped via
`printf '%s' | wrangler secret put NAME --env production` — piped rather than passed as an
argument, which is visible in `ps` and in shell history; `printf` rather than `echo`, whose
newline would become part of the secret. `wrangler secret list` shows the names, the only half
safe to look at. A UAT scans the scripts, the hook docs and every `wrangler.toml` for credential
shapes and asserts the documented mechanism never echoes a value.

## Design decisions

- **`--dry-run` as a target, not a mode.** A rehearsal that took a different route would prove
  nothing about the real thing, so the flag is appended to a command line composed once.
- **`bin/deploy` knows nothing about D1 or any key.** That is what keeps this ticket shippable
  ahead of the store chain rather than serialised behind it. [[REQ-143]] and [[REQ-146]] each
  add a file to a hook directory and change nothing here.
- **The smoke content-type table is a second statement of the Worker's**, because it runs
  outside the bundle and cannot import it. A UAT pins the pair to `contentTypeFor` — the same
  arrangement `apps/public-site/src/content-type.ts` already records for `1c deploy`.
- **Apps are discovered, not listed.** Both scripts find `apps/*/wrangler.toml`; the failure
  mode of a hand-kept list is an app that silently never gets built.

## Evidence

| AC | Evidence |
|---|---|
| 1 | `wrangler deploy --env production --dry-run` for control-app now resolves `env.BUILDER_ORIGIN`; before it printed the inheritance warning and `No bindings found.` |
| 2 | `test_UAT_FC_REQ-144_named_environments_repeat_every_top_level_var_and_binding` over every app, plus `…_inheritance_guard_catches_the_config_that_shipped` |
| 3 | `bin/build` runs green from the worktree: preflight (9 shared components, 2 packages), `pnpm -r build`, both bundles, artifacts reported |
| 4 | **`bin/smoke --slug xgd --draft fa0344fb47a8` passed against live `https://1stcontact.io` — 9 checks, 11 assets, all 200 with the expected content type — before any change was deployed** |
| 5 | `…_smoke_fails_naming_the_assertion` is table-driven over six distinct breakages: a 404ing asset, a font served as the wrong type, a preview that lost its `noindex`, a lost trailing-slash redirect, a 404 that reveals the site exists, and an apex that stopped resolving |
| 6 | `…_no_secret_value_is_committed_or_echoed` |

18 UATs, all passing. The full node suite has **75 pre-existing failures across 13 files**
(assistant/toolbox surfaces, and `bug32`'s scope check now flagging `kb.ts`); verified identical
at the baseline commit with this work stashed, so none are attributable here.

## Findings from production — not fixed here, deliberately

Investigating AC1 against the live account turned up two facts the ticket's premise did not have:

1. **`app.1stcontact.io` does not resolve at all** — `NXDOMAIN`, not a 503. The route is
   declared as `{ pattern = "app.1stcontact.io/*", zone_name = "1stcontact.io" }`, and a zone
   route needs a DNS record that does not exist. public-site's apex uses `custom_domain = true`
   precisely for this reason, and its wrangler.toml says so: *"the zone has no proxied record for
   the apex, and a route alone would resolve to nothing."*
2. **`1stcontact-control-app` has never been deployed** — `wrangler deployments list --env
   production` answers *"This Worker does not exist on your account"*. So the `[vars]` bug was
   never live; it was a trap set for the first deploy, and it is now sprung harmlessly.

Neither is fixed here, because creating the DNS record and deploying would make the builder
publicly reachable, and [[REQ-147]] (Cloudflare Access) `depends_on` this ticket precisely so it
can gate that. REQ-147 notes the exposure is *"latent rather than live"* — this is why. The
sequence is: this ticket → REQ-147's Access policy and `workers_dev` decision → DNS → deploy.

## Outstanding

- **The secret mechanism is documented and its dry-run path is tested, but has not been proved
  end-to-end with a throwaway value against the live account.** That means running
  `wrangler secret put` against a production Worker, which is an outward-facing change to
  production configuration; it is left for the operator to authorise. (It is also blocked in
  practice by finding 2 — the Worker does not exist to put a secret on.)
- **CI is not wired to `bin/build`.** It cannot be: `1c preflight` requires the shared component
  store, which is installed out of band and is absent in CI. `bin/build --skip-preflight` exists
  for that case, but CI was left alone rather than half-wired. This becomes load-bearing at
  [[REQ-145]], when the browser artifacts stop being served off disk and CI genuinely needs the
  store to build them.