---
uid: report-7f84766e
id: REPORT-11449
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-08T13:18:45.492390+00:00'
updated_at: '2026-11-08T13:18:45.492390+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: story-e214a00d
  parent_report_uid: report-7bb67608
  batch_index: '0'
---

I fixed `test_UAT_AC2437_a_reveal_on_a_panel_is_not_emitted_while_a_reveal_inside_it_is`. All 17 tests in `tests/test_reconciliation_l1_modals.test.ts` now pass, and no production code changed.

**Why it failed:** the test checked that the panel had no `l1-rv` class. The renderer does put `l1-rv` on a panel that declares a reveal (`render.ts:2210`), but the `!isDialog` guard at `render.ts:2594` stops any reveal rule or transition being emitted for it. The reveal script only adds `l1-in` to nodes with that class, and no rule targets the panel's class with `l1-in` or `data-l1-motion`. So the class does nothing: the panel never sits at opacity 0, which is what the AC is about. The test was checking the wrong thing.

**Test change:** I replaced the class check with a stricter one. No CSS rule may combine the panel's class with `data-l1-motion` or `l1-in`. The checks that the panel has no pre-state rule or transition, and that the child does reveal, are unchanged. If the `!isDialog` guard were removed, the rule `html[data-l1-motion] .<panel>:not(.l1-in) { opacity: 0 … }` would come back and the test would fail.

**AC update:** I rewrote AC-2437 (`acceptance_criterion-93b08bdf`) through `xgd ticket update` with a reconcile commit message. It now requires no reveal pre-state, transition, motion-marker or revealed-state rules for the panel. It says the panel may keep the unused handle class, and that the child still carries the handle and its pre-state rule. The story didn't need changing.

**Lint not run:** `package.json` has no lint script, eslint isn't installed locally, and fetching it from npm was blocked by the sandbox's network allowlist. I didn't run a separate typecheck either.

```yaml
## Assessment
status: fixed
tests:
  - test_UAT_AC2437_a_reveal_on_a_panel_is_not_emitted_while_a_reveal_inside_it_is: pass
upstream:
  - acceptance_criterion-93b08bdf: updated (marker-class claim replaced with absence of reveal rules for the panel)
lint: not run (no lint script in package.json; eslint not installed; npm registry blocked by sandbox)
```