---
uid: report-93afb665
id: REPORT-11292
type: report
title: 'Scoped quality: fail (23 tests, 11 failed, 3 orphan AC(s))'
created_by: xgd
created_at: '2026-11-08T05:50:28.085543+00:00'
updated_at: '2026-11-08T05:50:28.085543+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: quality
  subject_uid: story-4cabde9a
  commit: dc48df09f133006c78a3eb6d0cd451d098f782c5
---

{
  "timestamp": "2026-11-08T05:47:12.490463Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00015337485820055008,
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
      "duration_seconds": 6.011066082865,
      "passed": 12,
      "failed": 11,
      "skipped": 0,
      "errors": 0,
      "total": 23,
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
        "test_UAT_AC2097_",
        "test_UAT_AC2378_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "\u2014 describer sessions on the AI host (REQ-207) test_UAT_AC2378_image_and_document_describers_never_answer_for_each_other_in_either_build_order\",\"status\":\"failed\",\"title\":\"test_UAT_AC2378_image_and_document_describers_never_answer_for_each_other_in_either_build_order\",\"duration\":12,\"failureMessages\":[\"AssertionError: text-then-image: expected 'failed' to be 'ok' // Object.is equality\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/reconciliation-material-description-session.workers.test.ts:260:35\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]}],\"startTime\":1794116838302,\"endTime\":1794116838316,\"status\":\"failed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/reconciliation-material-description-session.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1690_a_document_with_nothing_extractable_is_stored_and_honestly_described\",\"status\":\"passed\",\"title\":\"test_UAT_AC1690_a_document_with_nothing_extractable_is_stored_and_honestly_described\",\"duration\":925,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1691_an_image_is_described_by_what_it_depicts_and_never_by_its_filename\",\"status\":\"passed\",\"title\":\"test_UAT_AC1691_an_image_is_described_by_what_it_depicts_and_never_by_its_filename\",\"duration\":1,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1692_with_no_image_describer_configured_the_record_says_nothing_has_looked_at_it\",\"status\":\"passed\",\"title\":\"test_UAT_AC1692_with_no_image_describer_configured_the_record_says_nothing_has_looked_at_it\",\"duration\":0,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1693_an_image_past_the_looking_ceiling_is_stored_whole_and_simply_not_looked_at\",\"status\":\"failed\",\"title\":\"test_UAT_AC1693_an_image_past_the_looking_ceiling_is_stored_whole_and_simply_not_looked_at\",\"duration\":11,\"failureMessages\":[\"TypeError: Cannot read properties of undefined (reading 'businessId')\\n    at ticketStoreFor (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/apps/control-app/src/tickets.ts:646:26)\\n    at storeFor (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/reconciliation-material-description.workers.test.ts:52:10)\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/reconciliation-material-description.workers.test.ts:357:25\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:302:11\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:26\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:2326:20\\n    at new Promise (<anonymous>)\\n    at runWithCancel (Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:2323:10)\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:2305:20\\n    at new Promise (<anonymous>)\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1694_content_nothing_here_can_read_is_stored_and_marked_unreadable_by_type\",\"status\":\"passed\",\"title\":\"test_UAT_AC1694_content_nothing_here_can_read_is_stored_and_marked_unreadable_by_type\",\"duration\":1,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1695_a_font_is_described_from_the_faces_own_name_records_and_not_by_a_model\",\"status\":\"passed\",\"title\":\"test_UAT_AC1695_a_font_is_described_from_the_faces_own_name_records_and_not_by_a_model\",\"duration\":1,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1696_a_compressed_web_font_wrapper_degrades_honestly_rather_than_being_half_read\",\"status\":\"passed\",\"title\":\"test_UAT_AC1696_a_compressed_web_font_wrapper_degrades_honestly_rather_than_being_half_read\",\"duration\":0,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1697_every_material_records_one_of_six_outcomes_and_who_produced_the_description\",\"status\":\"failed\",\"title\":\"test_UAT_AC1697_every_material_records_one_of_six_outcomes_and_who_produced_the_description\",\"duration\":0,\"failureMessages\":[\"TypeError: Cannot read properties of undefined (reading 'businessId')\\n    at ticketStoreFor (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/apps/control-app/src/tickets.ts:646:26)\\n    at storeFor (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/reconciliation-material-description.workers.test.ts:52:10)\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/reconciliation-material-description.workers.test.ts:506:25\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:302:11\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:26\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:2326:20\\n    at new Promise (<anonymous>)\\n    at runWithCancel (Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:2323:10)\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:2305:20\\n    at new Promise (<anonymous>)\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-4cabde9a \u2014 what the system understands a file to be\"],\"fullName\":\"story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1698_a_describer_that_is_reached_and_fails_costs_findability_and_nothing_else\",\"status\":\"failed\",\"title\":\"test_UAT_AC1698_a_describer_that_is_reached_and_fails_costs_findability_and_nothing_else\",\"duration\":1,\"failureMessages\":[\"TypeError: Cannot read properties of undefined (reading 'businessId')\\n    at ticketStoreFor (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/apps/control-app/src/tickets.ts:646:26)\\n    at storeFor (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/reconciliation-material-description.workers.test.ts:52:10)\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/reconciliation-material-description.workers.test.ts:606:25\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:302:11\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:26\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:2326:20\\n    at new Promise (<anonymous>)\\n    at runWithCancel (Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:2323:10)\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:2305:20\\n    at new Promise (<anonymous>)\"],\"meta\":{},\"tags\":[]}],\"startTime\":1794116837426,\"endTime\":1794116838366,\"status\":\"failed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-40/tests/reconciliation-material-description.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC2097_describing_a_document_opens_one_toolless_unprimed_session_that_leaves_no_record",
          "file": "",
          "status": "failed"
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
          "status": "failed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC1691_an_image_is_described_by_what_it_depicts_and_never_by_its_filename",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC1693_an_image_past_the_looking_ceiling_is_stored_whole_and_simply_not_looked_at",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC1694_content_nothing_here_can_read_is_stored_and_marked_unreadable_by_type",
          "file": "",
          "status": "failed"
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
          "status": "failed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC1698_a_describer_that_is_reached_and_fails_costs_findability_and_nothing_else",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC1699_a_body_is_a_bounded_digest_a_title_one_collapsed_line_and_full_text_bounded_separately",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-4cabde9a \u2014 describer sessions on the AI host (REQ-207) test_UAT_AC2097_documents_and_images_are_each_described_in_their_own_toolless_unprimed_session",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-4cabde9a \u2014 describer sessions on the AI host (REQ-207) test_UAT_AC2378_image_and_document_describers_never_answer_for_each_other_in_either_build_order",
          "file": "",
          "status": "failed"
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
          "status": "failed"
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
          "status": "failed"
        },
        {
          "name": "story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1698_a_describer_that_is_reached_and_fails_costs_findability_and_nothing_else",
          "file": "",
          "status": "failed"
        }
      ],
      "hung_test": null,
      "timeout_reason": null,
      "partial_results": false,
      "failures": [
        {
          "test_name": "story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC2097_describing_a_document_opens_one_toolless_unprimed_session_that_leaves_no_record",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC1690_a_document_with_nothing_extractable_is_stored_and_honestly_described",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC1693_an_image_past_the_looking_ceiling_is_stored_whole_and_simply_not_looked_at",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC1694_content_nothing_here_can_read_is_stored_and_marked_unreadable_by_type",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC1697_every_material_records_one_of_six_outcomes_and_who_produced_the_description",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-4cabde9a \u2014 what the system understands a file to be (digest era) test_UAT_AC1698_a_describer_that_is_reached_and_fails_costs_findability_and_nothing_else",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-4cabde9a \u2014 describer sessions on the AI host (REQ-207) test_UAT_AC2097_documents_and_images_are_each_described_in_their_own_toolless_unprimed_session",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-4cabde9a \u2014 describer sessions on the AI host (REQ-207) test_UAT_AC2378_image_and_document_describers_never_answer_for_each_other_in_either_build_order",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1693_an_image_past_the_looking_ceiling_is_stored_whole_and_simply_not_looked_at",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1697_every_material_records_one_of_six_outcomes_and_who_produced_the_description",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-4cabde9a \u2014 what the system understands a file to be test_UAT_AC1698_a_describer_that_is_reached_and_fails_costs_findability_and_nothing_else",
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
    },
    "AC Coverage": {
      "suite_name": "AC Coverage",
      "status": "failure",
      "passed": 9,
      "failed": 3,
      "total": 11,
      "failures": [
        {
          "test_name": "AC-1693 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1693 'An image past the ceiling for looking at one is stored whole and simply not looked at, rather than refused or shrunk' (uid=acceptance_criterion-4daa4b97) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1693.",
          "ac_uid": "acceptance_criterion-4daa4b97",
          "ac_id": "AC-1693",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1697 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1697 'Every material records exactly one of six description outcomes and who produced the description, so a re-describe pass is a query' (uid=acceptance_criterion-c4a490bd) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1697.",
          "ac_uid": "acceptance_criterion-c4a490bd",
          "ac_id": "AC-1697",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1698 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1698 'A describer that is reached and fails costs findability and nothing else: the file is stored and the upload is never reported as failed' (uid=acceptance_criterion-c0c441e7) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1698.",
          "ac_uid": "acceptance_criterion-c0c441e7",
          "ac_id": "AC-1698",
          "kind": "orphaned_ac"
        }
      ],
      "tests": []
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
        "message": "11 test(s) failed",
        "suggestion": "Fix failing tests",
        "context": {
          "failures": 11
        }
      }
    ]
  }
}