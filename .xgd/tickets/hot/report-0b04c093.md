---
uid: report-0b04c093
id: REPORT-3754
type: report
title: 'UAT Coverage: L1 Reproduction Pipeline: Fold & Acceptance Gate'
created_by: xgd
created_at: '2026-09-10T15:57:23.318561+00:00'
updated_at: '2026-09-10T15:57:23.318561+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-2049c9ec
  violations: 0
  warnings: 2
  needs_review_count: 0
---

# UAT Coverage Assessment: L1 Reproduction Pipeline: Fold & Acceptance Gate

**Result**: PASS
**AC verdicts**: 41 pass, 0 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 2 pass, 0 fail, 0 stale, 0 needs_review
**Capability verdict**: pass

This is attempt 8 (`previous_attempt_count: 7`). The capability carried
`uat_coverage: fail` while **all 41 ACs and both stories already carried
`pass`** — a stale aggregate, not a live gap. Every child verdict was
independently re-derived this cycle (not inherited from the prior pass), and
the evidence was executed rather than read. The capability field was the only
write required.

## What was verified, and how

1. **Test discovery did not use `.xgd/uat_index.json`** — it is empty
   (`{"acs": {}}`, stamped 2026-09-09T22:50), a known anchored-regex artifact
   against suite-prefixed vitest names. Relying on it would have produced a
   false all-zero gap report. The index was rebuilt by sweeping
   `test_UAT_AC<N>_*` occurrences across the tree and discarding matches inside
   `.xgd/tickets/**` (prior report bodies quote test names verbatim and
   otherwise pollute the map).
2. **Every one of the 41 ACs resolves to at least one named UAT.** No AC is
   uncovered; no AC's only match was a doc-comment reference. (Three apparent
   bare names — `test_UAT_AC733_`, `test_UAT_AC1133_`, `test_UAT_AC1134_` —
   are `test_UAT_ACnnn_*` glob references inside comments, and each of those
   ACs has a real, distinctly-named test.)
3. **The evidence was run.** 13 test files, **76 passed / 1 skipped**:
   - fold half (6 files): 29 passed, 1 skipped
   - gate half (7 files): 47 passed, 0 skipped
4. **Evidence validity was checked, not assumed.** The only mock usages across
   all 13 files are `console.log`/`console.error` spies (output capture), one
   `fetch` spy on the offline re-fold (asserting the origin is *not* re-hit —
   an external boundary and a negative control), and `neverDriver()` in the
   cross-gate suite, which is a browser-driver factory that **throws if
   called**, proving the browser-free signals run first. No internal component
   is mocked anywhere. Tests drive real entry points: `foldToL1`,
   `partitionProbes`, `promoteToFlow`, `threeProbeGate`,
   `sampleFidelityProbe` / `offSampleProbe` / `contentRobustnessProbe`,
   `cmdCapturePage`, `cmdRepro`, `cmdGate`, `cmdL1Gate`, `cli.run`,
   `validateL1`, `renderL1Document` — several over real temp-dir bundles.

## Cumulative Intent Considered

Neither the capability nor its ACs carry an `intent_uid`; the ledger is built
from the stories' `intent_uid` / `updated_by` chains (BUNDLE-7
`bundle-31e474b9`, BUNDLE-11 `bundle-ee56a66e`, REQ-136 `request-8a132869`) and
the REQ/BUG citations carried in the implementing source. REPORT-3742's ledger
(a full re-sweep of all 50 requests and 38 bugs in the store, one cycle ago)
was re-read and is carried forward — abridged here to the rows that gate an AC
verdict.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-66 | free_and_reconciled | 2026-07-18 | `adopt-values` pre-L1 reproduction command | YES (retired by REQ-83 → AC-696) |
| REQ-79 | free_and_reconciled | 2026-07-19 | Absolute-base (D1) reproduction form | YES |
| REQ-83 | free_and_reconciled | 2026-07-20 | The fold: keyframes + `interpolate\|snap` + visibility, oracle retention, advisory hint sidecar; dissolve `adopt-values` | YES |
| REQ-86 | free_and_reconciled | 2026-07-20 | 3-probe gate + demand-driven `promoteToFlow` | YES |
| REQ-88 | free_and_reconciled | 2026-07-21 | `1c repro` + `1c l1-gate`; captured surface rect as card identity; viewport-height response; responsive padding tracks; §2 `axes.nowrapFromPx` | YES |
| REQ-90 / REQ-91 / REQ-92 | free_and_reconciled | 2026-07-23 | Resource table; text pixel-movers; full-language fold + signalled residuals | YES |
| BUG-5 … BUG-9 | free_and_reconciled | 2026-07-23 | Occurrence-index pairing + idempotence; typed residuals; row tiling; half-open intervals; recursive region-aware promotion | YES |
| BUG-11 … BUG-14, BUG-17 … BUG-23 | free_and_reconciled | 2026-07-23/24 | Surface fill/gradient; font faces; background-image nodes; band→card→text reconstruction; per-side padding; responsive text tracks; dominant band fill; self-painting pill; padded control; `SurfaceShape`; `localizeAssets` | YES |
| BUG-24 (`bug-c50fdfcc`) | free_and_reconciled | 2026-07-24 (closed 2026-08-05) | Fold half: the section-background box carries `axes.overlay`; a section folds on image **OR** scrim | YES — now expressed (AC-1629) |
| BUG-27 / REQ-93 / REQ-94 / REQ-96 | free_and_reconciled | 2026-07-25/26 | Backdrop index; behaviour slots; cross-gate reconciliation; `control` node kind | YES |
| REQ-117 | free_and_reconciled | 2026-07-31 / 2026-08-07 | Nowrap captured width becomes a renderer floor (fold half → AC-1631) | YES |
| REQ-136 (`request-8a132869`) | free_and_reconciled | 2026-08-12 | Framing pair + colour-adjustment stack folded onto pictures and surfaces | YES (AC-1133 / AC-1134) |
| REQ-103 / REQ-114 | free_and_reconciled | 2026-07 / 2026-08-07 | Implementation notes in fold code, not asks of the fold | YES (silent — no AC implied) |
| REQ-154 | bundled | 2026-08-20 | Browser Rendering driver behind the existing headless seam | imminent — does not touch fold/probes |
| REQ-155 / REQ-156 / REQ-157 | draft | 2026-08-20 | Capture in workerd; sharp off the fidelity path | NO (draft) — correctly unexpressed |
| REQ-158 … REQ-166, BUG-36 … BUG-39 | draft / reconciled / bundled | 2026-08-23 … 08-31 | KB, ingestion, product ticket store, builder cloud defects | NO — none touches this pipeline |

Nothing reconciled after REQ-136 (2026-08-12) touches this capability. **No AC
in the tree describes behaviour a later intent retired**, so there are no
deprecations to make. **No AC describes behaviour the ledger contradicts**, so
there are no `ac-edit` findings. Every AC's behaviour traces to a
reconciled intent above — nothing fell to the BUG-1306 impact screen, because
nothing was intent-silent.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-84 (`story-8acc338d`, fold) | REQ-79, REQ-83, REQ-88, REQ-90, REQ-91, REQ-92, REQ-93, REQ-96, REQ-117, REQ-136, BUG-6, BUG-11, BUG-12, BUG-13, BUG-14, BUG-17, BUG-18, BUG-19, BUG-20, BUG-21, BUG-22, BUG-23, BUG-24, BUG-27, REQ-66 (retired) | **aligned, covered** | Every in-scope behaviour in the body maps to ≥1 AC with a passing UAT — see the walk below |
| STORY-86 (`story-24098299`, gate) | REQ-86, REQ-88 (`l1-gate`), REQ-94, BUG-5, BUG-7, BUG-8, BUG-9 | **aligned, covered** | Same walk; the evaluator's grid-as-stack approximation is covered inside AC-734's UAT |

### STORY-84 body-claim → AC → evidence walk (Step 2b, independent of AC roll-up)

Every behavioural promise in the body's own In-scope list, checked one by one:

| Body claim | AC | Evidence |
|---|---|---|
| One validated full-language L1 document | AC-689 | folds via real `cmdCapturePage`, asserts ≥2 leaf kinds + `validateL1`, and that an empty ladder **throws** rather than emitting a hollow doc |
| Raw ladder retained as oracle | AC-690 | `multistate.json` present; oracle widths ≡ `l1.widths` |
| Geometry keyframe per sampled width | AC-691 | keyframes vs captured boxes at 3 widths; text height omitted, box/image height pinned |
| interpolate / snap classification | AC-692 | — |
| Visibility rule from presence subrange | AC-693 | — |
| Advisory hint sidecar; document complete without it | AC-694, AC-695 | 2 of 3 AC-694 legs pass; the third is chromium-gated (see warning 1) |
| `adopt-values` superseded | AC-696 | real `cli.run` dispatch → exit 1 + "Unknown command", exported symbols gone, **and** a negative control that `adopt-gaps` still resolves |
| Image / box / text leaves, pixel-movers, font table | AC-729, AC-730, AC-732 | — |
| Reconstructed run surfaces, bands, cards, page base | AC-731 | 17 UATs — self-painting pill, padded control, captured surface rect, distributed bar → band, tiled grid → cards, three page-base fallback tiers |
| Typed residuals, opt-in channel | AC-733 | — |
| Backdrop in the background layer | AC-812 | — |
| Control leaves rebased to their form seam | AC-813 | — |
| Offline re-fold, oracle demanded | AC-814 | `fetch` spy asserts the origin is never re-hit |
| Framing pair / colour-adjustment stack | AC-1133, AC-1134 | spellings, per-function no-op skip, over-envelope clamp, unreadable form → nothing |
| Varying axis → track, constant → scalar | AC-1625 | both families (type + padding side) on **one element**; constant sides assert `toBeUndefined`; render asserts the mobile value in the base rule and the desktop value **absent** from it |
| Per-side padding insets, never inflates | AC-1626 | pinned box unchanged at all 6 widths; `box-sizing: border-box`; zero/absent padding → no axis |
| Height probe → measured response, never a keyframe | AC-1627 | no-probe case asserts `stripResponses(noProbe) == stripResponses(doc)` — byte-for-byte, so the probe contributed the height axis and nothing else |
| Bundle materializes as a servable site | AC-1628 | real `cmdRepro` over temp bundles; document equals the bundle's **modulo exactly the 3 rebound handles**; idempotence by full-tree snapshot; unmirrored handle throws; part-stale seam↔binding rejected both directions |
| Band scrim folds onto the section-background box | AC-1629 | — |
| Nowrap threshold is a width from the single-line suffix | AC-1631 | the dip case asserts 1280, explicitly `not.toBe(320)`; unmeasurable line count → axis absent; three runs resolve to three different widths, which a flag could not |

### STORY-86 body-claim → AC → evidence walk

Row tiling (AC-734, grid-as-stack inside it), half-open breakpoint intervals
(AC-735), backing-surface overlap exception still subject to clip (AC-736),
fold-residual channel kept distinct (AC-737), the three probes (AC-705 /
AC-706 / AC-707), pinned-box content overflow (AC-1630), non-vacuous combined
gate over the base/overlay split (AC-708), region-aware recursive recovery
(AC-709), diagnostic findings (AC-710), idempotence + per-occurrence fidelity
(AC-724), and the five cross-gate ACs (AC-852 … AC-856). No behavioural claim
in the body lacks an AC.

Two crux ACs were read in full rather than sampled, because a vacuous test
there would invalidate the whole gate:

- **AC-708** asserts *both* directions: the pinned base with no overlay
  **fails** (driven by content-robustness) and the same base with the overlay
  **passes**. A gate that always returned `pass` would fail this test.
- **AC-709** asserts three regions promote to three distinct paths with gaps
  `[60, 90, 60]` — a single-level promotion collapsing to `['0']` with one
  median gap is explicitly excluded — and that fidelity on the untouched base
  is unchanged by recovery.

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | uat | AC-694 | — (environmental) | `test_UAT_AC694_structural_hints_extracted_by_a_real_engine` is `it.skipIf(!HAS_CHROMIUM)` and skips in this sandbox — `chromiumAvailable()` is false for sandbox Mach-bootstrap reasons, not a missing browser. **Not a coverage gap**: AC-694's other two UATs pass and cover the sidecar's emission and its derivation from a real document. The gated leg is correctly authored | None. Do not rewrite the test to remove the gate — an unrun branch reporting as skipped is the intended shape |
| 2 | warning | ac | AC-1625, AC-1626, AC-1627, AC-1628, AC-1629, AC-1630, AC-1631 | ac-status | These seven ACs sit at `status: pending` rather than `active`. They were created by this regression's fix passes today; each is intent-grounded (BUG-18, BUG-17, REQ-88, BUG-23, BUG-24, REQ-86, REQ-88 §2 / REQ-117) and each carries a passing UAT. Cosmetic/structural, not a coverage gap | Transition the seven to `status: active` on the next structural pass so the tree does not read as half-drafted |

**Violations: 0. Blocking needs_review: 0. `needs_review-default`: 0.**

## Notes for the Editor

**The reports on file understate the current state — check dates before acting
on them.** Two artifacts will mislead a reader:

- **REPORT-3742** (the story-level alignment check, this morning) raises one
  violation and two warnings that are **all three now closed** by a later fix
  pass the same day (STORY-84 `updated_at` 15:48, STORY-86 15:37, versus
  REPORT-3742's subject state at 14:10). Specifically: BUG-24's scrim is now
  §"a **section-background** box … carrying two axes: the band's background
  photograph *and* its translucent **scrim**" with the image-OR-scrim trigger
  and the widest-width-per-axis read, plus the explicit boundary against the
  backdrop bullet's "opaque" — and it has its own AC (**AC-1629**) with a
  passing UAT. The nowrap threshold is §"The ladder also fixes where a run
  stopped wrapping", owned rather than ceded, with **AC-1631**. `1c repro` is
  named outright in the materialization paragraph and again in In-scope. **Do
  not re-open these.**
- **REPORT-2091**, the last UAT-coverage report on this capability, is from
  2026-08-16 and predates seven of the current ACs.

**The empty UAT index is the trap this capability keeps setting.**
`.xgd/uat_index.json` is `{"acs": {}}`. Any assessment that reads coverage out
of it gets 41 zero-coverage ACs and manufactures a fail. Rebuild the map by
sweeping test sources directly, and exclude `.xgd/tickets/**` — prior report
and comment bodies quote `test_UAT_AC*` names verbatim and will attach dozens
of phantom "files" to every AC. Fixing the indexer's anchored `^test_UAT_`
regex to tolerate suite-prefixed vitest names would retire this whole failure
mode.

**On the seven-cycle stall.** The prior loop was stuck on *story-body drift*
(the structural-validation axis), not on UAT coverage. The UAT evidence for
this capability has been in good shape throughout: real entry points, negative
controls, and discriminating assertions rather than existence checks. That
distinction is worth carrying forward — the two axes failed for unrelated
reasons and were being read as one standing failure.
