---
uid: report-488515ea
id: REPORT-10858
type: report
title: 'Scoped quality: pass (42 tests, 0 failed)'
created_by: xgd
created_at: '2026-11-04T16:25:37.455349+00:00'
updated_at: '2026-11-04T16:25:37.455349+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: story-fde7370b
  commit: 247752289a03a7970a261bccd74ca25505faa05c
---

{
  "timestamp": "2026-11-04T16:21:20.927136Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00013804086484014988,
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
      "duration_seconds": 18.58941891603172,
      "passed": 42,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 42,
      "deselected": 26,
      "test_filter": [
        "test_UAT_AC1385_",
        "test_UAT_AC1386_",
        "test_UAT_AC1387_",
        "test_UAT_AC1388_",
        "test_UAT_AC1389_",
        "test_UAT_AC1390_",
        "test_UAT_AC1391_",
        "test_UAT_AC1392_",
        "test_UAT_AC1393_",
        "test_UAT_AC1394_",
        "test_UAT_AC1395_",
        "test_UAT_AC1396_",
        "test_UAT_AC1397_",
        "test_UAT_AC1398_",
        "test_UAT_AC1447_",
        "test_UAT_AC1448_",
        "test_UAT_AC2229_",
        "test_UAT_AC2238_",
        "test_UAT_AC2239_",
        "test_UAT_AC2240_",
        "test_UAT_AC2241_",
        "test_UAT_AC2242_",
        "test_UAT_AC2243_"
      ],
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": " every primary key is opaque\"],\"fullName\":\"REQ-190 \u2014 every primary key is opaque test_UAT_AC2240_no_child_row_records_the_business\",\"status\":\"passed\",\"title\":\"test_UAT_AC2240_no_child_row_records_the_business\",\"duration\":4,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-190 \u2014 the key is the address\"],\"fullName\":\"REQ-190 \u2014 the key is the address test_UAT_AC2240_a_new_accounts_unnamed_site_is_renamed_by_one_column\",\"status\":\"passed\",\"title\":\"test_UAT_AC2240_a_new_accounts_unnamed_site_is_renamed_by_one_column\",\"duration\":13,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-190 \u2014 the key is the address\"],\"fullName\":\"REQ-190 \u2014 the key is the address test_UAT_AC2241_two_businesses_each_publish_a_site_of_the_same_slug\",\"status\":\"passed\",\"title\":\"test_UAT_AC2241_two_businesses_each_publish_a_site_of_the_same_slug\",\"duration\":256,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-190 \u2014 the key is the address\"],\"fullName\":\"REQ-190 \u2014 the key is the address test_UAT_AC2239_the_same_opaque_key_is_used_in_joins_and_in_the_url\",\"status\":\"passed\",\"title\":\"test_UAT_AC2239_the_same_opaque_key_is_used_in_joins_and_in_the_url\",\"duration\":22,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-190 \u2014 the key is the address\"],\"fullName\":\"REQ-190 \u2014 the key is the address test_UAT_AC2242_a_handle_enumerates_only_its_own_business_site_keys\",\"status\":\"passed\",\"title\":\"test_UAT_AC2242_a_handle_enumerates_only_its_own_business_site_keys\",\"duration\":169,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-190 \u2014 names change and keys do not\"],\"fullName\":\"REQ-190 \u2014 names change and keys do not test_UAT_AC2240_a_business_is_renamed_with_no_key_rewritten\",\"status\":\"passed\",\"title\":\"test_UAT_AC2240_a_business_is_renamed_with_no_key_rewritten\",\"duration\":31,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-190 \u2014 names change and keys do not\"],\"fullName\":\"REQ-190 \u2014 names change and keys do not test_UAT_AC2240_a_sites_slug_changes_with_no_key_rewritten\",\"status\":\"passed\",\"title\":\"test_UAT_AC2240_a_sites_slug_changes_with_no_key_rewritten\",\"duration\":195,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-190 \u2014 names change and keys do not\"],\"fullName\":\"REQ-190 \u2014 names change and keys do not test_UAT_AC2240_a_site_moves_business_by_one_column_with_no_object_copied\",\"status\":\"passed\",\"title\":\"test_UAT_AC2240_a_site_moves_business_by_one_column_with_no_object_copied\",\"duration\":48,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-190 \u2014 names change and keys do not\"],\"fullName\":\"REQ-190 \u2014 names change and keys do not test_UAT_AC2241_a_move_onto_a_taken_slug_is_refused_by_the_constraint\",\"status\":\"passed\",\"title\":\"test_UAT_AC2241_a_move_onto_a_taken_slug_is_refused_by_the_constraint\",\"duration\":13,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-190 \u2014 the object store follows the keys\"],\"fullName\":\"REQ-190 \u2014 the object store follows the keys test_UAT_AC2242_erasure_reaches_every_object_by_enumerating_site_keys\",\"status\":\"passed\",\"title\":\"test_UAT_AC2242_erasure_reaches_every_object_by_enumerating_site_keys\",\"duration\":50,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-190 \u2014 the object store follows the keys\"],\"fullName\":\"REQ-190 \u2014 the object store follows the keys test_UAT_AC2242_forget_removes_the_site_and_its_objects\",\"status\":\"passed\",\"title\":\"test_UAT_AC2242_forget_removes_the_site_and_its_objects\",\"duration\":105,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-190 \u2014 ordinal is not identity\"],\"fullName\":\"REQ-190 \u2014 ordinal is not identity test_UAT_AC2243_a_revision_id_and_a_journal_counter_stay_ordinals\",\"status\":\"passed\",\"title\":\"test_UAT_AC2243_a_revision_id_and_a_journal_counter_stay_ordinals\",\"duration\":275,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-190 \u2014 ordinal is not identity\"],\"fullName\":\"REQ-190 \u2014 ordinal is not identity test_UAT_AC2239_the_id_prefix_is_a_reading_aid_and_nothing_branches_on_it\",\"status\":\"passed\",\"title\":\"test_UAT_AC2239_the_id_prefix_is_a_reading_aid_and_nothing_branches_on_it\",\"duration\":0,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793809292645,\"endTime\":1793809293881,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/tests/test_reconciliation_opaque_site_keys.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-fde7370b \u2014 createDraft reports creation, and provisioning respects it\"],\"fullName\":\"story-fde7370b \u2014 createDraft reports creation, and provisioning respects it test_UAT_AC2229_create_draft_answers_true_then_false_for_one_slug\",\"status\":\"passed\",\"title\":\"test_UAT_AC2229_create_draft_answers_true_then_false_for_one_slug\",\"duration\":6,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-fde7370b \u2014 createDraft reports creation, and provisioning respects it\"],\"fullName\":\"story-fde7370b \u2014 createDraft reports creation, and provisioning respects it test_UAT_AC2229_provisioning_onto_an_existing_starter_slug_leaves_the_site_unchanged\",\"status\":\"passed\",\"title\":\"test_UAT_AC2229_provisioning_onto_an_existing_starter_slug_leaves_the_site_unchanged\",\"duration\":30,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-fde7370b \u2014 createDraft reports creation, and provisioning respects it\"],\"fullName\":\"story-fde7370b \u2014 createDraft reports creation, and provisioning respects it test_UAT_AC2229_provisioning_onto_a_fresh_slug_writes_the_starter_site\",\"status\":\"passed\",\"title\":\"test_UAT_AC2229_provisioning_onto_a_fresh_slug_writes_the_starter_site\",\"duration\":24,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793809292620,\"endTime\":1793809292680,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/tests/test_reconciliation_starter_site_guard.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-fde7370b \u2014 the cloud site store, from the host runtime\"],\"fullName\":\"story-fde7370b \u2014 the cloud site store, from the host runtime test_UAT_AC1385_every_storage_question_answers_identically_over_all_three_stores\",\"status\":\"passed\",\"title\":\"test_UAT_AC1385_every_storage_question_answers_identically_over_all_three_stores\",\"duration\":26.138500000000022,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-fde7370b \u2014 the cloud site store, from the host runtime\"],\"fullName\":\"story-fde7370b \u2014 the cloud site store, from the host runtime test_UAT_AC1391_the_filesystem_store_applies_a_version_carrying_write_unconditionally\",\"status\":\"passed\",\"title\":\"test_UAT_AC1391_the_filesystem_store_applies_a_version_carrying_write_unconditionally\",\"duration\":3.3573750000000473,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-fde7370b \u2014 the cloud site store, from the host runtime\"],\"fullName\":\"story-fde7370b \u2014 the cloud site store, from the host runtime test_UAT_AC1397_one_extension_yields_one_content_type_wherever_an_asset_is_served\",\"status\":\"passed\",\"title\":\"test_UAT_AC1397_one_extension_yields_one_content_type_wherever_an_asset_is_served\",\"duration\":93.27112500000021,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-fde7370b \u2014 the cloud site store, from the host runtime\"],\"fullName\":\"story-fde7370b \u2014 the cloud site store, from the host runtime test_UAT_AC1398_each_declared_binding_names_one_target_across_both_halves_and_the_schema_precedes_upload\",\"status\":\"passed\",\"title\":\"test_UAT_AC1398_each_declared_binding_names_one_target_across_both_halves_and_the_schema_precedes_upload\",\"duration\":475.00620899999967,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793809288384,\"endTime\":1793809288982.006,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/tests/reconciliation-cloudflare-site-store.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"REQ-190 \u2014 one baseline\"],\"fullName\":\"REQ-190 \u2014 one baseline test_UAT_AC2238_the_migrations_directory_is_one_baseline\",\"status\":\"passed\",\"title\":\"test_UAT_AC2238_the_migrations_directory_is_one_baseline\",\"duration\":8.688625000000002,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-190 \u2014 one baseline\"],\"fullName\":\"REQ-190 \u2014 one baseline test_UAT_AC2238_the_platform_business_literal_matches_both_deployment_blocks\",\"status\":\"passed\",\"title\":\"test_UAT_AC2238_the_platform_business_literal_matches_both_deployment_blocks\",\"duration\":1.4981669999999951,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-190 \u2014 one baseline\"],\"fullName\":\"REQ-190 \u2014 one baseline test_UAT_AC2238_the_baseline_seeds_no_people\",\"status\":\"passed\",\"title\":\"test_UAT_AC2238_the_baseline_seeds_no_people\",\"duration\":0.1801669999999831,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-190 \u2014 one baseline\"],\"fullName\":\"REQ-190 \u2014 one baseline test_UAT_AC2241_there_is_no_global_slug_claim_table_and_no_reader_of_one\",\"status\":\"passed\",\"title\":\"test_UAT_AC2241_there_is_no_global_slug_claim_table_and_no_reader_of_one\",\"duration\":35.26529100000002,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-190 \u2014 one baseline\"],\"fullName\":\"REQ-190 \u2014 one baseline test_UAT_AC2239_there_is_one_minter_of_keys\",\"status\":\"passed\",\"title\":\"test_UAT_AC2239_there_is_one_minter_of_keys\",\"duration\":144.015875,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"REQ-190 \u2014 one baseline\"],\"fullName\":\"REQ-190 \u2014 one baseline test_UAT_AC2239_the_schema_carries_no_key_made_of_data\",\"status\":\"passed\",\"title\":\"test_UAT_AC2239_the_schema_carries_no_key_made_of_data\",\"duration\":0.3122500000000059,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793809285495,\"endTime\":1793809285685.3123,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-37/tests/test_reconciliation_baseline_schema.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-fde7370b \u2014 the cloud site store, inside the Workers runtime test_UAT_AC1386_a_store_handle_sees_exactly_one_account_and_no_operation_takes_one",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-fde7370b \u2014 the cloud site store, inside the Workers runtime test_UAT_AC1387_an_unknown_or_inactive_account_is_refused_when_the_handle_is_asked_for",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-fde7370b \u2014 the cloud site store, inside the Workers runtime test_UAT_AC1388_a_site_version_is_readable_and_advances_on_every_write",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-fde7370b \u2014 the cloud site store, inside the Workers runtime test_UAT_AC1389_a_stale_expectation_is_refused_with_both_versions_and_one_racer_survives",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-fde7370b \u2014 the cloud site store, inside the Workers runtime test_UAT_AC1390_a_refused_multi_part_write_leaves_no_page_definition_or_version_behind",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-fde7370b \u2014 the cloud site store, inside the Workers runtime test_UAT_AC1392_asset_bytes_round_trip_typed_listable_and_removable",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-fde7370b \u2014 the cloud site store, inside the Workers runtime test_UAT_AC1393_an_unsafe_asset_name_reads_as_absent_and_writes_nothing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-fde7370b \u2014 the cloud site store, inside the Workers runtime test_UAT_AC1394_a_whole_draft_copies_between_any_two_stores_as_one_whole_change",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-fde7370b \u2014 the cloud site store, inside the Workers runtime test_UAT_AC1395_a_real_site_copied_into_the_cloud_store_assembles_and_renders_identically",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-fde7370b \u2014 the cloud site store, inside the Workers runtime test_UAT_AC1396_the_editing_surface_completes_inside_the_workers_runtime",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-fde7370b \u2014 what a read of an unchanged draft costs, and what may be retained test_UAT_AC1447_an_unchanged_draft_assembles_once_with_currency_read_live_on_every_read",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-fde7370b \u2014 what a read of an unchanged draft costs, and what may be retained test_UAT_AC1448_a_retained_assembled_draft_never_outlives_or_crosses_the_site_it_describes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-143 \u2014 the D1/R2 SiteStore over the D1/R2 store test_UAT_AC1385_the_draft_renders_from_whatever_store_served_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-143 \u2014 the D1/R2 SiteStore over the D1/R2 store test_UAT_AC1385_a_preview_asset_comes_back_as_bytes",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-190 \u2014 every primary key is opaque test_UAT_AC2239_every_primary_key_is_an_opaque_random_id",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-190 \u2014 every primary key is opaque test_UAT_AC2239_identical_inputs_produce_unrelated_keys",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-190 \u2014 every primary key is opaque test_UAT_AC2240_no_child_row_records_the_business",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-190 \u2014 the key is the address test_UAT_AC2240_a_new_accounts_unnamed_site_is_renamed_by_one_column",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-190 \u2014 the key is the address test_UAT_AC2241_two_businesses_each_publish_a_site_of_the_same_slug",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-190 \u2014 the key is the address test_UAT_AC2239_the_same_opaque_key_is_used_in_joins_and_in_the_url",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-190 \u2014 the key is the address test_UAT_AC2242_a_handle_enumerates_only_its_own_business_site_keys",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-190 \u2014 names change and keys do not test_UAT_AC2240_a_business_is_renamed_with_no_key_rewritten",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-190 \u2014 names change and keys do not test_UAT_AC2240_a_sites_slug_changes_with_no_key_rewritten",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-190 \u2014 names change and keys do not test_UAT_AC2240_a_site_moves_business_by_one_column_with_no_object_copied",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-190 \u2014 names change and keys do not test_UAT_AC2241_a_move_onto_a_taken_slug_is_refused_by_the_constraint",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-190 \u2014 the object store follows the keys test_UAT_AC2242_erasure_reaches_every_object_by_enumerating_site_keys",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-190 \u2014 the object store follows the keys test_UAT_AC2242_forget_removes_the_site_and_its_objects",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-190 \u2014 ordinal is not identity test_UAT_AC2243_a_revision_id_and_a_journal_counter_stay_ordinals",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-190 \u2014 ordinal is not identity test_UAT_AC2239_the_id_prefix_is_a_reading_aid_and_nothing_branches_on_it",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-fde7370b \u2014 createDraft reports creation, and provisioning respects it test_UAT_AC2229_create_draft_answers_true_then_false_for_one_slug",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-fde7370b \u2014 createDraft reports creation, and provisioning respects it test_UAT_AC2229_provisioning_onto_an_existing_starter_slug_leaves_the_site_unchanged",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-fde7370b \u2014 createDraft reports creation, and provisioning respects it test_UAT_AC2229_provisioning_onto_a_fresh_slug_writes_the_starter_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-fde7370b \u2014 the cloud site store, from the host runtime test_UAT_AC1385_every_storage_question_answers_identically_over_all_three_stores",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-fde7370b \u2014 the cloud site store, from the host runtime test_UAT_AC1391_the_filesystem_store_applies_a_version_carrying_write_unconditionally",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-fde7370b \u2014 the cloud site store, from the host runtime test_UAT_AC1397_one_extension_yields_one_content_type_wherever_an_asset_is_served",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-fde7370b \u2014 the cloud site store, from the host runtime test_UAT_AC1398_each_declared_binding_names_one_target_across_both_halves_and_the_schema_precedes_upload",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-190 \u2014 one baseline test_UAT_AC2238_the_migrations_directory_is_one_baseline",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-190 \u2014 one baseline test_UAT_AC2238_the_platform_business_literal_matches_both_deployment_blocks",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-190 \u2014 one baseline test_UAT_AC2238_the_baseline_seeds_no_people",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-190 \u2014 one baseline test_UAT_AC2241_there_is_no_global_slug_claim_table_and_no_reader_of_one",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-190 \u2014 one baseline test_UAT_AC2239_there_is_one_minter_of_keys",
          "file": "",
          "status": "passed"
        },
        {
          "name": "REQ-190 \u2014 one baseline test_UAT_AC2239_the_schema_carries_no_key_made_of_data",
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