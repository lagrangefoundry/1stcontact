---
uid: report-00cc392e
id: REPORT-937
type: report
title: 'Capability-Intent Alignment: End-to-End Reproduction Gate (3-Probe) (level=story)'
created_by: xgd
created_at: '2026-07-24T10:14:00.291216+00:00'
updated_at: '2026-07-24T10:14:00.291216+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-8108afab
  level: story
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: End-to-End Reproduction Gate (3-Probe)
# Level: story

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

## Cumulative Intent Considered

The capability CAP-73 (`capability-8108afab`) carries no direct `intent_uid`/`updated_by`
on the capability ticket itself; its intent anchor is its single story STORY-86
(`story-24098299`, `story_kind: feature`), whose `intent_uid` is the framework-pivot
reconciliation bundle **BUNDLE-7 (`bundle-31e474b9`)**. Within that bundle the direct
originating intent for this capability is **REQ-86** ("Framework pivot E: reproduce a
site end-to-end … 3-probe gate"), the "do last" end-to-end validation step of the pivot.

Chronological ledger of intents that touched this capability:

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-7 (bundle-31e474b9) — pivot reconciliation (REQ-63/79/82/83/84/85/86) | free_and_reconciled | merged @ edeb1c2c | The framework pivot: L1 substrate + safety envelope, capture→L1 fold + oracle, strip layout modules, capability-module contract, and (REQ-86) the end-to-end 3-probe reproduction gate | YES |
| └ REQ-86 (request-58e96ad1) — pivot E: 3-probe gate | bundled (inside reconciled BUNDLE-7) | delivered sha b7d32cce, v0.0.167 | Analytic browser-free layout evaluator; three probes (sample-fidelity vs oracle @6 widths / off-sample @500,900px / content-robustness); combined gate on absolute-base + structure-overlay; demand-driven promoteToFlow of only failing pinned groups; each residual = a framework gap | YES (direct anchor) |
| └ REQ-79 (request-87b26bca) — pivot umbrella | free_and_reconciled | in BUNDLE-7 | L1 substrate + capability modules (safety envelope); parent of the pivot | YES (context) |
| REQ-82 / REQ-83 / REQ-84 / REQ-85 (pivot B1/B2/C/D) | free_and_reconciled / bundled | in BUNDLE-7 | Sibling capabilities: L1 substrate+validator (CAP-70), capture→L1 fold+oracle (CAP-71), strip layout modules, capability-module contract — dependencies, NOT this capability's behavior | context only |
| BUG-13 (background-images not foldable) | draft/unlinked (no capability_uid) | 2026-07-23 | A gap in the **fold** (CAP-71), not the gate | NO (out of scope, not active) |
| BUG-15 (values-diff cannot read L1 pages) | draft/unlinked (no capability_uid) | 2026-07-23 | A gap in the **values-diff scoreboard**, a separate diff concern | NO (out of scope, not active) |

No later reconciled intent retires or modifies the 3-probe gate. REQ-86's behavior is
the current architecture; all of the story's claims are therefore active intent.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-86 (story-24098299) | REQ-86 (via BUNDLE-7, free_and_reconciled); REQ-79 pivot context | **aligned** — story body reproduces REQ-86's asks faithfully; deliberately-excluded items match REQ-86's own delivered scope; nothing retired or unsupported |

## Findings

_No violations, warnings, or needs_review items._

Detailed property check (all pass):

- **Consistency (story reflects cumulative intent)** — Every substantive claim in
  STORY-86 is directly supported by REQ-86: the analytic, browser-free layout
  evaluator mirroring the renderer's `interpolate|snap` geometry + CSS flow stacking +
  text natural-height estimation; the three probes (sample-fidelity vs the retained
  oracle at captured widths; off-sample envelope hold at intermediate widths;
  content-robustness under perturbation); the absolute-base / structure-overlay split;
  demand-driven `promoteToFlow` wrapping *only* the pinned sibling groups that fail
  content-robustness; and each residual naming a framework gap rather than a per-site
  patch. No text in the story describes behavior no intent supports, and nothing
  references a retired feature.

- **Coverage (story fully expresses intent scope)** — REQ-86's full reconciled ask
  (evaluator + three probes + combined gate + demand-driven recovery + diagnostic
  residuals) is expressed by this single feature story. The items STORY-86 places
  out of scope — the browser-backed `capture(render(L1)) ≈ L1` round-trip spine, the
  fold (CAP-71), the renderer/validator (CAP-70), and running the gate on any
  particular real site — align with REQ-86's own framing (it wires existing pieces
  behind the gate) and with the pivot's capability partition (CAP-70/CAP-71 are
  sibling capabilities). No reconciled intent behavior is left unexpressed.

- **Exclusivity (no two elements cover the same intent)** — CAP-73 has exactly one
  story; no overlap is possible at story level.

## Notes for the Editor

- The capability ticket carries no `intent_uid`/`updated_by`; the alignment anchor is
  the story's `intent_uid = bundle-31e474b9`. This is normal for pivot-era
  capabilities and is not itself a drift finding, but future checks should continue to
  resolve intent through STORY-86 → BUNDLE-7 → REQ-86.
- REQ-86 status is `bundled` while its enclosing BUNDLE-7 is `free_and_reconciled`
  (merged @ edeb1c2c). Treated as reconciled (the bundle is the operative merge unit).
- BUG-13 and BUG-15 (both 2026-07-23) touch the reproduction *pipeline* but belong to
  sibling capabilities (the fold and the values-diff scoreboard); both are unlinked to
  CAP-73 and are correctly out of this capability's scope. If either is later
  reconciled with a `capability_uid` pointing here, re-run this check.
