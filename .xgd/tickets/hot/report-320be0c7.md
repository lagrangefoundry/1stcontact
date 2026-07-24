---
uid: report-320be0c7
id: REPORT-933
type: report
title: 'Capability-Intent Alignment: Capability Module Contract & Catalog (level=story)'
created_by: xgd
created_at: '2026-07-24T09:54:38.566365+00:00'
updated_at: '2026-07-24T09:54:38.566365+00:00'
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

## Cumulative Intent Considered

This capability (CAP-72 / capability-ce902be4) has a single owning story
(STORY-85), whose `intent_uid` is BUNDLE-7 (bundle-31e474b9). The capability
ticket itself carries no `intent_uid`/`updated_by`, and there is no other
story, AC, or `updated_by` chain pointing at additional intents — so the
intent surface for this capability is one bundle.

BUNDLE-7 (`REQ-63 + REQ-79 + REQ-82 + REQ-83 + REQ-84 + REQ-85 + REQ-86`) is
`free_and_reconciled` (merged_at_commit edeb1c2c). Of its bundled REQs, only
**REQ-85** ("Framework pivot D: capability-module contract + reframe carousel &
contact-form") is the intent for *this* capability. The siblings are owned
elsewhere and are correctly out of scope for STORY-85:

| Intent ID | Status | Asked / changed | Owns this capability? |
|---|---|---|---|
| REQ-85 | free_and_reconciled (via BUNDLE-7) | Capability-module contract (config/slots/conformance+isolation); reframe carousel & contact-form onto it; slot-as-L1 security line; shipped client.js asset | YES — primary |
| REQ-84 | free_and_reconciled (via BUNDLE-7) | Strip/delete pre-pivot layout modules to L1 | NO — L1 / STORY-80–82 upgrades; STORY-85 lists as out of scope |
| REQ-82 | free_and_reconciled (via BUNDLE-7) | L1 substrate + safety envelope | NO — CAP-70 / STORY-83 |
| REQ-83 | free_and_reconciled (via BUNDLE-7) | Capture→L1 fold | NO — CAP-71 / STORY-84 |
| REQ-86 | free_and_reconciled (via BUNDLE-7) | End-to-end 3-probe reproduction gate | NO — reproduction-gate story |
| REQ-79 | free_and_reconciled (via BUNDLE-7) | Framework-pivot umbrella | NO — umbrella; realised by B/C/D/E children |
| REQ-63 | free_and_reconciled (via BUNDLE-7) | Capture/diff CSS-axis coverage audit | NO — capture/diff capability |

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-85 (feature, completed) | REQ-85 (BUNDLE-7) | aligned — body reflects REQ-85's full cumulative ask; correctly scopes REQ-82/83/84/86 out |

## Findings

No violations, warnings, or needs-review items.

Consistency (story body ↔ intent), point-by-point vs REQ-85:

| REQ-85 ask | STORY-85 body | Verdict |
|---|---|---|
| Contract = vetted core + typed **config** + named **L1 slots** + conformance + **isolation** | "exactly three surfaces: config / slots / conformance" + isolation dimension | match |
| Reframe **carousel**: scroll-snap/controls/a11y core; config (view/controls/autoplay/loop); strip layout dials; slides→L1 slots | pure-CSS scroll-snap track, config drives slides-per-view/dots/autoplay/loop, repeated `slide` L1 slot, "no layout dials remain" | match |
| Reframe **contact-form**: field-schema/validation/submission/enhance core + config; labels/submit styling→L1 slots | field schema, a11y labels, honeypot+Turnstile, no-JS `<form method=post>` baseline, JSON-fetch enhancement; intro/submit L1 slots | match |
| **Slot-as-L1 security line**: each slot subtree must parse as valid L1 node | "every slot subtree must parse as a valid L1 node, so slot content can never smuggle raw HTML/CSS/JS past the L1 envelope" | match |
| **Shipped client JS** first-class asset (client.js → capabilities.js), restore autoplay/loop, migrate enhance.ts | "capability client behaviour is a first-class shipped asset… folds them into one page-referenced module script… closing a dev-path pipeline gap that had silently 404'd" | match |
| Module version bumps carousel v1→v2, contact-form v2→v3 | Technical Context: "carousel v1→v2, contact-form v2→v3" | match |
| Design decision: "behavior module" ≠ XGD capability matrix; Option A slot-attachment seam | Divergence note: framework runtime notion distinct from matrix; operator confirmed Option A (module wraps L1) | match |

Coverage: STORY-85 expresses REQ-85's entire in-scope surface (contract,
instance validation incl. security line, both survivor capabilities + their
observable behaviour, shipped client JS, isolation conformance). No REQ-85
behaviour is left unexpressed.

Consistency (no unsupported text): every behavioural claim in the story body
traces to REQ-85 (including its operator-confirmed scope escalations and the
client-JS correction). No references to retired features.

Exclusivity: single story — no intra-capability overlap possible.

## Notes for the Editor

Clean pass. The capability has exactly one owning story that mirrors a single,
fully-reconciled intent (REQ-85 via BUNDLE-7). STORY-85's explicit "Out of
scope" block is doing real work: it correctly hands REQ-82/83 (L1 substrate,
capture→L1 fold) and the deleted pre-pivot layout modules (REQ-84 → STORY-80–82
upgrades) to their owning capabilities, so there is no phantom coverage gap
against those bundled-but-not-owned REQs. No drift detected at story level.
