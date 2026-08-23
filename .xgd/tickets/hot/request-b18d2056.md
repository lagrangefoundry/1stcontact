---
uid: request-b18d2056
id: REQ-141
type: request
title: 'Workers-runtime test project: UATs that run inside workerd against real D1
  and R2 bindings'
created_by: xgd
created_at: '2026-08-15T20:30:39.280519+00:00'
updated_at: '2026-08-20T21:30:18.786896+00:00'
completed_at: '2026-08-20T21:02:49.280994+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  priority: high
  story_points: 3
  auto_merge_back: true
  needs_review: false
  blocked_by: []
  not_blocked_by:
  - bundle-d9226698
  dependency_eval_state:
    evaluated_at: '2026-08-15T20:31:58.367726+00:00'
    evaluated_against:
    - bundle-d9226698
  ready_since: '2026-08-20T21:03:59.354265+00:00'
  depends_on: []
  commits:
  - working_sha: 8d8b81ccb2eb1144a7acede987c05c55c706a7aa
    reconcile_sha: null
    main_sha: null
    working_sha_history:
    - aea40e5d7eb148ebeb121d7cb55e5b1c40cd81fc
  version: 0.1.49
  bundled_in: bundle-77b28def
  chat_comment: comment-10763fb1
---

# Workers-runtime test project

The store work that follows — site definitions in D1, asset bytes in R2 — can only be proved where it will run: **inside workerd, against real bindings**. This repository cannot do that today. This ticket makes it able to, and nothing else.

## 1. Why it does not work today

`vitest.config.mts` is a **single** config built on Astro's `getViteConfig`. That is not incidental: it wires the `.astro` transform into Vitest so behavior-module components render through the container API. The transform cannot run in workerd, and `@cloudflare/vitest-pool-workers` requires its own pool. One config cannot be both, so this is a structural change to the test setup rather than a dependency addition.

`@cloudflare/vitest-pool-workers` is also not installed here (lagrange-framework has 0.18.5).

## 2. What it is

Vitest split into **projects**:

- the existing Astro/node project, **unchanged** — same includes, same webui aliases, same timeouts;

- a new **workerd** project with `d1Databases` and `r2Buckets` bindings, reached from tests via `import { env } from 'cloudflare:test'`.

**Precedent to follow, not invent.** `lagrange-framework` already solved this exact split: its root `vitest.config.mts` composes per-component project configs, and `components/ticketing/js/vitest.config.js` is the workerd one (`cloudflareTest({ miniflare: { d1Databases: ['DB'] } })`). It hit the same wall we do — its `DocDirStore` filesystem reader cannot run in workerd — and answered it with a sibling `vitest.node.config.js`. Its 69 tests run in ~1.8s.

## 3. Deliverables

- `@cloudflare/vitest-pool-workers` added to devDependencies.

- Root config becomes `projects: [...]`. The Astro project's behaviour is what it is today — this ticket changes where tests run, never what they assert.

- A workerd project config carrying `D1` and `R2` bindings and its own `include`.

- A file-naming convention that routes a test to the right project, stated once and followed.

- One UAT per project proving it runs where it claims to.

## 4. Acceptance criteria

1. `pnpm test` runs both projects; every test green before this ticket is green after it.

2. A UAT in the workerd project reaches a D1 binding through `cloudflare:test` and applies a schema.

3. A UAT in the workerd project writes and reads back an R2 binding.

4. A test importing `node:fs` runs in the node project and is excluded from the workerd project.

5. The Astro container-render UATs still pass — the `.astro` transform is intact, proving the split did not cost the thing the single config existed for.

6. Clean `pnpm -r build` and typecheck.

## Origin

[[CHAT-25]] — putting the builder on Cloudflare. This blocks the store port and every store UAT after it, so it is first.

---

# What landed

## Files

File

Role

`vitest.config.mts`

**Orchestrator only.** `defineConfig({ test: { projects: [...] } })` — no `include`, no suite of its own. Carries the routing convention as its doc comment, so the rule has one home.

`vitest.node.config.mts`

**New file, old content.** The previous `vitest.config.mts` verbatim — same `getViteConfig`, same `webuiAliases()`, same 60s timeouts — plus `name: 'node'` and one `exclude` line handing the marked files over.

`vitest.workers.config.mts`

**New.** `cloudflareTest({ miniflare: { d1Databases: ['DB'], r2Buckets: ['SITES'] } })`, `name: 'workers'`, `include: ['tests/**/*.workers.test.ts']`.

## The routing convention

`*.workers.test.ts`** runs in workerd; every other `*.test.ts` runs in node.**

Stated once, in the root config's doc comment. No per-file opt-in comment, no directory split — a file's runtime is legible from its name alone.

This inverts lagrange-framework's `*.node.test.js`, and deliberately: there, workerd is the default and node is the marked exception; here it is the other way round. The _marked_ side is always the minority side, so the convention stays cheap in both repos.

## Bindings mirror the deployed shape

- `SITES` (R2) — the bucket `1c deploy` publishes rendered snapshots to (`apps/public-site/wrangler.toml`). Reused rather than renamed, so a store UAT and the deployed Worker are talking about the same thing.

- `DB` (D1) — no Worker declares one yet. This is where it gets declared first, which is the point of the ticket.

- `compatibilityDate: '2025-07-01'` / `compatibilityFlags: ['nodejs_compat']` copied from the apps' wrangler.toml, so the test runtime is the _production_ runtime — not a newer one that would let a test pass on behaviour the deployed Worker does not have.

## Design decision made during implementation: the pool version is pinned exactly

`@cloudflare/vitest-pool-workers` is `"0.18.5"`, **not** `"^0.18.5"`.

Each pool release pins an exact `miniflare`, and therefore an exact `workerd`. Installing `^0.18.5` (→ 0.18.8 → `workerd@1.20260722.1`) failed in `workerd`'s postinstall with `Expected "2026-07-22" but got "workerd 2026-06-30"`: the lockfile recorded `workerd@1.20260722.1: {}` — its `optionalDependencies` unresolved — so the platform binary was never linked and `install.js` validated against a stale one. 0.18.5 is the version lagrange-framework already runs and installed cleanly, so it was pinned.

> ### ⚠️ CORRECTION (2026-08-15, after promotion) — the diagnosis above was wrong

This ticket originally recorded the cause as _"the platform binary is withheld by the workspace's minimum-release-age gate"_, inferred from a correlation with publish dates (35d old → installed, 23d → not). **That inference was wrong, and the pin does not do what this ticket claimed it does.**

A later `pnpm update` reproduced the identical crash — `Expected "2026-08-11" but got "workerd 2026-07-10"` — this time via `wrangler` (^4.106.0 → 4.123.0 → `miniflare@5.20260811.1-alpha` → `workerd@1.20260811.1`), which the pool pin does not govern at all. Four controlled experiments on the same pnpm 11.9.0 then ruled the original theory out:

Experiment

Result

`@cloudflare/workerd-darwin-arm64@1.20260811.1` (3 days old) alone

**installs** — no age gate

`wrangler@4.123.0` in a clean dir

**installs**, binary linked

same, with a `minimumReleaseAgeExclude` list present

**installs** — the exclude list is not the trigger

the _entire post-update dependency set_, resolved from scratch

**installs**, both `workerd@1.20260710.1` and `1.20260811.1` binaries present, postinstall green

**Actual cause: pnpm 11.9.0's incremental resolution.** When it adds a _new version_ of a package that already exists in the lockfile at another version, it can write the new entry with its `optionalDependencies` dropped (`workerd@1.20260811.1: {}`). The binary is then never linked, and `workerd`'s `install.js` resolves a hoisted sibling of the wrong version and throws. A from-scratch resolve of the same manifests never does this. `minimumReleaseAge` is set nowhere in this repo, in a parent, in `~/.npmrc`, or in pnpm's config; there is no `.pnpmfile.cjs`. pnpm self-reports `11.9.0 → 11.22.0` available.

**Consequences for this ticket:**

- The exact pin _did_ hold across `pnpm update` (the lockfile still records `specifier: 0.18.5` while everything around it moved), so it is not harmful — but it is not load-bearing for the reason given, and `^0.18.5` would have been equally fine.

- **The rationale comment in **`vitest.workers.config.mts`** states the wrong cause and should be corrected or removed.** Left in the tree pending a decision on whether to reopen this ticket for a comment-only commit or fold it into the dependency-bump work.

- The real lever, if the workerd postinstall crash recurs, is a from-scratch resolve or a pnpm upgrade — not version pinning.

## Evidence

`tests/test_UAT_FC_REQ-141_workers_runtime.workers.test.ts` (workerd project) — 3 tests, ~2.1s:

- **AC2** — reaches `env.DB`, applies DDL, then reads the schema back out of SQLite's own `sqlite_master` catalogue (a stub that swallowed `exec` cannot answer that), round-trips a row, and confirms the PRIMARY KEY is enforced by SQLite rather than by the test.

- **AC3** — `env.SITES` put/get/list/delete, asserting on R2's _server-computed_ `size` and 32-hex `etag` and on `httpMetadata` surviving the round trip, not just on the body echoing back.

- Asserts `navigator.userAgent === 'Cloudflare-Workers'` — the pool is really the pool.

`tests/test_UAT_FC_REQ-141_project_routing.test.ts` (node project) — 4 tests:

- **AC4** — imports `node:fs` at module scope and uses it, so the file could only have loaded in a runtime that has one; asserts the userAgent is _not_ the Workers one; asserts its own name carries no `.workers` marker.

- Asserts the two `include`/`exclude` globs agree with each other and that the root config declares no `include` of its own (a suite there would run in neither runtime).

- **AC5 companion** — asserts `vitest.node.config.mts` still routes through `astro/config`'s `getViteConfig`, and that the workerd config does not mention astro at all.

## Suite state (AC1, AC5, AC6)

- `pnpm -r build` — clean. `pnpm -r typecheck` — clean. **AC6 met.**

- Full run: **227 files, 1640 tests — 13 files / 75 tests failing.**

- **Those 75 failures are pre-existing and unrelated.** Verified by re-running the same 13 files against the _old_ single config out of `HEAD`: byte-identical result, 13 files / 75 tests. They come from an upstream `@lagrangefoundry/ai` toolbox change — refusals now return an object where the UATs expect a string (`.toMatch() expects to receive a string, but got object`) and the audit trail comes back empty. Nothing in this ticket touches that surface.

- Every Astro container-render UAT is in the passing 1498. **AC5 met.**

So AC1 holds in its delta sense: the failure set is unchanged across the split. Closing those 75 is separate work against whichever ticket owns the toolbox upgrade.

## Test plan

Both new UATs are `test_UAT_FC_REQ-141_*` and become reconciliation's to rename against real ACs. The routing UAT is deliberately structural — it asserts the _convention_, which is the deliverable, and is what will fail if a later change quietly moves a test into the wrong runtime.