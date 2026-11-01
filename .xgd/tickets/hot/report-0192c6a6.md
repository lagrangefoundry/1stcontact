---
uid: report-0192c6a6
id: REPORT-7255
type: report
title: 'Scoped quality: pass (21 tests, 0 failed)'
created_by: xgd
created_at: '2026-11-01T03:46:58.277359+00:00'
updated_at: '2026-11-01T03:46:58.277359+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: STORY-141
  commit: c7f9d8ebbd28ed16ba72f8e1dd1c006a37140d9d
---

{
  "timestamp": "2026-11-01T03:44:08.336823Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00016604200936853886,
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
      "duration_seconds": 5.428656707983464,
      "passed": 21,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 21,
      "deselected": 0,
      "test_filter": [
        "test_UAT_AC1688_",
        "test_UAT_AC1689_",
        "test_UAT_AC1690_",
        "test_UAT_AC1691_",
        "test_UAT_AC1692_",
        "test_UAT_AC1693_",
        "test_UAT_AC1694_",
        "test_UAT_AC1695_",
        "test_UAT_AC1696_",
        "test_UAT_AC1697_",
        "test_UAT_AC1698_",
        "test_UAT_AC1699_",
        "test_UAT_AC2097_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "tSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":21,\"numPassedTests\":21,\"numFailedTests\":0,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1793504649397,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be (digest era)\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC2097_describing_a_document_opens_one_toolless_unprimed_session_that_leaves_no_record\",\"status\":\"passed\",\"title\":\"test_UAT_AC2097_describing_a_document_opens_one_toolless_unprimed_session_that_leaves_no_record\",\"duration\":38,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be (digest era)\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC1688_a_document_that_carries_text_yields_a_digest_body_its_declared_title_and_its_full_text\",\"status\":\"passed\",\"title\":\"test_UAT_AC1688_a_document_that_carries_text_yields_a_digest_body_its_declared_title_and_its_full_text\",\"duration\":1128,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be (digest era)\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC1689_a_text_shaped_file_becomes_a_digest_body_with_its_decoded_contents_kept_in_full\",\"status\":\"passed\",\"title\":\"test_UAT_AC1689_a_text_shaped_file_becomes_a_digest_body_with_its_decoded_contents_kept_in_full\",\"duration\":1,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be (digest era)\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC1690_a_document_with_nothing_extractable_is_stored_and_honestly_described\",\"status\":\"passed\",\"title\":\"test_UAT_AC1690_a_document_with_nothing_extractable_is_stored_and_honestly_described\",\"duration\":8,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be (digest era)\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC1691_an_image_is_described_by_what_it_depicts_and_never_by_its_filename\",\"status\":\"passed\",\"title\":\"test_UAT_AC1691_an_image_is_described_by_what_it_depicts_and_never_by_its_filename\",\"duration\":1,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be (digest era)\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC1693_an_image_past_the_looking_ceiling_is_stored_whole_and_simply_not_looked_at\",\"status\":\"passed\",\"title\":\"test_UAT_AC1693_an_image_past_the_looking_ceiling_is_stored_whole_and_simply_not_looked_at\",\"duration\":62,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be (digest era)\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC1694_content_nothing_here_can_read_is_stored_and_marked_unreadable_by_type\",\"status\":\"passed\",\"title\":\"test_UAT_AC1694_content_nothing_here_can_read_is_stored_and_marked_unreadable_by_type\",\"duration\":8,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be (digest era)\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC1695_a_font_is_described_from_the_faces_own_name_records_and_not_by_a_model\",\"status\":\"passed\",\"title\":\"test_UAT_AC1695_a_font_is_described_from_the_faces_own_name_records_and_not_by_a_model\",\"duration\":1,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be (digest era)\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC1696_a_compressed_web_font_wrapper_degrades_honestly_rather_than_being_half_read\",\"status\":\"passed\",\"title\":\"test_UAT_AC1696_a_compressed_web_font_wrapper_degrades_honestly_rather_than_being_half_read\",\"duration\":0,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be (digest era)\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC1697_every_material_records_one_of_six_outcomes_and_who_produced_the_description\",\"status\":\"passed\",\"title\":\"test_UAT_AC1697_every_material_records_one_of_six_outcomes_and_who_produced_the_description\",\"duration\":70,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be (digest era)\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC1698_a_describer_that_is_reached_and_fails_costs_findability_and_nothing_else\",\"status\":\"passed\",\"title\":\"test_UAT_AC1698_a_describer_that_is_reached_and_fails_costs_findability_and_nothing_else\",\"duration\":16,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be (digest era)\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC1699_a_body_is_a_bounded_digest_a_title_one_collapsed_line_and_full_text_bounded_separately\",\"status\":\"passed\",\"title\":\"test_UAT_AC1699_a_body_is_a_bounded_digest_a_title_one_collapsed_line_and_full_text_bounded_separately\",\"duration\":4,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793504652609,\"endTime\":1793504653946,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-34/tests/reconciliation-material-description-digest.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1690_a_document_with_nothing_extractable_is_stored_and_honestly_described\",\"status\":\"passed\",\"title\":\"test_UAT_AC1690_a_document_with_nothing_extractable_is_stored_and_honestly_described\",\"duration\":1061,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1691_an_image_is_described_by_what_it_depicts_and_never_by_its_filename\",\"status\":\"passed\",\"title\":\"test_UAT_AC1691_an_image_is_described_by_what_it_depicts_and_never_by_its_filename\",\"duration\":1,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1692_with_no_image_describer_configured_the_record_says_nothing_has_looked_at_it\",\"status\":\"passed\",\"title\":\"test_UAT_AC1692_with_no_image_describer_configured_the_record_says_nothing_has_looked_at_it\",\"duration\":1,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1693_an_image_past_the_looking_ceiling_is_stored_whole_and_simply_not_looked_at\",\"status\":\"passed\",\"title\":\"test_UAT_AC1693_an_image_past_the_looking_ceiling_is_stored_whole_and_simply_not_looked_at\",\"duration\":68,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1694_content_nothing_here_can_read_is_stored_and_marked_unreadable_by_type\",\"status\":\"passed\",\"title\":\"test_UAT_AC1694_content_nothing_here_can_read_is_stored_and_marked_unreadable_by_type\",\"duration\":2,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1695_a_font_is_described_from_the_faces_own_name_records_and_not_by_a_model\",\"status\":\"passed\",\"title\":\"test_UAT_AC1695_a_font_is_described_from_the_faces_own_name_records_and_not_by_a_model\",\"duration\":0,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1696_a_compressed_web_font_wrapper_degrades_honestly_rather_than_being_half_read\",\"status\":\"passed\",\"title\":\"test_UAT_AC1696_a_compressed_web_font_wrapper_degrades_honestly_rather_than_being_half_read\",\"duration\":0,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1697_every_material_records_one_of_six_outcomes_and_who_produced_the_description\",\"status\":\"passed\",\"title\":\"test_UAT_AC1697_every_material_records_one_of_six_outcomes_and_who_produced_the_description\",\"duration\":71,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1698_a_describer_that_is_reached_and_fails_costs_findability_and_nothing_else\",\"status\":\"passed\",\"title\":\"test_UAT_AC1698_a_describer_that_is_reached_and_fails_costs_findability_and_nothing_else\",\"duration\":11,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793504652699,\"endTime\":1793504653914,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-34/tests/reconciliation-material-description.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC2097_describing_a_document_opens_one_toolless_unprimed_session_that_leaves_no_record",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC1688_a_document_that_carries_text_yields_a_digest_body_its_declared_title_and_its_full_text",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC1689_a_text_shaped_file_becomes_a_digest_body_with_its_decoded_contents_kept_in_full",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC1690_a_document_with_nothing_extractable_is_stored_and_honestly_described",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC1691_an_image_is_described_by_what_it_depicts_and_never_by_its_filename",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC1693_an_image_past_the_looking_ceiling_is_stored_whole_and_simply_not_looked_at",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC1694_content_nothing_here_can_read_is_stored_and_marked_unreadable_by_type",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC1695_a_font_is_described_from_the_faces_own_name_records_and_not_by_a_model",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC1696_a_compressed_web_font_wrapper_degrades_honestly_rather_than_being_half_read",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC1697_every_material_records_one_of_six_outcomes_and_who_produced_the_description",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC1698_a_describer_that_is_reached_and_fails_costs_findability_and_nothing_else",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC1699_a_body_is_a_bounded_digest_a_title_one_collapsed_line_and_full_text_bounded_separately",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1690_a_document_with_nothing_extractable_is_stored_and_honestly_described",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1691_an_image_is_described_by_what_it_depicts_and_never_by_its_filename",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1692_with_no_image_describer_configured_the_record_says_nothing_has_looked_at_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1693_an_image_past_the_looking_ceiling_is_stored_whole_and_simply_not_looked_at",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1694_content_nothing_here_can_read_is_stored_and_marked_unreadable_by_type",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1695_a_font_is_described_from_the_faces_own_name_records_and_not_by_a_model",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1696_a_compressed_web_font_wrapper_degrades_honestly_rather_than_being_half_read",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1697_every_material_records_one_of_six_outcomes_and_who_produced_the_description",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1698_a_describer_that_is_reached_and_fails_costs_findability_and_nothing_else",
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