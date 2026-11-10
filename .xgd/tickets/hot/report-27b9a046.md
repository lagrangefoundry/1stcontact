---
uid: report-27b9a046
id: REPORT-12087
type: report
title: 'Fix reconciliation review: bundle-374f88d6'
created_by: xgd
created_at: '2026-11-10T00:55:24.520894+00:00'
updated_at: '2026-11-10T00:55:24.520894+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_reconciliation_review
  subject_uid: bundle-374f88d6
  needs_more_work: false
  progress_made: true
---

## Stories created
None

## Stories modified
- story-58b2cec4 (STORY-157) — G1: the section "Code issue flagged — two browser interactions on the stored-picture path are not wrapped (BUG-80)" is now marked RESOLVED. It cites code_frozen override report-c0389fea (screenshot.ts:321-362: `factory()` and `driver.screenshot` now go through `unrenderable()`) and the scoped quality report report-d6cba09d, and names the AC-2565 lease/shot UAT cases. The Technical Context bullet now lists every wrapped interaction (lease, navigate, chunks, decode, shot), says the deliberate decode refusal is thrown outside the wrapped regions and not re-wrapped, and says the `finally` still closes the driver.
- story-b3de4571 (STORY-107) — G3: Evidence names the AC-2569..AC-2572 UATs retargeted from the REQ-217 FC suites, plus the AC-2570 reload UAT. It records that the create_image FC cases were dropped as redundant with AC-2567/2568.
- story-39c992d3 (STORY-172) — the evidence line now points at the AC-2567/2568 UATs instead of the deleted REQ-217 FC workers file.
- story-44d0a572 (STORY-174) — G3: the UATs line names the new AC-2594 UAT, which replaces BUG-83's FC hover test.
- ACs: AC-2565 — G2: the Verification list adds case (e), the rejecting lease, and the Note cites override report-c0389fea. AC-2569, AC-2570, AC-2571, AC-2572 and AC-2594 now have UAT notes and are set to `status: active`. AC-2364 has an evidence note for the folded BUG-83 reader UAT.

## Stories deleted
None

## ACs superseded
None

## FC orphans renamed/deleted
No fc_orphan_check report exists for this anchor. These FC files were handled under G3:
- tests/test_UAT_FC_REQ-217_a_picture_in_the_conversation.test.ts → git mv to tests/reconciliation-assistant-picture-in-the-turn.test.ts. Its tests are now test_UAT_AC2569_write_image_hands_back_a_business_scoped_line_that_a_redraw_keeps, test_UAT_AC2570_surface_v9_tells_the_model_to_paste_the_line_word_for_word (adds `surface_version` 9 and the named absence), test_UAT_AC2571_with_no_asset_url_factory_the_drawing_is_written_with_no_display, and test_UAT_AC2572_an_image_in_a_chat_message_is_bounded_by_the_pane (adds 260px and auto width/height). The round-trip, redraw and markdown-shape FC cases were folded into the AC2569 test.
- tests/test_UAT_FC_REQ-217_a_picture_in_the_conversation.workers.test.ts → git mv to tests/reconciliation-assistant-picture-in-the-turn.workers.test.ts as test_UAT_AC2569_a_drawing_the_turn_made_is_fetchable_from_the_turn. It now asserts the exact URL and a replace:true redraw through the Worker. The two create_image cases were deleted as redundant with AC-2567/2568 in reconciliation-consultant-image-generation-display.workers.test.ts.
- tests/test_UAT_FC_BUG-83_suite_is_evidence_again.test.ts → git rm. The hover test was replaced by test_UAT_AC2594_… in tests/reconciliation-marked-points.test.ts. That test uses the real edit bridge and adds the reviewer's two required assertions: mode-off restores the render's hover rule, and the overlay stylesheet has no region-stamp attribute. It also covers click-places-a-point. The three channel-reader tests (both wire shapes, an uncovered channel reads as absent, no trailing user message reads as empty) were folded into test_UAT_AC2364_the_tail_is_read_in_both_wire_shapes_and_a_quiet_turn_reads_as_absent in tests/reconciliation-assistant-reminder-channel.test.ts. The selector-layout/rulesOf helper test was deleted as redundant: the AC-1043 UATs (reconciliation-copy-edit-image-picker.test.ts and reconciliation-copy-edit-form-presentation.test.ts) already use rulesOf to find the wrapped `:has(.builder-modal__box … .builder-modal__picker)` rule in the real builder.css.

## Code changes
Test files only; no production code was touched.
- tests/reconciliation-stored-picture-delivery.test.ts — G2: AC2565 case (e). The driver factory rejects with a multi-MB data: URL and base64 payload. The test asserts an ImageNotRenderableError naming the picture, the driver code E_LAUNCH kept, no data: URL, no base64 run of 120+ characters, and a diagnosis of at most 400 characters.
- tests/reconciliation-assistant-picture-in-the-turn{,.workers}.test.ts — see above.
- tests/reconciliation-marked-points.test.ts — new AC-2594 UAT; imports L1_EDIT_HOT_CLASS, L1_EDIT_SEGMENT_ATTR and cssRules.
- tests/reconciliation-assistant-reminder-channel.test.ts — new AC-2364 reader UAT; imports sentText.
- tests/reconciliation-assistant-conversation.test.ts — new test_UAT_AC2570_a_turn_that_pasted_a_display_line_replays_it_after_a_restart: the line comes back verbatim after a host restart.

## Confidence
Moderate to high. Each gap's remediation was applied as the review specified.

The new tests were written without running them, as instructed. Their likeliest failure points:
1. The Worker redraw step in AC2569, which assumes the preview serves the replaced asset uncached.
2. The AC2594 rule-matching, which assumes the edit render's inline `[data-l1-seg].l1-edit-hot` rule appears exactly once.
If either fails, the test-fix loop will see it.

Two Verification clauses are asserted indirectly because the sandboxed jsdom suite cannot run them directly. The AC notes record this:
- DOMPurify keeps the `<img>` (AC-2569): asserted as the markdown shape.
- The computed outline (AC-2594): asserted as which declared rule reaches the segment.
