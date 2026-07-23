---
uid: report-d7764c73
id: REPORT-802
type: report
title: Fix Framework Reproduction Module Treatments (story) — attempt 1
created_by: xgd
created_at: '2026-07-23T08:09:01.363107+00:00'
updated_at: '2026-07-23T08:09:01.363107+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-938f26ec
  level: story
  fixes_applied: 2
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-9260fc31
---

# Fix Summary — Framework Reproduction Module Treatments (story)

**Attempt**: 1
**Fixes applied this call**: 2
**Violations remaining**: 0
**Needs more work**: false

## The single violation

Finding #1 (violation, consistency, `story-body-edit` on the CAP-69 capability
body). The capability body presented, present-tense, the module-dial delivery
mechanism ("targeted authoring dials/content fields ... on the `services-grid`,
`contact-form`, and `footer` modules") and scoped itself to "the module
treatment surfaces themselves". REQ-84/REQ-85 (BUNDLE-7, free_and_reconciled,
2026-07-22) deleted `services-grid`/`footer` and reframed `contact-form` off
aesthetic dials — so that mechanism no longer exists. STORY-82 had already been
repointed; only the capability body had drifted (matching the assessor's
Alignment Ledger: STORY-82 aligned, CAP-69 body DRIFT).

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | story-body-edit (capability body) | CAP-69 (capability-938f26ec) | Rewrote body: module-dial delivery demoted to explicit BUNDLE-6 history ("Originally ... these were delivered as"); current mechanism now stated as (a) L1 leaf axes for the card veil/border/opacity + footer colour literals/overlay roles and (b) contact-form capability config + named L1 slots. Added explicit disavowal ("not bespoke per-module dials"). Preserved the CAP-67 absolute-or-overlay scope pointer and added L1-substrate / capability-module ownership pointers. Mirrors STORY-82's post-pivot framing. |
| 2 | field-populate (hardening) | CAP-69 (capability-938f26ec) | Populated `intent_uid=bundle-ab9e0cb6` (originating) and `updated_by=bundle-31e474b9` (pivot), per the report's Notes-for-the-Editor — so future drift checks can machine-trace the intent chain instead of only reaching it through STORY-82. |

## Not changed (intentionally)

- **STORY-82 (story-46e3b3c7)** — the assessor's ledger marks it aligned; it
  already documents the REQ-84/REQ-85 supersession and re-homing, and marks
  AC-674..681 archived/superseded. No story-level edit required (per the
  report's "the only drift is the capability body, not the story").

## Code Edits (if any)

None this call.

## needs_review Items Forwarded

None. The report had 0 needs_review items; the sole violation is resolved.

## Verification

- `xgd ticket get capability-938f26ec` confirms: no present-tense module-dial
  framing remains; "is now owned by L1 leaf axes" / "now expressed through the
  contact-form capability config plus named L1 slots" / "not bespoke per-module
  dials" are present; `intent_uid`/`updated_by` fields set.
