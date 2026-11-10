---
uid: report-0ddcefe6
id: REPORT-12086
type: report
title: 'Reconciliation Review: commits (BUNDLE-44)'
created_by: xgd
created_at: '2026-11-10T00:46:07.432855+00:00'
updated_at: '2026-11-10T00:46:07.432855+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: reconciliation_review
  subject_uid: bundle-374f88d6
  anchor_uid: bundle-374f88d6
  overrides_audited: 1
  trust_boundary_overrides: 0
  gaps:
  - id: G1
    kind: stale_story_claim
    story_uid: story-58b2cec4
    summary: STORY-157 still says the BUG-80 lease and shot are unwrapped. Override
      report-c0389fea has since wrapped them.
    remediation: In story-58b2cec4, retitle the section 'Code issue flagged - two
      browser interactions on the stored-picture path are not wrapped (BUG-80)' to
      RESOLVED, citing code_frozen override report-c0389fea (screenshot.ts:321-361,
      factory() and driver.screenshot now go through unrenderable()). Rewrite the
      Technical Context bullet 'navigate, every chunk query and the decode query sit
      in one try' so it names the lease and the shot too, and says the deliberate
      decode refusal is thrown outside the wrapped regions.
  - id: G2
    kind: evidence_insufficient
    ac: AC-2565 (acceptance_criterion-57778c84)
    story_uid: story-58b2cec4
    summary: AC-2565 claims a failed browser lease is bounded, but no UAT case makes
      factory() reject. Reverting the lease wrap would still pass.
    remediation: 'In tests/reconciliation-stored-picture-delivery.test.ts, test_UAT_AC2565_navigate_delivery_shot_and_novel_failures_are_bounded_named_refusals_and_the_browser_is_released:
      add case (e). The driver factory rejects with a message carrying a multi-MB
      data: URL and base64 payload. Assert that rasterizeImage throws ImageNotRenderableError
      naming the picture, with no data: URL, no base64 run of 120+ characters, a diagnosis
      of at most 400 characters, and the driver''s own code kept. Add the lease case
      to the AC''s Verification list.'
  - id: G3
    kind: unactivated_acs_without_uat
    acs:
    - AC-2569 (acceptance_criterion-9b0c0a93)
    - AC-2570 (acceptance_criterion-a193c964)
    - AC-2571 (acceptance_criterion-23a7433e)
    - AC-2572 (acceptance_criterion-ce27ecb1)
    - AC-2594 (acceptance_criterion-4a01e933)
    stories:
    - story-b3de4571 (STORY-107, plan item 2)
    - story-44d0a572 (STORY-174, plan item 8)
    summary: 'The ACs for write_image''s half of REQ-217 and for BUG-83''s marked-points
      hover are still status: pending, and no test_UAT_AC{N}_* exists for any of them.
      So plan items 2 (write_image display line, surface v9 prose, the 1c CLI''s lack
      of a line, chat-pane bounds) and 8 (hover) have no AC-linked evidence.'
    remediation: 'Create AC-linked UATs from the existing free-coded evidence, then
      activate the five ACs. Sources: tests/test_UAT_FC_REQ-217_a_picture_in_the_conversation.test.ts
      (write_image_hands_back_the_line_to_paste, a_redraw_points_at_the_same_picture,
      no_surface_to_show_it_means_no_line, the_line_is_ordinary_markdown_the_sanitiser_already_allows,
      the_surface_tells_the_model_to_paste_it_verbatim, a_picture_in_a_turn_is_bounded_by_the_pane)
      and .workers.test.ts (a_drawing_the_turn_made_is_fetchable_from_the_turn), which
      give test_UAT_AC2569_/AC2570_/AC2571_/AC2572_; and tests/test_UAT_FC_BUG-83_suite_is_evidence_again.test.ts
      (the_dimmed_hover_still_selects_a_stamped_segment), which gives test_UAT_AC2594_.
      AC-2594 also needs assertions that turning the mode off restores the render''s
      hover outline and that the injected stylesheet does not contain the region-stamp
      attribute name. As the plan''s FC mapping requires, rename BUG-83''s helper-only
      tests (selector_layout_is_not_a_behaviour_an_assertion_can_pin, a_channel_the_reader_does_not_cover_is_reported_as_absent,
      a_request_with_no_trailing_user_message_reads_as_empty) as non-UAT support tests,
      or fold them into the AC-2364 and AC-2594 UATs.'
---

# Reconciliation Review: Story Coverage

**Result**: FAIL
**Mode**: commits
**Surface**: (none)
**Anchor**: bundle-374f88d6
**Stories Reviewed**: 10. These are the 8 named stories plus STORY-107 (story-b3de4571) and STORY-174 (story-44d0a572), which plan items 2 and 8 also target.

## Intent

BUNDLE-44 bundles 7 tickets:
- **BUG-80:** a stored-picture render is bounded and delivered without a URL ceiling.
- **REQ-217:** a picture made in a turn appears in that turn.
- **BUG-83:** suite repair, whose product-visible part is the reminder channel and the marked-points hover.
- **BUG-76:** account-chrome v2, strict behavior keys, and localised slot errors.
- **REQ-228:** the assistant reads the business's tickets and the Library catalogue, and gets `place_on_site`.
- **BUG-84:** a sha256 gate on capture-mirrored bytes at `1c push` and `POST /api/import`.
- **REQ-229:** the edit recipe reaches the published site.

The operator decisions (REQ-228 2026-09-11; REQ-229 EPIC-1 2026-09-11/12; BUG-76 'change the contract') were read and are reflected in the stories.

## Behavior Inventory

32 behaviors were identified across the 11 commits. The 4 version-bump commits carry no behavior.

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | Constant shell URL and chunked base64 delivery (BUG-80) | Covered | story-58b2cec4 | AC-2564, AC-2485 |
| 2 | Every driver failure becomes a bounded ImageNotRenderableError, including the lease and shot (override c0389fea) | Partial | story-58b2cec4 | Story text is stale (G1). The lease case has no UAT (G2). |
| 3 | 64 MiB ceiling checked before the lease; media type sanitised | Covered | story-58b2cec4 | AC-2566 |
| 4 | create_image display line, scoped by businessPath | Covered | story-39c992d3 | AC-2567, AC-2568 |
| 5 | write_image display line, surface v9 prose, no line on 1c, chat-pane img bounds | Partial | story-b3de4571 | Documented, but AC-2569..2572 are pending with no AC-linked UAT (G3) |
| 6 | Reminder rides the tail of the last user message, in both wire shapes | Covered | story-3cf3d57b | AC-2364 amended |
| 7 | Marked-points hover dims without restating the region stamp | Partial | story-44d0a572 | AC-2594 is pending with no AC-linked UAT (G3) |
| 8 | account-chrome v2: labelMode, label element, invariantPresentation | Covered | story-179b8c06 | AC-2573 |
| 9 | Required sent/error slots; one-of-three overlay; status-blind | Covered | story-179b8c06 | AC-2330 and AC-2331 rewritten in place |
| 10 | Undeclared config/slot keys refused at write; stored stray keys still render | Covered | story-179b8c06 | AC-2574 |
| 11 | Slot-error localisation, unknown-kind listing, up to 10 errors plus a count | Covered | story-179b8c06 | AC-2575; cap recorded as a decision |
| 12 | list_library / get_library_item over listMaterial: filters, page of 20, total and more | Covered | story-a0b20525 | AC-2576..2581 |
| 13 | place_on_site with a separate PlaceOnSite grant; NOT_REPUBLISHABLE; rename around taken names | Covered | story-a0b20525 | AC-2582..2585 |
| 14 | Ticket surface with ReadTickets only; absent on the 1c CLI | Covered | story-a58a0974 | AC-2586, AC-2587 |
| 15 | sha256 mirrored-asset gate at 1c push, with no override | Covered | story-aacb7060 | AC-2588 |
| 16 | Import gate answers 403 before createDraft, distinct from 409 | Covered | story-aacb7060 | AC-2589 |
| 17 | Promotion applies the recipe and records placed_as | Covered | story-ed976856 | AC-2590 |
| 18 | Recipe change re-promotes in place (editAssetReplace); edit_image shares the path | Covered | story-ed976856 | AC-2591 |
| 19 | Repeat promotion overwrites; a missing placement is reported, not re-added | Covered | story-ed976856 | AC-2592, AC-2593; AC-1711 narrowed |

## Ungrounded Stories

None. No story claims behavior that neither the intent nor the code supports. One story claim is now false, though: STORY-157 says the lease and shot are unwrapped, and the code wraps them (G1).

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. Stored-picture screenshot (BUG-80) | story-58b2cec4 | ✓ updated |
| 2. Picture in the turn (REQ-217) | story-39c992d3, story-b3de4571 | ✓ both updated; story-b3de4571's ACs pending (G3) |
| 3. account-chrome v2 + strict validation (BUG-76) | story-179b8c06 | ✓ |
| 4. Library catalogue + place_on_site (REQ-228 B/C) | story-a0b20525 (new feature) | ✓ |
| 5. Assistant reads tickets (REQ-228 A) | story-a58a0974 | ✓ |
| 6. Mirrored-asset gate (BUG-84) | story-aacb7060 | ✓ |
| 7. Recipe reaches the site (REQ-229) | story-ed976856, story-aacb7060 | ✓ |
| 8. Reminder channel + hover (BUG-83) | story-3cf3d57b, story-44d0a572 | ✓ both updated; AC-2594 pending (G3) |

No plan item was dropped.

## Supersession Check (Step 4c)

PASS. BUG-76 states the account-chrome v1 supersession unambiguously, and it was handled by rewriting AC-2331 and AC-2330 in place. Both still hold in substance, and the story's Reconciliation Decisions record this. No active AC in the branch or main store still pins `sentMessage` or 'field and submit disabled'. BUG-80 supersedes REQ-218's inline-wrapper verification of AC-2485; that AC was rewritten and is recorded. REQ-229 lifted STORY-178's out-of-scope entry and its open-contradiction note, and AC-1711 was narrowed, both recorded.

## Mode Override Audit

1 override audited, 0 touched a trust boundary.

report-c0389fea (code_frozen, batch 1, rung 1, story-58b2cec4):
1. `unnamed_files_touched` is empty; only screenshot.ts changed. **PASS**
2. The scoped quality report report-d6cba09d passed after the change: 269 tests, 0 failed, including AC2565, AC2485 and the BUG-80 FC suite. **PASS**
3. The change is consistent with BUG-80 Fix item 2 ('every browser interaction on this path is wrapped') and with AC-2565. **PASS**
4. The diff stayed in the planner's scope: the lease and shot are wrapped, the decode refusal is not re-wrapped, the finally still closes the driver, and nothing else changed. **PASS**
5. `trust_boundary_touched` is false. **PASS**
6. Rung 1; the diff edits only the named file and adds no behavior that no AC demands. **PASS**

The override is not misjudged. One unease: the lease half of the change has no test (G2).

## Judgment Calls

- **G1 is material.** A developer reading STORY-157 is told the BUG-80 guarantee is broken on the lease and shot, and that `fix_uat_coverage` still has to act. Both are false since report-c0389fea. The story must say the issue is resolved.
- **G2 is material.** AC-2565 explicitly lists 'leasing the browser'. Every other path has a rejecting-driver case; the lease has none. Moving `factory()` back outside the wrap would keep every UAT green.
- **G3 is material.** Five ACs carrying REQ-217's write_image half and BUG-83's hover are pending with no AC-named UAT, so those behaviors have no matrix evidence. The free-coded suites already exercise most of it and can be retargeted. The plan's instruction to rename BUG-83's helper-only 'UAT' tests was not carried out.
- **Acceptable, recorded as a decision:** STORY-179's text filter searches the title, filename and aliases, not the full description body. The intent says 'text the describer or the client wrote', and the describer's title is such text. The narrowing and a future upgrade are recorded under Reconciliation Decisions.
- **Acceptable, flagged rather than absorbed:** STORY-178 records as an open assumption (intent resolve: unsettled) that edit_image does not return the per-placement report. REQ-229 places the report 'beside the row the edit returns', which reads naturally as the client's recipe route. It is not unambiguous enough to fail on. The operator should confirm whether the assistant's turn must carry it ('says so on the turn it happens').
- **Acceptable, flagged rather than absorbed:** STORY-143 records the CLI's Access-advice text on a rights 403 as a code issue. The response body still names the asset and bundle, so BUG-84's distinguishability criterion is met.
- **Acceptable, recorded:** STORY-143 says the seed/push refusal names the first offending asset, not every one. BUG-84 itself says 'names the offending asset'.

## Verdict

FAIL: coverage and evidence gaps found. The fix loop should address:
- **G1:** STORY-157 still describes the BUG-80 lease and shot as unwrapped; mark it resolved under report-c0389fea.
- **G2:** AC-2565's lease case has no UAT; add a rejecting-factory case.
- **G3:** AC-2569, AC-2570, AC-2571, AC-2572 (STORY-107) and AC-2594 (STORY-174) are pending with no `test_UAT_AC{N}_*`. Retarget the REQ-217 and BUG-83 free-coded tests to them and activate the ACs. Everything else, including intent fidelity across all 8 plan items and the override audit, passes.
