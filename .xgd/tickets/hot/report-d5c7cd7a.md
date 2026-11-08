---
uid: report-d5c7cd7a
id: REPORT-11345
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-08T07:46:07.978346+00:00'
updated_at: '2026-11-08T07:46:07.978346+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: report-d87c1fe2
  parent_report_uid: report-b4370a3e
  batch_index: '0'
---

I found nothing to fix in the five change-signal entries. I changed one test for the REQ-209 browser failure, and that change has not been run, because a browser can't launch in this sandbox.

**AC1054, AC1817 and AC1818 tests, and the AC-1817 / AC-1818 orphan entries.** All three tests in `tests/reconciliation-assistant-turn-change-signal.test.ts` pass, both when I run the file directly and when I run `xgd quality run --stories story-a58a0974`. The tests exist, are named for their ACs, and assert the behaviour each AC describes. The orphan entries were most likely the knock-on effect of those tests being reported as failing in an earlier run, so I made no edits for them. That same scoped gate run did report two failures in other areas, which are outside this batch and I left alone: `test_UAT_AC2231` (a git config error) and `test_UAT_FC_REQ-146_every_error_path_out_of_the_router_is_scrubbed`.

**`test_UAT_FC_REQ_209_the_font_metrics_are_the_face_that_resolved`.** The gate gave no failure message, even though an earlier pass had already added diagnostic messages to every assertion. The other cases in the file render the same drawing through the same `measure()` call and pass, so the failure is in this test's final assertion, not a hang.

That assertion checks the cap height the browser reports against the top of the inked text in `"Contact"`. The tallest letter there is `C`, and round capitals rise slightly above cap height by design, about 1px at 62px. The check only tolerates less than 0.5px of difference, so it compares against the wrong letter.

- **The fix:** the cap-top check now uses its own drawing of flat-topped capitals (`HE`) at a different size from the one the cap-height ratio is measured at. It keeps the same tolerance and the same diagnostic messages. I also added a check that the inked top sits below the font's ascender line, so the test really compares glyphs and not the font's box.
- **The other assertions** on cap height, x-height, ascender and descender are unchanged, and nothing outside the test changed.
- **Not run:** in this sandbox the file runs 1 case and skips the 10 browser cases, which say why they skipped. The fix needs the gate to confirm it.

Committed as `a5a337c47c`.

```yaml
## Assessment
status: fixed_unverified
fixes:
  - test: test_UAT_FC_REQ_209_the_font_metrics_are_the_face_that_resolved
    status: fixed_unverified
    evidence: "Gate gave no message even after the earlier diagnostic pass. Every other case in the file measures the same COMPOSED drawing and passes, so the final assertion is what fails: it compared the ratio-derived cap-top with the ink top of 'Contact', whose round 'C' rises about 1px above cap height at 62px, more than toBeCloseTo(…, 0) allows (under 0.5px)."
    change: "Check cap-top against a flat-capital fixture ('HE') with the same tolerance; add a check that the ink top is below the ascender line; ratio assertions and diagnostics kept. Browser test, not run in-session; needs the gate."
  - test: test_UAT_AC1054_a_site_changing_turn_streams_activity_a_signal_its_words_and_one_completion
    status: no_change_needed
    evidence: "Passes under npx vitest run and under xgd quality run --stories story-a58a0974"
  - test: test_UAT_AC1817_each_write_is_announced_where_it_happened_and_a_turn_that_moves_nothing_is_silent
    status: no_change_needed
    evidence: "Passes under both runners"
  - test: test_UAT_AC1818_the_signal_is_the_hosts_own_and_no_offered_operation_can_make_or_fake_one
    status: no_change_needed
    evidence: "Passes under both runners"
  - test: "AC-1817 / AC-1818 (orphaned acceptance criterion)"
    status: no_change_needed
    evidence: "Their UATs exist with the right names and pass; most likely an orphan only because those tests were reported failing earlier"
```