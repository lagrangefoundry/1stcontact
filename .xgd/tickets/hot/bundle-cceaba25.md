---
uid: bundle-cceaba25
id: BUNDLE-8
type: bundle
title: BUG-7 + REQ-91 + REQ-89 + REQ-90 + REQ-92 + 5 more
created_by: xgd
created_at: '2026-07-29T03:36:53.658732+00:00'
updated_at: '2026-07-29T06:05:21.512285+00:00'
completed_at: '2026-07-29T06:05:16.439117+00:00'
last_field_updated: result
status: free_and_reconciled
fields:
  commits:
  - working_sha: null
    reconcile_sha: null
    main_sha: b1bd5b6bced41d8c14ac0945e127620fbf747261
  auto_merge_back: true
  priority: medium
  orphan_commits:
  - old_sha: 780e0b9df6644a9824f595289f8fec54763be198
    new_sha: 4020a700bcaf6b7d812af711adfebe3e5f92c5d4
  merged_at_commit: b1bd5b6bced41d8c14ac0945e127620fbf747261
result: pass
---

# Bundle

This ticket bundles the following source tickets:


---

## BUG-7: evaluateLayout row/flow layout assigns full parent width to every child (rows overflow)

Scope under [[request-7ff1bacd]] (REQ-88). **Must land before the folder emits any
row/multi-child structure** (images + containers will), or the analytic
value-render lies about overlap/clip. Gates the folder rebuild.

## Behavior (bug)
In `evaluateLayout`'s flow walk (tools/generate/src/l1/probes.ts) each in-flow
child was given `width: box.width` (the full parent width) and, in the `row`
branch, the cursor advanced by `box.width + gap`. So N row children each took the
full parent width and were placed a full width apart — they spanned N×parentWidth
and overflowed. Column stacking was roughly right; row was wrong. Latent today
only because the folder never emits `row` containers yet.

## Fix (landed)
Split the container flow-walk into a row branch and a stack branch that mirror
the renderer's CSS (`render.ts` container branch):

- **Row** — children sit side by side, each taking its own main-axis width, and
  the cursor advances by that width. Widths come from `rowChildWidths`: a child
  that declares a fixed `sizing.width` takes it (clamped to min/max via
  `fixedWidth`); the remaining children share the leftover extent equally (the
  analytic stand-in for flex-grow / natural width, so a well-formed row tiles its
  parent without overlap or overflow). The row's height is the tallest child
  (cross axis). Fixed widths that genuinely exceed the extent still surface a real
  clip — the fix removes *false* overflow, not real overflow.
- **Stack** (`box` / `stack` container) — unchanged: children fill the width and
  stack vertically. **Grid** is modelled as a stack (envelope-conservative; the
  folder does not emit grid yet).

Kept analytic / browser-free. Removed the dead `maxChildRight` accumulator.

## Test plan
`tests/bug7-row-layout.test.ts` (`test_UAT_FC_BUG-7_*`):
- `row_children_tile_side_by_side` — 3 flex children share the extent (gap-aware),
  laid left→right, no overlap, no overflow.
- `row_offsample_no_false_overflow` — the exact regression: `offSampleProbe` on a
  row is now clean at 500/900px.
- `row_fixed_width_children_placed_by_own_width` — fixed boxes take declared
  widths; the flex child takes the remainder.
- `row_genuine_overflow_still_flagged` — real fixed-width overflow still clips.
- `column_stack_unchanged` — regression guard for vertical stacking.
- `row_matches_browser` — analytic boxes match a real Chromium row fixture within
  tolerance (skipped without a browser engine).


---

## REQ-91: Extend L1 axes to cover captured pixel-movers (surfaces, text treatments, transform/mask/blend, scrim)

Scope under [[request-7ff1bacd]] (REQ-88). Raises L1 **language power** to match
the value-render's sufficient statistic — see [[DOC-27]] (axis iff it moves a
pixel), [[DOC-23]], [[DOC-24]] (safety envelope), [[DOC-2]]. Precondition for the
folder rebuild.

## Behavior (request)
Capture records pixel-movers that L1 has no axis for; the pixel-renderer therefore
cannot emit them. Add each as a **typed axis** emitted through the renderer's safe
sink. Families (capture source → target node):

| Family | Captured (extract.ts) | Target |
|---|---|---|
| text-fill gradient | gradientCss :93 | text |
| text-decoration / text-shadow | textDecoration :83 / textShadow :55 | text |
| small-caps / list-marker | fontVariant :87 / listMarker :89 | text |
| surface gradient / bg-image | surfaceGradientCss :117 / backgroundImage :149 | box |
| box-shadow / border / backdrop | boxShadow :29 / border{Width,Color,Style} :23 / backdropFilter :31 | box |
| blend-mode | blendMode :33 | box/image |
| hero scrim / overlay | band overlay :157 | box |
| transform / mask | transformRotate/Scale :59 / maskEdge :57 | any |

(`objectFit`, `opacity`, `borderRadiusPx`, solid `surfaceFill` already exist —
reuse, don't duplicate.)

## Constraints
- Each axis **co-designed against real gigabytealchemy/joyful captures** — fold a
  real element through it as the design check, so the folder-match step cannot
  surprise us.
- No raw-CSS holes: every axis is typed and numeric/enum/hex, emitted via the safe
  sink (render.ts). Gradients/shadows need a typed structured form, not a passthrough
  string.
- May be split into per-family sub-tickets during implementation.

## Acceptance
Each family renders correctly for a captured element; values-diff on that family
closes; security review confirms no untyped passthrough. Tests named
`test_UAT_FC_<this-ticket>_*`.


---

## Implementation (free-coded — commit d399062f, v0.0.174)

Typed L1 axes added for every listed family, emitted through the renderer's safe
sink (no raw-CSS passthrough). Structured (non-scalar) forms live in
`packages/site-schema/src/l1/schema.ts`:
`l1Gradient` (angle + ≥2 hex stops), `l1Shadow` (offset/blur/spread/hex/inset),
`l1Border` (width/hex/style enum), `l1Mask` (circle|ellipse|feather* + featherPx),
`l1Transform` (rotateDeg/scale), `l1BlendMode` (closed enum), `l1Overlay`.

Axis placement:
- **text** (`l1TextAxesSchema`): `gradientFill` (background-clip:text), `textDecoration`,
  `textShadow`, `fontVariantCaps`, `listMarker`.
- **box** (`l1BoxAxesSchema`): `surfaceGradient`, `backgroundImageUrl` (scheme-checked),
  `overlay` scrim, `border`, `boxShadow`, `backdropBlurPx`, `blendMode`.
- **image** (`l1ImageAxesSchema`): `blendMode`, `border`, `boxShadow`.
- **any node**: `transform`, `mask`.

Renderer (`packages/framework/src/l1/render.ts`): structured emitters re-derive CSS
from numeric/enum/hex fields only; box background composites overlay→gradient→url
as comma layers; text gradient overrides flat colour via `-webkit-text-fill-color`.
Envelope (`validate.ts`): `effectPx`/`transformScale` bounds + URL-allowlist for
`backgroundImageUrl`; strict schema rejects freeform keys.
Fold (`tools/generate/src/l1/fold.ts`): populates the cleanly-structured **text**
families (gradient/decoration/caps/marker) straight from the capture; box/image
folding is deferred to the folder rebuild (REQ-88), and raw-string shadow parsing
(text/box-shadow) likewise.

**Co-designed against real captures**: gigabytealchemy gold→orange wordmark
gradient + #00d492 accent bar + panel gradient; joyful drop shadow; faelan 0.3
hero scrim. Values used verbatim as UAT fixtures.

## Test plan (test_UAT_FC_REQ-91_*, tests/req91-l1-pixel-mover-axes.test.ts)

Deterministic (no browser), 12 UATs:
- validator accepts a doc using every new axis; rejects non-hex stop/border colour,
  unsafe `backgroundImageUrl`, freeform keys, and out-of-range shadow/scale/border.
- renderer emits correct CSS per family (text gradient/decoration/caps/shadow/marker;
  box gradient+overlay layering, border, shadow, backdrop, blend, safe/unsafe bg-url;
  image blend/border/shadow; node transform/mask; identity/no-op omitted).
- no raw CSS escapes the sink (no `</style>`/`@import`/`javascript:`/`expression(`).
- design check: fold the real gigabytealchemy capture → wordmark leaf carries the
  gold→orange `gradientFill` → renders as a `background-clip:text` linear-gradient.

Deferred to REQ-88 (folder rebuild): folding box/image effect families and
raw-string shadow parsing into L1 leaves.


---

## REQ-89: Astro boots on every 1c command — silence 'Missing pages directory: src/pages'

# Astro boots on every `1c` command — silence `Missing pages directory: src/pages`

## Symptom

Every `bin/1c` invocation prints to **stderr**, even commands that never render
(`list`, `repro`, `l1-gate`, `capture`, `values-diff`):

```
16:48:18 [WARN] Missing pages directory: src/pages
16:48:18 [vite] Re-optimizing dependencies because vite config has changed
```

Harmless (stderr only — no effect on stdout, `--json`, exit codes, or the produced
bundle), but noise on every command and misleading (there is no file-based Astro
routing in this CLI).

## Root cause (corrected after investigation)

The original diagnosis (eager module-registry import at CLI-load time) is **not**
the source. The warning is emitted by the **launcher**, `tools/generate/bin/1c.mjs`,
which unconditionally boots an Astro Vite dev server **before any CLI code loads**:

```
getViteConfig({ root, logLevel: 'error' }) → createServer(...) → ssrLoadModule(cli)
```

The launcher needs a Vite+Astro server to transpile the TypeScript CLI and compile
`.astro` module components via `ssrLoadModule`. Astro's Vite plugin scans the CWD
for `src/pages` **during server setup**, doesn't find one, and logs
`[WARN] Missing pages directory` through Astro's own logger. The existing launcher
comment already noted this and redirects stdout→stderr during setup (to keep
`--json` clean) — but never actually suppressed it, so it lands on stderr on every
command. The `logLevel: 'error'` passed to `getViteConfig` gates **Vite's** logger,
not **Astro's**, which is why it had no effect.

(The `[vite] Re-optimizing dependencies` line is transient — it fires only when the
Vite cache is invalidated, not on every run.)

Because the launcher boots Astro before the CLI graph is even imported, no amount of
lazy-import work inside `registry.ts` / `render.ts` can silence the warning. The
launcher is the only place that can.

Separately — and this is the real architectural gap the ticket points at — the
render path **always** constructed an `AstroContainer`, even for a page that is a
pure folded-L1 reproduction (REQ-88). `renderL1Document` is pure string templating
and needs zero Astro; only a **behavior-module** page needs the container.

## Fix (implemented)

1. **Launcher (`tools/generate/bin/1c.mjs`)** — pass `{ logLevel: 'error' }` as the
   **second** argument to `getViteConfig` (the inline *Astro* config), which gates
   Astro's own logger and drops the `Missing pages directory` WARN while still
   surfacing genuine errors. Every command is now quiet at setup.

2. **Render (`tools/generate/src/render/render.ts`)** — make Astro lazy in the
   render path: `astro/container` is now a **dynamic** import and the container is
   created **only** when the site actually has a behavior-module page
   (`pages.some(p => !p.l1 && p.modules.length > 0)`). An L1-only reproduction — and
   the empty starter — render with **zero** Astro container involvement. The
   container is threaded through as `Container | undefined`; the module path guards.

Not done (and why): the originally-proposed lazy module-registry / `getModule`-async
change is unnecessary — it does not silence the launcher warning (the real source)
and would only matter for a plain-Vite loader we are not introducing. Skipped to
keep the change surgical (it would otherwise churn ~8 existing conformance/render
test files for no acceptance benefit).

## Acceptance

- `1c list`, `1c repro`, `1c l1-gate`, `1c capture`, `1c values-diff` (and every
  other command) produce **no** `Missing pages directory` output on stderr.
- Rendering a **behavior-module** site still works — the container is created on
  demand and modules render identically.
- Rendering an **L1-only** site still works and constructs **no** `AstroContainer`.
- Free-coded: `test_UAT_FC_REQ-89_*` covering (a) a module site renders and DOES
  create a container, (b) an L1 site renders and does NOT create a container, and
  (c) the real `1c` binary boots with no `Missing pages directory` on stderr.

## Context

Surfaced during the REQ-88 L1-reproduction-pipeline walkthrough. Split out at the
operator's request so REQ-88 stays scoped to the pipeline itself. Not a blocker — the
warning is cosmetic — but worth closing so the reproduction CLI is quiet.


---

## REQ-90: L1 document-level resource table (font/image handle→substance) + renderer @font-face wiring

Scope under [[request-7ff1bacd]] (REQ-88). Closes the **form hole** in the L1
language — see [[DOC-27]] (handle vs substance), [[DOC-23]] (L1 substrate),
[[DOC-2]] (security). Sequence: after [[bug-5b7153d2]] (B1), part of "language
first".

## Behavior (request)
L1 holds *handles* — `text.axes.fontFamily` (a name), `image.src` (a URL) — but
has no place to bind a handle to its pixel-determining *substance* (the `.woff2`
glyph outlines, the mirrored image bytes). Result: `fontFamily: "Poppins"` renders
as a serif fallback because nothing serves/links the font file. This is a
structural gap, not a missing scalar.

## Scope
- Add a **document-level resource table** to the L1 schema: font faces
  (`family, weight, style → served asset`) and image/media assets.
- Renderer (packages/framework/src/l1/render.ts) emits `@font-face` rules binding
  family→served `.woff2`, through the existing safe sink (URL-scheme allowlist,
  served-asset only — no remote fetch, no raw url()).
- Capture already provides the inputs: `RawFontFace { family, srcUrls, weight }`
  and `fontLoaded` (tools/generate/src/cli/capture/extract.ts:174, :75).
- Fold + repro populate the table and mirror the assets (cmdRepro already copies
  bundle assets; wire them here).

## Design rule
An entry earns its place iff it moves a pixel (DOC-27). Validate against a real
webfont from the gigabytealchemy/joyful captures.

## Acceptance
A captured custom-font site reproduces with the correct face (no serif fallback);
`pixel-render(local) ~~ pixel-render(target)` on glyph shape at sampled widths.
Tests named `test_UAT_FC_<this-ticket>_*`.



## Implementation (free-coded — commit 6cf5f4888d84, v0.0.176)
Closed the form hole: L1 now carries a document-level `resources.fonts` table
(family → served `src`, optional weight/style), the renderer emits `@font-face`
rules through the sole safe sink (name-sanitised family, `isSafeUrl`+escaped url,
derived `format()`, `font-display: swap`), the envelope scheme-checks each font
`src` and bounds its weight, and the fold populates the table from the capture's
mirrored faces — keeping only families a text leaf actually paints. Capture wires
the bundle's theme font substance into the fold. UATs: schema/envelope/render/fold
+ a Chromium end-to-end (joyful Oswald webfont) proving the bound face loads and
paints at a different glyph width than the fallback.


---

## REQ-92: Rebuild foldToL1 to populate the full L1 language (image/box/container + all axes), signalling residuals

Scope under [[request-7ff1bacd]] (REQ-88). The folder is the **narrowest link**;
rebuild it **once** against the completed language (do not build it twice). See
[[DOC-27]], [[DOC-21]] (growth loop).

## Dependencies (do these first)
- [[bug-5b7153d2]] (B1) — trustworthy fidelity/idempotency measurement.
- The language-form ticket (font/asset resource table).
- The language-power ticket (pixel-mover axes).
- [[bug-d18ad577]] (B3) — analytic row/flow layout, before the folder emits rows.
- [[bug-b9eb2e3a]] (B2) — signal-not-drop, baked into this rebuild.

## Behavior (request)
Today `foldToL1` (tools/generate/src/l1/fold.ts) emits only text leaves with ~9
axes, discarding images, fields, surfaces, containers and ~30 captured axes —
including several the language already supports. Rebuild it to fold the **full**
value set into the full language:
- **image** leaves (RawImage; fields' objectFit/intrinsicAspect, extract.ts:137).
- **box** surfaces (surfaceFill/gradient/border/shadow/scrim) where a band/panel
  paints.
- **container** structure where recovered (with B3's corrected flow model).
- carry every flat axis the language now supports.
- emit **residuals** (B2) for anything still unexpressed.

## Approach (avoid corners)
Increment 1: emit `image` leaves (already language-supported) to validate the
folder architecture end-to-end. Then extend to the new axis families as they land.
Co-designed against gigabytealchemy/joyful captures.

## Acceptance
Idempotency (B1 suite) holds on the richer folds at all sampled widths; images,
surfaces, fields reproduce; residual list is empty for captured pixel-movers the
language now covers; l1-gate reflects real fidelity. Tests named
`test_UAT_FC_<this-ticket>_*`.

-

-


---

## BUG-6: foldToL1 silently drops textless/box-less elements — must emit a signalled residual, not drop

Scope under [[request-7ff1bacd]] (REQ-88). This is the mechanism that makes
"language before folder" honest — see [[DOC-21]] (growth loop) and [[DOC-27]].

## Behavior (bug)
`foldToL1` (tools/generate/src/l1/fold.ts:130) does `continue` on every element
that is textless or lacks a box — images, form fields, pure-surface panels — and
also skips text runs without geometry. These values never enter `local` and the
gate sees them only as anonymous `unmatched` entries. The **drop is a capability
gap** (folder power); the **bug is that it is silent**.

## Fix direction
Instead of dropping, the folder emits a **structured residual** per element it
cannot yet express: `{ kind, reason, capturedAxes, width(s) }`. Residuals are
returned alongside the folded document and surfaced by the gate as framework-gap
signals (DOC-21). The residual list then *is* the proof of what the language +
folder still lack — the completeness signal for the whole effort.

## Coupling
Design lands with the folder rebuild (folder-power ticket), but tracked
separately because it is a defined behavior change (silent → signalled).

## Acceptance
No element is silently dropped; every unexpressed element appears as a typed
residual; gate report separates residuals from mispairing (see B1). Tests named
`test_UAT_FC_<this-ticket>_*`.


## Free-coding note (2026-07-23)
The signal-not-drop behavior (fold emits typed FoldResiduals; l1-gate keeps them
separate from probe mispairing/fidelity residuals) already shipped, baked into
REQ-92's folder rebuild (commit 9e92a339, owned by REQ-92). Acceptance items 1-3
(no silent drop / typed residual / gate separates residuals from mispairing) are
met in code. The remaining unmet clause is BUG-6's own: **tests named
test_UAT_FC_BUG-6_***. This ticket adds those UATs so BUG-6 has independent matrix
coverage of the contract — notably the gate-separation clause REQ-92's tests do
not exercise (they test foldToL1's collector directly, never cmdL1Gate).


---

## BUG-8: Fold drops the reflowed cell across a breakpoint — captured width loses its keyframe; snap holds the lower frame (fidelity fail at a sampled width)

Scope under [[request-7ff1bacd]] (REQ-88). Finding 2 from the gigabytealchemy
l1-gate re-run. A **stage-1 fidelity bug** (the absolute base is wrong at a
*captured* width) — distinct from the stage-2 robustness bug (recursive promote).
See [[DOC-27]] (idempotence / fixed points).

## Resolution (verified) — already fixed by REQ-92; this ticket adds the guard

**The defect was already fixed** by REQ-92 (commit `6ebc8ee8`, landed 8 minutes
before this ticket was filed). On current HEAD the gigabytealchemy `sampleFidelity`
probe passes at 768 (and all widths) with 0 residuals; every card carries a 768
keyframe at its exact captured box.

**The ticket's original root-cause hypothesis was disproven.** The alignment
seam (`buildResponsiveTable` inside `foldToL1`) does **not** drop the reflowed 768
cell — the three card headings key on distinct text, so they align across the
reflow and each keeps its exact 768 keyframe:
```
Positivity: [375:(48,2028,279) 768:(299,1831,171) 1024:(357,1517,229) …]
```
Capture and fold were always correct.

**The real cause** was in the analytic evaluator, not the fold. `evalGeometry`
matched a geometry segment *ending* at a breakpoint using a **closed** upper bound
(`width <= b.at`), so at the exact interior width 768 the `snap` segment ending
there (375→768, the card narrowing 279→171) returned the held lower (375) keyframe
— the stale pre-reflow box — and every element below inherited the cascade (the
1616px 768 FAIL). REQ-92 changed the interval to **half-open `[a.at, b.at)`**,
mirroring the renderer's highest-`min-width`-wins CSS: at an exact interior
breakpoint the segment *starting* there is active.

## Deliverable — the reflow-at-breakpoint regression guard

`tests/bug8-reflow-breakpoint.test.ts` (`test_UAT_FC_BUG-8_*`, 3 UATs). A synthetic
three-card grid that reflows stack→row at the 768 breakpoint (cards narrow 279→171,
so 375→768 classifies `snap`), asserting through the fold→gate seam:
1. every card keeps a keyframe at the reflow breakpoint (fold does not drop the cell);
2. the reflowed (upper) frame wins at the exact breakpoint — never the held lower frame;
3. `sampleFidelity` is clean at every width, including 768.

Verified the guard bites: reverting the half-open interval to closed turns 2 of the
3 UATs red (the keyframe-presence UAT correctly stays green — the fold is unaffected).

## Acceptance (met)
gigabytealchemy `sampleFidelity` passes at 768 and all widths; every element present
at a captured width has a keyframe there; idempotency (BUG-5 suite) holds (37/37 in
the fold/probe/gate regression scope). A reflow-at-breakpoint fixture regresses the
class. No production code change was required — the class is closed and now guarded.


---

## BUG-9: promoteToFlow only promotes the root — structure recovery must recurse into nested regions (robustness fail under perturbation)

Scope under [[request-7ff1bacd]] (REQ-88). Finding 3 from the gigabytealchemy
l1-gate re-run. A **stage-2 robustness bug** — distinct from the stage-1 fidelity
bug (missing 768 keyframe). Depends on [[bug-d18ad577]] (BUG-7) having fixed the
analytic flow *math*; this ticket fixes which containers we *create*. See
[[DOC-27]] (absolute base vs flow overlay).

## Behavior (bug)
On gigabytealchemy the envelope probes fail: `contentRobustness` finds overlaps at
**every** width and `offSample` finds them at 900px. The recovery pass promoted
only the root: `promoted == ['0']` — it wrapped the *entire page* into one flow
container **but only the pinned-text children**, leaving every non-promoted pinned
sibling (and the leftover flat pile's single median gap) behind. A single
top-level stack cannot keep a 3-card grid's interior spacing sane *and* the footer
sane simultaneously, so growth (2.5×) still overlaps. Reproduced against the real
capture: after recovery `contentRobustness` and `offSample` still failed.

## Root cause
`promoteToFlow` (tools/generate/src/l1/probes.ts) promoted at **one level** — the
failing pinned-text sibling group directly under the node it inspected — into one
flat container, rather than discovering the real nested regions (hero / grid /
footer, each its own flow container with its own interior). Too coarse: it kept
one median gap for the whole page and left non-text / non-flagged pinned siblings
absolute for the grown pile to overrun.

## Fix (implemented)
Recovery is now **region-aware**, walking the tree recursively:

- **Perturbed-overlap graph.** Evaluate the doc once per captured width at the
  perturbation scale; every overlap finding links the two colliding leaves. At
  each node, links between its *direct children* form connected components
  (`overlapComponents`, union-find) — the smallest pinned sibling groups that
  actually collide. Distinct regions stay distinct.
- **Each region → its own flow `stack`** with its own interior `medianGap` (a
  nested sub-stack), derived from the absolute measurements.
- **Nothing left pinned behind.** A node that needs recovery flows *all* its
  children — regions as sub-stacks, survivors as flowed items — so no pinned
  sibling remains for a grown region to overrun. Under CSS flow, stacked items
  never overlap and never clip, so both envelope probes hold.
- **Demand-driven.** A node with no colliding group is left fully absolute
  (per DOC-27's absolute-base / flow-overlay split); a roomy page promotes
  nothing.
- **`promoted` reporting.** A single region covering a whole node reports the
  node's path (backward-compatible `['0']`); multiple regions report their nested
  paths (`0.0`, `0.1`, …) — "nested regions, not just `['0']`".

Fidelity is measured on the untouched absolute base, so recovery never regrades
`sampleFidelity`. `groupKeyframes` / `failingSiblingGroups` (the old single-pile
helpers) are deleted.

Coordinate with [[request-7a6766b0]] (REQ-92): once real surface/box structure
folds in, recovery has genuine nested regions to promote instead of a flat pile —
the recursion already handles that case.

## Acceptance (met)
- Against the real gigabytealchemy capture: `offSample` + `contentRobustness` now
  pass after recovery; `promoted` lists nested regions
  (`["0.0","0.1","0.2","0.3","0.6"]`), not just `['0']`; `sampleFidelity` on the
  absolute base is unchanged (still clean).
- Perturbation fixture (grid + footer, flat root of tightly-packed regions)
  regresses the coarse promote: base fails robustness, recovery promotes 3 distinct
  regions, envelope holds, base fidelity untouched, single-region and roomy cases
  preserved.

## Tests
`tests/bug9-region-aware-promote.test.ts` — `test_UAT_FC_BUG-9_*`:
- `recovery_promotes_nested_regions_not_single_pile`
- `recovery_never_regrades_base_fidelity`
- `single_region_reports_node_path`
- `roomy_page_left_absolute`

Existing 3-probe / e2e / pipeline suites (reconciliation-3probe-gate, req86, req88)
remain green.


---

## BUG-10: Capture records list-style-type for non-list elements — every run renders a bullet

Scope under [[request-7ff1bacd]] (REQ-88). Appearance-population gap surfaced by the
gigabytealchemy re-run. Capture-side; independent of the fold work.

## Behavior (bug)
Every rendered run shows a bullet. The fresh fold carries `listMarker:'disc'` on
**43 of 55** text nodes — including the `<h1>` wordmark "Gigabyte Alchemy", which is
not a list. The renderer faithfully paints it (`render.ts:378`: `display:list-item;
list-style-type:disc`).

## Root cause
The capture's `EXTRACT_SCRIPT` (tools/generate/src/cli/capture/extract.ts) records
computed `list-style-type` — whose **initial value is `disc` on every element** —
without gating on `display: list-item`. So non-list elements get a phantom marker.
The RawRun contract *says* "list-style-type when a marker is **painted**" but the
painted check is missing.

## Fix (as implemented)
`listMarkerOf(s)` now returns `null` unless `s.display === 'list-item'` — the only
elements for which the browser generates a `::marker` box. A genuine `<li>` (or any
list-item) keeps its marker; every other element reports `null`. `none` still
suppresses a marker on a real list item. The fold (`foldListMarker`) and renderer
are untouched — they are correct once the input is clean.

Single-line gate added to `listMarkerOf` in extract.ts; nothing else changed.

## Tests
`tests/bug10-list-marker-gate.test.ts` — four UATs run the **real** EXTRACT_SCRIPT
under jsdom (mirroring the req63 extraction test):
- `test_UAT_FC_BUG-10_non_list_runs_have_no_phantom_marker` — wordmark `<h1>` and
  body `<p>` carrying the initial-value `disc` report `listMarker: null`.
- `test_UAT_FC_BUG-10_genuine_list_item_keeps_its_marker` — a real `<li>` keeps `disc`.
- `test_UAT_FC_BUG-10_list_item_with_none_has_no_marker` — `list-style-type:none` → null.
- `test_UAT_FC_BUG-10_mixed_list_and_non_list_fixture` — heading + list: only the
  list item carries a marker (`decimal`).

Note: jsdom does not apply the UA `disc` default, so non-list fixtures set
`list-style-type` inline — this reproduces the exact computed-style input a real
browser presents for a plain heading/paragraph, which the gate must suppress.

Regression scope (green): req63-values-diff-coverage, req47-fidelity-structural,
and the l1 fold/roundtrip suite. (One pre-existing, unrelated failure in
reconciliation-l1-substrate `validateL1` — fails with this change stashed.)

## Acceptance — met
No bullet on non-list runs (wordmark, headings, body); genuine `<li>` lists keep
their markers; a mixed list/non-list fixture regresses it.


---

## BUG-11: Fold drops surfaceFill/surfaceGradient — runs emit as bare text, all panel/section backgrounds vanish

Scope under [[request-7ff1bacd]] (REQ-88). The **biggest visual lever** of the
appearance-population gaps. Extends [[request-7a6766b0]] (REQ-92): the box emit-code
landed, but the fold never fed it. Fold-side.

## Behavior (bug)
The reproduction had no panel or section backgrounds. In the fold's input
(`multistate.json`) **51 of 59** elements carried `surfaceFill`, yet the folded doc
carried **zero** — node kinds were `{box:1 (root), text:55}`, and `doc.background`
was unset.

## Root cause
The capture composites the card/panel/section fill behind every text run **onto the
run** (`surfaceFill`/`surfaceGradient`, REQ-58/62) — never as a standalone box. The
fold's text-leaf path emitted a **bare text leaf** and dropped the run's surface, so
every captured background vanished. `doc.background` was never set.

## Fix (implemented)
`foldToL1` now reconstructs the *surface a run sits on* (`tools/generate/src/l1/fold.ts`):

- **Page band → `doc.background`.** The dominant solid run-fill (the colour the most
  runs sit on) becomes the document background, painted by the body. Zero new nodes.
- **Panel/card surfaces → backing `box` leaves.** Each run whose composited surface
  *differs* from the band (or carries a `surfaceGradient` the body can't paint) folds
  a `box` leaf (id `surface-*`) carrying that fill + the run's geometry, emitted
  *before* the content so every leaf paints over its surface. Runs on the band get no
  box (the body already paints it), keeping node count down.
- **Envelope probe** (`probes.ts`): a backing surface sitting behind the content it
  backs is not a collision, so `evaluateLayout` no longer reports box↔content
  overlaps (boxes stay in the horizontal-clip check).

Verified against both real captures: gigabytealchemy → `doc.background=#f8f5f2` + 34
surface boxes; joyfulculinarycreations → `#7a7a7a` + 23 surface boxes. `sampleFidelity`
(text-only geometry) unchanged (maxDelta 0.5, pass) on both.

## Test plan
UATs `test_UAT_FC_BUG-11_*` in `tests/bug11-fold-surface-fill.test.ts` (real
`foldToL1`/`renderL1Document`/`evaluateLayout`, synthetic multi-viewport captures +
the two retained real captures):
- run surfaceFill → backing box behind text (surfaces emitted first)
- dominant run-fill → `doc.background`; band runs get no box; render paints body bg + panel fill
- `surfaceGradient` → backing box even when the solid equals the band
- backing surface not flagged as overlap by `evaluateLayout`
- `sampleFidelity` unchanged by surfaces
- real captures get a band + surface boxes with fidelity intact

Also updated `test_UAT_FC_REQ-92_form_controls_stay_residuals`: gigabytealchemy now
legitimately folds surface boxes (every box id `surface-*`), form controls still stay
field residuals — the REQ-92 intent is preserved, its over-strict "zero boxes"
assertion narrowed.

## Acceptance
Panel/card and section backgrounds render with the captured fills ✓; `doc.background`
set ✓; `sampleFidelity` (geometry) unchanged ✓.