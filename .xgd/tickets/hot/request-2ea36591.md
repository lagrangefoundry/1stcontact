---
uid: request-2ea36591
id: REQ-109
type: request
title: 'Rendered output is not relocatable: normalise asset URLs to document-relative'
created_by: xgd
created_at: '2026-07-30T19:34:47.469373+00:00'
updated_at: '2026-08-06T19:46:29.338743+00:00'
completed_at: '2026-08-06T19:46:29.338743+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  priority: high
  story_points: 2
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: 106449e0ccc26b1b1fa2e0e529e193f2b7d90396
    reconcile_sha: null
    main_sha: null
  version: 0.1.5
  bundled_in: bundle-e0143ffa
  chat_comment: comment-34e04d9c
---

## The gap

Rendered output was **not relocatable**: it only worked when served from a host
root. The renderer emitted root-absolute asset URLs, so the same bytes could not
be served under a path prefix.

From `storage/dist/sites/xgd/draft/index.html` (before):

```
href="./theme.css"                       ← relative, fine
src="./capabilities.js"                  ← relative, fine
url("/assets/satoshi-400.woff2")         ← ROOT-ABSOLUTE, inside CSS url()
url("/assets/xgd-grid-hero.svg?v=3")     ← ROOT-ABSOLUTE
```

Served from `1stcontact.io/site/xgd/draft/<sha>/`, every `/assets/…` reference
resolves against the apex and 404s. `<base href>` is **not** a fix: it does not
apply to `url()` inside CSS, which is exactly where the font and image
references live.

The absolute form originates in the authored L1 document — `storage/sites/xgd/draft/pages/home.json`
literally contains `"/assets/satoshi-400.woff2"` in its resource table.

## Why this matters beyond hosting

Relocatable output is what makes a rendered snapshot **content-addressable**. If
the serving URL is baked into the bytes, promoting a draft snapshot to published
requires a re-render rather than a pointer flip, and the same content deployed
at two URLs is two different artifacts. Relocatability is the precondition for
the immutable snapshot model in [[DOC-12]].

It also removes a Cloudflare dependency: proxied **wildcard** DNS records are
plan-dependent, and without relocatable output every draft preview needs its own
hostname. With it, previews live under a single apex path.

## What changed

Root-relative URLs are normalised to **document-relative** at the emission
sinks. One rule, applied identically at all three
(`packages/framework/src/l1/render.ts`):

```
relativizeUrl(v):
  starts with "/" and not "//"  →  v.slice(1) || "./"
  otherwise                     →  unchanged
```

| Sink | Emits |
|---|---|
| `cssUrl` | `url("…")` — fonts (`@font-face`), background images, texture masks |
| `<img>` | `src="…"` |
| link `href` | `href="…"` — the REQ-106 navigation role |

Applied **after** the existing safety checks (`isSafeUrl`, `CSS_URL_ALLOWED`), so
validation semantics are unchanged and the security envelope is untouched — the
rewrite can reshape an already-vetted value but never admit one. The `not //`
guard is explicit defence: `//evil.com/x` must never become `/evil.com/x`.

A bare `/` maps to `./`, not the empty string: `href=""` resolves to the current
*page*, which is a different target once the page is not `index.html`.

**The authored L1 face does not change.** Sites keep writing `/assets/…`; only
the emitted bytes change. No site definition was edited, so no reproduction
ticket is disturbed.

### Flatness invariant

Stripping the leading `/` is correct only because every rendered page sits flat
at the snapshot root (`index.html`, `home.html`). `renderSite`
(`tools/generate/src/render/render.ts`) now asserts that: a page slug containing
a path separator throws with a message naming the invariant, rather than
emitting silently-wrong relative URLs. A nested page would need a depth-aware
`../` prefix.

## Non-goals

- No change to the authored L1 schema or to any site definition.
- No base-path or host configuration on the renderer — the artifact stays
  location-independent, which is the entire point.

## Test plan

`tests/req109-relocatable-output.test.ts`:

- `test_UAT_FC_REQ-109_relative_asset_urls` — the real in-repo `xgd` site is
  rendered to a temp directory; the fonts and the hero grid appear as
  `url("assets/…")`, neither `index.html` nor `theme.css` carries a
  root-absolute `url()`/`src`/`href`, and the referenced asset ships alongside.
- `test_UAT_FC_REQ-109_absolute_urls_untouched` — `https://…`, protocol-relative
  `//cdn.example.com/…`, `#anchor` and already-relative values emerge
  byte-identical.
- `test_UAT_FC_REQ-109_served_under_path_prefix` — the rendered directory is
  served over loopback from `/site/xgd/draft/deadbeef01/`; every non-fragment,
  non-off-host reference in `index.html` and `theme.css` is resolved the way a
  browser would (against the URL of the document carrying it) and fetched,
  asserting 200. A floor on the number of references checked guards against a
  vacuously-green skip filter.
- `test_UAT_FC_REQ-109_nested_page_fails_loud` — a page slugged `docs/intro`
  makes `renderSite` reject, and no `docs/` directory is written.

Regression scope: full `vitest run` — 932 passed. The 4 remaining failures
(`reconciliation-1c-astro-free-render`, `reconciliation-3probe-gate`,
`reconciliation-3probe-gate-evaluator`, `reconciliation-l1-fold-full-language`)
were verified to fail identically on a clean tree; they pre-date this ticket.
`pnpm -r build` (typecheck) clean.

### Re-baselined expectations

Emitted bytes changed, so nine expectations across eight suites were updated to
the emitted shape. No assertion was weakened — each still pins the same
behaviour (safe-only sink, font-face binding, layer order, anchor retagging,
self-contained reproduction), only the URL shape moved:

`bug23-repro-local-assets` (×2), `req91-l1-pixel-mover-axes`,
`req98-uniform-surface-axes` (×2), `req103-l1-texture`, `req106-l1-links`,
`req108-l1-pointer-accent`, `reconciliation-l1-language` (×2).

### Gate verification

The perceptual and 3-probe gates were **not** affected in practice:

- The 3-probe gate is analytic over the L1 *document* (`evalGeometry`), not over
  emitted URLs, so it never sees the change.
- The capture side resolves `url()` values to absolute URLs in the browser, and
  `1c serve` mounts a snapshot at the root — so `assets/x` and `/assets/x`
  resolve identically there.
- Empirically confirmed: `1c render xgd` + `1c shot xgd` renders with the
  Satoshi/JetBrains-Mono faces loaded and every grid SVG painting.

A full `1c l1-gate` re-run against `gigabytealchemy` was not possible in this
session — the in-repo reference bundle predates multi-state capture and would
need a fresh `1c capture page` against the live site.

## Dependencies

None. Prerequisite for the path-based preview URL used by the R2 artifact store
and the public-site Worker. Relates to [[DOC-12]] (storage model) and [[DOC-2]]
(renderer security policy).