---
uid: report-64693a9f
id: REPORT-7587
type: report
title: 'Report: fix_plan for story-1500b111'
created_by: xgd
created_at: '2026-11-01T12:16:16.363148+00:00'
updated_at: '2026-11-01T12:16:16.363148+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-1500b111
  fix_iteration: 2
  items:
  - index: 0
    tests:
    - AC-1723 (orphaned acceptance criterion)
    - AC-2019 (orphaned acceptance criterion)
    - AC-1722 (orphaned acceptance criterion)
    - AC-1813 (orphaned acceptance criterion)
    - AC-1719 (orphaned acceptance criterion)
    - AC-1720 (orphaned acceptance criterion)
    - AC-1721 (orphaned acceptance criterion)
    - AC-1724 (orphaned acceptance criterion)
    - tests/reconciliation-library-capture-detail.test.ts::test_UAT_AC2086_the_count_replaces_the_file_field_once_known_and_the_download_is_the_screenshot
    - tests/reconciliation-library-placement-and-row.test.ts::test_UAT_AC1715_every_placement_is_listed_and_only_material_placed_on_the_open_site_is_badged
    - tests/reconciliation-library-placement-and-row.test.ts::test_UAT_AC1716_role_kind_placement_and_text_narrow_conjunctively_over_one_listing
    - tests/reconciliation-library-placement-and-row.test.ts::test_UAT_AC2018_badge_used_on_row_and_filter_agree_on_every_row_across_a_site_switch
    - tests/reconciliation-library-placement-and-row.test.ts::test_UAT_AC2019_each_row_leads_with_one_labelled_type_icon_and_carries_no_kind_pill
    - tests/reconciliation-library-tab.test.ts::test_UAT_AC1715_the_list_spans_every_binding_and_only_the_open_site_row_is_badged
    - tests/reconciliation-library-tab.test.ts::test_UAT_AC1716_role_kind_used_here_and_typed_text_narrow_conjunctively_without_refetching
    - tests/reconciliation-library-tab.test.ts::test_UAT_AC1717_detail_shows_the_file_and_offers_no_control_that_asserts_rights
    - tests/reconciliation-library-capture-file.workers.test.ts::test_UAT_AC1723_a_named_member_returns_its_own_bytes_type_and_name_and_an_unheld_member_is_refused_by_name
    - tests/reconciliation-library-surface.workers.test.ts::test_UAT_AC1722_list_returns_bodiless_rows_newest_first_and_the_item_adds_the_description
    - tests/reconciliation-library-surface.workers.test.ts::test_UAT_AC1723_the_file_route_returns_the_stored_bytes_inline_under_their_own_name
    - tests/reconciliation-library-surface.workers.test.ts::test_UAT_AC1724_every_library_operation_answers_not_found_and_leaves_the_named_record_alone
    - tests/reconciliation-library-surface.workers.test.ts::test_UAT_AC1721_empty_and_whitespace_only_corrections_are_refused_with_their_reason
    - tests/reconciliation-library-surface.workers.test.ts::test_UAT_AC1720_a_corrected_description_is_credited_to_the_client_and_leaves_the_redescribe_backlog
    - tests/reconciliation-library-surface.workers.test.ts::test_UAT_AC1719_search_finds_the_material_by_the_new_words_and_not_by_the_superseded_ones
    - tests/reconciliation-material-row-content-type.workers.test.ts::test_UAT_AC1813_the_row_carries_the_resolved_content_type_and_the_list_record_and_file_agree
    dependency_tests:
    - tests/reconciliation-library-badges-the-exception.test.ts::test_UAT_AC1715_whole_business_listed_unbadged_and_a_business_switch_leaves_no_previous_row
    - tests/reconciliation-library-badges-the-exception.test.ts::test_UAT_AC1716_role_kind_and_text_narrow_conjunctively_with_no_refetch_and_no_used_here_filter
    - tests/reconciliation-library-badges-the-exception.test.ts::test_UAT_AC1717_detail_shows_the_file_with_a_download_and_a_read_only_record_under_placed_on
    - tests/reconciliation-library-badges-the-exception.test.ts::test_UAT_AC2018_warning_and_placed_on_row_agree_on_every_row
    - tests/reconciliation-library-badges-the-exception.test.ts::test_UAT_AC2161_only_unplaced_site_assets_carry_a_worded_danger_coloured_warning
    - tests/reconciliation-library-tab.test.ts::test_UAT_AC1714_library_tab_is_the_workspace_split_list_detail_with_filters_in_the_list_header
    - tests/reconciliation-library-tab.test.ts::test_UAT_AC1718_undescribed_material_says_so_and_the_committed_correction_is_stored
    - tests/reconciliation-library-capture-detail.test.ts::test_UAT_AC2085_the_preview_is_the_named_screenshot_member_with_no_reader_and_a_missing_screenshot_says_so
    - tests/reconciliation-library-capture-detail.test.ts::test_UAT_AC2087_description_links_open_in_a_new_context_without_opener_or_referrer_after_every_repaint
    hypothesis: 'The failing tests assert contracts that in-scope intents replaced:
      REQ-181 removed the placement badge and the used-here filter and relabelled
      Used on to Placed on, and REQ-168 made route() take (request, env, scope, deps)
      and ticketStoreFor/projectKnowledgeFor take (env, scope). The tests still pass
      deps in the scope slot and assert the BUG-47-era badge design.'
    instructions: |-
      Test-only reconciliation. The production code is correct, so do not touch it. The iteration-1 rewrite moved tests to BUG-47's placed_on with a 'Used on' label; that is one intent short and is why they failed again. Converge on REQ-181 and REQ-168.

      (A) Node, REQ-181. reconciliation-library-badges-the-exception.test.ts already proves AC-1715, AC-1716, AC-1717 and AC-2018 against the current design (no placement pill, no hereOnly checkbox, a 'Not on the site' --unplaced warning only when role is site and placed_on is empty, and a 'Placed on' detail label).
      - Delete these as superseded duplicates whose ACs stay covered by that file: the AC1715/AC1716/AC1717 tests in reconciliation-library-tab.test.ts and the AC1715/AC1716/AC2018 tests in reconciliation-library-placement-and-row.test.ts. Before deleting each one, confirm its AC's current body (xgd ticket get) is what the badges file asserts. If any distinct claim in a deleted test is still in the AC and not covered, move it into the badges file.
      - Keep AC2019 and fix it against the AC-2019 text rewritten this iteration: a row's pills may be only its role pill or the --unplaced warning, never a kind pill or a placement badge.
      - Fix AC2086 to expect 'Placed on' among the record labels; AC-2086's verification was corrected this iteration.
      - Strip fixture or mount residue the deleted tests needed (getSite, site_slug, hereOnly) only if no remaining test uses it.

      (B) Workers, REQ-168. In reconciliation-library-surface, reconciliation-library-capture-file and reconciliation-material-row-content-type, pass a Scope ({ businessId: tenant }) as the third argument of every route() call, before deps. Pass it as the second argument of every ticketStoreFor() and projectKnowledgeFor() call. Follow tests/test_UAT_FC_REQ-163_ingestion.workers.test.ts (scopeOf). Cross-account claims (AC1722's other-business list and read, AC1724's not-found) must use a different business's scope, not a different TENANT_ID: the scope now decides the business, and TENANT_ID is no longer read. Keep every assertion's strength. Once the calls are right, AC1720's description_status and AC1723's 200 should hold; if either still fails, read the response body before changing an expectation.

      Done means all 16 tests are green or deleted with their AC still covered, and the 8 orphan ACs have a passing test.
    ladder:
      rung1: 'Decided here: REQ-181 (in scope, later than BUG-47, REQ-161 and REQ-176)
        removes the placement badge and the used-here filter and relabels the field
        ''Placed on''; REQ-168 (in scope) makes the business come from the resolved
        Scope, so route() and ticketStoreFor() take a Scope argument.'
      rung2: 'The reference state agrees: library.js has no --here badge, hereOnly
        or getSite, the detail label is ''Placed on'', and router.ts:815 and tickets.ts:463
        take a scope, so nothing in production changes.'
      rung3: Not reached; the stale tests change to match the winning intents and
        the code stands.
    test_scope: test_UAT_AC1714_ or test_UAT_AC1715_ or test_UAT_AC1716_ or test_UAT_AC1717_
      or test_UAT_AC1718_ or test_UAT_AC1719_ or test_UAT_AC1720_ or test_UAT_AC1721_
      or test_UAT_AC1722_ or test_UAT_AC1723_ or test_UAT_AC1724_ or test_UAT_AC1813_
      or test_UAT_AC2018_ or test_UAT_AC2019_ or test_UAT_AC2085_ or test_UAT_AC2086_
      or test_UAT_AC2087_ or test_UAT_AC2161_
---

# Fix Plan — Iteration 2

## Hypothesis
The failing story-1500b111 tests encode two contracts that intents in this bundle replaced: REQ-181 removed the "On this site" badge and the used-here filter and relabelled *Used on* to *Placed on*, and REQ-168 changed `route(request, env, deps)` to `route(request, env, scope, deps)` and `ticketStoreFor(env)` to `ticketStoreFor(env, scope)`. The tests were never moved to either contract.

## Analysis
Two independent families, both fixed in tests only. No production code is wrong.

**A. Node / browser surface (8 failures). Stale against REQ-181.** Observed failures:
- `reconciliation-library-tab.test.ts`:
  - AC1715: expected 1 badged row, got 0.
  - AC1716: the `hereOnly` checkbox is null.
  - AC1717: expected an empty placement value, got `Placed on—`.
- `reconciliation-library-placement-and-row.test.ts`:
  - AC1715 and AC2018: expected `['on-both-sites','placed-here']` badged, got `[]`.
  - AC1716: the checkbox is null.
  - AC2019: `unexpected pill builder-library__badge--unplaced`.
- `reconciliation-library-capture-detail.test.ts`:
  - AC2086: the record labels are expected to include `Used on`.

The production code (`library.js`) does what REQ-181 §1–§5 and its "What landed" section say. There is no placement pill. A `--unplaced` "Not on the site" warning shows only when role is site and placement is empty. There is no "used on this site" filter. The detail label is `Placed on`. The newer `reconciliation-library-badges-the-exception.test.ts` already proves AC-1715, AC-1716, AC-1717, AC-2018, AC-2020 and AC-2161 against this design, and it passes. The failing tests are therefore superseded duplicates or stale assertions, not evidence of a code defect.

**Why iteration 1 did not converge:** the batch-0 builder rewrote `reconciliation-library-tab.test.ts` to BUG-47's `placed_on` with a *Used on* label. That is one intent short. REQ-181 is later, and it removes the badge and the filter outright. Re-wording those tests toward BUG-47 again would fail again.

**B. Workers surface (8 failures). Stale against REQ-168.** `route()` (router.ts:815) is now `(request, env, scope: Scope | null, deps, ctx)`. `ticketStoreFor` (tickets.ts:463) is `(env, scope)`, and `projectKnowledgeFor` also takes a scope. The library workers tests still call `route(req, routerEnv(tenant), deps())`, so `deps` lands in the scope slot. `reconciliation-library-capture-file.workers.test.ts` passes `{}`. Every downstream symptom follows from this:
- `scope.businessId` is undefined (`Cannot read properties of undefined (reading 'businessId')` at tickets.ts:464).
- D1 is asked to bind `undefined` (`D1_TYPE_ERROR` in `Accessor.getTenant`).
- 500 on the file route.
- A null row in the AC1722 listing.
- `description_status` reads undefined in AC1720.

`routerEnv`'s `TENANT_ID` is configuration that REQ-168 stopped consulting, so it no longer identifies the business. The working pattern is already in the tree: `tests/test_UAT_FC_REQ-163_ingestion.workers.test.ts` passes `scopeOf(TENANT)` (`{ businessId }`) to both `route` and `ticketStoreFor`.

**Orphan ACs (8).** AC-1719, 1720, 1721, 1722, 1723, 1724, 1813 and 2019 are orphaned only because their sole tests fail. They clear when family B and the AC2019 test pass. No AC is to be deprecated.

**Isolation:** not relevant. Every failure is deterministic and explained by the signature or contract drift above.

## Spec Changes Made
- **AC-2019** (acceptance_criterion-e625bfde): rewrote the body. "The role pill and the 'On this site' placement badge remain" now reads "the only pills a row may carry are the role pill and, on an unplaced site-role row, the 'Not on the site' warning; no placement badge". Verification was updated to match. The note cites REQ-181.
- **AC-2086** (acceptance_criterion-c2403fb6): the verification's record-row list now says *Placed on* instead of *used-on*. The note cites REQ-181.
- AC-1715 and AC-1717 were checked and already follow REQ-181. No change.

## Weak Evidence Flags (preventative — best effort)
- `tests/reconciliation-library-tab.test.ts::test_UAT_AC1714_library_tab_is_the_workspace_split_list_detail_with_filters_in_the_list_header` — infra-reuse-gap / drift — it shares a mount fixture that may still supply `getSite` and the `site_slug`/`hereOnly` shape REQ-181 removed. When the superseded tests leave, trim the fixture to the business-scoped mount `badges-the-exception` uses.
- `tests/reconciliation-library-tab.test.ts::test_UAT_AC1718_undescribed_material_says_so_and_the_committed_correction_is_stored` — infra-reuse-gap — same shared fixture; same suggestion.
- `tests/test_UAT_FC_REQ-163_ingestion.workers.test.ts` (routerEnv) — weak-observation — it still sets `TENANT_ID`, which REQ-168 no longer reads. That is harmless, but it implies the env picks the tenant. Consider dropping it so no test suggests configuration chooses the business.

## Batches
One batch. Both families are test-only, all 16 failures and 8 orphans belong to one story's ACs, and keeping AC coverage in one context stops the builder deleting a duplicate test without confirming its AC is still covered. The node and workers files are disjoint, but a split buys nothing at 7 test files.

## Resolution ladder (REQ-938)
**Batch 0 — decided at rung 1.**
- REQ-181 is in scope and later than BUG-47, REQ-161 and REQ-176. It removes the placement badge and the used-here filter and relabels the field *Placed on*.
- REQ-168 is in scope. It makes the business come from the resolved Scope and not from `TENANT_ID`, so `route` and `ticketStoreFor` take a `Scope`.
- Rung 2 agrees: the code reflects both intents (library.js has no `--here`/`hereOnly`, router.ts:815 and tickets.ts:463 take a scope), so nothing in production changes.
- Under rung 3, the tests change to match the winning intents.
- No `blocked_by` was reported in iteration 1, so there is no ruling to make.
