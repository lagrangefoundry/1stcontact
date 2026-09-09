---
uid: report-43e0f0f2
id: REPORT-3580
type: report
title: 'Capability-Intent Alignment: 1c Capture & Diff Fidelity (level=story)'
created_by: xgd
created_at: '2026-09-09T23:23:16.947669+00:00'
updated_at: '2026-09-09T23:23:16.947669+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-aa030c83
  level: story
  violations: 11
  warnings: 3
  needs_review_count: 0
---

# Capability-Intent Alignment: 1c Capture & Diff Fidelity
# Level: story

**Result**: FAIL
**Violations**: 11
**Warnings**: 3
**Needs review**: 0

Seven stories. The behaviour each story *does* describe is accurate against its
intents, and the two newest stories (STORY-124, STORY-125) are well-aligned to
REQ-154. The failure is dominated by **coverage**: eight reconciled intents whose
asked behaviour is live in production code inside this capability's own declared
scope are expressed in no story anywhere in the matrix. Three **consistency**
violations follow: one story still presents a superseded authoring half as live,
one story misfiles itself by capability numeral, and the capability body's own
Scope bullet 4 still asserts an Astro behaviour REQ-150 retired.

**Almost nothing has been repaired since the previous story-level cycle.**
REPORT-2096 (2026-08-16, 9 violations / 2 warnings) is the immediately prior
report. STORY-75, STORY-76, STORY-77 and STORY-78 all carry `updated_at`
2026-08-16T09:18 — the field writes that closed that cycle — and their bodies still
read exactly as REPORT-2096 described them. Every one of its findings was
**re-verified against the current worktree** at the file:line cited below, not
inherited. Findings 10 and 11 are **new this cycle**, both introduced by work that
landed after 2026-08-16 (BUNDLE-20 / REQ-150 and BUNDLE-22 / REQ-154).

## Cumulative Intent Considered

Stories record intent as *bundle* UIDs; the asks below are the REQ/BUG tickets those
bundles carry. Ordered by intent `created_at`. Every status below was read from the
ticket this cycle. No intent in this capability's tree is `abandoned`, `deprecated`
or `wont_fix`, so Step 2.5's stale-vehicle case does not arise anywhere here.

| Intent ID | Reconciled via | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|---|
| REQ-44 | BUNDLE-16 (bundle-15c1f647) | free_and_reconciled | 2026-07-03 | Tooling hygiene; fail loud on out-of-sync `node_modules`; per-command dependency preflight | YES |
| REQ-58 | BUNDLE-6 (bundle-ab9e0cb6) | free_and_reconciled | 2026-07-13 | gigabytealchemy pass-3; ladder-wide `--multi-viewport` values-diff (T2/A); boolean-flag + `--json` hygiene; composited surface fill; box border; duplicate-text pairing | YES |
| REQ-59 | BUNDLE-6 | free_and_reconciled | 2026-07-13 | Capture text-fill gradient stop positions | YES |
| REQ-61 | BUNDLE-6 | free_and_reconciled | 2026-07-16 | `--size` on both diff commands; `responsive-diff` N-way cross-size analysis + classifier | YES |
| REQ-62 | BUNDLE-6 | free_and_reconciled | 2026-07-16 | Panel/surface gradient: capture + render + diff | YES |
| REQ-63 | BUNDLE-7 (bundle-31e474b9) | free_and_reconciled | 2026-07-17 | Coverage audit: capture + diff every render-affecting CSS axis | YES |
| REQ-64 | (no bundle body cites it) | free_and_reconciled | 2026-07-17 | Noise audit: every values-diff delta must be a real visible difference; per-defect (not per-cell) aggregation | YES |
| REQ-72 | (no bundle body cites it) | free_and_reconciled | 2026-07-18 | Hexify modern colour spaces in-browser so gradient stops capture at all | YES |
| REQ-73 | (no bundle body cites it) | free_and_reconciled | 2026-07-18 | values-diff adjacent-`gap` axis + drop the band-padding deltas it supersedes | YES |
| REQ-76 | (no bundle body cites it) | free_and_reconciled | 2026-07-18 | values-diff cause clustering: ranked cause view + `--clusters` + dispositions | YES |
| REQ-78 | BUNDLE-7, plan item 9 | free_and_reconciled | 2026-07-19 | `aligned-crops`; its store-selection routing is STORY-79 guarantee 3 | YES |
| REQ-84 | BUNDLE-7 | free_and_reconciled | 2026-07-20 | Framework pivot C: delete the layout modules (hero/text-block/footer/header/layer) | YES (retires) |
| REQ-89 | BUNDLE-8 (bundle-cceaba25) | free_and_reconciled | 2026-07-22 | Silence 'Missing pages directory'; Astro container constructed only on demand | YES (later superseded by REQ-150) |
| BUG-10 | BUNDLE-8 | free_and_reconciled | 2026-07-23 | Capture must not record `list-style-type` for non-list elements | YES |
| BUG-15 | BUNDLE-10 / BUNDLE-11 | free_and_reconciled | 2026-07-23 | values-diff cannot read L1-rendered pages — stale/false 'missing' | YES |
| BUG-16 | BUNDLE-10 (bundle-4ff83a8b) | free_and_reconciled | 2026-07-23 | Capture reads computed styles before webfonts load — offline re-extract must reach the mirrored faces | YES |
| REQ-91 | BUNDLE-8 | free_and_reconciled | 2026-07-23 | Capture/axis families for pixel-movers (treatments, effects, blend, transform/mask) | YES |
| BUG-22 | BUNDLE-10 | free_and_reconciled | 2026-07-24 | values-diff mis-attributes split text+box controls (phantom radius delta) | YES |
| BUG-24 | BUNDLE-10 | free_and_reconciled | 2026-07-24 | Colour alpha not representable — translucent overlay/scrim invisible to capture | YES |
| BUG-25 | BUNDLE-10 / BUNDLE-11 | free_and_reconciled | 2026-07-25 | A multi-line text element splits into runs that all share one box | YES |
| BUG-27 | BUNDLE-10 / BUNDLE-11 | free_and_reconciled | 2026-07-25 | CSS background images and lazy-loaded media are not captured | YES |
| REQ-94 | BUNDLE-11 (bundle-ee56a66e) | free_and_reconciled | 2026-07-25 | Gate calibration — a clean value gate must not outvote a failing perceptual diff | YES (homed on STORY-86, CAP-71 — not a gap here) |
| REQ-96 | BUNDLE-11 | free_and_reconciled | 2026-07-26 | Behavior modules layout-agnostic: L1 `control` node; `config` never aesthetic | YES (retires) |
| REQ-150 | BUNDLE-20 (bundle-b3b7c399) | free_and_reconciled | 2026-08-18 | Launcher boots a plain Vite SSR server; Astro leaves the repository; render path names no build transform at all | YES (retires REQ-89's conditional-container form) |
| REQ-154 | BUNDLE-22 (bundle-8eef3846) | bundled | 2026-08-20 | Browser Rendering driver behind the existing `BrowserDriver` seam; self-origin fulfilment of our own gated preview | imminent — bundle is `free_and_reconciled`; treat as live |

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| CAP-63 (capability-aa030c83, body) | REQ-44, REQ-58, REQ-59, REQ-61, REQ-62, REQ-63, REQ-84, REQ-96, REQ-154 | **stale on REQ-150**: Scope bullet 4 still says the render path "constructs an Astro container only for a page that needs one" (finding 11). Scope bullet 1's axis enumeration omits findings 1–5; Scope bullet 3 omits the ladder-wide diff mode (finding 8); no Scope bullet covers deployed-runtime capture (warning 14) |
| STORY-75 (story-d5de22a5) | REQ-58, REQ-63, REQ-64 (partly), REQ-91, BUG-10, BUG-15, BUG-27, REQ-96 | aligned on those; gaps for REQ-73, BUG-22, BUG-24, BUG-25, BUG-16 (findings 1–5) and REQ-64's per-defect aggregation (finding 8) |
| STORY-76 (story-82eb6908) | REQ-59, REQ-62 | aligned on stop positions + surface gradients; gap for REQ-72 (finding 6); authoring half not reconciled against REQ-84 / REQ-96 (finding 9) |
| STORY-77 (story-16f2793c) | REQ-58 (ladder as input), REQ-61 (size-aware half) | aligned on the `--size` selector; treats the ladder-wide diff mode as pre-existing infrastructure that no story owns (finding 8) |
| STORY-78 (story-2c7069fe) | REQ-61 (cross-size half) | aligned |
| STORY-79 (story-e15a19ef) | REQ-58, REQ-78, REQ-89, REQ-44, REQ-150 | aligned — rewritten 2026-08-31 under bundle-b3b7c399 and now correctly carries REQ-150's unconditional form and its supersession of REQ-89. `fields.updated_by` still under-reports BUNDLE-7 provenance (warning 13) |
| STORY-124 (story-080c6036) | REQ-154 (browser-driving half) | aligned on behaviour; **misfiled by numeral** in its own Technical Context (finding 10) |
| STORY-125 (story-7fa314f5) | REQ-154 (self-origin half) | aligned |
| — (unhomed) | REQ-76 | gap: no story in any capability expresses it (finding 7) |
| — (unhomed) | REQ-58 T2/A + REQ-64 §3 | gap: the `--multi-viewport` diff mode and its collapsed reporting layer are owned by no story (finding 8) |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | STORY-75 (story-d5de22a5) | story-body-edit + ac-add | REQ-73 (free_and_reconciled, 2026-07-18) adds the values-diff adjacent-`gap` axis — pair elements into visual rows, compare the gap between consecutive rows, and drop the section band-padding deltas it supersedes. Re-verified live this cycle: `tools/generate/src/cli/capture/values-diff.ts:363` (`DeltaProperty` member under the REQ-73 banner), `:1127` (severity), `:1361` (band-padding superseded as the vertical-spacing signal), `:1530` (tolerance, default 6px / 16px under `--tolerant`), `:1953`. STORY-75 enumerates eleven closures; the gap axis is not among them, and none of its 14 ACs names it | Add the `gap` axis to STORY-75's captured/compared axis list, with its tolerance and the band-padding suppression it replaces |
| 2 | violation | coverage | STORY-75 (story-d5de22a5) | story-body-edit + ac-add | BUG-22 (free_and_reconciled, 2026-07-24) requires values-diff to resolve a split control's surface axes against the node that *bears* the surface. Re-verified: `values-diff.ts:137-144` (`ValueElement.surface`, "Absent on pre-BUG-22 manifests, which keeps the resolution inert"), `:752`, `:1275`, `:2103` ("BUG-22 — SPLIT CONTROL"), `:2151` (hairline re-read off the backing box). This is an element-pairing/attribution rule — CAP-63 Scope bullet 1 — while STORY-75 item 4 covers duplicate-*text* pairing only | Add a split-control surface-attribution closure to STORY-75's Description, with the back-compat note (absent on pre-BUG-22 manifests → inert) |
| 3 | violation | coverage | STORY-75 (story-d5de22a5) | story-body-edit + ac-add | BUG-24 (free_and_reconciled, 2026-07-24) requires the band overlay/scrim to be resolved through the canvas colour probe rather than a raw `rgba()` regex, so a veil computing to `color-mix(in oklab, …)` is not silently dropped. Re-verified: `tools/generate/src/cli/capture/extract.ts:265` (BUG-24 canvas-serialization parse), `:1055` ("resolve the scrim through rgbaOf (the REQ-52 canvas probe), not a regex"). STORY-75 item 9 *presupposes* this ("scrims already recorded as the band's overlay") but no story states the overlay axis is captured at all, or that it survives modern colour syntax | State the band-overlay capture axis explicitly in STORY-75, including the colour-space condition item 9's exclusion rule depends on |
| 4 | violation | coverage | STORY-75 (story-d5de22a5) | story-body-edit + ac-add | BUG-25 (free_and_reconciled, 2026-07-25) requires per-text-node run geometry — an element owning more than one run must not give every run the element's box. Re-verified: `extract.ts:676` (`textNodeBox`), `:1106-1124` (two-pass `runCounts`; `var ownRun = runCounts.get(el) === 1; var glyphs = ownRun ? renderedTextBox(el) : textNodeBox(n)`). STORY-75 item 1 describes the glyph-extent axis and its ratio comparison but not this recording condition, which its own In-scope line ("the conditions under which an axis records a value at all") claims | Add the multi-run condition to STORY-75 item 1: geometry off the element when it owns exactly one run, off the text node otherwise |
| 5 | violation | coverage | STORY-75 (story-d5de22a5) | story-body-edit + ac-add | BUG-16 (free_and_reconciled, 2026-07-23) requires a captured bundle to re-extract offline against its own mirrored faces, or every glyph metric is measured against the fallback and `fontLoaded:false` is persisted. Re-verified: `tools/generate/src/cli/capture/reextract.ts:50` (`rewriteMirroredRefs`), `:67` (BUG-16 comment), `:100` (applied when serving `rendered.html`). No story expresses it. STORY-75 item 7 additionally frames a reference `fontLoaded:false` as an accepted capture-side FOUT artifact, which reads as tension with BUG-16 having fixed its dominant cause | Add the offline-re-extract mirrored-reference rule to STORY-75's capture scope, and reword item 7 so tolerating residual FOUT is explicitly the remainder *after* BUG-16 |
| 6 | violation | coverage | STORY-76 (story-82eb6908) | story-body-edit + ac-add | REQ-72 (free_and_reconciled, 2026-07-18) requires gradient stop colours to be resolved to `#rrggbb` **in-browser**, because a Tailwind-authored gradient computes to `oklch`/`oklab`/`color()` the TS-side stop regex cannot parse — without it a card gradient captures angle-only with empty stops, i.e. the stop-position axis STORY-76 is built on has nothing to compare. Re-verified: `extract.ts:334` (`hexifyGradient`), applied at `:846` (surface gradient) and `:1132` (text-fill gradient). STORY-76's In-scope line reads "capture of stop positions and surface gradients" and excludes it by its own wording; none of its 5 ACs names it | Extend STORY-76's In-scope line and Description to cover in-browser colour-space resolution of stop colours as the precondition that makes stops capturable |
| 7 | violation | coverage | (no element — unhomed) | story-body-edit + ac-add | REQ-76 (free_and_reconciled, 2026-07-18) requires values-diff cause clustering: counted defects rolled into ranked causes with count, worst tier, representative elements and a fix/review/accept disposition, surfaced by `--clusters`. Re-verified: `tools/generate/src/cli/fidelity.ts:433` (`DefectCause`), `:457` (`CAUSE_MAP` taxonomy + dispositions), `:478` (`clusterDefects`), `:512` (`formatClusterReport`), `tools/generate/src/cli/index.ts:330` (usage), `:1035-1044` (`flags.clusters`). A store-wide grep of `.xgd/tickets/{hot,cold}` for the clustering vocabulary returns **no story file** in any capability | Add the cause-clustering view (taxonomy, dispositions, `--clusters`) to STORY-75, or author a story for the values-diff reporting surface |
| 8 | violation | coverage | (no element — unhomed; STORY-77 story-16f2793c is the nearest owner) | story-body-edit + ac-add | REQ-58 (free_and_reconciled, 2026-07-13) T2/A wired the *ladder-wide* values-diff: capture persists the reference across the viewport ladder, and `1c values-diff <slug> --ref <bundle> --multi-viewport` projects the served draft across that ladder, diffs cell-for-cell and reports worst-cell-first, terminal-failing on a bundle with no ladder. REQ-64 (free_and_reconciled, 2026-07-17) then adds `--collapse` — dedup to one row per DEFECT so the ×6-viewport multiplier stops inflating the count. Re-verified: `fidelity.ts:199` (`cmdValuesDiffMultiViewport`), `:242` (`formatMultiViewportReport`), `:318` (`collapseMultiViewport`), `index.ts:327-328` (usage + REQ-64 `--collapse`), `:1018-1044`. Expressed nowhere: STORY-77 owns only the caller-chosen `--size` path and calls the ladder "the multi-viewport capture landed under REQ-58" (input, not behaviour); STORY-78 owns the standalone `responsive-diff`; STORY-79 names `--multi-viewport` only as an argv-parsing case. The only other stories mentioning the term — STORY-84 (CAP-71, folds a ladder into L1) and STORY-83 (CAP-70, explicitly out of scope) — do not own the diff mode. CAP-63 Scope bullet 3 omits it too | Extend STORY-77 (or author a sibling story) to own the ladder-wide diff mode: ladder persistence at capture, cell-for-cell projection, worst-cell-first ordering, the stale-reference refusal, and the `--collapse` per-defect reporting layer; add it to CAP-63 Scope bullet 3 |
| 9 | violation | consistency | STORY-76 (story-82eb6908) | story-body-edit | STORY-76's user-story sentence and Description still present gradients as "authorable as a content value that resolves to a surface fill" via `resolveSurfaceGradient`, with no supersession note. REQ-84 (free_and_reconciled, 2026-07-20) deleted the layout modules and REQ-96 (free_and_reconciled, 2026-07-26) forbids aesthetic values in a module's config. Re-verified this cycle: `resolveSurfaceGradient` (`packages/framework/src/modules/text-style.ts:223`) has **zero production callers** — the only references are two re-exports (`packages/framework/src/modules/index.ts:9`, `packages/framework/src/index.ts:34`) and two test files (`tests/req62-gradient-panel.test.ts:9`, `tests/reconciliation-l1-one-colour-system.test.ts:33`). CAP-63's own body records exactly this supersession; the story body has not been brought into line | Mark STORY-76's authoring half as the superseded legacy module content-field path (matching CAP-63 Scope bullet 2), scoping the live story to capture + diff; AC-637 ("A text-block authored with a gradient panel renders a padded, rounded panel") names the deleted `text-block` host and needs `ac-deprecate` downstream |
| 10 | violation | consistency | STORY-124 (story-080c6036) | story-body-edit | **New this cycle.** STORY-124's Technical Context says "Filed under CAP-102 (1c Capture & Diff Fidelity), whose own scope statement already anticipates 'adding a browser-driving verb'". The parenthetical name and the quoted scope text are this capability's; the numeral is wrong — the story's `fields.capability_uid` is `capability-aa030c83`, whose `id` is **CAP-63**, and CAP-102 is the deployment capability the story is being distinguished *from*. CAP-63's own body records this as a defect it could not repair ("a confirm makes no content change … it will keep surfacing until a step permitted to edit story content corrects it to CAP-63"), and names it as the likely reason the STORY-124/125 pair surfaced as an overlap cluster at all | In STORY-124's Technical Context, change "Filed under CAP-102" to "Filed under CAP-63"; leave the parenthetical name and the quoted scope phrase unchanged |
| 11 | violation | consistency | CAP-63 (capability-aa030c83, body) | story-body-edit | **New this cycle.** Scope bullet 4 still lists, among the CLI-wide guarantees, "the render path constructs an Astro container only for a page that needs one". That is REQ-89's (free_and_reconciled, 2026-07-22) conditional form, which REQ-150 (free_and_reconciled, 2026-08-18) retired: STORY-79 guarantee 5 now states the guarantee **unconditionally** ("no source file reachable from any render names a build-transform specifier … and no such module resolves from disk") and guarantee 4 removes Astro from the repository outright. Re-verified: no `package.json` in the workspace declares `astro` (only `packages/framework/package.json:17` `@astrojs/markdown-remark`), and `tools/generate/package.json:23` declares `vite` directly. The capability body describes a mechanism that no longer exists | Replace the Astro-container clause in Scope bullet 4 with REQ-150's form — the launcher configures a plain bundler SSR server, and no render path reaches a build transform at all — matching STORY-79 guarantees 4 and 5 |
| 12 | warning | consistency | STORY-75, STORY-76, STORY-77, STORY-78, STORY-79 | story-body-edit | All five still name the pre-consolidation structure retired 2026-08-05. STORY-78: "Belongs to CAP-65 (1c Size-Aware Diffing)" — capability-18a822ac is `deprecated` and STORY-78's own `capability_uid` is capability-aa030c83. STORY-79: "Related capabilities: CAP-63 (1c Values-Diff Fidelity), CAP-65 …" — CAP-63 is its own capability, under its retired name; this survived the 2026-08-31 rewrite. STORY-77: "Generalizes CAP-63 (1c Values-Diff Fidelity)" — same-capability self-reference. STORY-76: "Sits alongside [[values_diff_fidelity]] (CAP-63)". STORY-75: "Belongs to capability **1c Values-Diff Fidelity**" — right UID, retired name. Carried unrepaired from REPORT-1643, REPORT-1721 and REPORT-2096 | Update all five to "1c Capture & Diff Fidelity" (CAP-63); replace references to CAP-64/65/66 with intra-capability references to the sibling story |
| 13 | warning | consistency | STORY-75, STORY-79 | story-body-edit (fields) | The `fields.updated_by` provenance chains under-report the intents these stories actually reconcile, which is what this ledger exists to prevent. STORY-79's body cites "Guarantee 3 reconciled from bundle-31e474b9 (BUNDLE-7), plan item 9, commit 09fa7cf5" while its `updated_by` is `bundle-b3b7c399` only (it lost `bundle-15c1f647` in the 2026-08-31 rewrite, despite still carrying guarantee 6 / REQ-44). STORY-75 reconciles REQ-63 (BUNDLE-7) while its `updated_by` lists only `bundle-cceaba25` and `bundle-ee56a66e`. Neither names BUNDLE-10 (`bundle-4ff83a8b`), the source of findings 2–5 | Restore `bundle-15c1f647` to STORY-79's chain and add `bundle-31e474b9` to both; add `bundle-4ff83a8b` to STORY-75's when findings 2–5 are repaired |
| 14 | warning | coverage | CAP-63 (capability-aa030c83, body) | story-body-edit | REQ-154's behaviour is expressed in the story tree (STORY-124, STORY-125), so this is not a story-level coverage gap — but the capability's four Scope bullets are all about the `1c` CLI spine and none of them mentions deployed-runtime capture. The two stories are placed only by the later "how a capture is taken is owned here" ownership rule, appended by overlap clusters 1 and 2. A reader working from Scope alone would conclude both stories are misfiled — which is precisely what the two overlap surveys did | Add a fifth Scope bullet for deployed-runtime capture (the injected browser seam, its session economics, and self-origin fulfilment of our own gated preview), so Scope and the ownership rule say the same thing |

## Notes for the Editor

**Findings 1–9 are REPORT-2096's findings 1–9, re-verified, not inherited.** Every
file:line above was read in this worktree during this cycle, and every intent status
and date above was read from the ticket. STORY-75/76/77/78 bodies are unchanged since
that report (`updated_at` 2026-08-16T09:18 on all four, the field writes that closed
the cycle). If the editor works this report, working REPORT-2096 and REPORT-1721 as
well would be redundant.

**What *did* change since 2026-08-16, and what it cost.** Two intents landed in this
capability: REQ-150 (BUNDLE-20, 2026-08-18) rewrote STORY-79, and REQ-154 (BUNDLE-22,
2026-08-31) added STORY-124 and STORY-125. Both story-level outcomes are good — STORY-79
now carries REQ-150's strictly stronger unconditional guarantee, and the two new stories
are the cleanest-aligned in the capability. But each left one artifact behind: REQ-150
updated the story and not the capability body (finding 11), and REQ-154's STORY-124 shipped
with the wrong capability numeral (finding 10). Both are single-clause edits.

**Finding 10 is already diagnosed for you.** CAP-63's own body, under "Overlap cluster 2",
records the STORY-124 numeral as a defect it was not permitted to repair and names it as
the likely cause of the cluster. This step is not permitted to edit content either; the
fix step is the first one that is.

**One systemic root under four of the eleven violations.** BUNDLE-10
(`bundle-4ff83a8b`, free_and_reconciled) appears as `intent_uid` or `updated_by` on
**zero** stories anywhere in the matrix. Findings 2, 3, 4, 5 (BUG-22, BUG-24, BUG-25,
BUG-16) are all BUNDLE-10 members. Its other members were partly rescued by BUNDLE-11
(`bundle-ee56a66e`), which *is* on STORY-75's `updated_by` — which is why BUG-27 is
covered and these four are not. BUNDLE-10's remaining members are worth re-walking
against CAP-70 and CAP-71 for the same hole.

**Three intents were reconciled with no bundle trail at all.** REQ-72, REQ-73 and
REQ-76 (all free_and_reconciled, all 2026-07-18) are named in no bundle body, and all
three are implemented and live in `tools/generate`. They fall between BUNDLE-6
(2026-07-17) and BUNDLE-7 (2026-07-22). Whatever set their status did not route them
through a bundle, so nothing downstream had an opportunity to story them.

**Finding 8 is the largest unowned surface in the capability.** It is the mode the
gigabytealchemy reproduction was actually driven with, and the mode whose reference
count every noise-audit decision was calibrated against. STORY-77 *mentions* the ladder
but explicitly scopes itself to a caller-chosen width, calling the no-flag path "the
pre-existing single-width (≈ desktop) path … unchanged".

**REQ-94 is not a gap here.** "Gate calibration — a clean value gate must not outvote a
failing perceptual diff" arrives via BUNDLE-11 and touches this capability's animating
invariant, but it is homed on STORY-86 (CAP-71), the correct owner under CAP-63's own
out-of-scope clause. No action.

**No `code-issue` findings.** Every gap above is the matrix failing to describe working
code, not code failing to do what the matrix describes. Every cited symbol was read in
the current worktree during this cycle.

**No `needs_review` findings.** Every intent in the ledger is `free_and_reconciled`
except REQ-154, which is `bundled` inside a `free_and_reconciled` bundle. No story or AC
in this capability names an `abandoned`/`deprecated`/`wont_fix` ticket as a delivery
vehicle, so Step 2.5's stale-citation case does not arise.

**Level scope.** The capability's `uat_coverage: fail`, STORY-75/77/79's `fail` and
STORY-76's `stale` are UAT-level facts and were not assessed here. Findings 1–8 will each
need ACs and UATs downstream once the story bodies carry the behaviour; the `ac-add` /
`ac-deprecate` halves are a forward signal, not an instruction to act at this level.
