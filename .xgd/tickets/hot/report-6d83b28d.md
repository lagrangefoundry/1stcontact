---
uid: report-6d83b28d
id: REPORT-11582
type: report
title: 'Report: batch_quality_check for story-5281f009'
created_by: xgd
created_at: '2026-11-08T21:25:27.611174+00:00'
updated_at: '2026-11-08T21:25:27.611174+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: batch_quality_check
  subject_uid: story-5281f009
  parent_report_uid: report-6f8421cb
  batch_index: 0
  quality_fix_cycle: 0
---

{
  "timestamp": "2026-11-08T21:20:22.072342Z",
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
      "duration_seconds": 6.374372249934822,
      "passed": 9,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 9,
      "deselected": 0,
      "test_filter": [
        "test_UAT_AC1655",
        "test_UAT_AC1656",
        "test_UAT_AC1657",
        "test_UAT_AC1660",
        "test_UAT_AC1661",
        "test_UAT_AC1662",
        "test_UAT_AC1663",
        "test_UAT_AC1664",
        "test_UAT_AC1665"
      ],
      "scope_ac_backed": false,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "\n\\x1b[1m\\x1b[30m\\x1b[46m RUN \\x1b[49m\\x1b[39m\\x1b[22m \\x1b[36mv4.1.9 \\x1b[39m\\x1b[90m/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42\\x1b[39m\n\nSourcemap for \"/Users/martin/lagrangefoundry/node_modules/standardwebhooks/dist/index.js\" points to missing source files\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-client-knowledge-base.workers.test.ts\\x1b[2m > \\x1b[22mstory-5281f009 \u2014 what it reads and how it is declared\\x1b[2m > \\x1b[22mtest_UAT_AC1655_it_reads_the_accounts_own_records_and_its_landscape_is_generated\\x1b[32m 9\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-client-knowledge-base.workers.test.ts\\x1b[2m > \\x1b[22mstory-5281f009 \u2014 what it reads and how it is declared\\x1b[2m > \\x1b[22mtest_UAT_AC1656_the_corpus_spans_the_whole_account_rather_than_one_site\\x1b[32m 23\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-client-knowledge-base.workers.test.ts\\x1b[2m > \\x1b[22mstory-5281f009 \u2014 what it reads and how it is declared\\x1b[2m > \\x1b[22mtest_UAT_AC1657_what_the_declaration_states_is_what_the_knowledge_base_selects\\x1b[32m 2\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-client-knowledge-base.workers.test.ts\\x1b[2m > \\x1b[22mstory-5281f009 \u2014 the account is a hard barrier\\x1b[2m > \\x1b[22mtest_UAT_AC1660_one_accounts_search_returns_nothing_belonging_to_another\\x1b[32m 44\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-client-knowledge-base.workers.test.ts\\x1b[2m > \\x1b[22mstory-5281f009 \u2014 the account is a hard barrier\\x1b[2m > \\x1b[22mtest_UAT_AC1661_the_derived_index_lives_in_private_storage_under_the_accounts_own_location\\x1b[32m 16\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-client-knowledge-base.workers.test.ts\\x1b[2m > \\x1b[22mstory-5281f009 \u2014 indexing is affordable on every write\\x1b[2m > \\x1b[22mtest_UAT_AC1662_bringing_the_index_up_to_date_is_incremental_and_the_new_document_is_retrievable\\x1b[32m 37\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-client-knowledge-base.workers.test.ts\\x1b[2m > \\x1b[22mstory-5281f009 \u2014 indexing is affordable on every write\\x1b[2m > \\x1b[22mtest_UAT_AC1663_an_account_with_no_index_yet_reads_as_having_none_rather_than_failing\\x1b[32m 15\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-client-knowledge-base.workers.test.ts\\x1b[2m > \\x1b[22mstory-5281f009 \u2014 the model, and the runtime it runs in\\x1b[2m > \\x1b[22mtest_UAT_AC1664_every_environment_declares_the_embedding_model_and_its_absence_refuses_by_name\\x1b[32m 2\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[42m workers \\x1b[49m\\x1b[39m tests/reconciliation-client-knowledge-base.workers.test.ts\\x1b[2m > \\x1b[22mstory-5281f009 \u2014 the model, and the runtime it runs in\\x1b[2m > \\x1b[22mtest_UAT_AC1665_the_clients_knowledge_base_opens_indexes_and_searches_inside_the_deployed_runtime\\x1b[32m 13\\x1b[2mms\\x1b[22m\\x1b[39m\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m1 passed\\x1b[39m\\x1b[22m\\x1b[90m (1)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m9 passed\\x1b[39m\\x1b[22m\\x1b[90m (9)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 13:20:23\n\\x1b[2m   Duration \\x1b[22m 5.26s\\x1b[2m (transform 2.02s, setup 0ms, import 4.62s, tests 184ms, environment 0ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-h85oe70o.json\n\n{\"numTotalTestSuites\":5,\"numPassedTestSuites\":5,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":9,\"numPassedTests\":9,\"numFailedTests\":0,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1794172823592,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"story-5281f009 \u2014 what it reads and how it is declared\"],\"fullName\":\"story-5281f009 \u2014 what it reads and how it is declared test_UAT_AC1655_it_reads_the_accounts_own_records_and_its_landscape_is_generated\",\"status\":\"passed\",\"title\":\"test_UAT_AC1655_it_reads_the_accounts_own_records_and_its_landscape_is_generated\",\"duration\":9,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5281f009 \u2014 what it reads and how it is declared\"],\"fullName\":\"story-5281f009 \u2014 what it reads and how it is declared test_UAT_AC1656_the_corpus_spans_the_whole_account_rather_than_one_site\",\"status\":\"passed\",\"title\":\"test_UAT_AC1656_the_corpus_spans_the_whole_account_rather_than_one_site\",\"duration\":23,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5281f009 \u2014 what it reads and how it is declared\"],\"fullName\":\"story-5281f009 \u2014 what it reads and how it is declared test_UAT_AC1657_what_the_declaration_states_is_what_the_knowledge_base_selects\",\"status\":\"passed\",\"title\":\"test_UAT_AC1657_what_the_declaration_states_is_what_the_knowledge_base_selects\",\"duration\":2,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5281f009 \u2014 the account is a hard barrier\"],\"fullName\":\"story-5281f009 \u2014 the account is a hard barrier test_UAT_AC1660_one_accounts_search_returns_nothing_belonging_to_another\",\"status\":\"passed\",\"title\":\"test_UAT_AC1660_one_accounts_search_returns_nothing_belonging_to_another\",\"duration\":44,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5281f009 \u2014 the account is a hard barrier\"],\"fullName\":\"story-5281f009 \u2014 the account is a hard barrier test_UAT_AC1661_the_derived_index_lives_in_private_storage_under_the_accounts_own_location\",\"status\":\"passed\",\"title\":\"test_UAT_AC1661_the_derived_index_lives_in_private_storage_under_the_accounts_own_location\",\"duration\":16,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5281f009 \u2014 indexing is affordable on every write\"],\"fullName\":\"story-5281f009 \u2014 indexing is affordable on every write test_UAT_AC1662_bringing_the_index_up_to_date_is_incremental_and_the_new_document_is_retrievable\",\"status\":\"passed\",\"title\":\"test_UAT_AC1662_bringing_the_index_up_to_date_is_incremental_and_the_new_document_is_retrievable\",\"duration\":37,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5281f009 \u2014 indexing is affordable on every write\"],\"fullName\":\"story-5281f009 \u2014 indexing is affordable on every write test_UAT_AC1663_an_account_with_no_index_yet_reads_as_having_none_rather_than_failing\",\"status\":\"passed\",\"title\":\"test_UAT_AC1663_an_account_with_no_index_yet_reads_as_having_none_rather_than_failing\",\"duration\":15,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5281f009 \u2014 the model, and the runtime it runs in\"],\"fullName\":\"story-5281f009 \u2014 the model, and the runtime it runs in test_UAT_AC1664_every_environment_declares_the_embedding_model_and_its_absence_refuses_by_name\",\"status\":\"passed\",\"title\":\"test_UAT_AC1664_every_environment_declares_the_embedding_model_and_its_absence_refuses_by_name\",\"duration\":2,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-5281f009 \u2014 the model, and the runtime it runs in\"],\"fullName\":\"story-5281f009 \u2014 the model, and the runtime it runs in test_UAT_AC1665_the_clients_knowledge_base_opens_indexes_and_searches_inside_the_deployed_runtime\",\"status\":\"passed\",\"title\":\"test_UAT_AC1665_the_clients_knowledge_base_opens_indexes_and_searches_inside_the_deployed_runtime\",\"duration\":13,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1794172828704,\"endTime\":1794172828865,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-42/tests/reconciliation-client-knowledge-base.workers.test.ts\"}]}",
      "stderr": "",
      "tests": [
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