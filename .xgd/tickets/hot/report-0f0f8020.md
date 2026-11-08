---
uid: report-0f0f8020
id: REPORT-11212
type: report
title: 'Regression success: 18 caught (reconciliation)'
created_by: xgd
created_at: '2026-11-08T01:07:58.352962+00:00'
updated_at: '2026-11-08T01:12:25.436314+00:00'
completed_at: null
last_field_updated: body
fields:
  report_kind: regression_success
  subject_uid: bundle-7988e925
  cycle: reconciliation
  intent_uid: bundle-7988e925
  regression_count: 18
  dropped_scope_members: []
  left_for_regression: []
  aligned_to_running_code:
  - subject_uid: report-05835b4c
    batch_index: 0
    acs:
    - AC-2208
    reason: AC-2208 asks that a pipeline-stage migration backfill existing contacts
      by their invite stamp; the REQ-190 rebaseline folded every prior migration into
      0001_baseline.sql with pipeline_stage as a baseline column, and the bundle states
      the database was wiped rather than migrated, so no intent in scope requires
      a backfill and the reference has none to test.
    intent_ticket: bundle-7988e925
    intent_sentence: There is no separate migration, because the database has been
      wiped rather than migrated and a baseline that has never been applied is not
      re-based by editing it.
    reference_ref: reconcile-src-BUNDLE-38
    tip_evidence:
    - db/migrations/0001_baseline.sql:419-449
    - apps/control-app/src/identity.ts:1228-1260
---

This reconciliation run caught and resolved 18 regressions in BUNDLE-38: 11 in the operator terms-of-service gate (AC-2132–AC-2142) and 7 in the contact pipeline/membership axes (AC-2203–AC-2210), most likely from REQ-203's change to `admit` and the terms gate. All 18 share one fix plan, which traced the failures to the identity UAT files failing to collect or crashing their workerd isolate, not failing an assertion; severities rate the behavior each UAT guards, led by the critical AC-2133 refusal of API and asset requests from people who have not accepted the terms.

[
  {
    "id": "reg-001",
    "capability_uid": "capability-3606e35b",
    "capability_name": "Operator Access Gate: Who May Reach The Builder",
    "story_uid": "story-0cd18650",
    "ac_uid": "acceptance_criterion-eb9e7c36",
    "ac_human_id": "AC-2132",
    "ac_summary": "An unaccepted admitted person's page navigation is answered with the terms and an accept control at the requested URL",
    "failing_uats": [
      "Terms of service gate \u2014 before acceptance test_UAT_AC2132_unaccepted_navigation_is_answered_with_terms_at_requested_url"
    ],
    "fix_plan_summary": "# Fix Plan \u2014 Iteration 6\n\n## Hypothesis\nAC-2254's only UAT lives in `tests/reconciliation-identity-accounts.workers.test.ts`, and that file contributes no results to the scoped run. Every one of its tests is missing from the report, while the suite exits 1 with 0 failed tests. So the file fails at collection, or crashes its workerd isolate, rather than failing an assertion. The likeliest cause is the module-level eager `import.meta.glob(['../apps/**','../packages/**','../tools/**'], {query:'?raw",
    "resolved": true,
    "description": "A signed-in person who had not yet accepted the terms was not reliably shown the terms page with an agree control at the page they asked for, so they could not start signing up.",
    "severity": "high"
  },
  {
    "id": "reg-002",
    "capability_uid": "capability-3606e35b",
    "capability_name": "Operator Access Gate: Who May Reach The Builder",
    "story_uid": "story-0cd18650",
    "ac_uid": "acceptance_criterion-917809a8",
    "ac_human_id": "AC-2133",
    "ac_summary": "An unaccepted admitted person's non-navigation requests (assets, scripts, API) are refused 403 plain text",
    "failing_uats": [
      "Terms of service gate \u2014 before acceptance test_UAT_AC2133_unaccepted_non_navigation_requests_are_refused_403_plain_text"
    ],
    "fix_plan_summary": "# Fix Plan \u2014 Iteration 6\n\n## Hypothesis\nAC-2254's only UAT lives in `tests/reconciliation-identity-accounts.workers.test.ts`, and that file contributes no results to the scoped run. Every one of its tests is missing from the report, while the suite exits 1 with 0 failed tests. So the file fails at collection, or crashes its workerd isolate, rather than failing an assertion. The likeliest cause is the module-level eager `import.meta.glob(['../apps/**','../packages/**','../tools/**'], {query:'?raw",
    "resolved": true,
    "description": "Assets, scripts and API calls from a person who had not accepted the terms were not reliably refused with a plain-text 403, so an unaccepted session could reach the builder's data.",
    "severity": "critical"
  },
  {
    "id": "reg-003",
    "capability_uid": "capability-3606e35b",
    "capability_name": "Operator Access Gate: Who May Reach The Builder",
    "story_uid": "story-0cd18650",
    "ac_uid": "acceptance_criterion-09312ccb",
    "ac_human_id": "AC-2134",
    "ac_summary": "Terms gate responses are not cacheable and not indexable",
    "failing_uats": [
      "Terms of service gate \u2014 before acceptance test_UAT_AC2134_terms_gate_responses_are_not_cacheable_and_not_indexable"
    ],
    "fix_plan_summary": "# Fix Plan \u2014 Iteration 6\n\n## Hypothesis\nAC-2254's only UAT lives in `tests/reconciliation-identity-accounts.workers.test.ts`, and that file contributes no results to the scoped run. Every one of its tests is missing from the report, while the suite exits 1 with 0 failed tests. So the file fails at collection, or crashes its workerd isolate, rather than failing an assertion. The likeliest cause is the module-level eager `import.meta.glob(['../apps/**','../packages/**','../tools/**'], {query:'?raw",
    "resolved": true,
    "description": "Terms-gate responses could be cached or indexed, so a shared cache or search engine could hold the interstitial in place of the real page.",
    "severity": "medium"
  },
  {
    "id": "reg-004",
    "capability_uid": "capability-3606e35b",
    "capability_name": "Operator Access Gate: Who May Reach The Builder",
    "story_uid": "story-0cd18650",
    "ac_uid": "acceptance_criterion-d63d7ff2",
    "ac_human_id": "AC-2139",
    "ac_summary": "The terms page renders every paragraph of the terms text and references no external resource",
    "failing_uats": [
      "Terms of service gate \u2014 before acceptance test_UAT_AC2139_terms_page_renders_every_paragraph_and_references_nothing_external"
    ],
    "fix_plan_summary": "# Fix Plan \u2014 Iteration 6\n\n## Hypothesis\nAC-2254's only UAT lives in `tests/reconciliation-identity-accounts.workers.test.ts`, and that file contributes no results to the scoped run. Every one of its tests is missing from the report, while the suite exits 1 with 0 failed tests. So the file fails at collection, or crashes its workerd isolate, rather than failing an assertion. The likeliest cause is the module-level eager `import.meta.glob(['../apps/**','../packages/**','../tools/**'], {query:'?raw",
    "resolved": true,
    "description": "The terms page was not proven to show every paragraph of the terms text with no external resources, so a person might agree to text they could not fully see.",
    "severity": "medium"
  },
  {
    "id": "reg-005",
    "capability_uid": "capability-3606e35b",
    "capability_name": "Operator Access Gate: Who May Reach The Builder",
    "story_uid": "story-0cd18650",
    "ac_uid": "acceptance_criterion-672b19e8",
    "ac_human_id": "AC-2141",
    "ac_summary": "The terms page offers only an agree control and declining records nothing",
    "failing_uats": [
      "Terms of service gate \u2014 before acceptance test_UAT_AC2141_terms_page_offers_only_an_agree_control_and_declining_records_nothing"
    ],
    "fix_plan_summary": "# Fix Plan \u2014 Iteration 6\n\n## Hypothesis\nAC-2254's only UAT lives in `tests/reconciliation-identity-accounts.workers.test.ts`, and that file contributes no results to the scoped run. Every one of its tests is missing from the report, while the suite exits 1 with 0 failed tests. So the file fails at collection, or crashes its workerd isolate, rather than failing an assertion. The likeliest cause is the module-level eager `import.meta.glob(['../apps/**','../packages/**','../tools/**'], {query:'?raw",
    "resolved": true,
    "description": "The terms page was not proven to offer only an agree control, or to record nothing when someone declined, so a non-acceptance could be stored as consent.",
    "severity": "medium"
  },
  {
    "id": "reg-006",
    "capability_uid": "capability-3606e35b",
    "capability_name": "Operator Access Gate: Who May Reach The Builder",
    "story_uid": "story-0cd18650",
    "ac_uid": "acceptance_criterion-5f0ef9a0",
    "ac_human_id": "AC-2135",
    "ac_summary": "Accepting the terms as JSON records the current version and the acceptance time",
    "failing_uats": [
      "Terms of service gate \u2014 acceptance test_UAT_AC2135_accepting_as_json_records_current_version_and_acceptance_time"
    ],
    "fix_plan_summary": "# Fix Plan \u2014 Iteration 6\n\n## Hypothesis\nAC-2254's only UAT lives in `tests/reconciliation-identity-accounts.workers.test.ts`, and that file contributes no results to the scoped run. Every one of its tests is missing from the report, while the suite exits 1 with 0 failed tests. So the file fails at collection, or crashes its workerd isolate, rather than failing an assertion. The likeliest cause is the module-level eager `import.meta.glob(['../apps/**','../packages/**','../tools/**'], {query:'?raw",
    "resolved": true,
    "description": "Accepting the terms was not reliably recorded with the current version and time, so a person who agreed could stay stuck at the gate.",
    "severity": "high"
  },
  {
    "id": "reg-007",
    "capability_uid": "capability-3606e35b",
    "capability_name": "Operator Access Gate: Who May Reach The Builder",
    "story_uid": "story-0cd18650",
    "ac_uid": "acceptance_criterion-10a2bf0f",
    "ac_human_id": "AC-2136",
    "ac_summary": "Acceptance not posted as JSON is refused 415 (non-POST 405) and leaves the record untouched",
    "failing_uats": [
      "Terms of service gate \u2014 acceptance test_UAT_AC2136_acceptance_not_posted_as_json_is_refused_and_leaves_record_untouched"
    ],
    "fix_plan_summary": "# Fix Plan \u2014 Iteration 6\n\n## Hypothesis\nAC-2254's only UAT lives in `tests/reconciliation-identity-accounts.workers.test.ts`, and that file contributes no results to the scoped run. Every one of its tests is missing from the report, while the suite exits 1 with 0 failed tests. So the file fails at collection, or crashes its workerd isolate, rather than failing an assertion. The likeliest cause is the module-level eager `import.meta.glob(['../apps/**','../packages/**','../tools/**'], {query:'?raw",
    "resolved": true,
    "description": "An acceptance not posted as JSON (or not posted at all) was not reliably refused with 415/405, so a cross-site form post could record consent the person never gave.",
    "severity": "medium"
  },
  {
    "id": "reg-008",
    "capability_uid": "capability-3606e35b",
    "capability_name": "Operator Access Gate: Who May Reach The Builder",
    "story_uid": "story-0cd18650",
    "ac_uid": "acceptance_criterion-23a5de57",
    "ac_human_id": "AC-2137",
    "ac_summary": "After acceptance the same URLs answer normally",
    "failing_uats": [
      "Terms of service gate \u2014 acceptance test_UAT_AC2137_after_acceptance_the_same_urls_answer_normally"
    ],
    "fix_plan_summary": "# Fix Plan \u2014 Iteration 6\n\n## Hypothesis\nAC-2254's only UAT lives in `tests/reconciliation-identity-accounts.workers.test.ts`, and that file contributes no results to the scoped run. Every one of its tests is missing from the report, while the suite exits 1 with 0 failed tests. So the file fails at collection, or crashes its workerd isolate, rather than failing an assertion. The likeliest cause is the module-level eager `import.meta.glob(['../apps/**','../packages/**','../tools/**'], {query:'?raw",
    "resolved": true,
    "description": "After accepting the terms, the same builder URLs did not reliably answer normally, so a new member could stay locked out of the builder.",
    "severity": "high"
  },
  {
    "id": "reg-009",
    "capability_uid": "capability-3606e35b",
    "capability_name": "Operator Access Gate: Who May Reach The Builder",
    "story_uid": "story-0cd18650",
    "ac_uid": "acceptance_criterion-e752b49d",
    "ac_human_id": "AC-2140",
    "ac_summary": "GET /terms stays readable for any admitted person and shows the acceptance date once accepted",
    "failing_uats": [
      "Terms of service gate \u2014 acceptance test_UAT_AC2140_terms_path_stays_readable_and_shows_acceptance_date_once_accepted"
    ],
    "fix_plan_summary": "# Fix Plan \u2014 Iteration 6\n\n## Hypothesis\nAC-2254's only UAT lives in `tests/reconciliation-identity-accounts.workers.test.ts`, and that file contributes no results to the scoped run. Every one of its tests is missing from the report, while the suite exits 1 with 0 failed tests. So the file fails at collection, or crashes its workerd isolate, rather than failing an assertion. The likeliest cause is the module-level eager `import.meta.glob(['../apps/**','../packages/**','../tools/**'], {query:'?raw",
    "resolved": true,
    "description": "GET /terms was not reliably readable by every admitted person or did not show the acceptance date, so members could not re-read what they agreed to.",
    "severity": "low"
  },
  {
    "id": "reg-010",
    "capability_uid": "capability-3606e35b",
    "capability_name": "Operator Access Gate: Who May Reach The Builder",
    "story_uid": "story-0cd18650",
    "ac_uid": "acceptance_criterion-3e7131f9",
    "ac_human_id": "AC-2138",
    "ac_summary": "Changing the current terms version re-prompts a person who accepted an earlier version",
    "failing_uats": [
      "Terms of service gate \u2014 versions and configuration test_UAT_AC2138_changing_the_current_version_re_prompts_an_earlier_acceptor"
    ],
    "fix_plan_summary": "# Fix Plan \u2014 Iteration 6\n\n## Hypothesis\nAC-2254's only UAT lives in `tests/reconciliation-identity-accounts.workers.test.ts`, and that file contributes no results to the scoped run. Every one of its tests is missing from the report, while the suite exits 1 with 0 failed tests. So the file fails at collection, or crashes its workerd isolate, rather than failing an assertion. The likeliest cause is the module-level eager `import.meta.glob(['../apps/**','../packages/**','../tools/**'], {query:'?raw",
    "resolved": true,
    "description": "Bumping the terms version did not reliably re-prompt people who had accepted an earlier version, so existing members could keep working under terms they never saw.",
    "severity": "high"
  },
  {
    "id": "reg-011",
    "capability_uid": "capability-3606e35b",
    "capability_name": "Operator Access Gate: Who May Reach The Builder",
    "story_uid": "story-0cd18650",
    "ac_uid": "acceptance_criterion-bd353683",
    "ac_human_id": "AC-2142",
    "ac_summary": "Loopback dev-open mode serves the builder without a terms check",
    "failing_uats": [
      "Terms of service gate \u2014 versions and configuration test_UAT_AC2142_loopback_dev_open_serves_the_builder_without_a_terms_check"
    ],
    "fix_plan_summary": "# Fix Plan \u2014 Iteration 6\n\n## Hypothesis\nAC-2254's only UAT lives in `tests/reconciliation-identity-accounts.workers.test.ts`, and that file contributes no results to the scoped run. Every one of its tests is missing from the report, while the suite exits 1 with 0 failed tests. So the file fails at collection, or crashes its workerd isolate, rather than failing an assertion. The likeliest cause is the module-level eager `import.meta.glob(['../apps/**','../packages/**','../tools/**'], {query:'?raw",
    "resolved": true,
    "description": "Loopback dev-open mode was not reliably serving the builder without the terms check, which blocks local development but no deployed user.",
    "severity": "low"
  },
  {
    "id": "reg-012",
    "capability_uid": "capability-e5939ceb",
    "capability_name": "Accounts, Membership & Entitlement: Who Exists, What They Own, And When Access Ends",
    "story_uid": "story-0ea74f39",
    "ac_uid": "acceptance_criterion-afb19a07",
    "ac_human_id": "AC-2203",
    "ac_summary": "A contact is a Member if and only if they have accepted the terms, whatever else is true of them",
    "failing_uats": [
      "story-0ea74f39 \u2014 two axes at the origin test_UAT_AC2203_member_if_and_only_if_terms_accepted"
    ],
    "fix_plan_summary": "# Fix Plan \u2014 Iteration 6\n\n## Hypothesis\nAC-2254's only UAT lives in `tests/reconciliation-identity-accounts.workers.test.ts`, and that file contributes no results to the scoped run. Every one of its tests is missing from the report, while the suite exits 1 with 0 failed tests. So the file fails at collection, or crashes its workerd isolate, rather than failing an assertion. The likeliest cause is the module-level eager `import.meta.glob(['../apps/**','../packages/**','../tools/**'], {query:'?raw",
    "resolved": true,
    "description": "Member status was not reliably tied to terms acceptance alone, so a contact could show as a Member without signing up, or as not a Member after signing up.",
    "severity": "high"
  },
  {
    "id": "reg-013",
    "capability_uid": "capability-e5939ceb",
    "capability_name": "Accounts, Membership & Entitlement: Who Exists, What They Own, And When Access Ends",
    "story_uid": "story-0ea74f39",
    "ac_uid": "acceptance_criterion-38175962",
    "ac_human_id": "AC-2204",
    "ac_summary": "A contact begins at pipeline stage Lead",
    "failing_uats": [
      "story-0ea74f39 \u2014 two axes at the origin test_UAT_AC2204_contact_begins_at_lead"
    ],
    "fix_plan_summary": "# Fix Plan \u2014 Iteration 6\n\n## Hypothesis\nAC-2254's only UAT lives in `tests/reconciliation-identity-accounts.workers.test.ts`, and that file contributes no results to the scoped run. Every one of its tests is missing from the report, while the suite exits 1 with 0 failed tests. So the file fails at collection, or crashes its workerd isolate, rather than failing an assertion. The likeliest cause is the module-level eager `import.meta.glob(['../apps/**','../packages/**','../tools/**'], {query:'?raw",
    "resolved": true,
    "description": "A new contact did not reliably start at pipeline stage Lead, so the Contacts tab could put freshly added contacts in the wrong stage.",
    "severity": "medium"
  },
  {
    "id": "reg-014",
    "capability_uid": "capability-e5939ceb",
    "capability_name": "Accounts, Membership & Entitlement: Who Exists, What They Own, And When Access Ends",
    "story_uid": "story-0ea74f39",
    "ac_uid": "acceptance_criterion-6c4e16be",
    "ac_human_id": "AC-2205",
    "ac_summary": "A sent or provider-failed invite moves the contact to Invited and never to Member; a contact refused for having no address is not moved; re-inviting keeps the original invite time",
    "failing_uats": [
      "story-0ea74f39 \u2014 two axes at the origin test_UAT_AC2205_invite_moves_to_invited_never_member_and_keeps_first_stamp"
    ],
    "fix_plan_summary": "# Fix Plan \u2014 Iteration 6\n\n## Hypothesis\nAC-2254's only UAT lives in `tests/reconciliation-identity-accounts.workers.test.ts`, and that file contributes no results to the scoped run. Every one of its tests is missing from the report, while the suite exits 1 with 0 failed tests. So the file fails at collection, or crashes its workerd isolate, rather than failing an assertion. The likeliest cause is the module-level eager `import.meta.glob(['../apps/**','../packages/**','../tools/**'], {query:'?raw",
    "resolved": true,
    "description": "Inviting a contact did not reliably move them to Invited without making them a Member, skip contacts refused for having no address, and keep the first invite time, so the pipeline could misreport who was invited.",
    "severity": "medium"
  },
  {
    "id": "reg-015",
    "capability_uid": "capability-e5939ceb",
    "capability_name": "Accounts, Membership & Entitlement: Who Exists, What They Own, And When Access Ends",
    "story_uid": "story-0ea74f39",
    "ac_uid": "acceptance_criterion-7593b246",
    "ac_human_id": "AC-2206",
    "ac_summary": "Accepting the terms makes a contact a Member without operator action and without changing their pipeline stage",
    "failing_uats": [
      "story-0ea74f39 \u2014 two axes at the origin test_UAT_AC2206_accepting_terms_makes_member_and_keeps_stage"
    ],
    "fix_plan_summary": "# Fix Plan \u2014 Iteration 6\n\n## Hypothesis\nAC-2254's only UAT lives in `tests/reconciliation-identity-accounts.workers.test.ts`, and that file contributes no results to the scoped run. Every one of its tests is missing from the report, while the suite exits 1 with 0 failed tests. So the file fails at collection, or crashes its workerd isolate, rather than failing an assertion. The likeliest cause is the module-level eager `import.meta.glob(['../apps/**','../packages/**','../tools/**'], {query:'?raw",
    "resolved": true,
    "description": "Accepting the terms did not reliably make a contact a Member on their own action while leaving their pipeline stage alone, so sign-ups could need an operator step or lose their stage.",
    "severity": "high"
  },
  {
    "id": "reg-016",
    "capability_uid": "capability-e5939ceb",
    "capability_name": "Accounts, Membership & Entitlement: Who Exists, What They Own, And When Access Ends",
    "story_uid": "story-0ea74f39",
    "ac_uid": "acceptance_criterion-0eb30897",
    "ac_human_id": "AC-2207",
    "ac_summary": "The pipeline stage is read from its own stored value, not inferred from timestamps",
    "failing_uats": [
      "story-0ea74f39 \u2014 two axes at the origin test_UAT_AC2207_stage_is_the_stored_value_not_inferred"
    ],
    "fix_plan_summary": "# Fix Plan \u2014 Iteration 6\n\n## Hypothesis\nAC-2254's only UAT lives in `tests/reconciliation-identity-accounts.workers.test.ts`, and that file contributes no results to the scoped run. Every one of its tests is missing from the report, while the suite exits 1 with 0 failed tests. So the file fails at collection, or crashes its workerd isolate, rather than failing an assertion. The likeliest cause is the module-level eager `import.meta.glob(['../apps/**','../packages/**','../tools/**'], {query:'?raw",
    "resolved": true,
    "description": "The pipeline stage was not reliably read from its stored value instead of being inferred from timestamps, so the Contacts tab could show stages that disagree with what was recorded.",
    "severity": "medium"
  },
  {
    "id": "reg-017",
    "capability_uid": "capability-e5939ceb",
    "capability_name": "Accounts, Membership & Entitlement: Who Exists, What They Own, And When Access Ends",
    "story_uid": "story-0ea74f39",
    "ac_uid": "acceptance_criterion-1cd3b11f",
    "ac_human_id": "AC-2208",
    "ac_summary": "A contact written without a stage is stored at Lead, and the seeded platform operator is stored at Invited, agreeing with its invite stamp",
    "failing_uats": [
      "story-0ea74f39 \u2014 the one-time pipeline backfill test_UAT_AC2208_existing_contacts_backfilled_by_invite_stamp_and_operator_seeded_invited"
    ],
    "fix_plan_summary": "# Fix Plan \u2014 Iteration 6\n\n## Hypothesis\nAC-2254's only UAT lives in `tests/reconciliation-identity-accounts.workers.test.ts`, and that file contributes no results to the scoped run. Every one of its tests is missing from the report, while the suite exits 1 with 0 failed tests. So the file fails at collection, or crashes its workerd isolate, rather than failing an assertion. The likeliest cause is the module-level eager `import.meta.glob(['../apps/**','../packages/**','../tools/**'], {query:'?raw",
    "resolved": true,
    "description": "Contacts written without a stage were not reliably stored at Lead, or the seeded operator at Invited; the backfill half was later aligned to running code because the database was wiped, not migrated.",
    "severity": "low"
  },
  {
    "id": "reg-018",
    "capability_uid": "capability-e5939ceb",
    "capability_name": "Accounts, Membership & Entitlement: Who Exists, What They Own, And When Access Ends",
    "story_uid": "story-0ea74f39",
    "ac_uid": "acceptance_criterion-5da4fc8b",
    "ac_human_id": "AC-2210",
    "ac_summary": "Two independent facets \u2014 pipeline stage and access \u2014 narrow the list and combine, so 'invited and never came' and 'signed up and never asked' are askable",
    "failing_uats": [
      "story-0ea74f39 \u2014 the Contacts tab draws two axes test_UAT_AC2210_two_facets_narrow_independently_and_combine"
    ],
    "fix_plan_summary": "# Fix Plan \u2014 Iteration 6\n\n## Hypothesis\nAC-2254's only UAT lives in `tests/reconciliation-identity-accounts.workers.test.ts`, and that file contributes no results to the scoped run. Every one of its tests is missing from the report, while the suite exits 1 with 0 failed tests. So the file fails at collection, or crashes its workerd isolate, rather than failing an assertion. The likeliest cause is the module-level eager `import.meta.glob(['../apps/**','../packages/**','../tools/**'], {query:'?raw",
    "resolved": true,
    "description": "The Contacts tab's pipeline-stage and access filters did not reliably narrow the list on their own and combined, so an operator could not list 'invited and never came' or 'signed up and never asked'.",
    "severity": "low"
  }
]
