---
uid: report-41fd4e05
id: REPORT-920
type: report
title: 'Capability-Intent Alignment: Framework Reproduction Module Treatments (level=ac)'
created_by: xgd
created_at: '2026-07-24T08:45:48.953812+00:00'
updated_at: '2026-07-24T08:45:48.953812+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-938f26ec
  level: ac
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: Framework Reproduction Module Treatments
# Level: ac

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

## Cumulative Intent Considered

Chronological ledger of intents that touched this capability (CAP-69):

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-6 (REQ-58+59+61+62) | free_and_reconciled | 2026-07-17 → 2026-07-19 | gigabytealchemy reproduction: delivered the repro treatments (card veil/tint, card border toggle, footer copyright/text/link-colour departures, compact placeholder-labelled / inline contact form) as per-module dials/content fields on `services-grid`, `contact-form`, `footer` (original ACs AC-674..681). | YES |
| BUNDLE-7 (REQ-63+79+82+83+84 +2, incl. REQ-85) | free_and_reconciled | 2026-07-22 | REQ-79 framework pivot. REQ-84 deleted `services-grid`/`footer` (and header/hero/text-block/layer + ~20 dials) → card/footer look re-homed to **L1 leaf axes** (per-node validated colour/border/opacity literals or overlay role). REQ-85 reframed `contact-form` into a **capability module** → treatments expressed via capability config + named L1 slots (submit/intro); field labelling becomes a vetted-core a11y obligation. Supersedes BUNDLE-6's delivery mechanism; preserves the treatments. | YES (supersedes delivery, preserves treatments) |

Both intents are `free_and_reconciled`, so both count. The current cumulative
intent = the reproduction treatments themselves, preserved, but authored through
the two surviving post-pivot surfaces: (a) L1 leaf axes for the card/footer look,
(b) contact-form capability config + L1 presentation slots for the form. The
old module-dial delivery (AC-674..681) is retired.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-82 (story-46e3b3c7, upgrade) | BUNDLE-6 (origin), BUNDLE-7 (updated_by) | aligned — body repoints the treatments from the deleted module dials to the two surviving surfaces; explicitly scopes out the L1 substrate and capability-module contract (owned by their own stories). |
| AC-718 (acceptance_criterion-f3328e22) | BUNDLE-7 (REQ-85) | aligned — asserts contact-form exposes no aesthetic dials (`fieldLabels`/`submitInline`/`submitColor`); submit look via L1 `submit` slot, intro framing via `intro` slot, field labelling as fixed a11y `<label>` obligation, typed `config` functional-only. Faithful 1:1 to the story's REQ-85 paragraph. |
| AC-719 (acceptance_criterion-da7c62ec) | BUNDLE-7 (REQ-84) | aligned — asserts card/band veil+border and footer copyright/textColor/linkColor overrides are authored as L1 leaf axes (literal or overlay role), envelope-constrained (hex-only, finite ranges, no freeform CSS). Faithful 1:1 to the story's REQ-84 paragraph. |
| AC-674..681 (archived) | BUNDLE-6 | correctly retired — verified absent from the active AC store, present only under `--archived`. Matches story body's "archived as superseded, not deleted". No lingering active superseded ACs. |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | consistency | STORY-82 / AC-718 | — | Story "I want" clause still promises "compact **placeholder-labelled** or single-row contact forms", while the Description + AC-718 establish that `fieldLabels=placeholder` is gone and programmatic `<label>` is now a mandatory a11y obligation ("not a styling toggle"). This is not a contradiction — the placeholder-labelled *visual* survives via a visually-hidden `<label>` + placeholder text — and the mechanism for it (L1 expressiveness) is explicitly scoped OUT of this story. Aligned; no repair required. | none (optional: AC-718 could state that the placeholder-labelled visual is preserved via a visually-hidden label + placeholder) |
| 2 | info | coverage | AC-718 | — | The former `submitInline` (single-row/inline layout) dial is subsumed under "submit look authored as L1 in the `submit` slot". The concrete inline-layout expressiveness lives in the L1 substrate, which the story explicitly scopes out. Coverage of the contact-form surface is complete at the story's granularity. | none |
| 3 | info | — | AC-674..681 | — | Correctly deprecated/archived; BUNDLE-7 (REQ-84/85) removed the host modules so the module-dial behaviours no longer exist in code. | none |

## Notes for the Editor

No drift between the AC-level matrix and cumulative intent. STORY-82 is an
`upgrade` that repoints the reproduction treatments from the retired module-dial
delivery (BUNDLE-6) to the two surviving post-pivot surfaces (BUNDLE-7):

- **AC-719** covers surface (a) — L1 leaf axes for the card veil/border and
  footer copyright/text/link-colour departures.
- **AC-718** covers surface (b) — contact-form capability config + named L1
  slots for the submit look, intro framing, and (a11y-obligated) field
  labelling.

Coverage is complete (both surfaces, every named treatment family), the two ACs
are mutually exclusive (disjoint surfaces), and each is internally consistent
with the story body. The eight superseded module-dial ACs (AC-674..681) are
correctly archived and absent from the active matrix.

The two `info` entries record a benign descriptive nuance: the story's
user-facing "I want" clause still names the "placeholder-labelled" and "inline"
*looks*, whose concrete expressiveness now depends on L1 — which this story
deliberately scopes out (deferred to the L1 Layout Substrate and Capability
Modules stories). Neither warrants a matrix edit at the AC level.
