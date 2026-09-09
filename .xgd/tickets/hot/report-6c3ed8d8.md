---
uid: report-6c3ed8d8
id: REPORT-3584
type: report
title: 'Capability-Intent Alignment: 1c Capture & Diff Fidelity (level=ac)'
created_by: xgd
created_at: '2026-09-09T23:44:26.901047+00:00'
updated_at: '2026-09-09T23:44:26.901047+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-aa030c83
  level: ac
  violations: 12
  warnings: 2
  needs_review_count: 0
---

# Capability-Intent Alignment: 1c Capture & Diff Fidelity
# Level: ac

**Result**: FAIL
**Violations**: 12
**Warnings**: 2
**Needs review**: 0

Seven stories, 68 ACs (67 active, 1 deprecated). Four stories — STORY-78,
STORY-79, STORY-124, STORY-125 — are clean on all three properties. The twelve
violations sit on three stories and are of two shapes only:

- **Ten `ac-add` coverage gaps** — behaviour the story body describes In-scope,
  implemented and verified live at HEAD, with no AC pinning it. Nine of the ten
  are the direct, predicted consequence of this cycle's story-level repair:
  `report-aec8af1b` (the last ac-level report, 2026-08-16) closed with *"Each
  becomes an `ac-add` once the story bodies are repaired… Re-run the ac level
  after the story-level fixes land."* Those fixes landed today
  (`report-7617e6fa`, 8 fixes, 2026-09-09T23:32) and the AC surface has not yet
  grown to match.
- **Two STORY-76 findings on their fifth identical filing** (`report-728bd245`,
  `report-cb7ea283`, `report-15f4892f`, `report-aec8af1b`, here), plus one new
  consistency break the story-level repair itself created.

Every finding was re-verified this cycle against the ticket store **and** against
the production code at HEAD — not carried from the prior report's text. No
`code-issue` finding: in every case the code is right and the matrix is silent or
wrong about it.

## Cumulative Intent Considered

Stories record intent as *bundle* UIDs; the rows below are the REQ/BUG tickets
those bundles carry. Statuses re-read this cycle from the `request` (157 tickets)
and `bug` stores. **No intent in this capability's tree is `abandoned`,
`deprecated` or `wont_fix`**, so Step 2.5's stale-vehicle case does not arise
anywhere in this report.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-44 | free_and_reconciled | 2026-07-03 | Fail loud on out-of-sync `node_modules`; per-command dependency preflight | YES |
| REQ-58 | free_and_reconciled | 2026-07-13 | Ladder-wide `--multi-viewport` values-diff; boolean-flag + `--json` hygiene; composited surface fill; box border; duplicate-text pairing | YES |
| REQ-59 | free_and_reconciled | 2026-07-13 | Capture text-fill gradient stop positions | YES |
| REQ-61 | free_and_reconciled | 2026-07-16 | `--size` on both diff commands; `responsive-diff` N-way analysis + classifier | YES |
| REQ-62 | free_and_reconciled | 2026-07-16 | Panel/surface gradient: capture + render + diff | YES |
| REQ-63 | free_and_reconciled | 2026-07-17 | Coverage audit: capture + diff every render-affecting CSS axis | YES |
| REQ-64 | free_and_reconciled | 2026-07-17 | Noise audit; per-defect (not per-cell) aggregation → `--collapse` | YES |
| REQ-72 | free_and_reconciled | 2026-07-18 | Hexify modern colour spaces in-browser so gradient stops capture at all | YES |
| REQ-73 | free_and_reconciled | 2026-07-18 | values-diff adjacent-`gap` axis + drop the band-padding deltas it supersedes | YES |
| REQ-76 | free_and_reconciled | 2026-07-18 | values-diff cause clustering: ranked causes + `--clusters` + dispositions | YES |
| REQ-78 | free_and_reconciled | 2026-07-19 | `aligned-crops`; its store-selection routing is STORY-79 guarantee 3 | YES |
| REQ-84 | free_and_reconciled | 2026-07-20 | Framework pivot C: delete the layout modules | YES (retires) |
| REQ-89 | free_and_reconciled | 2026-07-22 | Silence 'Missing pages directory'; Astro container on demand | YES (superseded by REQ-150) |
| BUG-10 | free_and_reconciled | 2026-07-23 | No `list-style-type` for non-list elements | YES |
| BUG-15 | free_and_reconciled | 2026-07-23 | values-diff cannot read L1-rendered pages | YES |
| BUG-16 | free_and_reconciled | 2026-07-23 | Capture extracts computed styles before webfonts load | YES |
| REQ-91 | free_and_reconciled | 2026-07-23 | Capture/axis families for pixel-movers (treatments, effects, blend, transform/mask) | YES |
| BUG-22 | free_and_reconciled | 2026-07-24 | Split text+box control mis-attribution (phantom radius delta) | YES |
| BUG-24 | free_and_reconciled | 2026-07-24 | Colour alpha not representable — translucent overlay/scrim invisible | YES |
| BUG-25 | free_and_reconciled | 2026-07-25 | Multi-line text splits into runs that all share one box | YES |
| BUG-27 | free_and_reconciled | 2026-07-25 | CSS background images and lazy-loaded media not captured | YES |
| REQ-96 | free_and_reconciled | 2026-07-26 | Behavior modules layout-agnostic; `config` never aesthetic | YES (retires) |
| **REQ-114** | **free_and_reconciled** | **2026-07-31** | **L1 palette colour model — retires the module-level palette-role alias; a module colour is a `#hex` literal** | **YES (retires)** |
| REQ-150 | free_and_reconciled | 2026-08-18 | Launcher boots a plain Vite SSR server; Astro leaves the repo; render path names no build transform | YES (retires REQ-89's conditional form) |
| REQ-154 | bundled | 2026-08-20 | Browser Rendering driver behind the `BrowserDriver` seam; self-origin fulfilment | imminent — treated as live |

REQ-114 remains the pivotal row for finding 6: it was reconciled against the L1
colour capability, not this one, which is why its consequence never propagated
into STORY-76's gradient ACs.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-75 (`story-d5de22a5`) — 12 Description items, 14 ACs | REQ-58, 63, 64, 73, 91, 96, BUG-10, 15, 16, 22, 24, 25, 27 | **5 coverage violations** — findings 1–5. Seven items map cleanly (2→AC-631, 3→AC-632/713, 5→AC-711, 6→AC-712/714, 8→AC-815, 9 backdrops→AC-816, 10→AC-817, 11→AC-818); five *sub*-rules the repaired body now states In-scope have no AC |
| STORY-76 (`story-82eb6908`) — 3 Description items, 5 ACs (1 deprecated) | REQ-59, 62, 72; **still not reconciled against REQ-114** | **4 violations** — findings 6–9. Prior finding 3 (mark the authoring half superseded) **is repaired**: Description item 2 "Authored" now reads superseded and In-scope reads "capture + diff". That repair created finding 9 |
| STORY-77 (`story-16f2793c`) — 8 In-scope items, 8 ACs | REQ-61 (size-aware half), REQ-58 (`--multi-viewport`), REQ-64 (`--collapse`), REQ-76 (`--clusters`) | **3 coverage violations** — findings 10–12 — plus warnings 13/14. Items 1–4 map cleanly (1→AC-639, 2→AC-643, 3→AC-641/642/644/645, 4→AC-647; AC-640 pins the no-flag default). Items 6, 7, 8 — the entire three-view reporting stack the repaired body added — have **zero** ACs |
| STORY-78 (`story-2c7069fe`) — 8 In-scope bullets, 9 ACs | REQ-61 (cross-size half) | **aligned.** One-to-one: table→AC-648, `--sizes`→AC-649, occurrence alignment→AC-651, changed/steady + presence flips→AC-650, `--classify`→AC-652, `--json`/`--ref`→AC-655, `--out`→AC-721, the two terminal-fails→AC-653/654. No gap, no orphan, no duplicate |
| STORY-79 (`story-e15a19ef`) — 6 guarantees, 15 ACs | REQ-58, 78, 89, 44, 150 | **aligned.** g1→AC-656, g2→AC-657/658/659/738, g3→AC-720, g4→AC-1415/1416/1417, g5→AC-739, g6→AC-1013…1017. `report-aec8af1b` warning 5 is **repaired on both halves**: the story's six-verb "never render" parenthetical is gone, and AC-738 now reads "`help`, `list`, `assets --json`, and the other verbs that never build a site", which no longer contradicts AC-1017 |
| STORY-124 (`story-080c6036`) — 7 In-scope bullets, 10 ACs | REQ-154 (imminent) | **aligned.** presets/refusal→AC-1459/1460, absent capability→AC-1461, lease + isolated context→AC-1462, release on every exit→AC-1463, one navigation→AC-1464, honest limits→AC-1465, shared preconditions→AC-1466/1467, no local stack→AC-1468. First ac-level pass over this story. Its Technical Context now reads "Filed under CAP-63", so the capability History's recorded stale-numeral defect is moot |
| STORY-125 (`story-7fa314f5`) — 7 In-scope bullets, 7 ACs | REQ-154 (imminent) | **aligned.** The body annotates each bullet with its own AC (AC-1469…AC-1475) and the mapping holds exactly. First ac-level pass over this story |
| AC-637 (`acceptance_criterion-377af866`) | REQ-62, superseded by REQ-84 / REQ-96 | correctly deprecated; the story body now follows it (see finding 9 for the overshoot) |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | STORY-75 `story-d5de22a5` — Description item 1, second paragraph | ac-add | **BUG-25 per-text-node run geometry has no AC.** The body states a specific rule and its failure mode: an element contributes its own rendered box "only when it owns *exactly one* text run"; an element owning more than one measures each run off its own **text node**, because giving every run the element's box makes each run claim the full block, so extents are identical to each other and far larger than the glyphs. In-scope names it ("the single-run-vs-text-node geometry rule"). AC-629 and AC-630 pin the ratio comparison and its tolerances but say nothing about *which node* the extent is measured off. Verified live at HEAD: `tools/generate/src/cli/capture/extract.ts:1101` ("two passes, because a run's geometry depends on whether its element…") and `:1124` `var glyphs = ownRun ? renderedTextBox(el) : textNodeBox(n)`, with `textNodeBox` at `:676` ranging over the single node | Author one AC: a single-run element measures its extent off its own box; a multi-run element (a `<br>`-broken paragraph, a heading with a nested span) measures each run off that run's text node, so per-line extents differ from each other and from the element box |
| 2 | violation | coverage | STORY-75 `story-d5de22a5` — Description item 4, "Split-control surface attribution" | ac-add | **BUG-22 attribution has no AC.** The body draws the distinction explicitly — "Pairing decides *which two elements* are compared; attribution decides *which node's* value each axis reads" — and In-scope names "the split-control surface attribution that decides which node an axis reads". AC-633 covers only the *pairing* half. The attribution half is a distinct failure mode (a phantom corner-radius delta on a control that renders identically on both sides) and a distinct mechanism (the captured element carries its backing-surface reference, so resolution is a lookup, inert on a pre-BUG-22 bundle). Verified live at HEAD: `extract.ts:23`, `:852`, `:1175`; `values-diff.ts:137-144` ("Absent on pre-BUG-22 manifests, which keeps the resolution inert"), `:2103` (SPLIT CONTROL), `:2151` (hairline re-read off the backing box) | Author one AC: on a split control the surface axes (fill, border, hairline, radius) resolve against the node bearing the backing surface rather than the paired text node, so an identically-rendering split control raises no delta; a bundle carrying no backing-surface reference leaves the resolution inert |
| 3 | violation | coverage | STORY-75 `story-d5de22a5` — Description item 7, first two paragraphs | ac-add | **BUG-16's offline re-extract font rewrite has no AC.** In-scope names "the offline re-extract that makes the font axes measurable". The body calls it "the capture-side precondition for the axes above being about the reference's typography at all": without rewriting the document's font references to the bundle's mirrored copies, the faces never load, every glyph metric is measured against the *fallback* face and `fontLoaded:false` is persisted across the manifest — "not a slow-font artifact but a wrong measurement of every text axis at once". AC-715 covers only the *residual* after the rewrite (the fontLoad diff direction), and presupposes the rewrite rather than asserting it. Verified live at HEAD: `tools/generate/src/cli/capture/reextract.ts:67-72` — mirrored asset basenames, and the comment naming the exact failure ("Those never reach this… @font-face never loads — the run is measured against a fallback face (wrong family + wrong glyph metrics, `fontLoaded:false`)") | Author one AC: re-extracting a bundle offline rewrites the document's font references to the bundle's own mirrored faces, so the faces load and the text axes are measured against the intended face rather than a fallback (`fontLoaded` true, glyph metrics matching the online extract) |
| 4 | violation | coverage | STORY-75 `story-d5de22a5` — Description item 9, "The band overlay (scrim) is itself a captured axis" | ac-add | **BUG-24's overlay axis and its colour-probe resolution have no AC.** In-scope names "the band-extent, band-overlay and backdrop-indexing rules", and Technical Context makes it load-bearing twice ("a scrim read by regex instead of through the colour probe"; "A false positive and a false negative can share one root"). AC-816 names the scrim only as a backdrop *exclusion* and asserts in passing that it "is still present as the band's overlay" — it never asserts the overlay is a captured axis in its own right, and says nothing about the property that is the whole of BUG-24: the veil is resolved through the canvas colour probe, **not** by pattern-matching `rgba(...)`, so a `color-mix(in oklab, …)` / `oklch(...)` veil is captured rather than silently dropped. The body states the compound consequence — a regex would lose the axis *and* stop the translucent-fill exclusion firing, returning the veil as an opaque second copy of the photograph. Verified live at HEAD: `extract.ts:1047` `overlayOf`, `:1055-1059` ("resolve the scrim through rgbaOf (the REQ-52 canvas probe), not a raw rgba() regex… EVERY modern-syntax scrim was silently dropped and the hero rendered unveiled"), `:200-201` the `overlay: {color, opacity}` shape, `:1425` | Author one AC: a band records the translucent veil over its backdrop as its own overlay value, resolved through the canvas colour probe, so a veil authored in a modern colour syntax (`color-mix`/`oklch`) is captured with its alpha exactly as an `rgba` one is; an opaque or fully transparent fill is not an overlay; and the captured overlay is what makes the full-bleed-translucent backdrop exclusion fire |
| 5 | violation | coverage | STORY-75 `story-d5de22a5` — Description item 12 | ac-add | **REQ-73's adjacent-row gap axis has no AC at all** — the largest single gap in this capability. In-scope names it twice ("the supersession of band-padding by the adjacent-row gap axis"). The body states both halves: elements are grouped into visual rows by rendered position and the distance between consecutive rows is its own axis (default tolerance 6px, 16px under `--tolerant`); and it **supersedes** the section band-padding delta, which is *dropped* rather than left alongside it, because keeping both would double-report every real spacing difference and keep emitting the proxy's false ones. None of STORY-75's 14 ACs mentions a gap, a row, or band padding. Verified live at HEAD: `tools/generate/src/cli/capture/values-diff.ts:363` (the axis), `:1530` ("inter-row vertical gap tolerance in px (default 6; `tolerant` → 16)"), `:2276`, `:2493` ("the adjacent-GAP axis"), `:2575` ("section band vertical padding is NOT compared"), `:1361` | Author one AC (or two) covering both halves: a reproduction whose elements all match but whose inter-row spacing differs by more than the tolerance raises a gap delta, absorbed under `--tolerant` at the wider band; and a band-padding difference alone raises **no** delta, the proxy having been retired in favour of the measured gap |
| 6 | violation | consistency | AC-638 `acceptance_criterion-a657c39c` (STORY-76) | ac-edit | **Fifth identical filing** (`report-728bd245`, `report-cb7ea283`, `report-15f4892f` f3, `report-aec8af1b` f1). The Criterion advertises as **accepted** exactly what the validator **rejects**: "each stop colour an absolute hex **or a palette-role alias** — producing no validation error". **REQ-114** (`request-3cd338cd`, free_and_reconciled, 2026-07-31) retired the module-level palette-role alias. Re-verified at HEAD this cycle, not carried from the prior report: `validateGradient` routes every stop through `validateColor` (`packages/framework/src/modules/validate.ts:130-134`), and `validateColor` errors on anything failing `isColorLiteral` (`:101-107`), its doc comment reading "REQ-114 removed the palette-role alias — colour is the L1 palette model's now (DOC-23 §5)". A role-valued stop therefore produces `must be a #hex colour, got '…'`. The gradient content-field type is still live production code (`validate.ts:195-200` dispatches `spec.type === 'gradient'`), so the AC is describing real code — wrongly | Narrow the accepted stop-colour form to a `#hex` literal only, and move the palette-role alias to the **rejected** side alongside the string/number cases already listed. Leave the direction clause untouched — `validate.ts:116-125` still accepts a degrees number or a direction alias exactly as the AC says |
| 7 | violation | coverage | STORY-76 `story-82eb6908` — Description item 2, the "**Captured**" sub-bullet | ac-add | **Fifth identical filing** (as above). In-scope declares "capture of stop positions and surface gradients", and item 2's first sub-bullet states a specific four-clause selection rule: "the nearest painting ancestor's surface gradient is recorded, **skipping a text-fill gradient** and **stopping at the first opaque solid**". **No AC covers it.** AC-636 covers only the *diff*, presupposing "a reference run sits on a panel/card whose surface is a gradient" without pinning how that surface was selected; AC-634/635 are the text-fill stop axis; AC-638 is validation; AC-637 is deprecated. Re-verified at HEAD: `surfaceGradientOf`, `extract.ts:840-850` — tightest-first walk over `surfaceChainWithSelf` (`:648`), the `clip !== 'text'` skip (`:846`), the opaque-solid stop, and `null` when no gradient ancestor is found. This is the one place the capture can be silently wrong in a way the diff **cannot** detect: pick the wrong ancestor and both sides agree on a value that is not what paints — a clean gate on a wrong render, the exact failure this capability exists to close | Author one AC covering all four clauses: (a) for a run inside nested painting ancestors the recorded surface gradient is the **nearest** ancestor's; (b) an ancestor's `background-clip: text` gradient is **skipped** rather than recorded as the surface; (c) the walk **stops at the first opaque solid**, so a gradient hidden behind it records none; (d) a run with no gradient ancestor records none |
| 8 | violation | coverage | STORY-76 `story-82eb6908` — Description item 0 | ac-add | **New this cycle** — created by the story-level repair, which added item 0 and put it first in In-scope ("in-browser resolution of stop colours to a comparable hex form (the precondition above)"). REQ-72 (free_and_reconciled, 2026-07-18) is the intent. The body calls it "the precondition the rest of this story stands on": a Tailwind-authored gradient computes to `oklch(...)`/`oklab(...)`/`color(...)`, which the TS-side stop parser cannot read, and "a stop list it cannot read is an empty stop list, so the gradient captures as direction-only and the stop-position axis below has nothing to compare". **No AC covers it** — and note the coupling: without this, AC-634 and AC-635 are vacuous on any modern-syntax gradient, since both sides record no stops and diff clean. Technical Context adds the non-obvious reason it must run *in the page*: the colour-space conversion is the browser's own, and doing it tool-side would mean reimplementing colour-space maths against whatever syntax the reference's build emitted. Verified live at HEAD: `extract.ts:329-345` `hexifyGradient` (a hidden `span` probe read back through `getComputedStyle`), applied to the surface path at `:846` and the text-fill path at `:1132` | Author one AC: a gradient authored in a modern colour space captures with its full ordered stop list resolved to `#rrggbb`, not as a direction with an empty stop list — for **both** gradient kinds (surface and text-fill) — so the stop-position and surface-gradient axes have something to compare |
| 9 | violation | consistency | STORY-76 `story-82eb6908` — In-scope / Out-of-scope lines, vs AC-638 | story-body-edit | **New this cycle, an overshoot of the story-level repair.** `report-aec8af1b` finding 3 asked that the *resolver* half be marked superseded and explicitly directed "The **validation** half stays live and keeps AC-638". The repaired body went further: In-scope now reads "The live scope of this story is **capture + diff**", and Out-of-scope reads "**the authoring path in any live form**". Content-field validation *is* the authoring path, so **AC-638 (active) now asserts behaviour its own story declares out of scope** — an orphan AC, which is the drift this property exists to catch. The body is the side that is wrong: the behaviour is live production code (`validate.ts:195-200`, `modules/types.ts` declaring the `gradient` field type), and CAP-63's own Scope bullet 2 still retains "the legacy *module content-field* gradient and its shared `resolveSurfaceGradient` resolver" as this capability's authoring surface. Distinguish the two legs: the **resolver** has zero production callers and is correctly superseded (AC-637 deprecated); the **validator** still runs | Restore a narrow In-scope clause for the retained validation leg — e.g. "and the validation of the retained legacy `gradient` content-field type" — and narrow the Out-of-scope line from "the authoring path in any live form" to the *resolver* path specifically (`resolveSurfaceGradient` and the deleted modules that hosted it), matching CAP-63 Scope bullet 2 and AC-637's deprecation note. Do **not** deprecate AC-638; fix it per finding 6 |
| 10 | violation | coverage | STORY-77 `story-16f2793c` — In-scope item 6 | ac-add | **`values-diff --multi-viewport` — the ladder-wide mode — has no AC.** The body describes it as "the mode the reproduction work was actually driven with, and the mode whose cell counts the noise-audit tolerances were calibrated against" (REQ-58). Three distinct assertions go unpinned: it projects the served draft across *every* rung the bundle persisted; it diffs cell-for-cell (one cell per element × width) and reports **worst-cell-first**, so the worst rung leads whether or not the caller suspected it; and it **fails loud** on a bundle with no persisted ladder rather than collapsing to a desktop-only comparison. AC-641 covers the fail-loud case for `--size` only; AC-656 (STORY-79) covers the *flag parsing* of `--multi-viewport`, not the mode's behaviour; AC-657 mentions the mode only as a `--json` context. Verified live at HEAD: `tools/generate/src/cli/capture/fidelity.ts:188` (the loop), `:203` and `:209` (the two refusals), `:237-246` ("worst cell first"); `index.ts:1021` | Author one AC for the mode: given a bundle with a persisted ladder, the served draft is projected across every rung and the report is ordered worst-cell-first; against a bundle with no ladder the command terminates with the re-capture message and emits no report |
| 11 | violation | coverage | STORY-77 `story-16f2793c` — In-scope item 7 | ac-add | **`--collapse` has no AC.** REQ-64 (free_and_reconciled, 2026-07-18). The body states the rule and both directions of it: "a single real defect that reproduces at all six rungs is one defect seen six times, not six defects", so `--collapse` deduplicates cell rows to one row per distinct defect and "the ×N-viewport multiplier stops inflating the count"; **and** the un-collapsed cell view remains the **default**, because which rungs a defect appears at is itself diagnostic ("a defect present only at the narrow rungs is a breakpoint problem, not a value problem"). No AC mentions collapse. Verified live at HEAD: `fidelity.ts:309` ("REQ-64 - collapse the per-cell multi-viewport deltas to one row per DEFECT"), `:400` (the report line), `index.ts:1040` (`collapseMultiViewport`) | Author one AC: a defect reproducing at N rungs collapses to one row under `--collapse` (the headline count being a count of things to fix), while the same run without the flag keeps the per-cell rows and their width attribution |
| 12 | violation | coverage | STORY-77 `story-16f2793c` — In-scope item 8 | ac-add | **`--clusters` has no AC** — the largest of the three reporting-stack gaps. REQ-76 (free_and_reconciled, 2026-07-18). The body states five separate properties: collapsed defects roll up by **cause** rather than by the property they fired on (arrangement + containment are both *layout structure*; shape + border + outline are all *control styling*); each cause carries count, worst tier, **width scope** and representatives, ranked count-first then worst-tier; each carries a **disposition** — `fix` / `review` / `accept` — summarised as "N counted defects roll up to M causes: X fix / Y review / Z accept"; **derived axes are never counted** (a position delta is a consequence, so counting it double-counts its cause); and a property with **no taxonomy entry falls back to its own name at `review`** rather than being dropped, "so a newly added axis appears in the ranking the day it lands instead of silently vanishing from the count". That last rule is the one that keeps this story honest as STORY-75's axis set grows — precisely the growth findings 1–5 are about — and nothing pins it. Verified live at HEAD: `index.ts:330`, `:1035-1044` (`clusterDefects`, `formatClusterReport`) | Author one AC (or two — the roll-up and the two honesty rules split naturally): collapsed defects roll up to ranked causes carrying count, worst tier, width scope and disposition; a derived axis is not counted as a defect of its own; and a property absent from the taxonomy appears under its own name at `review` rather than being dropped from the count |
| 13 | warning | coverage | AC-647 `acceptance_criterion-b94eb4c7` (STORY-77) vs In-scope item 5 | ac-edit | Item 5 claims the ladder itself: "**The ladder itself is a capture-time artifact of this story, not borrowed infrastructure** — `1c capture` persists the reference's per-element value manifest at every rung of the viewport ladder, not only at desktop." AC-647 asserts the per-width *screenshot* siblings and that the value matrix carries no image bytes — it refers to the value matrix's existence but never asserts it is persisted **per rung**. Every other AC on this story (AC-639, 641, 642) presupposes the ladder rather than asserting it. Warning rather than violation because AC-647 partially covers the capture-time persistence claim and is the natural place to extend. Verified live at HEAD: `capture.ts:52` (`multistate.json`), `:67-69` ("a reference is only complete if it spans the viewport ladder… Project the reference across RESPONSIVE_VIEWPORTS at rest and persist it"), `:78-82` (the screenshot sibling) | Extend AC-647 (or add a sibling AC) so the per-rung **value manifest** is asserted alongside the per-rung screenshots: a capture persists the per-element value manifest at every ladder width, not only the default width |
| 14 | warning | coverage | STORY-77 `story-16f2793c` — Technical Context | ac-add | **Carried unrepaired from `report-728bd245` / `report-cb7ea283` / `report-15f4892f` f5 / `report-aec8af1b` f4.** Technical Context claims "a single **deterministic** reference cell is chosen per width (prefer the primary engine at rest)". No AC pins it: AC-639 asserts the reference values come from the ladder at the selected width, but not that the choice *among candidate cells at that width* is deterministic or engine-preferring. A non-deterministic choice would make `--size` diffs flaky in a way every other AC reports clean. Still a warning because the claim sits in Technical Context rather than the In-scope Description. Grounded in live code: `values-diff.ts` implements exactly that ordered preference (Chromium at rest → any engine at rest → whatever) | Either add an AC pinning per-width cell selection (same bundle + same width → same reference cell; the primary engine's at-rest cell preferred when several are present, with the documented fallback order), or drop the claim from Technical Context if the ladder in practice carries exactly one cell per width |

## Notes for the Editor

**1. Nine of the twelve violations are one predicted batch — do them as one pass.**
Findings 1–5 (STORY-75), 8 (STORY-76 item 0) and 10–12 (STORY-77 items 6–8) all
exist because the story-level repair (`report-7617e6fa`, today) correctly added
behaviour to the story bodies that the AC surface has not yet grown to match.
`report-aec8af1b` note 3 predicted exactly this set by name: *"REQ-73's `gap`
axis, BUG-22 split-control attribution, BUG-24 band-overlay across modern colour
syntax, BUG-25 per-text-node run geometry, BUG-16 offline re-extract, REQ-72
in-browser gradient hexification, REQ-76 cause clustering, and the
`--multi-viewport` diff mode."* All eight are here, plus REQ-64's `--collapse`.
None is a judgement call: each names live code, cited by file and line above.

**2. Findings 6, 7 and 9 are one pass over STORY-76, and 6 and 9 must be done
together.** All three sit on Description item 2 / the scope lines. Finding 9
restores the In-scope home for the validation leg; finding 6 corrects what that
leg actually accepts. Doing 6 without 9 leaves an AC the story excludes; doing 9
without 6 re-blesses the wrong criterion.

**3. Why findings 6 and 7 have survived five cycles — a likely mechanical
cause.** The production code is right, but two of its *comments* still carry the
retired formulation and would mislead anyone verifying the AC by reading nearby
source: `validate.ts:131` says "A stop is a bare colour string (hex/role)" and
`validate.ts:167-168` says "Absolute value (#hex) or a palette-role alias (the
overlay). Reuses the same literal-or-role rule". Both sit within a few lines of
`validateGradient`/`validateColor`. The *behaviour* is unambiguous — every stop
goes through `validateColor`, which rejects a role — but a fix pass that reads
the comment rather than the call graph would conclude AC-638 is already correct
and leave it. This is not filed as a `code-issue` (the code does what the matrix
should say; only the comments are stale), but it is worth a follow-up outside
this check, and worth knowing before attempt 8.

**4. Four stories need no work.** STORY-78, STORY-79, STORY-124 and STORY-125 are
clean on consistency, coverage and exclusivity, checked in full this cycle —
recorded so the editor does not churn them. STORY-79 in particular has had both
halves of `report-aec8af1b` warning 5 repaired and its 15 ACs now cover all six
guarantees with no internal contradiction. STORY-124 and STORY-125 are the
`bundle-8eef3846` pair and were reaching the ac level for the first time; both
were authored with an explicit bullet→AC mapping and it holds exactly.

**5. The capability History's recorded defect is now moot.** CAP-63's History says
STORY-124's Technical Context "says 'Filed under CAP-102 (1c Capture & Diff
Fidelity)'… the numeral is stale". The story now reads "Filed under CAP-63 (1c
Capture & Diff Fidelity)". No ac-level finding; noted so it is not re-derived.

**6. Exclusivity is clean everywhere.** No duplicate AC was found within any
story. Two near pairs were checked and are genuinely distinct: AC-632/AC-713 are
two legs of the border axis (base width+colour vs line style + text-run capture
via the thickest painted side), and AC-1466/AC-1467 are the precondition set
itself vs the cloud-equals-local equivalence plus local-capture regression.

**7. No `code-issue` findings, and no `needs_review`.** Every finding is the
matrix under-describing or mis-describing working code. No intent in this
capability's tree carries `abandoned`, `deprecated` or `wont_fix` status, so
Step 2.5's stale-vehicle case never arose.
