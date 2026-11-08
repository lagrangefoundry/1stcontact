---
uid: report-f32587ff
id: REPORT-11488
type: report
title: 'Report: fix_plan for STORY-99'
created_by: xgd
created_at: '2026-11-08T15:05:09.580066+00:00'
updated_at: '2026-11-08T15:05:09.580066+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: STORY-99
  fix_iteration: 3
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
    - test_UAT_FC_BUG-47_
    - test_UAT_FC_REQ-181_
    - test_UAT_FC_REQ-213_
    - test_UAT_AC1715_
    - test_UAT_AC1716_
    - test_UAT_AC1717_
    - test_UAT_AC1718_
    - test_UAT_AC1725_
    - test_UAT_AC1726_
    - test_UAT_AC1727_
    - test_UAT_AC1728_
    - test_UAT_AC1729_
    - test_UAT_AC1730_
    - test_UAT_AC1731_
    - test_UAT_AC1732_
    - test_UAT_AC1733_
    - test_UAT_AC1734_
    - test_UAT_AC1735_
    - test_UAT_AC2018_
    - test_UAT_AC2019_
    - test_UAT_AC2020_
    - test_UAT_AC2021_
    - test_UAT_AC2161_
    - test_UAT_AC2324_
    - test_UAT_AC2326_
    - test_UAT_AC2458_
    - test_UAT_AC2459_
    - test_UAT_AC2461_
    hypothesis: apps/control-app/src/builder/library.js:472 emits builder-library__badge--role
      on the Library role badge but the working-tree builder.css has no rule naming
      that class, violating AC-2232's 'every builder-* class they emit is matched
      by a rule in the builder stylesheet'; the stylesheet, not the test, is wrong.
    instructions: 'Iteration 2''s composer fix (font-size 13px -> var(--builder-control-font-size))
      is in place and correct; keep it. The AC-2232 mounted-ancestry test now fails
      at typography test line 440: `no builder rule matches: builder-library__badge--role`.
      library.js:472 emits that modifier on every Library row''s role pill; builder.css
      has .builder-library__badge (1130) and .builder-library__badge--unplaced (1154)
      but nothing for --role. Add a real `.builder-library__badge--role` rule to builder.css
      next to the other badge rules, stating the role pill''s own resting presentation
      (the muted pill it renders as today — what the user sees must not change) with
      a short comment saying what the modifier is for; no control font-size literal,
      no empty rule, and do not add an `.is-placed` state (REQ-282 is out of scope
      and the working tree never emits it). Leave library.js, the test and AC-2232
      alone. Then run the whole typography file: line 440 previously masked the static
      sweep (lines 442-471), so it may now report further unmatched classes or unsized
      controls. Fix any such violation inside builder.css under this same override
      — each is the same defect AC-2232 names. If a remaining violation can only be
      fixed outside builder.css, stop and report it as blocked_by with the file and
      line. Re-confirm the nine iteration-1 tests stay green without reworking them.
      Ignore AC965''s wrangler/api.cloudflare.com timeout (sandbox network, not in
      this batch).'
    test_scope: test_UAT_AC2232_ or test_UAT_AC2144_ or test_UAT_AC1402_ or test_UAT_AC960_
      or test_UAT_AC2143_ or test_UAT_AC2146_ or test_UAT_AC2230_ or test_UAT_AC2231_
      or test_UAT_AC977_ or test_UAT_AC2463_ or test_UAT_AC2336_ or test_UAT_AC2339_
      or test_UAT_AC2367_ or test_UAT_AC2409_ or test_UAT_FC_BUG-53_ or test_UAT_FC_BUG-58_
      or test_UAT_FC_REQ-199_ or test_UAT_FC_BUG-47_ or test_UAT_FC_REQ-181_ or test_UAT_FC_REQ-213_
      or test_UAT_AC1715_ or test_UAT_AC1716_ or test_UAT_AC1717_ or test_UAT_AC1718_
      or test_UAT_AC1725_ or test_UAT_AC1726_ or test_UAT_AC1727_ or test_UAT_AC1728_
      or test_UAT_AC1729_ or test_UAT_AC1730_ or test_UAT_AC1731_ or test_UAT_AC1732_
      or test_UAT_AC1733_ or test_UAT_AC1734_ or test_UAT_AC1735_ or test_UAT_AC2018_
      or test_UAT_AC2019_ or test_UAT_AC2020_ or test_UAT_AC2021_ or test_UAT_AC2161_
      or test_UAT_AC2324_ or test_UAT_AC2326_ or test_UAT_AC2458_ or test_UAT_AC2459_
      or test_UAT_AC2461_
    ladder:
      rung1: BUG-70 (in scope) demands an exhaustive class/control sweep and AC-2232
        requires every emitted builder-* class to match a builder rule; no in-scope
        intent speaks to the role badge itself, so rung 1 does not decide the file.
      rung2: 'Decided here: at reconcile-src-BUNDLE-41 library.js:649 still emits
        builder-library__badge--role and builder.css:2786-2790 carries a rule naming
        it, so the class stays and the stylesheet gains a rule.'
      rung3: The AC-2232 test stands unchanged.
    override:
      rule: code_frozen
      rung: 2
      justification: 'AC-2232 Verification: ''Assert that every builder-* class they
        emit is matched by a rule in the builder stylesheet.'' The working tree emits
        builder-library__badge--role (library.js:472) with no matching rule. At the
        reference the same class is emitted (library.js:649) and builder.css:2786-2790
        matches it, so the user''s code keeps the class and styles it; the stylesheet
        is what is missing. The grant also covers any further AC-2232 violation the
        now-reachable assertions report, provided the fix is in builder.css.'
      files:
      - apps/control-app/src/builder/builder.css
      tip_evidence:
      - file: apps/control-app/src/builder/builder.css
        lines: 2759-2790
      - file: apps/control-app/src/builder/library.js
        lines: 647-651
      trust_boundary: false
---

# Fix Plan — Iteration 3

## Hypothesis
`apps/control-app/src/builder/library.js:472` puts the class `builder-library__badge--role` on the Library's role badge, and the working-tree `builder.css` has no rule that matches it. AC-2232's Verification requires every `builder-*` class on the mounted surfaces to match a builder stylesheet rule. The test is right and the stylesheet is missing a rule.

## Analysis
- History. In iteration 1 (report-e9e26bdb / assessment report-931eefbc) the builder fixed 9 of the 10 failures. All 9 were stale tests: the `person` rename (REQ-194), `site_assets` keyed by `site_id`, `WEBUI_SCOPE`, the three Contacts dialogs, and the `/api/material/changes` probe. Iteration 2 (report-0f13d2a4 / assessment report-dfb61819) granted `code_frozen` on builder.css for one declaration. The composer's literal `font-size: 13px` is now `var(--builder-control-font-size)` (that edit is the builder.css entry in "Changed Files"), and the `offToken` assertion clears.
- With that fixed, the test reaches the next assertion (tests/reconciliation-builder-workspace-typography.test.ts:439-440) and fails with `no builder rule matches: builder-library__badge--role`. The test builds `builderClasses` from every class token in every builder-sheet selector (line 288-290), so a compound selector counts. In the working tree, builder.css has `.builder-library__badge` (1130) and `.builder-library__badge--unplaced` (1154), but nothing names `--role`.
- The builder's blocked_by is real and is a new root cause, not a repeat. Iteration 2's hypothesis was the composer literal and it is now fixed. Iteration 3's hypothesis is the unmatched role-badge class. No hypothesis has repeated.
- Reference state. At `reconcile-src-BUNDLE-41`, library.js:649 still emits `builder-library__badge--role` (plus `is-placed`), and builder.css:2786-2790 has a rule naming `.builder-library__badge--role`. So the user's current code keeps this class and the stylesheet matches it. Dropping the class from library.js would move away from the reference, so the fix goes in the stylesheet. The `is-placed` state comes from REQ-282, which is not in this run's scope (BUNDLE-41 covers REQ-210/211/212/213, BUG-67/69/70/71/72). That rule must not be copied in: the working tree never emits `is-placed`, so the rule would be dead.
- The static sweep after line 440 has never run, so `--role` may not be the last violation. The batch therefore covers the whole of AC-2232's assertions inside builder.css, not this one class only.
- AC965 still times out because wrangler tries to reach api.cloudflare.com and the sandbox blocks it. That is the environment. It is not in this subject's failure set and is not batched.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
- story-e674c60a — every text-bearing builder control is one size test_UAT_AC2232_every_text_bearing_builder_control_resolves_to_the_control_token_through_its_mounted_ancestry — weak-observation (masking) — four independent sweeps sit behind sequential `expect`s, so each fix uncovers the next violation one iteration at a time. Collect the adrift / offToken / unmatched / unsized lists and assert them together, or use `expect.soft`.
- `builderClasses` (typography test line 288-290) — weak-observation — any selector that mentions a class counts as a match, including a compound selector for a state the code never emits. An unused `.x.state {}` rule would satisfy the clause. Consider requiring that the matching selector can match the emitted element.
- story-e674c60a — the businesses endpoint test_UAT_AC2144_businesses_endpoint_reports_account_and_every_membership_in_one_call — weak-observation (name drift) — the name still says "account" while the AC and the assertions say `person`. Carried over from iteration 2.

## Batches
One batch. The 9 tests fixed in iteration 1 stay in it as blast radius. The single remaining failure is AC-2232's mounted-ancestry test, and its fix is in `apps/control-app/src/builder/builder.css` only. Dependency tests are every suite that mounts the Library row badges (REQ-181, REQ-213, BUG-47, and the reconciliation Library suites), plus iteration 2's composer and typography suites, because the same stylesheet is being edited.

## Mode overrides (REQ-892)
- Batch 0 — rule `code_frozen` — files: `apps/control-app/src/builder/builder.css` — rung 2. At reconcile-src-BUNDLE-41, library.js:649 emits `builder-library__badge--role` and builder.css:2786-2790 has a rule naming it. The user's code keeps the class and gives it a stylesheet rule, and AC-2232's Verification requires exactly that. The working tree lacks the rule, so the stylesheet changes and library.js does not. The grant is wider than iteration 2's: it covers any further AC-2232 violation that the now-reachable assertions (lines 440 and 471) report, as long as the fix is within builder.css. trust_boundary false (presentational CSS).

## Superseded blocked_by request (BUG-1535)
n/a. The blocked_by (`code_frozen`, report-dfb61819) is ruled by **grant** above.

## Resolution ladder (REQ-938)
- Batch 0: rung 2 decided. Rung 1: BUG-70 (in scope) asks for an exhaustive sweep of the builder's emitted classes and controls, and AC-2232 (story-e674c60a) requires every emitted `builder-*` class to match a builder rule. No in-scope intent speaks about the role badge itself. Rung 2: at reconcile-src-BUNDLE-41, library.js:649 still emits the class and builder.css:2786-2790 matches it, so the class stays and the stylesheet gains a rule. Rung 3: the test stands unchanged.
