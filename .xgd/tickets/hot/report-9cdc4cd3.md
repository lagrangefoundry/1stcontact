---
uid: report-9cdc4cd3
id: REPORT-922
type: report
title: 'UAT Coverage: Framework Reproduction Module Treatments'
created_by: xgd
created_at: '2026-07-24T08:56:42.640888+00:00'
updated_at: '2026-07-24T08:56:42.640888+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-938f26ec
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# UAT Coverage Assessment: Framework Reproduction Module Treatments

**Result**: PASS
**AC verdicts**: 2 pass, 0 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 1 pass, 0 fail, 0 stale, 0 needs_review
**Capability verdict**: pass

## Cumulative Intent Considered

The reproduction treatments (frosted card veil/border, footer copyright/text/link
colour departures, compact/placeholder/inline contact form) were originally
delivered as per-module dials on `services-grid`/`contact-form`/`footer` (BUNDLE-6,
gigabytealchemy reproduction). The REQ-79 framework pivot re-homed them onto the two
surviving post-pivot surfaces, preserving the treatments while replacing the
mechanism. Both carrier intents are merged/reconciled.

| Intent | Status | Counts | Asked / changed |
|---|---|---|---|
| REQ-79 pivot (BUNDLE-7 / bundle-ab9e0cb6) | merged (merged_at_commit 7a42e182) | YES | Superseded bespoke per-module aesthetic dials with the L1 substrate + capability-module model |
| REQ-84 (via merged bundles) | merged | YES | Deleted services-grid/footer/header/hero/text-block/layer + ~20 dials; card veil/border + footer colour departures now owned by L1 leaf axes |
| REQ-85 (via merged bundles) | merged | YES | Reframed contact-form as a capability module; former aesthetic dials (fieldLabels/submitInline/submitColor) gone; submit/intro become L1 slots; field labelling stays a core a11y obligation |
| bundle-31e474b9 (updated_by) | merged (merged_at_commit edeb1c2c) | YES | Later reconciliation touching this capability; no retirement of the two active ACs |

Net cumulative intent: the treatments remain in-intent; the author mechanism is
(a) L1 leaf axes for card/footer look and (b) contact-form capability config + L1
slots for the form. The eight original dial ACs (AC-674..681) are archived as
superseded and are correctly not active on the story.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-82 | REQ-79, REQ-84, REQ-85 | aligned | Body documents the dial→L1 supersession explicitly; no unretired stale claim; old dial ACs archived, only AC-718/AC-719 active |

## Findings — Categorized by Editor Action

No violations, warnings, or needs_review items.

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| — | — | — | — | — | None | — |

AC and story detail:

- **AC-719** (card/band + footer treatments as L1 leaf axes) — ACTIVE per REQ-84.
  `test_UAT_AC719_card_and_footer_treatments_authored_as_l1_leaf_axes` substantively
  covers: asserts the module registry holds only carousel@2/contact-form@3 and that
  deleted modules throw; authors a frosted-card + colour-departed-footer L1 doc and
  drives the REAL `validateL1` + `renderL1Document`, asserting the emitted CSS/HTML
  (translucent surface literal, no border declaration, verbatim copyright, departing
  colour literals); confirms non-hex colour and freeform-CSS (unknown key) are
  rejected by the envelope. Real entry points, no internal mocking. → pass.
- **AC-718** (contact-form presentation via capability config + L1 slots) — ACTIVE per
  REQ-85. `test_UAT_AC718_contact_form_presentation_via_config_and_l1_slots`
  substantively covers: asserts config keys are exactly action/fields/successMessage
  (no aesthetic dials) and slots are exactly intro/submit; renders the REAL
  `ContactForm` Astro component via `AstroContainer` with an L1 subtree in the submit
  slot and asserts the mounted fragment + surface colour reach the output; confirms
  the plain baseline button when the slot is absent; confirms a programmatic `<label>`
  is bound to every field in both renders. Real SSR boundary, no internal mocking.
  → pass.
- **STORY-82** — body aligned; combined UATs prove the story's promise across both
  surviving surfaces. → pass.

## Notes for the Editor

- **No action required.** All active elements are covered by substantive UATs and the
  story body is aligned with cumulative intent.
- **Index-vs-reality discrepancy (tooling, not a coverage gap):** `.xgd/uat_index.json`
  marks both `test_UAT_AC718_*` and `test_UAT_AC719_*` as status `missing`, but both
  test functions exist and are substantive in
  `tests/reconciliation-reproduction-treatments.test.ts`. This is the known
  fresh-regression-worktree stale-index artifact (the gitignored index reflects
  phantom zero/`missing` run-state, not actual collection), not a real coverage gap.
  The substantive-coverage judgment above is made from reading the test bodies at
  their real boundaries. If a downstream consumer keys off the index run-status,
  rebuild the UAT index in this worktree rather than treating these as missing tests.
