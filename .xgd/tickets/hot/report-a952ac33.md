---
uid: report-a952ac33
id: REPORT-11692
type: report
title: 'Report: fix_plan for report-d402710c'
created_by: xgd
created_at: '2026-11-09T04:19:49.355294+00:00'
updated_at: '2026-11-09T04:19:49.355294+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: report-d402710c
  fix_iteration: 1
  items:
  - index: 0
    tests:
    - test_UAT_AC2496_switching_view_and_edit_keeps_the_page_and_the_scroll_offset
    - test_UAT_AC2517_a_view_edit_switch_navigates_neither_channel
    test_scope: test_UAT_AC2496_switching_view_and_edit_keeps_the_page_and_the_scroll_offset
      or test_UAT_AC2517_a_view_edit_switch_navigates_neither_channel
    dependency_tests:
    - test_UAT_AC2518_the_channel_left_behind_stays_connected_and_laid_out_hidden_by_visibility
    - test_UAT_AC2519_the_idle_channel_is_primed_after_the_visible_load_and_a_stale_frame_is_not
    - test_UAT_AC2520_a_revealed_document_is_announced_and_the_edit_loop_and_carry_bind_to_it
    - test_UAT_AC2521_a_write_reloads_the_shown_page_in_place_and_stales_the_others
    - test_UAT_AC2522_a_change_of_site_or_a_refresh_invalidates_every_channel
    instructions: 'G1 (code_frozen hand-off). (1) panel.js: on every frame load, set
      rec.src from rec.el.contentWindow.location.href (try/catch, ignore about:blank),
      so show() and prime() decide out-of-date from where the frame actually is; a
      frame already at the target is revealed with no navigation and announced via
      emit(document). Change nothing else. (2) Rewrite AC-2496 paragraph 3: a frame
      is re-pointed only when the page it actually holds differs from the operator
      page; update its Verification to assert no navigation or load on the return
      to View and a carried offset of 300. (3) In test_UAT_AC2496_switching_view_and_edit_keeps_the_page_and_the_scroll_offset
      assert navsOf(viewFrame()) is [], no load fired, viewFrame().contentDocument
      is view.doc, and view.scrolled ends at 300. (4) Add a follow-a-link-then-round-trip
      case to test_UAT_AC2517_a_view_edit_switch_navigates_neither_channel. Also run
      tests/test_UAT_FC_BUG-79_flip_in_place.test.ts by path.'
    override:
      rule: code_frozen
      rung: 1
      files:
      - apps/control-app/src/builder/panel.js
      trust_boundary: false
      justification: 'Rung 1, intents. BUG-79: A frame navigates only when what it
        shows is genuinely out of date ... Never for a mode switch; the first flip
        is in place as well as every one after it. show()/prime() compare against
        rec.src, the address the pane last set, so after the operator follows a link
        in View, a flip back re-navigates a frame that already holds the right page.
        That is the BUG-79 symptom. AC-2496 paragraph 3 and its UAT absorbed this;
        the code must change with them. The tip is not ahead (045c153c96 is the latest
        panel.js commit), so aligned_to_tip does not apply.'
---

# Fix Plan — Iteration 1 (re-plan: ruling on the builder's `code_frozen` hand-off)

## Why this re-plan
The previous plan (REPORT-11691) said there was no builder `blocked_by` report to rule on. That was wrong. The reconciliation review handed off gap G1 under `code_frozen`, and the validator refused the plan because it had no ruling. This plan rules on it.

## Ruling: grant the `code_frozen` override (rung 1, intents)
BUG-79's body settles this: "A frame navigates only when what it shows is genuinely out of date ... **Never for a mode switch.**" It also says the first flip is in place "as well as every one after it".

G1 is a real divergence. `show()` and `prime()` in `apps/control-app/src/builder/panel.js` (lines 213 and 236) compare the target against `rec.src`, which is the address the pane last set. A link the operator follows inside a frame leaves `rec.src` behind. So this sequence re-navigates a frame that is already on the right page, which is the BUG-79 symptom: follow a link in View (home to about), flip to Edit, flip back to View.

AC-2496 paragraph 3 and `test_UAT_AC2496_…` absorbed that behaviour as correct. Changing the AC and the test alone would leave the code contradicting the intent, so the code has to move. The tip is not ahead of this branch: `045c153c96` is the latest commit to touch `panel.js`, so `aligned_to_tip` does not apply. `superseded` and `declined` would both keep a behaviour the intent forbids.

## Batch 0 — decide "out of date" from where the frame actually is
**Files**: `apps/control-app/src/builder/panel.js` (override), the AC-2496 ticket, `tests/test_reconciliation_builder_page_carry.test.ts`, `tests/test_reconciliation_builder_flip_in_place.test.ts`

1. **Code (`panel.js`)**: on every `load` of a frame, record the frame's live address in `rec.src` from `rec.el.contentWindow.location.href`. Wrap the read in try/catch and ignore `about:blank`. `show()` and `prime()` keep comparing with `sameUrl(rec.src, next)`, which now reflects where the frame really is. A frame already at `next` is then revealed with no navigation and announced through `emit('document')`. Change nothing else: staleness, `reloadDocument()`, `setSite`/`refresh()` and the visibility classes stay as they are.
2. **AC-2496**: rewrite paragraph 3. A frame is pointed elsewhere only when the page it *actually holds* differs from the operator's page. A frame that the operator's own link already took to that page is revealed in place. In Verification, the switch back to View asserts no navigation and no load, and asserts that the revealed document receives the carried offset (300).
3. **Test**: in `test_UAT_AC2496_switching_view_and_edit_keeps_the_page_and_the_scroll_offset` (around lines 407–417), assert:
   - `navsOf(viewFrame())` is `[]`
   - no environment load fired
   - `viewFrame().contentDocument` is `view.doc`
   - `view.scrolled` ends at `300`
4. **Test**: add a follow-a-link-then-round-trip case to `test_UAT_AC2517_a_view_edit_switch_navigates_neither_channel`, so the AC-2517 scenario can catch this regression.

**Must stay green** (dependency_tests): AC-2518 to AC-2522, the REQ-215 panel-control UATs, and `tests/test_UAT_FC_BUG-79_flip_in_place.test.ts`. Note that the scoped filter `test_UAT_FC_BUG_79` misses that file because of the hyphen. Run it by path.

## Spec changes made
None by the planner. The batch rewrites AC-2496.

## Weak evidence flags
- AC-2517's UAT never follows a link, so it could not catch G1. Item 4 above fixes that.

## Resolution ladder (REQ-938)
Rung 1 decides it. The intent sentence "Never for a mode switch" (BUG-79) outranks AC-2496's wording, so the code is wrong and the test that pinned the wrong behaviour changes with it.
