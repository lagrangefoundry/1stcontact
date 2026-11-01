---
uid: report-1a9fddd1
id: REPORT-7796
type: report
title: 'Report: fix_plan for story-7102ffe3'
created_by: xgd
created_at: '2026-11-01T18:12:55.983966+00:00'
updated_at: '2026-11-01T18:18:12.264508+00:00'
completed_at: null
last_field_updated: batches_pending
fields:
  report_kind: fix_plan
  subject_uid: story-7102ffe3
  items:
  - index: 0
    tests:
    - a path prefix selects one held business test_UAT_AC2117_prefix_selects_held_business_and_two_businesses_never_see_each_others_sites
    - a named business the caller does not hold test_UAT_AC2118_unheld_target_is_refused_403_uniformly_and_never_substituted
    - a named business whose grant lapsed test_UAT_AC2119_lapsed_named_target_refused_and_logged_no_entitlement
    - a request with no target test_UAT_AC2120_no_target_operates_first_selectable_business_never_the_platform
    - the platform admin bypass test_UAT_AC2121_admin_operates_any_live_business_but_not_lapsed_unknown_or_deactivated
    - a deactivated business test_UAT_AC2122_deactivated_business_leaves_selectable_set_and_is_refused_403
    - the loopback dev-open path test_UAT_AC2123_dev_open_operates_platform_business_and_ignores_named_target
    - a preview sub-resource keeps its business test_UAT_AC2126_preview_asset_is_served_from_the_same_business_as_its_page
    - chat hosts are per business within one isolate test_UAT_AC2127_two_businesses_get_separate_chat_hosts_and_failed_builds_are_not_cached
    - a session resumed after membership expiry test_UAT_AC2128_resumed_session_after_membership_expiry_is_refused_not_answered_from_warm_host
    - an admitted account with nothing selectable keeps its chrome test_UAT_AC2129_chrome_and_businesses_listing_answer_200_with_every_business_unselectable
    - a business-scoped route with nothing selectable test_UAT_AC2130_business_scoped_routes_answer_403_no_business_message_logged_no_entitlement
    - the operator keeps the existing 1stcontact business test_UAT_AC2131_operator_resolves_to_1stcontact_after_migration_and_rerun_changes_nothing
    dependency_tests: []
    instructions: ''
    test_scope: test_UAT_AC2117 or test_UAT_AC2118 or test_UAT_AC2119 or test_UAT_AC2120
      or test_UAT_AC2121 or test_UAT_AC2122 or test_UAT_AC2123 or test_UAT_AC2126
      or test_UAT_AC2127 or test_UAT_AC2128 or test_UAT_AC2129 or test_UAT_AC2130
      or test_UAT_AC2131
  batches_pending: false
---

{
  "items": [
    {
      "index": 0,
      "tests": [
        "a path prefix selects one held business test_UAT_AC2117_prefix_selects_held_business_and_two_businesses_never_see_each_others_sites",
        "a named business the caller does not hold test_UAT_AC2118_unheld_target_is_refused_403_uniformly_and_never_substituted",
        "a named business whose grant lapsed test_UAT_AC2119_lapsed_named_target_refused_and_logged_no_entitlement",
        "a request with no target test_UAT_AC2120_no_target_operates_first_selectable_business_never_the_platform",
        "the platform admin bypass test_UAT_AC2121_admin_operates_any_live_business_but_not_lapsed_unknown_or_deactivated",
        "a deactivated business test_UAT_AC2122_deactivated_business_leaves_selectable_set_and_is_refused_403",
        "the loopback dev-open path test_UAT_AC2123_dev_open_operates_platform_business_and_ignores_named_target",
        "a preview sub-resource keeps its business test_UAT_AC2126_preview_asset_is_served_from_the_same_business_as_its_page",
        "chat hosts are per business within one isolate test_UAT_AC2127_two_businesses_get_separate_chat_hosts_and_failed_builds_are_not_cached",
        "a session resumed after membership expiry test_UAT_AC2128_resumed_session_after_membership_expiry_is_refused_not_answered_from_warm_host",
        "an admitted account with nothing selectable keeps its chrome test_UAT_AC2129_chrome_and_businesses_listing_answer_200_with_every_business_unselectable",
        "a business-scoped route with nothing selectable test_UAT_AC2130_business_scoped_routes_answer_403_no_business_message_logged_no_entitlement",
        "the operator keeps the existing 1stcontact business test_UAT_AC2131_operator_resolves_to_1stcontact_after_migration_and_rerun_changes_nothing"
      ],
      "dependency_tests": [],
      "instructions": "",
      "test_scope": "test_UAT_AC2117 or test_UAT_AC2118 or test_UAT_AC2119 or test_UAT_AC2120 or test_UAT_AC2121 or test_UAT_AC2122 or test_UAT_AC2123 or test_UAT_AC2126 or test_UAT_AC2127 or test_UAT_AC2128 or test_UAT_AC2129 or test_UAT_AC2130 or test_UAT_AC2131"
    }
  ]
}