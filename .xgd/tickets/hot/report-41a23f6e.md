---
uid: report-41a23f6e
id: REPORT-2419
type: report
title: 'Capability-Intent Alignment: L1 Reproduction Pipeline: Fold & Acceptance Gate
  (level=story)'
created_by: xgd
created_at: '2026-08-20T10:56:38.625070+00:00'
updated_at: '2026-08-20T10:56:38.625070+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-2049c9ec
  level: story
  violations: 3
  warnings: 1
  needs_review_count: 1
---

# Capability-Intent Alignment: L1 Reproduction Pipeline: Fold & Acceptance Gate
# Level: story

**Result**: FAIL
**Violations**: 3
**Warnings**: 1
**Needs review**: 1

Capability: `capability-2049c9ec` (CAP-71). Stories in scope: STORY-84
(`story-8acc338d`, fold) and STORY-86 (`story-24098299`, gate). Both
`story_kind: upgrade`, both `uat_coverage: fail`.

## Cumulative Intent Considered

The stories' own `intent_uid` / `updated_by` chains name only three tickets
(BUNDLE-7, BUNDLE-11, REQ-136). That chain materially under-records this
capability — see "Notes for the Editor". The ledger below was rebuilt from the
bug/request corpus plus the intent attributions carried in the implementation
(`tools/generate/src/l1/fold.ts`, `.../probes.ts`, `.../cli/gate.ts`).

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-7 (`bundle-31e474b9`) | free_and_reconciled | 2026-07-22 | Framework pivot: REQ-63/79/82/**83**/84/85/**86**. REQ-83 = capture→L1 fold + keyframes + oracle + hint extractor (→ STORY-84); REQ-86 = end-to-end 3-probe gate (→ STORY-86). Recorded `intent_uid` of both stories | YES |
| REQ-66 (`request-b94426f4`) | free_and_reconciled | 2026-07-18 | `adopt-values`; superseded by the fold (AC-696) | YES (retired) |
| REQ-88 (`request-7ff1bacd`) | free_and_reconciled | 2026-07-21 (completed 2026-08-05) | **L1 reproduction pipeline: capture bundle → servable, gate-able site.** `1c repro` / `1c l1-gate`; plus the fidelity fixes the first real reproduction forced (padding tracks, `nowrapFromPx`, centred content column + `geometry.anchor`, captured-surface card geometry, band edge clamping) | YES |
| BUG-5 (`bug-5b7153d2`) | free_and_reconciled | 2026-07-23 | Fidelity gate pairs text by string → stable identity + idempotence | YES |
| BUG-6 (`bug-b9eb2e3a`) | free_and_reconciled | 2026-07-23 | Fold must signal residuals, not drop | YES |
| BUG-7 (`bug-d18ad577`) | free_and_reconciled | 2026-07-23 | `evaluateLayout` row tiling | YES |
| BUG-8 (`bug-3aa2d0c9`) | free_and_reconciled | 2026-07-23 | Reflowed cell across a breakpoint (→ half-open intervals) | YES |
| BUG-9 (`bug-f983e8eb`) | free_and_reconciled | 2026-07-23 | `promoteToFlow` must recurse | YES |
| BUG-11 / BUG-19 / BUG-20 | free_and_reconciled | 2026-07-23 | Fold must carry surface fill / per-surface attribution / other box treatments | YES |
| BUG-12 (`bug-61f43435`) | free_and_reconciled | 2026-07-23 | Font faces reach the fold; resource table | YES |
| BUG-13 (`bug-5908809a`) | free_and_reconciled | 2026-07-23 | CSS background-images as foldable nodes (backdrops) | YES |
| BUG-14 (`bug-29b55835`) | free_and_reconciled | 2026-07-23 | Rebuild section-band → card → text hierarchy | YES |
| **BUG-17** (`bug-88dfa748`) | free_and_reconciled | 2026-07-23 | **Fold drops element padding** → node-level `padding` axis + `foldPadding()` | YES |
| **BUG-18** (`bug-5186fa0c`) | free_and_reconciled | 2026-07-23 | **Flat text axes single-valued at desktop** → per-width responsive scalar tracks emitted by the fold | YES |
| **BUG-21** (`bug-24975383`) | free_and_reconciled | 2026-07-24 | Control surface boxes double-apply padding → `cardPadding`/`cardOutset` deleted, captured `SurfaceShape` adopted | YES |
| REQ-90 / REQ-91 / REQ-92 | free_and_reconciled | 2026-07-23 | Resource table; full pixel-mover axis set; rebuild `foldToL1` to the full L1 language | YES |
| REQ-93 (`request-f26cbe32`) | free_and_reconciled | 2026-07-25 | L1 pages host behavior modules in slots (→ AC-813 seams/controls) | YES |
| BUNDLE-11 (`bundle-ee56a66e`) | free_and_reconciled | 2026-08-05 | 15 members incl. **REQ-94** (gate calibration → cross-gate verdict) and REQ-96 (`control` node). Recorded `updated_by` of STORY-86 | YES |
| REQ-136 (`request-8a132869`) | free_and_reconciled | 2026-08-12 | Image framing + colour adjustment fold (→ AC-1133, AC-1134). Recorded `updated_by` of STORY-84 | YES |
| BUG-15 / BUG-16 / BUG-22 / BUG-24 / BUG-25 | free_and_reconciled | 2026-07-23…25 | values-diff / capture-side | NO (CAP-63) |

Structural event: on **2026-08-05** the capability body records a consolidation
that merged `End-to-End Reproduction Gate (3-Probe)` (CAP-73, now `deprecated`)
into `Capture-to-L1 Reproduction Fold` (CAP-71, survivor). STORY-86 moved from
CAP-73 into CAP-71. Finding 3 is a direct consequence.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-84 (`story-8acc338d`) | REQ-83, REQ-90/91/92, REQ-93, REQ-136, BUG-6, BUG-11, BUG-12, BUG-13, BUG-14, BUG-19, BUG-20 | **gap**: REQ-88 and BUG-17/BUG-18/BUG-21 shaped the fold and are unexpressed (findings 1, 2) |
| STORY-86 (`story-24098299`) | REQ-86, REQ-94, BUG-5, BUG-7, BUG-8, BUG-9 | aligned on behaviour; **gap**: stale capability cross-references post-consolidation (finding 3); evaluator's third mirroring axis unstated (finding 4) |
| Capability body (CAP-71) | — | aligned; correctly records the 2026-08-05 consolidation |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | STORY-84 | story-body-edit | **REQ-88 (`request-7ff1bacd`, free_and_reconciled, completed 2026-08-05) is the single largest intent shaping this fold — 33 attributions in `tools/generate/src/l1/fold.ts` — and appears in neither STORY-84's body nor any of its 18 ACs.** Four folded behaviours it added are unexpressed: (a) per-side element `padding` folded onto text/image/box leaves — `foldPadding()` at `tools/generate/src/l1/fold.ts:552`, applied at `:1856`, `:1984`, `:2026` (BUG-17, `bug-88dfa748`, free_and_reconciled 2026-07-23); (b) **per-width padding tracks** — `responsivePaddingTracks()` at `fold.ts:654`, applied at `fold.ts:1860` as `node.responsivePadding`; (c) `axes.nowrapFromPx`, pinning a run unbreakable from the width the reference stopped wrapping it (`fold.ts:1842-1844`); (d) the recovered **centred content column** emitted as `document.column` with node geometry expressed via `geometry.anchor` (`fold.ts:335-355`; `packages/site-schema/src/l1/schema.ts:1352`). The story body's own "How a measured value becomes a typed axis" section enumerates the folded axis families in detail and omits all four. | Extend STORY-84's Description/In-scope to state that the fold carries per-side padding (scalar, plus a per-width track for a side that varies), the no-wrap threshold axis, and the recovered centred content column that node geometry anchors to. Add REQ-88 to the Technical Context provenance list |
| 2 | violation | coverage | STORY-84 | story-body-edit | **BUG-18 (`bug-5186fa0c`, free_and_reconciled 2026-07-23) made the fold keyframe non-geometry text axes per width; STORY-84 still describes keyframing as geometry-only.** The fold emits `node.responsive` — per-width tracks for `fontSizePx` / `lineHeightPx` / `letterSpacingPx`, but only for axes that actually vary across the ladder — via `responsiveTextTracks()` at `tools/generate/src/l1/fold.ts:623`, applied at `:1853`. STORY-84's body says only "a geometry keyframe per sampled width" and "each node carries its authored axes". Downstream, AC-691 (`acceptance_criterion-304cae4c`) states the widest-sample rule as the whole rule — "A node's authored typography axes are taken from its widest present sample (the desktop rendering)" — which is BUG-18's root-cause description verbatim ("`foldToL1` takes a text run's axes from the widest present cell only"). It remains true of the *base* axes but omits the tracks layered over them | Add to STORY-84's Description that a non-geometry text axis which varies across the ladder folds to its own per-width scalar track (static axes stay single-valued). Flag for the `ac` cycle: AC-691 needs `ac-edit` to state base-axes-from-widest **plus** the responsive track |
| 3 | violation | consistency | STORY-86 | story-body-edit | **STORY-86 still describes CAP-71 as an external capability, but CAP-71 is the capability it now lives in.** The 2026-08-05 consolidation recorded in `capability-2049c9ec`'s own History merged CAP-73 (now `deprecated`) into CAP-71. STORY-86 nonetheless (a) lists under **Out of scope**: "the fold itself, including which residuals it emits (CAP-71)" — declaring its own capability's other half (STORY-84) out of scope; (b) Technical Context: "the capture→L1 fold + retained oracle (CAP-71, plan item 2)"; (c) "(CAP-71 / the fold story)"; (d) "the fold decides *what* it cannot express (CAP-71)"; (e) **Dependencies**: "Plan item 2 — Capture → L1 Fold + Structural Hints (CAP-71)". Separately, the body attributes values-diff duplicate-text pairing to **CAP-72** — but `capability-ce902be4` (CAP-72) is "Behavior Module Contract & Catalog", `deprecated`; the element-pairing rules belong to **CAP-63** "1c Capture & Diff Fidelity" (`capability-aa030c83`), whose scope names "the element-pairing rules that decide which two elements are compared" | Rewrite the five CAP-71 references as intra-capability story references (STORY-84 / "the fold story"), keeping the story-level scope split intact but removing the claim that the fold is a *different capability*. Retarget the duplicate-text-pairing cross-reference from CAP-72 to CAP-63 |
| 4 | warning | coverage | STORY-86 | story-body-edit | STORY-86 states the analytic evaluator "mirrors the renderer on **two** axes that the naive model got wrong" (flow direction, breakpoint intervals). BUG-18 added a third mirroring obligation — `evalScalarTrack` (`tools/generate/src/l1/probes.ts:138`, exported via `l1/index.ts:39`), which resolves a responsive scalar track against the renderer's cascade. It is defined in the probes module this story owns, though its only current caller is `roundtrip.ts:130`, which STORY-86 explicitly places out of scope ("the browser-backed round-trip spine, separate). Ownership is therefore arguable, which is why this is a warning rather than a violation | Either add scalar-track resolution as a third mirrored axis in STORY-86's evaluator description, or state explicitly that it is exported for the round-trip spine and not part of the three probes |
| 5 | needs_review | coverage | STORY-84 / STORY-86 (neither) | — | **REQ-88 §1 asked for `1c repro <slug> --ref <bundle>` — "writes a site whose home page *is* the bundle's folded L1 document, and mirrors the bundle's assets into the draft", idempotent.** The command exists (`tools/generate/src/cli/index.ts:557`). A scan of **all 31 stories across every capability** finds no story expressing it. It is not obviously CAP-71's: the capability's Scope section enumerates the fold, the 3-probe gate and structure recovery, and does not claim CLI packaging — while CAP-82 (Site Delivery: Deploy & Public Serving) and CAP-89 (Site Materials & Starting Point) are plausible alternative homes. The behaviour is unambiguously **active** (reconciled intent + live code); only its *ownership* is unsettled, and guessing would create exactly the drift this check exists to detect | Escalate to operator: decide whether `1c repro` belongs to CAP-71 (pipeline packaging, alongside AC-814's offline re-fold) or to a delivery/materials capability, then author the story or AC there |
| 6 | info | — | CAP-71 + STORY-84 + STORY-86 | — | All three carry `uat_coverage: fail`. Not graded at this level; recorded so the downstream `uat` cycle does not read it as new | none |

## Notes for the Editor

**The `intent_uid` / `updated_by` chain cannot be used to build this
capability's ledger.** Both stories carry a single scalar `updated_by`
(STORY-86 → `bundle-ee56a66e`; STORY-84 → `request-8a132869`), and **all 34
acceptance criteria carry `intent_uid: None` and `updated_by: None`**. The
chain therefore names 3 tickets where at least 20 reconciled intents
demonstrably shaped the code. The ledger above was reconstructed from the
bug/request corpus and from the `REQ-`/`BUG-` attributions the implementation
carries in comments. Future runs of this check at any level should do the same
rather than trusting the chain — and repairing the chain would be a worthwhile
matrix-hygiene task in its own right.

**One cross-cutting pattern behind findings 1 and 2.** Both are the same
omission: STORY-84 describes the fold as *geometry is responsive, everything
else is a flat value read from the widest sample*. That was true at REQ-83, and
BUG-18 and REQ-88 each broke it — first for text axes, then for padding. The
fold now has a general "scalar axis that varies across the ladder becomes a
track" mechanism (`responsiveTextTracks` and `responsivePaddingTracks` are
explicitly written as mirrors of each other, `fold.ts:653-655`). The cleanest
repair is to state that mechanism once in the story body rather than to
enumerate the two axes families that currently use it, since the next axis to
adopt it would otherwise drift the same way.

**Finding 3 is a pure consequence of the 2026-08-05 consolidation and is
mechanical to repair** — no behavioural question is at stake, only which label
the fold half of this capability is referred to by. Note that STORY-84's
mirror-image reference is already correct: its Out-of-scope defers the gate to
"the 3-Probe Reproduction Gate **story**", a story-relative reference that
survived the consolidation intact. STORY-86's references are capability-relative
and did not.

**Not findings, checked and clear.** REQ-90's resource table is fonts-only in
both the matrix (AC-732, STORY-84 body) and the schema
(`l1ResourcesSchema` = `{ fonts }`, `packages/site-schema/src/l1/schema.ts:1326`),
so the story's font-only description matches the code — the image half of that
intent's title was never built and is not matrix drift. Exclusivity between
STORY-84 and STORY-86 is clean: each explicitly defers the other's half in its
Out-of-scope section, and the one shared mechanism (the fidelity probe
projecting the oracle through the fold's own element classifier) is attributed
in STORY-86 rather than duplicated.
