---
uid: report-ff38af2b
id: REPORT-11443
type: report
title: 'Scoped quality: pass (13 tests, 0 failed)'
created_by: xgd
created_at: '2026-11-08T13:05:15.045558+00:00'
updated_at: '2026-11-08T13:05:15.045558+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: story-44d0a572
  commit: 44fefc79e61e1dfb7b47718c93de0e2dd71111e0
---

{
  "timestamp": "2026-11-08T13:02:08.997560Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00015424983575940132,
    "errors": 0,
    "warnings": 0,
    "error_list": [],
    "warning_list": []
  },
  "build": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.0,
    "errors": 0,
    "error_list": [],
    "stdout": "No tsconfig.json \u2014 type-check skipped (JS-only project)",
    "stderr": ""
  },
  "preflight": {
    "status": "pass",
    "violations": []
  },
  "suites": {
    "javascript-vitest": {
      "suite_name": "javascript-vitest",
      "status": "success",
      "exit_code": 0,
      "duration_seconds": 2.0962460418231785,
      "passed": 13,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 13,
      "deselected": 0,
      "test_filter": [
        "test_UAT_AC2413_",
        "test_UAT_AC2414_",
        "test_UAT_AC2415_",
        "test_UAT_AC2416_",
        "test_UAT_AC2417_",
        "test_UAT_AC2418_",
        "test_UAT_AC2419_",
        "test_UAT_AC2420_",
        "test_UAT_AC2421_",
        "test_UAT_AC2422_",
        "test_UAT_AC2423_",
        "test_UAT_AC2424_",
        "test_UAT_AC2425_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "b.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41\\x1b[39m\n\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-marked-points.test.ts\\x1b[2m > \\x1b[22mstory-44d0a572 \u2014 Marked Points on the edit render\\x1b[2m > \\x1b[22mtest_UAT_AC2413_mark_points_toggle_exists_only_in_edit_mode_and_reassigns_the_click\\x1b[32m 163\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-marked-points.test.ts\\x1b[2m > \\x1b[22mstory-44d0a572 \u2014 Marked Points on the edit render\\x1b[2m > \\x1b[22mtest_UAT_AC2414_placing_a_point_shows_a_lettered_mark_reuses_freed_letters_and_appends_a_pill\\x1b[32m 38\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-marked-points.test.ts\\x1b[2m > \\x1b[22mstory-44d0a572 \u2014 Marked Points on the edit render\\x1b[2m > \\x1b[22mtest_UAT_AC2415_a_fresh_label_fades_only_on_leaving_its_asymmetric_reach_or_the_next_point\\x1b[32m 13\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-marked-points.test.ts\\x1b[2m > \\x1b[22mstory-44d0a572 \u2014 Marked Points on the edit render\\x1b[2m > \\x1b[22mtest_UAT_AC2416_the_cross_is_two_bars_centred_on_a_22px_disc_with_no_glyph\\x1b[32m 10\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-marked-points.test.ts\\x1b[2m > \\x1b[22mstory-44d0a572 \u2014 Marked Points on the edit render\\x1b[2m > \\x1b[22mtest_UAT_AC2417_label_plus_reinserts_a_pill_and_times_deletes_the_point_and_its_pills\\x1b[32m 11\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-marked-points.test.ts\\x1b[2m > \\x1b[22mstory-44d0a572 \u2014 Marked Points on the edit render\\x1b[2m > \\x1b[22mtest_UAT_AC2418_dragging_a_mark_moves_its_point_and_re_resolves_it_where_the_drag_ends\\x1b[32m 17\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-marked-points.test.ts\\x1b[2m > \\x1b[22mstory-44d0a572 \u2014 Marked Points on the edit render\\x1b[2m > \\x1b[22mtest_UAT_AC2419_each_referenced_point_expands_to_a_block_with_every_frame_width_and_render\\x1b[32m 11\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-marked-points.test.ts\\x1b[2m > \\x1b[22mstory-44d0a572 \u2014 Marked Points on the edit render\\x1b[2m > \\x1b[22mtest_UAT_AC2420_a_point_in_an_svg_image_reports_user_space_through_object_fit_and_preserve_aspect_ratio\\x1b[32m 25\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-marked-points.test.ts\\x1b[2m > \\x1b[22mstory-44d0a572 \u2014 Marked Points on the edit render\\x1b[2m > \\x1b[22mtest_UAT_AC2421_near_names_anchor_lines_with_signed_distances_and_never_snaps\\x1b[32m 13\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-marked-points.test.ts\\x1b[2m > \\x1b[22mstory-44d0a572 \u2014 Marked Points on the edit render\\x1b[2m > \\x1b[22mtest_UAT_AC2422_only_referenced_points_expand_typed_references_resolve_and_unknown_stay_literal\\x1b[32m 9\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-marked-points.test.ts\\x1b[2m > \\x1b[22mstory-44d0a572 \u2014 Marked Points on the edit render\\x1b[2m > \\x1b[22mtest_UAT_AC2424_points_last_one_turn_marks_grey_out_on_send_and_the_next_render_clears_them\\x1b[32m 9\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-marked-points.test.ts\\x1b[2m > \\x1b[22mstory-44d0a572 \u2014 Marked Points on the edit render\\x1b[2m > \\x1b[22mtest_UAT_AC2425_published_and_standalone_edit_renders_and_the_bridge_are_unchanged\\x1b[32m 15\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-marked-points.test.ts\\x1b[2m > \\x1b[22mstory-44d0a572 \u2014 the pill and the composer\\x1b[2m > \\x1b[22mtest_UAT_AC2423_bubble_shows_the_pill_turn_carries_the_expansion_and_pills_survive_cut_and_paste\\x1b[32m 10\\x1b[2mms\\x1b[22m\\x1b[39m\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m1 passed\\x1b[39m\\x1b[22m\\x1b[90m (1)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m13 passed\\x1b[39m\\x1b[22m\\x1b[90m (13)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 05:02:10\n\\x1b[2m   Duration \\x1b[22m 1.27s\\x1b[2m (transform 312ms, setup 0ms, import 318ms, tests 349ms, environment 199ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-_pmqri0p.json\n\n{\"numTotalTestSuites\":3,\"numPassedTestSuites\":3,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":13,\"numPassedTests\":13,\"numFailedTests\":0,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1794142930154,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"story-44d0a572 \u2014 Marked Points on the edit render\"],\"fullName\":\"story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2413_mark_points_toggle_exists_only_in_edit_mode_and_reassigns_the_click\",\"status\":\"passed\",\"title\":\"test_UAT_AC2413_mark_points_toggle_exists_only_in_edit_mode_and_reassigns_the_click\",\"duration\":162.61987499999998,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-44d0a572 \u2014 Marked Points on the edit render\"],\"fullName\":\"story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2414_placing_a_point_shows_a_lettered_mark_reuses_freed_letters_and_appends_a_pill\",\"status\":\"passed\",\"title\":\"test_UAT_AC2414_placing_a_point_shows_a_lettered_mark_reuses_freed_letters_and_appends_a_pill\",\"duration\":37.78529100000003,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-44d0a572 \u2014 Marked Points on the edit render\"],\"fullName\":\"story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2415_a_fresh_label_fades_only_on_leaving_its_asymmetric_reach_or_the_next_point\",\"status\":\"passed\",\"title\":\"test_UAT_AC2415_a_fresh_label_fades_only_on_leaving_its_asymmetric_reach_or_the_next_point\",\"duration\":12.572625000000016,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-44d0a572 \u2014 Marked Points on the edit render\"],\"fullName\":\"story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2416_the_cross_is_two_bars_centred_on_a_22px_disc_with_no_glyph\",\"status\":\"passed\",\"title\":\"test_UAT_AC2416_the_cross_is_two_bars_centred_on_a_22px_disc_with_no_glyph\",\"duration\":9.52254199999993,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-44d0a572 \u2014 Marked Points on the edit render\"],\"fullName\":\"story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2417_label_plus_reinserts_a_pill_and_times_deletes_the_point_and_its_pills\",\"status\":\"passed\",\"title\":\"test_UAT_AC2417_label_plus_reinserts_a_pill_and_times_deletes_the_point_and_its_pills\",\"duration\":11.327625000000012,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-44d0a572 \u2014 Marked Points on the edit render\"],\"fullName\":\"story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2418_dragging_a_mark_moves_its_point_and_re_resolves_it_where_the_drag_ends\",\"status\":\"passed\",\"title\":\"test_UAT_AC2418_dragging_a_mark_moves_its_point_and_re_resolves_it_where_the_drag_ends\",\"duration\":17.200958000000014,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-44d0a572 \u2014 Marked Points on the edit render\"],\"fullName\":\"story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2419_each_referenced_point_expands_to_a_block_with_every_frame_width_and_render\",\"status\":\"passed\",\"title\":\"test_UAT_AC2419_each_referenced_point_expands_to_a_block_with_every_frame_width_and_render\",\"duration\":11.026417000000038,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-44d0a572 \u2014 Marked Points on the edit render\"],\"fullName\":\"story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2420_a_point_in_an_svg_image_reports_user_space_through_object_fit_and_preserve_aspect_ratio\",\"status\":\"passed\",\"title\":\"test_UAT_AC2420_a_point_in_an_svg_image_reports_user_space_through_object_fit_and_preserve_aspect_ratio\",\"duration\":24.58375000000001,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-44d0a572 \u2014 Marked Points on the edit render\"],\"fullName\":\"story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2421_near_names_anchor_lines_with_signed_distances_and_never_snaps\",\"status\":\"passed\",\"title\":\"test_UAT_AC2421_near_names_anchor_lines_with_signed_distances_and_never_snaps\",\"duration\":13.00929199999996,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-44d0a572 \u2014 Marked Points on the edit render\"],\"fullName\":\"story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2422_only_referenced_points_expand_typed_references_resolve_and_unknown_stay_literal\",\"status\":\"passed\",\"title\":\"test_UAT_AC2422_only_referenced_points_expand_typed_references_resolve_and_unknown_stay_literal\",\"duration\":9.011834000000022,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-44d0a572 \u2014 Marked Points on the edit render\"],\"fullName\":\"story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2424_points_last_one_turn_marks_grey_out_on_send_and_the_next_render_clears_them\",\"status\":\"passed\",\"title\":\"test_UAT_AC2424_points_last_one_turn_marks_grey_out_on_send_and_the_next_render_clears_them\",\"duration\":8.713458999999943,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-44d0a572 \u2014 Marked Points on the edit render\"],\"fullName\":\"story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2425_published_and_standalone_edit_renders_and_the_bridge_are_unchanged\",\"status\":\"passed\",\"title\":\"test_UAT_AC2425_published_and_standalone_edit_renders_and_the_bridge_are_unchanged\",\"duration\":14.61058300000002,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-44d0a572 \u2014 the pill and the composer\"],\"fullName\":\"story-44d0a572 \u2014 the pill and the composer test_UAT_AC2423_bubble_shows_the_pill_turn_carries_the_expansion_and_pills_survive_cut_and_paste\",\"status\":\"passed\",\"title\":\"test_UAT_AC2423_bubble_shows_the_pill_turn_carries_the_expansion_and_pills_survive_cut_and_paste\",\"duration\":9.851332999999954,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794142931085,\"endTime\":1794142931426.8513,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/reconciliation-marked-points.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2413_mark_points_toggle_exists_only_in_edit_mode_and_reassigns_the_click",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2414_placing_a_point_shows_a_lettered_mark_reuses_freed_letters_and_appends_a_pill",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2415_a_fresh_label_fades_only_on_leaving_its_asymmetric_reach_or_the_next_point",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2416_the_cross_is_two_bars_centred_on_a_22px_disc_with_no_glyph",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2417_label_plus_reinserts_a_pill_and_times_deletes_the_point_and_its_pills",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2418_dragging_a_mark_moves_its_point_and_re_resolves_it_where_the_drag_ends",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2419_each_referenced_point_expands_to_a_block_with_every_frame_width_and_render",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2420_a_point_in_an_svg_image_reports_user_space_through_object_fit_and_preserve_aspect_ratio",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2421_near_names_anchor_lines_with_signed_distances_and_never_snaps",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2422_only_referenced_points_expand_typed_references_resolve_and_unknown_stay_literal",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2424_points_last_one_turn_marks_grey_out_on_send_and_the_next_render_clears_them",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2425_published_and_standalone_edit_renders_and_the_bridge_are_unchanged",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-44d0a572 \u2014 the pill and the composer test_UAT_AC2423_bubble_shows_the_pill_turn_carries_the_expansion_and_pills_survive_cut_and_paste",
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
  }
}