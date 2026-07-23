---
uid: report-599dc8fb
id: REPORT-849
type: report
title: 'Capability-Intent Alignment: 1c Values-Diff Fidelity (level=story)'
created_by: xgd
created_at: '2026-07-23T11:31:43.235472+00:00'
updated_at: '2026-07-23T11:31:43.235472+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-aa030c83
  level: story
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: 1c Values-Diff Fidelity
# Level: story

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

## Cumulative Intent Considered

CAP-63 carries no `intent_uid` of its own. Its sole story STORY-75 (`story_kind=upgrade`)
was created by BUNDLE-6 (`intent_uid`) and updated by BUNDLE-7 (`updated_by`). Both
bundles are `free_and_reconciled`. Only the values-diff-relevant source tickets in
each bundle map to this capability; the rest map to sibling capabilities (gradient,
responsive) or the framework-pivot L1 work.

| Intent ID | Bundle | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|---|
| REQ-58 | BUNDLE-6 | free_and_reconciled | 2026-07-17 | gigabytealchemy re-import pass 3; drove composited-fill (T5), accent-bar (item 4), geometry-aware values-diff | YES |
| REQ-59 | BUNDLE-6 | free_and_reconciled | 2026-07-17 | gradient stop positions — **maps to STORY-76, not this capability** | YES (other cap) |
| REQ-61 | BUNDLE-6 | free_and_reconciled | 2026-07-17 | responsive-diff N-way — **maps to STORY-78, not this capability** | YES (other cap) |
| REQ-62 | BUNDLE-6 | free_and_reconciled | 2026-07-17 | gradient panel fill — **maps to STORY-76, not this capability** | YES (other cap) |
| REQ-63 | BUNDLE-7 | free_and_reconciled | 2026-07-22 | coverage audit: enumerate + close every render-affecting CSS blind spot | YES |
| REQ-79/82/83/84/85/86 | BUNDLE-7 | free_and_reconciled / bundled | 2026-07-22 | framework pivot to L1 substrate — **not values-diff fidelity** | NO (other cap) |

Net cumulative intent for CAP-63 = **REQ-58 ∪ REQ-63**.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-75 | REQ-58, REQ-63 | aligned — see per-property notes below |

Per-property alignment of STORY-75's body:

| STORY-75 element | Intent | Outcome |
|---|---|---|
| Closure 1 — rendered-text extent (ratio) | REQ-63 impl | aligned |
| Closure 2 — composited surface fill | REQ-58 T5 (alpha compositing) | aligned |
| Closure 3 — box-border (width+colour+line-style, on runs too) | REQ-63 impl "Border cluster" | aligned |
| Closure 4 — duplicate-text pairing by position | REQ-63 (noise-audit dual) | aligned |
| Closure 5 — typography treatments (font-style/decoration/transform/variant/list-marker) | REQ-63 impl "Typography" | aligned |
| Closure 6 — element effects (backdrop-filter/blend/opacity/outline/pseudo/object-position) | REQ-63 impl "Effects"/"Media" | aligned |
| Closure 7 — fontLoad reverse-direction false-positive correction | REQ-63 (noise/false-positive side) | aligned |
| Out-of-scope: gradient axes | REQ-59/REQ-62 → STORY-76 | aligned (verified sibling story exists) |
| Out-of-scope: size-aware / viewport-ladder diff | REQ-61 → STORY-77/78 | aligned (verified sibling stories exist) |
| Deferred residual: glyph/icon shape hashing | REQ-63 deferred-residuals | aligned (exact match) |
| Deferred residual: per-side border colours / inline-SVG fill | REQ-63 deferred-residuals | aligned (exact match) |
| (absent) bar/rule geometry — height + offset | REQ-63 Why + Scope item 3 | **gap — see Finding 1** |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | coverage | STORY-75 (vs REQ-63) | story-body-edit | REQ-63 (free_and_reconciled) names **"Border/rule GEOMETRY (a bar's height + offset, not just width+colour)"** in its "Why" and Scope item 3 as a known blind spot. Code confirms the accent-bar axis (`borderLeft`, `extract.ts:370` / `values-diff.ts:779`) still captures `{widthPx, color}` only — no height/offset. This axis is closed in neither REQ-63's reconciled *Implementation* closures nor its deferred-residuals list, and STORY-75 omits it from both its axes and its deferred-residuals note. Every other REQ-63 residual is explicitly documented; this one is silently absent. | Add "bar/rule geometry (height + offset) — deferred; the accent-bar axis compares width+colour only" to STORY-75's deferred-residuals note, so the matrix honestly records the remaining blind spot instead of staying silent. |

## Notes for the Editor

- **Why warning, not violation:** REQ-63's post-reconciliation *Implementation* section is the authoritative record of delivered scope, and it dropped bar geometry from both closures and deferred residuals. So "cumulative intent as reconciled" does not mandate bar geometry as a delivered, matrix-expressible axis — STORY-75 does not *misstate* built behaviour (no over-claim), it merely under-documents one residual. This is a documentation-completeness fix, not blocking drift, hence it does not fail the level.
- **Why not needs_review:** the ledger is not silent — REQ-63 explicitly names bar geometry and the code unambiguously confirms it is absent. The only open question is deferred-vs-dropped, which the story-body-edit resolves without guessing at intent.
- **Corroborating context:** an operator-observed defect where an accent bar's width+colour matched but its height was ~2× wrong (the "hidden 2× bar") is exactly the class REQ-63's bar-geometry item targeted. The general box-height axis may catch some cases where the bar is the element's own border, but a pseudo-element / independently-sized bar would still evade it — worth a note if this residual is ever promoted to an axis. (Not asserted as a code bug here; flagged only to justify documenting the residual.)
- **Strong-alignment highlight:** STORY-75's 7 closures map 1:1 onto REQ-63's reconciled Implementation section, and its glyph-shape / per-side-colour / inline-SVG-fill deferrals are a verbatim match to REQ-63's own deferred-residuals list. The gradient (STORY-76) and responsive (STORY-77/78) out-of-scope carve-outs were verified to have real sibling stories. Exclusivity is trivially satisfied — CAP-63 has exactly one story.
