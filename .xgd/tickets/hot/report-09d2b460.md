---
uid: report-09d2b460
id: REPORT-11708
type: report
title: 'Reconciliation Review: commits (BUG-79 View/Edit flips in place)'
created_by: xgd
created_at: '2026-11-09T05:11:32.045776+00:00'
updated_at: '2026-11-09T05:11:32.045776+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: reconciliation_review
  subject_uid: bug-00de1faf
  anchor_uid: bug-00de1faf
  overrides_audited: 2
  trust_boundary_overrides: 0
  gaps:
  - id: G1
    kind: evidence_insufficient
    ac: AC-2521
    story: story-e674c60a
    test: tests/test_reconciliation_builder_flip_in_place.test.ts::test_UAT_AC2521_a_write_reloads_the_shown_page_in_place_and_stales_the_others
    summary: The UAT starts the write by calling app.panel.reloadDocument() directly
      (lines 438 and 473). It never goes through any of the three writes the AC names
      (palette change, assistant change, segment save), so the claim that each of
      those writes marks the idle channel out of date is untested.
    remediation: In the AC-2521 UAT, start the write through the real path for at
      least the segment save (the edit bridge's save resolving -> mountEditor onSaved)
      and the palette apply (openPalette onChanged), and the assistant's onSiteChanged
      if a driver exists (tests/test_UAT_FC_BUG-43_preview_follows_the_assistant.test.ts
      already has one). After each one, flip to the idle mode and assert navsOf(<idle
      frame>) equals [previewUrl(site, <idle channel>)], reading it synchronously
      before any await. Then assert the shown document's reloads() is 1. Tests only;
      production code is untouched.
---

# Reconciliation Review: Story Coverage

**Result**: FAIL
**Mode**: commits
**Surface**: (none)
**Anchor**: bug-00de1faf (BUG-79)
**Stories Reviewed**: 1 (story-e674c60a / STORY-99)

2 overrides audited, 0 touched a trust boundary.

## Intent

BUG-79 (body; its one chat comment adds no scope). The operator's words: "The fix is not a better restore. It is not to navigate." The fix:

- one frame per document mode, kept alive, and a switch only swaps which one is visible;
- an idle frame is hidden by `visibility`, never by `display`;
- a frame navigates only when it has never been pointed anywhere, after a site change or `refresh()`, or after a write;
- the idle channel is primed when it points at a different URL, never merely because it is stale;
- the carry lands on a document that is already laid out;
- `document` is announced on reveal as well as on load, and the builder binds to the panel's event;
- `panel.reloadDocument()` replaces the three `location.reload()` call sites, reloading the shown frame and marking the others stale;
- `panel.frame` is a getter, and `.builder-panel__frame` names the shown frame.

## Behavior Inventory

The code (`apps/control-app/src/builder/panel.js`, `app.js`, `builder.css`) shows 14 behaviours:

- `makeFrame` at `registerMode`;
- `display()` class swap;
- `.builder-panel__pane` and `.builder-panel__frame` visibility and pointer-events CSS;
- mount mode `display(null)`;
- `setMode` invalidates nothing;
- `show()` navigates only if stale or the src differs, and otherwise emits `document`;
- the load handler runs `follow()`, emits `document` only for the shown frame, then calls `prime()`;
- `prime()` navigates only on a different URL;
- `sameUrl` and `href` resolve before comparing;
- `setSite` and `refresh` call `invalidate()`;
- `reloadDocument()` calls `invalidate(current)` then `location.reload`, falling back to `navigate`;
- the `frame` getter;
- `onBeforeNavigate` fires on every show;
- the `app.js` `rebind` (Marked Points, carry, edit bridge) is on `panel.on('document')`, and palette, assistant and save all call `panel.reloadDocument()`.

## Coverage Map

| # | Behavior | Coverage | Story / AC | Notes |
|---|----------|----------|-----------|-------|
| 1 | Frame per document mode, created at registration, kept | Covered | STORY-99 / AC-968, AC-2517 | |
| 2 | Switch navigates neither channel, incl. after a followed link (`follow()`) | Covered | AC-2517, AC-2496 | The follow-a-link round trip is asserted synchronously, so it can tell implementations apart |
| 3 | Idle frame hidden by visibility/pointer-events, never `hidden`/`display:none`; only the shown frame carries `.builder-panel__frame` | Covered | AC-2518, AC-968 | Real `builder.css` loaded into jsdom |
| 4 | Mount mode hides frames by class | Covered | AC-968 | |
| 5 | Prime idle channel after visible load; stale-only frame not primed | Covered | AC-2519 | |
| 6 | `document` announced on reveal; only shown-frame loads announced; rebind on panel event | Covered | AC-2520 | Marked Points is bound in the same `rebind` the UAT proves is on the panel's event (app.js:593) |
| 7 | Carry captured from the outgoing document, applied to the revealed one | Covered | AC-2496, AC-2520 | |
| 8 | Write reloads the shown document in place (followed link kept) and stales the others | Partial (evidence) | AC-2521 | See G1: the write paths named by the AC are never driven |
| 9 | `setSite` / `refresh()` invalidate every frame; prime after site change | Covered | AC-2522 (2 UATs) | |
| 10 | Address comparison resolves against base | Covered | Reconciliation Decision (c) | Intent-silent, recorded |
| 11 | `reloadDocument` fallback re-points with no reachable window | Covered | Reconciliation Decision (d) | Intent-silent, recorded |
| 12 | `panel.frame` getter = shown frame | Covered | AC-2518 (`app.panel.frame` identity) | |

Intent fidelity: every behaviour in BUG-79 is captured faithfully in STORY-99's description (the "A View/Edit flip happens in place" bullet and the "frame-per-mode panel" technical note). The one divergence (G1 of the earlier review: `rec.src` did not follow a link the operator followed) was fixed in the code, not absorbed, and is recorded under Reconciliation Decisions. No ungrounded or invented claims.

## Supersession Check (Step 4c)

PASS. BUG-79 replaces a mechanism (one frame, re-pointed), not a behaviour pinned by another AC. AC-968 and AC-2496 were rewritten in place and keep their outcomes. AC-2497 (the panel survives the post-save reload) and AC-1029 (the edit mode opens at the reader's page) still hold as written. No active AC pins the retracted single-frame navigation.

## Evidence Sufficiency (Step 5b)

I ran these by path: `npx vitest run` over `tests/test_reconciliation_builder_flip_in_place.test.ts`, `tests/test_reconciliation_builder_page_carry.test.ts`, `tests/test_UAT_FC_BUG-79_flip_in_place.test.ts`, `tests/test_UAT_FC_REQ-215_panel_control.test.ts`, `tests/req115-builder-composition.test.ts`, `tests/reconciliation-builder-workspace-chrome.test.ts` and `tests/reconciliation-palette-popup-surface.test.ts`. Result: 7 files, 53 tests passed, 0 skipped (the webui components are installed, so `describe.skipIf` did not fire).

The UATs drive the real `mountBuilder`, the real panel, toolbar and carry, and the real framework `page-state` and edit bridge. The only things patched are browser facilities jsdom lacks (frame `contentWindow`/`contentDocument` delivery, `scrollY`/`scrollTo`, load interception). That is the platform, not repo code, so the evidence is valid.

- AC-968, AC-2496, AC-2517, AC-2518, AC-2519, AC-2520, AC-2522: sufficient. Each claim has an assertion that a broken implementation would fail. In particular, a `setMode` that invalidated, or a `show()` that always navigated, fails the synchronous `navsOf` reads in AC-2517 (follow-a-link round trip) and AC-2496. A missing `follow()` fails them too.
- **AC-2521: insufficient (G1).** The AC names three writes (palette change, assistant change, segment save) and claims each one reloads in place and marks the others stale. The UAT calls `app.panel.reloadDocument()` directly (test lines 438, 473), so it skips the real entry point. Two other UATs cover the call sites, and neither tells the candidates apart:
  - `test_UAT_AC1249` (palette) and `test_UAT_FC_BUG-43_a_write_reloads_the_preview_frame` (assistant) stub `contentWindow` and only count a reload.
  - So a call site that went back to `panel.frame.contentWindow.location.reload()` would pass every test. Yet the idle frame would then stay non-stale and show the pre-write render on the next flip, which is the exact failure BUG-79 says `reloadDocument` exists to prevent.
  - The two implementations behave differently, and no UAT makes the difference visible.

## Mode Override Audit

2 overrides audited, 0 touched a trust boundary.

- **report-569fb9d5** (code_frozen, rung 1, granted at 7d5853ad): adds `follow()` to `panel.js`, plus test rewrites for AC-2517, AC-2496 and AC-1029.
  1. `unnamed_files_touched` is empty: PASS.
  2. Earlier stories' tests pass (run above): PASS.
  3. Consistent with BUG-79 ("never for a mode switch", "the first flip is in place as well as every one after it") and with AC-2496/AC-2517: PASS.
  4. The diff matches the planner's stated scope (`follow()` only; staleness, `reloadDocument`, `setSite`/`refresh` and the classes untouched). The AC-1029 test edit is a direct consequence (View is now revealed rather than re-delivered): PASS.
  5. `trust_boundary_touched` is false: PASS.
  6. The only production file edited is `panel.js`, which is named, and the behaviour is demanded by the intent: PASS.
- **report-79175cb7** (code_frozen, granted at 7b603cb8): tests-only diff to the AC-2522 prime UAT.
  1. No production code was touched; `unnamed_files_touched` is empty: PASS.
  2. Tests pass: PASS.
  3. The new assertions (Edit's `src` attribute is acme edit before the load and other edit after it) match the AC-2522 Verification "assert the idle Edit frame has been pointed at the new site's edit address": PASS.
  4. This test was not in the planner's list. The edit only replaces an assertion that could not observe its subject with one that can, and adds a precondition. It changes no meaning: PASS.
  5. PASS.
  6. No production edit: PASS.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. Builder Workspace: Display Panel (upgrade) | story-e674c60a | ✓ (AC-968, AC-2496 rewritten; AC-2517 to AC-2522 added; Reconciliation Decisions recorded) |

## Judgment Calls

- Marked Points is not asserted separately in AC-2520. Acceptable: AC-2520's subject is which event the binding hangs on. `points.bind` sits inside the same `rebind` handler that the UAT shows firing on the panel's announcement (the edit-bridge hover and the carried offset both land on the revealed document). What Marked Points does after it binds belongs to REQ-210's criteria.
- Observation, not a failure: `navsOf()` read after an `await` always returns empty. The suite's MutationObserver has a no-op callback, so its records are delivered and discarded at the microtask boundary. The comment added at test line 539 says so. Assertions like these are vacuous: lines 271-272, 372, 385, 409, 444, 447, 453 and 481. In every BUG-79 AC I checked, another assertion carries the claim: a synchronous `navsOf`, the `document`-announcement count, `reloads()`, or a later forced flip. Read those assertions in that light. The cleanest fix is a recording callback in the suite's observer (`new MutationObserver(rs => record(rs))`). The fix step may fold that into the G1 change.
- The page-carry suite's `postSaveReload` helper also calls `panel.reloadDocument()` directly. That is AC-2497's evidence and AC-2497 is unchanged by this run, so it is not counted here. The G1 fix should drive a real save, which makes the same gesture available to both suites.

## Verdict

FAIL. The stories document BUG-79's intent faithfully and completely. Plan item 1 produced its output. Both overrides pass the audit, and nothing is superseded. One evidence gap remains:

- **G1, AC-2521** (`tests/test_reconciliation_builder_flip_in_place.test.ts::test_UAT_AC2521_a_write_reloads_the_shown_page_in_place_and_stales_the_others`). No UAT drives a real write (segment save via `mountEditor` `onSaved`, palette `onChanged`, assistant `onSiteChanged`) and then checks that the idle channel was marked stale. A call site that reverted to `panel.frame.contentWindow.location.reload()` would pass every test.
- **Remediation (tests only):** in that UAT, trigger at least the segment save and the palette apply through their real entry points. After each, flip to the idle mode and assert, synchronously before any await, that `navsOf(<idle frame>)` equals `[previewUrl(site, <idle channel>)]`. Also assert the shown document's `reloads()` is 1. Do the same for the assistant path if a driver exists; `tests/test_UAT_FC_BUG-43_preview_follows_the_assistant.test.ts` has one.
