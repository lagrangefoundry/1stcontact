---
uid: report-f2b44fe5
id: REPORT-11583
type: report
title: 'Scoped quality: pass (20 tests, 0 failed)'
created_by: xgd
created_at: '2026-11-08T21:30:41.666159+00:00'
updated_at: '2026-11-08T21:30:41.666159+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: story-5281f009
  commit: a2a4be3515039b7891d0dfeb18b05ed4aa1864d3
---

{
  "timestamp": "2026-11-08T21:25:32.254909Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00014520809054374695,
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
      "duration_seconds": 5.05593308294192,
      "passed": 20,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 20,
      "deselected": 0,
      "test_filter": [
        "test_UAT_AC1654_",
        "test_UAT_AC1655_",
        "test_UAT_AC1656_",
        "test_UAT_AC1657_",
        "test_UAT_AC1658_",
        "test_UAT_AC1659_",
        "test_UAT_AC1660_",
        "test_UAT_AC1661_",
        "test_UAT_AC1662_",
        "test_UAT_AC1663_",
        "test_UAT_AC1664_",
        "test_UAT_AC1665_",
        "test_UAT_AC2468_",
        "test_UAT_AC2469_",
        "test_UAT_AC2470_",
        "test_UAT_AC2471_",
        "test_UAT_AC2472_",
        "test_UAT_AC2473_",
        "test_UAT_AC2474_",
        "test_UAT_AC2475_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "rs/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-5723bjwb.json\n\n{\"numTotalTestSuites\":14,\"numPassedTestSuites\":14,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":20,\"numPassedTests\":20,\"numFailedTests\":0,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1794173133696,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"story-5281f009 \u2014 the declaration the product ships\"],\"fullName\":\"story-5281f009 \u2014 the declaration the product ships test_UAT_AC1654_the_clients_knowledge_base_is_declared_with_exactly_the_four_record_kinds\",\"status\":\"passed\",\"title\":\"test_UAT_AC1654_the_clients_knowledge_base_is_declared_with_exactly_the_four_record_kinds\",\"duration\":1.3512090000000399,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5281f009 \u2014 the scaffold a fresh workspace gets\"],\"fullName\":\"story-5281f009 \u2014 the scaffold a fresh workspace gets test_UAT_AC1658_a_fresh_workspace_is_scaffolded_the_shipped_client_knowledge_base_field_for_field\",\"status\":\"passed\",\"title\":\"test_UAT_AC1658_a_fresh_workspace_is_scaffolded_the_shipped_client_knowledge_base_field_for_field\",\"duration\":1.2445000000000164,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5281f009 \u2014 a host serves only what it can resolve\"],\"fullName\":\"story-5281f009 \u2014 a host serves only what it can resolve test_UAT_AC1659_the_release_build_offers_exactly_the_shipped_knowledge_base\",\"status\":\"passed\",\"title\":\"test_UAT_AC1659_the_release_build_offers_exactly_the_shipped_knowledge_base\",\"duration\":26.113208999999983,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794173134899,\"endTime\":1794173134927.1133,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/tests/reconciliation-client-knowledge-base.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-5281f009 \u2014 one place decides how to reach the model\"],\"fullName\":\"story-5281f009 \u2014 one place decides how to reach the model test_UAT_AC2471_one_module_decides_how_to_embed_and_nothing_else_builds_an_embedder_or_reads_the_ai_binding\",\"status\":\"passed\",\"title\":\"test_UAT_AC2471_one_module_decides_how_to_embed_and_nothing_else_builds_an_embedder_or_reads_the_ai_binding\",\"duration\":16.01399999999998,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5281f009 \u2014 one place decides how to reach the model\"],\"fullName\":\"story-5281f009 \u2014 one place decides how to reach the model test_UAT_AC2475_neither_rest_credential_variable_is_named_in_the_committed_wrangler_toml\",\"status\":\"passed\",\"title\":\"test_UAT_AC2475_neither_rest_credential_variable_is_named_in_the_committed_wrangler_toml\",\"duration\":0.31487499999997226,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794173134359,\"endTime\":1794173134375.315,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/tests/reconciliation-client-knowledge-embedder-transport.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-5281f009 \u2014 what it reads and how it is declared\"],\"fullName\":\"story-5281f009 \u2014 what it reads and how it is declared test_UAT_AC1655_it_reads_the_accounts_own_records_and_its_landscape_is_generated\",\"status\":\"passed\",\"title\":\"test_UAT_AC1655_it_reads_the_accounts_own_records_and_its_landscape_is_generated\",\"duration\":12,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5281f009 \u2014 what it reads and how it is declared\"],\"fullName\":\"story-5281f009 \u2014 what it reads and how it is declared test_UAT_AC1656_the_corpus_spans_the_whole_account_rather_than_one_site\",\"status\":\"passed\",\"title\":\"test_UAT_AC1656_the_corpus_spans_the_whole_account_rather_than_one_site\",\"duration\":32,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5281f009 \u2014 what it reads and how it is declared\"],\"fullName\":\"story-5281f009 \u2014 what it reads and how it is declared test_UAT_AC1657_what_the_declaration_states_is_what_the_knowledge_base_selects\",\"status\":\"passed\",\"title\":\"test_UAT_AC1657_what_the_declaration_states_is_what_the_knowledge_base_selects\",\"duration\":1,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5281f009 \u2014 the account is a hard barrier\"],\"fullName\":\"story-5281f009 \u2014 the account is a hard barrier test_UAT_AC1660_one_accounts_search_returns_nothing_belonging_to_another\",\"status\":\"passed\",\"title\":\"test_UAT_AC1660_one_accounts_search_returns_nothing_belonging_to_another\",\"duration\":27,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5281f009 \u2014 the account is a hard barrier\"],\"fullName\":\"story-5281f009 \u2014 the account is a hard barrier test_UAT_AC1661_the_derived_index_lives_in_private_storage_under_the_accounts_own_location\",\"status\":\"passed\",\"title\":\"test_UAT_AC1661_the_derived_index_lives_in_private_storage_under_the_accounts_own_location\",\"duration\":13,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5281f009 \u2014 indexing is affordable on every write\"],\"fullName\":\"story-5281f009 \u2014 indexing is affordable on every write test_UAT_AC1662_bringing_the_index_up_to_date_is_incremental_and_the_new_document_is_retrievable\",\"status\":\"passed\",\"title\":\"test_UAT_AC1662_bringing_the_index_up_to_date_is_incremental_and_the_new_document_is_retrievable\",\"duration\":38,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5281f009 \u2014 indexing is affordable on every write\"],\"fullName\":\"story-5281f009 \u2014 indexing is affordable on every write test_UAT_AC1663_an_account_with_no_index_yet_reads_as_having_none_rather_than_failing\",\"status\":\"passed\",\"title\":\"test_UAT_AC1663_an_account_with_no_index_yet_reads_as_having_none_rather_than_failing\",\"duration\":15,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5281f009 \u2014 the model, and the runtime it runs in\"],\"fullName\":\"story-5281f009 \u2014 the model, and the runtime it runs in test_UAT_AC1664_every_environment_declares_the_embedding_model_and_its_absence_refuses_by_name\",\"status\":\"passed\",\"title\":\"test_UAT_AC1664_every_environment_declares_the_embedding_model_and_its_absence_refuses_by_name\",\"duration\":2,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5281f009 \u2014 the model, and the runtime it runs in\"],\"fullName\":\"story-5281f009 \u2014 the model, and the runtime it runs in test_UAT_AC1665_the_clients_knowledge_base_opens_indexes_and_searches_inside_the_deployed_runtime\",\"status\":\"passed\",\"title\":\"test_UAT_AC1665_the_clients_knowledge_base_opens_indexes_and_searches_inside_the_deployed_runtime\",\"duration\":12,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794173136632,\"endTime\":1794173136784,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/tests/reconciliation-client-knowledge-base.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-5281f009 \u2014 configuration selects the transport\"],\"fullName\":\"story-5281f009 \u2014 configuration selects the transport test_UAT_AC2468_with_both_rest_credentials_set_every_kb_embeds_over_rest_and_never_touches_the_binding\",\"status\":\"passed\",\"title\":\"test_UAT_AC2468_with_both_rest_credentials_set_every_kb_embeds_over_rest_and_never_touches_the_binding\",\"duration\":67,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5281f009 \u2014 configuration selects the transport\"],\"fullName\":\"story-5281f009 \u2014 configuration selects the transport test_UAT_AC2469_with_neither_rest_credential_set_embedding_uses_the_ai_binding_exactly_as_before\",\"status\":\"passed\",\"title\":\"test_UAT_AC2469_with_neither_rest_credential_set_embedding_uses_the_ai_binding_exactly_as_before\",\"duration\":12,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5281f009 \u2014 configuration selects the transport\"],\"fullName\":\"story-5281f009 \u2014 configuration selects the transport test_UAT_AC2470_half_the_rest_credential_pair_is_a_named_error_with_no_fallback_to_the_binding\",\"status\":\"passed\",\"title\":\"test_UAT_AC2470_half_the_rest_credential_pair_is_a_named_error_with_no_fallback_to_the_binding\",\"duration\":5,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5281f009 \u2014 what the embedder is, and what its failure says\"],\"fullName\":\"story-5281f009 \u2014 what the embedder is, and what its failure says test_UAT_AC2473_the_embedder_handed_out_reports_the_models_name_and_dimension_and_returns_its_vectors_untouched\",\"status\":\"passed\",\"title\":\"test_UAT_AC2473_the_embedder_handed_out_reports_the_models_name_and_dimension_and_returns_its_vectors_untouched\",\"duration\":14,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5281f009 \u2014 what the embedder is, and what its failure says\"],\"fullName\":\"story-5281f009 \u2014 what the embedder is, and what its failure says test_UAT_AC2472_an_embedding_failure_is_a_named_error_carrying_transport_and_kb_with_binding_advice\",\"status\":\"passed\",\"title\":\"test_UAT_AC2472_an_embedding_failure_is_a_named_error_carrying_transport_and_kb_with_binding_advice\",\"duration\":3,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5281f009 \u2014 what the embedder is, and what its failure says\"],\"fullName\":\"story-5281f009 \u2014 what the embedder is, and what its failure says test_UAT_AC2474_when_nothing_can_embed_project_kb_refuses_system_kb_answers_null_and_a_session_still_opens\",\"status\":\"passed\",\"title\":\"test_UAT_AC2474_when_nothing_can_embed_project_kb_refuses_system_kb_answers_null_and_a_session_still_opens\",\"duration\":2,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794173137591,\"endTime\":1794173137694,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/tests/reconciliation-client-knowledge-embedder-transport.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-5281f009 \u2014 the declaration the product ships test_UAT_AC1654_the_clients_knowledge_base_is_declared_with_exactly_the_four_record_kinds",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5281f009 \u2014 the scaffold a fresh workspace gets test_UAT_AC1658_a_fresh_workspace_is_scaffolded_the_shipped_client_knowledge_base_field_for_field",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5281f009 \u2014 a host serves only what it can resolve test_UAT_AC1659_the_release_build_offers_exactly_the_shipped_knowledge_base",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5281f009 \u2014 one place decides how to reach the model test_UAT_AC2471_one_module_decides_how_to_embed_and_nothing_else_builds_an_embedder_or_reads_the_ai_binding",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5281f009 \u2014 one place decides how to reach the model test_UAT_AC2475_neither_rest_credential_variable_is_named_in_the_committed_wrangler_toml",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5281f009 \u2014 what it reads and how it is declared test_UAT_AC1655_it_reads_the_accounts_own_records_and_its_landscape_is_generated",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5281f009 \u2014 what it reads and how it is declared test_UAT_AC1656_the_corpus_spans_the_whole_account_rather_than_one_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5281f009 \u2014 what it reads and how it is declared test_UAT_AC1657_what_the_declaration_states_is_what_the_knowledge_base_selects",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5281f009 \u2014 the account is a hard barrier test_UAT_AC1660_one_accounts_search_returns_nothing_belonging_to_another",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5281f009 \u2014 the account is a hard barrier test_UAT_AC1661_the_derived_index_lives_in_private_storage_under_the_accounts_own_location",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5281f009 \u2014 indexing is affordable on every write test_UAT_AC1662_bringing_the_index_up_to_date_is_incremental_and_the_new_document_is_retrievable",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5281f009 \u2014 indexing is affordable on every write test_UAT_AC1663_an_account_with_no_index_yet_reads_as_having_none_rather_than_failing",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5281f009 \u2014 the model, and the runtime it runs in test_UAT_AC1664_every_environment_declares_the_embedding_model_and_its_absence_refuses_by_name",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5281f009 \u2014 the model, and the runtime it runs in test_UAT_AC1665_the_clients_knowledge_base_opens_indexes_and_searches_inside_the_deployed_runtime",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5281f009 \u2014 configuration selects the transport test_UAT_AC2468_with_both_rest_credentials_set_every_kb_embeds_over_rest_and_never_touches_the_binding",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5281f009 \u2014 configuration selects the transport test_UAT_AC2469_with_neither_rest_credential_set_embedding_uses_the_ai_binding_exactly_as_before",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5281f009 \u2014 configuration selects the transport test_UAT_AC2470_half_the_rest_credential_pair_is_a_named_error_with_no_fallback_to_the_binding",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5281f009 \u2014 what the embedder is, and what its failure says test_UAT_AC2473_the_embedder_handed_out_reports_the_models_name_and_dimension_and_returns_its_vectors_untouched",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5281f009 \u2014 what the embedder is, and what its failure says test_UAT_AC2472_an_embedding_failure_is_a_named_error_carrying_transport_and_kb_with_binding_advice",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-5281f009 \u2014 what the embedder is, and what its failure says test_UAT_AC2474_when_nothing_can_embed_project_kb_refuses_system_kb_answers_null_and_a_session_still_opens",
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