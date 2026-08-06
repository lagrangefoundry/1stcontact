---
uid: bundle-0e41ff44
id: BUNDLE-12
type: bundle
title: REQ-108 + REQ-109 + REQ-110 + REQ-111 + REQ-113 + 1 more
created_by: xgd
created_at: '2026-08-06T04:56:48.616857+00:00'
updated_at: '2026-08-06T17:56:12.217263+00:00'
completed_at: null
last_field_updated: status
status: abandoned
fields:
  commits:
  - working_sha: e1d1f75cedc0e2da5ca0dc5385620e1a1894e374
    reconcile_sha: null
    main_sha: null
  - working_sha: e876c8be56841e76f9b1ea80e5d4e65b46b6acaa
    reconcile_sha: null
    main_sha: null
  - working_sha: dd8e9298797c9d858a5619ac56940fde778956d0
    reconcile_sha: null
    main_sha: null
  - working_sha: 65308aa54a5fc0a4a99caf585dbc2be95c9bf033
    reconcile_sha: null
    main_sha: null
  - working_sha: 4dbdd08dfa07174c4eff0594b44e295f3a977993
    reconcile_sha: null
    main_sha: null
  - working_sha: 106449e0ccc26b1b1fa2e0e529e193f2b7d90396
    reconcile_sha: null
    main_sha: null
  - working_sha: e045ea6cf6c6663068ab155694842f63b72c1e6f
    reconcile_sha: null
    main_sha: null
  - working_sha: 5413d27f5eecb5e7800cacf7fcd699c2b2f6c336
    reconcile_sha: null
    main_sha: null
  - working_sha: 6d94d584e1428b41e0d13f2790e773a2e72d8326
    reconcile_sha: null
    main_sha: null
  - working_sha: de4090ff226e69d6e57757d3481ab92673e0c9a9
    reconcile_sha: null
    main_sha: null
  - working_sha: 573764b1bde34913f0548c0c117a662d385bed38
    reconcile_sha: null
    main_sha: null
  auto_merge_back: true
  priority: medium
---

# Bundle

This ticket bundles the following source tickets:


---

## REQ-108: L1: pointer-reactive texture accent (cursor lights the grid teal-petrol on xgd.dev)

## What the user sees

On xgd.dev, moving the mouse across a band that paints a grid texture lights the
grid lines **teal-petrol** inside a rough, roughly-circular region ~190px across,
centred on the cursor. The region is **stable while the pointer is still** and its
**edges deform as the pointer moves** — the "leaves appearing on the digital trees"
effect from sycamore.so.

It applies to six bands — the three that paint a visible grid:
- `#hero`, the perspective grid, drawn by an SVG asset (`xgd-grid-hero.svg`);
- `#how` ("How it works") and `#contract` ("The contract"), the echo grids, also
  assets (`xgd-echo-1.svg` / `xgd-echo-3.svg`, stroked at 0.17).

…and the three that carry an **invisible grid**: `#problem` ("The problem"),
`#papers` ("Proof") and `#close` ("Evidence, not promises").

`#problem` and `#close` originally carried a full-bleed `pattern` at `#8b5c2a1a`.
**The operator asked for those grids to be removed** — they were never meant to be
noticed, and the accent was the first thing that drew the eye to them. All three
now run a `pattern` at `#8b5c2a00` (fully transparent) that paints nothing, while
the accent redraws that same pattern in teal. So the grid exists ONLY under the
cursor: each band is flat cream at rest (0 of 4080 sampled edge pixels differ from
its fill) and lights 1032–1621 px under the pointer.

Spacing is **32px**, not the 48px those bands used to carry. With the base
invisible the spacing stops being a design constraint and becomes purely an effect
parameter: at 48px only ~4 lines fall inside the region, which reads as a
crosshair rather than a patch of grid, while 24px was denser than the operator
wanted.

The invisible-grid behaviour falls out of the construction rather than being a
special case — the accent substitutes the colour and keeps the geometry — but
three bands now depend on it, so it is pinned by its own UAT. A renderer that
started skipping zero-alpha pattern layers as an "optimisation" would silently
delete the effect from all three with nothing else failing.

It does **not** apply to the small `xgd-grid-mark.svg` logo marks (nav, footer) —
the axis is opt-in per node, so those simply do not carry it.

**Those grids were pre-existing and were not added by this ticket** — verified
against the commit diff, which adds `pointerAccent` blocks and nothing else.

Nothing else changes: fills, grid colour, spacing and thickness are untouched, and
the accent never paints until a real pointer moves over the page.

## Why free-coded

One typed L1 axis plus a small renderer-owned script, following the shape REQ-100
(scroll reveal) already established. No design document needed.

## Design

**This is an L1 capability, not a behavior module.** It is pure presentation with
no user-facing behaviour and no instance data in JS — exactly REQ-100's case: a
typed value bag the renderer alone knows how to compile, plus one vetted script
identical for every site.

### 1. Schema — a node-level surface axis

`pointerAccent: { color, radiusPx, softnessPx?, roughness? }` (strict), added to
the shared surface-axes group, so any painting kind can carry it. `color` goes
through `l1Color`; `radiusPx`/`softnessPx` are envelope-bounded. It is a **sibling
of `pattern`**, not nested inside it, because the texture it accents may be either
the `pattern` axis or a `backgroundImageUrl` — which is what including the hero
requires.

The **lobe count is a renderer constant, not an author dial**: how many bumps read
as "rough" is a property of the mechanism, and exposing it would let a document
reach into the mask's construction. `roughness` (0 = a plain disc, 1 = maximally
lumpy) is the whole of the dial.

### 2. Renderer — the accent redraws the node's own texture in a second colour

An accented node gets an `::after` overlay (`inset: 0`, `pointer-events: none`,
`z-index: -1`, a selector no author can name), plus `isolation: isolate` on the
node itself so the negative-z overlay paints above the node's *own* background and
below its content, rather than escaping to an ancestor stacking context and
disappearing behind the band. (Verified safe: no node on the page uses `blendMode`,
which is the only thing `isolate` could otherwise perturb.)

`isolation` is emitted **behind the pointer marker**, like every other declaration
the axis adds, so §3's invariant has no exception to whitelist in its test. It
measured 0 pixels of difference on a resting band either way — a stacking context
simply is the kind of thing that can change how a band rasterises, and nothing is
lost by waiting for the pointer.

**The texture and the region take opposite sides of the compositing pair**, chosen
by which side the texture can occupy:

- **`pattern`** → the pattern *paints* (the same `patternLayers` call with one
  colour substituted, so the accent cannot drift from the design it accents) and
  the region is the *mask*.
- **`backgroundImageUrl`** → the asset carries only alpha the renderer cannot
  recolour, so the asset is the *mask* and the region is the *paint*. Masking with
  the asset's own alpha recolours exactly its strokes, with no second asset and no
  colour baked into a file.
- **neither** → nothing is emitted; there is no texture to accent.

Both arrangements are **union-only stacks**, because a background stack and a mask
stack both composite `source-over` by default. So `mask-composite` is not emitted
at all — which also drops the `intersect` / `-webkit-…: source-in` pair and the
browser-support floor that came with it.

### 3. Fail-visible, and round-trip-safe

The overlay rule is gated on a `data-l1-pointer` marker on `<html>` that the script
sets **only on the first real pointermove**, and its opacity reads an inherited
custom property defaulting to 0. So:
- no JS, reduced motion, or a coarse/hoverless pointer (touch) → no marker, the
  rule never matches, the band paints exactly as it does today;
- the headless capture never moves a pointer → the captured page is unchanged and
  the L1 round-trip gate is unaffected.

### 4. The shape: a core plus bumps, and where the randomness lives

**The region is a core disc plus protruding bumps, not a ring of overlapping
discs.** Two earlier cuts unioned N near-concentric circles and varied their radii
— first with one harmonic, then three — and both still read as a circle, because
the boundary of such a union is always the outermost of several arcs of nearly the
same curvature. Rendered on a dense grid it was a disc with a dent, which is what
"way too much like a circle" described.

So: one core disc deliberately well inside the region, plus 7 small bumps pushed
OUT to the boundary at varied angles, distances and radii. The outline bulges to a
bump's reach where one sits and falls back to the core between them — swinging
~0.7R to R — and because it falls back to a *smaller* circle the bays read as
bays. Three harmonics drive the reach, a fourth skews the angular spacing, a fifth
varies each bump's size; nothing repeats around the circle. No bump reaches past
`radiusPx`, so a rougher outline eats inward rather than growing past what the
author asked for. `roughness: 0` collapses the whole construction to a plain disc.

**The edge flicker is genuinely random, and it lives in the script.** Each bump's
radius is scaled by a value that chases a fresh random target every frame, so grid
lines near the boundary drop in and out of the accent colour as the hand moves.
The amplitude is proportional to POINTER SPEED and the scales snap to exactly 1
once it decays — which is how "random" and "stable while the mouse is still"
coexist rather than conflict, and why a still page schedules no frames at all. The
core never flickers: a pulsing middle reads as the whole region breathing rather
than its edge boiling.

Randomness is in the script and NOT in the emitted CSS, deliberately: the
stylesheet stays deterministic, so two renders are byte-identical and a captured
page still reproduces.

The script maintains 7 **lagging cursor trackers**, each easing toward the cursor
with its own constant. The angular offsets, radii and feather live in the CSS
(renderer-emitted from the axis); the script supplies only the trackers, so it
carries **no instance data** — it does not know a radius, a colour or a lobe count.
While the pointer moves the trackers spread and the boundary deforms; when it stops
they converge and the rough shape settles. The rAF loop **stops** when the trackers
arrive, so a still pointer costs no frames — "stable while the mouse is still" met
by not running rather than by damping.

### 5. A faint asset needs more than one mask pass (found empirically)

A mask reads a texture's **alpha**, so an accent drawn through one can never paint
heavier than the texture did — and the hero's grid is stroked at `0.24`. The first
cut measured ~1.5k pixels moving by ~25 levels in a 340² crop: real, and invisible.
So the asset mask layer is **repeated `POINTER_TEXTURE_PASSES` (4) times** and the
copies add (`1-(1-a)^n` → ~0.68), saturating a faint texture toward a full-strength
accent while leaving an already-solid one where it was. A renderer constant for the
same reason the lobe count is; 4 was chosen by rendering 1/2/3/4/6/8 and looking.

### 6. Site edit

`storage/sites/xgd/draft/pages/home.json` — `pointerAccent` on `#hero`, `#how`,
`#contract` (asset grids, colour `#2e86a3`) and on `#problem` / `#papers` /
`#close` (invisible 32px `pattern` grids, colour `#2e86a3a6`). All six:
`radiusPx: 95` (~190px across), `softnessPx: 14`, `roughness: 0.65`.
The feather is tight so the flicker reads as lines dropping in and out rather than
as a soft edge breathing.

The colour differs per band **so the two textures light at the same weight**: the
hero takes `#2e86a3` (its own asset mask attenuates it to ~0.68), the pattern bands
take `#2e86a3a6` (~0.65 explicitly). Full-strength teal on the pattern bands is 10×
the weight of the `#8b5c2a1a` grid it replaces and read electric next to the hero.

## Known limitation (not this ticket)

The hero grid being an **asset at all** is the real gap: a perspective grid is a
design L1 cannot yet express, which is why its accent needs the mask-pass
workaround in §5 while the `pattern` bands need nothing. The architecturally clean
fix is a typed perspective-grid primitive in L1 (per the "close capability gaps in
L1" rule), after which the hero takes the `pattern` branch and §5 can go.

## Test plan

UATs in `tests/req108-l1-pointer-accent.test.ts`, named `test_UAT_FC_REQ-108_*`
(8, all passing):

- a `pattern` + `pointerAccent` node renders an overlay drawing the same grid
  geometry in the accent colour, masked to a pointer-positioned region;
- the asset branch masks the region-coloured paint with the asset (repeated) at the
  base layer's own `cover / center` geometry — the hero case — and neither branch
  emits `mask-composite`;
- the overlay is gated on the script-set marker and a zero-default opacity, so a
  document with the axis and no script renders identically to one without it;
- the script is emitted only when the axis is used and carries no instance value;
- the region is rough deterministically (two renders byte-identical, lobes differ,
  every lobe overlaps the cursor), `roughness: 0` is a plain disc, `softnessPx` is
  the feather;
- a node with the axis but no texture emits no overlay, no class and no script;
- the envelope rejects out-of-range / freeform / non-colour input;
- a document that declares no `pointerAccent` renders exactly as before.

**Resting-page check** — axis-present vs axis-absent, no pointer, with the REQ-100
reveals fully settled: **0 pixels differ on all five bands**. (A first reading of
~5000px was reveal fades caught mid-flight by too short a settle, not the axis; the
same 0 holds with `isolation` gated or ungated.)

**Runtime check** (`bin/verify_req108_pointer.mjs`, throwaway like REQ-100's):
15/15 in a real Chromium — no marker before a pointer moves; the accent paints once
it does; two screenshots 400ms apart byte-identical with the pointer parked and
zero tracker writes; the region deforms while moving (max spread ~120px) and
settles back under 1px; the hero accents; reduced motion changes nothing.

Regression: full suite run — 927 passed, and the 4 failures in
`tests/reconciliation-*` are **pre-existing** (verified against a stashed tree).

## Coverage: the effect can only light lines that exist

Measured per band (share of the sampled edge columns carrying texture):
`#problem` / `#close` 100% (full-bleed `pattern`, now removed), `#hero` 12.9%,
`#contract` 3.1%, `#how` 0.9%. The three surviving bands draw a sparse decorative
motif, not a full-bleed grid, so the accent appears only near those strokes and
does nothing over blank fill. That is the axis behaving correctly — it recolours a
texture — but it means the effect is now much rarer on the page than it was while
the `pattern` bands were in play.

Options, if a fuller effect is wanted: extend the echo assets with more lines (an
asset change), or give a band a `pattern` whose colour is fully transparent
(`#8b5c2a00`) — the base grid then paints nothing and the accent redraws it in
teal, so the grid exists ONLY under the cursor. The second is a one-line site edit
and needs no framework change.

## Bug found and fixed: the accent died after a focus change

Switching to another window and back killed the effect for the rest of the
session. `blur` dimmed the accent (`--l1-pto: 0`), but the only code that restored
it lived inside the one-time `if(!on)` branch that arms the pointer marker — so
the restore ran exactly once ever, on the session's first pointermove. Reproduced
in a real browser against both a synthetic `blur` event and a genuine tab switch:
`--l1-pto` stayed `0` through refocus and every subsequent move.

The fix separates two pieces of state that were conflated: `on` arms the marker
and is never revoked (the CSS gate is what makes the page fail visible), while
`dim` is the reversible visibility the leave/blur handlers toggle. Covered by a
UAT that pins the restore as its own statement outside the arming branch, and by a
focus-loss/return cycle in the runtime harness (now 20/20).


---

## REQ-109: Rendered output is not relocatable: normalise asset URLs to document-relative

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


---

## REQ-110: R2 artifact store + 1c deploy: ship rendered snapshots to Cloudflare

## The gap

Sites exist only on the laptop. `1c render` writes to
`storage/dist/<root>/<slug>/<channel>/` and `1c publish` snapshots `draft/` into
`revisions/NNNN/`, but there is no way to put either where anyone else can see
it. `gigabytealchemy` and `xgd` are close to ready and cannot be shared.

R2 is now enabled on the account and the bucket exists:

```
$ wrangler r2 bucket create 1stcontact-sites
✅ Created bucket '1stcontact-sites' with default storage class of Standard.
```

## Design frame — serving, not storing

This ticket migrates **serving**, not the canonical store. Site definitions stay
canonical on the laptop and authoring is unchanged. Moving canonical storage to
D1 while authoring is local would create a bidirectional sync problem that no
end state has; the store moves when a server-side builder needs to read and
write it, not before ([[REQ-7]], [[DOC-5]]).

What crosses the wire is the artifact [[DOC-12]] already defines: an immutable,
complete snapshot. `source/` is uploaded alongside `out/` so the R2 revision is a
*complete* DOC-12 revision — which makes the eventual D1 migration an import
from R2 rather than a re-derivation from a laptop.

## R2 layout

```
r2://1stcontact-sites/
  sites/<slug>/manifest.json
  sites/<slug>/preview/<sha>/out/       rendered artifact (index.html, theme.css, assets/…)
  sites/<slug>/preview/<sha>/source/    site.json, pages/, assets/  — the DOC-12 snapshot
  sites/<slug>/rev/<NNNN>/out/
  sites/<slug>/rev/<NNNN>/source/
```

```json
{
  "slug": "gigabytealchemy",
  "live": 1,
  "revisions": [{ "id": 1, "publishedAt": "…", "message": "launch", "sha": "…" }],
  "previews": [{ "sha": "a1b2c3d4e5f6", "createdAt": "…", "basedOn": 1 }]
}
```

### Preview snapshots are not revisions

A draft deploy produces an immutable, garbage-collectable **preview snapshot**.
It never enters `history.json` and never mints a revision number, preserving
DOC-12's mutable-draft / immutable-revision split — so previews can be shared
freely without polluting publish history.

### Snapshot id

SHA-256 over a canonical listing of `(relative path, file sha256)` pairs sorted
by path, truncated to **12 hex chars** (48 bits). Content-addressed, so
redeploying identical content is a no-op that returns the same URL.

Accepted v1 trade-off: because the id is derived from content rather than random,
it is *theoretically* computable by someone who can reproduce the exact rendered
bytes. Impractical in practice, and previews are unguessable-URL-private by
deliberate decision (real ACLs arrive with login). If it ever matters, the fix is
a random token in the manifest mapping to the content-addressed key — no layout
change.

## `1c deploy`

```
1c deploy <slug> [--channel draft|published] [--dry-run] [--prune]
```

Renders first, always — there must be no way to ship stale bytes. Output names
each stage explicitly:

```
$ 1c deploy gigabytealchemy
  render     storage/dist/sites/gigabytealchemy/draft      9 files   2.7 MB
  hash       a1b2c3d4e5f6
  upload     preview/a1b2c3d4e5f6/out                      9 files   2.7 MB
  upload     preview/a1b2c3d4e5f6/source                   7 files   340 KB
  manifest   + preview a1b2c3d4e5f6 (basedOn rev 1)

  →  https://1stcontact.io/site/gigabytealchemy/draft/a1b2c3d4e5f6/
```

Unchanged content short-circuits and says so rather than silently re-uploading:

```
  hash       a1b2c3d4e5f6  (already deployed — nothing to upload)
  →  https://1stcontact.io/site/gigabytealchemy/draft/a1b2c3d4e5f6/
```

`--channel published` uploads the current latest revision to `rev/<NNNN>/` and
sets `manifest.live`. It refuses if `history.json` has no revisions, directing
the operator to `1c publish` first — publish mints the revision, deploy ships it.
`--dry-run` prints the full plan and uploads nothing. `--prune` deletes preview
snapshots not referenced by the manifest, reporting each deletion.

## Upload mechanism

Shell out to `wrangler r2 object put` per file. Sites are 4–13 files, so this is
a few seconds and **zero new dependencies**. The S3 API via `@aws-sdk/client-s3`
would need a separate R2 access key and a dependency install; not warranted at
this scale.

## Manifest concurrency

Read-modify-write on `manifest.json` uses R2's conditional write (`onlyIf` etag)
so a lost update fails loudly rather than silently clobbering. Single-operator
today; D1 removes the concern in phase 2.

## Non-goals

- No D1, no canonical-store move.
- No custom domains. `gigabytealchemy.ai` is live with the original site being
  reproduced; this ticket touches only `1stcontact.io`, so there is zero exposure.
- No subdomain routing (`<slug>.1stcontact.io`) — later, additive.

## Acceptance

- `test_UAT_FC_<TICKET>_deploy_draft_uploads_snapshot` — deploy places `out/` and
  `source/` under `preview/<sha>/` and appends a manifest preview entry.
- `test_UAT_FC_<TICKET>_deploy_is_content_addressed` — identical content twice
  yields one upload and the same URL; changed content yields a new `<sha>` and
  leaves the prior snapshot intact and readable.
- `test_UAT_FC_<TICKET>_deploy_renders_before_upload` — a stale `dist/` is
  re-rendered; uploaded bytes match the current definition.
- `test_UAT_FC_<TICKET>_deploy_published_requires_revision` — `--channel published`
  on a site with empty `history.json` fails with a message naming `1c publish`.
- `test_UAT_FC_<TICKET>_deploy_output_names_each_stage` — output contains a
  labelled line per stage and terminates in the shareable URL.
- `test_UAT_FC_<TICKET>_dry_run_uploads_nothing` — `--dry-run` mutates no R2 state.
- `test_UAT_FC_<TICKET>_prune_removes_unreferenced` — `--prune` deletes only
  snapshots absent from the manifest.

R2 is faked at the upload-boundary seam in tests; no network in the suite.

## Dependencies

Needs the relocatable-output ticket for the path-based URL to resolve. Pairs with
the public-site Worker ticket, which consumes this layout — the two can be built
in parallel against this spec.

-


---

## REQ-111: public-site Worker: serve draft previews and published sites from R2 (SiteStore seam)

## The gap

`apps/public-site/src/index.ts` is a stub:

```ts
export default {
  async fetch(): Promise<Response> {
    return new Response('Hello from 1stcontact.io', …)
  },
} satisfies ExportedHandler
```

Routes for the apex and `*.1stcontact.io` are already declared in
`wrangler.toml`, but `1stcontact.io` has no proxied DNS record, so nothing
resolves. Nothing has ever been served.

## Scope

Make `public-site` serve draft previews and published sites out of the R2 layout
written by `1c deploy`, behind a **`SiteStore` seam** that phase 2 swaps for D1
without touching anything else.

## Route grammar

```
/site/<slug>/draft/<sha>/            →  preview/<sha>/out/index.html
/site/<slug>/draft/<sha>/<path…>     →  preview/<sha>/out/<path>
/site/<slug>/                        →  rev/<live>/out/index.html
/site/<slug>/<path…>                 →  rev/<live>/out/<path>
/                                    →  reserved for the apex marketing site (later)
```

`draft` is a reserved first path segment within a site: a published page may not
be named `draft`. Validate this at deploy time so the collision is impossible
rather than merely unlikely.

### Trailing slash is load-bearing

With document-relative asset URLs, `/site/xgd/draft/<sha>` (no trailing slash)
resolves `assets/x.svg` to `/site/xgd/draft/assets/x.svg` — one level too high.
The Worker **must** 301 the bare form to the trailing-slash form. This is a
correctness requirement, not a nicety.

## The seam

```ts
interface SiteStore {
  resolve(slug: string, channel: 'draft' | 'published', ref?: string): Promise<string | null>  // → R2 prefix
  live(slug: string): Promise<number | null>
}
```

Phase 1 implementation reads `sites/<slug>/manifest.json`. Phase 2 replaces the
implementation with D1 queries against `sites` / `revisions` / `pages`
([[REQ-7]]). Nothing else in the Worker knows where the truth lives.

## Response behaviour

| Concern | Rule |
|---|---|
| Content type | By extension: html, css, js, svg, woff2, png, jpg, webp, json, ico, txt. Unknown → `application/octet-stream`. |
| SHA-addressed caching | `Cache-Control: public, max-age=31536000, immutable` — the bytes can never change |
| Published caching | `Cache-Control: public, max-age=60` (see below) |
| Draft indexing | `X-Robots-Tag: noindex` |
| Missing object | 404 with a plain body, never a directory listing |
| Unknown slug / no live revision | 404, no distinction leaked between the two |

Repeat hits go through the Cache API so warm requests do not touch R2.

### Known wart: published-channel TTL

Published URLs are not revision-scoped, so `/site/<slug>/assets/x.svg` cannot be
cached immutably. Deploying a new revision therefore has a ≤60s window where a
client can mix new HTML with cached old CSS. Accepted for v1; the fix is
revision-scoped published asset paths or a purge-on-deploy hook, both additive.

## Configuration

- Add the R2 binding to `apps/public-site/wrangler.toml`
  (`bucket_name = "1stcontact-sites"`).
- Replace the apex `routes` entry with `custom_domain = true` so wrangler
  provisions the DNS record and certificate itself — the zone currently has no
  proxied record and this avoids a manual dashboard step.
- Leave the `*.1stcontact.io` wildcard route declared but unused; subdomain
  serving is a later, additive step.

## Non-goals

- No authentication. Draft previews are unguessable-URL-private by deliberate
  decision — real ACLs arrive with login, and gating publication on access
  control is not worth it for v1. [[DOC-12]] needs its "author only (private)"
  wording amended to match.
- No apex marketing site yet; `/` may stay a holding response so nothing becomes
  public before the operator chooses.
- No custom domains, no subdomain routing, no D1.

## Acceptance

- `test_UAT_FC_<TICKET>_serves_preview_snapshot` — a request under
  `/site/<slug>/draft/<sha>/` returns `index.html` from the matching R2 prefix,
  and every asset it references resolves 200.
- `test_UAT_FC_<TICKET>_bare_path_redirects_to_trailing_slash` — 301, and assets
  resolve correctly after following it.
- `test_UAT_FC_<TICKET>_serves_live_published_revision` — `/site/<slug>/` serves
  the revision named by `manifest.live`; bumping `live` changes what is served.
- `test_UAT_FC_<TICKET>_immutable_cache_on_sha_paths` — SHA-addressed responses
  carry `immutable`; published responses carry the short TTL.
- `test_UAT_FC_<TICKET>_draft_is_noindex` — draft responses carry `X-Robots-Tag`,
  published responses do not.
- `test_UAT_FC_<TICKET>_unknown_slug_and_missing_object_404` — no directory
  listing, no leak distinguishing unknown slug from unpublished site.
- `test_UAT_FC_<TICKET>_content_types` — each supported extension maps correctly.

Route parsing, `SiteStore`, and content-type mapping are pure functions, unit
tested with plain vitest against a faked R2 binding — **no new dependencies**. A
proper Workers test pool (`@cloudflare/vitest-pool-workers`) would need an
install and is not required here; end-to-end verification is a scripted
`wrangler dev` smoke check.

## Dependencies

Consumes the R2 layout from the `1c deploy` ticket. Needs the relocatable-output
ticket, without which assets 404 under the path prefix. Closes the open question
in [[DOC-7]] §11.3: R2 + Worker rather than Workers Static Assets, because Static
Assets binds artifacts to a Worker *deployment* — every publish and every preview
link would require a deploy, which does not go multi-tenant. Matches [[DOC-5]] §5
(R2 for static build artifacts).


---

## As built (2026-07-30)

Implemented as specified. Files: `apps/public-site/src/routes.ts` (pure grammar),
`content-type.ts` (pure extension map), `site-store.ts` (`SiteStore` +
`R2SiteStore`), `index.ts` (handler); R2 binding `SITES` in
`apps/public-site/wrangler.toml`; the deploy-time reserved-segment gate as
`assertNoReservedSegment` in `tools/generate/src/deploy/content.ts`, called from
`cmdDeploy` before upload.

### Decisions taken during implementation

- **The manifest is the authority on what is servable, and untrusted input never
  reaches a key.** A draft id from the URL is *looked up* in `manifest.previews`
  and the prefix is then built from the manifest's own value; the published
  prefix is built from `manifest.live`, which the URL cannot influence. A
  side-effect worth having: an orphaned snapshot (interrupted upload, or one
  `--prune` has unlinked but not swept) is unreachable rather than quietly live.

- **Dot-segment traversal never reaches the parser.** WHATWG URL normalises both
  `..` and its `%2e%2e` spelling before dispatch, so those attempts resolve to
  some other harmless route. `%2f` is *not* normalised and does reach the parser,
  which refuses it. The parser rejects `.`/`..`/embedded separators anyway —
  defence in depth, exercised directly rather than through a `Request`.

- **404s are not cached.** A 404 is the answer for both "never existed" and "not
  deployed yet"; caching the second would make a fresh deploy look broken.

- **`X-Robots-Tag: noindex` on every draft-channel response**, not only the
  successful ones — including the 301 and the 404. A crawler that reached a
  preview should be told so whatever it found there.

- **Beyond the stated scope, all small and all in the same direction**: `HEAD` is
  served (via `bucket.head`, no body); anything other than `GET`/`HEAD` is a
  `405` with `Allow`, since the server is read-only; the trailing-slash 301
  preserves the query string; and `/site/<slug>` redirects on the same rule as
  the draft form.

- **`test_UAT_FC_REQ-1_public_site_serves_apex_and_wildcard_routes` was updated**,
  not left to fail: this ticket deliberately replaces the apex zone route with
  `custom_domain = true`, which supersedes the assertion that test pinned. The
  wildcard-route half is unchanged.

### Not done

The deploy-time `draft` guard is a standing invariant rather than a currently
reachable one: `renderSite` emits pages flat and copies assets into `assets/`, so
no site definition can presently produce a top-level `draft` entry. The gate is
tested on a synthetic snapshot listing at its own entry point, and will start
earning its keep the day rendered output gains nesting.

The `wrangler dev` smoke check named under Acceptance was not run — it needs the
real bucket and a deploy. The UATs drive the Worker's actual `fetch` entry point
with the bucket seeded by a real `1c deploy`, so the serving path is covered; what
remains unverified is the wiring to a live R2 bucket and the apex custom domain.
`wrangler deploy --env production --dry-run` passes and reports the `SITES`
binding.

### Evidence

`tests/req111-public-site-serving.test.ts` — 10 UATs, one per acceptance bullet
plus the route grammar, the reserved segment, and warm-cache behaviour. Bucket
faked at the R2 binding (the one boundary we do not own); route grammar,
`SiteStore`, header policy and cache are real. Suites run green:
req111, req110, req109, public-site, control-app, deploy-workflow, generate,
naming, ci-workflow. `pnpm -r build` clean.


---

## REQ-113: 1c serve: extensionless URLs 404 (preview disagrees with Cloudflare Pages)

## Scope

`1c serve` cannot serve a multi-page site at its natural URLs. A page authored as slug
`whitepapers` renders to `whitepapers.html` and is reachable **only** at `/whitepapers.html`;
`/whitepapers` returns 404.

`serveRequest` (`tools/generate/src/cli/serve.ts:58`) resolves exactly two shapes: a path ending in
`/` gets `index.html` appended, and a directory gets `index.html` joined. Anything else must match
a file on disk byte for byte. There is no extensionless fallback.

## Why it matters

**The preview server disagrees with production.** Cloudflare Pages — the deployment target — serves
`whitepapers.html` at `/whitepapers` automatically. So the clean URL is correct in production and
broken in preview, which is the worst arrangement: the author writes the right link, sees it 404
locally, and "fixes" it by baking `.html` into the site. That is exactly what happened on xgd.dev
(CHAT-12) and the `.html` is now in the authored nav.

This is the same class of defect as the asset-cache saga in REQ-95: the preview environment and the
viewer's environment disagree, and the author trusts the one in front of them.

## Behaviour

When the requested path does not resolve to a file or directory, and has no extension, try
`<path>.html` before returning 404.

- `/whitepapers` → serves `whitepapers.html`
- `/whitepapers.html` → unchanged, still serves directly
- `/` and `/sub/` → unchanged, still resolve to `index.html`
- `/assets/logo.svg` → unchanged; has an extension, so no fallback is attempted
- `/nope` → still 404 when `nope.html` does not exist
- Path confinement to `rootDir` is unchanged and must still reject traversal — the fallback is
  applied to the already-confined absolute path, never to raw input.

## Acceptance criteria

- **AC1** — a request for an extensionless path resolves to the sibling `.html` file when one
  exists.
- **AC2** — existing resolution is unaffected: exact files, directory requests, and trailing-slash
  requests all behave as before.
- **AC3** — a path with an extension never triggers the fallback, so a genuinely missing asset
  still 404s rather than silently serving HTML.
- **AC4** — traversal is still rejected; the fallback cannot reach outside `rootDir`.

## Out of scope

The authored `.html` links on xgd.dev stay until this lands, then get cleaned up.


---

## Scope extension (2026-07-30) — the production half was never fixed

The original ticket rested on a premise that is **false**:

> Cloudflare Pages — the deployment target — serves `whitepapers.html` at `/whitepapers`
> automatically. So the clean URL is correct in production and broken in preview.

There is no Cloudflare Pages anywhere in the serving path. `apps/public-site/wrangler.toml` binds
the **`public-site` Worker** (REQ-111) to both `1stcontact.io` and `*.1stcontact.io/*`, and it
serves every byte out of R2. `parseRoute` passes the path tail straight through as an object key
(`routes.ts:120`, `routes.ts:130`), and a missing key is a flat 404 (`index.ts:134`).

So the actual state is the **inverse** of what the ticket described: the clean URL now works in
preview and 404s in production. The ticket's stated goal — the preview server and the viewer's
environment agree on the URL the author writes — was never reached, because only one of the two
environments was changed.

Surfaced by BUG-30: xgd.dev's home page links `/whitepapers`, which relativizes to `whitepapers`
(correctly), and `test_UAT_FC_REQ-109_served_under_path_prefix` went red against a server modelled
on the real Worker.

### Additional behaviour — the Worker gains the same mapping

When a snapshot object does not exist, and the requested path has no extension, try `<path>.html`
before answering 404. Exact keys always win, so nothing that resolves today changes.

**The trailing slash must NOT be eligible**, and this is load-bearing rather than tidiness. Pages
reference their assets document-relatively (REQ-109), so the directory of the request URL is what
every `theme.css` and `./#frag` resolves against:

- `/site/acme/draft/<sha>/whitepapers` -> directory is `.../<sha>/` -> `theme.css` resolves correctly.
- `/site/acme/draft/<sha>/whitepapers/` -> directory is `.../whitepapers/` -> every asset resolves
  one level too low and the page loads unstyled.

That is the same failure the `redirect` route already exists to prevent for the snapshot root. A
trailing-slash path therefore keeps its current behaviour (404 unless a real object matches).

Eligibility is a pure function of the pathname — no trailing slash, and the last segment contains
no `.` — so it stays in `parseRoute` and remains testable without a bucket, per the module's
existing design note. Only the *lookup* of the fallback key happens in the request path.

### Additional acceptance criteria

- **AC5** — the Worker serves `<slug>.html` for an extensionless path, on both the draft and the
  published channel, for `GET` and `HEAD`.
- **AC6** — `content-type` is derived from the key actually served, not the requested path, so a
  fallback hit returns `text/html` rather than a guess from an extensionless name.
- **AC7** — an exact object still wins over the fallback, and a path carrying an extension never
  triggers it (a missing `.svg` still 404s rather than silently returning HTML).
- **AC8** — a trailing-slash path is never eligible, so no URL can serve a page from a directory
  its relative asset references would resolve against incorrectly (REQ-109).
- **AC9** — the route grammar's existing guards are unchanged: traversal, percent-encoding and slug
  validation all still reject before any fallback is considered.


### Resolution of the extension (2026-07-30)

Landed in commit `f782ae74a3`, version `0.1.10`.

- `apps/public-site/src/routes.ts` — `htmlFallbackFor(path, trailingSlash)` decides eligibility as
  a pure function of the URL and hangs the candidate key on the `asset` route as `htmlFallback`.
  Only the last segment is examined for a `.`, so `v1.2/page` stays eligible.
- `apps/public-site/src/index.ts` — `serve` walks `[path, htmlFallback]` in order for both `GET`
  and `HEAD`, setting `content-type` from the key that answered.

`tests/req113-worker-extensionless-urls.test.ts` — 6 UATs driving the Worker's real entry point
over bytes a real `1c deploy` wrote, on a genuinely two-page site:

| UAT | Covers |
|---|---|
| `test_UAT_FC_REQ-113_worker_serves_extensionless_draft_page` | AC5, AC6 |
| `test_UAT_FC_REQ-113_worker_serves_extensionless_published_page` | AC5 (published channel) |
| `test_UAT_FC_REQ-113_worker_head_matches_get` | AC5 (HEAD branch) |
| `test_UAT_FC_REQ-113_exact_keys_win_and_extensions_never_fall_back` | AC7 |
| `test_UAT_FC_REQ-113_trailing_slash_is_never_eligible` | AC8 |
| `test_UAT_FC_REQ-113_fallback_eligibility_is_a_pure_url_rule` | AC9 |

Verified RED: with the two source files stashed, 5 of the 6 fail and the survivor is exactly the
AC7 regression-guard — so they discriminate rather than rubber-stamp.

`tests/req109-relocatable-output.test.ts` also updated: its in-test server now models the same
mapping. It had gone red not as a stale fixture but because it resolved strictly *less* than
production does, which was the honest signal that this half of the ticket was missing.

`tsc --noEmit` clean for `apps/public-site`. Full suite 965 passed / 4 failed, all 4 pre-existing
and unrelated (reconciliation capture fixtures).

### Follow-up now unblocked

The "Out of scope" note above — xgd.dev's authored `.html` links — can now be cleaned up, together
with BUG-30's `/index.html#how` workaround, since both environments finally agree. Not done here:
the xgd page JSON is uncommitted in-flight authoring.


---

## BUG-30: relativizeUrl turns /#frag into a same-page anchor, breaking cross-page links

## Symptom

A root-relative link carrying a fragment is rewritten into a same-page fragment, so cross-page
anchor navigation silently points at the wrong document.

Authored `/#how` on `/whitepapers` renders as `href="#how"` — "the `how` anchor on *this* page"
rather than on the site root. The anchor does not exist on that page, so the link does nothing.

Found authoring xgd.dev's second page (CHAT-12). **It is undetectable on a single-page site**,
where `#how` and `/#how` resolve identically — which is why it has survived.

## Cause

`relativizeUrl` (`packages/framework/src/l1/render.ts:115`), added by REQ-109 to make a rendered
snapshot relocatable:

```ts
function relativizeUrl(v: string): string {
  if (!v.startsWith('/') || v.startsWith('//')) return v
  return v.slice(1) || './'
}
```

`slice(1)` is right for `/assets/x.svg` → `assets/x.svg`. It is wrong for `/#how` → `#how`, because
dropping the slash changes the *base* the fragment resolves against, not merely the path shape.

The function's own docstring already contains the argument against its behaviour. On the bare-`/`
case it explains that `''` would resolve to the current *page*, "which is a different target once
the page is not `index.html`" — and returns `./` for exactly that reason. `/#frag` has the same
defect and did not get the same treatment.

## Suggested fix

Treat a remainder that begins with `#` the same way the bare-slash case is already treated:

```ts
const rest = v.slice(1)
if (rest === '' || rest.startsWith('#')) return `./${rest}`
return rest
```

`/#how` → `./#how`, which resolves against the snapshot directory (i.e. `index.html`) from any
page. Relocatability is preserved — this stays document-relative, no leading slash reintroduced.

## Please check the rest of the sink while here

REQ-109's relativization is applied at more than one sink (`render.ts:1611` node links,
`render.ts:1765` image `src`, `render.ts:138` CSS `url()`). This ticket is the fragment case, but
the broader question is worth answering once rather than per-symptom:

- **Query strings.** `/x.svg?v=3` → `x.svg?v=3` is fine, but confirm nothing else depends on the
  leading slash. The site currently uses `?v=` cache-busting on grid assets.
- **The flat-snapshot invariant.** The docstring says dropping the slash "is only correct because
  every page sits FLAT at the snapshot root; `renderSite` asserts that invariant." Now that sites
  genuinely have more than one page, verify that assertion still holds and still fires — a nested
  page would make every rewritten URL wrong at once.
- **A page that is not `index.html`.** All of the above reasoning is about relative bases, and
  every case changes meaning once the current document is not the root. That condition was
  unreachable until xgd.dev grew a second page, so none of it has been exercised.

## Acceptance criteria

- **AC1** — `/#frag` renders as a link that resolves to the site root page's fragment from any
  page in the snapshot, not the current page's.
- **AC2** — asset relativization is unchanged: `/assets/x.svg` still emits `assets/x.svg`, and the
  snapshot still resolves correctly when served from a path prefix.
- **AC3** — the `//host` protocol-relative guard still holds; no leading-slash reintroduction.
- **AC4** — a UAT covers the two-page case specifically, since the single-page case cannot
  distinguish correct from incorrect behaviour.

## Workaround in place

xgd.dev's whitepapers page authors `/index.html#how` and `/index.html#signup`, which relativize to
`index.html#how` and resolve correctly. Remove once this lands.

-


### Update — the adjacent gap above is now closed

The extensionless-URL disagreement flagged in "NOT fixed here" was folded into **REQ-113**, whose
stated goal (preview and production agree on the URL the author writes) it turned out to be. That
ticket's premise — "Cloudflare Pages is the deployment target" — was false; the `public-site`
Worker serves everything. Fixed in `f782ae74a3` (REQ-113, v0.1.10): the Worker now performs the
same extensionless → `.html` mapping, with a trailing slash deliberately excluded to preserve
REQ-109 relative-asset resolution.

`test_UAT_FC_REQ-109_served_under_path_prefix` is green again.