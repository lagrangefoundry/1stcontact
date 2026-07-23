---
uid: report-e3913d26
id: REPORT-786
type: report
title: 'Capability-Intent Alignment: Capability Module Contract & Catalog (level=story)'
created_by: xgd
created_at: '2026-07-23T06:40:37.500573+00:00'
updated_at: '2026-07-23T06:40:37.500573+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-ce902be4
  level: story
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: Capability Module Contract & Catalog
# Level: story

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

Capability: CAP-72 (capability-ce902be4) — "capability-modules"
Anchor report: report-9260fc31
Story tree: exactly one story — STORY-85 (story-179b8c06), story_kind=feature, status=completed.

## Cumulative Intent Considered

STORY-85's `intent_uid` is BUNDLE-7 (bundle-31e474b9, status=free_and_reconciled,
merged_at_commit=edeb1c2c, 2026-07-22). No `updated_by` — no later intent has touched
the story. BUNDLE-7 aggregates seven source intents; only the framework-pivot subset
below pertains to this capability. The rest target other capabilities and are correctly
NOT expressed in this story tree.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-79 | free_and_reconciled (in BUNDLE-7) | 2026-07-22 | Umbrella framework pivot: L1 layout substrate + capability modules under a safety envelope. Blesses deletion of the pre-pivot layout modules as intentional supersession. | YES (umbrella) |
| REQ-84 | free_and_reconciled (in BUNDLE-7) | 2026-07-22 | Strip layout modules to L1; catalog reduces to carousel + contact-form. Context for this capability's "no layout dials remain". | YES (context) |
| REQ-85 | free_and_reconciled (in BUNDLE-7) | 2026-07-22 | **Direct originator.** Capability-module contract (config/slots/conformance + isolation), instance validation incl. slot-as-L1 security line, reframe carousel & contact-form, shipped client-JS asset, version bumps carousel v1→v2 / contact-form v2→v3. | YES (primary) |
| REQ-82 | free_and_reconciled (in BUNDLE-7) | 2026-07-22 | L1 substrate + safety envelope → CAP-70. Out of scope here (story marks STORY-83/CAP-70 out of scope). | YES but other capability |
| REQ-83 | free_and_reconciled (in BUNDLE-7) | 2026-07-22 | Capture→L1 fold → CAP-71. Out of scope here (story marks STORY-84/CAP-71 out of scope). | YES but other capability |
| REQ-86 | free_and_reconciled (in BUNDLE-7) | 2026-07-22 | End-to-end site reproduction (3-probe gate). Separate capability. | YES but other capability |
| REQ-63 | free_and_reconciled (in BUNDLE-7) | 2026-07-22 | Capture/diff CSS-axis coverage audit (measurement spine). Unrelated to capability modules. | YES but other capability |

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-85 | REQ-85 (primary), REQ-79 (umbrella), REQ-84 (strip-layout context) | aligned — body expresses the full REQ-85 ask; out-of-scope notes correctly fence off CAP-70/CAP-71 and the deleted pre-pivot layout modules |

### Coverage of REQ-85's asked behaviours by STORY-85 (all present)
- Contract = vetted core + typed config + named L1 slots + conformance + isolation → "exposes exactly three surfaces: config, slots, conformance" + isolation.
- Instance validation / slot-as-L1 security line → "every slot subtree must parse as a valid L1 node".
- Carousel reframe (scroll-snap/dots/a11y core, config slides-per-view/controls/autoplay/loop, slides→L1 slots, no layout dials) → present verbatim.
- Contact-form reframe (field schema/validation/submission/honeypot/Turnstile core, presentation→intro/submit L1 slots) → present.
- Conformance = 4 universal ACs + isolation → present.
- Shipped client-JS asset (self-contained client.js folded into one page-referenced capabilities.js; restores carousel autoplay/loop; migrates contact-form enhance.ts) → present.
- Version bumps carousel v1→v2, contact-form v2→v3 → present in Technical Context.
- "Behavior module ≠ XGD capability matrix" operator nuance → captured in the story's Divergence note (Option A slot-attachment seam).

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | consistency | STORY-85 | — | REQ-85's execution plan used working names `BehaviorMeta`/`validateBehavior*`; the delivered code and story settled on `CapabilityMeta`/`validateCapabilityConfig/Slots/Instance` (verified in packages/framework/src/modules/capability.ts, index.ts), aligned with the DOC-25 "Capability Modules" naming. This is naming convergence to the as-built state, not drift. | none |
| 2 | info | coverage | STORY-85 | — | Story's concrete claims independently verified in code: getModuleClientJs→capabilities.js (modules/styles.ts), carousel version:2 & contact-form version:3 (meta.ts), carousel/client.js & contact-form/client.js present. | none |

## Notes for the Editor

- Consistency: no story-body text references a retired feature; the pre-pivot layout
  modules (hero/text-block/services-grid/footer/header/layer) are correctly named only
  in the Out-of-scope section as superseded, matching REQ-79/REQ-84's explicit
  "intentional supersession, do not flag as overwrite" instruction.
- Coverage: complete. Every reconciled REQ-85 behaviour is expressed in STORY-85;
  the other four bundle intents target CAP-70/CAP-71/other capabilities and are
  correctly absent from this tree.
- Exclusivity: trivially satisfied — a single story under the capability; no overlap possible.
- No intent in the ledger is ambiguous or silent about any behaviour claimed by the
  story, so there are zero needs_review items.
