---
uid: report-a1ed2f80
id: REPORT-11973
type: report
title: 'Scoped quality: fail (24 tests, 16 failed, 11 orphan AC(s))'
created_by: xgd
created_at: '2026-11-09T17:57:35.330039+00:00'
updated_at: '2026-11-09T17:57:35.330039+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: quality
  subject_uid: story-6ccaedd5
  commit: 539a6bc7359bb34fb1d7655d0faa5e080a94755e
---

{
  "timestamp": "2026-11-09T17:52:08.614264Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00023774988949298859,
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
      "duration_seconds": 22.09191158413887,
      "passed": 8,
      "failed": 16,
      "skipped": 0,
      "errors": 0,
      "total": 24,
      "deselected": 0,
      "test_filter": [
        "test_UAT_AC1678_",
        "test_UAT_AC1679_",
        "test_UAT_AC1680_",
        "test_UAT_AC1681_",
        "test_UAT_AC1682_",
        "test_UAT_AC1683_",
        "test_UAT_AC1684_",
        "test_UAT_AC1685_",
        "test_UAT_AC1686_",
        "test_UAT_AC1687_",
        "test_UAT_AC1809_",
        "test_UAT_AC1810_",
        "test_UAT_AC2095_",
        "test_UAT_AC2096_",
        "test_UAT_AC2098_",
        "test_UAT_AC2534_",
        "test_UAT_AC2535_",
        "test_UAT_AC2536_",
        "test_UAT_AC2537_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "C1684_a_file_over_the_ceiling_or_with_no_bytes_is_refused_and_leaves_nothing_behind\",\"duration\":0,\"failureMessages\":[\"TypeError: Cannot read properties of undefined (reading 'businessId')\\n    at ticketStoreFor (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-43/apps/control-app/src/tickets.ts:703:26)\\n    at materialCount (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-43/tests/reconciliation-material-ingestion.workers.test.ts:151:23)\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-43/tests/reconciliation-material-ingestion.workers.test.ts:441:33\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-43/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:302:11\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-43/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:26\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-43/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:2326:20\\n    at new Promise (<anonymous>)\\n    at runWithCancel (Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-43/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:2323:10)\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-43/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:2305:20\\n    at new Promise (<anonymous>)\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-6ccaedd5 \u2014 a file handed to the platform becomes material\"],\"fullName\":\"story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1685_each_created_material_is_announced_for_indexing_exactly_once\",\"status\":\"failed\",\"title\":\"test_UAT_AC1685_each_created_material_is_announced_for_indexing_exactly_once\",\"duration\":74,\"failureMessages\":[\"AssertionError: expected [] to deeply equal [ 'undefined' ]\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-43/tests/reconciliation-material-ingestion.workers.test.ts:473:23\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-43/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-6ccaedd5 \u2014 a file handed to the platform becomes material\"],\"fullName\":\"story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1686_new_material_is_searchable_immediately_without_reprocessing_the_rest\",\"status\":\"failed\",\"title\":\"test_UAT_AC1686_new_material_is_searchable_immediately_without_reprocessing_the_rest\",\"duration\":1,\"failureMessages\":[\"Error: D1_TYPE_ERROR: Type 'undefined' not supported for value 'undefined'\\n    at cloudflare-internal:d1-api:318:19\\n    at Array.map (<anonymous>)\\n    at D1PreparedStatement.bind (cloudflare-internal:d1-api:290:42)\\n    at Accessor.getTenant (/Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/ticketing/src/accessor.js:654:8)\\n    at ticketStoreFor (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-43/apps/control-app/src/tickets.ts:706:29)\\n    at projectKnowledgeFor (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-43/apps/control-app/src/knowledge.ts:670:38)\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-43/tests/reconciliation-material-ingestion.workers.test.ts:486:22\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-43/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:302:11\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-43/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:26\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-43/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:2326:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-6ccaedd5 \u2014 a file handed to the platform becomes material\"],\"fullName\":\"story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1687_with_no_indexer_the_file_is_still_stored_and_both_the_answer_and_the_log_say_so\",\"status\":\"failed\",\"title\":\"test_UAT_AC1687_with_no_indexer_the_file_is_still_stored_and_both_the_answer_and_the_log_say_so\",\"duration\":3,\"failureMessages\":[\"AssertionError: expected 503 to be 200 // Object.is equality\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-43/tests/reconciliation-material-ingestion.workers.test.ts:545:29\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-43/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]}],\"startTime\":1794246750305,\"endTime\":1794246750435,\"status\":\"failed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-43/tests/reconciliation-material-ingestion.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-6ccaedd5 \u2014 a document keeps its own text beside its material (REQ-173)\"],\"fullName\":\"story-6ccaedd5 \u2014 a document keeps its own text beside its material (REQ-173) test_UAT_AC2095_a_documents_full_text_is_stored_once_as_a_material_text_comment_bounded_and_marked_where_truncated\",\"status\":\"failed\",\"title\":\"test_UAT_AC2095_a_documents_full_text_is_stored_once_as_a_material_text_comment_bounded_and_marked_where_truncated\",\"duration\":9,\"failureMessages\":[\"AssertionError: expected 503 to be 200 // Object.is equality\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-43/tests/reconciliation-material-text-comment.workers.test.ts:126:29\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-43/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-6ccaedd5 \u2014 a document keeps its own text beside its material (REQ-173)\"],\"fullName\":\"story-6ccaedd5 \u2014 a document keeps its own text beside its material (REQ-173) test_UAT_AC2096_a_deep_text_search_finds_the_material_by_its_own_uid_while_its_listed_description_is_the_digest\",\"status\":\"failed\",\"title\":\"test_UAT_AC2096_a_deep_text_search_finds_the_material_by_its_own_uid_while_its_listed_description_is_the_digest\",\"duration\":19,\"failureMessages\":[\"Error: D1_TYPE_ERROR: Type 'undefined' not supported for value 'undefined'\\n    at cloudflare-internal:d1-api:318:19\\n    at Array.map (<anonymous>)\\n    at D1PreparedStatement.bind (cloudflare-internal:d1-api:290:42)\\n    at Accessor.getTenant (/Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/ticketing/src/accessor.js:654:8)\\n    at ticketStoreFor (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-43/apps/control-app/src/tickets.ts:706:29)\\n    at projectKnowledgeFor (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-43/apps/control-app/src/knowledge.ts:670:38)\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-43/tests/reconciliation-material-text-comment.workers.test.ts:181:22\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-43/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:302:11\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-43/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:26\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-43/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:2326:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-6ccaedd5 \u2014 a deployment with no model key refuses ingestion (REQ-173)\"],\"fullName\":\"story-6ccaedd5 \u2014 a deployment with no model key refuses ingestion (REQ-173) test_UAT_AC2098_with_no_key_the_status_route_says_so_and_both_ingestion_routes_refuse_with_503_storing_nothing\",\"status\":\"failed\",\"title\":\"test_UAT_AC2098_with_no_key_the_status_route_says_so_and_both_ingestion_routes_refuse_with_503_storing_nothing\",\"duration\":2,\"failureMessages\":[\"TypeError: Cannot read properties of undefined (reading 'businessId')\\n    at ticketStoreFor (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-43/apps/control-app/src/tickets.ts:703:26)\\n    at holdings (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-43/tests/reconciliation-material-text-comment.workers.test.ts:97:23)\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-43/tests/reconciliation-material-text-comment.workers.test.ts:243:26\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-43/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]}],\"startTime\":1794246750356,\"endTime\":1794246750386,\"status\":\"failed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-43/tests/reconciliation-material-text-comment.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "REQ-173 \u2014 the reason is at the top and everything below is off test_UAT_AC2098_an_unconfigured_deployment_shows_the_reason_in_a_banner_and_the_builder_below_accepts_no_input",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-173 \u2014 the reason is at the top and everything below is off test_UAT_AC2098_a_configured_deployment_shows_no_banner_and_is_not_blocked",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-173 \u2014 the reason is at the top and everything below is off test_UAT_AC2098_with_no_key_no_chat_session_is_opened_and_the_pane_says_why",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-173 \u2014 the reason is at the top and everything below is off test_UAT_AC2098_with_no_key_a_dropped_file_is_not_uploaded",
          "file": "",
          "status": "passed"
        },
        {
          "name": "STORY-6ccaedd5 \u2014 the image converter binding (REQ-221) test_UAT_AC2537_the_images_binding_is_declared_once_under_the_same_name_locally_and_in_production",
          "file": "",
          "status": "failed"
        },
        {
          "name": "STORY-6ccaedd5 \u2014 HEIC at the upload door (REQ-221) test_UAT_AC2534_a_heif_upload_is_stored_as_a_jpeg_image_named_jpg_whatever_its_declared_type",
          "file": "",
          "status": "passed"
        },
        {
          "name": "STORY-6ccaedd5 \u2014 HEIC at the upload door (REQ-221) test_UAT_AC2535_avif_and_every_non_heif_upload_is_stored_byte_for_byte_under_its_own_name",
          "file": "",
          "status": "passed"
        },
        {
          "name": "STORY-6ccaedd5 \u2014 HEIC at the upload door (REQ-221) test_UAT_AC2536_an_unconvertible_heic_is_refused_with_a_distinct_sentence_and_nothing_is_created",
          "file": "",
          "status": "passed"
        },
        {
          "name": "STORY-6ccaedd5 \u2014 HEIC at the upload door (REQ-221) test_UAT_AC1810_a_declared_heic_type_on_bytes_that_are_not_heif_is_carried_through_untouched",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6ccaedd5 \u2014 the content type is settled once, at the head test_UAT_AC1809_a_silent_type_is_settled_from_the_filename_and_every_consumer_reads_that_value",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-6ccaedd5 \u2014 the content type is settled once, at the head test_UAT_AC1810_a_stated_type_is_never_second_guessed_and_an_unreadable_extension_degrades_honestly",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1678_an_ingested_file_becomes_a_stored_material_whose_body_is_its_description",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1679_ingested_bytes_reside_in_the_private_store_and_never_in_the_public_one",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1680_one_accounts_material_is_invisible_to_another_accounts_listing_and_search",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1681_an_interruption_never_leaves_a_record_naming_bytes_that_are_not_there",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1682_kind_follows_the_content_type_then_the_filename_and_unrecognised_stays_a_document",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1683_rights_are_inferred_from_provenance_and_never_taken_from_the_request",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1684_a_file_over_the_ceiling_or_with_no_bytes_is_refused_and_leaves_nothing_behind",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1685_each_created_material_is_announced_for_indexing_exactly_once",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1686_new_material_is_searchable_immediately_without_reprocessing_the_rest",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1687_with_no_indexer_the_file_is_still_stored_and_both_the_answer_and_the_log_say_so",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-6ccaedd5 \u2014 a document keeps its own text beside its material (REQ-173) test_UAT_AC2095_a_documents_full_text_is_stored_once_as_a_material_text_comment_bounded_and_marked_where_truncated",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-6ccaedd5 \u2014 a document keeps its own text beside its material (REQ-173) test_UAT_AC2096_a_deep_text_search_finds_the_material_by_its_own_uid_while_its_listed_description_is_the_digest",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-6ccaedd5 \u2014 a deployment with no model key refuses ingestion (REQ-173) test_UAT_AC2098_with_no_key_the_status_route_says_so_and_both_ingestion_routes_refuse_with_503_storing_nothing",
          "file": "",
          "status": "failed"
        }
      ],
      "hung_test": null,
      "timeout_reason": null,
      "partial_results": false,
      "failures": [
        {
          "test_name": "STORY-6ccaedd5 \u2014 the image converter binding (REQ-221) test_UAT_AC2537_the_images_binding_is_declared_once_under_the_same_name_locally_and_in_production",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-6ccaedd5 \u2014 the content type is settled once, at the head test_UAT_AC1809_a_silent_type_is_settled_from_the_filename_and_every_consumer_reads_that_value",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-6ccaedd5 \u2014 the content type is settled once, at the head test_UAT_AC1810_a_stated_type_is_never_second_guessed_and_an_unreadable_extension_degrades_honestly",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1678_an_ingested_file_becomes_a_stored_material_whose_body_is_its_description",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1679_ingested_bytes_reside_in_the_private_store_and_never_in_the_public_one",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1680_one_accounts_material_is_invisible_to_another_accounts_listing_and_search",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1681_an_interruption_never_leaves_a_record_naming_bytes_that_are_not_there",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1682_kind_follows_the_content_type_then_the_filename_and_unrecognised_stays_a_document",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1683_rights_are_inferred_from_provenance_and_never_taken_from_the_request",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1684_a_file_over_the_ceiling_or_with_no_bytes_is_refused_and_leaves_nothing_behind",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1685_each_created_material_is_announced_for_indexing_exactly_once",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1686_new_material_is_searchable_immediately_without_reprocessing_the_rest",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1687_with_no_indexer_the_file_is_still_stored_and_both_the_answer_and_the_log_say_so",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-6ccaedd5 \u2014 a document keeps its own text beside its material (REQ-173) test_UAT_AC2095_a_documents_full_text_is_stored_once_as_a_material_text_comment_bounded_and_marked_where_truncated",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-6ccaedd5 \u2014 a document keeps its own text beside its material (REQ-173) test_UAT_AC2096_a_deep_text_search_finds_the_material_by_its_own_uid_while_its_listed_description_is_the_digest",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-6ccaedd5 \u2014 a deployment with no model key refuses ingestion (REQ-173) test_UAT_AC2098_with_no_key_the_status_route_says_so_and_both_ingestion_routes_refuse_with_503_storing_nothing",
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
      "passed": 5,
      "failed": 11,
      "total": 12,
      "failures": [
        {
          "test_name": "AC-1809 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1809 'A content type the sender did not state is settled once from the filename, and classification, description and the stored-bytes record all read that one value' (uid=acceptance_criterion-236187a6) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1809.",
          "ac_uid": "acceptance_criterion-236187a6",
          "ac_id": "AC-1809",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1678 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1678 'An ingested file becomes a stored material record whose body is its description, and the answer reports what was stored' (uid=acceptance_criterion-7e29a2bc) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1678.",
          "ac_uid": "acceptance_criterion-7e29a2bc",
          "ac_id": "AC-1678",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1682 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1682 'Kind is taken from the declared content type, from the filename where the type says nothing, and an unrecognised file is kept as a document' (uid=acceptance_criterion-7ffeab5a) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1682.",
          "ac_uid": "acceptance_criterion-7ffeab5a",
          "ac_id": "AC-1682",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1679 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1679 'Ingested bytes reside in the account's private material store and never in the store that serves the public internet' (uid=acceptance_criterion-065a54c4) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1679.",
          "ac_uid": "acceptance_criterion-065a54c4",
          "ac_id": "AC-1679",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1680 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1680 'One account's ingested material is invisible to another account's listing and search' (uid=acceptance_criterion-11855dbf) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1680.",
          "ac_uid": "acceptance_criterion-11855dbf",
          "ac_id": "AC-1680",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1681 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1681 'An interruption during ingestion never leaves a record naming bytes that are not there' (uid=acceptance_criterion-df7735b6) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1681.",
          "ac_uid": "acceptance_criterion-df7735b6",
          "ac_id": "AC-1681",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1683 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1683 'Rights are inferred from provenance and never asked: an upload lands owned, republishable and not exportable, whatever the request claims' (uid=acceptance_criterion-9c50e45e) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1683.",
          "ac_uid": "acceptance_criterion-9c50e45e",
          "ac_id": "AC-1683",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1684 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1684 'A file over the ceiling, or with no bytes at all, is refused in words a client can act on and leaves no material behind' (uid=acceptance_criterion-8a0f6068) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1684.",
          "ac_uid": "acceptance_criterion-8a0f6068",
          "ac_id": "AC-1684",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1685 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1685 'Each created material is announced for indexing exactly once, identified by the material just created' (uid=acceptance_criterion-d3a3202b) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1685.",
          "ac_uid": "acceptance_criterion-d3a3202b",
          "ac_id": "AC-1685",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1686 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1686 'New material is searchable the moment the ingestion returns, without re-processing the material already indexed' (uid=acceptance_criterion-b0598211) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1686.",
          "ac_uid": "acceptance_criterion-b0598211",
          "ac_id": "AC-1686",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1687 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1687 'With no indexer configured the file is still stored, and both the answer and the deployment log say it cannot be found' (uid=acceptance_criterion-c1ab33b4) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1687.",
          "ac_uid": "acceptance_criterion-c1ab33b4",
          "ac_id": "AC-1687",
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
        "message": "16 test(s) failed",
        "suggestion": "Fix failing tests",
        "context": {
          "failures": 16
        }
      }
    ]
  }
}