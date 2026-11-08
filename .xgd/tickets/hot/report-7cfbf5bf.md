---
uid: report-7cfbf5bf
id: REPORT-11382
type: report
title: 'Report: batch_quality_check for report-d87c1fe2'
created_by: xgd
created_at: '2026-11-08T09:24:07.070359+00:00'
updated_at: '2026-11-08T09:24:07.070359+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: report-d87c1fe2
  parent_report_uid: report-5c5e9f1b
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-11-08T09:21:05.723685Z",
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
      "duration_seconds": 3.0316461250185966,
      "passed": 3,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 3,
      "deselected": 11,
      "test_filter": [
        "test_UAT_AC2097_",
        "test_UAT_AC2378_"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "693_an_image_past_the_looking_ceiling_is_stored_whole_and_simply_not_looked_at\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-material-description-digest.workers.test.ts\\x1b[2m > \\x1b[22mstory-4cabde9a \u2014 what the system understands a file to be (digest era)\\x1b[2m > \\x1b[22mtest_UAT_AC1694_content_nothing_here_can_read_is_stored_and_marked_unreadable_by_type\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-material-description-digest.workers.test.ts\\x1b[2m > \\x1b[22mstory-4cabde9a \u2014 what the system understands a file to be (digest era)\\x1b[2m > \\x1b[22mtest_UAT_AC1695_a_font_is_described_from_the_faces_own_name_records_and_not_by_a_model\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-material-description-digest.workers.test.ts\\x1b[2m > \\x1b[22mstory-4cabde9a \u2014 what the system understands a file to be (digest era)\\x1b[2m > \\x1b[22mtest_UAT_AC1696_a_compressed_web_font_wrapper_degrades_honestly_rather_than_being_half_read\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-material-description-digest.workers.test.ts\\x1b[2m > \\x1b[22mstory-4cabde9a \u2014 what the system understands a file to be (digest era)\\x1b[2m > \\x1b[22mtest_UAT_AC1697_every_material_records_one_of_six_outcomes_and_who_produced_the_description\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-material-description-digest.workers.test.ts\\x1b[2m > \\x1b[22mstory-4cabde9a \u2014 what the system understands a file to be (digest era)\\x1b[2m > \\x1b[22mtest_UAT_AC1698_a_describer_that_is_reached_and_fails_costs_findability_and_nothing_else\n \\x1b[2m\\x1b[90m\u2193\\x1b[39m\\x1b[22m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-material-description-digest.workers.test.ts\\x1b[2m > \\x1b[22mstory-4cabde9a \u2014 what the system understands a file to be (digest era)\\x1b[2m > \\x1b[22mtest_UAT_AC1699_a_body_is_a_bounded_digest_a_title_one_collapsed_line_and_full_text_bounded_separately\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-material-description-session.workers.test.ts\\x1b[2m > \\x1b[22mstory-4cabde9a \u2014 describer sessions on the AI host (REQ-207)\\x1b[2m > \\x1b[22mtest_UAT_AC2097_documents_and_images_are_each_described_in_their_own_toolless_unprimed_session\\x1b[32m 36\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-material-description-session.workers.test.ts\\x1b[2m > \\x1b[22mstory-4cabde9a \u2014 describer sessions on the AI host (REQ-207)\\x1b[2m > \\x1b[22mtest_UAT_AC2378_image_and_document_describers_never_answer_for_each_other_in_either_build_order\\x1b[32m 1\\x1b[2mms\\x1b[22m\\x1b[39m\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m2 passed\\x1b[39m\\x1b[22m\\x1b[90m (2)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m3 passed\\x1b[39m\\x1b[22m\\x1b[2m | \\x1b[22m\\x1b[33m11 skipped\\x1b[39m\\x1b[90m (14)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 01:21:06\n\\x1b[2m   Duration \\x1b[22m 2.21s\\x1b[2m (transform 1.59s, setup 0ms, import 3.72s, tests 104ms, environment 0ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-o62eyg3n.json\n\n{\"numTotalTestSuites\":4,\"numPassedTestSuites\":4,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":14,\"numPassedTests\":3,\"numFailedTests\":0,\"numPendingTests\":11,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1794129666837,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be (digest era)\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC2097_describing_a_document_opens_one_toolless_unprimed_session_that_leaves_no_record\",\"status\":\"passed\",\"title\":\"test_UAT_AC2097_describing_a_document_opens_one_toolless_unprimed_session_that_leaves_no_record\",\"duration\":27,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be (digest era)\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC1688_a_document_that_carries_text_yields_a_digest_body_its_declared_title_and_its_full_text\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1688_a_document_that_carries_text_yields_a_digest_body_its_declared_title_and_its_full_text\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be (digest era)\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC1689_a_text_shaped_file_becomes_a_digest_body_with_its_decoded_contents_kept_in_full\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1689_a_text_shaped_file_becomes_a_digest_body_with_its_decoded_contents_kept_in_full\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be (digest era)\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC1690_a_document_with_nothing_extractable_is_stored_and_honestly_described\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1690_a_document_with_nothing_extractable_is_stored_and_honestly_described\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be (digest era)\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC1691_an_image_is_described_by_what_it_depicts_and_never_by_its_filename\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1691_an_image_is_described_by_what_it_depicts_and_never_by_its_filename\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be (digest era)\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC1693_an_image_past_the_looking_ceiling_is_stored_whole_and_simply_not_looked_at\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1693_an_image_past_the_looking_ceiling_is_stored_whole_and_simply_not_looked_at\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be (digest era)\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC1694_content_nothing_here_can_read_is_stored_and_marked_unreadable_by_type\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1694_content_nothing_here_can_read_is_stored_and_marked_unreadable_by_type\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be (digest era)\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC1695_a_font_is_described_from_the_faces_own_name_records_and_not_by_a_model\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1695_a_font_is_described_from_the_faces_own_name_records_and_not_by_a_model\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be (digest era)\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC1696_a_compressed_web_font_wrapper_degrades_honestly_rather_than_being_half_read\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1696_a_compressed_web_font_wrapper_degrades_honestly_rather_than_being_half_read\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be (digest era)\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC1697_every_material_records_one_of_six_outcomes_and_who_produced_the_description\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1697_every_material_records_one_of_six_outcomes_and_who_produced_the_description\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be (digest era)\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC1698_a_describer_that_is_reached_and_fails_costs_findability_and_nothing_else\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1698_a_describer_that_is_reached_and_fails_costs_findability_and_nothing_else\",\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be (digest era)\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC1699_a_body_is_a_bounded_digest_a_title_one_collapsed_line_and_full_text_bounded_separately\",\"status\":\"skipped\",\"title\":\"test_UAT_AC1699_a_body_is_a_bounded_digest_a_title_one_collapsed_line_and_full_text_bounded_separately\",\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794129669015,\"endTime\":1794129669042,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/reconciliation-material-description-digest.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-4cabde9a \u2014 describer sessions on the AI host (REQ-207)\"],\"fullName\":\"story-4cabde9a \u2014 describer sessions on the AI host (REQ-207) test_UAT_AC2097_documents_and_images_are_each_described_in_their_own_toolless_unprimed_session\",\"status\":\"passed\",\"title\":\"test_UAT_AC2097_documents_and_images_are_each_described_in_their_own_toolless_unprimed_session\",\"duration\":36,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4cabde9a \u2014 describer sessions on the AI host (REQ-207)\"],\"fullName\":\"story-4cabde9a \u2014 describer sessions on the AI host (REQ-207) test_UAT_AC2378_image_and_document_describers_never_answer_for_each_other_in_either_build_order\",\"status\":\"passed\",\"title\":\"test_UAT_AC2378_image_and_document_describers_never_answer_for_each_other_in_either_build_order\",\"duration\":1,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794129669016,\"endTime\":1794129669053,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/reconciliation-material-description-session.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC2097_describing_a_document_opens_one_toolless_unprimed_session_that_leaves_no_record",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 describer sessions on the AI host (REQ-207) test_UAT_AC2097_documents_and_images_are_each_described_in_their_own_toolless_unprimed_session",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 describer sessions on the AI host (REQ-207) test_UAT_AC2378_image_and_document_describers_never_answer_for_each_other_in_either_build_order",
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