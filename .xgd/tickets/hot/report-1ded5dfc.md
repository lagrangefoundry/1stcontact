---
uid: report-1ded5dfc
id: REPORT-10952
type: report
title: 'Regression success: 51 caught (reconciliation)'
created_by: xgd
created_at: '2026-11-05T19:16:09.997226+00:00'
updated_at: '2026-11-05T19:19:26.931179+00:00'
completed_at: null
last_field_updated: body
fields:
  report_kind: regression_success
  subject_uid: bundle-5052a63c
  cycle: reconciliation
  intent_uid: bundle-5052a63c
  regression_count: 51
  dropped_scope_members: []
  left_for_regression: []
  aligned_to_running_code: []
---

The BUNDLE-37 reconciliation (BUG-55 knowledge-index seam plus the REQ-190..198 opaque-key schema rebaseline) caught 51 regressions across accounts and entitlement, the AI assistant's knowledge surface, and site publishing/serving; all 51 are marked resolved (10 critical, 15 high, 18 medium, 8 low). Severity rates critical as a tenant-isolation or authorization break, high as a failed core flow, medium as a degraded feature and low as presentation only; caveat: every fix_plan_summary below is the same AC-2257 plan and explains only that entry, and AC-1422 (reg-022) was superseded by REQ-190 rather than fixed.

[
  {
    "id": "reg-001",
    "capability_uid": "capability-e5939ceb",
    "capability_name": "Accounts, Membership & Entitlement: Who Exists, What They Own, And When Access Ends",
    "story_uid": "story-7b1025b8",
    "ac_uid": "acceptance_criterion-02172406",
    "ac_human_id": "AC-2257",
    "ac_summary": "No permission check reads role beyond the single ownership question, and owner is the only role value",
    "failing_uats": [
      "a person and their addresses test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates"
    ],
    "fix_plan_summary": "# Fix Plan — Iteration 3\n\n## Hypothesis\n`test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates` seeds no contact in the customer business, so `GET /api/people` returns an empty list for both callers. `ownerPeople.people[0].id` at line 409 then throws a TypeError. The production gates are correct; the test fixture is what's broken.\n\n## Analysis\n- **Prior iterations are unrelated.** Iteration 1/2's fix_plan reports (report-a931f6c9, report-06a422ea) targeted AC-1421",
    "resolved": true,
    "description": "Role-based access was not confined to the single ownership gate, so a non-owner member's admission and refusal at the owner-only routes could not be shown to be correct.",
    "severity": "critical"
  },
  {
    "id": "reg-002",
    "capability_uid": "capability-a12e557f",
    "capability_name": "Site Delivery: Deploy & Public Serving",
    "story_uid": "story-5349d01f",
    "ac_uid": "acceptance_criterion-50925e49",
    "ac_human_id": "AC-1421",
    "ac_summary": "Revision history is readable, and a checkout re-parents the draft while staying forward-only",
    "failing_uats": [
      "story-5349d01f — publishing from the command line and the builder test_UAT_AC1421_history_is_readable_and_a_checkout_re_parents_forward_only"
    ],
    "fix_plan_summary": "# Fix Plan — Iteration 3\n\n## Hypothesis\n`test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates` seeds no contact in the customer business, so `GET /api/people` returns an empty list for both callers. `ownerPeople.people[0].id` at line 409 then throws a TypeError. The production gates are correct; the test fixture is what's broken.\n\n## Analysis\n- **Prior iterations are unrelated.** Iteration 1/2's fix_plan reports (report-a931f6c9, report-06a422ea) targeted AC-1421",
    "resolved": true,
    "description": "A site's revision history could not be read and a checkout could not re-parent the draft forward-only, breaking rollback for site owners.",
    "severity": "high"
  },
  {
    "id": "reg-003",
    "capability_uid": "capability-e5939ceb",
    "capability_name": "Accounts, Membership & Entitlement: Who Exists, What They Own, And When Access Ends",
    "story_uid": "story-0034d937",
    "ac_uid": "acceptance_criterion-5d6bb323",
    "ac_human_id": "AC-2179",
    "ac_summary": "Each list row shows the resolved current name and the primary address, reading No name yet when the person has no current name",
    "failing_uats": [
      "story-0034d937 — the list test_UAT_AC2179_row_shows_name_and_address_in_two_cells_or_no_name_yet"
    ],
    "fix_plan_summary": "# Fix Plan — Iteration 3\n\n## Hypothesis\n`test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates` seeds no contact in the customer business, so `GET /api/people` returns an empty list for both callers. `ownerPeople.people[0].id` at line 409 then throws a TypeError. The production gates are correct; the test fixture is what's broken.\n\n## Analysis\n- **Prior iterations are unrelated.** Iteration 1/2's fix_plan reports (report-a931f6c9, report-06a422ea) targeted AC-1421",
    "resolved": true,
    "description": "Rows in the Contacts list did not show the person's current name and primary address, or the 'No name yet' placeholder when unnamed.",
    "severity": "medium"
  },
  {
    "id": "reg-004",
    "capability_uid": "capability-e5939ceb",
    "capability_name": "Accounts, Membership & Entitlement: Who Exists, What They Own, And When Access Ends",
    "story_uid": "story-0034d937",
    "ac_uid": "acceptance_criterion-db93ad50",
    "ac_human_id": "AC-2182",
    "ac_summary": "Selecting a person opens a detail pane immediately that fills with Who they are (primary address) and Businesses sections",
    "failing_uats": [
      "story-0034d937 — the detail pane test_UAT_AC2182_selecting_a_person_opens_a_pane_at_once_that_fills_with_both_sections"
    ],
    "fix_plan_summary": "# Fix Plan — Iteration 3\n\n## Hypothesis\n`test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates` seeds no contact in the customer business, so `GET /api/people` returns an empty list for both callers. `ownerPeople.people[0].id` at line 409 then throws a TypeError. The production gates are correct; the test fixture is what's broken.\n\n## Analysis\n- **Prior iterations are unrelated.** Iteration 1/2's fix_plan reports (report-a931f6c9, report-06a422ea) targeted AC-1421",
    "resolved": true,
    "description": "Selecting a person did not open the detail pane with their primary address and Businesses sections.",
    "severity": "medium"
  },
  {
    "id": "reg-005",
    "capability_uid": "capability-e5939ceb",
    "capability_name": "Accounts, Membership & Entitlement: Who Exists, What They Own, And When Access Ends",
    "story_uid": "story-a55c2f35",
    "ac_uid": "acceptance_criterion-7914c104",
    "ac_human_id": "AC-2188",
    "ac_summary": "In a contact's detail, Who they are offers editing on the primary address only, with name parts in their own section; the eight observed fields stay locked",
    "failing_uats": [
      "story-a55c2f35 — Who they are test_UAT_AC2188_only_email_and_name_are_editable_and_the_eight_observed_fields_are_locked"
    ],
    "fix_plan_summary": "# Fix Plan — Iteration 3\n\n## Hypothesis\n`test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates` seeds no contact in the customer business, so `GET /api/people` returns an empty list for both callers. `ownerPeople.people[0].id` at line 409 then throws a TypeError. The production gates are correct; the test fixture is what's broken.\n\n## Analysis\n- **Prior iterations are unrelated.** Iteration 1/2's fix_plan reports (report-a931f6c9, report-06a422ea) targeted AC-1421",
    "resolved": true,
    "description": "The contact detail pane did not limit editing to the primary address and name parts, so the locked observed fields were not shown as read-only.",
    "severity": "medium"
  },
  {
    "id": "reg-006",
    "capability_uid": "capability-e5939ceb",
    "capability_name": "Accounts, Membership & Entitlement: Who Exists, What They Own, And When Access Ends",
    "story_uid": "story-83ff6262",
    "ac_uid": "acceptance_criterion-964bcad3",
    "ac_human_id": "AC-2226",
    "ac_summary": "The portal offers no add-business, plan, charges, details-editing or export surface and never says \"tenant\"",
    "failing_uats": [
      "story-83ff6262 — the Delete account control and its explanation test_UAT_AC2226_portal_offers_no_business_plan_charges_details_or_export_surface_and_no_tenant"
    ],
    "fix_plan_summary": "# Fix Plan — Iteration 3\n\n## Hypothesis\n`test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates` seeds no contact in the customer business, so `GET /api/people` returns an empty list for both callers. `ownerPeople.people[0].id` at line 409 then throws a TypeError. The production gates are correct; the test fixture is what's broken.\n\n## Analysis\n- **Prior iterations are unrelated.** Iteration 1/2's fix_plan reports (report-a931f6c9, report-06a422ea) targeted AC-1421",
    "resolved": true,
    "description": "The customer portal could not be shown to omit the add-business, plan, charges, details-editing and export surfaces or the word 'tenant'.",
    "severity": "low"
  },
  {
    "id": "reg-007",
    "capability_uid": "capability-e5939ceb",
    "capability_name": "Accounts, Membership & Entitlement: Who Exists, What They Own, And When Access Ends",
    "story_uid": "story-83ff6262",
    "ac_uid": "acceptance_criterion-c0a874e0",
    "ac_human_id": "AC-2222",
    "ac_summary": "The account line names the caller from their own account facts, falling back to the verified email",
    "failing_uats": [
      "story-83ff6262 — the caller's own account facts test_UAT_AC2222_account_line_names_the_caller_and_falls_back_to_the_verified_email"
    ],
    "fix_plan_summary": "# Fix Plan — Iteration 3\n\n## Hypothesis\n`test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates` seeds no contact in the customer business, so `GET /api/people` returns an empty list for both callers. `ownerPeople.people[0].id` at line 409 then throws a TypeError. The production gates are correct; the test fixture is what's broken.\n\n## Analysis\n- **Prior iterations are unrelated.** Iteration 1/2's fix_plan reports (report-a931f6c9, report-06a422ea) targeted AC-1421",
    "resolved": true,
    "description": "The account line in the chrome did not name the signed-in caller from their own record or fall back to their verified email.",
    "severity": "low"
  },
  {
    "id": "reg-008",
    "capability_uid": "capability-e5939ceb",
    "capability_name": "Accounts, Membership & Entitlement: Who Exists, What They Own, And When Access Ends",
    "story_uid": "story-83ff6262",
    "ac_uid": "acceptance_criterion-914ec1ac",
    "ac_human_id": "AC-2225",
    "ac_summary": "The builder's avatar dialog links out to the portal in a new tab and adds nothing else",
    "failing_uats": [
      "story-83ff6262 — the avatar dialog links out to the portal test_UAT_AC2225_avatar_dialog_links_to_the_portal_in_a_new_tab_and_adds_nothing_else"
    ],
    "fix_plan_summary": "# Fix Plan — Iteration 3\n\n## Hypothesis\n`test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates` seeds no contact in the customer business, so `GET /api/people` returns an empty list for both callers. `ownerPeople.people[0].id` at line 409 then throws a TypeError. The production gates are correct; the test fixture is what's broken.\n\n## Analysis\n- **Prior iterations are unrelated.** Iteration 1/2's fix_plan reports (report-a931f6c9, report-06a422ea) targeted AC-1421",
    "resolved": true,
    "description": "The builder's avatar dialog did not link out to the portal in a new tab with nothing else added.",
    "severity": "low"
  },
  {
    "id": "reg-009",
    "capability_uid": "capability-7e4714b7",
    "capability_name": "AI Site Assistant: Per-Site Conversations",
    "story_uid": "story-3cf3d57b",
    "ac_uid": "acceptance_criterion-a0c627a1",
    "ac_human_id": "AC-1795",
    "ac_summary": "A cold conversation is primed with both maps in one landscape section, the client's first, then purpose, then how to search",
    "failing_uats": [
      "a cold conversation is primed with both maps in one landscape section test_UAT_AC1795_both_maps_sit_in_one_landscape_section_clients_first"
    ],
    "fix_plan_summary": "# Fix Plan — Iteration 3\n\n## Hypothesis\n`test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates` seeds no contact in the customer business, so `GET /api/people` returns an empty list for both callers. `ownerPeople.people[0].id` at line 409 then throws a TypeError. The production gates are correct; the test fixture is what's broken.\n\n## Analysis\n- **Prior iterations are unrelated.** Iteration 1/2's fix_plan reports (report-a931f6c9, report-06a422ea) targeted AC-1421",
    "resolved": true,
    "description": "A new assistant conversation was not primed with both knowledge maps in one section, client first, so the assistant started without knowing what it could search.",
    "severity": "high"
  },
  {
    "id": "reg-010",
    "capability_uid": "capability-7e4714b7",
    "capability_name": "AI Site Assistant: Per-Site Conversations",
    "story_uid": "story-3cf3d57b",
    "ac_uid": "acceptance_criterion-5c941d29",
    "ac_human_id": "AC-1796",
    "ac_summary": "A client corpus small enough to list reaches the conversation listed in full and labelled complete",
    "failing_uats": [
      "a client corpus small enough to list reaches the conversation in full test_UAT_AC1796_a_small_client_corpus_is_listed_in_full_and_labelled_complete"
    ],
    "fix_plan_summary": "# Fix Plan — Iteration 3\n\n## Hypothesis\n`test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates` seeds no contact in the customer business, so `GET /api/people` returns an empty list for both callers. `ownerPeople.people[0].id` at line 409 then throws a TypeError. The production gates are correct; the test fixture is what's broken.\n\n## Analysis\n- **Prior iterations are unrelated.** Iteration 1/2's fix_plan reports (report-a931f6c9, report-06a422ea) targeted AC-1421",
    "resolved": true,
    "description": "A small client corpus was not listed in full and labelled complete in the conversation's priming.",
    "severity": "medium"
  },
  {
    "id": "reg-011",
    "capability_uid": "capability-7e4714b7",
    "capability_name": "AI Site Assistant: Per-Site Conversations",
    "story_uid": "story-3cf3d57b",
    "ac_uid": "acceptance_criterion-fdff2d1d",
    "ac_human_id": "AC-1797",
    "ac_summary": "One search reaches both knowledge bases and returns one list on their own scores, cut to k after merging, ties client-first",
    "failing_uats": [
      "one search reaches both knowledge bases and returns one ranked list test_UAT_AC1797_a_search_fans_out_merges_on_their_own_scores_and_cuts_after"
    ],
    "fix_plan_summary": "# Fix Plan — Iteration 3\n\n## Hypothesis\n`test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates` seeds no contact in the customer business, so `GET /api/people` returns an empty list for both callers. `ownerPeople.people[0].id` at line 409 then throws a TypeError. The production gates are correct; the test fixture is what's broken.\n\n## Analysis\n- **Prior iterations are unrelated.** Iteration 1/2's fix_plan reports (report-a931f6c9, report-06a422ea) targeted AC-1421",
    "resolved": true,
    "description": "The assistant's search did not reach both knowledge bases and return one merged ranked list, so it could not find shipped or client documents.",
    "severity": "high"
  },
  {
    "id": "reg-012",
    "capability_uid": "capability-7e4714b7",
    "capability_name": "AI Site Assistant: Per-Site Conversations",
    "story_uid": "story-3cf3d57b",
    "ac_uid": "acceptance_criterion-aa0da71f",
    "ac_human_id": "AC-1798",
    "ac_summary": "A document uploaded mid-conversation is known by name on the next turn, with no map rebuild in between",
    "failing_uats": [
      "a document uploaded mid-conversation is known by name on the next turn test_UAT_AC1798_a_mid_conversation_upload_is_named_next_turn_with_no_map_rebuild"
    ],
    "fix_plan_summary": "# Fix Plan — Iteration 3\n\n## Hypothesis\n`test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates` seeds no contact in the customer business, so `GET /api/people` returns an empty list for both callers. `ownerPeople.people[0].id` at line 409 then throws a TypeError. The production gates are correct; the test fixture is what's broken.\n\n## Analysis\n- **Prior iterations are unrelated.** Iteration 1/2's fix_plan reports (report-a931f6c9, report-06a422ea) targeted AC-1421",
    "resolved": true,
    "description": "A document uploaded mid-conversation was not known by name to the assistant on the next turn.",
    "severity": "medium"
  },
  {
    "id": "reg-013",
    "capability_uid": "capability-7e4714b7",
    "capability_name": "AI Site Assistant: Per-Site Conversations",
    "story_uid": "story-3cf3d57b",
    "ac_uid": "acceptance_criterion-9427aee4",
    "ac_human_id": "AC-1799",
    "ac_summary": "A turn on which nothing arrived carries no arrival notice at all, not even an empty one",
    "failing_uats": [
      "a turn on which nothing arrived carries no arrival notice at all test_UAT_AC1799_a_quiet_turn_carries_no_arrival_wording_of_any_kind"
    ],
    "fix_plan_summary": "# Fix Plan — Iteration 3\n\n## Hypothesis\n`test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates` seeds no contact in the customer business, so `GET /api/people` returns an empty list for both callers. `ownerPeople.people[0].id` at line 409 then throws a TypeError. The production gates are correct; the test fixture is what's broken.\n\n## Analysis\n- **Prior iterations are unrelated.** Iteration 1/2's fix_plan reports (report-a931f6c9, report-06a422ea) targeted AC-1421",
    "resolved": true,
    "description": "A turn on which nothing arrived could carry a stray or empty arrival notice in the assistant's context.",
    "severity": "low"
  },
  {
    "id": "reg-014",
    "capability_uid": "capability-7e4714b7",
    "capability_name": "AI Site Assistant: Per-Site Conversations",
    "story_uid": "story-3cf3d57b",
    "ac_uid": "acceptance_criterion-29dd375d",
    "ac_human_id": "AC-1802",
    "ac_summary": "An arrival is announced once: the boundary document and everything sharing its instant are not reported again",
    "failing_uats": [
      "an arrival is announced once and never again test_UAT_AC1802_the_boundary_document_and_its_instant_are_not_reported_twice"
    ],
    "fix_plan_summary": "# Fix Plan — Iteration 3\n\n## Hypothesis\n`test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates` seeds no contact in the customer business, so `GET /api/people` returns an empty list for both callers. `ownerPeople.people[0].id` at line 409 then throws a TypeError. The production gates are correct; the test fixture is what's broken.\n\n## Analysis\n- **Prior iterations are unrelated.** Iteration 1/2's fix_plan reports (report-a931f6c9, report-06a422ea) targeted AC-1421",
    "resolved": true,
    "description": "The assistant could be told about the same arrived document more than once.",
    "severity": "low"
  },
  {
    "id": "reg-015",
    "capability_uid": "capability-7e4714b7",
    "capability_name": "AI Site Assistant: Per-Site Conversations",
    "story_uid": "story-3cf3d57b",
    "ac_uid": "acceptance_criterion-abde0e99",
    "ac_human_id": "AC-1803",
    "ac_summary": "A record of what a conversation has been told that cannot be read costs one wider sweep and never the turn",
    "failing_uats": [
      "an unreadable record of what a conversation was told never costs the turn test_UAT_AC1803_a_corrupt_absent_or_empty_bookmark_still_takes_the_turn"
    ],
    "fix_plan_summary": "# Fix Plan — Iteration 3\n\n## Hypothesis\n`test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates` seeds no contact in the customer business, so `GET /api/people` returns an empty list for both callers. `ownerPeople.people[0].id` at line 409 then throws a TypeError. The production gates are correct; the test fixture is what's broken.\n\n## Analysis\n- **Prior iterations are unrelated.** Iteration 1/2's fix_plan reports (report-a931f6c9, report-06a422ea) targeted AC-1421",
    "resolved": true,
    "description": "An unreadable record of what a conversation had been told could cost the whole turn instead of one wider sweep.",
    "severity": "medium"
  },
  {
    "id": "reg-016",
    "capability_uid": "capability-7e4714b7",
    "capability_name": "AI Site Assistant: Per-Site Conversations",
    "story_uid": "story-3cf3d57b",
    "ac_uid": "acceptance_criterion-971f366f",
    "ac_human_id": "AC-1804",
    "ac_summary": "A conversation's coverage starts where the map's ends, so a document arriving in the gap is announced on the first turn",
    "failing_uats": [
      "a conversation's coverage starts where the map's coverage ends test_UAT_AC1804_a_document_arriving_in_the_gap_is_announced_on_the_first_turn"
    ],
    "fix_plan_summary": "# Fix Plan — Iteration 3\n\n## Hypothesis\n`test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates` seeds no contact in the customer business, so `GET /api/people` returns an empty list for both callers. `ownerPeople.people[0].id` at line 409 then throws a TypeError. The production gates are correct; the test fixture is what's broken.\n\n## Analysis\n- **Prior iterations are unrelated.** Iteration 1/2's fix_plan reports (report-a931f6c9, report-06a422ea) targeted AC-1421",
    "resolved": true,
    "description": "A document arriving between the map build and a conversation's first turn was not announced to the assistant.",
    "severity": "medium"
  },
  {
    "id": "reg-017",
    "capability_uid": "capability-7e4714b7",
    "capability_name": "AI Site Assistant: Per-Site Conversations",
    "story_uid": "story-3cf3d57b",
    "ac_uid": "acceptance_criterion-04a4dc41",
    "ac_human_id": "AC-1805",
    "ac_summary": "A resumed conversation's first turn back reports what arrived while the client was away, with no separate report",
    "failing_uats": [
      "a resumed conversation's first turn back reports what arrived while away test_UAT_AC1805_a_resumed_conversation_names_what_arrived_while_it_was_not_served"
    ],
    "fix_plan_summary": "# Fix Plan — Iteration 3\n\n## Hypothesis\n`test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates` seeds no contact in the customer business, so `GET /api/people` returns an empty list for both callers. `ownerPeople.people[0].id` at line 409 then throws a TypeError. The production gates are correct; the test fixture is what's broken.\n\n## Analysis\n- **Prior iterations are unrelated.** Iteration 1/2's fix_plan reports (report-a931f6c9, report-06a422ea) targeted AC-1421",
    "resolved": true,
    "description": "A resumed conversation did not report what had arrived while the client was away.",
    "severity": "medium"
  },
  {
    "id": "reg-018",
    "capability_uid": "capability-7e4714b7",
    "capability_name": "AI Site Assistant: Per-Site Conversations",
    "story_uid": "story-3cf3d57b",
    "ac_uid": "acceptance_criterion-5a6e478d",
    "ac_human_id": "AC-1806",
    "ac_summary": "A conversation is never announced to itself, while still remaining a searchable member of the client's knowledge",
    "failing_uats": [
      "a conversation is never announced to itself test_UAT_AC1806_a_conversation_is_excluded_from_arrivals_but_not_from_the_corpus"
    ],
    "fix_plan_summary": "# Fix Plan — Iteration 3\n\n## Hypothesis\n`test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates` seeds no contact in the customer business, so `GET /api/people` returns an empty list for both callers. `ownerPeople.people[0].id` at line 409 then throws a TypeError. The production gates are correct; the test fixture is what's broken.\n\n## Analysis\n- **Prior iterations are unrelated.** Iteration 1/2's fix_plan reports (report-a931f6c9, report-06a422ea) targeted AC-1421",
    "resolved": true,
    "description": "A conversation could be announced to itself as an arrival, or dropped from the client's searchable knowledge.",
    "severity": "low"
  },
  {
    "id": "reg-019",
    "capability_uid": "capability-7e4714b7",
    "capability_name": "AI Site Assistant: Per-Site Conversations",
    "story_uid": "story-3cf3d57b",
    "ac_uid": "acceptance_criterion-50dc01f8",
    "ac_human_id": "AC-1807",
    "ac_summary": "The arrival notice is last in a turn's context, after the maps, the purpose, the manual and the site-change reminder",
    "failing_uats": [
      "the arrival notice is last in a turn's context test_UAT_AC1807_the_notice_follows_the_maps_the_purpose_the_manual_and_the_site_change"
    ],
    "fix_plan_summary": "# Fix Plan — Iteration 3\n\n## Hypothesis\n`test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates` seeds no contact in the customer business, so `GET /api/people` returns an empty list for both callers. `ownerPeople.people[0].id` at line 409 then throws a TypeError. The production gates are correct; the test fixture is what's broken.\n\n## Analysis\n- **Prior iterations are unrelated.** Iteration 1/2's fix_plan reports (report-a931f6c9, report-06a422ea) targeted AC-1421",
    "resolved": true,
    "description": "The arrival notice was not placed last in the turn's context after the maps, purpose, manual and site-change reminder.",
    "severity": "low"
  },
  {
    "id": "reg-020",
    "capability_uid": "capability-7e4714b7",
    "capability_name": "AI Site Assistant: Per-Site Conversations",
    "story_uid": "story-3cf3d57b",
    "ac_uid": "acceptance_criterion-d8c73ae0",
    "ac_human_id": "AC-1808",
    "ac_summary": "Arrivals are the client's knowledge alone, and no client knowledge opened is an ordinary state that still takes turns",
    "failing_uats": [
      "arrivals are the client's knowledge alone, and no client knowledge still takes turns test_UAT_AC1808_the_shipped_corpus_is_never_swept_and_a_shipped_only_conversation_runs"
    ],
    "fix_plan_summary": "# Fix Plan — Iteration 3\n\n## Hypothesis\n`test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates` seeds no contact in the customer business, so `GET /api/people` returns an empty list for both callers. `ownerPeople.people[0].id` at line 409 then throws a TypeError. The production gates are correct; the test fixture is what's broken.\n\n## Analysis\n- **Prior iterations are unrelated.** Iteration 1/2's fix_plan reports (report-a931f6c9, report-06a422ea) targeted AC-1421",
    "resolved": true,
    "description": "Arrivals were not confined to the client's own knowledge, and a conversation with no client knowledge opened could fail to take turns.",
    "severity": "medium"
  },
  {
    "id": "reg-021",
    "capability_uid": "capability-a12e557f",
    "capability_name": "Site Delivery: Deploy & Public Serving",
    "story_uid": "story-5349d01f",
    "ac_uid": "acceptance_criterion-f207077a",
    "ac_human_id": "AC-1418",
    "ac_summary": "Publishing mints a revision, renders it and stores it with no filesystem on the path, driven identically from the builder and the command line",
    "failing_uats": [
      "story-5349d01f — publishing in the cloud, where there is no filesystem test_UAT_AC1418_publish_mints_renders_and_stores_identically_from_both_front_doors"
    ],
    "fix_plan_summary": "# Fix Plan — Iteration 3\n\n## Hypothesis\n`test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates` seeds no contact in the customer business, so `GET /api/people` returns an empty list for both callers. `ownerPeople.people[0].id` at line 409 then throws a TypeError. The production gates are correct; the test fixture is what's broken.\n\n## Analysis\n- **Prior iterations are unrelated.** Iteration 1/2's fix_plan reports (report-a931f6c9, report-06a422ea) targeted AC-1421",
    "resolved": true,
    "description": "Publishing did not mint, render and store a revision identically from the builder and the command line, so a site could not be published reliably.",
    "severity": "high"
  },
  {
    "id": "reg-022",
    "capability_uid": "capability-a12e557f",
    "capability_name": "Site Delivery: Deploy & Public Serving",
    "story_uid": "story-5349d01f",
    "ac_uid": "acceptance_criterion-51835b53",
    "ac_human_id": "AC-1422",
    "ac_summary": "A second account cannot publish over a slug another account has claimed, and the live site is untouched",
    "failing_uats": [
      "story-5349d01f — publishing in the cloud, where there is no filesystem test_UAT_AC1422_a_second_account_cannot_publish_over_a_claimed_slug"
    ],
    "fix_plan_summary": "# Fix Plan — Iteration 3\n\n## Hypothesis\n`test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates` seeds no contact in the customer business, so `GET /api/people` returns an empty list for both callers. `ownerPeople.people[0].id` at line 409 then throws a TypeError. The production gates are correct; the test fixture is what's broken.\n\n## Analysis\n- **Prior iterations are unrelated.** Iteration 1/2's fix_plan reports (report-a931f6c9, report-06a422ea) targeted AC-1421",
    "resolved": true,
    "description": "The slug-claim refusal across businesses no longer held after the rebaseline. The AC is superseded by REQ-190 (AC-2245/2246), which removes the cross-tenant claim entirely.",
    "severity": "critical"
  },
  {
    "id": "reg-023",
    "capability_uid": "capability-a12e557f",
    "capability_name": "Site Delivery: Deploy & Public Serving",
    "story_uid": "story-d34eccd8",
    "ac_uid": "acceptance_criterion-5312d7ac",
    "ac_human_id": "AC-903",
    "ac_summary": "A published URL serves the site's live revision, derived as the highest in its log, complete with every asset it references",
    "failing_uats": [
      "story-d34eccd8 — serving a published site, over real bindings test_UAT_AC903_a_published_url_serves_the_live_revision_whole"
    ],
    "fix_plan_summary": "# Fix Plan — Iteration 3\n\n## Hypothesis\n`test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates` seeds no contact in the customer business, so `GET /api/people` returns an empty list for both callers. `ownerPeople.people[0].id` at line 409 then throws a TypeError. The production gates are correct; the test fixture is what's broken.\n\n## Analysis\n- **Prior iterations are unrelated.** Iteration 1/2's fix_plan reports (report-a931f6c9, report-06a422ea) targeted AC-1421",
    "resolved": true,
    "description": "A published URL did not serve the site's live revision with every asset it references, so visitors could not see the published site.",
    "severity": "high"
  },
  {
    "id": "reg-024",
    "capability_uid": "capability-a12e557f",
    "capability_name": "Site Delivery: Deploy & Public Serving",
    "story_uid": "story-d34eccd8",
    "ac_uid": "acceptance_criterion-4690eca9",
    "ac_human_id": "AC-1423",
    "ac_summary": "A site's live revision is recorded in exactly one place: derived from the log, never stored beside the bytes",
    "failing_uats": [
      "story-d34eccd8 — serving a published site, over real bindings test_UAT_AC1423_live_is_recorded_only_in_the_log_and_never_beside_the_bytes"
    ],
    "fix_plan_summary": "# Fix Plan — Iteration 3\n\n## Hypothesis\n`test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates` seeds no contact in the customer business, so `GET /api/people` returns an empty list for both callers. `ownerPeople.people[0].id` at line 409 then throws a TypeError. The production gates are correct; the test fixture is what's broken.\n\n## Analysis\n- **Prior iterations are unrelated.** Iteration 1/2's fix_plan reports (report-a931f6c9, report-06a422ea) targeted AC-1421",
    "resolved": true,
    "description": "A site's live revision was not derived solely from its revision log, risking two records of which revision is live.",
    "severity": "medium"
  },
  {
    "id": "reg-025",
    "capability_uid": "capability-a12e557f",
    "capability_name": "Site Delivery: Deploy & Public Serving",
    "story_uid": "story-d34eccd8",
    "ac_uid": "acceptance_criterion-48d1ea8e",
    "ac_human_id": "AC-1424",
    "ac_summary": "The builder's published view redirects here, so published bytes have exactly one serving path",
    "failing_uats": [
      "story-d34eccd8 — serving a published site, over real bindings test_UAT_AC1424_the_builders_published_view_redirects_to_the_one_serving_path"
    ],
    "fix_plan_summary": "# Fix Plan — Iteration 3\n\n## Hypothesis\n`test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates` seeds no contact in the customer business, so `GET /api/people` returns an empty list for both callers. `ownerPeople.people[0].id` at line 409 then throws a TypeError. The production gates are correct; the test fixture is what's broken.\n\n## Analysis\n- **Prior iterations are unrelated.** Iteration 1/2's fix_plan reports (report-a931f6c9, report-06a422ea) targeted AC-1421",
    "resolved": true,
    "description": "The builder's published view did not redirect to the single public serving path.",
    "severity": "medium"
  },
  {
    "id": "reg-026",
    "capability_uid": "capability-e5939ceb",
    "capability_name": "Accounts, Membership & Entitlement: Who Exists, What They Own, And When Access Ends",
    "story_uid": "story-387c9dfe",
    "ac_uid": "acceptance_criterion-504bbd4c",
    "ac_human_id": "AC-2149",
    "ac_summary": "A caller who is not an owner of the 1st Contact business who asks to add a business gets 404 and no business is created",
    "failing_uats": [
      "Business Fulfilment — the operator adds a business, nobody else can test_UAT_AC2149_admitted_customer_without_privilege_gets_404_and_nothing_is_created"
    ],
    "fix_plan_summary": "# Fix Plan — Iteration 3\n\n## Hypothesis\n`test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates` seeds no contact in the customer business, so `GET /api/people` returns an empty list for both callers. `ownerPeople.people[0].id` at line 409 then throws a TypeError. The production gates are correct; the test fixture is what's broken.\n\n## Analysis\n- **Prior iterations are unrelated.** Iteration 1/2's fix_plan reports (report-a931f6c9, report-06a422ea) targeted AC-1421",
    "resolved": true,
    "description": "A caller who does not own the 1st Contact business could not be shown to be refused (404) when asking to add a business, leaving a provisioning-bypass path unproven.",
    "severity": "critical"
  },
  {
    "id": "reg-027",
    "capability_uid": "capability-e5939ceb",
    "capability_name": "Accounts, Membership & Entitlement: Who Exists, What They Own, And When Access Ends",
    "story_uid": "story-387c9dfe",
    "ac_uid": "acceptance_criterion-4aa71bb2",
    "ac_human_id": "AC-2152",
    "ac_summary": "The operator adds a business to an existing account and it is immediately selectable for that account's owner",
    "failing_uats": [
      "Business Fulfilment — the operator adds a business, nobody else can test_UAT_AC2152_operator_adds_a_business_and_it_is_immediately_selectable"
    ],
    "fix_plan_summary": "# Fix Plan — Iteration 3\n\n## Hypothesis\n`test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates` seeds no contact in the customer business, so `GET /api/people` returns an empty list for both callers. `ownerPeople.people[0].id` at line 409 then throws a TypeError. The production gates are correct; the test fixture is what's broken.\n\n## Analysis\n- **Prior iterations are unrelated.** Iteration 1/2's fix_plan reports (report-a931f6c9, report-06a422ea) targeted AC-1421",
    "resolved": true,
    "description": "A business the operator added to an existing account was not immediately selectable by that account's owner.",
    "severity": "high"
  },
  {
    "id": "reg-028",
    "capability_uid": "capability-e5939ceb",
    "capability_name": "Accounts, Membership & Entitlement: Who Exists, What They Own, And When Access Ends",
    "story_uid": "story-387c9dfe",
    "ac_uid": "acceptance_criterion-aa306f12",
    "ac_human_id": "AC-2153",
    "ac_summary": "Adding a business creates the whole business in one operation: active business, owner membership, live grant attributed to the operator, and a starter site",
    "failing_uats": [
      "Business Fulfilment — the operator adds a business, nobody else can test_UAT_AC2153_adding_a_business_creates_all_four_parts_in_one_operation"
    ],
    "fix_plan_summary": "# Fix Plan — Iteration 3\n\n## Hypothesis\n`test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates` seeds no contact in the customer business, so `GET /api/people` returns an empty list for both callers. `ownerPeople.people[0].id` at line 409 then throws a TypeError. The production gates are correct; the test fixture is what's broken.\n\n## Analysis\n- **Prior iterations are unrelated.** Iteration 1/2's fix_plan reports (report-a931f6c9, report-06a422ea) targeted AC-1421",
    "resolved": true,
    "description": "Adding a business did not create the active business, owner membership, operator-attributed grant and starter site in one operation.",
    "severity": "high"
  },
  {
    "id": "reg-029",
    "capability_uid": "capability-e5939ceb",
    "capability_name": "Accounts, Membership & Entitlement: Who Exists, What They Own, And When Access Ends",
    "story_uid": "story-387c9dfe",
    "ac_uid": "acceptance_criterion-0fbe6d15",
    "ac_human_id": "AC-2154",
    "ac_summary": "An account's first business is provisioned after the invite, and the account is then admitted with exactly that one business",
    "failing_uats": [
      "Business Fulfilment — the operator adds a business, nobody else can test_UAT_AC2154_creating_an_account_provisions_its_first_business"
    ],
    "fix_plan_summary": "# Fix Plan — Iteration 3\n\n## Hypothesis\n`test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates` seeds no contact in the customer business, so `GET /api/people` returns an empty list for both callers. `ownerPeople.people[0].id` at line 409 then throws a TypeError. The production gates are correct; the test fixture is what's broken.\n\n## Analysis\n- **Prior iterations are unrelated.** Iteration 1/2's fix_plan reports (report-a931f6c9, report-06a422ea) targeted AC-1421",
    "resolved": true,
    "description": "An invited account's first business was not provisioned so that the account was admitted with exactly that business.",
    "severity": "high"
  },
  {
    "id": "reg-030",
    "capability_uid": "capability-e5939ceb",
    "capability_name": "Accounts, Membership & Entitlement: Who Exists, What They Own, And When Access Ends",
    "story_uid": "story-387c9dfe",
    "ac_uid": "acceptance_criterion-2ec54b32",
    "ac_human_id": "AC-2155",
    "ac_summary": "Operator adding a business for an unknown email gets 404 with 'No account with that email address.'",
    "failing_uats": [
      "Business Fulfilment — the operator adds a business, nobody else can test_UAT_AC2155_unknown_account_email_is_reported_plainly_with_404"
    ],
    "fix_plan_summary": "# Fix Plan — Iteration 3\n\n## Hypothesis\n`test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates` seeds no contact in the customer business, so `GET /api/people` returns an empty list for both callers. `ownerPeople.people[0].id` at line 409 then throws a TypeError. The production gates are correct; the test fixture is what's broken.\n\n## Analysis\n- **Prior iterations are unrelated.** Iteration 1/2's fix_plan reports (report-a931f6c9, report-06a422ea) targeted AC-1421",
    "resolved": true,
    "description": "An operator adding a business for an unknown email did not get the plain 404 'No account with that email address.'",
    "severity": "medium"
  },
  {
    "id": "reg-031",
    "capability_uid": "capability-e5939ceb",
    "capability_name": "Accounts, Membership & Entitlement: Who Exists, What They Own, And When Access Ends",
    "story_uid": "story-387c9dfe",
    "ac_uid": "acceptance_criterion-d9fd433f",
    "ac_human_id": "AC-2156",
    "ac_summary": "Operator add-a-business with a missing or blank account email or name is rejected with 400",
    "failing_uats": [
      "Business Fulfilment — the operator adds a business, nobody else can test_UAT_AC2156_missing_or_blank_account_email_or_name_is_rejected_with_400"
    ],
    "fix_plan_summary": "# Fix Plan — Iteration 3\n\n## Hypothesis\n`test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates` seeds no contact in the customer business, so `GET /api/people` returns an empty list for both callers. `ownerPeople.people[0].id` at line 409 then throws a TypeError. The production gates are correct; the test fixture is what's broken.\n\n## Analysis\n- **Prior iterations are unrelated.** Iteration 1/2's fix_plan reports (report-a931f6c9, report-06a422ea) targeted AC-1421",
    "resolved": true,
    "description": "Add-a-business with a missing or blank account email or name was not rejected with 400.",
    "severity": "medium"
  },
  {
    "id": "reg-032",
    "capability_uid": "capability-e5939ceb",
    "capability_name": "Accounts, Membership & Entitlement: Who Exists, What They Own, And When Access Ends",
    "story_uid": "story-387c9dfe",
    "ac_uid": "acceptance_criterion-be56b74c",
    "ac_human_id": "AC-2157",
    "ac_summary": "The businesses payload the browser reads carries exactly 'person' and 'businesses' and offers no self-serve creation contract",
    "failing_uats": [
      "Business Fulfilment — the operator adds a business, nobody else can test_UAT_AC2157_businesses_payload_carries_exactly_account_and_businesses"
    ],
    "fix_plan_summary": "# Fix Plan — Iteration 3\n\n## Hypothesis\n`test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates` seeds no contact in the customer business, so `GET /api/people` returns an empty list for both callers. `ownerPeople.people[0].id` at line 409 then throws a TypeError. The production gates are correct; the test fixture is what's broken.\n\n## Analysis\n- **Prior iterations are unrelated.** Iteration 1/2's fix_plan reports (report-a931f6c9, report-06a422ea) targeted AC-1421",
    "resolved": true,
    "description": "The businesses payload the browser reads did not carry exactly 'person' and 'businesses', breaking the account switcher's contract.",
    "severity": "medium"
  },
  {
    "id": "reg-033",
    "capability_uid": "capability-e5939ceb",
    "capability_name": "Accounts, Membership & Entitlement: Who Exists, What They Own, And When Access Ends",
    "story_uid": "story-0034d937",
    "ac_uid": "acceptance_criterion-8d1b7674",
    "ac_human_id": "AC-2178",
    "ac_summary": "The Contacts list holds exactly the people of the scoped business, contacts included, oldest first, for every business alike",
    "failing_uats": [
      "story-0034d937 — the list is the scoped business, for every business test_UAT_AC2178_list_is_exactly_the_scoped_business_contacts_included_oldest_first"
    ],
    "fix_plan_summary": "# Fix Plan — Iteration 3\n\n## Hypothesis\n`test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates` seeds no contact in the customer business, so `GET /api/people` returns an empty list for both callers. `ownerPeople.people[0].id` at line 409 then throws a TypeError. The production gates are correct; the test fixture is what's broken.\n\n## Analysis\n- **Prior iterations are unrelated.** Iteration 1/2's fix_plan reports (report-a931f6c9, report-06a422ea) targeted AC-1421",
    "resolved": true,
    "description": "The Contacts list did not hold exactly the people of the scoped business, oldest first, so business scoping of contacts was unproven.",
    "severity": "critical"
  },
  {
    "id": "reg-034",
    "capability_uid": "capability-e5939ceb",
    "capability_name": "Accounts, Membership & Entitlement: Who Exists, What They Own, And When Access Ends",
    "story_uid": "story-0034d937",
    "ac_uid": "acceptance_criterion-5847530f",
    "ac_human_id": "AC-2185",
    "ac_summary": "Every grant names its business, including where the person does not run it; a grant on a vanished business still shows by id",
    "failing_uats": [
      "story-0034d937 — every grant names its business test_UAT_AC2185_grant_detail_carries_the_business_name_and_keeps_a_vanished_business_by_id"
    ],
    "fix_plan_summary": "# Fix Plan — Iteration 3\n\n## Hypothesis\n`test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates` seeds no contact in the customer business, so `GET /api/people` returns an empty list for both callers. `ownerPeople.people[0].id` at line 409 then throws a TypeError. The production gates are correct; the test fixture is what's broken.\n\n## Analysis\n- **Prior iterations are unrelated.** Iteration 1/2's fix_plan reports (report-a931f6c9, report-06a422ea) targeted AC-1421",
    "resolved": true,
    "description": "Grants in a person's detail did not name their business, nor show a grant on a vanished business by id.",
    "severity": "medium"
  },
  {
    "id": "reg-035",
    "capability_uid": "capability-e5939ceb",
    "capability_name": "Accounts, Membership & Entitlement: Who Exists, What They Own, And When Access Ends",
    "story_uid": "story-a55c2f35",
    "ac_uid": "acceptance_criterion-5c205ca2",
    "ac_human_id": "AC-2192",
    "ac_summary": "An owner can correct a contact's primary address and name parts in the business they are scoped to",
    "failing_uats": [
      "story-a55c2f35 — an owner corrects who somebody is test_UAT_AC2192_an_owner_corrects_email_and_name_in_any_business_they_own"
    ],
    "fix_plan_summary": "# Fix Plan — Iteration 3\n\n## Hypothesis\n`test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates` seeds no contact in the customer business, so `GET /api/people` returns an empty list for both callers. `ownerPeople.people[0].id` at line 409 then throws a TypeError. The production gates are correct; the test fixture is what's broken.\n\n## Analysis\n- **Prior iterations are unrelated.** Iteration 1/2's fix_plan reports (report-a931f6c9, report-06a422ea) targeted AC-1421",
    "resolved": true,
    "description": "An owner could not correct a contact's primary address and name parts in the business they are scoped to.",
    "severity": "high"
  },
  {
    "id": "reg-036",
    "capability_uid": "capability-e5939ceb",
    "capability_name": "Accounts, Membership & Entitlement: Who Exists, What They Own, And When Access Ends",
    "story_uid": "story-a55c2f35",
    "ac_uid": "acceptance_criterion-5c0adfdb",
    "ac_human_id": "AC-2193",
    "ac_summary": "A record change leaves absent fields untouched and ignores any observed field that is sent",
    "failing_uats": [
      "story-a55c2f35 — an owner corrects who somebody is test_UAT_AC2193_a_record_change_is_a_patch_and_ignores_observed_fields"
    ],
    "fix_plan_summary": "# Fix Plan — Iteration 3\n\n## Hypothesis\n`test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates` seeds no contact in the customer business, so `GET /api/people` returns an empty list for both callers. `ownerPeople.people[0].id` at line 409 then throws a TypeError. The production gates are correct; the test fixture is what's broken.\n\n## Analysis\n- **Prior iterations are unrelated.** Iteration 1/2's fix_plan reports (report-a931f6c9, report-06a422ea) targeted AC-1421",
    "resolved": true,
    "description": "A record change did not behave as a patch: absent fields could be overwritten and observed fields accepted.",
    "severity": "high"
  },
  {
    "id": "reg-037",
    "capability_uid": "capability-e5939ceb",
    "capability_name": "Accounts, Membership & Entitlement: Who Exists, What They Own, And When Access Ends",
    "story_uid": "story-a55c2f35",
    "ac_uid": "acceptance_criterion-5ada657b",
    "ac_human_id": "AC-2194",
    "ac_summary": "The server refuses a malformed email on a record change with 400 and leaves the row unchanged",
    "failing_uats": [
      "story-a55c2f35 — an owner corrects who somebody is test_UAT_AC2194_a_malformed_email_is_refused_400_and_the_row_is_unchanged"
    ],
    "fix_plan_summary": "# Fix Plan — Iteration 3\n\n## Hypothesis\n`test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates` seeds no contact in the customer business, so `GET /api/people` returns an empty list for both callers. `ownerPeople.people[0].id` at line 409 then throws a TypeError. The production gates are correct; the test fixture is what's broken.\n\n## Analysis\n- **Prior iterations are unrelated.** Iteration 1/2's fix_plan reports (report-a931f6c9, report-06a422ea) targeted AC-1421",
    "resolved": true,
    "description": "A malformed email on a record change was not refused with 400 with the row left unchanged.",
    "severity": "medium"
  },
  {
    "id": "reg-038",
    "capability_uid": "capability-e5939ceb",
    "capability_name": "Accounts, Membership & Entitlement: Who Exists, What They Own, And When Access Ends",
    "story_uid": "story-a55c2f35",
    "ac_uid": "acceptance_criterion-3f2339e0",
    "ac_human_id": "AC-2190",
    "ac_summary": "A malformed email address is refused inline in the panel without being sent",
    "failing_uats": [
      "story-a55c2f35 — an owner corrects who somebody is test_UAT_AC2190_the_server_shape_check_agrees_with_the_panel_rule"
    ],
    "fix_plan_summary": "# Fix Plan — Iteration 3\n\n## Hypothesis\n`test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates` seeds no contact in the customer business, so `GET /api/people` returns an empty list for both callers. `ownerPeople.people[0].id` at line 409 then throws a TypeError. The production gates are correct; the test fixture is what's broken.\n\n## Analysis\n- **Prior iterations are unrelated.** Iteration 1/2's fix_plan reports (report-a931f6c9, report-06a422ea) targeted AC-1421",
    "resolved": true,
    "description": "The panel did not refuse a malformed email inline before sending it.",
    "severity": "low"
  },
  {
    "id": "reg-039",
    "capability_uid": "capability-e5939ceb",
    "capability_name": "Accounts, Membership & Entitlement: Who Exists, What They Own, And When Access Ends",
    "story_uid": "story-a55c2f35",
    "ac_uid": "acceptance_criterion-082830e7",
    "ac_human_id": "AC-2195",
    "ac_summary": "An address already held by someone else in the same business is refused with 400; the same address in another business is accepted",
    "failing_uats": [
      "story-a55c2f35 — an owner corrects who somebody is test_UAT_AC2195_a_duplicate_address_in_the_same_business_is_400_and_another_business_is_fine"
    ],
    "fix_plan_summary": "# Fix Plan — Iteration 3\n\n## Hypothesis\n`test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates` seeds no contact in the customer business, so `GET /api/people` returns an empty list for both callers. `ownerPeople.people[0].id` at line 409 then throws a TypeError. The production gates are correct; the test fixture is what's broken.\n\n## Analysis\n- **Prior iterations are unrelated.** Iteration 1/2's fix_plan reports (report-a931f6c9, report-06a422ea) targeted AC-1421",
    "resolved": true,
    "description": "Duplicate-address handling was wrong: an address held by someone else in the same business was not refused 400, or the same address in another business was not accepted.",
    "severity": "high"
  },
  {
    "id": "reg-040",
    "capability_uid": "capability-e5939ceb",
    "capability_name": "Accounts, Membership & Entitlement: Who Exists, What They Own, And When Access Ends",
    "story_uid": "story-a55c2f35",
    "ac_uid": "acceptance_criterion-b145de56",
    "ac_human_id": "AC-2196",
    "ac_summary": "A record change for an id that is unknown, or that belongs to another business, is the same 404",
    "failing_uats": [
      "story-a55c2f35 — an owner corrects who somebody is test_UAT_AC2196_an_unknown_id_and_an_id_in_another_business_are_the_same_404"
    ],
    "fix_plan_summary": "# Fix Plan — Iteration 3\n\n## Hypothesis\n`test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates` seeds no contact in the customer business, so `GET /api/people` returns an empty list for both callers. `ownerPeople.people[0].id` at line 409 then throws a TypeError. The production gates are correct; the test fixture is what's broken.\n\n## Analysis\n- **Prior iterations are unrelated.** Iteration 1/2's fix_plan reports (report-a931f6c9, report-06a422ea) targeted AC-1421",
    "resolved": true,
    "description": "A record change for an id in another business was not answered with the same 404 as an unknown id, risking a cross-tenant existence oracle.",
    "severity": "critical"
  },
  {
    "id": "reg-041",
    "capability_uid": "capability-e5939ceb",
    "capability_name": "Accounts, Membership & Entitlement: Who Exists, What They Own, And When Access Ends",
    "story_uid": "story-a55c2f35",
    "ac_uid": "acceptance_criterion-68796ba6",
    "ac_human_id": "AC-2197",
    "ac_summary": "A caller who does not own the scoped business is refused 403 when changing a contact's record",
    "failing_uats": [
      "story-a55c2f35 — an owner corrects who somebody is test_UAT_AC2197_a_caller_who_does_not_own_the_scoped_business_is_refused_403"
    ],
    "fix_plan_summary": "# Fix Plan — Iteration 3\n\n## Hypothesis\n`test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates` seeds no contact in the customer business, so `GET /api/people` returns an empty list for both callers. `ownerPeople.people[0].id` at line 409 then throws a TypeError. The production gates are correct; the test fixture is what's broken.\n\n## Analysis\n- **Prior iterations are unrelated.** Iteration 1/2's fix_plan reports (report-a931f6c9, report-06a422ea) targeted AC-1421",
    "resolved": true,
    "description": "A caller who does not own the scoped business was not shown to be refused 403 when changing a contact's record.",
    "severity": "critical"
  },
  {
    "id": "reg-042",
    "capability_uid": "capability-e5939ceb",
    "capability_name": "Accounts, Membership & Entitlement: Who Exists, What They Own, And When Access Ends",
    "story_uid": "story-a55c2f35",
    "ac_uid": "acceptance_criterion-b0cf474c",
    "ac_human_id": "AC-2198",
    "ac_summary": "An operator can open a dated grant that names the business it is about; a grant without a business or plan is refused 400",
    "failing_uats": [
      "story-a55c2f35 — grants test_UAT_AC2198_an_operator_opens_a_dated_grant_naming_its_business_and_one_without_is_400"
    ],
    "fix_plan_summary": "# Fix Plan — Iteration 3\n\n## Hypothesis\n`test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates` seeds no contact in the customer business, so `GET /api/people` returns an empty list for both callers. `ownerPeople.people[0].id` at line 409 then throws a TypeError. The production gates are correct; the test fixture is what's broken.\n\n## Analysis\n- **Prior iterations are unrelated.** Iteration 1/2's fix_plan reports (report-a931f6c9, report-06a422ea) targeted AC-1421",
    "resolved": true,
    "description": "An operator could not open a dated grant naming its business, or a grant missing its business or plan was not refused 400.",
    "severity": "high"
  },
  {
    "id": "reg-043",
    "capability_uid": "capability-e5939ceb",
    "capability_name": "Accounts, Membership & Entitlement: Who Exists, What They Own, And When Access Ends",
    "story_uid": "story-a55c2f35",
    "ac_uid": "acceptance_criterion-3352463f",
    "ac_human_id": "AC-2199",
    "ac_summary": "Withdrawing a grant from a contact's detail marks it revoked and keeps the row, and it no longer confers access",
    "failing_uats": [
      "story-a55c2f35 — grants test_UAT_AC2199_withdrawing_a_grant_keeps_the_row_revoked_and_it_no_longer_confers_access"
    ],
    "fix_plan_summary": "# Fix Plan — Iteration 3\n\n## Hypothesis\n`test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates` seeds no contact in the customer business, so `GET /api/people` returns an empty list for both callers. `ownerPeople.people[0].id` at line 409 then throws a TypeError. The production gates are correct; the test fixture is what's broken.\n\n## Analysis\n- **Prior iterations are unrelated.** Iteration 1/2's fix_plan reports (report-a931f6c9, report-06a422ea) targeted AC-1421",
    "resolved": true,
    "description": "Withdrawing a grant did not mark it revoked while keeping the row, or the revoked grant still conferred access.",
    "severity": "high"
  },
  {
    "id": "reg-044",
    "capability_uid": "capability-e5939ceb",
    "capability_name": "Accounts, Membership & Entitlement: Who Exists, What They Own, And When Access Ends",
    "story_uid": "story-a55c2f35",
    "ac_uid": "acceptance_criterion-7c2d119d",
    "ac_human_id": "AC-2200",
    "ac_summary": "Opening or withdrawing a grant is the 1st Contact operator's act, refused 403 to every other caller including the business's own owner; changing login status stays an owner act",
    "failing_uats": [
      "story-a55c2f35 — grants test_UAT_AC2200_grants_are_the_operators_act_and_refused_403_to_every_customer_owner"
    ],
    "fix_plan_summary": "# Fix Plan — Iteration 3\n\n## Hypothesis\n`test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates` seeds no contact in the customer business, so `GET /api/people` returns an empty list for both callers. `ownerPeople.people[0].id` at line 409 then throws a TypeError. The production gates are correct; the test fixture is what's broken.\n\n## Analysis\n- **Prior iterations are unrelated.** Iteration 1/2's fix_plan reports (report-a931f6c9, report-06a422ea) targeted AC-1421",
    "resolved": true,
    "description": "Opening or withdrawing a grant was not shown to be refused 403 to every caller but the 1st Contact operator, including the business's own owner.",
    "severity": "critical"
  },
  {
    "id": "reg-045",
    "capability_uid": "capability-e5939ceb",
    "capability_name": "Accounts, Membership & Entitlement: Who Exists, What They Own, And When Access Ends",
    "story_uid": "story-a55c2f35",
    "ac_uid": "acceptance_criterion-a302f9c3",
    "ac_human_id": "AC-2233",
    "ac_summary": "A grant may only be opened on or withdrawn from a business within the caller's scope; an id from outside it is refused and nothing is written",
    "failing_uats": [
      "story-a55c2f35 — grants test_UAT_AC2233_a_grant_naming_a_business_outside_the_scope_is_refused_and_nothing_is_written"
    ],
    "fix_plan_summary": "# Fix Plan — Iteration 3\n\n## Hypothesis\n`test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates` seeds no contact in the customer business, so `GET /api/people` returns an empty list for both callers. `ownerPeople.people[0].id` at line 409 then throws a TypeError. The production gates are correct; the test fixture is what's broken.\n\n## Analysis\n- **Prior iterations are unrelated.** Iteration 1/2's fix_plan reports (report-a931f6c9, report-06a422ea) targeted AC-1421",
    "resolved": true,
    "description": "A grant could be opened on or withdrawn from a business outside the caller's scope, or the refusal still wrote something.",
    "severity": "critical"
  },
  {
    "id": "reg-046",
    "capability_uid": "capability-e5939ceb",
    "capability_name": "Accounts, Membership & Entitlement: Who Exists, What They Own, And When Access Ends",
    "story_uid": "story-a55c2f35",
    "ac_uid": "acceptance_criterion-a3fee1fb",
    "ac_human_id": "AC-2201",
    "ac_summary": "Suspending a person's login stops them signing in, and restoring it lets them back in; there is no suspend control in the panel",
    "failing_uats": [
      "story-a55c2f35 — the login control, server-side only test_UAT_AC2201_suspending_refuses_sign_in_and_restoring_readmits"
    ],
    "fix_plan_summary": "# Fix Plan — Iteration 3\n\n## Hypothesis\n`test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates` seeds no contact in the customer business, so `GET /api/people` returns an empty list for both callers. `ownerPeople.people[0].id` at line 409 then throws a TypeError. The production gates are correct; the test fixture is what's broken.\n\n## Analysis\n- **Prior iterations are unrelated.** Iteration 1/2's fix_plan reports (report-a931f6c9, report-06a422ea) targeted AC-1421",
    "resolved": true,
    "description": "Suspending a person's login did not stop them signing in, or restoring it did not let them back in.",
    "severity": "critical"
  },
  {
    "id": "reg-047",
    "capability_uid": "capability-e5939ceb",
    "capability_name": "Accounts, Membership & Entitlement: Who Exists, What They Own, And When Access Ends",
    "story_uid": "story-83ff6262",
    "ac_uid": "acceptance_criterion-7db3c8f3",
    "ac_human_id": "AC-2212",
    "ac_summary": "An admitted account requesting /account receives the portal page of the business it is an account of, regardless of which business it is operating",
    "failing_uats": [
      "story-83ff6262 — which portal an admitted account reaches test_UAT_AC2212_admitted_account_gets_the_host_business_portal_whatever_it_operates"
    ],
    "fix_plan_summary": "# Fix Plan — Iteration 3\n\n## Hypothesis\n`test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates` seeds no contact in the customer business, so `GET /api/people` returns an empty list for both callers. `ownerPeople.people[0].id` at line 409 then throws a TypeError. The production gates are correct; the test fixture is what's broken.\n\n## Analysis\n- **Prior iterations are unrelated.** Iteration 1/2's fix_plan reports (report-a931f6c9, report-06a422ea) targeted AC-1421",
    "resolved": true,
    "description": "An admitted account requesting /account did not receive the portal of the business it belongs to.",
    "severity": "medium"
  },
  {
    "id": "reg-048",
    "capability_uid": "capability-e5939ceb",
    "capability_name": "Accounts, Membership & Entitlement: Who Exists, What They Own, And When Access Ends",
    "story_uid": "story-83ff6262",
    "ac_uid": "acceptance_criterion-d1428271",
    "ac_human_id": "AC-2234",
    "ac_summary": "The portal is the business the caller is an account of (their own row's tenant), never env.TENANT_ID and never the business they operate",
    "failing_uats": [
      "story-83ff6262 — which portal an admitted account reaches test_UAT_AC2234_the_portal_is_the_business_the_caller_is_an_account_of_never_tenant_id"
    ],
    "fix_plan_summary": "# Fix Plan — Iteration 3\n\n## Hypothesis\n`test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates` seeds no contact in the customer business, so `GET /api/people` returns an empty list for both callers. `ownerPeople.people[0].id` at line 409 then throws a TypeError. The production gates are correct; the test fixture is what's broken.\n\n## Analysis\n- **Prior iterations are unrelated.** Iteration 1/2's fix_plan reports (report-a931f6c9, report-06a422ea) targeted AC-1421",
    "resolved": true,
    "description": "The portal was not resolved from the caller's own business, so it could follow TENANT_ID or the operated business instead.",
    "severity": "high"
  },
  {
    "id": "reg-049",
    "capability_uid": "capability-e5939ceb",
    "capability_name": "Accounts, Membership & Entitlement: Who Exists, What They Own, And When Access Ends",
    "story_uid": "story-83ff6262",
    "ac_uid": "acceptance_criterion-067f7304",
    "ac_human_id": "AC-2219",
    "ac_summary": "Pressing Delete account deletes nothing and records nothing: the account still exists afterwards",
    "failing_uats": [
      "story-83ff6262 — using the portal destroys nothing test_UAT_AC2219_delete_account_writes_nothing_and_the_account_still_exists"
    ],
    "fix_plan_summary": "# Fix Plan — Iteration 3\n\n## Hypothesis\n`test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates` seeds no contact in the customer business, so `GET /api/people` returns an empty list for both callers. `ownerPeople.people[0].id` at line 409 then throws a TypeError. The production gates are correct; the test fixture is what's broken.\n\n## Analysis\n- **Prior iterations are unrelated.** Iteration 1/2's fix_plan reports (report-a931f6c9, report-06a422ea) targeted AC-1421",
    "resolved": true,
    "description": "Pressing Delete account could not be shown to delete and record nothing while erasure remains unimplemented.",
    "severity": "medium"
  },
  {
    "id": "reg-050",
    "capability_uid": "capability-e5939ceb",
    "capability_name": "Accounts, Membership & Entitlement: Who Exists, What They Own, And When Access Ends",
    "story_uid": "story-387c9dfe",
    "ac_uid": "acceptance_criterion-d5b6e665",
    "ac_human_id": "AC-2165",
    "ac_summary": "Owning the 1st Contact business is a memberships.role='owner' row, indistinguishable to a caller from owning any other business",
    "failing_uats": [
      "story-387c9dfe — owning 1st Contact is ordinary ownership test_UAT_AC2165_owning_1st_contact_reads_exactly_like_owning_a_salon"
    ],
    "fix_plan_summary": "# Fix Plan — Iteration 3\n\n## Hypothesis\n`test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates` seeds no contact in the customer business, so `GET /api/people` returns an empty list for both callers. `ownerPeople.people[0].id` at line 409 then throws a TypeError. The production gates are correct; the test fixture is what's broken.\n\n## Analysis\n- **Prior iterations are unrelated.** Iteration 1/2's fix_plan reports (report-a931f6c9, report-06a422ea) targeted AC-1421",
    "resolved": true,
    "description": "Owning the 1st Contact business was not an ordinary owner membership indistinguishable from owning any other business.",
    "severity": "high"
  },
  {
    "id": "reg-051",
    "capability_uid": "capability-e5939ceb",
    "capability_name": "Accounts, Membership & Entitlement: Who Exists, What They Own, And When Access Ends",
    "story_uid": "story-387c9dfe",
    "ac_uid": "acceptance_criterion-c307987a",
    "ac_human_id": "AC-2168",
    "ac_summary": "No single predicate answers both 'is this person an owner here' and 'may this person enter a business they are not a member of'",
    "failing_uats": [
      "story-387c9dfe — no single predicate answers both questions test_UAT_AC2168_ownership_and_bypass_are_separately_held_and_neither_implies_the_other"
    ],
    "fix_plan_summary": "# Fix Plan — Iteration 3\n\n## Hypothesis\n`test_UAT_AC2257_a_non_owner_role_is_admitted_and_refused_only_at_the_ownership_gates` seeds no contact in the customer business, so `GET /api/people` returns an empty list for both callers. `ownerPeople.people[0].id` at line 409 then throws a TypeError. The production gates are correct; the test fixture is what's broken.\n\n## Analysis\n- **Prior iterations are unrelated.** Iteration 1/2's fix_plan reports (report-a931f6c9, report-06a422ea) targeted AC-1421",
    "resolved": true,
    "description": "Ownership and the platform bypass were not shown to be separate predicates, risking one check that grants entry to businesses the caller is not a member of.",
    "severity": "critical"
  }
]
