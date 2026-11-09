---
uid: report-6d5e88e9
id: REPORT-11680
type: report
title: 'Report: fix_plan for story-e674c60a'
created_by: xgd
created_at: '2026-11-09T03:36:34.425496+00:00'
updated_at: '2026-11-09T03:48:41.583861+00:00'
completed_at: null
last_field_updated: batches_pending
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-e674c60a
  fix_iteration: 6
  items:
  - index: 0
    tests:
    - story-e674c60a — the page carried across a channel switch test_UAT_AC2496_switching_view_and_edit_keeps_the_page_and_the_scroll_offset
    - story-e674c60a — the page carried across a channel switch test_UAT_AC2497_a_panel_open_in_view_shows_in_edit_and_survives_the_post_save_reload
    - story-e674c60a — the page carried across a channel switch test_UAT_AC2499_edit_alone_offers_a_panel_selector_named_by_text_applied_without_reload
    - AC-2496 (orphaned acceptance criterion)
    - AC-2497 (orphaned acceptance criterion)
    - AC-2499 (orphaned acceptance criterion)
    - story-e674c60a — the page carried across a channel switch test_UAT_AC2498_switching_site_or_following_a_link_drops_the_carried_state
    - story-e674c60a — the page carried across a channel switch test_UAT_AC1029_the_registered_edit_mode_opens_on_the_page_the_reader_was_on
    - story-e674c60a — the page carried across a channel switch test_UAT_AC1036_both_addresses_are_the_channel_root_plus_the_readers_path_encoding_unchanged
    dependency_tests:
    - test_UAT_AC2517_
    - test_UAT_AC2518_
    - test_UAT_AC2519_
    - test_UAT_AC2520_
    - test_UAT_AC2521_
    - test_UAT_AC2522_
    hypothesis: tests/test_reconciliation_builder_page_carry.test.ts patches contentWindow/contentDocument
      only on the frame shown at mount and fires every load on frame(), but since
      BUG-79 each document mode owns its own frame and panel.frame is the shown one,
      so after the switch the workspace reads an unpatched blank frame.
    instructions: 'This is a test-only rewrite: the page-carry UATs for AC-2496, AC-2497
      and AC-2499 are false evidence because their harness still models the pre-BUG-79
      single navigating frame, while the ACs and the running code are right and need
      no change. Move tests/test_reconciliation_builder_page_carry.test.ts onto the
      per-frame harness already proven in tests/test_reconciliation_builder_flip_in_place.test.ts:
      patch contentWindow/contentDocument on EVERY .builder-panel__pane frame from
      a per-frame showing map, and deliver each document to the frame the pane actually
      pointed at that URL (identify it by its src or the navigation log), never to
      whatever frame() returned at mount. Model priming: after the View document arrives,
      the idle Edit frame is pointed at its channel root, so deliver it there. A switch
      to a frame that already holds the right URL is a reveal with NO load: observe
      the carried scroll offset, open panel and selector on that revealed document
      after the switch (the panel announces it through its document event), and do
      not await an arrive that the code correctly never triggers. A switch to a different
      page (View on about, Edit primed at root) does navigate that one frame; deliver
      the edit/about document to the Edit frame. Model the AC-2497 post-save reload
      as a real write, the way the AC2521 UAT does: call app.panel.reloadDocument()
      and deliver the newer page to the incoming frame the pane points, not by re-firing
      load on the shown frame. Keep every assertion the ACs demand: offsets 640 then
      300; signin-panel open in Edit, after the reload, and back in View with aria-expanded
      true; the selector option labels and order; a pick that applies with no reload
      (same document object); and no control on a page with no panels. Move AC2498
      onto the same harness (it passes only by reading an unpatched frame) and keep
      AC1029 and AC1036 green. Do not edit the flip-in-place UATs except to extract
      a shared helper.'
    test_scope: test_UAT_AC2496_ or test_UAT_AC2497_ or test_UAT_AC2498_ or test_UAT_AC2499_
      or test_UAT_AC1029_ or test_UAT_AC1036_ or test_UAT_AC2517_ or test_UAT_AC2518_
      or test_UAT_AC2519_ or test_UAT_AC2520_ or test_UAT_AC2521_ or test_UAT_AC2522_
    ladder:
      rung1: 'Decided here: BUG-79 is the latest intent on this surface and supersedes
        the REQ-215 navigate-and-restore model, and AC-2496/2497/2499 are already
        worded for it (a switch navigates neither channel), so the stale test harness
        changes.'
      rung2: 'Agrees: at reconcile-src-BUG-79 the display panel module creates a frame
        per mode, primes the idle one after the visible load, reveals a frame already
        at the right URL with a document event and no load, and swaps a write in through
        an incoming frame.'
      rung3: Not reached; the tests do not stand as written because their harness
        models the superseded single-frame panel, but every AC assertion they make
        is kept.
  batches_pending: false
---

# Fix Plan — Iteration 6 (re-plan after validator refusal)

## Hypothesis
`tests/test_reconciliation_builder_page_carry.test.ts` still drives the pre-BUG-79 single navigating frame: it patches `contentWindow`/`contentDocument` only on the frame `app.panel.frame` returned at mount and fires every `load` on `frame()`, but since BUG-79 each document mode owns its own frame and `panel.frame` returns the one shown, so after the switch to Edit the workspace reads an unpatched blank frame and the carry, open panel and selector observe nothing.

## Analysis
Failures (quality report report-a661f56a, commit ba111c27):
- AC2496 at test line 295: `expected [] to deeply equal [640]`.
- AC2497 at test line 318: `expected [] to deeply equal ['signin-panel']`.
- AC2499 at test line 390: `expected true to be false` (the selector is hidden because the document read has no panels).
- The orphaned-AC entries for AC-2496/2497/2499 exist only because these three UATs fail. They clear when the UATs pass.

**Why the previous iteration-6 plan was refused.** The validator (`fix_plan_filter_rejected`, session ra0c6c405 seq 500) refused batch 0 because its `instructions` cited `apps/control-app/src/builder/panel.js`, which `code_frozen` freezes, with no override. The diagnosis was not at fault. The citation was evidence, not an edit target. No production change is needed, so no override is granted. This plan keeps production paths out of the batch's `instructions` and `ladder` and cites them here only.

**The reference state** (`git show reconcile-src-BUG-79:apps/control-app/src/builder/panel.js`):
- Line 243 creates one frame record per mode.
- Lines 491-500: `prime()` points idle channels at their URL after the visible frame loads.
- Lines 503-527: `show()` navigates only when the frame is stale or holds a different URL. Otherwise it reveals the frame and calls `emit('document', …)` with no `load`.
- Line 608: `get frame()` returns the shown frame.
- Lines 742-771: `reloadDocument()` (a write) loads the newer page into an incoming spare frame and swaps it in at lines 402-420. It does not re-fire `load` on the frame that is showing.

**Correction to the previous plan's history note.** That note said "a write reloads in place", from AC2521's title. The code actually reloads through an incoming frame that is swapped in. The sibling UAT for AC2521 drives that path with `app.panel.reloadDocument()` and then delivers the document to the frame the pane pointed at. The AC2497 post-save step must do the same. At present it simply fires `arrive` again on `frame()`.

**About the first flip in AC2496.** Priming points Edit at the channel root. The reader is on `about`, so the first switch to Edit legitimately navigates the Edit frame to `edit/about`: the page differs, and AC-2496 says "If the operator moved to another page … the channel they flip to shows that same page". The harness must deliver that document to the Edit frame, not to whichever frame was shown at mount. The return to View, still on `about`, holds the same URL, so it is revealed without a `load`. The carry must then be observed via the reveal, and the test must not wait for an `arrive`. The test's current `back = await arrive('draft', …)` step models a navigation the code correctly does not make.

**The ACs are already worded for BUG-79** (AC-2496: "A switch navigates neither channel ([[BUG-79]]) … applies that to the document revealed"). Nothing in AC-2497 or AC-2499 requires a single frame. Only the harness is stale.

**Reusable infrastructure.** `tests/test_reconciliation_builder_flip_in_place.test.ts` (AC2517-AC2522, all green) already has the per-frame harness:
- `mount()` patches every `.builder-panel__pane` frame from a `showing` Map (lines 142-157).
- `viewFrame()`/`editFrame()`/`shown()` (lines 161-164).
- An `arrive(frame, …)` that targets one frame (lines 190-228).
- A `MutationObserver` navigation log, `navsOf`, which identifies the frame the pane just pointed.

**Prior history.** The earlier fix_plan and batch_fix_assessment reports for story-e674c60a (report-103eb41e, report-17b2069d, report-e5febd9c, report-5b83c2c7, report-4638e111, report-a5809508, report-dfc6ca47, report-bd553ac0, report-555646dd) predate this BUG-79 run and cover other ACs (AC960/964/967/975/1400). This hypothesis has been planned once, in report-19446684, and never executed because validation refused it. It has not been tried 3 times. No builder has reported a `blocked_by`, so there is nothing to rule on.

## Spec Changes Made
none. AC-2496, AC-2497 and AC-2499 already state the BUG-79 behaviour.

## Weak Evidence Flags (preventative — best effort)
- tests/test_reconciliation_builder_page_carry.test.ts::test_UAT_AC2498_switching_site_or_following_a_link_drops_the_carried_state — weak-observation — passes only because its final Edit step reads the unpatched Edit frame, so `openPanels(edit)` is `[]` trivially; move it onto the per-frame harness so "no panel in Edit" is observed on the shown document.
- tests/test_reconciliation_builder_page_carry.test.ts::test_UAT_AC1029_the_registered_edit_mode_opens_on_the_page_the_reader_was_on — weak-observation — asserts only the `src` attribute, which priming can already satisfy before the click; also assert the shown frame is the Edit frame.
- tests/test_reconciliation_builder_page_carry.test.ts (whole file) — infra-reuse-gap — reinvents the frame/window patching that the flip-in-place suite does per frame; a shared helper under `tests/support/` would stop the two harnesses drifting again.

## Batches
One batch. AC2496, AC2497 and AC2499 fail. AC2498, AC1029 and AC1036 are in the same file and are kept green as blast radius. AC2517-AC2522 run as dependency tests on the same panel. All of them share one test file, one harness and one root cause. Splitting the batch would hide the shared-harness change.

## Resolution ladder (REQ-938)
Batch 0 is decided at rung 1:
- BUG-79 is the latest intent in scope on this surface. It supersedes REQ-215's navigate-and-restore model.
- AC-2496/2497/2499 are already worded for BUG-79. The stale harness changes to match the ACs and the code.
- Rung 2 agrees: at `reconcile-src-BUG-79`, panel.js lines 243, 491-527, 608 and 742-771 show a frame per mode, priming, reveal-without-load and a write swapped in through an incoming frame.
- Rung 3 is not reached. Every assertion the ACs demand is kept.