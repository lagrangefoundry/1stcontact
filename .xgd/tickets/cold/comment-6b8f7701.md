---
uid: comment-6b8f7701
id: COMMENT-252
type: comment
title: Comment on request REQ-82
created_by: xgd
created_at: '2026-07-20T20:22:47.201794+00:00'
updated_at: '2026-07-20T20:52:40.464895+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-11efc10f
  kind: chat_transcript
---

<!-- xgd-turn id="2d1e3db9-4fad-4af5-b166-6aa533c1092b-user" -->

<!-- xgd-chat role="user" ts="2026-07-20T20:22:44.594187+00:00" -->
#### You
please free code this ticket

<!-- xgd-turn id="2d1e3db9-4fad-4af5-b166-6aa533c1092b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-20T20:52:40.432709+00:00" -->
#### Claude
I'll start by understanding the ticket scope and the codebase structure. Let me gather context in parallel.

This is a substantial ticket. Let me explore the codebase structure to understand what exists before building.

Let me map the key packages in detail. I'll use parallel exploration agents.

I've launched four exploration agents to map the codebase in parallel. While they work, let me set up task tracking for this multi-phase build.

I've dispatched four parallel exploration agents to map the codebase (site-schema, framework render/modules, the capture/values-diff spine, and the tests + `1c` CLI). This ticket — Phase B1 of the framework pivot — is large, so I want an accurate picture before writing any code.

I'll wait for their findings, then:
1. Confirm the scope with you and populate the ticket body (it already has a good spec from REQ-79)
2. Build the L1 schema + renderer + envelope validator
3. Wire the round-trip gate to the existing capture/values-diff spine
4. Hand-author the one-section hero spike and prove roundtrip / envelope_security / envelope_robustness / cross_browser

Standing by for the agents to report back.

Good — site-schema is Zod-based, and critically the render pipeline + capture/values-diff live in `tools/generate`, not `packages/framework`. Waiting on the other three agents.

Two agents in. Now I understand the current module/dial/render architecture. Waiting on the capture/values-diff spine and the tests + `1c` CLI mapping.

Three agents in. The capture/values-diff spine is well understood — `ValueElement` (~48 axes), the extract script → RawSignals → flattenSignals → diffManifests pipeline, tolerance model, 6 viewports, 3 engines, Playwright driver seam. Waiting on the final agent (tests + `1c` CLI + render.ts).

All four agents have reported. I now have a complete picture:

- **`packages/site-schema`** — Zod schemas + `validateSite`; tests import from `src` directly (vite/astro resolves it, no build needed).
- **`packages/framework`** — Astro module catalog + dial resolvers + `safety.ts` (`isUnsafeUrl`/`assertSafeUrl`/`assertSafeHtml`).
- **`tools/generate`** — the `1c` CLI, capture pipeline, `ValueElement` (~48 axes), `flattenSignals`/`diffManifests`, the conformance harness (`assertModuleConforms`, `evaluateXBrowser`, `engineAvailable`), Playwright driver seam, `RESPONSIVE_VIEWPORTS` (6 widths), 3 engines.
- **Round-trip spine**: render → serve → Playwright capture → extract → `flattenSignals` → `ValueManifest` → `diffManifests`.
- **Spike fixture**: `storage/references/faelan.com/index/` (clean, minimal).

Let me pin down exact signatures and check browser availability before writing code.

All three browser engines (chromium, webkit, firefox) are installed — the real-browser roundtrip and cross-browser UATs will actually execute and give strong evidence. Let me read the conformance harness (the exact render→serve→capture pattern I need to reuse) and the key signatures.

The conformance harness gives me the exact render→serve→capture pattern to reuse. Let me pull the remaining signatures: the serve mechanism, the extract script, and the values-diff exports (`flattenSignals`, `diffManifests`, `ValueManifest`, `RESPONSIVE_VIEWPORTS`).

The fidelity capture path is elsewhere. Let me find how a served render is captured into `RawSignals` (the `driver.query(EXTRACT_SCRIPT)` pattern) — that's the exact code my round-trip gate reuses.

I now have the full capture pattern (`runMultiStateCapture` → per-engine/width manifests, `diffManifests` → report). Two more things to pin down: how `diffManifests` decides which properties to compare (does expected need the property present?), the `Box`/`Viewport`/`DiffOptions` types, and confirm the version-bump script works.

Confirmed the critical behavior: `diffManifests` compares `box` **only when the expected element has one** (line 1821 `if (exp.box && act.box)`), and pairs text elements on normalized text. That lets me assert authored (Type-A) axis identity cleanly without pinning text geometry. Browsers are all installed, the version-bump script works, and I have every type/signature I need.

I have enough to build. Let me set up task tracking and confirm my design decisions, then implement.

I have everything needed. Let me set up task tracking and build.

Now building. First, the L1 schema + envelope validator in site-schema:

Now let me typecheck the schema before proceeding, since the recursive discriminated union is the riskiest part:

Zod v4 needs the getter-based recursion pattern, not manual `ZodType` annotations. Let me fix the node union:

The recursive getters need explicit type annotations. Let me switch to the manual-interface + `z.lazy` + `z.union` pattern (robust for recursion in Zod v4):

site-schema typechecks cleanly. Task 1 done — moving to the renderer.

Now the L1 renderer — the single safe emitter (framework):

Now export the renderer from the framework barrel:

Framework resolves site-schema via its built `dist`. I need to rebuild site-schema so the L1 exports are available:

Rebuilt site-schema. My render.ts errors are gone; there's now a `tokens/css.ts` error that looks unrelated to my change. Let me determine whether it's pre-existing and whether rebuilding site-schema's `dist` touched committed files.

`dist` is gitignored (not tracked) — rebuilding it is local-only and safe. The `tokens/css.ts` error is **pre-existing** latent framework↔schema drift (unmodified by me, and vitest transpiles via esbuild so it never blocks tests). My `render.ts` is clean (no render.ts errors in output). Framework's package exports point at `src`, site-schema's at `dist` — so I'll keep rebuilding site-schema's dist after src changes.

Task 2 done. Now the round-trip gate. Let me confirm the capture exports I need are reachable from `tools/generate`:

All capture exports are reachable from `./cli/capture`. Before writing the gate, let me confirm exactly how `fontFamily` is captured and compared (to avoid a flaky roundtrip assertion):

`fontFamily` is a Type-A axis compared by string equality against the *computed* value (which normalizes to the authored form) — so authoring single tokens like `Georgia`/`Arial` round-trips exactly. Now the round-trip gate:

One error in tools/generate — let me see if it's mine or pre-existing:

No l1/ errors — the single remaining error is the pre-existing `tokens/css.ts` drift (unmodified by me, doesn't block vitest). Task 3 done. Now the spike + UATs — the real validation.

Let me verify the `X_BROWSER_TOLERANCE` shape and that the helpers are re-exported from `tools/generate/src` before running:

`posPx`, not `positionPx`. Let me fix the test:

Now let me run the deterministic tests first (validator, security, robustness, geometry) — fast, no browser:

The code is correct — the alt payload is fully escaped (`&quot;&gt;&lt;img onerror=alert(1)&gt;`), so it's inert data; my assertion was just too literal. The security property is "no unescaped attribute-breakout." Let me fix the assertion:

`@import` survived inside the quoted font-family string — inert (it's string data), but the sanitizer should be genuinely conservative. Let me tighten `cssFontFamily` to keep only real font-name characters:

All 5 deterministic UATs pass. Now the real-browser tests (roundtrip + cross-browser) — this runs actual Chromium/WebKit/Firefox captures, so it'll take a bit:

7 of 8 pass — including the **roundtrip Type-A identity at all 6 widths** and geometry-grows tests. The cross-browser failure is because `runMultiStateCapture` calls `actuate()` (a Chromium-only CDP path) even for the `rest` state on WebKit/Firefox. I don't need actuation for `rest`-only capture — let me capture directly per engine, avoiding that path entirely:

All 8 UATs pass — roundtrip at all 6 widths, cross-browser across 3 engines, and both envelope probes. Task 4 done. Now the regression scope to confirm my additive changes didn't break anything:

Regression clean (33 passed). Let me confirm the shared barrel exports didn't collide and the values-diff/conformance consumers still resolve:

No collisions, spine consumers all green. Task 4 complete. Now docs, version bump, and commit (Task 5). First the version bump:

Version bumped to `0.0.160`. `storage/tmp/` was pre-existing (untracked at session start) — I'll leave it out. Let me stage only the L1 code + version bump and commit:

Committed as `b5138953`. Now the free-coded gate (validates SHA, version bump, uniqueness):

Moved to `free_coded`. Now set story points and update the ticket body to reflect what was actually built (preserving the original spec):

Now the docs. Let me check the existing doc tickets (does DOC-2 already exist?):

DOC-2 (Security Policy) already exists. Let me read it before updating (don't overwrite blindly):

DOC-2 is an empty placeholder — I'll write it fresh. Writing the Security Policy grounded on the L1 envelope as built:

Now the two new docs. First, the **L1 Layout Substrate spec**:

Now the **Framework Purpose / Positioning** doc:

All three docs are done (DOC-2 populated, DOC-23 + DOC-24 created). Let me verify the tree is clean and update the ticket's doc-status line to reference the finished docs:

Code tree is clean (only pre-existing `storage/tmp/`). REQ-82 is `free_coded` with the right commit, version, and story points. Let me update the doc-status note now that the docs are done:

REQ-82 is free-coded, proven, and parked at `free_coded`. Here's what landed.

## What I built — L1 layout substrate + safety envelope (Phase B1)

A new low-level, CSS-faithful layout substrate proven **safe / robust / cross-browser by construction** on a hand-authored hero spike, across three packages:

- **`packages/site-schema/src/l1/`** — the typed element tree (Zod): `container` / `box` / `text` / `image` / `slot` nodes carrying captured axes as literals, per-viewport **geometry keyframes** with per-segment `interpolate|snap`, and structure primitives (sizing `fixed|fluid|hug`, distribution, align, visibility). Plus the **envelope validator** `validateL1` — hex-only colours, strict objects (no freeform CSS/HTML/JS), numeric ranges, URL-scheme allowlist, depth (≤32) and node-count (≤2000) caps.
- **`packages/framework/src/l1/render.ts`** — `renderL1Document`/`renderL1Page`, the **one safe emitter** (escaped text, sanitised font-family, numeric lengths, unsafe src dropped). Geometry keyframes compile to media-queried `calc()`/snap.
- **`tools/generate/src/l1/roundtrip.ts`** — the round-trip gate wired to the existing capture/values-diff spine (`serveL1` → per-engine capture → `diffManifests`), measuring `capture(render(L1)) ≈ L1`.

## Evidence — all 8 UATs green (incl. real Chromium/WebKit/Firefox)

| AC | UAT | Result |
|---|---|---|
| roundtrip | authored axes reproduced at all 6 widths; geometry grows/interpolates | ✅ real Chromium |
| envelope_security | injection in text/url/colour/font inert; validator rejects unsafe | ✅ deterministic |
| envelope_robustness | out-of-range / oversize / freeform rejected | ✅ deterministic |
| cross_browser | no divergence across 3 engines | ✅ real chromium/webkit/firefox |

Regression scope (schema, framework modules, values-diff, conformance) all pass — the changes are additive.

## Free-coding lifecycle
- Commit `b5138953` `[FREE-CODED]`, version bump `0.0.159 → 0.0.160`
- **REQ-82 at `free_coded`**, `fields.commits=[b5138953]`, `story_points=5`, body updated to reflect the implementation
- Docs written: **DOC-2** (Security Policy), **DOC-23** (L1 Layout Substrate spec), **DOC-24** (Framework Purpose / Positioning)

## Two things worth flagging
- **Roundtrip asserts identity on authored (Type-A) axes** (colour/font/size/weight/align reproduce *exactly* at all 6 widths); emergent geometry is *measured*, not pinned — consistent with the codebase's A/B model. Geometry fidelity is proven separately (keyframe endpoints ±2px + monotonic growth + deterministic media-query compilation).
- **Pre-existing, out-of-scope:** `packages/framework/src/tokens/css.ts` has a latent type-drift (responsive subScales vs `generateThemeCss`) that surfaces under `tsc` once site-schema's `dist` is rebuilt. It's unrelated to L1, doesn't affect vitest, and I left it untouched.

It's parked at `free_coded` for you to validate. When you're ready, promoting to `ready_to_reconcile` kicks off reconciliation (the `test_UAT_FC_REQ-82_*` names get folded into ACs). Want me to start Phase B2 (capture→L1 fold + structural-hint extractor, REQ-83) or hold here?

<!-- xgd-chat-end -->