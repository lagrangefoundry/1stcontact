---
uid: report-2c01c64a
id: REPORT-10847
type: report
title: 'Report: batch_quality_check for story-c4f329d3'
created_by: xgd
created_at: '2026-11-04T15:52:02.406358+00:00'
updated_at: '2026-11-04T15:52:02.406358+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: story-c4f329d3
  parent_report_uid: report-15de9048
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-11-04T15:47:01.518663Z",
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
      "duration_seconds": 26.231238125124946,
      "passed": 32,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 32,
      "deselected": 2,
      "test_filter": [
        "test_UAT_AC2236_",
        "test_UAT_AC2235_",
        "test_UAT_AC1632_",
        "test_UAT_AC1633_",
        "test_UAT_AC1305_",
        "test_UAT_AC1304_",
        "test_UAT_AC1303_",
        "test_UAT_AC1302_",
        "test_UAT_AC1301_",
        "test_UAT_AC1300_",
        "test_UAT_AC1299_",
        "test_UAT_AC1298_",
        "test_UAT_AC1297_",
        "test_UAT_AC1296_",
        "test_UAT_AC1295_",
        "test_UAT_AC1294_",
        "test_UAT_AC1293_",
        "test_UAT_AC1292_",
        "test_UAT_AC1291_",
        "test_UAT_AC1306_",
        "test_UAT_AC1647_",
        "test_UAT_AC1648_",
        "test_UAT_AC1649_",
        "test_UAT_AC2058_",
        "test_UAT_AC2059_",
        "test_UAT_AC2099_",
        "test_UAT_AC2100_",
        "test_UAT_AC2101_",
        "test_UAT_AC2102_",
        "test_UAT_AC2103_",
        "test_UAT_AC1427_"
      ],
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": " \u2014 the shipping gate\"],\"fullName\":\"System knowledge base \u2014 the shipping gate test_UAT_AC2099_packing_refuses_a_document_absent_from_either_manifest_and_writes_nothing\",\"status\":\"passed\",\"title\":\"test_UAT_AC2099_packing_refuses_a_document_absent_from_either_manifest_and_writes_nothing\",\"duration\":4.9597499999999854,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"System knowledge base \u2014 the shipping gate\"],\"fullName\":\"System knowledge base \u2014 the shipping gate test_UAT_AC2100_a_document_indexed_under_an_older_version_is_stale_and_refused\",\"status\":\"passed\",\"title\":\"test_UAT_AC2100_a_document_indexed_under_an_older_version_is_stale_and_refused\",\"duration\":12.487875000000031,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"System knowledge base \u2014 the shipping gate\"],\"fullName\":\"System knowledge base \u2014 the shipping gate test_UAT_AC2101_the_map_is_exempt_by_predicate_and_named_on_the_report_line\",\"status\":\"passed\",\"title\":\"test_UAT_AC2101_the_map_is_exempt_by_predicate_and_named_on_the_report_line\",\"duration\":6.4845000000000255,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"System knowledge base \u2014 one release command\"],\"fullName\":\"System knowledge base \u2014 one release command test_UAT_AC2102_the_release_command_builds_before_it_packs_and_refuses_unknown_arguments\",\"status\":\"passed\",\"title\":\"test_UAT_AC2102_the_release_command_builds_before_it_packs_and_refuses_unknown_arguments\",\"duration\":32.010084000000006,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"System knowledge base \u2014 stamp precision\"],\"fullName\":\"System knowledge base \u2014 stamp precision test_UAT_AC2103_packed_stamps_match_the_manifests_at_whole_second_precision\",\"status\":\"passed\",\"title\":\"test_UAT_AC2103_packed_stamps_match_the_manifests_at_whole_second_precision\",\"duration\":4.70091699999989,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793807224656,\"endTime\":1793807224725.701,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/tests/reconciliation-system-knowledge-base-shipping-gate.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-c4f329d3 \u2014 the whole pipeline, built once and read back\"],\"fullName\":\"story-c4f329d3 \u2014 the whole pipeline, built once and read back test_UAT_AC1291_build_runs_the_whole_pipeline_and_reports_what_it_produced\",\"status\":\"passed\",\"title\":\"test_UAT_AC1291_build_runs_the_whole_pipeline_and_reports_what_it_produced\",\"duration\":1.4981659999998556,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-c4f329d3 \u2014 the whole pipeline, built once and read back\"],\"fullName\":\"story-c4f329d3 \u2014 the whole pipeline, built once and read back test_UAT_AC1301_a_document_is_found_by_describing_what_it_is_about\",\"status\":\"passed\",\"title\":\"test_UAT_AC1301_a_document_is_found_by_describing_what_it_is_about\",\"duration\":3.173084000000017,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-c4f329d3 \u2014 the whole pipeline, built once and read back\"],\"fullName\":\"story-c4f329d3 \u2014 the whole pipeline, built once and read back test_UAT_AC1302_a_passage_search_returns_a_section_and_names_its_document\",\"status\":\"passed\",\"title\":\"test_UAT_AC1302_a_passage_search_returns_a_section_and_names_its_document\",\"duration\":2.5171250000003056,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-c4f329d3 \u2014 the whole pipeline, built once and read back\"],\"fullName\":\"story-c4f329d3 \u2014 the whole pipeline, built once and read back test_UAT_AC1303_the_map_is_generated_from_the_corpus_and_names_a_territory_with_no_way_in\",\"status\":\"passed\",\"title\":\"test_UAT_AC1303_the_map_is_generated_from_the_corpus_and_names_a_territory_with_no_way_in\",\"duration\":343.77262500000006,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-c4f329d3 \u2014 the whole pipeline, built once and read back\"],\"fullName\":\"story-c4f329d3 \u2014 the whole pipeline, built once and read back test_UAT_AC1304_the_map_is_out_of_the_corpus_and_found_as_the_awareness_report\",\"status\":\"passed\",\"title\":\"test_UAT_AC1304_the_map_is_out_of_the_corpus_and_found_as_the_awareness_report\",\"duration\":1.9047500000001492,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-c4f329d3 \u2014 what the build refuses, reports and leaves alone\"],\"fullName\":\"story-c4f329d3 \u2014 what the build refuses, reports and leaves alone test_UAT_AC1292_the_corpus_can_be_built_alone_with_no_model_and_no_credentials\",\"status\":\"passed\",\"title\":\"test_UAT_AC1292_the_corpus_can_be_built_alone_with_no_model_and_no_credentials\",\"duration\":540.8447919999994,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-c4f329d3 \u2014 what the build refuses, reports and leaves alone\"],\"fullName\":\"story-c4f329d3 \u2014 what the build refuses, reports and leaves alone test_UAT_AC1296_every_excluded_document_is_named_individually\",\"status\":\"passed\",\"title\":\"test_UAT_AC1296_every_excluded_document_is_named_individually\",\"duration\":1075.5482090000005,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-c4f329d3 \u2014 what the build refuses, reports and leaves alone\"],\"fullName\":\"story-c4f329d3 \u2014 what the build refuses, reports and leaves alone test_UAT_AC1298_a_document_that_leaves_the_knowledge_base_is_deleted_from_the_corpus\",\"status\":\"passed\",\"title\":\"test_UAT_AC1298_a_document_that_leaves_the_knowledge_base_is_deleted_from_the_corpus\",\"duration\":921.372625,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-c4f329d3 \u2014 what the build refuses, reports and leaves alone\"],\"fullName\":\"story-c4f329d3 \u2014 what the build refuses, reports and leaves alone test_UAT_AC1299_an_unchanged_document_is_not_rewritten_and_an_unchanged_corpus_is_not_re_embedded\",\"status\":\"passed\",\"title\":\"test_UAT_AC1299_an_unchanged_document_is_not_rewritten_and_an_unchanged_corpus_is_not_re_embedded\",\"duration\":951.6369590000004,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-c4f329d3 \u2014 what the build refuses, reports and leaves alone\"],\"fullName\":\"story-c4f329d3 \u2014 what the build refuses, reports and leaves alone test_UAT_AC1300_a_build_with_nothing_carrying_the_kind_is_refused_and_reaches_no_model\",\"status\":\"passed\",\"title\":\"test_UAT_AC1300_a_build_with_nothing_carrying_the_kind_is_refused_and_reaches_no_model\",\"duration\":212.3909590000003,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-c4f329d3 \u2014 what the build refuses, reports and leaves alone\"],\"fullName\":\"story-c4f329d3 \u2014 what the build refuses, reports and leaves alone test_UAT_AC1305_the_declaration_is_in_force_never_overwritten_and_a_missing_one_is_refused_by_name\",\"status\":\"passed\",\"title\":\"test_UAT_AC1305_the_declaration_is_in_force_never_overwritten_and_a_missing_one_is_refused_by_name\",\"duration\":221.35720800000036,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-c4f329d3 \u2014 what the build refuses, reports and leaves alone\"],\"fullName\":\"story-c4f329d3 \u2014 what the build refuses, reports and leaves alone test_UAT_AC1306_indexing_is_refused_without_embedding_credentials_and_the_map_needs_none\",\"status\":\"passed\",\"title\":\"test_UAT_AC1306_indexing_is_refused_without_embedding_credentials_and_the_map_needs_none\",\"duration\":485.4965420000008,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-c4f329d3 \u2014 the command answers before it acts\"],\"fullName\":\"story-c4f329d3 \u2014 the command answers before it acts test_UAT_AC1293_status_reports_the_corpus_against_the_ticket_count_and_each_artefact\",\"status\":\"passed\",\"title\":\"test_UAT_AC1293_status_reports_the_corpus_against_the_ticket_count_and_each_artefact\",\"duration\":2139.6605419999996,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-c4f329d3 \u2014 the command answers before it acts\"],\"fullName\":\"story-c4f329d3 \u2014 the command answers before it acts test_UAT_AC1294_an_unrecognised_form_is_refused_with_usage_and_builds_nothing\",\"status\":\"passed\",\"title\":\"test_UAT_AC1294_an_unrecognised_form_is_refused_with_usage_and_builds_nothing\",\"duration\":0.5406659999989643,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-c4f329d3 \u2014 what is in the knowledge base, and how it is read\"],\"fullName\":\"story-c4f329d3 \u2014 what is in the knowledge base, and how it is read test_UAT_AC1295_only_the_system_kb_doc_kind_puts_a_document_in\",\"status\":\"passed\",\"title\":\"test_UAT_AC1295_only_the_system_kb_doc_kind_puts_a_document_in\",\"duration\":8191.518625000001,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-c4f329d3 \u2014 what is in the knowledge base, and how it is read\"],\"fullName\":\"story-c4f329d3 \u2014 what is in the knowledge base, and how it is read test_UAT_AC1632_the_declarations_restrict_nothing_and_any_markdown_file_resolves\",\"status\":\"passed\",\"title\":\"test_UAT_AC1632_the_declarations_restrict_nothing_and_any_markdown_file_resolves\",\"duration\":2.6220420000026934,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-c4f329d3 \u2014 what is in the knowledge base, and how it is read\"],\"fullName\":\"story-c4f329d3 \u2014 what is in the knowledge base, and how it is read test_UAT_AC1633_the_listing_is_exhaustive_and_a_truncated_envelope_is_refused\",\"status\":\"passed\",\"title\":\"test_UAT_AC1633_the_listing_is_exhaustive_and_a_truncated_envelope_is_refused\",\"duration\":1543.0873750000028,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-c4f329d3 \u2014 the real document store, exported and read back\"],\"fullName\":\"story-c4f329d3 \u2014 the real document store, exported and read back test_UAT_AC1297_a_document_is_addressed_by_its_human_id_and_reads_back_as_a_document\",\"status\":\"passed\",\"title\":\"test_UAT_AC1297_a_document_is_addressed_by_its_human_id_and_reads_back_as_a_document\",\"duration\":685.0880419999994,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793807226999,\"endTime\":1793807248145.0881,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/tests/reconciliation-system-knowledge-base.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-d5167ced \u2014 the derived artifacts are generated before the typecheck test_UAT_AC1427_the_generation_stage_runs_before_the_typecheck_that_consumes_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 indexing needs the token, and the account is asked of it test_UAT_AC1306_indexing_is_refused_without_the_token_naming_the_account_id_as_an_override",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 indexing needs the token, and the account is asked of it test_UAT_AC2058_the_token_alone_resolves_the_account_and_an_explicit_id_costs_no_call",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 indexing needs the token, and the account is asked of it test_UAT_AC2059_an_unsettled_account_is_refused_with_a_diagnosis_specific_to_why",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 the built knowledge base, packed test_UAT_AC1647_the_packed_module_carries_both_indexes_the_corpus_and_each_stamp",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 the built knowledge base, packed test_UAT_AC1649_an_absent_knowledge_base_is_loud_and_a_packed_one_is_counted",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 the packed module is written on every application build test_UAT_AC1648_the_module_is_written_even_when_no_knowledge_base_has_been_built",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 the build reads its own index, keyed by source test_UAT_AC2235_build_completes_all_four_stages_with_the_map_search_keyed_by_source",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 the preflight asks compatible as well as present test_UAT_AC2236_preflight_checks_the_index_seam_and_reports_it_on_its_own_line",
          "file": "",
          "status": "passed"
        },
        {
          "name": "System knowledge base \u2014 the shipping gate test_UAT_AC2099_packing_refuses_a_document_absent_from_either_manifest_and_writes_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "System knowledge base \u2014 the shipping gate test_UAT_AC2100_a_document_indexed_under_an_older_version_is_stale_and_refused",
          "file": "",
          "status": "passed"
        },
        {
          "name": "System knowledge base \u2014 the shipping gate test_UAT_AC2101_the_map_is_exempt_by_predicate_and_named_on_the_report_line",
          "file": "",
          "status": "passed"
        },
        {
          "name": "System knowledge base \u2014 one release command test_UAT_AC2102_the_release_command_builds_before_it_packs_and_refuses_unknown_arguments",
          "file": "",
          "status": "passed"
        },
        {
          "name": "System knowledge base \u2014 stamp precision test_UAT_AC2103_packed_stamps_match_the_manifests_at_whole_second_precision",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 the whole pipeline, built once and read back test_UAT_AC1291_build_runs_the_whole_pipeline_and_reports_what_it_produced",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 the whole pipeline, built once and read back test_UAT_AC1301_a_document_is_found_by_describing_what_it_is_about",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 the whole pipeline, built once and read back test_UAT_AC1302_a_passage_search_returns_a_section_and_names_its_document",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 the whole pipeline, built once and read back test_UAT_AC1303_the_map_is_generated_from_the_corpus_and_names_a_territory_with_no_way_in",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 the whole pipeline, built once and read back test_UAT_AC1304_the_map_is_out_of_the_corpus_and_found_as_the_awareness_report",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 what the build refuses, reports and leaves alone test_UAT_AC1292_the_corpus_can_be_built_alone_with_no_model_and_no_credentials",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 what the build refuses, reports and leaves alone test_UAT_AC1296_every_excluded_document_is_named_individually",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 what the build refuses, reports and leaves alone test_UAT_AC1298_a_document_that_leaves_the_knowledge_base_is_deleted_from_the_corpus",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 what the build refuses, reports and leaves alone test_UAT_AC1299_an_unchanged_document_is_not_rewritten_and_an_unchanged_corpus_is_not_re_embedded",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 what the build refuses, reports and leaves alone test_UAT_AC1300_a_build_with_nothing_carrying_the_kind_is_refused_and_reaches_no_model",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 what the build refuses, reports and leaves alone test_UAT_AC1305_the_declaration_is_in_force_never_overwritten_and_a_missing_one_is_refused_by_name",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 what the build refuses, reports and leaves alone test_UAT_AC1306_indexing_is_refused_without_embedding_credentials_and_the_map_needs_none",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 the command answers before it acts test_UAT_AC1293_status_reports_the_corpus_against_the_ticket_count_and_each_artefact",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 the command answers before it acts test_UAT_AC1294_an_unrecognised_form_is_refused_with_usage_and_builds_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 what is in the knowledge base, and how it is read test_UAT_AC1295_only_the_system_kb_doc_kind_puts_a_document_in",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 what is in the knowledge base, and how it is read test_UAT_AC1632_the_declarations_restrict_nothing_and_any_markdown_file_resolves",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 what is in the knowledge base, and how it is read test_UAT_AC1633_the_listing_is_exhaustive_and_a_truncated_envelope_is_refused",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-c4f329d3 \u2014 the real document store, exported and read back test_UAT_AC1297_a_document_is_addressed_by_its_human_id_and_reads_back_as_a_document",
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