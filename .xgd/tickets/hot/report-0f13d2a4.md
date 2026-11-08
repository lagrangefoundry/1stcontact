---
uid: report-0f13d2a4
id: REPORT-11483
type: report
title: 'Report: fix_plan for STORY-99'
created_by: xgd
created_at: '2026-11-08T14:50:59.229671+00:00'
updated_at: '2026-11-08T14:50:59.229671+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: STORY-99
  fix_iteration: 2
  items:
  - index: 0
    tests:
    - story-e674c60a — every text-bearing builder control is one size test_UAT_AC2232_every_text_bearing_builder_control_resolves_to_the_control_token_through_its_mounted_ancestry
    - story-e674c60a — the chrome controls share one size test_UAT_AC2232_every_chrome_control_resolves_to_the_single_control_font_size_token_last
    - story-e674c60a — the businesses endpoint test_UAT_AC2144_businesses_endpoint_reports_account_and_every_membership_in_one_call
    - story-e674c60a — the deployed workspace, with nothing running locally test_UAT_AC1402_a_local_site_copies_up_idempotently_through_the_serving_store
    - 'story-e674c60a component scope: one name, written once test_UAT_AC960_component_scope_is_written_in_exactly_one_place'
    - story-e674c60a — shell chrome carries the scope test_UAT_AC2143_shell_header_carries_switcher_and_avatar_and_no_tab_is_unscoped
    - story-e674c60a — an account with nothing selectable test_UAT_AC2146_no_selectable_business_blocks_tabs_keeps_chrome_and_asks_no_site_list
    - story-e674c60a — an ended session says so test_UAT_AC2230_expired_session_replaces_builder_at_load_and_strips_a_live_shell_mid_session
    - story-e674c60a — only a refused session counts test_UAT_AC2231_non_401_failures_keep_their_defaults_and_a_valid_session_is_never_told_it_ended
    - story-e674c60a builder origin test_UAT_AC977_every_response_the_origin_returns_is_non_cacheable
    dependency_tests:
    - test_UAT_AC2463_
    - test_UAT_AC2336_
    - test_UAT_AC2339_
    - test_UAT_AC2367_
    - test_UAT_AC2409_
    - test_UAT_FC_BUG-53_
    - test_UAT_FC_BUG-58_
    - test_UAT_FC_REQ-199_
    hypothesis: 'apps/control-app/src/builder/builder.css''s .builder-people__subject/.builder-people__tolist/.builder-people__body
      rule (working tree lines 2041-2053) ends with a literal font-size: 13px instead
      of var(--builder-control-font-size), which AC-2232 forbids; the test is right
      and the CSS is wrong.'
    instructions: 'The only remaining failure is AC-2232''s mounted-ancestry typography
      test, which reports the Invite composer''s Subject input and To-list/Body textareas
      as ''sized, but not by the control token → 13px''. The builder''s iteration-1
      diagnosis holds and is now unblocked by the code_frozen override on builder.css:
      in the `.builder-people__subject, .builder-people__tolist, .builder-people__body`
      rule (working tree builder.css:2041-2053), replace the trailing literal `font-size:
      13px;` with `font-size: var(--builder-control-font-size);`, keeping it immediately
      after `font: inherit;` as AC-2232''s source-order clause requires. Change nothing
      else in the stylesheet. Leave the test and AC-2232 alone. The other nine tests
      were fixed in iteration 1 as stale tests (person rename per REQ-194, site_assets
      by site_id, WEBUI_SCOPE, three Contacts dialogs, /api/material/changes probe).
      Confirm they are still green and do not rework them. Ignore AC965''s wrangler/api.cloudflare.com
      timeout: it is a sandbox network limit and not in this batch.'
    test_scope: test_UAT_AC2232_ or test_UAT_AC2144_ or test_UAT_AC1402_ or test_UAT_AC960_
      or test_UAT_AC2143_ or test_UAT_AC2146_ or test_UAT_AC2230_ or test_UAT_AC2231_
      or test_UAT_AC977_ or test_UAT_AC2463_ or test_UAT_AC2336_ or test_UAT_AC2339_
      or test_UAT_AC2367_ or test_UAT_AC2409_ or test_UAT_FC_BUG-53_ or test_UAT_FC_BUG-58_
      or test_UAT_FC_REQ-199_
    ladder:
      rung1: No intent in scope addresses the Invite composer fields' type size; AC-2232
        (story-e674c60a) requires every Contacts dialog input to take --builder-control-font-size
        and forbids restating it as a literal — rung 1 does not decide.
      rung2: At reconcile-src-BUNDLE-41 builder.css:4082-4094 paints the composer
        fields with a literal 13px, identical to the token's value (line 118), while
        the sibling dialog inputs use the token (3951-3965); the user sees the same
        size either way, so the reference does not decide literal vs token.
      rung3: 'Decided here: the AC-2232 test stands and the CSS changes to use the
        token.'
    override:
      rule: code_frozen
      rung: 3
      justification: AC-2232 states 'Every covered control takes its size from that
        token. None restates the size as a literal' and names the Contacts dialog
        inputs. The composer rule restates 13px as a literal. No intent in scope and
        nothing in the reference favours the literal (it renders the same size the
        token resolves to), so the test stands and the one declaration must change
        to the token.
      files:
      - apps/control-app/src/builder/builder.css
      tip_evidence:
      - file: apps/control-app/src/builder/builder.css
        lines: 4082-4094
      - file: apps/control-app/src/builder/builder.css
        lines: 3951-3965
      - file: apps/control-app/src/builder/builder.css
        lines: 118-118
      trust_boundary: false
---

# Fix Plan — Iteration 2

## Hypothesis
The one remaining failure (AC-2232 "through its mounted ancestry") is a real production defect: the Contacts invite composer's Subject / To-list / Body fields declare `font-size: 13px` as a literal instead of `var(--builder-control-font-size)`, and only `code_frozen` stops the one-line CSS fix.

## Analysis
- The failure list in this prompt comes from quality report report-c1aee761 (commit 589c6449, 14:31), which predates the iteration-1 builder pass (report-931eefbc, 14:47). Iteration-1 plan report-e9e26bdb had one batch with empty instructions.
- The builder reports 9 of 10 fixed, all as stale tests catching up with code that had moved on: the `account`→`person` rename (REQ-194), `site_assets` keyed by `site_id`, the `@lagrangefoundry` literal in two other suites rebuilt from `WEBUI_SCOPE`, the three Contacts dialogs (Add / Invite composer / Provision), and a probe for the new `/api/material/changes` route. It also updated the AC-2144 text to say `person`. They stay in this batch as blast radius so the validation gate re-checks them.
- The remaining failure, `test_UAT_AC2232_every_text_bearing_builder_control_resolves_to_the_control_token_through_its_mounted_ancestry`, fails with "sized, but not by the control token: builder-people__subject/tolist/body → 13px". The builder's diagnosis holds: in the working tree, `apps/control-app/src/builder/builder.css:2041-2053` ends the `.builder-people__subject, .builder-people__tolist, .builder-people__body` rule with `font: inherit; font-size: 13px;`, while the sibling `.builder-people__add-email` group uses the token.
- AC-2232 is explicit on this: "Every covered control takes its size from that token. None restates the size as a literal." It covers "the inputs and buttons of the Contacts dialogs", and "A control added later with no size counts as a violation." The test is correct and the code is wrong.
- AC965 timing out (wrangler trying to reach api.cloudflare.com in the sandbox) is environmental and outside this subject's failure set. Not batched.
- No hypothesis has repeated. This is the first concrete root-cause hypothesis for this subject.

## Spec Changes Made
none in this plan. The iteration-1 builder already reworded AC-2144 to `person` (REQ-194).

## Weak Evidence Flags (preventative — best effort)
- tests/test_UAT_FC_BUG-58_invite_modal_fits.test.ts and tests/test_reconciliation_contacts_invite_composer_fits.test.ts — weak-observation — they mount the composer fields but never assert the fields' size. Typography coverage of the composer rests entirely on the AC-2232 typography test, so keep that test's class enumeration covering every `builder-people__*` input class.
- story-e674c60a — the businesses endpoint test_UAT_AC2144_businesses_endpoint_reports_account_and_every_membership_in_one_call — weak-observation (name drift) — the test name still says "account" while the AC and the assertions now say `person`. Rename it when next in the file.

## Batches
One batch carrying all 10 tests, because they share builder chrome, the Contacts tab and builder.css. The 9 already-fixed tests are blast radius. The actual edit is a single declaration in builder.css under a narrow `code_frozen` override. The dependency tests are the other suites that mount the Contacts composer or check control typography, so they must stay green.

## Mode overrides (REQ-892)
- Batch 0 — rule `code_frozen` — files: `apps/control-app/src/builder/builder.css` — decided at rung 3. AC-2232 forbids a literal control size and names the Contacts dialog inputs. No in-scope intent asks for a literal on the composer fields. The reference renders the same 13px through a literal (builder.css:4082-4094 at reconcile-src-BUNDLE-41), while its sibling dialog inputs use the token (3951-3965) and the token is 13px (118). So the user-visible size is identical and the reference says nothing in favour of a literal. The test stands. trust_boundary false (presentational CSS only).

## Resolution ladder (REQ-938)
- Batch 0: rung 3 decided. Rung 1: no intent in scope addresses the composer fields' type size. AC-2232 (story-e674c60a) requires the token for every Contacts dialog input and forbids literals. Rung 2: at reconcile-src-BUNDLE-41, builder.css:4082-4094 paints the composer at a literal 13px, exactly what `--builder-control-font-size: 13px` (line 118) resolves to, and the sibling inputs at 3951-3965 use the token. The reference is visually identical either way and does not decide literal vs token. Rung 3: the AC-2232 test stands, and the code changes to use the token.
