---
uid: report-53bc4397
id: REPORT-11431
type: report
title: 'Regression success: 4 caught (reconciliation)'
created_by: xgd
created_at: '2026-11-08T12:20:43.668596+00:00'
updated_at: '2026-11-08T12:23:06.579244+00:00'
completed_at: null
last_field_updated: body
fields:
  report_kind: regression_success
  subject_uid: bundle-c0301347
  cycle: reconciliation
  intent_uid: bundle-c0301347
  regression_count: 4
  dropped_scope_members: []
  left_for_regression: []
  aligned_to_running_code: []
---

During reconciliation of bundle-c0301347, four regressions were caught, all in the AI Site Assistant per-site conversation capability: one high (the site-changing turn stream) and three medium (write announcements, a host-owned change signal, and full priming delivery on the Node host). All four are resolved; by the final fix iteration the scoped quality run passed 244 tests with 0 failures, and the fix touched test files only, not production code.

[
  {
    "id": "reg-001",
    "capability_uid": "capability-7e4714b7",
    "capability_name": "AI Site Assistant: Per-Site Conversations",
    "story_uid": "story-a58a0974",
    "ac_uid": "acceptance_criterion-5df35b3c",
    "ac_human_id": "AC-1054",
    "ac_summary": "A turn that changes the site streams what the assistant did and said, ends in exactly one completion, and the change is in the draft",
    "failing_uats": [
      "a turn that changes the site says so where the change happened test_UAT_AC1054_a_site_changing_turn_streams_activity_a_signal_its_words_and_one_completion"
    ],
    "fix_plan_summary": "# Fix Plan — Iteration 18\n\n## Hypothesis\nNothing fails (scoped quality REPORT-11413: 244 passed, 0 failed); iteration 17's plan fell through only because its instructions named a production file frozen by code_frozen, so this iteration restores the same declined ruling with instructions that name test files only.\n\n## Analysis\n- Failure set for report-d87c1fe2 is empty. The latest scoped quality report (report-7b871496 / REPORT-11413, commit d2c5edb309) passed lint, build and 244 tests with 0 fai",
    "resolved": true,
    "description": "A builder turn that changed the site could stop streaming what the assistant did and said, or fail to end in exactly one completion, so the client could not tell that their draft had changed.",
    "severity": "high"
  },
  {
    "id": "reg-002",
    "capability_uid": "capability-7e4714b7",
    "capability_name": "AI Site Assistant: Per-Site Conversations",
    "story_uid": "story-a58a0974",
    "ac_uid": "acceptance_criterion-a20088ef",
    "ac_human_id": "AC-1817",
    "ac_summary": "A turn's stream announces each write where it happened, and a turn that writes nothing announces nothing",
    "failing_uats": [
      "a turn that changes the site says so where the change happened test_UAT_AC1817_each_write_is_announced_where_it_happened_and_a_turn_that_moves_nothing_is_silent"
    ],
    "fix_plan_summary": "# Fix Plan — Iteration 18\n\n## Hypothesis\nNothing fails (scoped quality REPORT-11413: 244 passed, 0 failed); iteration 17's plan fell through only because its instructions named a production file frozen by code_frozen, so this iteration restores the same declined ruling with instructions that name test files only.\n\n## Analysis\n- Failure set for report-d87c1fe2 is empty. The latest scoped quality report (report-7b871496 / REPORT-11413, commit d2c5edb309) passed lint, build and 244 tests with 0 fai",
    "resolved": true,
    "description": "The chat stream could stop announcing each site write where it happened, or announce writes on a turn that changed nothing, so the client lost an accurate account of what moved.",
    "severity": "medium"
  },
  {
    "id": "reg-003",
    "capability_uid": "capability-7e4714b7",
    "capability_name": "AI Site Assistant: Per-Site Conversations",
    "story_uid": "story-a58a0974",
    "ac_uid": "acceptance_criterion-ac988ebb",
    "ac_human_id": "AC-1818",
    "ac_summary": "The change signal is the host's own, not an operation the assistant may call, skip or fake",
    "failing_uats": [
      "a turn that changes the site says so where the change happened test_UAT_AC1818_the_signal_is_the_hosts_own_and_no_offered_operation_can_make_or_fake_one"
    ],
    "fix_plan_summary": "# Fix Plan — Iteration 18\n\n## Hypothesis\nNothing fails (scoped quality REPORT-11413: 244 passed, 0 failed); iteration 17's plan fell through only because its instructions named a production file frozen by code_frozen, so this iteration restores the same declined ruling with instructions that name test files only.\n\n## Analysis\n- Failure set for report-d87c1fe2 is empty. The latest scoped quality report (report-7b871496 / REPORT-11413, commit d2c5edb309) passed lint, build and 244 tests with 0 fai",
    "resolved": true,
    "description": "The change signal could stop being a host-only record, which would let the assistant claim or fake a site change it never made.",
    "severity": "medium"
  },
  {
    "id": "reg-004",
    "capability_uid": "capability-7e4714b7",
    "capability_name": "AI Site Assistant: Per-Site Conversations",
    "story_uid": "story-3cf3d57b",
    "ac_uid": "acceptance_criterion-078e755f",
    "ac_human_id": "AC-2364",
    "ac_summary": "Every host actually sends the model the system prompt, landscape, purpose, how-to-search and the turn's reminder, whether the system prompt is one string or cache-split blocks",
    "failing_uats": [
      "the Node CLI host sends the model the whole priming test_UAT_AC2364_the_node_host_sends_system_prompt_landscape_purpose_mechanism_and_reminder"
    ],
    "fix_plan_summary": "# Fix Plan — Iteration 18\n\n## Hypothesis\nNothing fails (scoped quality REPORT-11413: 244 passed, 0 failed); iteration 17's plan fell through only because its instructions named a production file frozen by code_frozen, so this iteration restores the same declined ruling with instructions that name test files only.\n\n## Analysis\n- Failure set for report-d87c1fe2 is empty. The latest scoped quality report (report-7b871496 / REPORT-11413, commit d2c5edb309) passed lint, build and 244 tests with 0 fai",
    "resolved": true,
    "description": "The Node CLI host could send the model an incomplete priming (system prompt, landscape, purpose, how-to-search, and the turn reminder), leaving the consultant without its instructions or corpus map.",
    "severity": "medium"
  }
]
