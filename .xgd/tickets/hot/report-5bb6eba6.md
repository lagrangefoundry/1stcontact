---
uid: report-5bb6eba6
id: REPORT-7238
type: report
title: 'Scoped quality: pass (15 tests, 0 failed)'
created_by: xgd
created_at: '2026-11-01T03:13:18.992430+00:00'
updated_at: '2026-11-01T03:13:18.992430+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: quality
  subject_uid: STORY-104
  commit: bff9c97bd580fa71df1b3532fdbc76c68b22aa1d
---

{
  "timestamp": "2026-11-01T03:10:30.264843Z",
  "lint": {
    "status": "success",
    "exit_code": 0,
    "duration_seconds": 0.0001242088619619608,
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
      "duration_seconds": 1.5474502500146627,
      "passed": 15,
      "failed": 0,
      "skipped": 0,
      "errors": 0,
      "total": 15,
      "deselected": 0,
      "test_filter": [
        "test_UAT_AC1062_",
        "test_UAT_AC1063_",
        "test_UAT_AC1064_",
        "test_UAT_AC1065_",
        "test_UAT_AC1066_",
        "test_UAT_AC1067_",
        "test_UAT_AC1068_",
        "test_UAT_AC1069_",
        "test_UAT_AC1070_",
        "test_UAT_AC1816_",
        "test_UAT_AC1819_",
        "test_UAT_AC2092_",
        "test_UAT_AC2093_",
        "test_UAT_AC2094_"
      ],
      "scope_ac_backed": true,
      "coverage": null,
      "lines_covered": 0,
      "lines_total": 0,
      "files_covered": [],
      "junit_xml_path": null,
      "stdout": "ms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-builder-assistant-pane.test.ts\\x1b[2m > \\x1b[22mstory-7f437d57 \u2014 one site, chosen in one place\\x1b[2m > \\x1b[22mtest_UAT_AC1066_what_the_assistant_did_is_shown_in_the_panes_activity_area\\x1b[32m 15\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-builder-assistant-pane.test.ts\\x1b[2m > \\x1b[22mstory-7f437d57 \u2014 one site, chosen in one place\\x1b[2m > \\x1b[22mtest_UAT_AC1067_an_unsent_draft_belongs_to_one_conversation_and_survives_a_round_trip\\x1b[32m 15\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-builder-assistant-pane.test.ts\\x1b[2m > \\x1b[22mstory-7f437d57 \u2014 failure is visible, history survives\\x1b[2m > \\x1b[22mtest_UAT_AC1068_an_assistant_that_cannot_run_is_explained_with_the_history_intact\\x1b[32m 5\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-builder-assistant-pane.test.ts\\x1b[2m > \\x1b[22mstory-7f437d57 \u2014 failure is visible, history survives\\x1b[2m > \\x1b[22mtest_UAT_AC1069_an_unreachable_origin_is_reported_in_the_pane_not_left_blank\\x1b[32m 6\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-builder-assistant-pane.test.ts\\x1b[2m > \\x1b[22mstory-7f437d57 \u2014 failure is visible, history survives\\x1b[2m > \\x1b[22mtest_UAT_AC1070_switching_faster_than_the_answers_arrive_leaves_the_last_chosen_site\\x1b[32m 9\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-builder-pane-rejoin.test.ts\\x1b[2m > \\x1b[22mstory-7f437d57 \u2014 a pane loaded mid-turn rejoins it\\x1b[2m > \\x1b[22mtest_UAT_AC2092_a_live_turn_is_one_growing_assistant_message_with_no_user_message_added\\x1b[32m 106\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-builder-pane-rejoin.test.ts\\x1b[2m > \\x1b[22mstory-7f437d57 \u2014 a pane loaded mid-turn rejoins it\\x1b[2m > \\x1b[22mtest_UAT_AC2093_a_rejoined_turns_writes_reload_the_page_and_a_failed_reload_keeps_the_reply\\x1b[32m 39\\x1b[2mms\\x1b[22m\\x1b[39m\n \\x1b[32m\u2713\\x1b[39m \\x1b[30m\\x1b[43m node \\x1b[49m\\x1b[39m tests/reconciliation-builder-pane-rejoin.test.ts\\x1b[2m > \\x1b[22mstory-7f437d57 \u2014 a pane loaded mid-turn rejoins it\\x1b[2m > \\x1b[22mtest_UAT_AC2094_no_live_turn_is_not_rejoined_a_failed_rejoin_is_silent_and_a_transport_without_rejoin_mounts\\x1b[32m 123\\x1b[2mms\\x1b[22m\\x1b[39m\n\n\\x1b[2m Test Files \\x1b[22m \\x1b[1m\\x1b[32m3 passed\\x1b[39m\\x1b[22m\\x1b[90m (3)\\x1b[39m\n\\x1b[2m      Tests \\x1b[22m \\x1b[1m\\x1b[32m15 passed\\x1b[39m\\x1b[22m\\x1b[90m (15)\\x1b[39m\n\\x1b[2m   Start at \\x1b[22m 20:10:31\n\\x1b[2m   Duration \\x1b[22m 709ms\\x1b[2m (transform 246ms, setup 0ms, import 162ms, tests 684ms, environment 696ms)\\x1b[22m\n\nJSON report written to /var/folders/27/xt2427c97lzdk20whv0zxnz80000gn/T/xgd-vitest-97tymrde.json\n\n{\"numTotalTestSuites\":10,\"numPassedTestSuites\":10,\"numFailedTestSuites\":0,\"numPendingTestSuites\":0,\"numTotalTests\":15,\"numPassedTests\":15,\"numFailedTests\":0,\"numPendingTests\":0,\"numTodoTests\":0,\"snapshot\":{\"added\":0,\"failure\":false,\"filesAdded\":0,\"filesRemoved\":0,\"filesRemovedList\":[],\"filesUnmatched\":0,\"filesUpdated\":0,\"matched\":0,\"total\":0,\"unchecked\":0,\"uncheckedKeysByFile\":[],\"unmatched\":0,\"updated\":0,\"didUpdate\":false},\"startTime\":1793502631293,\"success\":true,\"testResults\":[{\"assertionResults\":[{\"ancestorTitles\":[\"story-7f437d57 \u2014 a live conversation, not a placeholder\"],\"fullName\":\"story-7f437d57 \u2014 a live conversation, not a placeholder test_UAT_AC1062_the_secondary_pane_is_a_working_conversation_for_the_displayed_site\",\"status\":\"passed\",\"title\":\"test_UAT_AC1062_the_secondary_pane_is_a_working_conversation_for_the_displayed_site\",\"duration\":21.93762499999997,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7f437d57 \u2014 a live conversation, not a placeholder\"],\"fullName\":\"story-7f437d57 \u2014 a live conversation, not a placeholder test_UAT_AC1063_the_pane_replays_what_the_conversation_holds_on_open_and_after_reload\",\"status\":\"passed\",\"title\":\"test_UAT_AC1063_the_pane_replays_what_the_conversation_holds_on_open_and_after_reload\",\"duration\":19.454000000000008,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7f437d57 \u2014 one site, chosen in one place\"],\"fullName\":\"story-7f437d57 \u2014 one site, chosen in one place test_UAT_AC1064_changing_site_changes_the_conversation_and_only_the_toolbar_chooses\",\"status\":\"passed\",\"title\":\"test_UAT_AC1064_changing_site_changes_the_conversation_and_only_the_toolbar_chooses\",\"duration\":16.340833000000032,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7f437d57 \u2014 one site, chosen in one place\"],\"fullName\":\"story-7f437d57 \u2014 one site, chosen in one place test_UAT_AC1065_a_message_addresses_the_shown_conversation_and_the_reply_streams_in\",\"status\":\"passed\",\"title\":\"test_UAT_AC1065_a_message_addresses_the_shown_conversation_and_the_reply_streams_in\",\"duration\":13.511041999999975,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7f437d57 \u2014 one site, chosen in one place\"],\"fullName\":\"story-7f437d57 \u2014 one site, chosen in one place test_UAT_AC1066_what_the_assistant_did_is_shown_in_the_panes_activity_area\",\"status\":\"passed\",\"title\":\"test_UAT_AC1066_what_the_assistant_did_is_shown_in_the_panes_activity_area\",\"duration\":15.338125000000048,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7f437d57 \u2014 one site, chosen in one place\"],\"fullName\":\"story-7f437d57 \u2014 one site, chosen in one place test_UAT_AC1067_an_unsent_draft_belongs_to_one_conversation_and_survives_a_round_trip\",\"status\":\"passed\",\"title\":\"test_UAT_AC1067_an_unsent_draft_belongs_to_one_conversation_and_survives_a_round_trip\",\"duration\":14.84920800000009,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7f437d57 \u2014 failure is visible, history survives\"],\"fullName\":\"story-7f437d57 \u2014 failure is visible, history survives test_UAT_AC1068_an_assistant_that_cannot_run_is_explained_with_the_history_intact\",\"status\":\"passed\",\"title\":\"test_UAT_AC1068_an_assistant_that_cannot_run_is_explained_with_the_history_intact\",\"duration\":5.080249999999978,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7f437d57 \u2014 failure is visible, history survives\"],\"fullName\":\"story-7f437d57 \u2014 failure is visible, history survives test_UAT_AC1069_an_unreachable_origin_is_reported_in_the_pane_not_left_blank\",\"status\":\"passed\",\"title\":\"test_UAT_AC1069_an_unreachable_origin_is_reported_in_the_pane_not_left_blank\",\"duration\":6.183500000000095,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7f437d57 \u2014 failure is visible, history survives\"],\"fullName\":\"story-7f437d57 \u2014 failure is visible, history survives test_UAT_AC1070_switching_faster_than_the_answers_arrive_leaves_the_last_chosen_site\",\"status\":\"passed\",\"title\":\"test_UAT_AC1070_switching_faster_than_the_answers_arrive_leaves_the_last_chosen_site\",\"duration\":8.753041000000053,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793502631743,\"endTime\":1793502631863.753,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-34/tests/reconciliation-builder-assistant-pane.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-7f437d57 \u2014 replay waits for the engines\"],\"fullName\":\"story-7f437d57 \u2014 replay waits for the engines test_UAT_AC1063_replay_is_withheld_until_the_engines_settle_and_then_reads_as_prose\",\"status\":\"passed\",\"title\":\"test_UAT_AC1063_replay_is_withheld_until_the_engines_settle_and_then_reads_as_prose\",\"duration\":43.39687500000002,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7f437d57 \u2014 the engines belong to the workspace\"],\"fullName\":\"story-7f437d57 \u2014 the engines belong to the workspace test_UAT_AC1816_the_engines_start_once_for_the_workspace_and_readiness_settles_either_way\",\"status\":\"passed\",\"title\":\"test_UAT_AC1816_the_engines_start_once_for_the_workspace_and_readiness_settles_either_way\",\"duration\":16.09141699999998,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7f437d57 \u2014 the page follows the writes\"],\"fullName\":\"story-7f437d57 \u2014 the page follows the writes test_UAT_AC1819_the_displayed_page_is_refetched_per_write_and_a_failed_refetch_keeps_the_reply\",\"status\":\"passed\",\"title\":\"test_UAT_AC1819_the_displayed_page_is_refetched_per_write_and_a_failed_refetch_keeps_the_reply\",\"duration\":22.666125000000022,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793502631743,\"endTime\":1793502631825.666,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-34/tests/reconciliation-builder-markdown-readiness.test.ts\"},{\"assertionResults\":[{\"ancestorTitles\":[\"story-7f437d57 \u2014 a pane loaded mid-turn rejoins it\"],\"fullName\":\"story-7f437d57 \u2014 a pane loaded mid-turn rejoins it test_UAT_AC2092_a_live_turn_is_one_growing_assistant_message_with_no_user_message_added\",\"status\":\"passed\",\"title\":\"test_UAT_AC2092_a_live_turn_is_one_growing_assistant_message_with_no_user_message_added\",\"duration\":105.53666699999997,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7f437d57 \u2014 a pane loaded mid-turn rejoins it\"],\"fullName\":\"story-7f437d57 \u2014 a pane loaded mid-turn rejoins it test_UAT_AC2093_a_rejoined_turns_writes_reload_the_page_and_a_failed_reload_keeps_the_reply\",\"status\":\"passed\",\"title\":\"test_UAT_AC2093_a_rejoined_turns_writes_reload_the_page_and_a_failed_reload_keeps_the_reply\",\"duration\":38.774374999999964,\"failureMessages\":[],\"meta\":{},\"tags\":[]},{\"ancestorTitles\":[\"story-7f437d57 \u2014 a pane loaded mid-turn rejoins it\"],\"fullName\":\"story-7f437d57 \u2014 a pane loaded mid-turn rejoins it test_UAT_AC2094_no_live_turn_is_not_rejoined_a_failed_rejoin_is_silent_and_a_transport_without_rejoin_mounts\",\"status\":\"passed\",\"title\":\"test_UAT_AC2094_no_live_turn_is_not_rejoined_a_failed_rejoin_is_silent_and_a_transport_without_rejoin_mounts\",\"duration\":123.06058299999995,\"failureMessages\":[],\"meta\":{},\"tags\":[]}],\"startTime\":1793502631742,\"endTime\":1793502632010.0605,\"status\":\"passed\",\"message\":\"\",\"name\":\"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/reconcile-BUNDLE-34/tests/reconciliation-builder-pane-rejoin.test.ts\"}]}",
      "stderr": "",
      "tests": [
        {
          "name": "story-7f437d57 \u2014 a live conversation, not a placeholder test_UAT_AC1062_the_secondary_pane_is_a_working_conversation_for_the_displayed_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 a live conversation, not a placeholder test_UAT_AC1063_the_pane_replays_what_the_conversation_holds_on_open_and_after_reload",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 one site, chosen in one place test_UAT_AC1064_changing_site_changes_the_conversation_and_only_the_toolbar_chooses",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 one site, chosen in one place test_UAT_AC1065_a_message_addresses_the_shown_conversation_and_the_reply_streams_in",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 one site, chosen in one place test_UAT_AC1066_what_the_assistant_did_is_shown_in_the_panes_activity_area",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 one site, chosen in one place test_UAT_AC1067_an_unsent_draft_belongs_to_one_conversation_and_survives_a_round_trip",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 failure is visible, history survives test_UAT_AC1068_an_assistant_that_cannot_run_is_explained_with_the_history_intact",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 failure is visible, history survives test_UAT_AC1069_an_unreachable_origin_is_reported_in_the_pane_not_left_blank",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 failure is visible, history survives test_UAT_AC1070_switching_faster_than_the_answers_arrive_leaves_the_last_chosen_site",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 replay waits for the engines test_UAT_AC1063_replay_is_withheld_until_the_engines_settle_and_then_reads_as_prose",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 the engines belong to the workspace test_UAT_AC1816_the_engines_start_once_for_the_workspace_and_readiness_settles_either_way",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 the page follows the writes test_UAT_AC1819_the_displayed_page_is_refetched_per_write_and_a_failed_refetch_keeps_the_reply",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 a pane loaded mid-turn rejoins it test_UAT_AC2092_a_live_turn_is_one_growing_assistant_message_with_no_user_message_added",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 a pane loaded mid-turn rejoins it test_UAT_AC2093_a_rejoined_turns_writes_reload_the_page_and_a_failed_reload_keeps_the_reply",
          "file": "",
          "status": "passed"
        },
        {
          "name": "story-7f437d57 \u2014 a pane loaded mid-turn rejoins it test_UAT_AC2094_no_live_turn_is_not_rejoined_a_failed_rejoin_is_silent_and_a_transport_without_rejoin_mounts",
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