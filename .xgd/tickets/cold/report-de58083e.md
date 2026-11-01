---
uid: report-de58083e
id: REPORT-799
type: report
title: 'UAT Coverage: L1 Layout Substrate + Safety Envelope'
created_by: xgd
created_at: '2026-07-23T07:56:58.883307+00:00'
updated_at: '2026-07-23T07:56:58.883307+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-ae9d65d6
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# UAT Coverage Assessment: L1 Layout Substrate + Safety Envelope

**Result**: PASS
**AC verdicts**: 7 pass, 0 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 1 pass, 0 fail, 0 stale, 0 needs_review
**Capability verdict**: pass

## Cumulative Intent Considered

The story's intent is BUNDLE-7 (bundle-31e474b9), status `free_and_reconciled`
(counts YES), which bundles REQ-63 + REQ-79 + REQ-82 + REQ-83 + REQ-84 + 2 more
and merged at commit edeb1c2c. The load-bearing intents for this capability:

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-79 | free_and_reconciled (via BUNDLE-7) | 2026-07 | Framework pivot: replaced the semantic layout modules with the single L1 substrate; deleted per-breakpoint module dials & navCollapse | YES |
| REQ-82 | free_and_reconciled (via BUNDLE-7) | 2026-07 | Founded L1: typed element tree, envelope validator, single safe renderer, geometry keyframes (interpolate\|snap), round-trip identity gate, cross-browser fidelity | YES |
| REQ-63 | free_and_reconciled (via BUNDLE-7) | 2026-07 | Capture/diff coverage spine reused by the round-trip gate (no new diff axes here) | YES |

No later intent retires any behavior in this capability. The one supersession —
STORY-81's per-breakpoint module dials — is re-homed into L1 geometry keyframes
(AC-684), and its duplicate AC-717 has already been collapsed into AC-684
(AC-717 archived, provenance folded in, duplicate test retired). No open
retirement action remains.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-83 | REQ-82, REQ-79, REQ-63 | aligned | Story body's promises (typed tree, validator envelope, single safe emitter, geometry keyframes, round-trip gate, cross-browser fidelity) are each supported by reconciled intent; slot-mounting & 3-probe gate are correctly deferred to REQ-85 / REQ-86 (separate stories, CAP-72/CAP-73). |

## Findings — Categorized by Editor Action

No findings. All 7 ACs are active per cumulative intent and each is
substantively covered by a real-entry-point UAT in
`tests/reconciliation-l1-substrate.test.ts`. The full suite was executed this
round: **7 passed, 0 skipped** (chromium/webkit/firefox present, so the
engine-gated round-trip and cross-browser probes genuinely ran).

| AC | Test | Entry point exercised | Verdict |
|---|---|---|---|
| AC-682 | test_UAT_AC682_valid_document_and_optional_primitives_accepted | `validateL1` on hero + each optional primitive (row/grid/hug, slot, relative-src image, visibility, snap track) | pass |
| AC-683 | test_UAT_AC683_type_a_axes_reproduced_and_text_present_at_all_widths | `captureL1` + `roundTripReport` on a real engine; asserts zero Type-A deltas & text present at all 6 widths | pass |
| AC-684 | test_UAT_AC684_interpolate_varies_continuously_and_snap_holds | `renderL1Document`; asserts emitted CSS interpolation calc() endpoints/continuity and that a snap track holds the lower keyframe (no calc) | pass |
| AC-685 | test_UAT_AC685_text_url_alt_and_fontfamily_payloads_are_neutralised | `renderL1Document` / `renderL1Page` with injection payloads in text/fontFamily/src/alt; asserts escaped, dropped, sanitised output | pass |
| AC-686 | test_UAT_AC686_envelope_boundary_is_the_range_not_the_property | `validateL1` with 12 distinct one-rule violations + in-range positive control (boundary is the range, not the property) | pass |
| AC-687 | test_UAT_AC687_multiple_violations_all_reported_with_path_and_message | `validateL1` with 3 simultaneous violations; asserts a per-field error list with document paths + messages | pass |
| AC-688 | test_UAT_AC688_no_layout_divergence_across_three_engines | `captureL1` across chromium/webkit/firefox; asserts projection per engine, content present, pos/width within tolerance, identical font-size | pass |

## Notes for the Editor

- **Evidence validity is strong.** No internal mocking; every UAT drives a real
  entry point (`validateL1`, `renderL1Document`/`renderL1Page`, `captureL1`,
  `roundTripReport`). The security AC (AC-685) and envelope AC (AC-686) exercise
  the actual emitter/validator against live payloads. No trivial existence
  checks and no source-text structural checks were found.
- **Engine-gated probes actually executed** this round (7 passed / 0 skipped),
  so AC-683 (round-trip) and AC-688 (cross-browser) are backed by real captures,
  not clean-skips. In a runner without the engines these skip by design, matching
  the ACs' own verification text.
- **One peripheral story-body clause considered and judged adequately covered:**
  "in L1 a `slot` renders as an inert labelled placeholder." A slot's *active*
  behavior (capability-module mounting) is explicitly deferred to REQ-85 (CAP-72);
  the inert-placeholder state is the *absence* of behavior and is exercised
  structurally by AC-682 (a slot validates and passes through the same renderer
  path tested in AC-685). No UAT gap is raised for it — testing "nothing happens"
  would not distinguish correct from incorrect implementations.
