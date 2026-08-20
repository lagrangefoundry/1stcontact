---
uid: report-af76ac2a
id: REPORT-2436
type: report
title: 'Capability-Intent Alignment: L1 Reproduction Pipeline: Fold & Acceptance Gate
  (level=ac)'
created_by: xgd
created_at: '2026-08-20T12:41:09.713919+00:00'
updated_at: '2026-08-20T12:41:09.713919+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-2049c9ec
  level: ac
  violations: 12
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: L1 Reproduction Pipeline: Fold & Acceptance Gate
# Level: ac

**Result**: FAIL
**Violations**: 12
**Warnings**: 1
**Needs review**: 0

The story level passed on its 13th attempt (`report-47677418`, 2026-08-20 12:33), and
attempts 7–12 were spent **enriching the two story bodies** until they described what
the code actually does. The AC tree never followed. Every violation below is the same
shape: a behaviour the story body names in its **In scope** clause, which is present
and verified in shipped code, and which **no AC under this capability mentions at all**.
This is the expected cascade — story-level repair lands in story bodies, and the ac
level is where the arrears come due — but the arrears are large: 9 of 12 are on
STORY-84.

No finding here questions a story body. The bodies are the working reference, as the
level cascade requires, and they were independently verified code-true one cycle ago.

## Cumulative Intent Considered

Chronological ledger of intents that touched this capability. Every one is
`free_and_reconciled`, so all count.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-66 | free_and_reconciled | 2026-07-18 | `adopt-values` (later superseded) | YES (retired by REQ-88) |
| REQ-74 | free_and_reconciled | 2026-07-18 | `adopt-gaps` — explicitly left untouched | YES |
| REQ-79 | free_and_reconciled | 2026-07-19 | Framework pivot: L1 substrate, absolute-base form | YES |
| REQ-88 | free_and_reconciled | 2026-07-21 | Capture bundle → servable, gate-able site; content column, height probe, no-wrap threshold, padding tracks, materialization | YES |
| BUNDLE-7 | free_and_reconciled | 2026-07-22 | REQ-63/79/82/83/84 + 2 — originating intent of both stories | YES |
| BUG-5 | free_and_reconciled | 2026-07-23 | Occurrence-index pairing; idempotency tests | YES |
| BUG-14 | free_and_reconciled | 2026-07-23 | Surface reconstruction: band → card → text hierarchy | YES |
| BUG-17 | free_and_reconciled | 2026-07-23 | Fold drops element padding | YES |
| BUG-18 | free_and_reconciled | 2026-07-23 | Per-width type tracks | YES |
| BUG-19 | free_and_reconciled | 2026-07-23 | Wrong surface fill — full-bleed bar seeding path | YES |
| BUG-20 | free_and_reconciled | 2026-07-23 | Pill / self-painting run | YES |
| BUG-21 | free_and_reconciled | 2026-07-24 | Control surface boxes double-apply padding | YES |
| BUG-23 | free_and_reconciled | 2026-07-24 | Reproduction hotlinks the captured origin — asset localization | YES |
| BUG-24 | free_and_reconciled | 2026-07-24 | Translucent scrim flattens to opaque | YES |
| REQ-96 | free_and_reconciled | 2026-07-26 | `control` node; controls bind to behavior modules | YES |
| BUNDLE-11 | free_and_reconciled | 2026-08-05 | BUG-27/REQ-94/96/97/98 + 10 — cross-gate verdict | YES |
| REQ-136 | free_and_reconciled | 2026-08-12 | Framing pair + colour-adjustment stack | YES |

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-84 (18 ACs) | BUNDLE-7, REQ-88, REQ-136, BUG-14/17/18/19/20/21/23/24 | **9 coverage gaps** — the AC tree covers BUNDLE-7's original fold surface plus REQ-136, but almost nothing REQ-88 and the BUG-14/17/19/23/24 line added |
| AC-689, AC-690, AC-692, AC-693, AC-695, AC-696 | BUNDLE-7, REQ-66 | aligned |
| AC-691 | BUNDLE-7, BUG-18 | partial — carries the responsive-track rule for **type** axes only; BUG-17's padding track is absent (finding 2) |
| AC-694 | BUNDLE-7 | aligned |
| AC-729, AC-730 | BUNDLE-7, REQ-136 | aligned |
| AC-731 | BUG-14, BUG-19, BUG-20, BUG-21 | partial — carries the majority-fill rule and the self-painting exception; the captured-rect adoption (findings 8) and the full-bleed bar path (finding 9) are absent |
| AC-732, AC-733 | BUNDLE-7, REQ-96 | aligned |
| AC-812 | BUG-24 (backdrop half) | partial — the backdrop lands, but BUG-24's scrim half is absent (finding 1) |
| AC-813 | REQ-96, REQ-88 | partial — seam + rebasing only; the derived behavioural config and its derivation-gap channel are absent (finding 7) |
| AC-814 | REQ-88 | aligned |
| AC-1133, AC-1134 | REQ-136 | aligned |
| — (no AC) | REQ-88 | **gaps**: content column (5), height probe/response (3), no-wrap threshold (4), materialization (6) |
| STORY-86 (16 ACs) | BUNDLE-7, BUNDLE-11, BUG-5, BUG-14, REQ-96 | **3 coverage gaps** on the sample-fidelity probe's report shape |
| AC-705 | BUG-5, REQ-96 | partial — pairing contract is complete; the `mounted` channel (10), the synthesized-surface exclusion (11) and the width-ladder-only oracle (12) are absent |
| AC-706, AC-707, AC-708, AC-709, AC-710, AC-724, AC-734, AC-735, AC-737 | BUNDLE-7, BUNDLE-11, BUG-5 | aligned |
| AC-736 | BUNDLE-11 | aligned, with one narrow gap (warning 13) |
| AC-852, AC-853, AC-854, AC-855, AC-856 | BUNDLE-11 | aligned — the cross-gate half is fully covered |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | STORY-84 | ac-add | **Translucent scrim.** In scope names "the band's translucent scrim carried on the section-background box (the image-or-scrim fold condition and its per-axis widest read)". Shipped at `tools/generate/src/l1/fold.ts:1246-1283` (BUG-24 fold-side half). No AC under this capability contains the word "scrim"; AC-812 covers only the backdrop image + fill. | Author an AC: a section folds when it paints an image **or** a scrim; the scrim rides on the same box as the background image; each of the two axes is read from the widest width carrying **it**, not both off one widest sample. |
| 2 | violation | coverage | STORY-84 / AC-691 | ac-add | **Per-side padding as a folded axis.** In scope names "per-side padding and the per-width scalar track any non-geometry axis earns by varying". Shipped at `fold.ts:544-560` (BUG-17) and `fold.ts:644-660` (padding tracks). AC-691 states the base-plus-track rule for **numeric type axes only**; no AC mentions padding. | Author an AC (or widen AC-691): a text/image/box leaf carries the per-side padding the reference painted; a side that varies across the ladder carries its own track; all-zero padding emits no axis. |
| 3 | violation | coverage | STORY-84 | ac-add | **Viewport-height probe pair and the measured height response.** In scope names it including "its section-edge and representative-row attribution rules". Shipped at `fold.ts:249-256` (`yFactor`/`heightFactor` from a measured box delta), `:1576-1578`, `:1687-1688` (card inherits its representative row's), `:1814`. No AC mentions viewport height, the probe pair, or either factor. | Author an AC: selected ladder widths are re-shot at a second viewport height; the pair folds to `{yFactor, heightFactor}` on geometry; the keyframe ladder skips the probe; a band takes its response from its section edges and a reconstructed card from its representative row; a response indistinguishable from zero emits no axis. |
| 4 | violation | coverage | STORY-84 | ac-add | **No-wrap threshold axis.** In scope names it. Shipped at `fold.ts:233` (`nowrapThreshold`) and `:1843`. No AC under STORY-84 mentions wrapping. AC-1009/1010/1011 (story-d0a8cfad, another capability) cover the **renderer's** consumption of the threshold, not the fold's derivation of it from the reference's line count. | Author an AC: the fold derives the width from which the reference stopped wrapping a run and emits it as the no-wrap threshold, so the reference's own line count survives across engines rather than being re-decided by per-browser rounding. |
| 5 | violation | coverage | STORY-84 | ac-add | **Recovered centred content column and column-anchored geometry.** The single largest uncovered block — story body lines 133–167, and In scope names "(container, inset and content cap) ... fitted per axis, with the capped extent, the keyframed inset fallback and the full-bleed refusal". Shipped at `fold.ts:335-540` (REQ-88). No AC mentions a content column or a column anchor. | Author AC(s): the column is fitted to reproduce every sampled origin and rejected unless all samples fit; a node anchors its left edge and its extent **independently**; a nested cap is admitted only on an over-determined fit at a plausible share of the column; where the offset has no closed form only the residual inset is keyframed and inherits the node's `segments`; a full-bleed element is never anchored. |
| 6 | violation | coverage | STORY-84 | ac-add | **Materialization into a servable site.** In scope names "(page document, mounted seams, asset localization with a hard failure on an unmirrored handle and a reported fold gap on a mirrored asset no node references, idempotent rebuild)". Shipped at `tools/generate/src/l1/assets.ts:31-112` (BUG-23, both halves). No AC mentions `1c repro`, materialization, or asset localization. | Author an AC: `1c repro <slug> --ref <bundle>` makes the folded document a servable site with its seams mounted; every media handle is rewritten to the bundle's mirrored asset; an unmirrored handle fails the run with a re-capture instruction rather than hotlinking; a mirrored asset no node references is reported as a fold gap; the verb is idempotent. |
| 7 | violation | coverage | STORY-84 / AC-813 | ac-add | **Capture-derived behavioural config and its derivation-gap channel.** In scope names the enumeration explicitly: "field list, each field's label and the reference-side placement of that label, each field's type, the endpoint, and the claimed submit button's wording ... with its distinct derivation-gap channel". Shipped at `tools/generate/src/l1/forms.ts:56-100` (`labelMode`, `action`, `submitLabel`, `residuals`) and `:212-253`. AC-813 covers only the seam rect and the control leaf's rebased geometry. | Author an AC: the seam's config is derived from the capture alone and the enumeration is complete; label placement comes from the a11y tree's name source; type falls back to control height; a missing endpoint takes the own-URL default and an unsafe URL is dropped — each recording a **derivation gap**, a channel distinct from the typed element residual of AC-733. |
| 8 | violation | consistency | AC-731 | ac-edit | **A reconstructed surface takes its rect from the element that painted it.** The story body (lines 74–92, added in attempt 12 and verified code-true at `fold.ts:1906-1921`) says the fold adopts the *captured* surface-bearing box. AC-731 instead says the backing box carries "the run's geometry (all four sides pinned)" — the arithmetic-over-runs model the body explicitly replaced. The band guard, the accent-bearer fallback and its precedence, the radius corollary and the rect-as-grouping-identity are all absent. | Rewrite AC-731's backing-box clause to adopt the captured surface-bearing rect; add the band guard (a viewport-wide surface is the band, never a card's rect), the accent-bearer fallback consulted only where no fill resolved, the radius-follows-resolved-surface corollary, and the rect as exact grouping identity with proximity arbitrating only unresolved rows. |
| 9 | violation | coverage | AC-731 | ac-add | **Full-bleed bar as a second band-seeding path.** In scope names "the full-bleed bar as a second band-seeding path"; story body lines 57–64 (BUG-19). AC-731 states only the majority rule ("the solid fill that the greatest number of runs sit on"). The dominant-gap discriminator that separates a space-between bar from an evenly-tiled card grid has no AC. | Add to AC-731 (or a sibling AC): same-fill untreated runs sharing a horizontal row whose union spans the full content width **and** whose largest internal gap dominates also seed a band; small even gaps keep a grid as cards; the majority rule is ordered first and still wins the page. |
| 10 | violation | coverage | AC-705 | ac-edit | **The `mounted` channel.** STORY-86's body says the probe reports **three** channels and In scope names "its ungraded-but-counted mounted-behaviour channel". Shipped at `tools/generate/src/l1/probes.ts:576-584, 621, 656, 710`. AC-705 describes a two-channel report (residuals, unmatched) and no AC in the capability contains "mounted". | Add to AC-705: oracle text whose box centre falls inside a behaviour slot rect is diverted to a third `mounted` channel — counted and surfaced, never graded; the diversion happens only on the text path; the verdict stays residuals-plus-unmatched, so mounted text can neither fail nor rescue a run. |
| 11 | violation | coverage | AC-705 | ac-edit | **Fold-synthesized backing surfaces are excluded from the non-text queue.** In scope names it explicitly. Shipped at `probes.ts:461` and `:671` (BUG-14's synthesized bands/section images/cards). AC-705's classifier list admits "painted surface boxes" as oracle samples with no counterpart rule on the **reproduced** side, so as written a synthesized surface would shift every real box leaf and report phantom deltas. | Add to AC-705: the non-text queue is built from **captured** non-text leaves only; a fold-synthesized backing surface never enters it (its source elements classify as text and are measured through their own text leaves); a genuine captured standalone surface still pairs. |
| 12 | violation | coverage | AC-705 | ac-edit | **Width-ladder-only oracle.** In scope names "its width-ladder-only oracle". Shipped at `probes.ts:526-540` — deduped on `(width, state)`, first projection at a key is the ladder. No AC mentions the height probe or the dedup; without it the measure would receive a second full set of oracle rows at an already-drained width and report every run as unmatched. | Add to AC-705: the oracle admits the width ladder only; a height-probe re-shoot of a ladder width at a second viewport height is deduped out — the gate-side counterpart of the fold's rule that the keyframe ladder skips the probe. |
| 13 | warning | coverage | AC-736 | ac-edit | STORY-86's body says of the two overlap-exempt leaf kinds: "**Both** remain subject to the horizontal-clip check — an exempt leaf that runs past the viewport is still reported". AC-736 asserts the clip retention for the **surface** box only; its slot clause ("Inert placeholder slots are likewise excluded from the overlap check") stops at the exemption. | Extend AC-736's slot clause so the clip-check retention is asserted for the slot as it is for the surface. |
| 14 | info | exclusivity | AC-729 + AC-1133/AC-1134 | — | AC-729's verification asserts "a non-default framing pair and a folded colour adjustment", which AC-1133 and AC-1134 then pin in full. This reads as deliberate layering — AC-729 owns the image leaf's shape, AC-1133/1134 own the admission rules and extend to painted surfaces — not as duplication. No action. | none |
| 15 | info | exclusivity | AC-705 + AC-724 | — | Both use the same three-repeated-labels fixture. AC-705 owns the pairing contract; AC-724 owns the idempotence identity (determinism under re-evaluation) that makes a clean AC-705 report falsifiable. Distinct claims, same fixture. No action. | none |

## Notes for the Editor

**The cross-cutting pattern.** The two halves of this capability are in very different
health. STORY-86's cross-gate block (AC-852 … AC-856, from BUNDLE-11) is fully covered
— those five ACs were authored with the story body and match it clause for clause. Its
three gaps are all inside one AC (AC-705), and all three are *report-shape* clauses the
probe already implements. STORY-84 is where the debt sits: **six behaviours REQ-88 and
the BUG-17/19/23/24 line added have no AC at all.** REQ-88 is named in the story body as
"the largest single intent shaping this fold", and of the five fidelity gaps it lists as
closed — per-width padding tracks, the no-wrap threshold, the centred content column, the
viewport-height probe, and the captured surface-bearing rect — **not one has an AC**.
Findings 2, 3, 4, 5 and 8 are exactly that list.

**Suggested order of work.** Findings 8 and 9 are edits to an existing AC (AC-731) and
findings 10, 11 and 12 are edits to an existing AC (AC-705); those five are the cheapest
and close both consistency defects. Findings 1, 2, 4 and 7 are single new ACs. Findings 3,
5 and 6 are the substantial ones — the content column (5) may warrant two ACs (the fit
itself, and the per-axis anchoring with its three refusal rules), since the story body
gives it two full paragraphs and the code gives it 200 lines.

**Nothing here is a `code-issue`.** Every behaviour named above was located in shipped
code and cited by file:line before being reported as a coverage gap; the defect is that
the matrix does not describe them, not that they are missing or wrong.

**No `needs_review`.** Every intent in the ledger resolved to `free_and_reconciled`, and
every finding traces to an explicit **In scope** clause in a story body that passed its
own alignment check one cycle ago. Nothing was ambiguous enough to escalate.
