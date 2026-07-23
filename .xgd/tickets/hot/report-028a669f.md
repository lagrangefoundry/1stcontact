---
uid: report-028a669f
id: REPORT-826
type: report
title: Fix Framework Absolute-or-Overlay Value System (story) — attempt 2
created_by: xgd
created_at: '2026-07-23T09:49:40.410370+00:00'
updated_at: '2026-07-23T09:49:40.410370+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-6e088083
  level: story
  fixes_applied: 0
  progress_made: false
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-9260fc31
---

# Fix Summary — Framework Absolute-or-Overlay Value System (story)

**Attempt**: 2
**Fixes applied this call**: 0 (the sole violation was already resolved in attempt 1)
**Violations remaining**: 0
**Needs more work**: false

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | story-body-edit | STORY-80 (story-c490f1cf) | ALREADY APPLIED (attempt 1). Corrected the deleted layout-module list in the Description: replaced `(services-grid, text-block, contact-form, hero, header, footer)` with `(header, hero, footer, text-block, services-grid, layer)` — dropped `contact-form` (a surviving capability module per REQ-84 catalog + REQ-85 reframe), added `layer` (deleted per REQ-84 but previously omitted). Now matches REQ-84 and the CAP-67 body verbatim. |

## Verification This Call

Re-read the STORY-80 body via `xgd ticket get story-c490f1cf --json`. The Description now reads:

> the semantic *layout* modules (header, hero, footer, text-block, services-grid, layer) and their ~20 colour/length/radius dials were deleted (REQ-84).

Confirmed programmatically: `contact-form` is NOT in the deleted-module list; `layer` IS. This satisfies Finding 1 (the only violation in report-1956d8ad).

The operative capability claim (absolute base = L1 leaf literals; named overlay parked in L2) was already aligned and was left untouched. Coverage/exclusivity are clean (single story + single repointer AC-716 → single active capability), per the alignment ledger.

## Code Edits (if any)

None.

## needs_review Items Forwarded

None. The single violation was a well-scoped story-body-edit, now resolved. Handing back to the assessor to verify.
