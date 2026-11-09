---
uid: report-3d9c8d43
id: REPORT-11983
type: report
title: 'Scoped quality: pass (24 tests, 0 failed)'
created_by: xgd
created_at: '2026-11-09T18:22:47.539560+00:00'
updated_at: '2026-11-09T18:22:47.539560+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: story-6ccaedd5
  commit: 649bee8b0ff21d3f3f5e46a1a89d1c8b3293cc56
---

{
  "timestamp": "2026-11-09T18:17:37.917014Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.0001538340002298355,
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
      "duration_seconds": 5.843131749890745,
      "passed": 24,
      "failed": 0,
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
      "stdout": "estorTitles\":[\"STORY-6ccaedd5 \u2014 the image converter binding (REQ-221)\"],\"fullName\":\"STORY-6ccaedd5 \u2014 the image converter binding (REQ-221) test_UAT_AC2537_the_images_binding_is_declared_once_under_the_same_name_locally_and_in_production\",\"status\":\"passed\",\"title\":\"test_UAT_AC2537_the_images_binding_is_declared_once_under_the_same_name_locally_and_in_production\",\"duration\":8.399999999999991,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794248259858,\"endTime\":1794248259866.4,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-43/tests/reconciliation-ingestion-images-binding.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"STORY-6ccaedd5 \u2014 HEIC at the upload door (REQ-221)\"],\"fullName\":\"STORY-6ccaedd5 \u2014 HEIC at the upload door (REQ-221) test_UAT_AC2534_a_heif_upload_is_stored_as_a_jpeg_image_named_jpg_whatever_its_declared_type\",\"status\":\"passed\",\"title\":\"test_UAT_AC2534_a_heif_upload_is_stored_as_a_jpeg_image_named_jpg_whatever_its_declared_type\",\"duration\":258,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"STORY-6ccaedd5 \u2014 HEIC at the upload door (REQ-221)\"],\"fullName\":\"STORY-6ccaedd5 \u2014 HEIC at the upload door (REQ-221) test_UAT_AC2535_avif_and_every_non_heif_upload_is_stored_byte_for_byte_under_its_own_name\",\"status\":\"passed\",\"title\":\"test_UAT_AC2535_avif_and_every_non_heif_upload_is_stored_byte_for_byte_under_its_own_name\",\"duration\":16,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"STORY-6ccaedd5 \u2014 HEIC at the upload door (REQ-221)\"],\"fullName\":\"STORY-6ccaedd5 \u2014 HEIC at the upload door (REQ-221) test_UAT_AC2536_an_unconvertible_heic_is_refused_with_a_distinct_sentence_and_nothing_is_created\",\"status\":\"passed\",\"title\":\"test_UAT_AC2536_an_unconvertible_heic_is_refused_with_a_distinct_sentence_and_nothing_is_created\",\"duration\":58,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"STORY-6ccaedd5 \u2014 HEIC at the upload door (REQ-221)\"],\"fullName\":\"STORY-6ccaedd5 \u2014 HEIC at the upload door (REQ-221) test_UAT_AC1810_a_declared_heic_type_on_bytes_that_are_not_heif_is_carried_through_untouched\",\"status\":\"passed\",\"title\":\"test_UAT_AC1810_a_declared_heic_type_on_bytes_that_are_not_heif_is_carried_through_untouched\",\"duration\":5,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794248263752,\"endTime\":1794248264089,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-43/tests/reconciliation-ingestion-heic-door.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-6ccaedd5 \u2014 the content type is settled once, at the head\"],\"fullName\":\"story-6ccaedd5 \u2014 the content type is settled once, at the head test_UAT_AC1809_a_silent_type_is_settled_from_the_filename_and_every_consumer_reads_that_value\",\"status\":\"passed\",\"title\":\"test_UAT_AC1809_a_silent_type_is_settled_from_the_filename_and_every_consumer_reads_that_value\",\"duration\":125,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-6ccaedd5 \u2014 the content type is settled once, at the head\"],\"fullName\":\"story-6ccaedd5 \u2014 the content type is settled once, at the head test_UAT_AC1810_a_stated_type_is_never_second_guessed_and_an_unreadable_extension_degrades_honestly\",\"status\":\"passed\",\"title\":\"test_UAT_AC1810_a_stated_type_is_never_second_guessed_and_an_unreadable_extension_degrades_honestly\",\"duration\":27,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794248263752,\"endTime\":1794248263904,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-43/tests/reconciliation-material-content-type-resolution.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-6ccaedd5 \u2014 a file handed to the platform becomes material\"],\"fullName\":\"story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1678_an_ingested_file_becomes_a_stored_material_whose_body_is_its_description\",\"status\":\"passed\",\"title\":\"test_UAT_AC1678_an_ingested_file_becomes_a_stored_material_whose_body_is_its_description\",\"duration\":112,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-6ccaedd5 \u2014 a file handed to the platform becomes material\"],\"fullName\":\"story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1679_ingested_bytes_reside_in_the_private_store_and_never_in_the_public_one\",\"status\":\"passed\",\"title\":\"test_UAT_AC1679_ingested_bytes_reside_in_the_private_store_and_never_in_the_public_one\",\"duration\":13,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-6ccaedd5 \u2014 a file handed to the platform becomes material\"],\"fullName\":\"story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1680_one_accounts_material_is_invisible_to_another_accounts_listing_and_search\",\"status\":\"passed\",\"title\":\"test_UAT_AC1680_one_accounts_material_is_invisible_to_another_accounts_listing_and_search\",\"duration\":46,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-6ccaedd5 \u2014 a file handed to the platform becomes material\"],\"fullName\":\"story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1681_an_interruption_never_leaves_a_record_naming_bytes_that_are_not_there\",\"status\":\"passed\",\"title\":\"test_UAT_AC1681_an_interruption_never_leaves_a_record_naming_bytes_that_are_not_there\",\"duration\":5,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-6ccaedd5 \u2014 a file handed to the platform becomes material\"],\"fullName\":\"story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1682_kind_follows_the_content_type_then_the_filename_and_unrecognised_stays_a_document\",\"status\":\"passed\",\"title\":\"test_UAT_AC1682_kind_follows_the_content_type_then_the_filename_and_unrecognised_stays_a_document\",\"duration\":24,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-6ccaedd5 \u2014 a file handed to the platform becomes material\"],\"fullName\":\"story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1683_rights_are_inferred_from_provenance_and_never_taken_from_the_request\",\"status\":\"passed\",\"title\":\"test_UAT_AC1683_rights_are_inferred_from_provenance_and_never_taken_from_the_request\",\"duration\":12,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-6ccaedd5 \u2014 a file handed to the platform becomes material\"],\"fullName\":\"story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1684_a_file_over_the_ceiling_or_with_no_bytes_is_refused_and_leaves_nothing_behind\",\"status\":\"passed\",\"title\":\"test_UAT_AC1684_a_file_over_the_ceiling_or_with_no_bytes_is_refused_and_leaves_nothing_behind\",\"duration\":31,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-6ccaedd5 \u2014 a file handed to the platform becomes material\"],\"fullName\":\"story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1685_each_created_material_is_announced_for_indexing_exactly_once\",\"status\":\"passed\",\"title\":\"test_UAT_AC1685_each_created_material_is_announced_for_indexing_exactly_once\",\"duration\":11,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-6ccaedd5 \u2014 a file handed to the platform becomes material\"],\"fullName\":\"story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1686_new_material_is_searchable_immediately_without_reprocessing_the_rest\",\"status\":\"passed\",\"title\":\"test_UAT_AC1686_new_material_is_searchable_immediately_without_reprocessing_the_rest\",\"duration\":42,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-6ccaedd5 \u2014 a file handed to the platform becomes material\"],\"fullName\":\"story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1687_with_no_indexer_the_file_is_still_stored_and_both_the_answer_and_the_log_say_so\",\"status\":\"passed\",\"title\":\"test_UAT_AC1687_with_no_indexer_the_file_is_still_stored_and_both_the_answer_and_the_log_say_so\",\"duration\":7,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794248263752,\"endTime\":1794248264055,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-43/tests/reconciliation-material-ingestion.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-6ccaedd5 \u2014 a document keeps its own text beside its material (REQ-173)\"],\"fullName\":\"story-6ccaedd5 \u2014 a document keeps its own text beside its material (REQ-173) test_UAT_AC2095_a_documents_full_text_is_stored_once_as_a_material_text_comment_bounded_and_marked_where_truncated\",\"status\":\"passed\",\"title\":\"test_UAT_AC2095_a_documents_full_text_is_stored_once_as_a_material_text_comment_bounded_and_marked_where_truncated\",\"duration\":152,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-6ccaedd5 \u2014 a document keeps its own text beside its material (REQ-173)\"],\"fullName\":\"story-6ccaedd5 \u2014 a document keeps its own text beside its material (REQ-173) test_UAT_AC2096_a_deep_text_search_finds_the_material_by_its_own_uid_while_its_listed_description_is_the_digest\",\"status\":\"passed\",\"title\":\"test_UAT_AC2096_a_deep_text_search_finds_the_material_by_its_own_uid_while_its_listed_description_is_the_digest\",\"duration\":32,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-6ccaedd5 \u2014 a deployment with no model key refuses ingestion (REQ-173)\"],\"fullName\":\"story-6ccaedd5 \u2014 a deployment with no model key refuses ingestion (REQ-173) test_UAT_AC2098_with_no_key_the_status_route_says_so_and_both_ingestion_routes_refuse_with_503_storing_nothing\",\"status\":\"passed\",\"title\":\"test_UAT_AC2098_with_no_key_the_status_route_says_so_and_both_ingestion_routes_refuse_with_503_storing_nothing\",\"duration\":5,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794248263752,\"endTime\":1794248263941,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-43/tests/reconciliation-material-text-comment.workers.test.ts\"}]}",
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
          "status": "passed"
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
          "status": "passed"
        },
        {
          "name": "story-6ccaedd5 \u2014 the content type is settled once, at the head test_UAT_AC1810_a_stated_type_is_never_second_guessed_and_an_unreadable_extension_degrades_honestly",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1678_an_ingested_file_becomes_a_stored_material_whose_body_is_its_description",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1679_ingested_bytes_reside_in_the_private_store_and_never_in_the_public_one",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1680_one_accounts_material_is_invisible_to_another_accounts_listing_and_search",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1681_an_interruption_never_leaves_a_record_naming_bytes_that_are_not_there",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1682_kind_follows_the_content_type_then_the_filename_and_unrecognised_stays_a_document",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1683_rights_are_inferred_from_provenance_and_never_taken_from_the_request",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1684_a_file_over_the_ceiling_or_with_no_bytes_is_refused_and_leaves_nothing_behind",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1685_each_created_material_is_announced_for_indexing_exactly_once",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1686_new_material_is_searchable_immediately_without_reprocessing_the_rest",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1687_with_no_indexer_the_file_is_still_stored_and_both_the_answer_and_the_log_say_so",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6ccaedd5 \u2014 a document keeps its own text beside its material (REQ-173) test_UAT_AC2095_a_documents_full_text_is_stored_once_as_a_material_text_comment_bounded_and_marked_where_truncated",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6ccaedd5 \u2014 a document keeps its own text beside its material (REQ-173) test_UAT_AC2096_a_deep_text_search_finds_the_material_by_its_own_uid_while_its_listed_description_is_the_digest",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-6ccaedd5 \u2014 a deployment with no model key refuses ingestion (REQ-173) test_UAT_AC2098_with_no_key_the_status_route_says_so_and_both_ingestion_routes_refuse_with_503_storing_nothing",
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