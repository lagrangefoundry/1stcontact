---
uid: request-11efc10f
id: REQ-82
type: request
title: 'Framework pivot B1: L1 layout substrate + safety envelope (schema, renderer,
  validator)'
created_by: xgd
created_at: '2026-07-20T19:48:21.817249+00:00'
updated_at: '2026-07-22T21:22:12.434890+00:00'
completed_at: '2026-07-22T21:22:12.434890+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  commits:
  - working_sha: b51389536da3ef8bf91bbd1479a6deee560a36d7
    reconcile_sha: null
    main_sha: null
  version: 0.0.160
  story_points: 5
  bundled_in: bundle-31e474b9
---

Part of the framework pivot — see **REQ-79 (request-87b26bca)** for the full architecture decision, plan, and design (D1–D6).

## Goal
Build the **L1 low-level layout substrate** and prove it is safe / robust / cross-browser **by construction**, on a hand-authored one-section spike.

## Behaviour
- **L1 schema** (site-schema): a typed element tree — box / text / image / slot leaves carrying the ~48 captured axes as literals; geometry as **per-viewport keyframes + per-segment `interpolate|snap` flags**; structure primitives (containers `stack|row|grid`; per-axis sizing `fixed|fluid|min/max`; distribution; visibility) that capture leaves empty and the AI fills.
- **L1 renderer**: L1 tree → HTML/CSS. Compiles geometry keyframes → media-queried `calc()`/snap; text height natural, `y` from flow; the **only** emitter (security by construction).
- **Envelope validator**: typed axes, value ranges, feature allowlist, depth/count caps; **no freeform CSS/HTML/JS strings**.
- **Round-trip + envelope gate** wired to the existing capture / values-diff spine.
- **Spike**: hand-author one captured section (e.g. a hero) as L1; render; prove round-trip ≈ oracle at the 6 captured widths, validator passes, and 3-engine render shows no hang/divergence.

## Acceptance (UAT — name tests `test_UAT_FC_<this REQ id>_*`)
- `roundtrip`: hand-authored L1 hero renders within tolerance of the oracle ladder at all captured widths.
- `envelope_security`: injection payloads in text/url fields are inert (no script/CSS execution).
- `envelope_robustness`: out-of-range / oversize inputs are rejected by the validator.
- `cross_browser`: the spike renders within tolerance across chromium / webkit / firefox.

## Docs (same session)
- New: **L1 Layout Substrate spec**; **Framework Purpose / Positioning**.
- Write **DOC-2** (Security Policy): structured-only + validated invariant as a property of L1.

Note: finalise the full L1 schema **grounded on the spike** (REQ-79 D1/D2 is the input, not a frozen spec).

---

## Implementation (as built — 2026-07-20, free-coded)

Commit `b5138953` (version `0.0.160`). All four acceptance probes pass, including the real 3-engine (chromium/webkit/firefox) tests.

### Where the code lives
- **`packages/site-schema/src/l1/`** — the L1 schema (`schema.ts`, Zod), inferred types (`types.ts`), and the **envelope validator** (`validate.ts` → `validateL1`, `isSafeUrl`, `L1_ENVELOPE`). Exported from the site-schema barrel.
  - Nodes are a discriminated union on `kind`: `container` (stack|row|grid + gap/distribution/align/sizing), `box`, `text`, `image`, `slot`. Recursive `box`/`container` use the manual-interface + `z.lazy` pattern (Zod v4).
  - Geometry = `{ keyframes: {at,x,y,width,height?}[], segments?: (interpolate|snap)[] }`. Structure primitives: `L1AxisSizing` (`fixed|fluid|hug` + min/max), `distribution`, `align`, `visibility` (from/until px).
  - Envelope: strict objects (no unknown/freeform keys), hex-only colours, finite-number guard, ranges (fontSize 1–400, weight 1–1000, geometry ±100k), URL-scheme allowlist for image `src`, keyframe widths ⊆ document widths + ascending, segments length = keyframes−1, depth cap 32, node-count cap 2000.
- **`packages/framework/src/l1/render.ts`** — `renderL1Document` / `renderL1Page`: the **one safe emitter**. Escaped text, hex-only colours, conservatively-sanitised font-family (real font-name chars only), numeric lengths; unsafe image src dropped. Geometry keyframes compile to a base rule + `@media (min-width:…)` overrides: `interpolate` → fluid `calc()` between the two keyframe values driven by `100vw`; `snap` → hold the lower keyframe. Containers → flex/grid.
- **`tools/generate/src/l1/roundtrip.ts`** — the round-trip gate on the capture/values-diff spine: `serveL1` (loopback), `captureL1` (per-engine/width navigate→extract→`flattenSignals`; rest-only, avoids the Chromium-only CDP actuation path), `expectedTextManifest` (project L1 text leaves → declared Type-A axes), `roundTripReport` (`diffManifests` vs the projection).

### Key design decisions
- **Round-trip identity is asserted on authored (Type-A) axes.** `capture(render(L1))` must reproduce every declared colour / font-family / font-size / weight / text-align / spacing **exactly** at all 6 widths (zero Type-A deltas via `diffManifests`). Emergent geometry (Type-B) is *measured*, not pinned — consistent with the codebase's A/B model. Geometry fidelity is proven separately (keyframe endpoints ±2px + monotonic growth across widths; deterministic media-query compilation).
- **Absolute-base geometry.** The spike uses absolute per-viewport keyframes (the trivial reproduction baseline from REQ-79); the structure primitives exist in the schema for the AI to recover relationships (Phase B2+), but B1 proves the absolute path.
- **UAT split for honest evidence.** Validator + emitter probes are deterministic (run everywhere); roundtrip + cross-browser are real-browser (`it.runIf` engine guards). All engines are installed here, so every probe executed.
- **`slot` is an inert placeholder in B1** — the seam where capability modules mount in Phase D.

### Docs status
The three docs (L1 Layout Substrate spec, Framework Purpose / Positioning, DOC-2 Security Policy) are being authored as doc tickets separately in this session — non-code, no reconcile.

### Out of scope / noted
- Pre-existing latent type drift in `packages/framework/src/tokens/css.ts` (responsive subScales vs `generateThemeCss`) surfaces under `tsc` once site-schema `dist` is rebuilt. Unrelated to L1; not touched here.



**Docs written (2026-07-20):** [[DOC-2]] Security Policy (structured-only + validated invariant as a property of L1); [[DOC-23]] L1 Layout Substrate — the typed element tree; [[DOC-24]] Framework Purpose / Positioning (safety envelope, not aesthetic rails).