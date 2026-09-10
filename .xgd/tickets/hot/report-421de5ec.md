---
uid: report-421de5ec
id: REPORT-3744
type: report
title: 'Capability-Intent Alignment: L1 Reproduction Pipeline: Fold & Acceptance Gate
  (level=story)'
created_by: xgd
created_at: '2026-09-10T14:30:43.302694+00:00'
updated_at: '2026-09-10T14:30:43.302694+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-2049c9ec
  level: story
  violations: 0
  warnings: 3
  needs_review_count: 0
---

# Capability-Intent Alignment: L1 Reproduction Pipeline: Fold & Acceptance Gate
# Level: story

**Result**: PASS
**Violations**: 0
**Warnings**: 3
**Needs review**: 0

Capability: CAP-71 (`capability-2049c9ec`). Stories in scope: STORY-84
(`story-8acc338d`, the fold) and STORY-86 (`story-24098299`, the 3-probe /
cross-gate acceptance boundary). Both `story_kind: upgrade`, both
`intent_uid: bundle-31e474b9` (BUNDLE-7); `updated_by` REQ-136
(`request-8a132869`) and BUNDLE-11 (`bundle-ee56a66e`) respectively.

**This is attempt 9 (`previous_attempt_count: 8`). The loop has converged at the
story level.** REPORT-3742's one violation and two warnings were re-verified
against the current bodies *and* the live source — not taken on the fix report's
word — and all three are repaired. No new violation was found by the citation
sweep, the term sweep, or the exclusivity sweep.

## What was verified this cycle

| REPORT-3742 finding | Current body | Source it now matches |
|---|---|---|
| 1 (violation) — BUG-24's fold half (the band scrim) unexpressed | STORY-84 §section-background bullet (lines 54–64) carries the veil as a second axis of the one box, each axis read from the widest width carrying it, section folds on image **OR** scrim, plain band never gains a scrim; the backdrop bullet's "opaque" is now an explicit boundary (line 66–69); In-scope (190), Out-of-scope cedes the capture probe to CAP-63/STORY-75 (208–209); Technical Context (254–261). New **AC-1629** (`acceptance_criterion-e8bcef98`) | `fold.ts:1246-1252` (BUG-24 doc comment), `:1260` image-OR-scrim trigger, `:1281-1288` per-axis widest-width read, called `:2150`. The claim "a colour with its **own alpha**, not element opacity" is exactly `extract.ts:1047 overlayOf` — the scrim is resolved via `rgbaOf(...)[3]`, the background-colour alpha, not `opacity` |
| 2 (warning) — REQ-88 §2 `nowrapFromPx` ownership silent | STORY-84 §"The ladder also fixes where a run stopped wrapping" (112–123): a **width, not a flag**, the higher rung wins, an unmeasurable line count breaks the suffix; renderer half ceded in Out-of-scope to STORY-83 / AC-1010 (211–213) | `fold.ts:222-240` `nowrapThreshold` + `:215` `lineCountOf`, applied `:1843-1844`. The "one line at 1024 but two at 1280 → the higher rung" example matches the code comment verbatim in substance |
| 3 (warning) — materialization verb unnamed | `1c repro <slug> --ref <bundle>` named at line 167 and in In-scope at 197 | `cli/index.ts:293` usage, `:803` `case 'repro'`, `cli/repro.ts:95` `cmdRepro` |

Cross-pointer validity re-checked (a stale pointer is what finding 6 of
REPORT-3740 was): CAP-63 `capability-aa030c83` **active**; CAP-70
`capability-ae9d65d6` **active**; STORY-75 `story-d5de22a5` in CAP-63; STORY-83
`story-d0a8cfad` in CAP-70; AC-1009 / AC-1010 both **active** under STORY-83.
Every pointer STORY-84 carries resolves.

## Cumulative Intent Considered

Neither the capability nor any of its 39 ACs carries an `intent_uid`; the ledger
is built from the two stories' `intent_uid` / `updated_by` chains and from the
REQ/BUG citations carried in the implementing source (`l1/fold.ts`,
`l1/probes.ts`, `l1/forms.ts`, `l1/assets.ts`, `l1/roundtrip.ts`, `l1/index.ts`,
`cli/repro.ts`, `cli/gate.ts`). REPORT-3742's ledger was re-verified and is
carried forward unchanged; the rows in **bold** are new to this cycle.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-66 | free_and_reconciled | 2026-07-18 | `adopt-values` pre-L1 reproduction command | YES (retired by REQ-83; supersession stated, AC-696) |
| REQ-79 | free_and_reconciled | 2026-07-19 | Umbrella framework pivot; absolute-base (D1) reproduction form | YES |
| REQ-83 | free_and_reconciled | 2026-07-20 | The fold: keyframes + `interpolate\|snap` + visibility, oracle retention, advisory hint sidecar | YES |
| REQ-86 | free_and_reconciled | 2026-07-20 | 3-probe gate + demand-driven `promoteToFlow` | YES |
| REQ-88 | free_and_reconciled | 2026-07-21 | `1c repro` / `1c l1-gate`; surface attribution; captured surface rect; viewport-height response; padding tracks; §2 `nowrapFromPx` | YES — all expressed |
| REQ-90 / REQ-91 / REQ-92 | free_and_reconciled | 2026-07-23 | Resource table; text pixel-movers; full-language `foldToL1` + residuals | YES |
| BUG-5 … BUG-9 | free_and_reconciled | 2026-07-23 | Occurrence pairing + idempotence; residual signal; row tiling; half-open intervals; recursive promotion | YES |
| BUG-11 … BUG-14 | free_and_reconciled | 2026-07-23 | `surfaceFill`/`surfaceGradient`; font faces; background-image nodes; band→card→run reconstruction | YES |
| BUG-17 … BUG-23 | free_and_reconciled | 2026-07-23/24 | Per-side padding; responsive text tracks; dominant run fill; self-painting pill; padded control; `SurfaceShape`; `localizeAssets` | YES |
| BUG-24 (`bug-c50fdfcc`) | free_and_reconciled | 2026-07-24 (closed 08-05) | Two gaps: capture `overlayOf` (CAP-63/STORY-75) **and** the fold never carrying a captured scrim | YES — **now expressed** (was REPORT-3742 finding 1) |
| BUG-27 | free_and_reconciled | 2026-07-25 | Document-wide backdrop index the fold consumes | YES |
| REQ-93 / REQ-94 / REQ-96 | free_and_reconciled | 2026-07-25/26 | Behaviour seams; cross-gate reconciliation; `control` node kind | YES |
| REQ-97 / REQ-104 | free_and_reconciled | 2026-07-26/27 | Text `sizing` (a measure); per-width layout mode + wrapping row | YES — the *ask* is CAP-70's; see info 1 |
| **REQ-98** (`request-7e70b1db`) | **free_and_reconciled** | **2026-07-26** | **Uniform paint/surface axis group across node kinds. Cited at `l1/assets.ts:85` only as the reason ANY node may carry a `backgroundImageUrl`** | **YES — a CAP-70 substrate ask, no ask of the fold** |
| REQ-103 / REQ-114 | free_and_reconciled | 2026-07 / 08-07 | Gradient branch by name; colour axis `hex \| PaletteRef` | YES (silent — implementation notes in fold code, no behavioural ask) |
| **REQ-107** (`request-847b979f`) | **free_and_reconciled** | **2026-07-27 (closed 08-06)** | **`validateL1` must run on the *authoring* path. Its own gap statement is that the two existing call sites (`fold.ts:2148`, `probes.ts:902`) are already correct — the reproduction path was the one path that never bypassed the envelope** | **YES — the ask is CAP-70's authoring/validation path; this capability is the compliant reference, already stated in STORY-84 Technical Context ("an invalid fold is rejected")** |
| **REQ-109** (`request-2ea36591`) | **free_and_reconciled** | **2026-07-30** | **Document-relative asset URLs at the three renderer emission sinks (`framework/src/l1/render.ts`). States outright: "The authored L1 face does not change … no site definition was edited, so no reproduction ticket is disturbed"** | **YES — CAP-70 renderer; no ask here** |
| REQ-117 | free_and_reconciled | 2026-07-31 / 08-07 | Nowrap captured width as a renderer floor | YES — renderer half CAP-70 STORY-83 (AC-1009/1010); fold half now stated in STORY-84 |
| REQ-136 (`request-8a132869`) | free_and_reconciled | 2026-08-12 | Framing pair + colour-adjustment stack folded onto pictures and surfaces | YES |
| BUNDLE-7 (`bundle-31e474b9`) | free_and_reconciled | 2026-07-22 | Carrier: REQ-63/79/82/83/84/86 | YES |
| BUNDLE-11 (`bundle-ee56a66e`) | free_and_reconciled | 2026-08-06 | Carrier: BUG-27/REQ-94/96/97/98 + 10 more | YES |
| REQ-154 | bundled | 2026-08-20 | Browser Rendering driver behind the headless seam | imminent — does not touch fold/probes/gate |
| REQ-155 / REQ-156 / REQ-157 | draft | 2026-08-20 | Capture in workerd; sharp off the fidelity path; the fidelity surface | NO (draft) — correctly absent |
| REQ-158 … REQ-166, BUG-36 … BUG-39 | draft / bundled / free_and_reconciled | 2026-08-23 … 08-31 | KB, ingestion, product ticket store, builder cloud defects | NO — none touches this pipeline |

Swept independently this cycle, two ways: (a) every `REQ-N` / `BUG-N` citation
carried in all eight implementing source files (58 citations, 30 distinct
tickets) matched against the story tree — this is what surfaced REQ-98, the one
citation REPORT-3742's narrower four-file sweep did not reach; (b) a term sweep
of every request and bug in the store for `foldToL1` / `l1-gate` / `1c repro` /
`sampleFidelity` / `offSample` / `contentRobustness` / `promoteToFlow` /
`absolute-base` / `structural hint` / `fold.ts` / `probes.ts`, which surfaced
REQ-107, REQ-109 and REQ-143 as candidates not in the prior ledger. All three
were read and none makes an ask of this capability's stories. Nothing
reconciled after REQ-136 (2026-08-12) touches the fold, the probes or the gate.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-84 (fold) | REQ-79, REQ-83, REQ-88 (incl. §2), REQ-90, REQ-91, REQ-92, REQ-93, REQ-96, REQ-117 (fold half), REQ-136, BUG-6, BUG-11, BUG-12, BUG-13, BUG-14, BUG-17, BUG-18, BUG-19, BUG-20, BUG-21, BUG-22, BUG-23, BUG-24, BUG-27, REQ-66 (retired) | **aligned** — every prior gap closed and re-verified against source. One naming warning (1) |
| STORY-86 (gate) | REQ-86, REQ-88 (`l1-gate`), REQ-94, BUG-5, BUG-7, BUG-8, BUG-9 | **aligned** on every behaviour. Two warnings, both cosmetic-but-checkable (2, 3) |
| CAP-71 story tree as a whole | REQ-88, BUG-23, BUG-24 | Every operator verb, every probe, every fold axis in the source has a story owner. `l1/assets.ts` (`localizeAssets`) is STORY-84's materialization scope; `l1/roundtrip.ts` (REQ-82) is correctly ceded by STORY-86's Out-of-scope to the round-trip spine |
| STORY-84 ↔ STORY-86 | — | no exclusivity problem; each cedes the other's half explicitly |
| STORY-84/86 ↔ all 45 stories | — | swept for 18 pipeline-owning terms. `1c repro`, `3-probe`, `acceptance oracle`, `height probe`, `sample-fidelity`, `off-sample`, `content-robustness` occur only here. `scrim` also occurs in STORY-75 (capture probe), STORY-83 (the substrate axis) and three unrelated site stories; `cross-gate` also in STORY-85 (citing a measured number, not claiming ownership); `analytic evaluator` also in STORY-80/STORY-81 (naming it as a downstream consumer). All complementary, none duplicative |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | STORY-84 (`story-8acc338d`) | story-body-edit | The offline re-fold is described (lines 158–163) and listed In-scope ("the offline re-fold", line 196) but its operator verb is never named. The verb is `1c refold --ref <captureBundleDir>` (`cli/index.ts:296` usage, `:843` `case 'refold'`, `cli/repro.ts:230` `cmdRefold`). `grep -c "refold"` against the body of the *verb form* returns 0. This is the identical shape as REPORT-3742 finding 3 — which the operator accepted and attempt 8 repaired for `1c repro` — left unrepaired for the sibling verb in the same story | Name `1c refold` in the offline-re-fold paragraph or the In-scope list, alongside `1c repro` |
| 2 | warning | consistency | STORY-86 (`story-24098299`) | story-body-edit | STORY-86 names **no** operator verb at all, while owning two: `1c l1-gate --ref <bundle> [--json]` (the three probes — `cli/index.ts:301`, `:863`, `cli/repro.ts:277` `cmdL1Gate`) and `1c gate <slug> --ref <bundle>` (the cross-gate reconciliation — `cli/index.ts:307/309`, `:911`, `cli/gate.ts:431` `cmdGate`). The body says "a **single cross-gate verb**" (line 119 region) and "the same offline seams their own verbs expose" without ever naming one. Same shape as warning 1 and as the repaired REPORT-3742 finding 3 | Name `1c l1-gate` where the three probes are introduced and `1c gate` where the cross-gate verdict is introduced (or in the In-scope list) |
| 3 | warning | consistency | STORY-86 (`story-24098299`) | story-body-edit | STORY-86 cedes scope to **its own capability**: Out-of-scope reads "the fold itself, including which residuals it emits (CAP-71)" (line 152); Technical Context "the fold decides *what* it cannot express (CAP-71)" (184); Dependencies "the capture→L1 fold + retained oracle (CAP-71, plan item 2)" (158) and "Plan item 2 — Capture → L1 Fold + Structural Hints (CAP-71)" (226). Since the 2026-08-05 structural rebalance recorded in the capability body's own History, CAP-73 (`End-to-End Reproduction Gate (3-Probe)`, now **deprecated**) was consolidated into CAP-71 — so STORY-86 *is* CAP-71, and the fold is its sibling STORY-84, not another capability. The pointers were correct when written and went stale on consolidation; this is the same shape as REPORT-3740 finding 6 (the stale `(CAP-72)` pointer), which was accepted and repaired. Line 188 already reads "(CAP-71 / the fold story)", showing the intended disambiguation | Rewrite the four bare `(CAP-71)` cessions to name the sibling story — "the fold story (STORY-84)" — or "CAP-71's fold story, STORY-84". The Dependencies entries should read as intra-capability sequencing, not as an external capability dependency |

## Notes for the Editor

**Do not re-open REPORT-3742's three findings, or REPORT-3740's six.** All nine
were re-verified this cycle against the current bodies *and* the live source. The
scrim paragraph in particular is not merely present but correct in detail: its
claim that a scrim is "a colour with its **own alpha**, not element opacity" is
the precise semantics of `extract.ts:1047 overlayOf`, which reads
`rgbaOf(getComputedStyle(el).backgroundColor)[3]` and rejects `a === 0 || a === 1`
— element `opacity` is never consulted. A body that merely paraphrased the ticket
title could not have got that right.

**All three findings are cosmetic in the strict sense — no behaviour is
unexpressed and no behaviour is claimed that the code does not do.** They are
raised because this capability's loop stalled for seven cycles on exactly the
class of defect a term sweep over story bodies detects, and an unnamed verb and a
self-referential capability pointer are both invisible to one. Repairing them
costs four sentences and removes the bait for a future cycle to re-derive them.

**Not raised as findings, recorded for the ledger.**
- **Info 1 — REQ-97 / REQ-104 in the analytic evaluator.** `probes.ts:201`
  `constrainWidth` (a text leaf's declared measure narrows its paint width, which
  changes its estimated height) and `:241` `packRowLines` (greedy wrapping-row
  line packing) are evaluator behaviour that STORY-86 claims In-scope ("the
  analytic evaluator's flow model") but does not enumerate — its flow paragraph
  covers row tiling, stack stacking and conservative grid only. Held at **info**,
  not warning, and unchanged from REPORT-3740 and REPORT-3742: the *ask* is
  CAP-70's, and STORY-81 (`story-3569e1a4`, line 34) already states the
  one-cascade-two-consumers rule and names "the analytic layout evaluator behind
  the reproduction gate" as the second consumer. The cross-reference exists; it
  simply points the other way. An improvement, not a repair.
- **Info 2 — REQ-98, REQ-103, REQ-107, REQ-109, REQ-114** are each either a
  CAP-70 substrate/renderer ask or an implementation note carried in this
  capability's source for context. None asks anything of STORY-84 or STORY-86.
  REQ-107 is worth naming explicitly because its title ("Authored L1 bypasses the
  envelope validator") reads like an indictment of this pipeline and is the
  opposite: its own gap statement is that `fold.ts:2148` and `probes.ts:902` were
  the *only* two `validateL1` call sites in the tree.
- `uat_coverage: fail` still stands on the capability and on both stories. Per the
  level cascade that is a UAT-level signal, not evidence here. Five ACs under
  STORY-84 are `pending` (AC-1625…AC-1629, four from attempt 7 and AC-1629 from
  attempt 8) and have no UATs yet — that is the AC/UAT levels' work, correctly
  sequenced after this one.
- STORY-86's Out-of-scope correctly cedes the browser-backed
  `capture(render(L1)) ≈ L1` round-trip (`l1/roundtrip.ts`, REQ-82) to the
  round-trip spine. Verified that no probe or gate code path calls into it.
