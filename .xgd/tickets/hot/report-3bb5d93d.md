---
uid: report-3bb5d93d
id: REPORT-2420
type: report
title: 'Fix L1 Reproduction Pipeline: Fold & Acceptance Gate (story) — attempt 7'
created_by: xgd
created_at: '2026-08-20T11:02:27.035320+00:00'
updated_at: '2026-08-20T11:02:27.035320+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-2049c9ec
  level: story
  fixes_applied: 5
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-2485c83c
---

# Fix Summary — L1 Reproduction Pipeline: Fold & Acceptance Gate (story)

**Attempt**: 7
**Fixes applied this call**: 3 ticket mutations, resolving findings 1, 2, 3 and 4
**Violations remaining**: 0 (all 3 violations addressed; 1 warning addressed; 1 needs_review forwarded)
**Needs more work**: false

All four actionable findings in `report-41a23f6e` were resolved in this call. The
only remaining item is finding 5, which the assessor categorised `needs_review`
(ownership decision for the operator) — it is forwarded below rather than guessed.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | story-body-edit | STORY-84 (`story-8acc338d`) | Finding 1 + 2. Added four new Description paragraphs after the "full language" bullet list: (a) **"What varies across the ladder becomes a track — not geometry alone"** — the general mechanism (any scalar axis that differs across sampled widths folds to its own per-width keyframe track; an axis holding one value everywhere stays a plain scalar read from the widest sample), naming the two families that use it today (type axes; padding sides) and stating that they are written as mirrors so the next responsive axis inherits the rule; (b) **padding as a folded axis** on text/image/box leaves (scalar + track for a varying side); (c) the **no-wrap threshold axis** pinning a run unbreakable from the width the reference stopped wrapping it; (d) the recovered **centred content column** as a document constant with column-anchored node geometry. Extended **In scope** with all four. |
| 2 | story-body-edit | STORY-84 (`story-8acc338d`) | Finding 1 provenance. Added two Technical Context bullets, placed with the existing REQ-136 provenance bullet: **REQ-88** (capture bundle → servable, gate-able site; the intent that surfaced the padding tracks, no-wrap threshold, centred column, and the use of the captured surface-bearing box for a reconstructed card) and **BUG-17 / BUG-18 / BUG-21** (dropped padding; widest-cell-only type axes; double-applied padding on control surface boxes). The BUG-18 bullet explicitly preserves widest-sample-as-base and frames the track as layered over it, not a replacement. |
| 3 | story-body-edit | STORY-86 (`story-24098299`) | Finding 3. Rewrote all five CAP-71 references as intra-capability story references — Out of scope ("the fold story, this capability's other half"), Technical Context dependency line, the fold-residual bullet, the occurrence-index-pairing bullet ("across this capability's two stories"), and the Dependencies plan-item-2 line ("the fold story within this same capability, not an external dependency"). The story-level scope split is preserved verbatim; only the claim that the fold is a *different capability* is removed. Also retargeted the duplicate-text-pairing cross-reference from **CAP-72** (`capability-ce902be4`, "Behavior Module Contract & Catalog", `deprecated`) to **CAP-63** (`capability-aa030c83`, "1c Capture & Diff Fidelity", `active`), naming its ownership of the element-pairing rules. Verified: zero `CAP-71` / `CAP-72` occurrences remain in the body. |
| 4 | story-body-edit | STORY-86 (`story-24098299`) | Finding 4 (warning). Took the assessor's second option. Added a paragraph after the two mirrored-axis bullets stating that responsive scalar-track resolution lives in the same evaluator module but is **not** a third mirrored axis of the three probes — none of the three reads a non-geometry track, and its only caller is the browser-backed round-trip spine this story places out of scope. Stated so its presence in the module is not read as unowned probe behaviour. |
| 5 | ac-edit | AC-691 (`acceptance_criterion-304cae4c`) | Finding 2's paired AC repair, applied in the same call so the matrix is not left with a story body and an AC that disagree. Criterion now reads **base** typography axes from the widest present sample **plus** a per-width scalar track for an axis that varies (and explicitly no track for an axis that is constant across the ladder). Verification extended with the two matching assertions (varying font size → track matching captured values; constant type → no track). The finding flagged this for the `ac` cycle; applying it now leaves it correct either way and removes the transient inconsistency. |

## Evidence Consulted (each finding verified against code before editing)

| Claim | Verified at |
|---|---|
| `foldPadding()` + applications | `tools/generate/src/l1/fold.ts:552`, applied `:1856`, `:1984`, `:2026` |
| `responsivePaddingTracks()` → `node.responsivePadding` | `fold.ts:657`, applied `:1860`, `:1988`, `:2030`; doc-comment attributes REQ-88 and names itself a mirror of `responsiveTextTracks` |
| `responsiveTextTracks()` → `node.responsive` | `fold.ts:623`, applied `:1853`; doc-comment attributes BUG-18 and confirms "identical across the ladder stays single-valued" |
| `axes.nowrapFromPx` | `fold.ts:1838-1844`; schema `packages/site-schema/src/l1/schema.ts:983`; renderer `packages/framework/src/l1/render.ts:1948-1983` |
| centred column + `geometry.anchor` | `fold.ts:335-357` (`fitColumn`, REQ-88, fit rejected unless every sampled origin/extent reproduces); `geometry.anchor` set at `fold.ts:1695`, `:1821`; `document.column` at `schema.ts:1352` |
| captured surface box (BUG-21 / REQ-88) | `fold.ts:1317-1325` — `surfaceFrames` from the capture's `SurfaceShape.box`, "a measured fact, not something to re-derive" |
| `evalScalarTrack` sole caller | defined `tools/generate/src/l1/probes.ts:138`, exported `l1/index.ts:39`, only call site `l1/roundtrip.ts:130` |
| CAP-72 deprecated / CAP-63 active | `xgd ticket get capability-ce902be4` → CAP-72, `deprecated`, merged into `capability-ae9d65d6`; `capability-aa030c83` → CAP-63, `active` |
| CAP-70 still valid | capability list: CAP-70 is `active` (retitled "Framework Substrate: L1 Layout, Values & Behavior Modules") — the CAP-70 references in both stories are **not** stale and were left untouched |

## Code Edits (if any)

None this call. Every finding resolved as a matrix edit; no production behaviour
disagreed with intent.

## needs_review Items Forwarded

| Element | Assessor said | Operator decision needed |
|---|---|---|
| Finding 5 — `1c repro <slug> --ref <bundle>` (no owning story in any capability) | REQ-88 §1 asked for it; the command is live at `tools/generate/src/cli/index.ts:557`; a scan of all 31 stories finds no story expressing it. CAP-71's Scope enumerates fold / 3-probe gate / structure recovery and does not claim CLI packaging, while CAP-82 (Site Delivery) and CAP-89 (Site Materials) are plausible alternative homes | Decide the owning capability — CAP-71 as pipeline packaging (alongside AC-814's offline re-fold) vs a delivery/materials capability — then author the story or AC there. Not guessed here, per the assessor's own reasoning that guessing creates exactly the drift this check detects |

## Observations for the Downstream `ac` Cycle (not findings in this report)

- STORY-84 now states four behaviours that **no AC covers**. Its 18 ACs were listed
  and checked: none of AC-689…AC-1134 mentions padding, the no-wrap threshold, or
  the centred content column. AC-691 was extended (row 5 above) to cover the
  responsive-track half of finding 2, but padding tracks, `nowrapFromPx` and the
  column/anchor pair are candidates for `ac-add` at the `ac` level. They were not
  added here: an `ac-add` should be paired with a `uat-add` in the same call, and
  authoring three fold UATs is `uat`-level work.
- Finding 6 (info): CAP-71, STORY-84 and STORY-86 all carry `uat_coverage: fail`.
  Unchanged by this call and not graded at this level — recorded so the `uat` cycle
  does not read it as new.
- The assessor's note that the `intent_uid` / `updated_by` chain materially
  under-records this capability (3 tickets named vs ≥20 reconciled intents that
  shaped the code; all 34 ACs carry `intent_uid: None`) was **not** repaired here.
  Both stories carry a single scalar `updated_by`, so recording REQ-88 there would
  have displaced an existing attribution rather than added one. REQ-88 is instead
  recorded in STORY-84's Technical Context provenance list, per the finding's own
  suggested edit. Repairing the chain properly remains a separate matrix-hygiene
  task.
