---
uid: comment-a8de6d5a
id: COMMENT-2706
type: comment
title: Claude response for reconciliation_uat_generation report
created_by: xgd
created_at: '2026-09-11T06:21:52.653938+00:00'
updated_at: '2026-09-11T06:21:52.653938+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-d0cf7c88
  kind: note
---

## What I did

**Scope.** Only two ACs of `story-e674c60a` are live in this worktree's ticket store — `AC-959` (`acceptance_criterion-6f87920c`) and `AC-976` (`acceptance_criterion-922c2d11`) — and they are exactly the two the BUNDLE-26 / REQ-161 reconciliation decision records as **superseded and restated**. Both already had UATs in the story's own file, written as exact-for-one-tab proxies (`expect(TABS).toHaveLength(1)`; "every declared tab is the active one"). Restated criteria need those tests rewritten, not duplicated — a second test per AC would break the 1:1 mapping.

**AC-959** — counts now derive from the declaration: mounted `.shell-panel` count equals `TABS.length`, the mounted `data-tab-id` set equals the declared id set in both directions, `SITE_TAB.id === 'site'`, `TABS[0]` is the site tab, and the active tab after mounting is the *first* declared tab's id. Added a generality check mounting the real shell with a 3-entry declaration (`mountBuilder` passes `TABS` through unnarrowed), since against today's one-tab builder "one panel, and it is active" satisfies the claim vacuously.

**AC-976** — the delivery loop now iterates `TABS.entries()` and asserts each key against the tab it was declared on: `id` resolves to a mounted panel (and is the opened one *for index 0 only*), `label` appears in that tab's own button, `fill` yields `is-fill` on that tab's panel. Aggregate: filling-panel count equals the number of tabs declaring `fill`, and the opened filling panel holds the display panel. The mutation check now re-declares the site tab *without* `fill* beside a second tab *with* it, proving the option follows the declaration per tab.

**Non-vacuity, verified.** I temporarily reordered `TABS` in `config.js` to put a probe tab first, ran, and both rewritten tests failed (`expected 'tmp-probe' to be 'site'`; `the live site panel opts into the fill chain: expected null to be truthy`); with the probe tab appended *second* both passed — i.e. they survive REQ-161's legitimate change and still catch the violation. `config.js` was reverted; `git status` shows only the test file modified.

**One pre-existing failure, not mine:** `tests/reconciliation-library-tab.test.ts` (story-1500b111, written by an earlier plan item) fails at import — `apps/control-app/src/builder/library.js` is absent from `HEAD`. REQ-161's Library-tab code never reached this reconcile branch, which is also why `TABS` still declares one tab here.

```
UATs generated for story story-e674c60a (plan item 15 of 17)

Story: story-e674c60a
Test file(s) created:
  - tests/reconciliation-builder-workspace-chrome.test.ts  (rewritten in place —
    AC-959 and AC-976 were restated by this bundle; their UATs already lived here)

Tests written: 2 (rewritten)
Tests passed: 9 (whole file, incl. the 7 untouched)
Tests failed: 0

test_files_created:
  - "tests/reconciliation-builder-workspace-chrome.test.ts"
```
