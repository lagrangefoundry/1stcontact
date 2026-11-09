---
uid: report-dd883baa
id: REPORT-11977
type: report
title: 'Report: batch_quality_check for story-6ccaedd5'
created_by: xgd
created_at: '2026-11-09T18:11:00.633402+00:00'
updated_at: '2026-11-09T18:11:00.633402+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: story-6ccaedd5
  parent_report_uid: report-b47373ae
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-11-09T18:06:30.547520Z",
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
      "duration_seconds": 6.4920858750119805,
      "passed": 23,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 23,
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
        "test_UAT_AC2536_"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "2707999999984,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-173 \u2014 the reason is at the top and everything below is off\"],\"fullName\":\"REQ-173 \u2014 the reason is at the top and everything below is off test_UAT_AC2098_with_no_key_a_dropped_file_is_not_uploaded\",\"status\":\"passed\",\"title\":\"test_UAT_AC2098_with_no_key_a_dropped_file_is_not_uploaded\",\"duration\":15.258500000000026,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794247593414,\"endTime\":1794247593510.2585,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-43/tests/reconciliation-builder-no-key-banner.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"STORY-6ccaedd5 \u2014 HEIC at the upload door (REQ-221)\"],\"fullName\":\"STORY-6ccaedd5 \u2014 HEIC at the upload door (REQ-221) test_UAT_AC2534_a_heif_upload_is_stored_as_a_jpeg_image_named_jpg_whatever_its_declared_type\",\"status\":\"passed\",\"title\":\"test_UAT_AC2534_a_heif_upload_is_stored_as_a_jpeg_image_named_jpg_whatever_its_declared_type\",\"duration\":313,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"STORY-6ccaedd5 \u2014 HEIC at the upload door (REQ-221)\"],\"fullName\":\"STORY-6ccaedd5 \u2014 HEIC at the upload door (REQ-221) test_UAT_AC2535_avif_and_every_non_heif_upload_is_stored_byte_for_byte_under_its_own_name\",\"status\":\"passed\",\"title\":\"test_UAT_AC2535_avif_and_every_non_heif_upload_is_stored_byte_for_byte_under_its_own_name\",\"duration\":19,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"STORY-6ccaedd5 \u2014 HEIC at the upload door (REQ-221)\"],\"fullName\":\"STORY-6ccaedd5 \u2014 HEIC at the upload door (REQ-221) test_UAT_AC2536_an_unconvertible_heic_is_refused_with_a_distinct_sentence_and_nothing_is_created\",\"status\":\"passed\",\"title\":\"test_UAT_AC2536_an_unconvertible_heic_is_refused_with_a_distinct_sentence_and_nothing_is_created\",\"duration\":61,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"STORY-6ccaedd5 \u2014 HEIC at the upload door (REQ-221)\"],\"fullName\":\"STORY-6ccaedd5 \u2014 HEIC at the upload door (REQ-221) test_UAT_AC1810_a_declared_heic_type_on_bytes_that_are_not_heif_is_carried_through_untouched\",\"status\":\"passed\",\"title\":\"test_UAT_AC1810_a_declared_heic_type_on_bytes_that_are_not_heif_is_carried_through_untouched\",\"duration\":5,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794247597056,\"endTime\":1794247597454,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-43/tests/reconciliation-ingestion-heic-door.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-6ccaedd5 \u2014 the content type is settled once, at the head\"],\"fullName\":\"story-6ccaedd5 \u2014 the content type is settled once, at the head test_UAT_AC1809_a_silent_type_is_settled_from_the_filename_and_every_consumer_reads_that_value\",\"status\":\"passed\",\"title\":\"test_UAT_AC1809_a_silent_type_is_settled_from_the_filename_and_every_consumer_reads_that_value\",\"duration\":122,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-6ccaedd5 \u2014 the content type is settled once, at the head\"],\"fullName\":\"story-6ccaedd5 \u2014 the content type is settled once, at the head test_UAT_AC1810_a_stated_type_is_never_second_guessed_and_an_unreadable_extension_degrades_honestly\",\"status\":\"passed\",\"title\":\"test_UAT_AC1810_a_stated_type_is_never_second_guessed_and_an_unreadable_extension_degrades_honestly\",\"duration\":50,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794247597055,\"endTime\":1794247597228,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-43/tests/reconciliation-material-content-type-resolution.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-6ccaedd5 \u2014 a file handed to the platform becomes material\"],\"fullName\":\"story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1678_an_ingested_file_becomes_a_stored_material_whose_body_is_its_description\",\"status\":\"passed\",\"title\":\"test_UAT_AC1678_an_ingested_file_becomes_a_stored_material_whose_body_is_its_description\",\"duration\":104,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-6ccaedd5 \u2014 a file handed to the platform becomes material\"],\"fullName\":\"story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1679_ingested_bytes_reside_in_the_private_store_and_never_in_the_public_one\",\"status\":\"passed\",\"title\":\"test_UAT_AC1679_ingested_bytes_reside_in_the_private_store_and_never_in_the_public_one\",\"duration\":19,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-6ccaedd5 \u2014 a file handed to the platform becomes material\"],\"fullName\":\"story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1680_one_accounts_material_is_invisible_to_another_accounts_listing_and_search\",\"status\":\"passed\",\"title\":\"test_UAT_AC1680_one_accounts_material_is_invisible_to_another_accounts_listing_and_search\",\"duration\":74,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-6ccaedd5 \u2014 a file handed to the platform becomes material\"],\"fullName\":\"story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1681_an_interruption_never_leaves_a_record_naming_bytes_that_are_not_there\",\"status\":\"passed\",\"title\":\"test_UAT_AC1681_an_interruption_never_leaves_a_record_naming_bytes_that_are_not_there\",\"duration\":6,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-6ccaedd5 \u2014 a file handed to the platform becomes material\"],\"fullName\":\"story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1682_kind_follows_the_content_type_then_the_filename_and_unrecognised_stays_a_document\",\"status\":\"passed\",\"title\":\"test_UAT_AC1682_kind_follows_the_content_type_then_the_filename_and_unrecognised_stays_a_document\",\"duration\":44,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-6ccaedd5 \u2014 a file handed to the platform becomes material\"],\"fullName\":\"story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1683_rights_are_inferred_from_provenance_and_never_taken_from_the_request\",\"status\":\"passed\",\"title\":\"test_UAT_AC1683_rights_are_inferred_from_provenance_and_never_taken_from_the_request\",\"duration\":14,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-6ccaedd5 \u2014 a file handed to the platform becomes material\"],\"fullName\":\"story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1684_a_file_over_the_ceiling_or_with_no_bytes_is_refused_and_leaves_nothing_behind\",\"status\":\"passed\",\"title\":\"test_UAT_AC1684_a_file_over_the_ceiling_or_with_no_bytes_is_refused_and_leaves_nothing_behind\",\"duration\":39,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-6ccaedd5 \u2014 a file handed to the platform becomes material\"],\"fullName\":\"story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1685_each_created_material_is_announced_for_indexing_exactly_once\",\"status\":\"passed\",\"title\":\"test_UAT_AC1685_each_created_material_is_announced_for_indexing_exactly_once\",\"duration\":13,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-6ccaedd5 \u2014 a file handed to the platform becomes material\"],\"fullName\":\"story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1686_new_material_is_searchable_immediately_without_reprocessing_the_rest\",\"status\":\"passed\",\"title\":\"test_UAT_AC1686_new_material_is_searchable_immediately_without_reprocessing_the_rest\",\"duration\":47,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-6ccaedd5 \u2014 a file handed to the platform becomes material\"],\"fullName\":\"story-6ccaedd5 \u2014 a file handed to the platform becomes material test_UAT_AC1687_with_no_indexer_the_file_is_still_stored_and_both_the_answer_and_the_log_say_so\",\"status\":\"passed\",\"title\":\"test_UAT_AC1687_with_no_indexer_the_file_is_still_stored_and_both_the_answer_and_the_log_say_so\",\"duration\":7,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794247597055,\"endTime\":1794247597423,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-43/tests/reconciliation-material-ingestion.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-6ccaedd5 \u2014 a document keeps its own text beside its material (REQ-173)\"],\"fullName\":\"story-6ccaedd5 \u2014 a document keeps its own text beside its material (REQ-173) test_UAT_AC2095_a_documents_full_text_is_stored_once_as_a_material_text_comment_bounded_and_marked_where_truncated\",\"status\":\"passed\",\"title\":\"test_UAT_AC2095_a_documents_full_text_is_stored_once_as_a_material_text_comment_bounded_and_marked_where_truncated\",\"duration\":154,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-6ccaedd5 \u2014 a document keeps its own text beside its material (REQ-173)\"],\"fullName\":\"story-6ccaedd5 \u2014 a document keeps its own text beside its material (REQ-173) test_UAT_AC2096_a_deep_text_search_finds_the_material_by_its_own_uid_while_its_listed_description_is_the_digest\",\"status\":\"passed\",\"title\":\"test_UAT_AC2096_a_deep_text_search_finds_the_material_by_its_own_uid_while_its_listed_description_is_the_digest\",\"duration\":49,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-6ccaedd5 \u2014 a deployment with no model key refuses ingestion (REQ-173)\"],\"fullName\":\"story-6ccaedd5 \u2014 a deployment with no model key refuses ingestion (REQ-173) test_UAT_AC2098_with_no_key_the_status_route_says_so_and_both_ingestion_routes_refuse_with_503_storing_nothing\",\"status\":\"passed\",\"title\":\"test_UAT_AC2098_with_no_key_the_status_route_says_so_and_both_ingestion_routes_refuse_with_503_storing_nothing\",\"duration\":6,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794247597055,\"endTime\":1794247597264,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-43/tests/reconciliation-material-text-comment.workers.test.ts\"}]}",
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
  },
  "blast_radius": {
    "test_scope": "",
    "files": []
  }
}