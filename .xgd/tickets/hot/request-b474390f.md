---
uid: request-b474390f
id: REQ-145
type: request
title: 'control-app becomes the builder: client as build artifact, routes and L1 render
  in workerd, proxy deleted'
created_by: xgd
created_at: '2026-08-15T20:33:04.522130+00:00'
updated_at: '2026-08-15T20:33:04.522130+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: medium
  story_points: 21
  auto_merge_back: true
  needs_review: true
  depends_on:
  - REQ-143
---

# `control-app` becomes the builder, and the proxy is deleted

> **Status: draft.** The shape is understood; the details below are not yet settled enough to
> implement. Do not start this before [[REQ-143]] lands — the design may move under it.

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
4. The proxy, `BUILDER_ORIGIN`, and the Node origin's now-dead routes **deleted** — not left
   behind a flag (`CLAUDE.md`: replace fully).

## 4. Open questions to settle before implementing

- Does `1c builder` survive as a local dev origin, or does `wrangler dev` replace it outright?
  Keeping both risks exactly the two-code-paths problem `CLAUDE.md` forbids.
- `published` is still served off disk here and from R2 by `public-site`. Which serves it after
  this?
- The `no-store` directive currently set once for every builder response — where does its
  equivalent live in the Worker?

## 5. Acceptance criteria (provisional)

1. With `1c builder` **not running**, `app.1stcontact.io` serves the chrome, lists sites, and
   renders the draft and edit channels for a pure-L1 site.
2. Editing copy and palette through the Worker produces the same store state as the CLI does.
3. The preview iframe stays same-origin and "open in new tab" resolves to the identical URL.
4. `apps/control-app/src/index.ts` contains no proxy and no `BUILDER_ORIGIN`.
5. No route type-strips, transpiles or reads source at request time.
6. Clean `pnpm -r build` and typecheck.

## Origin

[[CHAT-25]]. This is the first milestone where the builder genuinely runs on Cloudflare.
