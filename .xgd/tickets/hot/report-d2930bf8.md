---
uid: report-d2930bf8
id: REPORT-12054
type: report
title: 'Report: fix_plan for story-179b8c06'
created_by: xgd
created_at: '2026-11-09T23:02:54.916112+00:00'
updated_at: '2026-11-09T23:02:54.916112+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-179b8c06
  fix_iteration: 5
  items:
  - index: 0
    tests:
    - story-179b8c06 — account-chrome is gated by a site declaration test_UAT_AC2329_declared_site_publishes_every_state_and_undeclared_publishes_none
    - story-179b8c06 — account-chrome sign-in baseline and enhancement test_UAT_AC2330_signed_out_chrome_is_a_working_post_form_and_sent_is_status_blind
    - story-179b8c06 — account-chrome on the behavior contract test_UAT_AC2331_catalogued_with_a_preset_on_the_contract_with_no_paint
    - story-179b8c06 — link controls test_UAT_AC2332_link_control_emits_a_real_anchor_with_an_allowlisted_href
    dependency_tests:
    - test_UAT_AC2330_signed_out_chrome_is_a_working_post_form_and_the_sent_swap_is_status_blind
    - test_UAT_AC2331_catalogued_as_v2_with_a_six_slot_preset_on_the_contract_with_no_paint
    - test_UAT_AC2573_
    - test_UAT_AC2574_
    - test_UAT_AC2575_
    - test_UAT_AC1412_
    - test_UAT_AC1413_
    hypothesis: 'tests/reconciliation-behavior-account-chrome.test.ts pins account-chrome
      version 1 (buildSite writes version: 1, getModule(account-chrome, 1), expects
      account-chrome@1 in CATALOG), but BUG-76 (cherry-pick 03c2ed9ef6) moved the
      contract to v2 and the catalog no longer registers v1, so every test throws
      Module not found in catalog before asserting.'
    instructions: 'All four tests fail with Module not found in catalog: account-chrome
      v1. Known modules: ... account-chrome@2 (AC2331 fails on expect(ids).toContain(account-chrome@1)).
      This is a test-side fixture pin, not a product defect: BUG-76 retired v1, and
      the code at HEAD and at the reference is correct. Test-only work, no production
      edits. (1) AC-2329 and AC-2332 have no other test and are reported as orphans:
      migrate their two UATs in tests/reconciliation-behavior-account-chrome.test.ts
      to the current contract. Derive the version from latestModuleVersion(account-chrome)
      in buildSite and in renderChrome/getModule rather than a literal (the reference
      is already at v3), and take slots from the current accountChromePreset(), which
      now includes the required sent and error slots. Keep every AC assertion: all
      three states in the bytes, undeclared or false publishes nothing, the closed
      capability record rejects acounts, chrome bytes identical across sites, links
      are real anchors with L1 paint and allowlisted hrefs, and javascript: is refused
      with ContentSafetyError. (2) The v1 AC-2330 and AC-2331 tests in this file are
      superseded by the passing v2 tests in tests/reconciliation-behavior-strict-contract.test.ts.
      Delete the v1 copies. Before deleting, move any assertion the v2 test lacks
      into the v2 test, but not one that only held under v1, such as four slots or
      account-chrome@1 present. End state: the four AC tokens each have one passing
      UAT on the current contract, and the strict-contract tests stay green.'
    test_scope: test_UAT_AC2329_ or test_UAT_AC2330_ or test_UAT_AC2331_ or test_UAT_AC2332_
      or test_UAT_AC2573_ or test_UAT_AC2574_ or test_UAT_AC2575_ or test_UAT_AC1412_
      or test_UAT_AC1413_
    ladder:
      rung1: 'Decided here: BUG-76 is in this bundle, later than REQ-200 on the same
        surface, and explicitly moves the account-chrome contract to version 2 (commit
        03c2ed9ef6), superseding the v1 pin in these tests, so the tests change.'
      rung2: 'Corroborates: reconcile-src-BUNDLE-44:packages/framework/src/modules/account-chrome/meta.ts:43
        is version: 3 and catalog.ts registers a single accountChromeMeta, so no v1
        exists at the reference.'
      rung3: 'Not reached: the tests as written do not stand; the code is right and
        the fixtures migrate to the current contract.'
---

# Fix Plan — Iteration 5

## Hypothesis
`tests/reconciliation-behavior-account-chrome.test.ts` still pins `account-chrome` **version 1** (its `buildSite` fixture writes `version: 1`, and the tests call `getModule('account-chrome', 1)` and expect `account-chrome@1` in `CATALOG`). BUG-76 (cherry-pick 03c2ed9ef6) retired v1, so the catalog now holds only `account-chrome@2`. Every test in the file fails before it reaches its assertions, and AC-2329 and AC-2332 are left with no passing test.

## Analysis
Running `npx vitest run tests/reconciliation-behavior-account-chrome.test.ts` reproduces all four failures locally, with one cause:

- AC2329, AC2330, AC2332: `Error: Module not found in catalog: 'account-chrome' v1. Known modules: contact-form@4, carousel@3, account-portal@1, account-chrome@2` (from `renderModuleInstances`, called via `publish()` → `renderSiteFiles`).
- AC2331: `expected [ Array(4) ] to include 'account-chrome@1'` (test line 311).

**This is not the earlier failure set.** Iterations 1–3 dealt with the closed `siteCapabilitiesSchema` (AC-2329) and the `scopeClientJs` duplicate-declaration bug (AC-1624). Both fixes are still at HEAD, and AC-1624 passes in this run. What broke since then is that the story cycle advanced: cherry-pick 03c2ed9ef6 (BUG-76) moved the `account-chrome` contract to v2. That commit adds `labelMode`, makes `sent` and `error` required slots, and removes `config.sentMessage`. The reconciliation UAT generation that followed (3cce9887a3) wrote v2 replacements for AC-2330 and AC-2331 in `tests/reconciliation-behavior-strict-contract.test.ts`, and both pass:

- `test_UAT_AC2330_signed_out_chrome_is_a_working_post_form_and_the_sent_swap_is_status_blind`
- `test_UAT_AC2331_catalogued_as_v2_with_a_six_slot_preset_on_the_contract_with_no_paint`

It left the v1 file in place and wrote no v2 test for AC-2329 or AC-2332. That is why those two ACs show as orphans, while AC-2330 and AC-2331 are still covered.

**Not a mode-rule issue:** the fix is test-only, and no production change is needed. The ACs do not name a version. AC-2329 and AC-2332 describe behaviour (site-declared capability, closed record, every state in the bytes; link controls are real anchors with an allowlisted href) that the v2 contract still has.

**Not contamination or flakiness:** the tests fail deterministically, alone and in the suite, at the first render call.

**Hypothesis count:** this hypothesis is new and has not been proposed before. The earlier hypotheses (stale quality run; `.strict()`; `scopeClientJs`) are not repeated.

## Spec Changes Made
None. AC-2329 to AC-2332 are version-agnostic and still describe the code.

## Weak Evidence Flags (preventative — best effort)
- `story-179b8c06 — account-chrome v2 on the behavior contract test_UAT_AC2331_catalogued_as_v2_with_a_six_slot_preset_on_the_contract_with_no_paint` — weak-observation / brittle version pin. It asserts `account-chrome@2` exactly. The reference state (`reconcile-src-BUNDLE-44`, `packages/framework/src/modules/account-chrome/meta.ts:43`) is already at `version: 3`, so this test breaks the same way when the next bundle commit lands. Suggestion: assert against `latestModuleVersion('account-chrome')` and that retired versions are absent, not a literal.
- `tests/reconciliation-behavior-strict-contract.test.ts` fixture (`version: 2` at line 80) — brittle version pin — same suggestion. Derive the pin from `latestModuleVersion`.
- `REQ-93 — an L1 page hosts behavior modules in its slots test_UAT_AC1624_mounted_run_flags_a_container_overflow_on_the_responsive_dimension` — weak-observation (carried over from iteration 3). It skips silently when Chromium is missing, and it does not print violation texts when it fails.

## Batches
**Batch 0 (single batch):** the four failing tests in `tests/reconciliation-behavior-account-chrome.test.ts`. The v2 AC-2330, AC-2331 and AC-2573 to AC-2575 tests in the strict-contract file are dependency tests, because they share the same contract surface and must stay green. One file and one cause, so there is no reason to split.

**What the builder should establish:**
- AC-2329 and AC-2332 each have a passing UAT against the current `account-chrome` contract. Resolve the version with `latestModuleVersion('account-chrome')` everywhere the file now hardcodes `1`: the `buildSite` instance `version` and any `getModule` call. Take slots from the current `accountChromePreset()`, which now includes `sent` and `error`.
- The v1 copies of AC-2330 and AC-2331 in this file are superseded by the passing v2 tests in the strict-contract file. Remove them, and keep any assertion the v2 test lacks by moving it into that v2 test. Do not keep two tests that assert contradictory contracts (`account-chrome@1` present, versus `@1` absent).
- Do not change production code.

## Resolution ladder (REQ-938)
Batch 0 is decided at **rung 1**.

- **Rung 1:** BUG-76 is in this bundle and later than REQ-200 on the same surface, and it explicitly moves `account-chrome`'s contract to v2 (commit 03c2ed9ef6, "`account-chrome`'s contract goes to version 2"). It supersedes the v1 pin, so the tests change.
- **Rung 2 (corroborates):** the reference state has no v1. `reconcile-src-BUNDLE-44:packages/framework/src/modules/account-chrome/meta.ts:43` is `version: 3`, and `catalog.ts` registers only the one `accountChromeMeta`.
- **Rung 3:** not reached. The tests do not stand as written, and the code is right.
