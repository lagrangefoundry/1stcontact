---
uid: report-8f1e84a4
id: REPORT-11702
type: report
title: 'Fix reconciliation review: bug-00de1faf'
created_by: xgd
created_at: '2026-11-09T04:54:35.543614+00:00'
updated_at: '2026-11-09T04:54:35.543614+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_reconciliation_review
  subject_uid: bug-00de1faf
  needs_more_work: false
  progress_made: true
---

## Stories created
None

## Stories modified
- story-e674c60a (STORY-99), addressing review report-ab8bfe35:
  - G1: the Technical Context bullet "The frame-per-mode panel (BUG-79)" now says the record holds the address the frame actually holds. That is the one it was last pointed at, or the one it reached through a link followed inside it. The record is refreshed from the frame's location on every load (`follow()` in panel.js), and `show()`/`prime()` compare against it. A frame already holding the operator's page is revealed, not re-pointed.
  - G2: BUG-79 decision (a) is restated. After a followed link, the idle channel is primed at that page behind it and the flip reveals it in place. A frame is re-pointed only when the page it holds differs. The line "No contradiction between the code and BUG-79 was found" is replaced by a record of the divergence found in review: `rec.src` tracked only pane-set addresses, so a flip after a followed link re-navigated. The entry also records its fix in panel.js under mode_override report-569fb9d5 (code_frozen, rung 1). The opening "agree on every point" sentence now points at that fix.
- AC-2518, AC-2519, AC-2520, AC-2521 (G4): each Reference UAT now names tests/test_reconciliation_builder_flip_in_place.test.ts and its covering test_UAT_AC25xx_* test.
- AC-2522 (G3, G4): Verification gains the site-change priming case. The Reference UATs name both test_UAT_AC2522_* tests in tests/test_reconciliation_builder_flip_in_place.test.ts.

## Stories deleted
None

## ACs superseded
None

## FC orphans renamed/deleted
None. No fc_orphan_check report exists for this anchor, so category 3 did not apply.

## Code changes
- tests/test_reconciliation_builder_flip_in_place.test.ts (G3): new UAT `test_UAT_AC2522_after_a_change_of_site_the_idle_channel_is_primed_behind_the_loaded_frame`. With View shown it calls setSite('other') and asserts that only View navigates. It then delivers View at other and asserts that Edit gets a src write of previewUrl('other','edit') before any flip. Finally it delivers Edit, flips, and asserts that the reveal is in place (no src write, no environment load), holds other's edit document (not acme's), is announced once, and that getSrc() is other's edit address. The test was not run in this call, as instructed. It was written against panel.js prime()/show()/setSite() as they stand.
- No production code changed.

## Confidence
High. G1 to G4 are each addressed in the way the review's gap list prescribes. The one risk is the new UAT, which has not been executed. Its expectations follow the panel.js logic: setSite invalidates and re-shows View only, the View load calls prime(), the record's address differs, and navigate clears stale, so the flip reveals in place.
