---
uid: request-b19f2526
id: REQ-9
type: request
title: '1c CLI: file-backed site storage, versioning, and server-side render pipeline'
created_by: xgd
created_at: '2026-06-30T20:25:46.923728+00:00'
updated_at: '2026-07-24T22:26:17.289958+00:00'
completed_at: '2026-07-24T22:26:17.289958+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  story_points: 8
  priority: medium
  auto_merge_back: true
  needs_review: false
  commits:
  - 0baf0db1f11e6f9fdf8f568ec3cab8aec331fb7e
  version: 0.0.6
  bundled_in: bundle-f39884d2
---

## Scope

Build the **`1c` CLI** — the file-backed site storage, versioning, and **server-side** render pipeline defined in [[DOC-12]] (Site Storage, Versioning & Rendering Model). After this REQ an operator can author multiple example sites as files under `sites/<slug>/`, render them to HTML, view them in a browser, and version them through publish/checkout — with **no AI builder, no D1, and no client-side renderer**.

This is the reshaped, expanded successor to the original `tools/generate` concept: it adds the full draft → revisions → history lifecycle on top of rendering. The renderer runs server-side (Astro at build time) per the revised [[DOC-7]] §2.4.

Design discussion: see [[DOC-12]] (authoritative model), [[DOC-7]] §11 (build pipeline), and the module contract in [[DOC-7]] §3.

## Why free-coded

Construction of a model that is already fully specified in [[DOC-12]] — no open design. One cohesive unit: the storage layer, the lifecycle commands, and the renderer are mutually dependent and only prove out together.

## Dependencies

- **Depends on:** REQ-3 (site-schema — validates loaded definitions), REQ-4 (framework: module registry, theme tokens + CSS generator, chrome modules), REQ-5 (content modules). Build after REQ-5.
- **Unblocks:** the eventual D1/R2 migration (REQ-7, post-reconciliation) — the storage layer's load/snapshot/diff interfaces are the file-backed half of what D1 will mirror.

## On-disk model (per [[DOC-12]] — summary)

```
sites/<slug>/                  REAL sites — TRACKED IN GIT (draft/ + revisions/ + history.json)
sandbox/<slug>/                THROWAWAY test sites — GITIGNORED (identical shape to sites/)
dist/<root>/<slug>/            RENDERED output — GITIGNORED (root = sites | sandbox)
  draft/      <- 1c render      (private preview)
  published/  <- 1c publish     (public)
```

One file per **page** (module instances inline). A revision is a **full snapshot** of the whole working set (definition + assets + metadata). Forward-only: live = highest revision.

## Deliverables

### Package

- Lives in `tools/generate` (package `@1stcontact/generate`); exposes the **`1c`** binary. Pure ESM; Node/build-time tooling permitted on the render path (no browser-ESM constraint — [[DOC-7]] §2.4).

### Storage layer (`src/store/`)

- `loadSite(slug, source)` — assemble `site.json` + `pages/*.json` + asset manifest from `draft/`, a `<revId>`, or `latest`; validate against `@1stcontact/site-schema`; return a typed `Site` or a path-pointed error.
- `snapshot(slug)` — copy `draft/` into the next zero-padded revision dir (`revisions/NNNN/`), a complete byte copy.
- `diffSnapshots(prev, next)` — compute the file-change list (`added` | `modified` | `removed`) over the whole snapshot (pages + assets + metadata).
- `readHistory` / `appendHistory` — manage `history.json` (shape per [[DOC-12]] §4); revision id = previous max + 1; `live = latest`.

### Renderer (`src/render/`)

- Renders each `ModuleInstance` server-side via Astro's `experimental_AstroContainer` through the framework registry (`getModule(id, version)`), one HTML file per page. Generates per-site `theme.css` from `generateThemeCss(theme)` + module styles. Emits `<head>` (viewport, SEO, fonts, `theme.css` link). Copies assets into the output. Deterministic output (no wall-clock in render).

### Commands (`src/cli/`)

- `1c render <slug> [--source draft|latest|<revId>] [--sandbox] [--out <dir>]` — default `--source draft` → `dist/<root>/<slug>/draft/`. Private preview.
- `1c publish <slug> [-m "msg"] [--by <id>] [--sandbox]` — snapshot `draft/` → next locked revision; diff vs previous; append `history.json`; **then render the new latest → `dist/<root>/<slug>/published/`**. Publish always renders.
- **Root selection:** every command defaults to `sites/` (git-tracked real sites); `--sandbox` targets `sandbox/` (gitignored scratch). Output always goes to `dist/<root>/<slug>/`.
- `1c checkout <slug> [<revId>]` — copy a revision (default: latest) into `draft/`; refuse if `draft/` has uncommitted changes unless `--force`.
- `1c revisions <slug>` — print the history log (id, date, message, change count) newest-first.
- `1c new <slug>` — scaffold an empty `draft/` (metadata + one starter page) for a new site.
- `1c list` — list sites under `sites/` with their latest revision id.
- `1c serve <slug> [--source draft|published]` — minimal local static server over the chosen `dist/` dir, for browser viewing.

### Example sites

- Author **two** example sites under `sites/` (committed — e.g. `sites/1stcontact/` and one second example) exercising the Phase-0 module catalog, each with an initial published revision (`0001`). Demonstrates multi-site and gives the UATs real fixtures.

### Repo hygiene (`.gitignore`)

- Ensure `.gitignore` excludes `/dist/` (rendered output) and `/sandbox/` (scratch sites); `sites/` stays tracked. Rendered output and sandbox sites must never be committed.

## UATs (`test_UAT_FC_REQ-9_*`)

- `test_UAT_FC_REQ-9_render_draft_produces_html` — `1c render <slug>` writes valid HTML to `dist/sites/<slug>/draft/` containing rendered module content and a linked `theme.css`.
- `test_UAT_FC_REQ-9_publish_creates_locked_revision` — `1c publish` creates `revisions/0001/` as a complete snapshot byte-identical to the draft, and appends a `history.json` entry with `publishedAt` + `changes`.
- `test_UAT_FC_REQ-9_publish_renders_published_output` — after publish, `dist/sites/<slug>/published/` matches rendering the latest revision; the draft render is untouched.
- `test_UAT_FC_REQ-9_draft_and_published_separate_locations` — `render` writes only under `dist/<root>/<slug>/draft/`; `publish` writes only under `dist/<root>/<slug>/published/`.
- `test_UAT_FC_REQ-9_change_log_is_accurate` — modify one page + add one asset in draft, publish, assert `changes` lists exactly the modified page (`modified`) and the added asset (`added`).
- `test_UAT_FC_REQ-9_checkout_copies_revision_into_draft` — `1c checkout <slug> 0001` replaces `draft/` with revision `0001`'s contents.
- `test_UAT_FC_REQ-9_forward_only_rollback` — `checkout <old>` then `publish` creates a NEW highest revision whose content equals the old one; `history` records it with `basedOn` set.
- `test_UAT_FC_REQ-9_invalid_definition_rejected` — a draft with an invalid page definition fails `render`/`publish` with a path-pointed schema error and writes nothing.
- `test_UAT_FC_REQ-9_multi_site` — the two example sites render independently to their own `dist/sites/<slug>/`.
- `test_UAT_FC_REQ-9_sandbox_isolation` — `1c new --sandbox <slug>` creates under `sandbox/` (not `sites/`) and renders to `dist/sandbox/<slug>/`.
- `test_UAT_FC_REQ-9_gitignore_excludes_dist_and_sandbox` — `git check-ignore` confirms a file under `dist/` and a sandbox site are ignored, while a file under `sites/` is tracked.

## Out of scope

- D1 / R2 storage and the file→D1 migration (REQ-7, post-reconciliation).
- AI builder and any client-side / in-browser renderer ([[DOC-7]] §2.4).
- Multi-tenant published-output serving model ([[DOC-7]] §11.3) and deploying via the `public-site` Worker.
- Content-addressed / deduplicated revision storage (full snapshots only for now — [[DOC-12]] §8).
- Per-revision render-fidelity pinning ([[DOC-12]] §9).
- Real marketing-site copy/assets for `sites/1stcontact/` (operator follow-up).


## Implementation decision (free-coding) — 2026-06-30

**Scope confirmed: Option A — basics first, CLI-cohesive.**

Discovered (empirically verified) that REQ-3's `contentValueSchema` admits only
`string | assetRef | array`, so object-shaped content (header `entries`, hero
`cta`, services-grid `items`, contact-form `fields`) fails `validateSite`. Since
`loadSite` must validate (UAT `invalid_definition_rejected`), the two committed
example sites are authored from the modules representable in a *valid* definition
today: **hero** (no cta), **text-block**, **footer** (no links), plus a string
**header** logo. The renderer is built **catalog-driven** (`getModule(type,
version)` over whatever modules a page contains), so header-entries /
services-grid / contact-form light up with zero renderer change once the schema
admits object content.

The REQ-3 schema gap (admit typed/object content values) is a separate intent —
to be filed as its own ticket, not bundled into REQ-9's reconciliation.

UATs are exercised programmatically under vitest (where the `.astro` transform is
wired via `getViteConfig`), consistent with the existing framework UATs; the `1c`
binary dispatches the same command handlers.

## Model note (2026-07-01)
> Per [[DOC-14]], `1c render` will need to resolve **site-local / draft modules**, not just the shared framework library — a small module-resolution extension, delivered by the bespoke-module lifecycle REQ.