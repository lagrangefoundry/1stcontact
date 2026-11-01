---
uid: report-c300c124
id: REPORT-7875
type: report
title: 'Regression success: 9 caught (reconciliation)'
created_by: xgd
created_at: '2026-11-01T23:05:41.710424+00:00'
updated_at: '2026-11-01T23:07:40.596549+00:00'
completed_at: null
last_field_updated: body
fields:
  report_kind: regression_success
  subject_uid: bundle-39edf66d
  cycle: reconciliation
  intent_uid: bundle-39edf66d
  regression_count: 9
  dropped_scope_members: []
  left_for_regression: []
  aligned_to_running_code: []
---

The reconciliation cycle for bundle-39edf66d caught 9 regressions in the Business Fulfilment acceptance criteria (AC-2149 to AC-2158) after REQ-185 split `platform_admin` into ownership and `platform_operator`, which orphaned these criteria. All nine are resolved, and the most serious were the authorization and non-disclosure guarantees on `POST /api/admin/businesses` (one critical, five high, three medium).

[
  {
    "id": "reg-001",
    "capability_uid": "capability-e5939ceb",
    "capability_name": "Accounts, Membership & Entitlement: Who Exists, What They Own, And When Access Ends",
    "story_uid": "story-387c9dfe",
    "ac_uid": "acceptance_criterion-0dc30744",
    "ac_human_id": "AC-2158",
    "ac_summary": "The platform_operator column is read in exactly one place, scope entry, and a second read fails the build",
    "failing_uats": [
      "Business Fulfilment — the gate is not a generic admin surface test_UAT_AC2158_platform_admin_is_read_only_by_scope_entry_and_the_fulfilment_gate"
    ],
    "fix_plan_summary": "{\n  \"items\": [\n    {\n      \"index\": 0,\n      \"tests\": [\n        \"AC-2149 (orphaned acceptance criterion)\",\n        \"AC-2158 (orphaned acceptance criterion)\",\n        \"AC-2150 (orphaned acceptance criterion)\",\n        \"AC-2152 (orphaned acceptance criterion)\",\n        \"AC-2153 (orphaned acceptance criterion)\",\n        \"AC-2154 (orphaned acceptance criterion)\",\n        \"AC-2155 (orphaned acceptance criterion)\",\n        \"AC-2156 (orphaned acceptance criterion)\",\n        \"AC-2157 (orphaned acceptanc",
    "resolved": true,
    "description": "The build guard that stops anything other than scope entry from reading the privileged operator column was no longer in force, so new code could read the hosting flag as an ownership or admin check without the build catching it.",
    "severity": "high"
  },
  {
    "id": "reg-002",
    "capability_uid": "capability-e5939ceb",
    "capability_name": "Accounts, Membership & Entitlement: Who Exists, What They Own, And When Access Ends",
    "story_uid": "story-387c9dfe",
    "ac_uid": "acceptance_criterion-504bbd4c",
    "ac_human_id": "AC-2149",
    "ac_summary": "A caller who is not an owner of the 1st Contact business who asks to add a business gets 404 and no business is created",
    "failing_uats": [
      "Business Fulfilment — the operator adds a business, nobody else can test_UAT_AC2149_admitted_customer_without_privilege_gets_404_and_nothing_is_created"
    ],
    "fix_plan_summary": "{\n  \"items\": [\n    {\n      \"index\": 0,\n      \"tests\": [\n        \"AC-2149 (orphaned acceptance criterion)\",\n        \"AC-2158 (orphaned acceptance criterion)\",\n        \"AC-2150 (orphaned acceptance criterion)\",\n        \"AC-2152 (orphaned acceptance criterion)\",\n        \"AC-2153 (orphaned acceptance criterion)\",\n        \"AC-2154 (orphaned acceptance criterion)\",\n        \"AC-2155 (orphaned acceptance criterion)\",\n        \"AC-2156 (orphaned acceptance criterion)\",\n        \"AC-2157 (orphaned acceptanc",
    "resolved": true,
    "description": "A signed-in customer who does not own the 1st Contact business was no longer reliably refused with 404 when trying to add a business, which risked letting a customer create businesses with free live pro grants.",
    "severity": "critical"
  },
  {
    "id": "reg-003",
    "capability_uid": "capability-e5939ceb",
    "capability_name": "Accounts, Membership & Entitlement: Who Exists, What They Own, And When Access Ends",
    "story_uid": "story-387c9dfe",
    "ac_uid": "acceptance_criterion-e6d7c451",
    "ac_human_id": "AC-2150",
    "ac_summary": "The refusal of add-a-business reveals nothing: body is 'Not found.' and names neither admin nor business",
    "failing_uats": [
      "Business Fulfilment — the operator adds a business, nobody else can test_UAT_AC2150_refusal_body_is_not_found_and_names_neither_admin_nor_business"
    ],
    "fix_plan_summary": "{\n  \"items\": [\n    {\n      \"index\": 0,\n      \"tests\": [\n        \"AC-2149 (orphaned acceptance criterion)\",\n        \"AC-2158 (orphaned acceptance criterion)\",\n        \"AC-2150 (orphaned acceptance criterion)\",\n        \"AC-2152 (orphaned acceptance criterion)\",\n        \"AC-2153 (orphaned acceptance criterion)\",\n        \"AC-2154 (orphaned acceptance criterion)\",\n        \"AC-2155 (orphaned acceptance criterion)\",\n        \"AC-2156 (orphaned acceptance criterion)\",\n        \"AC-2157 (orphaned acceptanc",
    "resolved": true,
    "description": "Nothing still proved that refusing an unprivileged add-a-business request shows only 'Not found.', so the response could reveal that an admin fulfilment surface exists.",
    "severity": "high"
  },
  {
    "id": "reg-004",
    "capability_uid": "capability-e5939ceb",
    "capability_name": "Accounts, Membership & Entitlement: Who Exists, What They Own, And When Access Ends",
    "story_uid": "story-387c9dfe",
    "ac_uid": "acceptance_criterion-4aa71bb2",
    "ac_human_id": "AC-2152",
    "ac_summary": "The operator adds a business to an existing account and it is immediately selectable for that account's owner",
    "failing_uats": [
      "Business Fulfilment — the operator adds a business, nobody else can test_UAT_AC2152_operator_adds_a_business_and_it_is_immediately_selectable"
    ],
    "fix_plan_summary": "{\n  \"items\": [\n    {\n      \"index\": 0,\n      \"tests\": [\n        \"AC-2149 (orphaned acceptance criterion)\",\n        \"AC-2158 (orphaned acceptance criterion)\",\n        \"AC-2150 (orphaned acceptance criterion)\",\n        \"AC-2152 (orphaned acceptance criterion)\",\n        \"AC-2153 (orphaned acceptance criterion)\",\n        \"AC-2154 (orphaned acceptance criterion)\",\n        \"AC-2155 (orphaned acceptance criterion)\",\n        \"AC-2156 (orphaned acceptance criterion)\",\n        \"AC-2157 (orphaned acceptanc",
    "resolved": true,
    "description": "The 1st Contact owner could no longer be shown to add a business to an existing customer account that then appears straight away as selectable in that customer's business switcher.",
    "severity": "high"
  },
  {
    "id": "reg-005",
    "capability_uid": "capability-e5939ceb",
    "capability_name": "Accounts, Membership & Entitlement: Who Exists, What They Own, And When Access Ends",
    "story_uid": "story-387c9dfe",
    "ac_uid": "acceptance_criterion-aa306f12",
    "ac_human_id": "AC-2153",
    "ac_summary": "Adding a business creates the whole business in one operation: active business, owner membership, live grant attributed to the operator, and a starter site",
    "failing_uats": [
      "Business Fulfilment — the operator adds a business, nobody else can test_UAT_AC2153_adding_a_business_creates_all_four_parts_in_one_operation"
    ],
    "fix_plan_summary": "{\n  \"items\": [\n    {\n      \"index\": 0,\n      \"tests\": [\n        \"AC-2149 (orphaned acceptance criterion)\",\n        \"AC-2158 (orphaned acceptance criterion)\",\n        \"AC-2150 (orphaned acceptance criterion)\",\n        \"AC-2152 (orphaned acceptance criterion)\",\n        \"AC-2153 (orphaned acceptance criterion)\",\n        \"AC-2154 (orphaned acceptance criterion)\",\n        \"AC-2155 (orphaned acceptance criterion)\",\n        \"AC-2156 (orphaned acceptance criterion)\",\n        \"AC-2157 (orphaned acceptanc",
    "resolved": true,
    "description": "Adding a business was no longer verified to create all four parts together (an active business, an owner membership, a live grant credited to the operator, and a starter site), so a customer could end up with a half-provisioned business.",
    "severity": "high"
  },
  {
    "id": "reg-006",
    "capability_uid": "capability-e5939ceb",
    "capability_name": "Accounts, Membership & Entitlement: Who Exists, What They Own, And When Access Ends",
    "story_uid": "story-387c9dfe",
    "ac_uid": "acceptance_criterion-0fbe6d15",
    "ac_human_id": "AC-2154",
    "ac_summary": "An account's first business is provisioned after the invite, and the account is then admitted with exactly that one business",
    "failing_uats": [
      "Business Fulfilment — the operator adds a business, nobody else can test_UAT_AC2154_creating_an_account_provisions_its_first_business"
    ],
    "fix_plan_summary": "{\n  \"items\": [\n    {\n      \"index\": 0,\n      \"tests\": [\n        \"AC-2149 (orphaned acceptance criterion)\",\n        \"AC-2158 (orphaned acceptance criterion)\",\n        \"AC-2150 (orphaned acceptance criterion)\",\n        \"AC-2152 (orphaned acceptance criterion)\",\n        \"AC-2153 (orphaned acceptance criterion)\",\n        \"AC-2154 (orphaned acceptance criterion)\",\n        \"AC-2155 (orphaned acceptance criterion)\",\n        \"AC-2156 (orphaned acceptance criterion)\",\n        \"AC-2157 (orphaned acceptanc",
    "resolved": true,
    "description": "A newly invited customer given their first business was no longer shown to sign in and land in exactly that one business.",
    "severity": "high"
  },
  {
    "id": "reg-007",
    "capability_uid": "capability-e5939ceb",
    "capability_name": "Accounts, Membership & Entitlement: Who Exists, What They Own, And When Access Ends",
    "story_uid": "story-387c9dfe",
    "ac_uid": "acceptance_criterion-2ec54b32",
    "ac_human_id": "AC-2155",
    "ac_summary": "Operator adding a business for an unknown email gets 404 with 'No account with that email address.'",
    "failing_uats": [
      "Business Fulfilment — the operator adds a business, nobody else can test_UAT_AC2155_unknown_account_email_is_reported_plainly_with_404"
    ],
    "fix_plan_summary": "{\n  \"items\": [\n    {\n      \"index\": 0,\n      \"tests\": [\n        \"AC-2149 (orphaned acceptance criterion)\",\n        \"AC-2158 (orphaned acceptance criterion)\",\n        \"AC-2150 (orphaned acceptance criterion)\",\n        \"AC-2152 (orphaned acceptance criterion)\",\n        \"AC-2153 (orphaned acceptance criterion)\",\n        \"AC-2154 (orphaned acceptance criterion)\",\n        \"AC-2155 (orphaned acceptance criterion)\",\n        \"AC-2156 (orphaned acceptance criterion)\",\n        \"AC-2157 (orphaned acceptanc",
    "resolved": true,
    "description": "When the operator tried to add a business for an email address with no account, nothing still guaranteed the plain 404 'No account with that email address.' message.",
    "severity": "medium"
  },
  {
    "id": "reg-008",
    "capability_uid": "capability-e5939ceb",
    "capability_name": "Accounts, Membership & Entitlement: Who Exists, What They Own, And When Access Ends",
    "story_uid": "story-387c9dfe",
    "ac_uid": "acceptance_criterion-d9fd433f",
    "ac_human_id": "AC-2156",
    "ac_summary": "Operator add-a-business with a missing or blank account email or name is rejected with 400",
    "failing_uats": [
      "Business Fulfilment — the operator adds a business, nobody else can test_UAT_AC2156_missing_or_blank_account_email_or_name_is_rejected_with_400"
    ],
    "fix_plan_summary": "{\n  \"items\": [\n    {\n      \"index\": 0,\n      \"tests\": [\n        \"AC-2149 (orphaned acceptance criterion)\",\n        \"AC-2158 (orphaned acceptance criterion)\",\n        \"AC-2150 (orphaned acceptance criterion)\",\n        \"AC-2152 (orphaned acceptance criterion)\",\n        \"AC-2153 (orphaned acceptance criterion)\",\n        \"AC-2154 (orphaned acceptance criterion)\",\n        \"AC-2155 (orphaned acceptance criterion)\",\n        \"AC-2156 (orphaned acceptance criterion)\",\n        \"AC-2157 (orphaned acceptanc",
    "resolved": true,
    "description": "An add-a-business request with a missing or blank email or business name was no longer shown to be rejected with a clear 400 rather than failing as a server error.",
    "severity": "medium"
  },
  {
    "id": "reg-009",
    "capability_uid": "capability-e5939ceb",
    "capability_name": "Accounts, Membership & Entitlement: Who Exists, What They Own, And When Access Ends",
    "story_uid": "story-387c9dfe",
    "ac_uid": "acceptance_criterion-be56b74c",
    "ac_human_id": "AC-2157",
    "ac_summary": "The businesses payload the browser reads carries exactly 'account' and 'businesses' and offers no self-serve creation contract",
    "failing_uats": [
      "Business Fulfilment — the operator adds a business, nobody else can test_UAT_AC2157_businesses_payload_carries_exactly_account_and_businesses"
    ],
    "fix_plan_summary": "{\n  \"items\": [\n    {\n      \"index\": 0,\n      \"tests\": [\n        \"AC-2149 (orphaned acceptance criterion)\",\n        \"AC-2158 (orphaned acceptance criterion)\",\n        \"AC-2150 (orphaned acceptance criterion)\",\n        \"AC-2152 (orphaned acceptance criterion)\",\n        \"AC-2153 (orphaned acceptance criterion)\",\n        \"AC-2154 (orphaned acceptance criterion)\",\n        \"AC-2155 (orphaned acceptance criterion)\",\n        \"AC-2156 (orphaned acceptance criterion)\",\n        \"AC-2157 (orphaned acceptanc",
    "resolved": true,
    "description": "The businesses data the builder loads was no longer pinned to just the account and its businesses, so it could pick up a self-serve 'add a business' contract that customers must not have before billing exists.",
    "severity": "medium"
  }
]
