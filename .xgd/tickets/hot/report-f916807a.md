---
uid: report-f916807a
id: REPORT-11688
type: report
title: 'Fix reconciliation review: bug-00de1faf'
created_by: xgd
created_at: '2026-11-09T04:05:29.059426+00:00'
updated_at: '2026-11-09T04:05:29.059426+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_reconciliation_review
  subject_uid: bug-00de1faf
  needs_more_work: true
  progress_made: false
---

## Stories created
None

## Stories modified
None

## Stories deleted
None

## ACs superseded
None

## FC orphans renamed/deleted
None. No fc_orphan_check report exists for anchor bug-00de1faf, so category 3 does not apply this call.

## Code changes
None. The only gap (G1) needs a production-code change, and code is frozen in this phase (category 5, BUG-1668).

### Production-code gap for the planner (G1)

- **File**: `apps/control-app/src/builder/panel.js`
- **Defect**: `rec.src` is assigned only in `navigate()` (line 175). `show()` (line 236: `if (rec.stale || !sameUrl(rec.src, next)) navigate(rec, next)`) and `prime()` (line 213) compare the wanted URL against that recorded address, not against where the frame actually is. Scenario: the operator follows a link in View from home to `about`, flips to Edit, then flips back to View. View is already on `about`, but it gets re-pointed at `draft/about`, so the pane blanks and re-renders. That is the BUG-79 symptom ("Never for a mode switch").
- **Requested exception**: decide "out of date" from the frame's live location. Either update `rec.src` from `rec.el.contentWindow.location.href` on each load (in a try/catch, skipping `about:blank`), or compare against the live location in `show()`/`prime()` and fall back to `rec.src`.
- **Matrix and test edits that must land with that code change** (holding them back now, because without the code fix they would make the suite fail or describe behaviour the code does not have):
  1. AC-2496 (acceptance_criterion-e2cece6c), paragraph 3: a frame is pointed elsewhere only when the page it actually holds differs from the operator's page. A frame the operator's own link already took to that page is revealed in place. Its Verification should assert no navigation and no load on the switch back to View, and that the carried offset (300) is applied to the revealed document.
  2. `tests/test_reconciliation_builder_page_carry.test.ts` lines ~407–417 (`test_UAT_AC2496_switching_view_and_edit_keeps_the_page_and_the_scroll_offset`): assert `navsOf(viewFrame())` is `[]`, no environment load, `viewFrame().contentDocument === view.doc`, and that `view.scrolled` ends with 300.
  3. Optionally, add a link-then-round-trip case to `test_UAT_AC2517_…` in `tests/test_reconciliation_builder_flip_in_place.test.ts`.

## Confidence
Low that the next review passes without the scoped code exception. Once panel.js is fixed, the three edits above should close G1. The review found everything else faithful and covered.
