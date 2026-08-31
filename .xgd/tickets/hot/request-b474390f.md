---
uid: request-b474390f
id: REQ-145
type: request
title: 'control-app becomes the builder: client as build artifact, routes and L1 render
  in workerd, proxy deleted'
created_by: xgd
created_at: '2026-08-15T20:33:04.522130+00:00'
updated_at: '2026-08-31T14:22:40.512711+00:00'
completed_at: '2026-08-31T14:22:40.512711+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  priority: medium
  story_points: 13
  auto_merge_back: true
  needs_review: true
  depends_on:
  - REQ-141
  - REQ-142
  - REQ-143
  - REQ-144
  - REQ-147
  commits:
  - working_sha: cb403366db16ef7147b56fc12b5c5db942805d63
    reconcile_sha: null
    main_sha: null
    working_sha_history:
    - 5352c5131a0da1350e980a06f3ca5338cfcf7d9b
    - 755c557eda87f0077e1aa2c47fbeddb54cf47c53
  - working_sha: 16edb7521cbf1544c583ff1cb406a2dc62512638
    reconcile_sha: null
    main_sha: null
    working_sha_history:
    - 99f90873e2161a4d6e524de99d7dfc1f8afc8e47
    - c71f541fb114bf7f5a4be1bd7ccbc2acaf7fd6e2
  - working_sha: 7a1822f523fdfe658e10495c46d7a7bc152f2cad
    reconcile_sha: null
    main_sha: null
    working_sha_history:
    - 11c5908bdb42dcee012cb20456d6d06a9dcdd489
    - 4902b47d8be35521fc5b5fb78b889de90811b0c7
  version: 0.1.59
  chat_comment: comment-c73091bc
  bundled_in: bundle-b3b7c399
---

# `control-app` becomes the builder, and the proxy is deleted

> **Status: scoped, 2026-08-17.** The open questions in §4 are answered and the chat and publish halves are split out. [[REQ-143]] has landed (`b71a86411`), so the store is reachable from a Worker and this is unblocked.

Today `apps/control-app/src/index.ts` is a **pure proxy**: it forwards every request to a Node origin and owns no routing. This ticket makes it the origin. `1c builder` (the 700-line `node:http` server in `tools/generate/src/cli/builder.ts`) stops being required to view or edit a site.

## 1. What makes this possible now

The **L1 renderer is already portable**. `packages/framework/src/l1/` contains no `node:` module imports, and `render.ts` imports `astro/container` _lazily_, so a pure-L1 site renders through `renderL1Document` with zero Astro involvement — pure string templating.

And it matters that this is nearly all of the real workload: across all three sites in `storage/sites/`, the definitions are 139 `text`, 55 `box`, 53 `container`, 11 `control` and 4 `slot` nodes — against exactly **one** behavior module, `contact-form`, which is [[REQ-148]] and explicitly not this ticket.

The store half is now real too: `d1r2SiteStore()` gives a tenant-scoped `SiteStore` over D1 and R2, and `apps/control-app/wrangler.toml` already declares the `DB` and `SITES` bindings both top-level and under `[env.production]`.

## 2. Three things currently served from places a Worker cannot reach

This is the part most likely to be under-estimated, so it is stated separately from the routes:

Route

Today

Problem

`/webui/*`

`webuiPackageDir()` — the out-of-repo shared artifact store

Worker cannot read `node_modules` at runtime

`/builder/*`

`apps/control-app/src/builder`, straight off disk

Same

`/framework/*.js`

**TypeScript type-stripped at request time** from repo source

Same, and it is a build step wearing a route

All three become build-time artifacts served from Workers Static Assets. Note the existing comment on the `/framework` route already anticipates this: _"if that ever stops being true this route should become a real build step rather than growing a resolver."_

**Caution:** `apps/control-app/wrangler.toml` records that an `[assets]` binding made `unstable_dev` hang, which is why `BUILDER_ORIGIN` was a plain var. Verify that is still true on current wrangler before committing to the binding, or the Worker becomes untestable.

## 3. Phases

1. Builder client, webui components and framework bridges as **build artifacts**; Static Assets binding.

2. The route table ported from `handleBuilderRequest` to the Worker's `fetch` — the JSON API, the preview channels, the chrome document.

3. Request-time L1 render in workerd, reading through [[REQ-143]]'s store.

4. `bin/publish` — copy local sites into the cloud store, so the Worker has data to serve.

5. The proxy, `BUILDER_ORIGIN`, and the Node origin's now-dead routes **deleted** — not left behind a flag (`CLAUDE.md`: replace fully).

## 4. Decisions (were open questions)

`wrangler dev`** replaces the Node origin; **`1c builder`** calls it.** There is one origin implementation. `1c builder` becomes a launcher that spawns `wrangler dev` against `apps/control-app` and reports its URL, so the operator's command is unchanged while the second code path `CLAUDE.md` forbids never exists. It runs against the **local** simulated D1/R2 by default — `--remote` is an explicit flag, because a dev loop that edits production by default is one keystroke from losing a site.

**Everything moves to the cloud; **`published`** is served from R2.** A public product cannot be served from the operator's laptop. Reading is cheap — `apps/public-site/src/site-store.ts` already resolves a channel to an R2 key prefix — so this ticket takes the read. Writing a new revision is [[REQ-149]].

`no-store`** becomes a response wrapper.** `builder.ts:262` sets it once before routing so every response inherits it, including the JSON envelopes that were the last hole. The Worker keeps that property structurally: one wrapper stamps every `Response` on the way out, so a route added tomorrow inherits the directive rather than having to remember it.

**The Worker acts as one tenant.** `d1r2SiteStore()` hands back a root that can do nothing until `forTenant(id)` is called, and the tenant is checked there. Tenant-scoped is the right starting point because that is what almost every action is. Cross-tenant admin controls are a later ticket, when there is a second tenant to need them.

## 5. Split out of this ticket

- **The chat panel (**`/api/ai/*`**)** → lagrange-framework REQ-103. `ai/host.ts` reaches `@lagrangefoundry/ai` through `sharedModuleUrl()`, a runtime `import()` of a file URL in the out-of-repo artifact store, which a Worker cannot do. Fixing it in the library avoids a third implementation of the session model. Until it lands, `/api/ai/*` answers 501 and the chat pane is dark on `app.1stcontact.io`.

- **Publish (**`/api/publish`**)** → [[REQ-149]]. `cmdPublish` is filesystem all the way down and the `SiteStore` port has no revision, no history and no publish verb. That is a design increment, not a relocation. Until it lands, `/api/publish` answers 501 and publishing stays a CLI operation against the local store.

## 6. Acceptance criteria

1. With `1c builder` **not running**, `app.1stcontact.io` serves the chrome, lists sites, and renders the draft and edit channels for a pure-L1 site.

2. Editing copy and palette through the Worker produces the same store state as the CLI does.

3. The preview iframe stays same-origin and "open in new tab" resolves to the identical URL.

4. `apps/control-app/src/index.ts` contains no proxy and no `BUILDER_ORIGIN`.

5. No route type-strips, transpiles or reads source at request time.

6. Clean `pnpm -r build` and typecheck.

7. `bin/publish` copies a local site's definition and assets into D1 and R2, and the Worker then serves that site. Re-running it is idempotent.

8. `1c builder` starts `wrangler dev` and nothing else; the `node:http` server is gone.

9. `/api/ai/*` and `/api/publish` answer 501 naming the ticket that will implement them — not a 404, which would read as a routing bug rather than a deferral.

## Origin

[[CHAT-25]]. This is the first milestone where the builder genuinely runs on Cloudflare.

---

## Progress — 2026-08-17, commit `5352c5131a0da1350e980a06f3ca5338cfcf7d9b`

**Not yet **`free_coded`**: phase 5 is incomplete.** See "what remains" below.

### Landed

Phases 1–4, verified end to end against `wrangler dev` with real local D1 and R2: both repo sites imported via `bin/publish`, then the chrome document, the site listing, a request-time render, a palette write and an asset fetch all served with **no Node origin running**. 18 UATs, 11 of them inside workerd.

- `1c assets` — builder client, webui components and the framework bridges are build artifacts. Nothing type-strips, transpiles or resolves a package per request (AC-5).

- The route table in `apps/control-app/src/router.ts`, over the same `edit*` functions the CLI dispatches to (AC-1, AC-2).

- `apps/control-app/src/index.ts` holds no proxy and no `BUILDER_ORIGIN` (AC-4).

- `bin/publish` / `1c push` (AC-7), idempotent, with the Worker doing the writing.

- `/api/ai/*` and `/api/publish` answer 501 naming their tickets (AC-9).

### Two blockers the ticket did not anticipate

1. `getModuleCss()`** read **`.astro`** sources off disk at render time** — for _every_ site, not only sites using a module, because `theme.css` folds module chrome unconditionally. So no site could render in a Worker. The read moved to build time (`modules/module-assets.ts`); the extraction is shared and a UAT re-extracts to catch drift.

2. **A lazy **`import('astro/container')`** is still resolved eagerly by a bundler**, pulling Astro, markdown-remark, Shiki and Prism into the Worker. The container and the module resolver are now injected by the node-only writer. This is the same trap the registry posed, and the reason `render.ts` may name neither.

### A latent REQ-143 bug, fixed

`migrations_dir` was declared at the **top level** of `wrangler.toml`, where wrangler warns, ignores it, and looks in `apps/control-app/migrations` — so `wrangler d1 migrations apply` had never actually run. It belongs on the D1 binding. A UAT now pins it.

### A finding that changes AC-1's reach

**Every site in **`storage/sites/`** mounts **`contact-form` — including on its home page — so no real site's draft channel renders until [[REQ-148]]. The ticket estimated "exactly one behavior module"; it is one _kind_, on every site. AC-1 is demonstrated against a scaffolded pure-L1 site, and a page mounting a behavior now fails with a message naming REQ-148 rather than an undefined component. REQ-148 is therefore a prerequisite for using this on real content, not a follow-up nicety.

### What remains (phase 5)

- **AC-8** — `1c builder` still starts the `node:http` server; it should spawn `wrangler dev` instead, and `tools/generate/src/cli/builder.ts` should be deleted along with the origin's now-dead routes.

- **10 tests still assert the proxy architecture** and need rewriting against the Worker: `req115-builder-shell`, `reconciliation-builder-workspace-origin`, `reconciliation-builder-workspace-chrome`, `test_UAT_FC_REQ-147_access_gate` (1), `test_UAT_FC_REQ-144_deploy_scripts` (2). They fail because the proxy they drive is gone, which is the intended change.

- **AC-6** — `pnpm -r build` across the whole workspace has not been run; the three typechecks this ticket touches are clean and the Worker bundles (805 KiB / 150 KiB gzipped).

Unrelated pre-existing failures, confirmed identical on the untouched baseline and **not** caused by this work: 56 tests across the AI/toolbox and L1-surface families (`reconciliation-assistant-*`, `test_UAT_FC_REQ-122_*`, `test_UAT_FC_REQ-126/127/129_*`, `reconciliation-page-composition-surface`, `bug32-webui-scope-rebrand`).

---

## Completed — 2026-08-17

Commits `5352c5131a0da1350e980a06f3ca5338cfcf7d9b` (phases 1–4) and `99f90873e2161a4d6e524de99d7dfc1f8afc8e47` (phase 5).

### Phase 5, as landed

The Node origin's duplicate route table is gone. `cli/builder.ts` drops from 730 lines to a **transport**: `node:http` in, `Request`/`Response` out, into the Worker's own `route()`. One route table, one set of edit functions, one render — two front doors. `1c builder` spawns `wrangler dev` (AC-8).

**Why the transport survives rather than being deleted.** 36 test files drive the builder over HTTP, most about features that merely need an origin — the copy modal, the image picker, the palette popup. Deleting it meant rewriting all 36. Keeping it as a transport costs no second implementation (`CLAUDE.md` forbids two _implementations_, and there is one) and lets those tests keep covering behavior-module pages the Worker cannot render until [[REQ-148]]. Three routes live there and nowhere else because no Worker can host them yet: `/api/ai/*` (lagrange-framework REQ-103), `/api/publish` and the `published` channel ([[REQ-149]]). The router answers 501 for all three.

### Two defects the transport surfaced

- **The **`no-store`** directive was in the Worker's **`fetch`, so the Node transport served the chrome document with no directive at all — the same hole the old `json()` helper opened, one layer up. A per-_host_ restatement is as forgettable as a per-route one. It is the router's now.

- **The preview-render cache was keyed by tenant id**, which is `local` for every Node workspace — one workspace's renderer served all the others. Keyed by the store object (a `WeakMap`) instead.

### Acceptance criteria

AC

State

1 — chrome, listing, draft + edit render with no Node origin

met (pure-L1 site; see the caveat below)

2 — edits produce the same store state as the CLI

met

3 — preview iframe same-origin, new tab identical URL

met

4 — no proxy, no `BUILDER_ORIGIN`

met

5 — nothing type-strips or reads source at request time

met

6 — clean `pnpm -r build` and typecheck

met (`bin/build` green; both Workers bundle)

7 — `bin/publish` copies a site into D1/R2, idempotent

met

8 — `1c builder` starts `wrangler dev`

met

9 — deferred routes answer 501 by name

met

**AC-1's caveat stands**: every site in `storage/sites/` mounts `contact-form`, so AC-1 is demonstrated against a scaffolded pure-L1 site. [[REQ-148]] is a prerequisite for using this on real content.

### Evidence

- Full node suite: **56 failures, exactly the pre-existing baseline** — none attributable to this work. (The baseline is the AI/toolbox and L1-surface families, confirmed failing identically on untouched `xgd-working`.)

- Workers suite: **38/38**, inside workerd against real D1 and R2.

- `bin/build`: preflight, assets, typecheck, both Worker bundles — clean. control-app 807 KiB / 150 KiB gzipped.

- End-to-end against `wrangler dev`: both repo sites imported via `bin/publish`; chrome, listing, render, palette write and asset fetch all served.

### Also fixed here

`migrations_dir` sat at the top level of `wrangler.toml` since REQ-143, where wrangler warns, ignores it and looks elsewhere — `d1 migrations apply` had never run. Moved onto the D1 binding, pinned by a UAT.

`importmap.json` is generated and gitignored rather than committed: a checked-in copy of a generator's output is a second definition site, which BUG-32's scan fails on. `bin/build` runs `1c assets` before the typecheck so a fresh checkout has one.

### Note for review

`ACCESS_DEV_OPEN` is a new var that opens the Access gate for `wrangler dev`. It applies only when Access is unconfigured, is absent from `[env.production.vars]` (which inherits nothing), and a UAT fails the build if anyone restates it there — two independent mistakes to open production, the standard REQ-147 set for `workers_dev`. It is still a bypass and should be read as one.


---

## Free-coding closed — 2026-08-20

Status `free_coding` → **`free_coded`**. The implementation was complete on 2026-08-17 (see the section above); only the promotion gate had not been run.

**Commits, after the resync remap.** The dispatcher's resync rebased this work onto a newer `main` twice, re-authoring every SHA. `fields.commits` now carries the live values, each verified an ancestor of `xgd-working`:

| Live SHA | Subject | Superseded |
|---|---|---|
| `cb403366d` | the builder renders in workerd; assets become a build step | `5352c5131` → `755c557ed` |
| `16edb7521` | `1c builder` starts wrangler dev; one route table, two transports | `99f90873e` → `c71f541fb` |
| `7a1822f52` | `1c assets` must not import what it generates | `11c5908bd` → `4902b47d8` |

Version claimed: **0.1.59** (the bump was absorbed into the rebase by `merge_version_max`, so no single commit shows it as a diff; `xgd_version_bump --check` confirms it against the commit trees).

**Re-verified on the post-resync tree**, not merely on the pre-rebase branch:

- `test_UAT_FC_REQ-145_build_artifacts` — 7/7 (node)
- `test_UAT_FC_REQ-145_builder_in_workerd` — 10/10 (workerd, real D1 + R2 bindings)
- Every file the branch's REQ-145 commits touched is byte-identical between `free-REQ-145` and `xgd-working` (47 files, zero differences) — the rebase carried the work intact.

**Branch teardown.** `xgd branch clean` refuses `free-REQ-145` because resync rewrote its SHAs, so ancestry no longer holds even though the content landed — the refusal is correct and the byte-identity check above is what stands in for it. Worktree and local branch removed by hand; `origin/free-REQ-145` left in place.

**Still true, and unchanged by this promotion:** [[REQ-148]] remains a prerequisite for rendering any real site through the Worker, and nothing is deployed to Cloudflare yet — the account has no `1stcontact-control-app` Worker, `app.1stcontact.io` does not resolve, D1 has no tables, and Access is unconfigured.