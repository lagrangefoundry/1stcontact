---
uid: report-4c130cc7
id: REPORT-11326
type: report
title: 'Report: batch_quality_check for story-39c992d3'
created_by: xgd
created_at: '2026-11-08T07:03:15.771401+00:00'
updated_at: '2026-11-08T07:03:15.771401+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: story-39c992d3
  parent_report_uid: report-a313553e
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-11-08T07:00:08.608514Z",
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
      "duration_seconds": 4.860920500010252,
      "passed": 25,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 25,
      "deselected": 0,
      "test_filter": [
        "test_UAT_AC2380_",
        "test_UAT_AC2379_",
        "test_UAT_AC2381_",
        "test_UAT_AC2382_",
        "test_UAT_AC2383_",
        "test_UAT_AC2384_",
        "test_UAT_AC2385_",
        "test_UAT_AC2386_",
        "test_UAT_AC2387_",
        "test_UAT_AC2388_",
        "test_UAT_AC2389_",
        "test_UAT_AC2390_",
        "test_UAT_AC2391_",
        "test_UAT_FC_REQ-208_"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": " as ordinary material test_UAT_AC2379_a_session_with_an_image_credential_generates_a_picture_into_the_library\",\"status\":\"passed\",\"title\":\"test_UAT_AC2379_a_session_with_an_image_credential_generates_a_picture_into_the_library\",\"duration\":54,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material\"],\"fullName\":\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2380_nothing_the_model_sees_names_the_image_vendor\",\"status\":\"passed\",\"title\":\"test_UAT_AC2380_nothing_the_model_sees_names_the_image_vendor\",\"duration\":104,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material\"],\"fullName\":\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2381_without_an_image_credential_the_session_works_and_has_no_image_tool\",\"status\":\"passed\",\"title\":\"test_UAT_AC2381_without_an_image_credential_the_session_works_and_has_no_image_tool\",\"duration\":19,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material\"],\"fullName\":\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2382_a_missing_image_credential_does_not_make_the_product_unconfigured\",\"status\":\"passed\",\"title\":\"test_UAT_AC2382_a_missing_image_credential_does_not_make_the_product_unconfigured\",\"duration\":18,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material\"],\"fullName\":\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2383_a_generated_picture_carries_the_full_material_vocabulary\",\"status\":\"passed\",\"title\":\"test_UAT_AC2383_a_generated_picture_carries_the_full_material_vocabulary\",\"duration\":24,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material\"],\"fullName\":\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2384_a_generated_picture_is_marked_generated_and_selectable_by_origin\",\"status\":\"passed\",\"title\":\"test_UAT_AC2384_a_generated_picture_is_marked_generated_and_selectable_by_origin\",\"duration\":23,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material\"],\"fullName\":\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2385_a_generated_picture_is_findable_by_its_prompt_without_a_describe_call\",\"status\":\"passed\",\"title\":\"test_UAT_AC2385_a_generated_picture_is_findable_by_its_prompt_without_a_describe_call\",\"duration\":36,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material\"],\"fullName\":\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2386_image_generation_is_capped_at_ten_attempts_per_session\",\"status\":\"passed\",\"title\":\"test_UAT_AC2386_image_generation_is_capped_at_ten_attempts_per_session\",\"duration\":55,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material\"],\"fullName\":\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2387_a_provider_refusal_is_a_named_actionable_error_and_creates_nothing\",\"status\":\"passed\",\"title\":\"test_UAT_AC2387_a_provider_refusal_is_a_named_actionable_error_and_creates_nothing\",\"duration\":21,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material\"],\"fullName\":\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2388_an_unsupported_aspect_ratio_is_named_as_a_shape_before_any_provider_call\",\"status\":\"passed\",\"title\":\"test_UAT_AC2388_an_unsupported_aspect_ratio_is_named_as_a_shape_before_any_provider_call\",\"duration\":15,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material\"],\"fullName\":\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2389_generating_places_nothing_and_promote_is_the_separate_step_that_does\",\"status\":\"passed\",\"title\":\"test_UAT_AC2389_generating_places_nothing_and_promote_is_the_separate_step_that_does\",\"duration\":28,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material\"],\"fullName\":\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2390_the_image_store_only_creates_material_and_only_attaches_to_its_own\",\"status\":\"passed\",\"title\":\"test_UAT_AC2390_the_image_store_only_creates_material_and_only_attaches_to_its_own\",\"duration\":4,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material\"],\"fullName\":\"story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2391_the_image_credential_is_redacted_from_everything_a_person_is_shown\",\"status\":\"passed\",\"title\":\"test_UAT_AC2391_the_image_credential_is_redacted_from_everything_a_person_is_shown\",\"duration\":16,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794121213356,\"endTime\":1794121213773,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/reconciliation-consultant-image-generation.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-208 \u2014 the assistant can make pictures\"],\"fullName\":\"REQ-208 \u2014 the assistant can make pictures test_UAT_FC_REQ-208_a_consultant_session_can_make_a_picture\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-208_a_consultant_session_can_make_a_picture\",\"duration\":32,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-208 \u2014 the assistant can make pictures\"],\"fullName\":\"REQ-208 \u2014 the assistant can make pictures test_UAT_FC_REQ-208_the_model_never_learns_which_vendor_drew_the_image\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-208_the_model_never_learns_which_vendor_drew_the_image\",\"duration\":27,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-208 \u2014 the assistant can make pictures\"],\"fullName\":\"REQ-208 \u2014 the assistant can make pictures test_UAT_FC_REQ-208_a_deployment_with_no_image_key_has_no_image_tool\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-208_a_deployment_with_no_image_key_has_no_image_tool\",\"duration\":18,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-208 \u2014 the assistant can make pictures\"],\"fullName\":\"REQ-208 \u2014 the assistant can make pictures test_UAT_FC_REQ-208_no_image_key_does_not_make_the_product_unconfigured\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-208_no_image_key_does_not_make_the_product_unconfigured\",\"duration\":1,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-208 \u2014 the assistant can make pictures\"],\"fullName\":\"REQ-208 \u2014 the assistant can make pictures test_UAT_FC_REQ-208_a_generated_image_is_an_ordinary_material\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-208_a_generated_image_is_an_ordinary_material\",\"duration\":27,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-208 \u2014 the assistant can make pictures\"],\"fullName\":\"REQ-208 \u2014 the assistant can make pictures test_UAT_FC_REQ-208_a_generated_image_is_legible_as_generated\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-208_a_generated_image_is_legible_as_generated\",\"duration\":25,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-208 \u2014 the assistant can make pictures\"],\"fullName\":\"REQ-208 \u2014 the assistant can make pictures test_UAT_FC_REQ-208_a_generated_image_is_findable_the_moment_it_exists\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-208_a_generated_image_is_findable_the_moment_it_exists\",\"duration\":23,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-208 \u2014 the assistant can make pictures\"],\"fullName\":\"REQ-208 \u2014 the assistant can make pictures test_UAT_FC_REQ-208_generation_is_bounded_per_session\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-208_generation_is_bounded_per_session\",\"duration\":69,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-208 \u2014 the assistant can make pictures\"],\"fullName\":\"REQ-208 \u2014 the assistant can make pictures test_UAT_FC_REQ-208_a_refusal_is_an_error_the_model_can_act_on\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-208_a_refusal_is_an_error_the_model_can_act_on\",\"duration\":18,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-208 \u2014 the assistant can make pictures\"],\"fullName\":\"REQ-208 \u2014 the assistant can make pictures test_UAT_FC_REQ-208_a_shape_the_provider_cannot_make_is_named_as_a_shape\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-208_a_shape_the_provider_cannot_make_is_named_as_a_shape\",\"duration\":17,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-208 \u2014 the assistant can make pictures\"],\"fullName\":\"REQ-208 \u2014 the assistant can make pictures test_UAT_FC_REQ-208_nothing_is_placed_on_a_site_by_generating_it\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-208_nothing_is_placed_on_a_site_by_generating_it\",\"duration\":23,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-208 \u2014 the assistant can make pictures\"],\"fullName\":\"REQ-208 \u2014 the assistant can make pictures test_UAT_FC_REQ-208_the_plugin_cannot_write_an_arbitrary_ticket\",\"status\":\"passed\",\"title\":\"test_UAT_FC_REQ-208_the_plugin_cannot_write_an_arbitrary_ticket\",\"duration\":4,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794121213356,\"endTime\":1794121213640,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/test_UAT_FC_REQ-208_the_assistant_can_make_pictures.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2379_a_session_with_an_image_credential_generates_a_picture_into_the_library",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2380_nothing_the_model_sees_names_the_image_vendor",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2381_without_an_image_credential_the_session_works_and_has_no_image_tool",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2382_a_missing_image_credential_does_not_make_the_product_unconfigured",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2383_a_generated_picture_carries_the_full_material_vocabulary",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2384_a_generated_picture_is_marked_generated_and_selectable_by_origin",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2385_a_generated_picture_is_findable_by_its_prompt_without_a_describe_call",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2386_image_generation_is_capped_at_ten_attempts_per_session",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2387_a_provider_refusal_is_a_named_actionable_error_and_creates_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2388_an_unsupported_aspect_ratio_is_named_as_a_shape_before_any_provider_call",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2389_generating_places_nothing_and_promote_is_the_separate_step_that_does",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2390_the_image_store_only_creates_material_and_only_attaches_to_its_own",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-39c992d3 \u2014 the consultant can generate a picture as ordinary material test_UAT_AC2391_the_image_credential_is_redacted_from_everything_a_person_is_shown",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-208 \u2014 the assistant can make pictures test_UAT_FC_REQ-208_a_consultant_session_can_make_a_picture",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-208 \u2014 the assistant can make pictures test_UAT_FC_REQ-208_the_model_never_learns_which_vendor_drew_the_image",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-208 \u2014 the assistant can make pictures test_UAT_FC_REQ-208_a_deployment_with_no_image_key_has_no_image_tool",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-208 \u2014 the assistant can make pictures test_UAT_FC_REQ-208_no_image_key_does_not_make_the_product_unconfigured",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-208 \u2014 the assistant can make pictures test_UAT_FC_REQ-208_a_generated_image_is_an_ordinary_material",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-208 \u2014 the assistant can make pictures test_UAT_FC_REQ-208_a_generated_image_is_legible_as_generated",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-208 \u2014 the assistant can make pictures test_UAT_FC_REQ-208_a_generated_image_is_findable_the_moment_it_exists",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-208 \u2014 the assistant can make pictures test_UAT_FC_REQ-208_generation_is_bounded_per_session",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-208 \u2014 the assistant can make pictures test_UAT_FC_REQ-208_a_refusal_is_an_error_the_model_can_act_on",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-208 \u2014 the assistant can make pictures test_UAT_FC_REQ-208_a_shape_the_provider_cannot_make_is_named_as_a_shape",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-208 \u2014 the assistant can make pictures test_UAT_FC_REQ-208_nothing_is_placed_on_a_site_by_generating_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-208 \u2014 the assistant can make pictures test_UAT_FC_REQ-208_the_plugin_cannot_write_an_arbitrary_ticket",
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