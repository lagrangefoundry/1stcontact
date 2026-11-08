---
uid: report-f3db1a31
id: REPORT-11578
type: report
title: 'Scoped quality: fail (20 tests, 9 failed, 9 orphan AC(s))'
created_by: xgd
created_at: '2026-11-08T21:18:21.985357+00:00'
updated_at: '2026-11-08T21:18:21.985357+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: quality
  subject_uid: story-5281f009
  commit: 080609e20edb508f1dd8d6044645ae7517023d49
---

{
  "timestamp": "2026-11-08T21:13:14.363213Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.00017312495037913322,
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
      "duration_seconds": 4.166254540905356,
      "passed": 11,
      "failed": 9,
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
      "stdout": "\":[\"story-5281f009 \u2014 indexing is affordable on every write\"],\"fullName\":\"story-5281f009 \u2014 indexing is affordable on every write test_UAT_AC1662_bringing_the_index_up_to_date_is_incremental_and_the_new_document_is_retrievable\",\"status\":\"failed\",\"title\":\"test_UAT_AC1662_bringing_the_index_up_to_date_is_incremental_and_the_new_document_is_retrievable\",\"duration\":0,\"failureMessages\":[\"Error: D1_TYPE_ERROR: Type 'undefined' not supported for value 'undefined'\\n    at cloudflare-internal:d1-api:318:19\\n    at Array.map (<anonymous>)\\n    at D1PreparedStatement.bind (cloudflare-internal:d1-api:290:42)\\n    at Accessor.getTenant (/Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/ticketing/src/accessor.js:654:8)\\n    at ticketStoreFor (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/apps/control-app/src/tickets.ts:673:29)\\n    at projectKnowledgeFor (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/apps/control-app/src/knowledge.ts:670:38)\\n    at openKb (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/tests/reconciliation-client-knowledge-base.workers.test.ts:85:20)\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/tests/reconciliation-client-knowledge-base.workers.test.ts:302:36\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:302:11\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:26\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5281f009 \u2014 indexing is affordable on every write\"],\"fullName\":\"story-5281f009 \u2014 indexing is affordable on every write test_UAT_AC1663_an_account_with_no_index_yet_reads_as_having_none_rather_than_failing\",\"status\":\"failed\",\"title\":\"test_UAT_AC1663_an_account_with_no_index_yet_reads_as_having_none_rather_than_failing\",\"duration\":8,\"failureMessages\":[\"Error: D1_TYPE_ERROR: Type 'undefined' not supported for value 'undefined'\\n    at cloudflare-internal:d1-api:318:19\\n    at Array.map (<anonymous>)\\n    at D1PreparedStatement.bind (cloudflare-internal:d1-api:290:42)\\n    at Accessor.getTenant (/Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/ticketing/src/accessor.js:654:8)\\n    at ticketStoreFor (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/apps/control-app/src/tickets.ts:673:29)\\n    at projectKnowledgeFor (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/apps/control-app/src/knowledge.ts:670:38)\\n    at openKb (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/tests/reconciliation-client-knowledge-base.workers.test.ts:85:20)\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/tests/reconciliation-client-knowledge-base.workers.test.ts:354:26\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5281f009 \u2014 the model, and the runtime it runs in\"],\"fullName\":\"story-5281f009 \u2014 the model, and the runtime it runs in test_UAT_AC1664_every_environment_declares_the_embedding_model_and_its_absence_refuses_by_name\",\"status\":\"failed\",\"title\":\"test_UAT_AC1664_every_environment_declares_the_embedding_model_and_its_absence_refuses_by_name\",\"duration\":1,\"failureMessages\":[\"AssertionError: no empty-but-valid knowledge base is returned: expected TypeError: Cannot read properties of unde\u2026 to be an instance of AiNotConfiguredError\\n    at Proxy.<anonymous> (Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/node_modules/.pnpm/@vitest+expect@4.1.9/node_modules/@vitest/expect/dist/index.js:1386:15)\\n    at Proxy.<anonymous> (Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/node_modules/.pnpm/@vitest+expect@4.1.9/node_modules/@vitest/expect/dist/index.js:1156:15)\\n    at Proxy.methodWrapper (Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/node_modules/.pnpm/chai@6.2.2/node_modules/chai/index.js:1700:25)\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/tests/reconciliation-client-knowledge-base.workers.test.ts:384:70\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20\"],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5281f009 \u2014 the model, and the runtime it runs in\"],\"fullName\":\"story-5281f009 \u2014 the model, and the runtime it runs in test_UAT_AC1665_the_clients_knowledge_base_opens_indexes_and_searches_inside_the_deployed_runtime\",\"status\":\"failed\",\"title\":\"test_UAT_AC1665_the_clients_knowledge_base_opens_indexes_and_searches_inside_the_deployed_runtime\",\"duration\":0,\"failureMessages\":[\"Error: D1_TYPE_ERROR: Type 'undefined' not supported for value 'undefined'\\n    at cloudflare-internal:d1-api:318:19\\n    at Array.map (<anonymous>)\\n    at D1PreparedStatement.bind (cloudflare-internal:d1-api:290:42)\\n    at Accessor.getTenant (/Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/ticketing/src/accessor.js:654:8)\\n    at ticketStoreFor (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/apps/control-app/src/tickets.ts:673:29)\\n    at projectKnowledgeFor (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/apps/control-app/src/knowledge.ts:670:38)\\n    at openKb (/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/tests/reconciliation-client-knowledge-base.workers.test.ts:85:20)\\n    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/tests/reconciliation-client-knowledge-base.workers.test.ts:398:26\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:302:11\\n    at Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/node_modules/.pnpm/@vitest+runner@4.1.9/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:26\"],\"meta\":{},\"tags\":[]}],\"startTime\":1794172398172,\"endTime\":1794172398187,\"status\":\"failed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/tests/reconciliation-client-knowledge-base.workers.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-5281f009 \u2014 configuration selects the transport\"],\"fullName\":\"story-5281f009 \u2014 configuration selects the transport test_UAT_AC2468_with_both_rest_credentials_set_every_kb_embeds_over_rest_and_never_touches_the_binding\",\"status\":\"passed\",\"title\":\"test_UAT_AC2468_with_both_rest_credentials_set_every_kb_embeds_over_rest_and_never_touches_the_binding\",\"duration\":53,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5281f009 \u2014 configuration selects the transport\"],\"fullName\":\"story-5281f009 \u2014 configuration selects the transport test_UAT_AC2469_with_neither_rest_credential_set_embedding_uses_the_ai_binding_exactly_as_before\",\"status\":\"passed\",\"title\":\"test_UAT_AC2469_with_neither_rest_credential_set_embedding_uses_the_ai_binding_exactly_as_before\",\"duration\":11,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5281f009 \u2014 configuration selects the transport\"],\"fullName\":\"story-5281f009 \u2014 configuration selects the transport test_UAT_AC2470_half_the_rest_credential_pair_is_a_named_error_with_no_fallback_to_the_binding\",\"status\":\"passed\",\"title\":\"test_UAT_AC2470_half_the_rest_credential_pair_is_a_named_error_with_no_fallback_to_the_binding\",\"duration\":3,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5281f009 \u2014 what the embedder is, and what its failure says\"],\"fullName\":\"story-5281f009 \u2014 what the embedder is, and what its failure says test_UAT_AC2473_the_embedder_handed_out_reports_the_models_name_and_dimension_and_returns_its_vectors_untouched\",\"status\":\"passed\",\"title\":\"test_UAT_AC2473_the_embedder_handed_out_reports_the_models_name_and_dimension_and_returns_its_vectors_untouched\",\"duration\":11,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5281f009 \u2014 what the embedder is, and what its failure says\"],\"fullName\":\"story-5281f009 \u2014 what the embedder is, and what its failure says test_UAT_AC2472_an_embedding_failure_is_a_named_error_carrying_transport_and_kb_with_binding_advice\",\"status\":\"passed\",\"title\":\"test_UAT_AC2472_an_embedding_failure_is_a_named_error_carrying_transport_and_kb_with_binding_advice\",\"duration\":2,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5281f009 \u2014 what the embedder is, and what its failure says\"],\"fullName\":\"story-5281f009 \u2014 what the embedder is, and what its failure says test_UAT_AC2474_when_nothing_can_embed_project_kb_refuses_system_kb_answers_null_and_a_session_still_opens\",\"status\":\"passed\",\"title\":\"test_UAT_AC2474_when_nothing_can_embed_project_kb_refuses_system_kb_answers_null_and_a_session_still_opens\",\"duration\":2,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794172399013,\"endTime\":1794172399095,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/tests/reconciliation-client-knowledge-embedder-transport.workers.test.ts\"}]}",
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
          "status": "failed"
        },
        {
          "name": "story-5281f009 \u2014 what it reads and how it is declared test_UAT_AC1656_the_corpus_spans_the_whole_account_rather_than_one_site",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-5281f009 \u2014 what it reads and how it is declared test_UAT_AC1657_what_the_declaration_states_is_what_the_knowledge_base_selects",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-5281f009 \u2014 the account is a hard barrier test_UAT_AC1660_one_accounts_search_returns_nothing_belonging_to_another",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-5281f009 \u2014 the account is a hard barrier test_UAT_AC1661_the_derived_index_lives_in_private_storage_under_the_accounts_own_location",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-5281f009 \u2014 indexing is affordable on every write test_UAT_AC1662_bringing_the_index_up_to_date_is_incremental_and_the_new_document_is_retrievable",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-5281f009 \u2014 indexing is affordable on every write test_UAT_AC1663_an_account_with_no_index_yet_reads_as_having_none_rather_than_failing",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-5281f009 \u2014 the model, and the runtime it runs in test_UAT_AC1664_every_environment_declares_the_embedding_model_and_its_absence_refuses_by_name",
          "file": "",
          "status": "failed"
        },
        {
          "name": "story-5281f009 \u2014 the model, and the runtime it runs in test_UAT_AC1665_the_clients_knowledge_base_opens_indexes_and_searches_inside_the_deployed_runtime",
          "file": "",
          "status": "failed"
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
      "failures": [
        {
          "test_name": "story-5281f009 \u2014 what it reads and how it is declared test_UAT_AC1655_it_reads_the_accounts_own_records_and_its_landscape_is_generated",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-5281f009 \u2014 what it reads and how it is declared test_UAT_AC1656_the_corpus_spans_the_whole_account_rather_than_one_site",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-5281f009 \u2014 what it reads and how it is declared test_UAT_AC1657_what_the_declaration_states_is_what_the_knowledge_base_selects",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-5281f009 \u2014 the account is a hard barrier test_UAT_AC1660_one_accounts_search_returns_nothing_belonging_to_another",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-5281f009 \u2014 the account is a hard barrier test_UAT_AC1661_the_derived_index_lives_in_private_storage_under_the_accounts_own_location",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-5281f009 \u2014 indexing is affordable on every write test_UAT_AC1662_bringing_the_index_up_to_date_is_incremental_and_the_new_document_is_retrievable",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-5281f009 \u2014 indexing is affordable on every write test_UAT_AC1663_an_account_with_no_index_yet_reads_as_having_none_rather_than_failing",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-5281f009 \u2014 the model, and the runtime it runs in test_UAT_AC1664_every_environment_declares_the_embedding_model_and_its_absence_refuses_by_name",
          "message": "(structured failure details unavailable \u2014 JUnit XML missing or unparseable; this entry synthesised from streamed pytest output. Run pytest -k <test_name> to fetch full traceback.)",
          "file_path": "",
          "line_number": null,
          "error_type": "assertion",
          "action_required": null,
          "traceback": null,
          "synthesised": true
        },
        {
          "test_name": "story-5281f009 \u2014 the model, and the runtime it runs in test_UAT_AC1665_the_clients_knowledge_base_opens_indexes_and_searches_inside_the_deployed_runtime",
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
      "passed": 11,
      "failed": 9,
      "total": 12,
      "failures": [
        {
          "test_name": "AC-1664 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1664 'Every environment has the same embedding model available, and its absence refuses by name, naming both the binding and the REST-credential remedy' (uid=acceptance_criterion-020369c0) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1664.",
          "ac_uid": "acceptance_criterion-020369c0",
          "ac_id": "AC-1664",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1655 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1655 'It reads the account's own records and its landscape is generated, naming no shipped corpus' (uid=acceptance_criterion-2585d05b) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1655.",
          "ac_uid": "acceptance_criterion-2585d05b",
          "ac_id": "AC-1655",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1656 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1656 'The corpus spans the whole account rather than one site, so a client's sites share what is known about them' (uid=acceptance_criterion-dc7bf9a3) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1656.",
          "ac_uid": "acceptance_criterion-dc7bf9a3",
          "ac_id": "AC-1656",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1657 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1657 'What the declaration states is what the knowledge base selects, not a copy fixed beside it' (uid=acceptance_criterion-60dc3717) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1657.",
          "ac_uid": "acceptance_criterion-60dc3717",
          "ac_id": "AC-1657",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1660 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1660 'One account's search returns nothing belonging to another, over the records and the vectors alike' (uid=acceptance_criterion-ed84456a) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1660.",
          "ac_uid": "acceptance_criterion-ed84456a",
          "ac_id": "AC-1660",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1661 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1661 'The derived index lives in private storage under the account's own location, outside every servable and attachment namespace' (uid=acceptance_criterion-4af32697) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1661.",
          "ac_uid": "acceptance_criterion-4af32697",
          "ac_id": "AC-1661",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1662 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1662 'Bringing the index up to date is incremental, and the new document is retrievable from that pass alone' (uid=acceptance_criterion-cd16c2ac) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1662.",
          "ac_uid": "acceptance_criterion-cd16c2ac",
          "ac_id": "AC-1662",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1663 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1663 'An account with no index yet reads as having none rather than failing, so its first document indexes' (uid=acceptance_criterion-2e57bfc7) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1663.",
          "ac_uid": "acceptance_criterion-2e57bfc7",
          "ac_id": "AC-1663",
          "kind": "orphaned_ac"
        },
        {
          "test_name": "AC-1665 (orphaned acceptance criterion)",
          "file": "<capability_matrix>",
          "status": "failed",
          "message": "AC-1665 'The client's knowledge base opens, indexes and searches inside the deployed runtime, which has no filesystem' (uid=acceptance_criterion-60d226fa) has no passing test in this intent's scope. Either deprecate the AC if the feature is intentionally not in production, OR add / restore a passing test that references AC-1665.",
          "ac_uid": "acceptance_criterion-60d226fa",
          "ac_id": "AC-1665",
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
        "message": "9 test(s) failed",
        "suggestion": "Fix failing tests",
        "context": {
          "failures": 9
        }
      }
    ]
  }
}