---
uid: report-06a422ea
id: REPORT-10900
type: report
title: 'Report: fix_plan for report-3f77b790'
created_by: xgd
created_at: '2026-11-04T18:46:33.170369+00:00'
updated_at: '2026-11-04T18:46:33.170369+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: report-3f77b790
  fix_iteration: 1
  items:
  - index: 0
    tests:
    - test_UAT_AC2149_admitted_customer_without_privilege_gets_404_and_nothing_is_created
    - test_UAT_AC2152_operator_adds_a_business_and_it_is_immediately_selectable
    - test_UAT_AC2153_adding_a_business_creates_all_four_parts_in_one_operation
    - test_UAT_AC2154_creating_an_account_provisions_its_first_business
    - test_UAT_AC2155_unknown_account_email_is_reported_plainly_with_404
    - test_UAT_AC2156_missing_or_blank_account_email_or_name_is_rejected_with_400
    - test_UAT_AC2157_businesses_payload_carries_exactly_account_and_businesses
    - test_UAT_AC2165_owning_1st_contact_reads_exactly_like_owning_a_salon
    - test_UAT_AC2168_ownership_and_bypass_are_separately_held_and_neither_implies_the_other
    - test_UAT_AC2178_list_is_exactly_the_scoped_business_contacts_included_oldest_first
    - test_UAT_AC2179_row_shows_name_and_address_in_two_cells_or_no_name_yet
    - test_UAT_AC2182_selecting_a_person_opens_a_pane_at_once_that_fills_with_both_sections
    - test_UAT_AC2185_grant_detail_carries_the_business_name_and_keeps_a_vanished_business_by_id
    - test_UAT_AC2188_only_email_and_name_are_editable_and_the_eight_observed_fields_are_locked
    - test_UAT_AC2190_the_server_shape_check_agrees_with_the_panel_rule
    - test_UAT_AC2192_an_owner_corrects_email_and_name_in_any_business_they_own
    - test_UAT_AC2193_a_record_change_is_a_patch_and_ignores_observed_fields
    - test_UAT_AC2194_a_malformed_email_is_refused_400_and_the_row_is_unchanged
    - test_UAT_AC2195_a_duplicate_address_in_the_same_business_is_400_and_another_business_is_fine
    - test_UAT_AC2196_an_unknown_id_and_an_id_in_another_business_are_the_same_404
    - test_UAT_AC2197_a_caller_who_does_not_own_the_scoped_business_is_refused_403
    - test_UAT_AC2198_an_operator_opens_a_dated_grant_naming_its_business_and_one_without_is_400
    - test_UAT_AC2199_withdrawing_a_grant_keeps_the_row_revoked_and_it_no_longer_confers_access
    - test_UAT_AC2200_grants_are_the_operators_act_and_refused_403_to_every_customer_owner
    - test_UAT_AC2200_a_persons_login_status_is_an_owner_act_refused_403_to_a_non_owner
    - test_UAT_AC2201_suspending_refuses_sign_in_and_restoring_readmits
    - test_UAT_AC2212_admitted_account_gets_the_host_business_portal_whatever_it_operates
    - test_UAT_AC2219_delete_account_writes_nothing_and_the_account_still_exists
    - test_UAT_AC2222_account_line_names_the_caller_and_falls_back_to_the_verified_email
    - test_UAT_AC2225_avatar_dialog_links_to_the_portal_in_a_new_tab_and_adds_nothing_else
    - test_UAT_AC2226_portal_offers_no_business_plan_charges_details_or_export_surface_and_no_tenant
    - test_UAT_AC2233_a_grant_naming_a_business_outside_the_scope_is_refused_and_nothing_is_written
    - test_UAT_AC2234_the_portal_is_the_business_the_caller_is_an_account_of_never_tenant_id
    dependency_tests:
    - test_UAT_FC_REQ-191_
    - test_UAT_FC_REQ-193_
    - test_UAT_FC_REQ-194_
    hypothesis: 'The identity reconciliation suites (contacts tab and editing, customer
      portal, business fulfilment, ownership/bypass split) still seed and assert the
      pre-rebaseline schema: users.email, users.display_name, acct_ business ids and
      an ''account'' payload key, all removed by REQ-191/193/194.'
    instructions: 'These suites predate REQ-191/193/194, and the ACs they prove have
      already been reworded to the new shape (AC-2157 ''person'', AC-2179 resolved
      current name / ''No name yet'', AC-2188 primary address plus a separate name-parts
      section). Workerd fails with ''D1_ERROR: no such column: email'' at the raw-SQL
      fixtures (ownership_and_bypass_split.workers.test.ts:85, business_fulfilment.workers.test.ts:163,
      contacts_tab.workers.test.ts:112, customer_portal.workers.test.ts:140). contacts_tab_editing.workers.test.ts
      reads users.display_name. The node panel tests (contacts_tab.test.ts, contacts_tab_editing.test.ts)
      build person fixtures and expect sections in the pre-REQ-193 shape. Bring every
      one of these tests onto the shipped model. Seed contacts through tests/support/contact.ts,
      the single two-row writer REQ-191 introduced; no raw users INSERT carrying an
      address. Resolve a person by address through user_emails. Read and assert names
      through the name table and the panel''s name-parts section. Read the businesses
      payload as ''person''. Mint business ids the way production does (never acct_).
      Production code is right and frozen; each test must end proving its AC''s current
      wording against real code.'
    test_scope: test_UAT_AC2149_ or test_UAT_AC2152_ or test_UAT_AC2153_ or test_UAT_AC2154_
      or test_UAT_AC2155_ or test_UAT_AC2156_ or test_UAT_AC2157_ or test_UAT_AC2165_
      or test_UAT_AC2168_ or test_UAT_AC2178_ or test_UAT_AC2179_ or test_UAT_AC2182_
      or test_UAT_AC2185_ or test_UAT_AC2188_ or test_UAT_AC2190_ or test_UAT_AC2192_
      or test_UAT_AC2193_ or test_UAT_AC2194_ or test_UAT_AC2195_ or test_UAT_AC2196_
      or test_UAT_AC2197_ or test_UAT_AC2198_ or test_UAT_AC2199_ or test_UAT_AC2200_
      or test_UAT_AC2201_ or test_UAT_AC2212_ or test_UAT_AC2219_ or test_UAT_AC2222_
      or test_UAT_AC2225_ or test_UAT_AC2226_ or test_UAT_AC2233_ or test_UAT_AC2234_
      or test_UAT_FC_REQ-191_ or test_UAT_FC_REQ-193_ or test_UAT_FC_REQ-194_
    ladder:
      rung1: 'Decided here: REQ-191 drops users.email, REQ-193 drops users.display_name,
        and REQ-194 frees acct_ and renames the payload key to ''person''; all are
        in scope and later than the stories that wrote these tests.'
      rung2: 'Consistent: reconcile-src-BUNDLE-37:apps/control-app/src/router.ts:2600
        and :2700 emit ''person:'', and the baseline has no users.email.'
      rung3: Not reached; the tests are rewritten to the intents and the code stays.
  - index: 1
    tests:
    - test_UAT_AC1418_publish_mints_renders_and_stores_identically_from_both_front_doors
    - test_UAT_AC1422_a_second_account_cannot_publish_over_a_claimed_slug
    - test_UAT_AC903_a_published_url_serves_the_live_revision_whole
    - test_UAT_AC1423_live_is_recorded_only_in_the_log_and_never_beside_the_bytes
    - test_UAT_AC1424_the_builders_published_view_redirects_to_the_one_serving_path
    - test_UAT_AC1795_both_maps_sit_in_one_landscape_section_clients_first
    - test_UAT_AC1796_a_small_client_corpus_is_listed_in_full_and_labelled_complete
    - test_UAT_AC1797_a_search_fans_out_merges_on_their_own_scores_and_cuts_after
    - test_UAT_AC1798_a_mid_conversation_upload_is_named_next_turn_with_no_map_rebuild
    - test_UAT_AC1799_a_quiet_turn_carries_no_arrival_wording_of_any_kind
    - test_UAT_AC1802_the_boundary_document_and_its_instant_are_not_reported_twice
    - test_UAT_AC1803_a_corrupt_absent_or_empty_bookmark_still_takes_the_turn
    - test_UAT_AC1804_a_document_arriving_in_the_gap_is_announced_on_the_first_turn
    - test_UAT_AC1805_a_resumed_conversation_names_what_arrived_while_it_was_not_served
    - test_UAT_AC1806_a_conversation_is_excluded_from_arrivals_but_not_from_the_corpus
    - test_UAT_AC1807_the_notice_follows_the_maps_the_purpose_the_manual_and_the_site_change
    - test_UAT_AC1808_the_shipped_corpus_is_never_swept_and_a_shipped_only_conversation_runs
    - AC-2237 (orphaned acceptance criterion)
    - AC-2244 (orphaned acceptance criterion)
    - AC-2245 (orphaned acceptance criterion)
    - AC-2246 (orphaned acceptance criterion)
    dependency_tests:
    - test_UAT_FC_BUG-55_
    hypothesis: The publish/serve and two-KB reconciliation suites predate REQ-190
      (opaque site keys, /site/<siteId>/, published_sites and the slug claim deleted,
      starter slug 'unnamed') and BUG-55 (reads through indexes/chunkIndexes keyed
      by source), so they exercise seams the reference state no longer has. The four
      new ACs from those intents have no UAT.
    instructions: 'Publish/serve: reconciliation-published-site-serving.workers.test.ts
      serves /site/${slug}/ and relies on a claim row. Under REQ-190 the published
      address is the site''s opaque key, obtained only through the business-scoped
      TenantSiteStore.siteKey(slug), and published_sites is gone, so serve through
      that key. In reconciliation-publish-revision-cloud.workers.test.ts, test_UAT_AC1422
      proves AC-1422, which is superseded: delete that test, and keep AC1418 green
      on the new keys. Add UATs, through the Worker and real D1/R2: AC-2244 (/site/<siteId>/
      serves; a key for another business is not obtainable through this handle), AC-2245
      (two businesses each publish ''home''; no claim is recorded or consulted) and
      AC-2246 (a new account''s starter site is slug ''unnamed'', named ''Unnamed'',
      and every account publishes it without collision). Two-KB assistant: reconciliation-assistant-two-knowledge-bases.workers.test.ts
      was last edited 2026-09-02, before BUG-55 moved the read seam to indexes/chunkIndexes
      keyed ''shipped''/''project'' and before REQ-190 re-keyed sites. Its ''source:
      shipped'' at line 170 is a KB declaration that BUG-55 keeps; leave it alone.
      It is NOT the priming skew BUG-55 deferred: the repo and the installed ai-knowledge
      have both moved off KnowledgeDocs. Run the suite under workerd, read the actual
      failure, and bring its harness (fixtureRuntime/systemKnowledge bundle, seedSite,
      tenant set-up) onto the current seams. Add a UAT for AC-2237: a search hit from
      each knowledge base, on both the Worker and the Node host, is read back rather
      than refused not_in_corpus. Production code is right and frozen.'
    test_scope: test_UAT_AC1418_ or test_UAT_AC1422_ or test_UAT_AC903_ or test_UAT_AC1423_
      or test_UAT_AC1424_ or test_UAT_AC1795_ or test_UAT_AC1796_ or test_UAT_AC1797_
      or test_UAT_AC1798_ or test_UAT_AC1799_ or test_UAT_AC1802_ or test_UAT_AC1803_
      or test_UAT_AC1804_ or test_UAT_AC1805_ or test_UAT_AC1806_ or test_UAT_AC1807_
      or test_UAT_AC1808_ or test_UAT_AC2237_ or test_UAT_AC2244_ or test_UAT_AC2245_
      or test_UAT_AC2246_ or test_UAT_FC_BUG-55_
    ladder:
      rung1: 'Decided here: REQ-190 makes the published address /site/<siteId>/, deletes
        published_sites and SlugClaimedError (AC-1422 superseded) and names the starter
        ''unnamed''; BUG-55 moves reads to indexes keyed by source. Both are in scope
        and later than the suites.'
      rung2: 'Consistent: the reference state carries BUG-55''s seam (commit f5951fd48a)
        and REQ-190''s site keys and siteKey verb.'
      rung3: Not reached; the stale tests are rewritten or deleted (AC-1422), UATs
        are added for AC-2237/2244/2245/2246, and the code stays.
---

# Fix Plan — Iteration 1

## Hypothesis
Reconciliation suites written by earlier bundles were never moved onto this bundle's rebaselined schema and seams. They still write `users.email` and `users.display_name`, address `/site/<slug>/`, and test the deleted slug claim. The production code is right (it matches REQ-190/191/193/194 and BUG-55), so the tests are what is stale.

## Analysis
The scoped run had 50 failures and 46 orphan ACs. 42 of the orphans are ACs whose only evidence is one of the failing tests. Four have no test at all: AC-2237, AC-2244, AC-2245 and AC-2246. These four are new ACs from this bundle.

The story cycle already rewrote the ACs to the new shape:
- AC-2157 now says `person`.
- AC-2188 has name parts in their own section.
- AC-2179 shows the resolved current name.
- AC-1422 is `superseded`.

The tests were not updated to match. The evidence, file by file:

- `test_reconciliation_ownership_and_bypass_split.workers.test.ts:85` and `test_reconciliation_business_fulfilment.workers.test.ts:163`: `UPDATE users ... WHERE email = ?`. Workerd fails with `D1_ERROR: no such column: email` (seen in the report stdout for AC2165/AC2168).
- `test_reconciliation_contacts_tab.workers.test.ts:112`: `INSERT INTO users (..., email, ...)`.
- `test_reconciliation_customer_portal.workers.test.ts:140`: `SELECT * FROM users WHERE email = ?`. Line 291 also uses an `acct_` business id; under REQ-194 a business id must not be prefixed `acct_`.
- `test_reconciliation_contacts_tab_editing.workers.test.ts:170-336`: reads and asserts `users.display_name`, which REQ-193 dropped.
- Node project, run locally: AC2188, AC2179 and AC2182 fail. Their fixtures and assertions use the pre-REQ-193 single `display_name` and the old 10-row "Who they are" section.
- `reconciliation-published-site-serving.workers.test.ts`: serves `/site/${slug}/` and documents a claim row. REQ-190 makes the published address `/site/<siteId>/` and drops `published_sites`.
- `reconciliation-publish-revision-cloud.workers.test.ts:230`: `test_UAT_AC1422_...claimed_slug` proves a superseded AC. It must be deleted, and AC-2245 needs a UAT in its place.
- `reconciliation-assistant-two-knowledge-bases.workers.test.ts` (AC1795–1808): last edited 2026-09-02, before BUG-55 (09-05) and the REQ-190 re-key. Its `source: 'shipped'` is a KB declaration, which BUG-55 keeps, so that line is correct. The installed shared store no longer has `KnowledgeDocs` (it ships `ai-knowledge/src/priming.js`), and the repo's own code has already migrated off it. So this is not the out-of-scope priming skew; the suite has drifted. I could not see the exact error: this sandbox refuses the local port bind that workerd tests need (`listen EPERM`). The builder must run the suite and read the failure.

The shared fixture is `tests/support/contact.ts`. REQ-191 created it as the one place that writes a contact, which is two rows (`users` plus `user_emails`). The identity suites should seed through it rather than each writing their own INSERT.

No isolation or contamination pattern applies: this is iteration 1, and every failure is deterministic schema drift.

## Spec Changes Made
None. The ACs were already updated by the story cycle (AC-1422 superseded; AC-2157, 2179 and 2188 reworded). Only tests change.

## Weak Evidence Flags (preventative — best effort)
- tests/test_reconciliation_customer_portal.workers.test.ts::test_UAT_AC2219_delete_account_writes_nothing_and_the_account_still_exists — weak-observation — find the account by key, not by `users.email`, and assert the whole row is unchanged.
- tests/test_reconciliation_contacts_tab.workers.test.ts — infra-reuse-gap — the hand-written `INSERT INTO users` duplicates `tests/support/contact.ts`; use the helper.
- tests/test_reconciliation_business_fulfilment.workers.test.ts — infra-reuse-gap — sets `platform_operator` with raw SQL keyed by address; resolve the person through `user_emails` (or the support helper) instead.
- tests/reconciliation-assistant-two-knowledge-bases.workers.test.ts — weak-observation — no case proves a search hit can be read back. That is AC-2237's gap; add it here or in a new file.

## Batches
The plan uses two batches. With 50 failures plus 4 orphan ACs, one batch would exceed the context budget. The two file sets do not overlap: batch 0 is identity (users, contacts, portal, fulfilment, ownership) over `tests/support/contact.ts` and `person.ts`; batch 1 is site storage and knowledge over `tests/support/d1-site-factory.ts` and `site-seed.ts`. The knowledge suite is in batch 1 because it seeds sites through the same site store that the publish and serve suites use, so changes to the site-key support would touch both.

- **Batch 0 — identity suites onto REQ-191/193/194.** Move every fixture and assertion off `users.email`, `users.display_name` and `acct_` business ids. Seed contacts through `tests/support/contact.ts`. Read names through the name table, and read the businesses payload as `person`.
- **Batch 1 — publishing, serving and the two-KB assistant onto REQ-190 and BUG-55.**
  - Delete the AC-1422 test.
  - Move the serving tests to `/site/<siteId>/` obtained through `TenantSiteStore.siteKey`.
  - Add UATs for AC-2244, AC-2245 and AC-2246.
  - Bring the two-KB suite onto the post-BUG-55 and post-REQ-190 seams.
  - Add a UAT for AC-2237.

## Resolution ladder (REQ-938)
- **Batch 0, rung 1 decides.** REQ-191 drops `users.email`, REQ-193 drops `users.display_name`, and REQ-194 says no `acct_` id is a business and `/api/businesses` says `person`. These intents are in scope and later than the stories that wrote the tests. At rung 2, `git show reconcile-src-BUNDLE-37:apps/control-app/src/router.ts` shows `person:` at lines 2600 and 2700. Rung 3: the tests do not stand and are rewritten; the code stays.
- **Batch 1, rung 1 decides.** REQ-190 says the published address is `/site/<siteId>/`, `published_sites` and `SlugClaimedError` are deleted, and the starter slug is `unnamed`. BUG-55 says reads go through `indexes`/`chunkIndexes` keyed `shipped` and `project`. At rung 2, the reference state carries the BUG-55 seam (commit f5951fd48a) and REQ-190's site keys. Rung 3: the tests do not stand and are rewritten; the code stays.

No mode overrides were granted, and no blocked_by request was pending.
