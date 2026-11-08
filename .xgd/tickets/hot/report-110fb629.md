---
uid: report-110fb629
id: REPORT-11526
type: report
title: 'Report: batch_quality_check for report-49607926'
created_by: xgd
created_at: '2026-11-08T17:18:34.146114+00:00'
updated_at: '2026-11-08T17:18:34.146114+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: report-49607926
  parent_report_uid: report-2a00f57b
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-11-08T17:14:57.451236Z",
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
      "duration_seconds": 8.61560329189524,
      "passed": 33,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 33,
      "deselected": 27,
      "test_filter": [
        "test_UAT_AC2418_",
        "test_UAT_AC960_",
        "test_UAT_AC961_",
        "test_UAT_AC977_",
        "test_UAT_FC_BUG-71_",
        "test_UAT_FC_REQ-210_",
        "test_UAT_FC_BUG-72_"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "\"fullName\":\"BUG-71 \u2014 the emitted framework tree is the import graph test_UAT_FC_BUG-71_sibling_module_is_emitted_and_its_specifier_rewritten\",\"status\":\"passed\",\"title\":\"test_UAT_FC_BUG-71_sibling_module_is_emitted_and_its_specifier_rewritten\",\"duration\":5.206833999999617,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"BUG-71 \u2014 the emitted framework tree is the import graph\"],\"fullName\":\"BUG-71 \u2014 the emitted framework tree is the import graph test_UAT_FC_BUG-71_builder_import_graph_resolves_end_to_end\",\"status\":\"passed\",\"title\":\"test_UAT_FC_BUG-71_builder_import_graph_resolves_end_to_end\",\"duration\":23.064666999999645,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"BUG-71 \u2014 the emitted framework tree is the import graph\"],\"fullName\":\"BUG-71 \u2014 the emitted framework tree is the import graph test_UAT_FC_BUG-71_each_source_is_emitted_at_exactly_one_url\",\"status\":\"passed\",\"title\":\"test_UAT_FC_BUG-71_each_source_is_emitted_at_exactly_one_url\",\"duration\":8.552165999999488,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"BUG-71 \u2014 the emitted framework tree is the import graph\"],\"fullName\":\"BUG-71 \u2014 the emitted framework tree is the import graph test_UAT_FC_BUG-71_report_states_the_graph_it_verified\",\"status\":\"passed\",\"title\":\"test_UAT_FC_BUG-71_report_states_the_graph_it_verified\",\"duration\":16.181625000000167,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"BUG-71 \u2014 a tree that cannot load is refused\"],\"fullName\":\"BUG-71 \u2014 a tree that cannot load is refused test_UAT_FC_BUG-71_dangling_specifiers_are_all_named_and_the_build_refuses\",\"status\":\"passed\",\"title\":\"test_UAT_FC_BUG-71_dangling_specifiers_are_all_named_and_the_build_refuses\",\"duration\":0.7045410000000629,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"BUG-71 \u2014 a tree that cannot load is refused\"],\"fullName\":\"BUG-71 \u2014 a tree that cannot load is refused test_UAT_FC_BUG-71_a_whole_tree_passes_and_reports_its_size\",\"status\":\"passed\",\"title\":\"test_UAT_FC_BUG-71_a_whole_tree_passes_and_reports_its_size\",\"duration\":0.7202500000003056,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794158105928,\"endTime\":1794158105984.7202,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/test_UAT_FC_BUG-71_framework_import_graph.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"BUG-72 \u2014 the mark you can reach, and the cross that is centred\"],\"fullName\":\"BUG-72 \u2014 the mark you can reach, and the cross that is centred test_UAT_FC_BUG-72_a_fresh_label_survives_the_journey_to_its_own_controls\",\"status\":\"passed\",\"title\":\"test_UAT_FC_BUG-72_a_fresh_label_survives_the_journey_to_its_own_controls\",\"duration\":44.84808299999986,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"BUG-72 \u2014 the mark you can reach, and the cross that is centred\"],\"fullName\":\"BUG-72 \u2014 the mark you can reach, and the cross that is centred test_UAT_FC_BUG-72_a_pointer_that_genuinely_leaves_still_fades_it\",\"status\":\"passed\",\"title\":\"test_UAT_FC_BUG-72_a_pointer_that_genuinely_leaves_still_fades_it\",\"duration\":40.90387499999997,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"BUG-72 \u2014 the mark you can reach, and the cross that is centred\"],\"fullName\":\"BUG-72 \u2014 the mark you can reach, and the cross that is centred test_UAT_FC_BUG-72_the_cross_is_geometry_rather_than_a_glyph\",\"status\":\"passed\",\"title\":\"test_UAT_FC_BUG-72_the_cross_is_geometry_rather_than_a_glyph\",\"duration\":23.05462499999976,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794158104593,\"endTime\":1794158104702.0547,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/test_UAT_FC_BUG-72_marked_point_chrome.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-210 \u2014 the user can point\"],\"fullName\":\"REQ-210 \u2014 the user can point test_UAT_FC_REQ-210_the_toggle_is_what_reassigns_the_click\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-210_the_toggle_is_what_reassigns_the_click\",\"duration\":37.89833300000009,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-210 \u2014 the user can point\"],\"fullName\":\"REQ-210 \u2014 the user can point test_UAT_FC_REQ-210_a_point_in_a_drawing_reports_svg_user_space\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-210_a_point_in_a_drawing_reports_svg_user_space\",\"duration\":34.98858299999938,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-210 \u2014 the user can point\"],\"fullName\":\"REQ-210 \u2014 the user can point test_UAT_FC_REQ-210_near_names_lines_from_the_anchor_vocabulary\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-210_near_names_lines_from_the_anchor_vocabulary\",\"duration\":19.03558299999986,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-210 \u2014 the user can point\"],\"fullName\":\"REQ-210 \u2014 the user can point test_UAT_FC_REQ-210_the_expansion_carries_the_width_and_document_coordinates\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-210_the_expansion_carries_the_width_and_document_coordinates\",\"duration\":17.98870799999986,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-210 \u2014 the user can point\"],\"fullName\":\"REQ-210 \u2014 the user can point test_UAT_FC_REQ-210_several_points_expand_to_distinct_entries\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-210_several_points_expand_to_distinct_entries\",\"duration\":29.36987500000032,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-210 \u2014 the user can point\"],\"fullName\":\"REQ-210 \u2014 the user can point test_UAT_FC_REQ-210_the_plus_control_restores_a_deleted_pill\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-210_the_plus_control_restores_a_deleted_pill\",\"duration\":17.822958000000654,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-210 \u2014 the user can point\"],\"fullName\":\"REQ-210 \u2014 the user can point test_UAT_FC_REQ-210_deleting_a_point_takes_its_pills_with_it\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-210_deleting_a_point_takes_its_pills_with_it\",\"duration\":30.270916999999827,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-210 \u2014 the user can point\"],\"fullName\":\"REQ-210 \u2014 the user can point test_UAT_FC_REQ-210_a_fresh_label_fades_when_the_pointer_leaves_it\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-210_a_fresh_label_fades_when_the_pointer_leaves_it\",\"duration\":15.021999999999935,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-210 \u2014 the user can point\"],\"fullName\":\"REQ-210 \u2014 the user can point test_UAT_FC_REQ-210_points_clear_on_send_and_the_marks_grey_out\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-210_points_clear_on_send_and_the_marks_grey_out\",\"duration\":20.4950000000008,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-210 \u2014 the user can point\"],\"fullName\":\"REQ-210 \u2014 the user can point test_UAT_FC_REQ-210_only_referenced_points_are_sent\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-210_only_referenced_points_are_sent\",\"duration\":14.966792000000169,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-210 \u2014 inverting the chain\"],\"fullName\":\"REQ-210 \u2014 inverting the chain test_UAT_FC_REQ-210_a_drawing_reports_its_own_view_of_itself\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-210_a_drawing_reports_its_own_view_of_itself\",\"duration\":0.15695899999991525,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-210 \u2014 inverting the chain\"],\"fullName\":\"REQ-210 \u2014 inverting the chain test_UAT_FC_REQ-210_object_fit_decides_where_the_drawing_is_painted\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-210_object_fit_decides_where_the_drawing_is_painted\",\"duration\":0.9317080000000715,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-210 \u2014 inverting the chain\"],\"fullName\":\"REQ-210 \u2014 inverting the chain test_UAT_FC_REQ-210_preserve_aspect_ratio_is_the_second_stage\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-210_preserve_aspect_ratio_is_the_second_stage\",\"duration\":0.208042000000205,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-210 \u2014 inverting the chain\"],\"fullName\":\"REQ-210 \u2014 inverting the chain test_UAT_FC_REQ-210_a_typed_reference_resolves_and_an_unknown_one_does_not\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-210_a_typed_reference_resolves_and_an_unknown_one_does_not\",\"duration\":0.09479199999987031,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-210 \u2014 inverting the chain\"],\"fullName\":\"REQ-210 \u2014 inverting the chain test_UAT_FC_REQ-210_anchor_lines_are_reported_per_axis_and_never_snapped\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-210_anchor_lines_are_reported_per_axis_and_never_snapped\",\"duration\":0.18149999999968713,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-210 \u2014 the pill reaches the assistant\"],\"fullName\":\"REQ-210 \u2014 the pill reaches the assistant test_UAT_FC_REQ-210_the_turn_carries_the_expansion_and_the_bubble_keeps_the_pill\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-210_the_turn_carries_the_expansion_and_the_bubble_keeps_the_pill\",\"duration\":5.604041999999936,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-210 \u2014 the pill reaches the assistant\"],\"fullName\":\"REQ-210 \u2014 the pill reaches the assistant test_UAT_FC_REQ-210_a_pill_survives_cut_and_paste_in_the_real_composer\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-210_a_pill_survives_cut_and_paste_in_the_real_composer\",\"duration\":1.3540419999999358,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-210 \u2014 one implementation, served\"],\"fullName\":\"REQ-210 \u2014 one implementation, served test_UAT_FC_REQ-210_the_browser_runs_the_same_modules_the_tools_do\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-210_the_browser_runs_the_same_modules_the_tools_do\",\"duration\":0.25508300000001327,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794158104614,\"endTime\":1794158104861.354,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-41/tests/test_UAT_FC_REQ-210_marked_points.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-e674c60a component scope: one name, written once test_UAT_AC960_component_scope_is_written_in_exactly_one_place",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a component scope: one name, written once test_UAT_AC960_browser_source_specifiers_are_declared_by_the_generated_document",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a naming test_UAT_AC960_the_site_surface_name_has_exactly_one_definition_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a builder origin test_UAT_AC977_every_response_the_origin_returns_is_non_cacheable",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-e674c60a builder origin test_UAT_AC961_components_are_served_byte_identical_from_outside_this_repo",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-44d0a572 \u2014 Marked Points on the edit render test_UAT_AC2418_dragging_a_mark_moves_its_point_and_re_resolves_it_where_the_drag_ends",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-71 \u2014 the emitted framework tree is the import graph test_UAT_FC_BUG-71_sibling_module_is_emitted_and_its_specifier_rewritten",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-71 \u2014 the emitted framework tree is the import graph test_UAT_FC_BUG-71_builder_import_graph_resolves_end_to_end",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-71 \u2014 the emitted framework tree is the import graph test_UAT_FC_BUG-71_each_source_is_emitted_at_exactly_one_url",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-71 \u2014 the emitted framework tree is the import graph test_UAT_FC_BUG-71_report_states_the_graph_it_verified",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-71 \u2014 a tree that cannot load is refused test_UAT_FC_BUG-71_dangling_specifiers_are_all_named_and_the_build_refuses",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-71 \u2014 a tree that cannot load is refused test_UAT_FC_BUG-71_a_whole_tree_passes_and_reports_its_size",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-72 \u2014 the mark you can reach, and the cross that is centred test_UAT_FC_BUG-72_a_fresh_label_survives_the_journey_to_its_own_controls",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-72 \u2014 the mark you can reach, and the cross that is centred test_UAT_FC_BUG-72_a_pointer_that_genuinely_leaves_still_fades_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "BUG-72 \u2014 the mark you can reach, and the cross that is centred test_UAT_FC_BUG-72_the_cross_is_geometry_rather_than_a_glyph",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-210 \u2014 the user can point test_UAT_FC_REQ-210_the_toggle_is_what_reassigns_the_click",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-210 \u2014 the user can point test_UAT_FC_REQ-210_a_point_in_a_drawing_reports_svg_user_space",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-210 \u2014 the user can point test_UAT_FC_REQ-210_near_names_lines_from_the_anchor_vocabulary",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-210 \u2014 the user can point test_UAT_FC_REQ-210_the_expansion_carries_the_width_and_document_coordinates",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-210 \u2014 the user can point test_UAT_FC_REQ-210_several_points_expand_to_distinct_entries",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-210 \u2014 the user can point test_UAT_FC_REQ-210_the_plus_control_restores_a_deleted_pill",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-210 \u2014 the user can point test_UAT_FC_REQ-210_deleting_a_point_takes_its_pills_with_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-210 \u2014 the user can point test_UAT_FC_REQ-210_a_fresh_label_fades_when_the_pointer_leaves_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-210 \u2014 the user can point test_UAT_FC_REQ-210_points_clear_on_send_and_the_marks_grey_out",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-210 \u2014 the user can point test_UAT_FC_REQ-210_only_referenced_points_are_sent",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-210 \u2014 inverting the chain test_UAT_FC_REQ-210_a_drawing_reports_its_own_view_of_itself",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-210 \u2014 inverting the chain test_UAT_FC_REQ-210_object_fit_decides_where_the_drawing_is_painted",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-210 \u2014 inverting the chain test_UAT_FC_REQ-210_preserve_aspect_ratio_is_the_second_stage",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-210 \u2014 inverting the chain test_UAT_FC_REQ-210_a_typed_reference_resolves_and_an_unknown_one_does_not",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-210 \u2014 inverting the chain test_UAT_FC_REQ-210_anchor_lines_are_reported_per_axis_and_never_snapped",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-210 \u2014 the pill reaches the assistant test_UAT_FC_REQ-210_the_turn_carries_the_expansion_and_the_bubble_keeps_the_pill",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-210 \u2014 the pill reaches the assistant test_UAT_FC_REQ-210_a_pill_survives_cut_and_paste_in_the_real_composer",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-210 \u2014 one implementation, served test_UAT_FC_REQ-210_the_browser_runs_the_same_modules_the_tools_do",
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