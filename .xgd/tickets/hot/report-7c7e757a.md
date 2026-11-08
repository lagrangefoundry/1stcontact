---
uid: report-7c7e757a
id: REPORT-11438
type: report
title: 'Scoped quality: fail (13 tests, 1 failed)'
created_by: xgd
created_at: '2026-11-08T12:57:10.222448+00:00'
updated_at: '2026-11-08T12:57:10.222448+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: quality
  subject_uid: story-44d0a572
  commit: d614b9d950b799a61f88cd64ca1332b4bdabfc49
---

{
  "timestamp": "2026-11-08T12:52:59.378042Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00011283392086625099,
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
      "status": "failure",
      "exit_code": 1,
      "duration_seconds": 1.9619851666502655,
      "passed": 12,
      "failed": 1,
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
      "stdout": "[49m\\x1b[39m tests/reconciliation-marked-points.test.ts\\x1b[2m > \\x1b[22mstory-44d0a572 \u2014 Marked Points on the edit render\\x1b[2m > \\x1b[22mtest_UAT_AC2419_each_referenced_point_expands_to_a_block_with_every_frame_width_and_render\\x1b[32m 11\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-marked-points.test.ts\\x1b[2m > \\x1b[22mstory-44d0a572 \u2014 Marked Points on the edit render\\x1b[2m > \\x1b[22mtest_UAT_AC2420_a_point_in_an_svg_image_reports_user_space_through_object_fit_and_preserve_aspect_ratio\\x1b[32m 24\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-marked-points.test.ts\\x1b[2m > \\x1b[22mstory-44d0a572 \u2014 Marked Points on the edit render\\x1b[2m > \\x1b[22mtest_UAT_AC2421_near_names_anchor_lines_with_signed_distances_and_never_snaps\\x1b[32m 11\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-marked-points.test.ts\\x1b[2m > \\x1b[22mstory-44d0a572 \u2014 Marked Points on the edit render\\x1b[2m > \\x1b[22mtest_UAT_AC2422_only_referenced_points_expand_typed_references_resolve_and_unknown_stay_literal\\x1b[32m 8\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[31m\u00d7\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-marked-points.test.ts\\x1b[2m > \\x1b[22mstory-44d0a572 \u2014 Marked Points on the edit render\\x1b[2m > \\x1b[22mtest_UAT_AC2424_points_last_one_turn_marks_grey_out_on_send_and_the_next_render_clears_them\\x1b[32m 12\\x1b[2mms\\x1b[22m\\x1b[39m\n\\x1b[31m   \u2192 expected [ 'C' ] to deeply equal [ 'A' ]\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-marked-points.test.ts\\x1b[2m > \\x1b[22mstory-44d0a572 \u2014 Marked Points on the edit render\\x1b[2m > \\x1b[22mtest_UAT_AC2425_published_and_standalone_edit_renders_and_the_bridge_are_unchanged\\x1b[32m 13\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-marked-points.test.ts\\x1b[2m > \\x1b[22mstory-44d0a572 \u2014 the pill and the composer\\x1b[2m > \\x1b[22mtest_UAT_AC2423_bubble_shows_the_pill_turn_carries_the_expansion_and_pills_survive_cut_and_paste\\x1b[32m 9\\x1b[2mms\\x1b[22m\\x1b[39m\n\n\\x1b[31m\u23af\u23af\u23af\u23af\u23af\u23af\u23af\\x1b[39m\\x1b[1m\\x1b[41m Failed Tests 1 \\x1b[49m\\x1b[22m\\x1b[31m\u23af\u23af\u23af\u23af\u23af\u23af\u23af\\x1b[39m\n\n\\x1b[41m\\x1b[1m FAIL \\x1b[22m\\x1b[49m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-marked-points.test.ts\\x1b[2m > \\x1b[22mstory-44d0a572 \u2014 Marked Points on the edit render\\x1b[2m > \\x1b[22mtest_UAT_AC2424_points_last_one_turn_marks_grey_out_on_send_and_the_next_render_clears_them\n\\x1b[31m\\x1b[1mAssertionError\\x1b[22m: expected [ 'C' ] to deeply equal [ 'A' ]\\x1b[39m\n\n\\x1b[32m- Expected\\x1b[39m\n\\x1b[31m+ Received\\x1b[39m\n\n\\x1b[2m  [\\x1b[22m\n\\x1b[32m-   \"A\",\\x1b[39m\n\\x1b[31m+   \"C\",\\x1b[39m\n\\x1b[2m  ]\\x1b[22m\n\n\\x1b[36m \\x1b[2m\u276f\\x1b[22m tests/reconciliation-marked-points.test.ts:\\x1b[2m815:70\\x1b[22m\\x1b[39m\n    \\x1b[90m813|\\x1b[39m     box\\x1b[33m.\\x1b[39m\\x1b[35mset\\x1b[39m(\\x1b[32m''\\x1b[39m)\n    \\x1b[90m814|\\x1b[39m     \\x1b[34mclickAt\\x1b[39m(copy\\x1b[33m,\\x1b[39m \\x1b[34m400\\x1b[39m\\x1b[33m,\\x1b[39m \\x1b[34m30\\x1b[39m)\n    \\x1b[90m815|\\x1b[39m     expect(controller.list().map((p: { label: string }) => p.label)).t\u2026\n    \\x1b[90m   |\\x1b[39m                                                                      \\x1b[31m^\\x1b[39m\n    \\x1b[90m816|\\x1b[39m     \\x1b[34mexpect\\x1b[39m(box\\x1b[33m.\\x1b[39m\\x1b[35mget\\x1b[39m()\\x1b[33m.\\x1b[39m\\x1b[34mtrim\\x1b[39m())\\x1b[33m.\\x1b[39m\\x1b[34mtoBe\\x1b[39m(\\x1b[32m'[Point A]'\\x1b[39m)\n    \\x1b[90m817|\\x1b[39m\n\n\\x1b[31m\\x1b[2m\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af\u23af[1/1]\u23af\\x1b[22m\\x1b[39m\n\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[31m1 failed\\x1b[39m\\x1b[22m\\x1b[90m (1)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[31m1 failed\\x1b[39m\\x1b[22m\\x1b[2m | \\x1b[22m\\x1b[1m\\x1b[32m12 passed\\x1b[39m\\x1b[22m\\x1b[90m (13)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 04:53:00\n\\x1b[2m   Duration \\x1b[22m 1.12s\\x1b[2m (transform 262ms, setup 0ms, import 268ms, tests 314ms, environment 167ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-y_d_1i9z.json\n\n{\"numTotalTestSuites\":3,\"numPassedTestSuites\":1,\"numFailedTestSuites\":2,\"numPendingTestSuites\":0,\"numTotalTests\":13,\"numPassedTests\":12,\"numFailedTests\":1,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1794142380808,\"success\":false,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"story-44d0a572 \u2014 Marked Points on the edit render\"],\"fullName\":\"story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2413_mark_points_toggle_exists_only_in_edit_mode_and_reassigns_the_click\",\"status\":\"passed\",\"title\":\"test_UAT_AC2413_mark_points_toggle_exists_only_in_edit_mode_and_reassigns_the_click\",\"duration\":140.08083300000004,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-44d0a572 \u2014 Marked Points on the edit render\"],\"fullName\":\"story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2414_placing_a_point_shows_a_lettered_mark_reuses_freed_letters_and_appends_a_pill\",\"status\":\"passed\",\"title\":\"test_UAT_AC2414_placing_a_point_shows_a_lettered_mark_reuses_freed_letters_and_appends_a_pill\",\"duration\":35.34387499999991,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-44d0a572 \u2014 Marked Points on the edit render\"],\"fullName\":\"story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2415_a_fresh_label_fades_only_on_leaving_its_asymmetric_reach_or_the_next_point\",\"status\":\"passed\",\"title\":\"test_UAT_AC2415_a_fresh_label_fades_only_on_leaving_its_asymmetric_reach_or_the_next_point\",\"duration\":11.333374999999933,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-44d0a572 \u2014 Marked Points on the edit render\"],\"fullName\":\"story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2416_the_cross_is_two_bars_centred_on_a_22px_disc_with_no_glyph\",\"status\":\"passed\",\"title\":\"test_UAT_AC2416_the_cross_is_two_bars_centred_on_a_22px_disc_with_no_glyph\",\"duration\":8.606874999999945,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-44d0a572 \u2014 Marked Points on the edit render\"],\"fullName\":\"story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2417_label_plus_reinserts_a_pill_and_times_deletes_the_point_and_its_pills\",\"status\":\"passed\",\"title\":\"test_UAT_AC2417_label_plus_reinserts_a_pill_and_times_deletes_the_point_and_its_pills\",\"duration\":8.453624999999988,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-44d0a572 \u2014 Marked Points on the edit render\"],\"fullName\":\"story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2418_dragging_a_mark_moves_its_point_and_re_resolves_it_where_the_drag_ends\",\"status\":\"passed\",\"title\":\"test_UAT_AC2418_dragging_a_mark_moves_its_point_and_re_resolves_it_where_the_drag_ends\",\"duration\":15.549040999999988,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-44d0a572 \u2014 Marked Points on the edit render\"],\"fullName\":\"story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2419_each_referenced_point_expands_to_a_block_with_every_frame_width_and_render\",\"status\":\"passed\",\"title\":\"test_UAT_AC2419_each_referenced_point_expands_to_a_block_with_every_frame_width_and_render\",\"duration\":10.865291999999954,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-44d0a572 \u2014 Marked Points on the edit render\"],\"fullName\":\"story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2420_a_point_in_an_svg_image_reports_user_space_through_object_fit_and_preserve_aspect_ratio\",\"status\":\"passed\",\"title\":\"test_UAT_AC2420_a_point_in_an_svg_image_reports_user_space_through_object_fit_and_preserve_aspect_ratio\",\"duration\":24.234166999999957,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-44d0a572 \u2014 Marked Points on the edit render\"],\"fullName\":\"story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2421_near_names_anchor_lines_with_signed_distances_and_never_snaps\",\"status\":\"passed\",\"title\":\"test_UAT_AC2421_near_names_anchor_lines_with_signed_distances_and_never_snaps\",\"duration\":11.360374999999976,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-44d0a572 \u2014 Marked Points on the edit render\"],\"fullName\":\"story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2422_only_referenced_points_expand_typed_references_resolve_and_unknown_stay_literal\",\"status\":\"passed\",\"title\":\"test_UAT_AC2422_only_referenced_points_expand_typed_references_resolve_and_unknown_stay_literal\",\"duration\":8.064708999999993,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-44d0a572 \u2014 Marked Points on the edit render\"],\"fullName\":\"story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2424_points_last_one_turn_marks_grey_out_on_send_and_the_next_render_clears_them\",\"status\":\"failed\",\"title\":\"test_UAT_AC2424_points_last_one_turn_marks_grey_out_on_send_and_the_next_render_clears_them\",\"duration\":12.054292000000032,\"failureMessages\":[\"AssertionError: expected [ 'C' ] to deeply equal [ 'A' ]\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/reconciliation-marked-points.test.ts:815:70\\n    at file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-44d0a572 \u2014 Marked Points on the edit render\"],\"fullName\":\"story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2425_published_and_standalone_edit_renders_and_the_bridge_are_unchanged\",\"status\":\"passed\",\"title\":\"test_UAT_AC2425_published_and_standalone_edit_renders_and_the_bridge_are_unchanged\",\"duration\":13.33845800000006,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-44d0a572 \u2014 the pill and the composer\"],\"fullName\":\"story-44d0a572 \u2014 the pill and the composer test_UAT_AC2423_bubble_shows_the_pill_turn_carries_the_expansion_and_pills_survive_cut_and_paste\",\"status\":\"passed\",\"title\":\"test_UAT_AC2423_bubble_shows_the_pill_turn_carries_the_expansion_and_pills_survive_cut_and_paste\",\"duration\":8.63154099999997,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794142381623,\"endTime\":1794142381931.6316,\"status\":\"failed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/reconciliation-marked-points.test.ts\"}]}",
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
          "status": "failed"
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
      "failures": [
        {
          "test_name": "story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2424_points_last_one_turn_marks_grey_out_on_send_and_the_next_render_clears_them",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        }
      ]
    },
    "Quality Config": {
      "suite_name": "Quality Config",
      "status": "failure",
      "passed": 0,
      "failed": 0,
      "total": 0,
      "failures": [],
      "tests": [],
      "synthetic": true
    }
  },
  "overall": {
    "status": "failure",
    "issues": []
  },
  "validation": {
    "anomalies": []
  },
  "quality_config_validation": {
    "issues": [
      {
        "severity": "error",
        "category": "test_failure",
        "field": "test results",
        "message": "1 test(s) failed",
        "suggestion": "Fix failing tests",
        "context": {
          "failures": 1
        }
      }
    ]
  }
}