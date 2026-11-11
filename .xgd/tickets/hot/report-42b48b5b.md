---
uid: report-42b48b5b
id: REPORT-12582
type: report
title: 'Report: batch_quality_check for report-4ada51a8'
created_by: xgd
created_at: '2026-11-11T02:10:58.674316+00:00'
updated_at: '2026-11-11T02:10:58.674316+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: report-4ada51a8
  parent_report_uid: report-9e5230e1
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-11-11T02:05:50.703376Z",
  "lint": null,
  "build": null,
  "preflight": {
    "status": "pass",
    "violations": []
  },
  "suites": {
    "javascript-vitest": {
      "suite_name": "javascript-vitest",
      "status": "success",
      "exit_code": 0,
      "duration_seconds": 3.030881957616657,
      "passed": 2,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 2,
      "deselected": 12,
      "test_filter": [
        "test_UAT_AC2413_",
        "test_UAT_AC2594_"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "ts_a_stamped_segment_by_the_hot_class_alone_and_off_restores_the_render\\x1b[32m 35\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-marked-points.test.ts\\x1b[2m > \\x1b[22mstory-44d0a572 \u2014 Marked Points on the edit render\\x1b[2m > \\x1b[22mtest_UAT_AC2413_mark_points_toggle_exists_only_in_edit_mode_and_reassigns_the_click\\x1b[32m 202\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-marked-points.test.ts\\x1b[2m > \\x1b[22mstory-44d0a572 \u2014 Marked Points on the edit render\\x1b[2m > \\x1b[22mtest_UAT_AC2414_placing_a_point_shows_a_lettered_mark_reuses_freed_letters_and_appends_a_pill\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-marked-points.test.ts\\x1b[2m > \\x1b[22mstory-44d0a572 \u2014 Marked Points on the edit render\\x1b[2m > \\x1b[22mtest_UAT_AC2415_a_fresh_label_fades_only_on_leaving_its_asymmetric_reach_or_the_next_point\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-marked-points.test.ts\\x1b[2m > \\x1b[22mstory-44d0a572 \u2014 Marked Points on the edit render\\x1b[2m > \\x1b[22mtest_UAT_AC2416_the_cross_is_two_bars_centred_on_a_22px_disc_with_no_glyph\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-marked-points.test.ts\\x1b[2m > \\x1b[22mstory-44d0a572 \u2014 Marked Points on the edit render\\x1b[2m > \\x1b[22mtest_UAT_AC2417_label_plus_reinserts_a_pill_and_times_deletes_the_point_and_its_pills\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-marked-points.test.ts\\x1b[2m > \\x1b[22mstory-44d0a572 \u2014 Marked Points on the edit render\\x1b[2m > \\x1b[22mtest_UAT_AC2418_dragging_a_mark_moves_its_point_and_re_resolves_it_where_the_drag_ends\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-marked-points.test.ts\\x1b[2m > \\x1b[22mstory-44d0a572 \u2014 Marked Points on the edit render\\x1b[2m > \\x1b[22mtest_UAT_AC2419_each_referenced_point_expands_to_a_block_with_every_frame_width_and_render\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-marked-points.test.ts\\x1b[2m > \\x1b[22mstory-44d0a572 \u2014 Marked Points on the edit render\\x1b[2m > \\x1b[22mtest_UAT_AC2420_a_point_in_an_svg_image_reports_user_space_through_object_fit_and_preserve_aspect_ratio\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-marked-points.test.ts\\x1b[2m > \\x1b[22mstory-44d0a572 \u2014 Marked Points on the edit render\\x1b[2m > \\x1b[22mtest_UAT_AC2421_near_names_anchor_lines_with_signed_distances_and_never_snaps\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-marked-points.test.ts\\x1b[2m > \\x1b[22mstory-44d0a572 \u2014 Marked Points on the edit render\\x1b[2m > \\x1b[22mtest_UAT_AC2422_only_referenced_points_expand_typed_references_resolve_and_unknown_stay_literal\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-marked-points.test.ts\\x1b[2m > \\x1b[22mstory-44d0a572 \u2014 Marked Points on the edit render\\x1b[2m > \\x1b[22mtest_UAT_AC2424_points_last_one_turn_marks_grey_out_on_send_and_the_next_render_clears_them\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-marked-points.test.ts\\x1b[2m > \\x1b[22mstory-44d0a572 \u2014 Marked Points on the edit render\\x1b[2m > \\x1b[22mtest_UAT_AC2425_published_and_standalone_edit_renders_and_the_bridge_are_unchanged\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-marked-points.test.ts\\x1b[2m > \\x1b[22mstory-44d0a572 \u2014 the pill and the composer\\x1b[2m > \\x1b[22mtest_UAT_AC2423_bubble_shows_the_pill_turn_carries_the_expansion_and_pills_survive_cut_and_paste\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m1 passed\\x1b[39m\\x1b[22m\\x1b[90m (1)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m2 passed\\x1b[39m\\x1b[22m\\x1b[2m | \\x1b[22m\\x1b[33m12 skipped\\x1b[39m\\x1b[90m (14)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 18:05:52\n\\x1b[2m   Duration \\x1b[22m 1.62s\\x1b[2m (transform 446ms, setup 0ms, import 434ms, tests 246ms, environment 312ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-q41v2a_z.json\n\n{\"numTotalTestSuites\":3,\"numPassedTestSuites\":3,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":14,\"numPassedTests\":2,\"numFailedTests\":0,\"numPendingTests\":12,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1794362752542,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"story-44d0a572 \u2014 Marked Points on the edit render\"],\"fullName\":\"story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2594_the_dimmed_hover_selects_a_stamped_segment_by_the_hot_class_alone_and_off_restores_the_render\",\"status\":\"passed\",\"title\":\"test_UAT_AC2594_the_dimmed_hover_selects_a_stamped_segment_by_the_hot_class_alone_and_off_restores_the_render\",\"duration\":35.36345799999992,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-44d0a572 \u2014 Marked Points on the edit render\"],\"fullName\":\"story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2413_mark_points_toggle_exists_only_in_edit_mode_and_reassigns_the_click\",\"status\":\"passed\",\"title\":\"test_UAT_AC2413_mark_points_toggle_exists_only_in_edit_mode_and_reassigns_the_click\",\"duration\":201.9658330000001,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-44d0a572 \u2014 Marked Points on the edit render\"],\"fullName\":\"story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2414_placing_a_point_shows_a_lettered_mark_reuses_freed_letters_and_appends_a_pill\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2414_placing_a_point_shows_a_lettered_mark_reuses_freed_letters_and_appends_a_pill\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-44d0a572 \u2014 Marked Points on the edit render\"],\"fullName\":\"story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2415_a_fresh_label_fades_only_on_leaving_its_asymmetric_reach_or_the_next_point\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2415_a_fresh_label_fades_only_on_leaving_its_asymmetric_reach_or_the_next_point\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-44d0a572 \u2014 Marked Points on the edit render\"],\"fullName\":\"story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2416_the_cross_is_two_bars_centred_on_a_22px_disc_with_no_glyph\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2416_the_cross_is_two_bars_centred_on_a_22px_disc_with_no_glyph\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-44d0a572 \u2014 Marked Points on the edit render\"],\"fullName\":\"story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2417_label_plus_reinserts_a_pill_and_times_deletes_the_point_and_its_pills\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2417_label_plus_reinserts_a_pill_and_times_deletes_the_point_and_its_pills\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-44d0a572 \u2014 Marked Points on the edit render\"],\"fullName\":\"story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2418_dragging_a_mark_moves_its_point_and_re_resolves_it_where_the_drag_ends\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2418_dragging_a_mark_moves_its_point_and_re_resolves_it_where_the_drag_ends\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-44d0a572 \u2014 Marked Points on the edit render\"],\"fullName\":\"story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2419_each_referenced_point_expands_to_a_block_with_every_frame_width_and_render\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2419_each_referenced_point_expands_to_a_block_with_every_frame_width_and_render\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-44d0a572 \u2014 Marked Points on the edit render\"],\"fullName\":\"story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2420_a_point_in_an_svg_image_reports_user_space_through_object_fit_and_preserve_aspect_ratio\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2420_a_point_in_an_svg_image_reports_user_space_through_object_fit_and_preserve_aspect_ratio\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-44d0a572 \u2014 Marked Points on the edit render\"],\"fullName\":\"story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2421_near_names_anchor_lines_with_signed_distances_and_never_snaps\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2421_near_names_anchor_lines_with_signed_distances_and_never_snaps\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-44d0a572 \u2014 Marked Points on the edit render\"],\"fullName\":\"story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2422_only_referenced_points_expand_typed_references_resolve_and_unknown_stay_literal\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2422_only_referenced_points_expand_typed_references_resolve_and_unknown_stay_literal\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-44d0a572 \u2014 Marked Points on the edit render\"],\"fullName\":\"story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2424_points_last_one_turn_marks_grey_out_on_send_and_the_next_render_clears_them\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2424_points_last_one_turn_marks_grey_out_on_send_and_the_next_render_clears_them\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-44d0a572 \u2014 Marked Points on the edit render\"],\"fullName\":\"story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2425_published_and_standalone_edit_renders_and_the_bridge_are_unchanged\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2425_published_and_standalone_edit_renders_and_the_bridge_are_unchanged\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-44d0a572 \u2014 the pill and the composer\"],\"fullName\":\"story-44d0a572 \u2014 the pill and the composer test_UAT_AC2423_bubble_shows_the_pill_turn_carries_the_expansion_and_pills_survive_cut_and_paste\",\"status\":\"skipped\",\"title\":\"test_UAT_AC2423_bubble_shows_the_pill_turn_carries_the_expansion_and_pills_survive_cut_and_paste\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794362753923,\"endTime\":1794362754160.9658,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-44/tests/reconciliation-marked-points.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2594_the_dimmed_hover_selects_a_stamped_segment_by_the_hot_class_alone_and_off_restores_the_render",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2413_mark_points_toggle_exists_only_in_edit_mode_and_reassigns_the_click",
          "file": "",
          "status": "passed"
        }
      ],
      "hung_test": null,
      "timeout_reason": null,
      "partial_results": false,
      "failures": []
    }
  },
  "overall": {
    "status": "success",
    "issues": []
  },
  "validation": {
    "anomalies": []
  },
  "blast_radius": {
    "test_scope": "",
    "files": []
  }
}