---
uid: report-6d2d7d31
id: REPORT-2364
type: report
title: 'Capability-Intent Alignment: 1c Capture & Diff Fidelity (level=ac)'
created_by: xgd
created_at: '2026-08-20T04:30:48.847988+00:00'
updated_at: '2026-08-20T04:30:48.847988+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-aa030c83
  level: ac
  violations: 10
  warnings: 2
  needs_review_count: 0
---

# Capability-Intent Alignment: 1c Capture & Diff Fidelity
# Level: ac

**Result**: FAIL
**Violations**: 10
**Warnings**: 2
**Needs review**: 0

Attempt 11 at this scope, but the **first ac-level cycle since attempt 7–10 rewrote
the story bodies**. The last ac report (`report-aec8af1b`, 2026-08-16) judged STORY-75
"aligned at this level — all eleven Description items are covered". STORY-75 now has
**fifteen** Description items and still **fourteen** ACs: attempts 7–10 swept BUNDLE-10
(BUG-15/16/22/24/25) and REQ-73 into the story body, and REQ-72 into STORY-76, and the
story-level check passed on that. **None of those repairs reached the AC surface.** Six
of the ten violations below are that cascade — exactly the "story-level findings
invalidate downstream AC-level reasoning" case the level cascade warns about.

The other four are STORY-76's, two of them now **unrepaired for a fifth consecutive
cycle** (`report-728bd245`, `report-cb7ea283`, `report-15f4892f`, `report-aec8af1b`).

Every finding was re-verified at HEAD against the current tree — I did not inherit the
prior report's citations. STORY-77, STORY-78, STORY-79 and the new STORY-116 were
re-derived from their bodies rather than carried forward, and are clean.

## Cumulative Intent Considered

At `ac` level the story body is the working reference. Intent is consulted only where an
AC asserts behaviour a reconciled intent retired (finding 9) or where a story body's
own In-scope line has no AC answering it. The full chronological ledger is in this
cycle's story-level report `report-afa769c6` (PASS, attempt 11); the rows below are the
subset that is load-bearing here.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-59 (`bundle-ab9e0cb6`) | free_and_reconciled | 2026-07-13 | Text-fill gradient stop positions | YES |
| REQ-61 (`bundle-ab9e0cb6`) | free_and_reconciled | 2026-07-16 | `--size` on both diff commands; `responsive-diff` | YES |
| REQ-62 (`bundle-ab9e0cb6`) | free_and_reconciled | 2026-07-16 | Panel/surface gradient: capture + render + diff | YES |
| BUG-15/16/22/24/25 (`bundle-4ff83a8b`) | free_and_reconciled | 2026-07-29 | All-collapse band fallback; capture-time font settling; surface-bearing box; modern-syntax scrim probe; per-text-node run geometry | YES — **swept into STORY-75 at attempt 7; no AC followed** |
| REQ-73 (`request-859652ae`) | free_and_reconciled | 2026-08-19 sweep | Adjacent-gap axis + retirement of band vertical padding | YES — **swept into STORY-75; no AC followed** |
| REQ-72 (`request-0698bbdf`) | free_and_reconciled | 2026-08-19 sweep | In-browser hexification of gradient stop colours | YES — **swept into STORY-76; no AC followed** |
| REQ-64 (`request-07d0e3e1`) + REQ-76 (`request-3a11304d`) | free_and_reconciled | 2026-08-19 sweep | Noise audit, `--collapse`, Type-A/B order; `--clusters` | YES — STORY-116, **ACs authored, clean** |
| REQ-84 (`bundle-31e474b9`) / REQ-96 (`bundle-ee56a66e`) | free_and_reconciled | 2026-07-20 / 07-26 | Delete the semantic layout modules; `config` never aesthetic | YES (retires) |
| **REQ-114** (`request-3cd338cd`) | **free_and_reconciled** | **2026-07-31** | **Retires the module-level palette-role alias; a module colour is a `#hex` literal** | **YES (retires)** — pivotal for finding 9 |
| REQ-148 (`request-7ae3c2cc`) | ready_to_reconcile | 2026-08-18 | Behavior modules render in workerd; Astro leaves the render path | imminent — will retire STORY-79 §4 / AC-739 (info 11) |

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-75 (`story-d5de22a5`) — 14 ACs, 15 Description items | bundle-ab9e0cb6; bundle-31e474b9, bundle-cceaba25, **bundle-4ff83a8b**, bundle-ee56a66e, **request-859652ae** | **6 violations.** Items 1/3/4/6/7/8/10/13/14 covered (AC-629/630, 631, 632+713, 633, 711, 712+714, 715, 817, 818); item 11's *first* rule and its clamp covered by AC-815; item 12's backdrop indexing, three exclusions and full-bleed definition covered by AC-816. **Items 2, 5, 9 and 15 have no AC at all**, and item 11's second rule and item 12's colour probe are uncovered sub-rules. No orphan AC, no duplicate |
| STORY-76 (`story-82eb6908`) — 5 ACs (1 deprecated), 3 Description items | bundle-ab9e0cb6 (REQ-59 + REQ-62); **request-0698bbdf**; not reconciled against REQ-114 | **4 violations** — findings 7, 8, 9, 10. Item 1 covered (AC-634 + AC-635); item 2's *diff* half covered (AC-636). Its capture half, its resolver half, and the whole of item 3 are uncovered; AC-638 contradicts REQ-114 |
| STORY-77 (`story-16f2793c`) — 8 ACs | bundle-ab9e0cb6 (REQ-61, size-aware half) | **aligned.** Re-derived this cycle: in-scope 1→AC-639+AC-640, 2→AC-643, 3→AC-641/642/644 (all three fail-loud cases), 4→AC-647; AC-645 pins the shared viewport vocabulary. No gap, no duplicate |
| STORY-78 (`story-2c7069fe`) — 9 ACs | bundle-ab9e0cb6 (REQ-61, cross-size half) | **aligned.** Re-derived this cycle: table→AC-648, `--sizes`→AC-649, join-key + repeat alignment→AC-651, changed/steady + presence flips→AC-650, `--classify`→AC-652, `--json`→AC-655, `--out`→AC-721, two terminal-fails→AC-653/AC-654 |
| STORY-79 (`story-e15a19ef`) — 13 ACs | bundle-ab9e0cb6; bundle-31e474b9, bundle-cceaba25, bundle-15c1f647 | **aligned** on coverage. g1→AC-656+**AC-1290** (the derived-set discipline, authored at attempt 10), g2→AC-657/658/659/738, g3→AC-720, g4→AC-739, g5→AC-1013…1017. One exclusivity warning (12), one imminent-retirement note (info 11) |
| STORY-116 (`story-aaddb221`) — 5 ACs, all `pending` | request-07d0e3e1 (REQ-64), request-3a11304d (REQ-76) | **aligned** — the one story where the recent sweep *did* reach the AC surface. Items 1→AC-1285, 2→AC-1286, 3→AC-1287, 4→AC-1288, 5+6→AC-1289 (which carries the viewport-awareness/phantom-cause rule explicitly). One In-scope clause unpinned (warning 13) |
| AC-637 (`acceptance_criterion-377af866`) | REQ-62, superseded by REQ-84/REQ-96 | Deprecation of its *module-render* framing remains correct; but it was the only AC carrying the resolver behaviour (finding 10) |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | STORY-75 `story-d5de22a5` — Description item 2 | ac-add | **Per-text-node run geometry (BUG-25) has no AC.** The body states a specific two-branch rule: a run's box and glyph box are measured over *that text node* when its element holds more than one run, and off the element when it holds exactly one. Live at HEAD — `extract.ts:666` ("the painted extent of ONE text node, via a Range over that node") and `extract.ts:1101` ("two passes, because a run's geometry depends on whether its element…"). No AC among the 14 addresses run-level geometry; AC-629/630 are the extent *comparison*, which presupposes the box | Author an AC: an element split by `<br>`/wrapping yields one run per line each with its own rendered box; an element holding exactly one run measures off the element unchanged; two runs share an identical box only when their source elements genuinely occupy the same rect (so a fold cannot stack them at one coordinate, and `nowrapFromPx` reads each run's own line count) |
| 2 | violation | coverage | STORY-75 — Description item 5 | ac-add | **The surface-bearing box (BUG-22) has no AC.** Item 5 is one of the longest in the body and defines both a capture record and a diff resolution: a `surface` record carrying a `self` discriminator, the bearing box in document coordinates, its radius/shadow/border, resolved tightest-first over the same chain `surfaceFill` walks. Live at HEAD — `extract.ts:23-29` (the `surface?: SurfaceShape \| null` field, BUG-22-marked), `extract.ts:852-863`, emitted at `extract.ts:1179`. AC-631 covers `surfaceFill` (the *colour*) only; no AC covers *which box* paints it, nor the diff resolving `shape`/`border`/geometry against it | Author an AC covering both halves and the narrowness guard: a split control (label text node + sibling backing box) resolves shape/border/surface-geometry against the bearing box instead of reporting a phantom `radius 8px → 0px`; `self: true` on a self-painting element compares on its own axes unchanged; an ordinary run on its band raises no surface-geometry rows; a reproduction that genuinely lost its rounding still reports `shape`; a pre-`surface` bundle leaves the resolution inert |
| 3 | violation | coverage | STORY-75 — Description item 9 | ac-add | **Capture-time font settling (BUG-16) has no AC**, and the story is explicit that this is *not* the same closure as item 10: "item 10's diff-side suppression handles the residue the barrier cannot reach; the two are complements, not alternatives". AC-715 covers only item 10 (the diff-side FOUT direction). Live at HEAD — `extract.ts:369` (full font stack round-trip), `extract.ts:389-395` (`fontLoadedOf` building the full shorthand with real weight + style), `extract.ts:1152`. The story calls this "the capability's animating invariant defended at its source" | Author an AC for the three mechanisms: (a) the web-font barrier runs *after* page settle and force-loads each visible run's exact face (family, real weight, style, its own text), so a below-fold run is measured against the real face, and is bounded so a 404/timeout face cannot hang the capture and is honestly reported `fontLoaded:false`; (b) on the offline re-extraction path an absolute `http(s)` webfont URL whose basename is a mirrored asset is rewritten to loopback-relative and an extensionless CSS mirror is served as `text/css`; (c) the `fontLoaded` probe checks the real painted weight and style, not a bare size-and-family |
| 4 | violation | coverage | STORY-75 — Description item 11, **second** rule | ac-add | **The all-collapse body-spanning band fallback (BUG-15) has no AC.** AC-815 covers only the painted-extent rule and its clamp — its Verification exercises a collapsed header, an overflow-clipped carousel and an off-canvas block, none of which is the all-collapse case. The story states the two are independent: "the painted-extent rule repairs a band that exists but under-reports its subtree; the body-spanning fallback manufactures a band where the scan found none at all… neither subsumes the other". Live at HEAD — `extract.ts:469` and `extract.ts:1391`, both BUG-15-marked | Author an AC: when the top-level `>=8px` band scan finds no bands at all yet the body still paints, capture falls back to a single body-spanning band so runs/fields/item groups are still collected; assert an L1-style flat tree of absolutely-positioned leaves under one collapsed wrapper yields a non-empty actual-side manifest (the failure signature being a report byte-identical across two completely different renders); and assert the fallback stays dormant on a semantic multi-band page |
| 5 | violation | coverage | STORY-75 — Description item 12, the colour-probe clause | ac-add | **The browser-accepted-colour probe (BUG-24) is unpinned.** AC-816 covers backdrop indexing, the three exclusions and the full-bleed definition, and its Verification asserts "the scrim is still present as the band's overlay" — but pins **no colour syntax**, which is the entire content of BUG-24. The story: a modern-syntax veil (`color-mix(in oklab, …)`, `oklab()`, `oklch()`, `color()`) was unreadable to the legacy `rgba(...)` regex, so **every** such scrim was silently skipped and the band recorded `overlay: null`. Live at HEAD — `extract.ts:265` (BUG-24, exact-parse of the canvas *serialization*) and `extract.ts:1055` ("resolve the scrim through rgbaOf (the REQ-52 canvas probe), not a…"). AC-816's own translucent-fill exclusion **depends** on this: if the overlay is null the scrim is not "already recorded" and the exclusion drops it entirely | Author an AC: a band overlay authored in each modern syntax (`color-mix`, `oklab`, `oklch`, `color()`) is captured with its alpha preserved, not skipped; and the probe prefers the colour's lossless serialization over a painted pixel read-back, because painting a translucent fill stores premultiplied bytes and un-premultiplying loses up to a level per channel |
| 6 | violation | coverage | STORY-75 — Description item 15 | ac-add | **The adjacent-gap axis and the paired retirement of band vertical padding (REQ-73) have no AC** — neither the new axis nor the retirement. Live at HEAD — `fidelity.ts:459` maps `gap` to the `vertical spacing` cause with a `fix` disposition, and `fidelity.ts:301/386/417` treat `gap` as a counted (non-derived) axis whose downstream `position` shadow is demoted. This is a *comparison-coordinate* decision, which the story's Technical Context calls out as distinct from what is captured and explicitly owned by this capability | Author an AC (or two): paired elements are grouped into visual rows by *reference* y-overlap, the gap between consecutive rows is compared as a single `gap` delta (HIGH, default 6px / 16px under `--tolerant`), genuinely-overlapping rows are skipped, and one wrong gap yields exactly one delta rather than a cascade down the page; and separately that a section band's `paddingTopPx`/`paddingBottomPx` are still **captured but no longer compared**, while the band's `textAlign` comparison is unaffected |
| 7 | violation | coverage | STORY-76 `story-82eb6908` — Description item 3 | ac-add | **In-browser stop-colour resolution (REQ-72) has no AC.** Item 3 is a whole Description item added by attempt 10 and named in the In-scope line ("the in-browser resolution of gradient stop colours to hex on both the text-fill and panel capture paths"). It is the mechanism "that makes any stop capturable at all": a gradient authored with utility classes computes to `oklch()`/`oklab()`/`lab()`/`lch()`/`hwb()`/`color()`, the stop regex reads only `#hex` and `rgb()`, so the stop list parsed empty and the gradient captured as direction-only (`135° []`) — which reads as a **clean match against any reproduction**. That is the capability's animating invariant inverted, and no AC covers it | Author an AC: a gradient whose stops are authored in each modern colour space is captured with its stops resolved to `#rrggbb` before `normalizeGradient` parses them, with positions, keywords and direction left untouched; resolution is applied to **both** captured declarations (the `background-clip: text` gradient and the panel `surfaceGradient`); and a pre-REQ-72 bundle whose stops captured empty raises no delta rather than a false one |
| 8 | violation | coverage | STORY-76 — Description item 2, the "**Captured**" sub-bullet | ac-add | **Fifth cycle unrepaired** (`report-728bd245`, `report-cb7ea283`, `report-15f4892f` finding 4, `report-aec8af1b` finding 2). The In-scope line declares "capture of stop positions and surface gradients" and item 2 states a four-clause selection rule; **no AC covers it**. AC-636 covers only the *diff*, presupposing "a reference run sits on a panel/card whose surface is a gradient" without pinning how that surface was selected. Re-verified live at HEAD, `surfaceGradientOf` at `extract.ts:840` with the chain walk at `extract.ts:834-839` ("skipping a text-fill gradient… Stop at the first OPAQUE solid fill: a gradient hidden behind it never shows through"). This is the one place capture can be silently wrong in a way the diff **cannot** detect — pick the wrong ancestor and both sides agree on a value that is not what paints | Author one AC covering all four clauses: (a) for a run inside nested painting ancestors the recorded surface gradient is the **nearest** ancestor's; (b) an ancestor's `background-clip: text` gradient is **skipped** rather than recorded as the surface; (c) the walk **stops at the first opaque solid**, so a gradient hidden behind it records none; (d) a run with no gradient ancestor records none |
| 9 | violation | consistency | AC-638 `acceptance_criterion-a657c39c` (STORY-76) | ac-edit | **Fifth cycle unrepaired**; AC body still byte-unchanged. The Criterion advertises as **accepted** exactly what the validator **rejects**: "each stop colour an absolute hex **or a palette-role alias** — producing no validation error". **REQ-114** (`request-3cd338cd`, free_and_reconciled, 2026-07-31) retired the module-level palette-role alias. Re-verified independently at HEAD: `validateGradient` routes every stop through `validateColor` (`packages/framework/src/modules/validate.ts:130-134`), and `validateColor` accepts only `isColorLiteral` and errors otherwise (`validate.ts:101-107`), its doc comment reading "REQ-114 removed the palette-role alias — colour is the L1 palette model's now (DOC-23 §5)". **Note two stale in-code comments** (`validate.ts:131` "a bare colour string (hex/role)" and `validate.ts:167` "Absolute value (#hex) or a palette-role alias") — prose only; the executed path is hex-only. Not moot despite AC-637's deprecation: the gradient content-field type is live (`validate.ts:195`, `modules/types.ts:43`) | Narrow the accepted stop-colour form to a `#hex` literal only, and move the palette-role alias to the **rejected** side alongside the string/number cases already listed. Leave the direction clause untouched — `validate.ts:117-125` still accepts a degrees number or a direction alias exactly as the AC says. **The same stale clause sits in the STORY-76 body** (item 2, "Authored" bullet: "an absolute hex literal or a palette-role alias (absolute-or-overlay)") and must be edited with it, or this finding regenerates next cycle |
| 10 | violation | coverage | STORY-76 — Description item 2, the "**Authored**" sub-bullet + the In-scope line | ac-add | The In-scope line declares "the standalone gradient content-field value **and the shared resolver that authors it into a surface fill**". AC-638 covers the content-field *validation* half; the *resolution* half — direction + stops → a `background-image: linear-gradient(...)` declaration superseding the solid fill, and no fill when under-specified — was carried **only** by AC-637, which is now `lifecycle: deprecated`. So the story declares a live authoring half with no active AC. The resolver is live exported code at HEAD: `packages/framework/src/modules/text-style.ts:223`, re-exported from `modules/index.ts:9` and `framework/src/index.ts:33`. AC-637's deprecation is itself correct — its *title* asserts "a **text-block** … renders a padded, rounded panel", both a module REQ-84 deleted and the exact case the story's Out-of-scope line excludes | Author a resolver-scoped AC free of any module-render framing: calling `resolveSurfaceGradient` with a direction and ≥2 stops returns a `background-image: linear-gradient(...)` declaration carrying the resolved direction and stop colours in painted order, and returns an empty declaration (no fill) for a single stop. Stop colours must be `#hex` only — see finding 9; do **not** re-import AC-637's "or a palette-role alias" wording. See Notes for the alternative resolution |
| 11 | info | — | STORY-79 §4 / AC-739 `acceptance_criterion-fcf814b5` | — | REQ-148 (`request-7ae3c2cc`, **ready_to_reconcile**, 2026-08-18) moves behavior-module rendering to workerd and takes Astro off the render path, which retires "an Astro container is constructed only for pages that carry behavior modules". Imminent, not yet reconciled, so it does **not** count against this cycle. Recorded so the next ac cycle recognises the retirement rather than re-deriving it. (REQ-150, `free_coding`, would retire the same clause plus §2's bootstrap clause; neither reconciled nor `ready_to_reconcile`, so it does not count) | none — revisit when REQ-148 reconciles |
| 12 | warning | exclusivity | AC-656 `acceptance_criterion-3e4b0eab` + AC-1290 `acceptance_criterion-cf26bae1` (STORY-79) | ac-edit | AC-1290's Verification ends "Each registered member is separately proved to preserve `<slug>` as a positional in both flag orders" — which strictly subsumes AC-656 ("`--multi-viewport` keeps the site slug as a positional in either flag order"), `--multi-viewport` being a registry member. The story body supports the subsumption: "REQ-58 reported it through `--multi-viewport`, but the registry is the guarantee's whole surface." Same test shape, so this is genuine overlap rather than complementary evidence | Either fold AC-656 into AC-1290, or retain it explicitly as the **named REQ-58 regression instance** and say so in its Criterion. Retaining it is defensible — a named regression anchor for the originally-reported fault has value — so this is a warning, not a violation |
| 13 | warning | coverage | STORY-116 `story-aaddb221` — In-scope line, final clause | ac-add | The In-scope line ends "…and **the JSON shape of both views**", and Technical Context adds "Both views are available as JSON as well as text, so the collapsed defects and the ranked causes are scriptable rather than screen-only." None of AC-1285…1289 asserts a JSON payload; each verifies the text report's rows, groups, headers and ordering. STORY-79's AC-657 covers only that stdout carries a single document, not what `--collapse`/`--clusters` put in it — and the story body draws exactly that boundary ("this story owns what the payload *means*, not that it lands alone on stdout") | Extend AC-1286 and AC-1289 with a JSON clause, or author one AC asserting both views emit a machine-readable document carrying the same defect rows / ranked causes, widths sets and dispositions as the text view. Warning rather than violation: the five ACs cover the behaviour, and only its serialisation is unpinned |

## Notes for the Editor

**The dominant pattern is a one-sided repair.** Attempts 7–10 fixed this capability at
the *story* level — BUNDLE-10's five members, REQ-73, REQ-72 — and the story-level check
now passes. But a story-body edit that adds a Description item creates an AC obligation,
and none was discharged: STORY-75 gained four Description items and two sub-rules while
its AC count stayed at 14, and STORY-76 gained item 3 while its AC count stayed at 5.
Findings 1–8 are all one repair shape: **author the AC that the story-level sweep
implied**. An editor working this report should expect to add roughly 8–10 ACs and edit
one, not to rewrite story bodies.

**Findings 8 and 9 are the ones that will recur.** Both are now five cycles old and both
sit on STORY-76. Finding 9 in particular regenerates unless the **story body is edited
in the same pass as the AC** — the "or a palette-role alias" clause lives in both places,
and four previous cycles edited neither. If only AC-638 is narrowed, STORY-76's item 2
will still assert the retired alias and the next story-level cycle may well push it back.

**Finding 10 has a defensible alternative resolution.** I classified it `ac-add` because
STORY-76's In-scope line and the capability body both declare the resolver live ("The
authoring surface retained here is the legacy *module content-field* gradient and its
shared `resolveSurfaceGradient` resolver"), and the code exists and is exported. But
`resolveSurfaceGradient` has **zero production callers** — only re-exports — so an
operator could reasonably decide the authoring half is dead and retire it from the story
body instead (`story-body-edit`, leaving AC-637 deprecated and adding nothing). That is a
scope judgement above this level: the capability body was deliberately edited to retain
it, so I did not overturn it. Flagging so the choice is made once rather than oscillating.

**Two stale in-code comments, deliberately not filed as findings.**
`packages/framework/src/modules/validate.ts:131` ("a bare colour string (hex/role)") and
`:167` ("Absolute value (#hex) or a palette-role alias (the overlay)") both survive
REQ-114 as prose while the code they annotate is hex-only. They mislead exactly the way
AC-638 does and are probably why the AC has survived five cycles — but they are comments
in production code, not matrix elements, so they are out of scope for this check. Worth a
free-coded cleanup alongside the finding-9 repair.

**What is genuinely clean.** STORY-77, STORY-78 and STORY-116 need no work at this level,
and I re-derived each from its body rather than carrying the prior verdict. STORY-116 is
the counter-example worth noting: it is the one story where the 2026-08-19 sweep authored
ACs alongside the body, and it is the one story from that sweep with no coverage gap.
