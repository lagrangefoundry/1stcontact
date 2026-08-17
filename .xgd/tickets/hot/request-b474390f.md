---
uid: request-b474390f
id: REQ-145
type: request
title: 'control-app becomes the builder: client as build artifact, routes and L1 render
  in workerd, proxy deleted'
created_by: xgd
created_at: '2026-08-15T20:33:04.522130+00:00'
updated_at: '2026-08-17T21:09:37.833805+00:00'
completed_at: null
last_field_updated: commits
status: draft
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
  - 5352c5131a0da1350e980a06f3ca5338cfcf7d9b
---

# `control-app` becomes the builder, and the proxy is deleted

> **Status: scoped, 2026-08-17.** The open questions in §4 are answered and the
> chat and publish halves are split out. [[REQ-143]] has landed (`b71a86411`), so
> the store is reachable from a Worker and this is unblocked.

Today `apps/control-app/src/index.ts` is a **pure proxy**: it forwards every request to a Node
origin and owns no routing. This ticket makes it the origin. `1c builder` (the 700-line
`node:http` server in `tools/generate/src/cli/builder.ts`) stops being required to view or edit
a site.

## 1. What makes this possible now

The **L1 renderer is already portable**. `packages/framework/src/l1/` contains no `node:` module
imports, and `render.ts` imports `astro/container` *lazily*, so a pure-L1 site renders through
`renderL1Document` with zero Astro involvement — pure string templating.

And it matters that this is nearly all of the real workload: across all three sites in
`storage/sites/`, the definitions are 139 `text`, 55 `box`, 53 `container`, 11 `control` and
4 `slot` nodes — against exactly **one** behavior module, `contact-form`, which is [[REQ-148]]
and explicitly not this ticket.

The store half is now real too: `d1r2SiteStore()` gives a tenant-scoped `SiteStore` over D1 and
R2, and `apps/control-app/wrangler.toml` already declares the `DB` and `SITES` bindings both
top-level and under `[env.production]`.

## 2. Three things currently served from places a Worker cannot reach

This is the part most likely to be under-estimated, so it is stated separately from the routes:

| Route | Today | Problem |
|---|---|---|
| `/webui/*` | `webuiPackageDir()` — the out-of-repo shared artifact store | Worker cannot read `node_modules` at runtime |
| `/builder/*` | `apps/control-app/src/builder`, straight off disk | Same |
| `/framework/*.js` | **TypeScript type-stripped at request time** from repo source | Same, and it is a build step wearing a route |

All three become build-time artifacts served from Workers Static Assets. Note the existing
comment on the `/framework` route already anticipates this: *"if that ever stops being true this
route should become a real build step rather than growing a resolver."*

**Caution:** `apps/control-app/wrangler.toml` records that an `[assets]` binding made
`unstable_dev` hang, which is why `BUILDER_ORIGIN` was a plain var. Verify that is still true on
current wrangler before committing to the binding, or the Worker becomes untestable.

## 3. Phases

1. Builder client, webui components and framework bridges as **build artifacts**; Static Assets binding.
2. The route table ported from `handleBuilderRequest` to the Worker's `fetch` — the JSON API,
   the preview channels, the chrome document.
3. Request-time L1 render in workerd, reading through [[REQ-143]]'s store.
4. `bin/publish` — copy local sites into the cloud store, so the Worker has data to serve.
5. The proxy, `BUILDER_ORIGIN`, and the Node origin's now-dead routes **deleted** — not left
   behind a flag (`CLAUDE.md`: replace fully).

## 4. Decisions (were open questions)

**`wrangler dev` replaces the Node origin; `1c builder` calls it.** There is one origin
implementation. `1c builder` becomes a launcher that spawns `wrangler dev` against
`apps/control-app` and reports its URL, so the operator's command is unchanged while the second
code path `CLAUDE.md` forbids never exists. It runs against the **local** simulated D1/R2 by
default — `--remote` is an explicit flag, because a dev loop that edits production by default is
one keystroke from losing a site.

**Everything moves to the cloud; `published` is served from R2.** A public product cannot be
served from the operator's laptop. Reading is cheap — `apps/public-site/src/site-store.ts`
already resolves a channel to an R2 key prefix — so this ticket takes the read. Writing a new
revision is [[REQ-149]].

**`no-store` becomes a response wrapper.** `builder.ts:262` sets it once before routing so every
response inherits it, including the JSON envelopes that were the last hole. The Worker keeps that
property structurally: one wrapper stamps every `Response` on the way out, so a route added
tomorrow inherits the directive rather than having to remember it.

**The Worker acts as one tenant.** `d1r2SiteStore()` hands back a root that can do nothing until
`forTenant(id)` is called, and the tenant is checked there. Tenant-scoped is the right starting
point because that is what almost every action is. Cross-tenant admin controls are a later
ticket, when there is a second tenant to need them.

## 5. Split out of this ticket

- **The chat panel (`/api/ai/*`)** → lagrange-framework REQ-103. `ai/host.ts` reaches
  `@lagrangefoundry/ai` through `sharedModuleUrl()`, a runtime `import()` of a file URL in the
  out-of-repo artifact store, which a Worker cannot do. Fixing it in the library avoids a third
  implementation of the session model. Until it lands, `/api/ai/*` answers 501 and the chat pane
  is dark on `app.1stcontact.io`.
- **Publish (`/api/publish`)** → [[REQ-149]]. `cmdPublish` is filesystem all the way down and the
  `SiteStore` port has no revision, no history and no publish verb. That is a design increment,
  not a relocation. Until it lands, `/api/publish` answers 501 and publishing stays a CLI
  operation against the local store.

## 6. Acceptance criteria

1. With `1c builder` **not running**, `app.1stcontact.io` serves the chrome, lists sites, and
   renders the draft and edit channels for a pure-L1 site.
2. Editing copy and palette through the Worker produces the same store state as the CLI does.
3. The preview iframe stays same-origin and "open in new tab" resolves to the identical URL.
4. `apps/control-app/src/index.ts` contains no proxy and no `BUILDER_ORIGIN`.
5. No route type-strips, transpiles or reads source at request time.
6. Clean `pnpm -r build` and typecheck.
7. `bin/publish` copies a local site's definition and assets into D1 and R2, and the Worker then
   serves that site. Re-running it is idempotent.
8. `1c builder` starts `wrangler dev` and nothing else; the `node:http` server is gone.
9. `/api/ai/*` and `/api/publish` answer 501 naming the ticket that will implement them — not a
   404, which would read as a routing bug rather than a deferral.

## Origin

[[CHAT-25]]. This is the first milestone where the builder genuinely runs on Cloudflare.