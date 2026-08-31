---
uid: doc-95b1b7f1
id: DOC-12
type: doc
title: Site Storage, Versioning & Rendering Model
created_by: xgd
created_at: '2026-06-30T20:21:05.234795+00:00'
updated_at: '2026-08-31T19:42:54.453682+00:00'
completed_at: null
last_field_updated: system_kb
status: null
fields:
  doc_kind: architecture
---

# Site Storage, Versioning & Rendering Model

## 1. Purpose

Defines how a site is **stored**, **versioned**, and **rendered** — for the current file-backed system and the Cloudflare (D1 + R2) system it is migrating to. Companion to [[DOC-7]] (framework) and [[DOC-5]] (platform).

This model **supersedes** the earlier framing in which a site was a single flat `site.json` and a revision captured only the definition JSON.

## 2. Core principles

1. **Source is versioned; renders are derived.** The versioned source of truth is the site *definition + assets + metadata*. Rendered HTML/CSS/JS is a derived build artifact, regenerated from source — never versioned.
2. **A version captures everything.** A revision is an immutable snapshot of the *entire* site state: page definitions, assets, **and** metadata — not just the definition.
3. **Forward-only history.** Revisions are immutable once published. The live site is **always the latest revision** (no separate "head"/`published_revision_id` pointer — it is derivable). To change a published site you return it to draft, edit, and publish a *new* revision. Nothing is rewritten or deleted; "rollback" = `checkout <old>` + `publish`.
4. **Draft and published never share a location.** Every rendered artifact has its own address, so publishing is always a deliberate act and unpublished work is never served from a published URL. Draft output is **link-private, not authenticated**: anyone holding the unguessable URL can view it (§5.1). Tightening this to per-viewer access control waits for login — gating publication on access control was judged not worth it for v1.
5. **Git is not the versioning mechanism.** Git version-controls the repository; site versioning is the explicit revisions model below, which is identical in files and in D1. Git history does not migrate to Cloudflare.
6. **Server-side rendering only (for now).** HTML is rendered on a machine (build/CLI) and shipped fully-formed to the browser. There is **no client-side/in-browser renderer** until interaction latency proves one is needed.

## 3. On-disk layout (current — file-backed)

> **All four data trees live under `storage/` (REQ-22):** `storage/sites/` (git-tracked) plus `storage/sandbox/`, `storage/dist/`, and `storage/references/` (gitignored). Paths below are relative to `storage/`.

```
storage/sites/<slug>/                  REAL sites — TRACKED IN GIT (source of truth, VERSIONED)
  draft/                       mutable working copy (hand-edited)
    site.json                  metadata: slug, accountId, displayName, theme, nav
    pages/  home.json about.json   one file per PAGE (module instances inline)
    assets/ hero.jpg logo.svg      media bytes
  revisions/
    0001/  0002/  ...          locked, COMPLETE snapshots (site.json + pages/ + assets/)
  history.json                 revision log (no head pointer; live = latest)

storage/sandbox/<slug>/                THROWAWAY test sites — GITIGNORED (identical shape to storage/sites/)

storage/dist/<root>/<slug>/            RENDERED output — GITIGNORED, regenerated (root = sites | sandbox)
  draft/                       private preview   <- 1c render
  published/                   public site       <- 1c publish
```

**Granularity:** one file per page; module instances are inline within their page file. (Per-module files rejected as too granular to hand-author; one-giant-`site.json` rejected for scalability.)

### 3.1 Directory roots & git tracking

Three roots, two of them gitignored:

| Root | Purpose | Git |
|---|---|---|
| `storage/sites/` | Real sites we will build and deploy to Cloudflare | **Tracked** |
| `storage/sandbox/` | Throwaway space for experimenting with site creation (identical internal shape to `storage/sites/`) | **Gitignored** |
| `storage/dist/` | All rendered output, namespaced `storage/dist/<root>/<slug>/` | **Gitignored**, never committed, always regenerable |

`.gitignore` carries `/storage/sandbox/`, `/storage/dist/`, `/storage/references/`. The `1c` CLI operates on `storage/sites/` by default; `--sandbox` targets `sandbox/`. Rendered output is **never** committed in either root — it is always reproducible from source.

## 4. history.json

Append-only log; one entry per publish. No `head` field (live = highest id).

```jsonc
{
  "site": "acme-bakery",
  "revisions": [
    {
      "id": "0001",
      "publishedAt": "2026-06-30T14:02:11Z",
      "publishedBy": "operator",
      "parent": null,
      "message": "Initial publish",
      "changes": [ { "path": "site.json", "op": "added" }, { "path": "pages/home.json", "op": "added" } ]
    },
    {
      "id": "0002",
      "publishedAt": "2026-06-30T16:20:05Z",
      "publishedBy": "operator",
      "parent": "0001",
      "basedOn": "0001",
      "message": "New hero copy, swapped logo",
      "changes": [ { "path": "pages/home.json", "op": "modified" }, { "path": "assets/logo.svg", "op": "added" } ]
    }
  ]
}
```

`changes` is computed by diffing the draft against the previous revision over the whole snapshot (definition + assets + metadata). `basedOn` is recorded when the draft was `checkout`'d from a non-latest revision.

## 5. Lifecycle & CLI (`1c`)

- **Author** edits files under `draft/` by hand.
- `1c render <slug>` — render `draft/` -> `storage/dist/<slug>/draft/` (**private** preview).
- `1c publish <slug> [-m "msg"]` — snapshot `draft/` into the next locked revision, diff vs previous, append to `history.json`, **and render the new latest revision -> `storage/dist/<slug>/published/` (public)**. Publish *always* renders.
- `1c checkout <slug> [<revId>]` — copy a revision's contents into `draft/` (default: latest).
- `1c revisions <slug>` — print the history log.
- **Rollback** is not a distinct command: `1c checkout <old>` then `1c publish`.

### 5.1 Preview snapshots (shared drafts)

- `1c deploy <slug> [--channel draft|published]` — render, content-address the output, upload it to the R2 artifact store, and print the URL (REQ-110). Deploy *always* renders first, so stale bytes cannot ship.

A **preview snapshot** is an immutable, content-addressed copy of a draft render, published to a hard-to-guess URL so the draft can be shared for review:

```
https://1stcontact.io/site/<slug>/draft/<sha12>/
```

It is deliberately **not a revision**. It never enters `history.json`, never mints a revision id, and may be garbage-collected at will (`1c deploy --prune`). This keeps the mutable-draft / immutable-revision split of principle 2 intact: drafts can be shared as freely and as often as the author likes without polluting publish history. The id is a hash of the rendered bytes, so redeploying identical content is a no-op that yields the same URL.

Preview snapshots are **link-private, not authenticated** (principle 4). Draft responses carry `X-Robots-Tag: noindex`. Because the id is derived from content rather than random, it is in principle computable by someone who can reproduce the exact rendered bytes; accepted for v1, and replaceable by a random token in the manifest without any layout change.

## 6. Rendering

- `render` is a **pure function** of `(source, framework)` -> static HTML/CSS/JS. Deterministic; reproducible.
- Two outputs, two audiences, two locations:

| | Draft preview | Published site |
|---|---|---|
| Rendered from | `draft/` | latest revision |
| Audience | author, plus anyone holding the link (§5.1) | public |
| Triggered by | `1c render` | `1c publish` (always) |
| Lives in | `storage/dist/<slug>/draft/` | `storage/dist/<slug>/published/` |

- Server-side only (see principle 6). The builder's future preview, when built, is server-rendered HTML shown in an iframe — not a client-side renderer.

## 7. Cloudflare mapping

The migration splits into **serving** and **storing**, and the two move independently.

**Phase 1 — serving** (REQ-109/110/111): definitions stay canonical on the operator's machine and `1c` remains the renderer, while Cloudflare serves the rendered artifact out of R2. **Phase 2 — storing**: the canonical store moves into D1, triggered by a *server-side builder* needing to read and write it — not by a date. Moving the store while authoring is local would demand bidirectional sync that neither endpoint requires, which is the genuinely throwaway work.

**Keys are namespaced by root.** `<root>` below is `sites` or `sandbox` — the same split §3.1 makes on disk. It is part of the R2 address, not only the local path: without it a `--sandbox` deploy shares a keyspace with any real site of the same slug and can overwrite its published bytes (BUG-31). **Only `sites/` is servable** — the Worker never derives a root from a request, so no URL can name a `sandbox/` key.

| Concept | File (now) | Phase 1 — serving | Phase 2 — storing |
|---|---|---|---|
| draft source | `storage/<root>/<slug>/draft/` | canonical on disk; mirrored to R2 as `source/` beside each snapshot | D1 draft + R2 draft assets |
| revision (snapshot) | `revisions/NNNN/` | R2 `<root>/<slug>/rev/NNNN/{out,source}/` | + D1 revision metadata |
| history log | `history.json` | R2 `<root>/<slug>/manifest.json` | D1 `revisions` table |
| asset bytes | `.../assets/` | R2, inside the snapshot | unchanged |
| published render | `storage/dist/<root>/<slug>/published/` | R2 `<root>/<slug>/rev/NNNN/out/`; served by `public-site` at `/site/<slug>/` for `sites` only | unchanged; renderer moves server-side |
| draft preview | `storage/dist/<root>/<slug>/draft/` | R2 `<root>/<slug>/preview/<sha>/out/`; served at `/site/<slug>/draft/<sha>/` for `sites` only (§5.1) | + per-viewer access control |
| "live = latest" | highest revision | `manifest.live` (per root) | D1; still derivable |

A sandbox deploy therefore uploads and indexes normally but reports no URL: the snapshot is unreachable by construction. Exercising the *serving* path needs a throwaway slug under `storage/sites/`.

Because `source/` ships beside `out/`, each R2 revision is a *complete* snapshot per principle 2 — so phase 2 is an **import from R2**, not a re-derivation from a laptop.

Everything but the store itself survives phase 2 unchanged: the route grammar, the R2 `out/` layout, content-addressing, the caching rules, deploy semantics, and DNS/TLS. The Worker reaches storage through a single `SiteStore` accessor; phase 2 swaps only its implementation.

**Relocatable artifacts.** Serving one rendered snapshot at more than one URL requires the render to hold no absolute self-references, so asset URLs are emitted document-relative (REQ-109). This is what makes a snapshot content-addressable and lets promotion be a pointer flip rather than a re-render.

## 8. Versioning storage strategy

- **MVP: full snapshots** — a revision copies the whole working set. Simple, fully inspectable on disk.
- **Later (not now): content-addressed dedup** — blobs by hash + a manifest — when media scale demands it. The "revision = immutable snapshot" abstraction is unchanged by this optimization, so it can be introduced without a model change.

## 9. Known deferrals / caveats

- **Render fidelity for old revisions:** re-rendering uses the *current* framework, so an old revision can render differently than at original publish if the framework changed. MVP relies on the repo-pinned framework. Future options: pin a framework version per revision, or store rendered output.
- **Multi-tenant published-output serving** — **decided** (REQ-111): one shared `public-site` Worker serving R2 by slug, *not* Workers Static Assets. Static Assets binds artifacts to a Worker *deployment*, so every publish and every preview link would require a deploy, which does not go multi-tenant. Closes [[DOC-7]] §11.3.
- **Published-channel cache staleness:** published URLs are not revision-scoped, so a new revision leaves a window (≤ the published TTL) in which a client can pair new HTML with cached old CSS. Preview snapshots are immune — SHA-addressed and cached immutably. Both fixes (revision-scoped published asset paths, or purge-on-deploy) are additive.
- **Draft access control:** preview snapshots are link-private only (principle 4, §5.1); per-viewer sharing arrives with login.
- **URL scheme:** sites are served path-based under the apex (`/site/<slug>/…`). Subdomain serving (`<slug>.1stcontact.io`, per [[DOC-7]] §2.2) and custom domains are later and additive — relocatable artifacts (§7) mean neither needs a re-render.
- **AI builder and client-side preview** — explicitly out of scope for now.

## 10. Reconciliations required in existing tickets/docs

- **REQ-7 (D1 schema):** drop `published_revision_id` (forward-only); revisions must snapshot *everything* (assets + metadata), not the definition only; adopt per-page granularity (aligns with [[DOC-5]]'s Pages/Sections entities).
- **REQ-4 (framework):** the render path need **not** be browser-ESM (no client-side preview); that constraint is lifted.
- **[[DOC-7]] §2.2/§2.4/§11** and **[[DOC-5]]** reconciled to this document.


---

## 11. Reconciliation — the builder is now designed (2026-07-31, CHAT-9)

§9's deferral *"AI builder and client-side preview — explicitly out of scope for
now"* is **half superseded**:

- **The builder is in scope and specified** — [[DOC-8]] (app architecture) and
  [[DOC-28]] (the page editor). Nothing in this document's storage or versioning
  model changes as a result; the builder *consumes* it.
- **Client-side preview stays out of scope**, exactly as principle 6 and §6 state.
  The builder's preview is server-rendered HTML in an iframe.

Two consequences worth recording here, where the storage model lives:

- **This document's §7 phase-2 trigger is now real.** Moving the canonical store to
  D1 is triggered by *"a server-side builder needing to read and write it"* — that
  builder is being built. Whether v1 runs against the file-backed store first is an
  open question ([[DOC-8]] §13).
- **A third render channel exists.** Alongside draft preview and published, the
  builder renders an **edit** channel: the same document with links/forms/behaviour
  /motion disabled and editor handles stamped ([[DOC-28]] §5). It is a render mode,
  not a new artifact — it is never published, never content-addressed, and never
  enters `history.json`.
- **The toolbar's Publish is exactly §5's `publish`** — snapshot, diff, append,
  render. The builder adds no publish semantics of its own.