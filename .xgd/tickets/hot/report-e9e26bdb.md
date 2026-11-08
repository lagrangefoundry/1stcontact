---
uid: report-e9e26bdb
id: REPORT-11479
type: report
title: 'Report: fix_plan for STORY-99'
created_by: xgd
created_at: '2026-11-08T14:34:48.289334+00:00'
updated_at: '2026-11-08T14:34:48.289334+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_plan
  subject_uid: STORY-99
  items:
  - index: 0
    tests:
    - story-e674c60a — the businesses endpoint test_UAT_AC2144_businesses_endpoint_reports_account_and_every_membership_in_one_call
    - story-e674c60a — the deployed workspace, with nothing running locally test_UAT_AC1402_a_local_site_copies_up_idempotently_through_the_serving_store
    - 'story-e674c60a component scope: one name, written once test_UAT_AC960_component_scope_is_written_in_exactly_one_place'
    - story-e674c60a — shell chrome carries the scope test_UAT_AC2143_shell_header_carries_switcher_and_avatar_and_no_tab_is_unscoped
    - story-e674c60a — an account with nothing selectable test_UAT_AC2146_no_selectable_business_blocks_tabs_keeps_chrome_and_asks_no_site_list
    - story-e674c60a — an ended session says so test_UAT_AC2230_expired_session_replaces_builder_at_load_and_strips_a_live_shell_mid_session
    - story-e674c60a — only a refused session counts test_UAT_AC2231_non_401_failures_keep_their_defaults_and_a_valid_session_is_never_told_it_ended
    - story-e674c60a — the chrome controls share one size test_UAT_AC2232_every_chrome_control_resolves_to_the_single_control_font_size_token_last
    - story-e674c60a builder origin test_UAT_AC977_every_response_the_origin_returns_is_non_cacheable
    - story-e674c60a — every text-bearing builder control is one size test_UAT_AC2232_every_text_bearing_builder_control_resolves_to_the_control_token_through_its_mounted_ancestry
    dependency_tests: []
    instructions: ''
    test_scope: test_UAT_AC2144 or test_UAT_AC1402 or test_UAT_AC960 or test_UAT_AC2143
      or test_UAT_AC2146 or test_UAT_AC2230 or test_UAT_AC2231 or test_UAT_AC2232
      or test_UAT_AC977
---

{
  "items": [
    {
      "index": 0,
      "tests": [
        "story-e674c60a \u2014 the businesses endpoint test_UAT_AC2144_businesses_endpoint_reports_account_and_every_membership_in_one_call",
        "story-e674c60a \u2014 the deployed workspace, with nothing running locally test_UAT_AC1402_a_local_site_copies_up_idempotently_through_the_serving_store",
        "story-e674c60a component scope: one name, written once test_UAT_AC960_component_scope_is_written_in_exactly_one_place",
        "story-e674c60a \u2014 shell chrome carries the scope test_UAT_AC2143_shell_header_carries_switcher_and_avatar_and_no_tab_is_unscoped",
        "story-e674c60a \u2014 an account with nothing selectable test_UAT_AC2146_no_selectable_business_blocks_tabs_keeps_chrome_and_asks_no_site_list",
        "story-e674c60a \u2014 an ended session says so test_UAT_AC2230_expired_session_replaces_builder_at_load_and_strips_a_live_shell_mid_session",
        "story-e674c60a \u2014 only a refused session counts test_UAT_AC2231_non_401_failures_keep_their_defaults_and_a_valid_session_is_never_told_it_ended",
        "story-e674c60a \u2014 the chrome controls share one size test_UAT_AC2232_every_chrome_control_resolves_to_the_single_control_font_size_token_last",
        "story-e674c60a builder origin test_UAT_AC977_every_response_the_origin_returns_is_non_cacheable",
        "story-e674c60a \u2014 every text-bearing builder control is one size test_UAT_AC2232_every_text_bearing_builder_control_resolves_to_the_control_token_through_its_mounted_ancestry"
      ],
      "dependency_tests": [],
      "instructions": "",
      "test_scope": "test_UAT_AC2144 or test_UAT_AC1402 or test_UAT_AC960 or test_UAT_AC2143 or test_UAT_AC2146 or test_UAT_AC2230 or test_UAT_AC2231 or test_UAT_AC2232 or test_UAT_AC977"
    }
  ]
}