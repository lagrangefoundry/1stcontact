---
uid: comment-5dcdad31
id: COMMENT-1022
type: comment
title: Comment on request REQ-144
created_by: xgd
created_at: '2026-08-15T22:03:50.245036+00:00'
updated_at: '2026-08-16T01:18:59.268220+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-7bef34e0
  kind: chat_transcript
---

<!-- xgd-turn id="d01364d1-678b-4ce2-9f79-5b3882353268-user" -->

<!-- xgd-chat role="user" ts="2026-08-15T22:03:45.151271+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="d01364d1-678b-4ce2-9f79-5b3882353268-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-15T22:22:57.741447+00:00" -->
#### Claude
I'll start by reading the ticket to see what's specified.

Let me investigate the current state before asking anything.

I have what I need. Setting up the free-coding branch.

Now the shared-store preflight the build script needs:

Now wire it into the CLI as a `preflight` verb:

Now the usage text:

Now the hook directories and the secrets documentation:

Now the smoke script — the assertion engine plus its CLI:

AC4 verified against live production. Now testing build and deploy:

Now the UATs:

While the suite runs, let me check what else production reveals about `app.1stcontact.io`:

Baseline confirms all 75 failures are pre-existing. Restoring my work:

Now bump version and commit:

Now merging back to `xgd-working`:

Now updating the ticket body with what was built and the production findings:

Implemented and landed on `xgd-working` as `cd6f00c6e`; REQ-144 is at `free_coded` with the body updated.

## What shipped

**The `[vars]` fix.** `[env.production.vars]` now repeats `BUILDER_ORIGIN`. Before, `wrangler deploy --env production --dry-run` printed the inheritance warning and `No bindings found.`; now it resolves `env.BUILDER_ORIGIN ("http://localhost:8790")`.

**The recurrence guard (AC2).** A UAT asserts, for every `apps/*/wrangler.toml`, that `[env.production]` repeats every top-level var and binding. Bindings are found *structurally* — any table declaring `binding = "…"` — not from a list that would stop covering the first new binding kind. A second UAT feeds the guard control-app's pre-fix config and asserts it reports the omission, so the guard has been shown catching its own bug.

**`bin/build`** — a new `1c preflight` verb (reports every shared-store component and declared package, exits 6 naming what's absent), then `pnpm -r build`, then a per-app bundle built against `--env production`.

**`bin/deploy`** — `--dry-run` is a target, not a second path. Hooks in `bin/deploy.d/{migrate,secrets}/` are the seams REQ-143 and REQ-146 land in without editing the script; a hook exiting non-zero aborts before anything uploads, and a UAT pins that ordering.

**`bin/smoke`** — 9 checks against a live origin. **AC4: it passed against live `https://1stcontact.io` — 9 checks, 11 assets — before anything changed.** AC5 is table-driven over six distinct breakages (404ing asset, font served as the wrong type, a preview that lost its `noindex`, a lost 301, a 404 that reveals the site exists, a dead apex).

18 UATs pass. The node suite has 75 pre-existing failures across 13 files (assistant/toolbox surfaces, and `bug32` now flagging `kb.ts`) — I confirmed they're identical at the baseline commit with this work stashed.

## Two production findings I did not act on

1. **`app.1stcontact.io` doesn't resolve at all** — NXDOMAIN, not a 503. A `zone_name` route needs a DNS record that doesn't exist; public-site's apex uses `custom_domain = true` for exactly this reason and says so in its config.
2. **`1stcontact-control-app` has never been deployed** — `wrangler deployments list` says the Worker doesn't exist on the account. So the `[vars]` bug was a trap set for the first deploy rather than something currently live. The ticket's "returning 503 since it was deployed" premise was wrong on the facts; the fix is still correct and necessary.

I left both alone because creating the DNS record and deploying would make the builder publicly reachable, and REQ-147 (Access) `depends_on` this ticket precisely so it can gate that.

## One item needs your call

The secrets **mechanism** is documented and its dry-run path is tested, but I have not proved it end-to-end with a throwaway value — that means running `wrangler secret put` against a production Worker, which is an outward-facing change to production config. Want me to? (It's currently moot anyway: finding 2 means there's no Worker to put a secret on.)

Also worth knowing: **CI can't run `bin/build`** as-is, because `1c preflight` needs the shared component store, which is installed out of band and absent in CI. `--skip-preflight` covers it, but I left CI untouched rather than half-wire it. That becomes load-bearing at REQ-145, when CI genuinely needs the store to build the browser artifacts.

<!-- xgd-turn id="a06febbf-d37a-464f-a00e-5ccf9532197b-user" -->

<!-- xgd-chat role="user" ts="2026-08-16T01:18:32.863589+00:00" -->
#### You
Can you summarize the commands you created?

<!-- xgd-turn id="a06febbf-d37a-464f-a00e-5ccf9532197b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-16T01:18:58.958219+00:00" -->
#### Claude
Four commands, three in `bin/` and one new CLI verb.

## `bin/build`

```
bin/build [--skip-preflight] [--help]
```

Three stages, in this order:

1. **`1c preflight`** — refuses before anything is emitted if a shared-store component or declared package is absent.
2. **`pnpm -r build`** — each workspace package's own build script (typechecks today).
3. **Bundle** — per app, `wrangler deploy --env production --dry-run --outdir dist`.

Apps are discovered from `apps/*/wrangler.toml`, not listed. `--env production` is deliberate: a config error that only exists under `[env.production]` is the whole subject of this ticket, and building the default environment would miss every one. Exit 6 means the environment is wrong, not the code.

The `dist/` bundle is evidence, not input — `wrangler deploy` rebuilds from source. It becomes a genuinely needed artifact at REQ-145.

## `bin/deploy`

```
bin/deploy [--dry-run] [--env <name>] [app...]
```

No app named → every app. `--dry-run` is a **target**, not a second path: the same hooks run and the same command line is composed, with one flag appended.

Hooks are any **executable** file in `bin/deploy.d/migrate/` or `bin/deploy.d/secrets/`, sorted, run before the upload:

| Variable | |
|---|---|
| `DEPLOY_APP` / `DEPLOY_APP_DIR` | which app, and where |
| `DEPLOY_ENV` / `DEPLOY_WORKER_NAME` | the environment, and the name read out of `wrangler.toml` |
| `DEPLOY_DRY_RUN` | `1` when rehearsing — a hook must change nothing |
| `DEPLOY_REPO_ROOT` | |

A hook exiting non-zero aborts that app **before anything uploads**. The script knows nothing about D1 and no secret's name; REQ-143 and REQ-146 each add a file to a hook directory and change nothing else. Non-executable files are ignored, so each directory's `README.md` sits beside its hooks.

## `bin/smoke`

```
bin/smoke [--origin <url>] [--slug <slug>] [--draft <sha>] [--max-assets <n>]
```

Nine HTTP checks against a live origin, exiting non-zero naming the ones that failed:

- `apex_resolves`
- `unknown_slug_not_found`, `unpublished_slug_indistinguishable` — identical status *and body*, so a 404 doesn't reveal a site exists
- `published_root_redirects`, `draft_root_redirects` — the trailing-slash 301
- `draft_index_serves_html`, `draft_cache_and_robots_policy`, `draft_miss_is_noindex_404`
- `draft_assets_resolve` — every referenced asset 200s with the right content type, following one level into CSS where `@font-face` lives

Checks with nothing to test against report **skip**, never quiet success. Plain JavaScript with no transform or dependency, since it runs straight after a deploy on whatever Node is there.

```bash
bin/smoke --slug xgd --draft fa0344fb47a8   # what I ran against production
```

## `1c preflight`

New verb on the existing CLI. Reports every shared-store component (browser vs. server surface) and every declared package, then exits 6 naming what's absent.

It's separate from the install preflight because the shared components are installed out of band: `pnpm install` can't supply them and the lockfile can't notice them gone — and a missing *browser* component yields an import map that loads, renders chrome, then dies at the first `import`, in the operator's browser.

<!-- xgd-chat-end -->