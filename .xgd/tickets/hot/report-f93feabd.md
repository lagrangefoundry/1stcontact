---
uid: report-f93feabd
id: REPORT-11689
type: report
title: 'Report: blocked_by_handoff for report-d402710c'
created_by: xgd
created_at: '2026-11-09T04:05:41.741444+00:00'
updated_at: '2026-11-09T04:24:18.288706+00:00'
completed_at: null
last_field_updated: ruling
fields:
  report_kind: blocked_by_handoff
  subject_uid: report-d402710c
  rule: code_frozen
  evidence: |-
    # Reconciliation Review: Story Coverage

    **Result**: FAIL
    **Mode**: commits
    **Surface**: (none)
    **Anchor**: bug-00de1faf
    **Stories Reviewed**: 1 (story-e674c60a / STORY-99)

    0 overrides audited, 0 touched a trust boundary. No `mode_override`, `blocked_by_handoff` or `aligned_to_tip` reports were injected.

    ## Intent (Step 1)

    BUG-79 body, settled at level 1 of the ladder. The governing statements are:
    - "The fix is not a better restore. It is not to navigate."
    - "A frame navigates only when what it shows is genuinely out of date: it has never been pointed anywhere, the site changed, an explicit `refresh()`, or a write. **Never for a mode switch.**"
    - "...so the FIRST flip is in place as well as every one after it."
    - "The carried state still syncs the two channels, captured from the outgoing document and applied to the incoming one."

    ## Behavior Inventory

    There are 14 behaviours in `apps/control-app/src/builder/panel.js`, `app.js` and `builder.css`. The main ones:
    1. Each src mode gets a frame at `registerMode` (`makeFrame`), kept for the panel's lifetime.
    2. `setMode` invalidates nothing and calls `show()`.
    3. `show()` navigates when `rec.stale || !sameUrl(rec.src, next)`. Otherwise it reveals the frame and emits `document`.
    4. **`rec.src` is the address the pane last set.** It is never updated from the frame's actual location, so a link the operator follows inside a frame leaves `rec.src` behind.
    5. Hiding uses `visibility` and `pointer-events` through `.builder-panel__pane` / `.builder-panel__frame`.
    6. A `load` on the shown frame emits `document`. A load on a frame that is not shown emits nothing. Every load calls `prime()`.
    7. `prime()` navigates idle frames whose `rec.src` differs from their mode's URL. Frames that are only stale are skipped.
    8. `setSite` and `refresh()` invalidate every frame.
    9. `reloadDocument()` stales the other frames and reloads the shown frame's own window, falling back to re-pointing it.
    10. All three write call sites use `reloadDocument`.
    11. `panel.frame` is a getter for the shown frame.
    12. `app.js` binds `rebind` (edit bridge, Marked Points, carry) to `panel.on('document')`.
    13. A mount mode calls `display(null)` but leaves `current` set.
    14. `sameUrl` resolves both addresses before comparing them.

    ## Coverage Map

    | # | Behavior | Coverage | Story / AC | Notes |
    |---|----------|----------|-------|-------|
    | 1 | Frame per document mode, created at registration | Covered | AC-968, AC-2517 | |
    | 2 | Mode switch invalidates nothing | Covered | AC-2517 | Holds only while no link has been followed (see gap G1) |
    | 3 | Navigate on switch when the address differs | **Absorbed divergence** | AC-2496 | See G1 |
    | 4 | `rec.src` lags behind a followed link | **Absorbed divergence** | AC-2496 | See G1 |
    | 5 | Idle frame hidden by visibility | Covered | AC-2518 | |
    | 6 | Only the shown frame's load is announced | Covered | AC-2520, decision (b) | |
    | 7 | Priming by differing address, not for stale frames | Covered | AC-2519 | |
    | 8 | Site change or refresh invalidates every frame | Covered | AC-2522 | |
    | 9 | Write reloads the shown frame in place and stales the others | Covered | AC-2521 | |
    | 10 | Three write call sites use `reloadDocument` | Covered | AC-2521 | |
    | 11 | `panel.frame` getter | Covered | story Technical Context | Internal detail |
    | 12 | Edit loop, Marked Points and carry bind to the panel's event | Covered | AC-2520 | |
    | 13 | Mount mode leaves `current` set | Uncovered | none | Acceptable: no mount mode is registered today, and nothing a user sees depends on it |
    | 14 | Addresses resolved before comparing | Covered | decision (c) | |

    ## Gaps (for fix_reconciliation_review)

    ### G1: AC-2496 and its UAT codify a navigation on a mode switch, which BUG-79 forbids (absorbed divergence)

    **Code**: `panel.js` `show()`, `if (rec.stale || !sameUrl(rec.src, next)) navigate(rec, next)`. `rec.src` is the address the pane last set (`navigate()`), not where the frame actually is.

    **Effect**: the operator follows a link in View from home to `about`, flips to Edit (in place), then flips back to View. View is already showing `about`, but `rec.src` still says home, so `show()` re-points View at `draft/about`. The pane blanks, the page re-renders, and the offset is re-applied on `load`. That is the exact BUG-79 symptom, and it happens in the most natural workflow: browse to the page you want, flip to Edit, flip back. It repeats after every followed link.

    **Where it was absorbed**:
    - AC-2496 (acceptance_criterion-e2cece6c), paragraph 3: "When the frame being flipped to holds a different page (for example, the operator followed a link inside that channel earlier, so the frame is no longer at the address the pane gave it), that one frame is pointed at the operator's page." This treats "no longer at the address the pane gave it" as if it meant "holds a different page". In the tested case the frame holds *the operator's page*.
    - `tests/test_reconciliation_builder_page_carry.test.ts`, lines 407–417 (`test_UAT_AC2496_…`). The test asserts `navsOf(viewFrame())` equals `[previewUrl('acme','draft','about')]` and redelivers the document. This pins the navigation of a frame that was already on the right page as correct behaviour.
    - Reconciliation decision (a) ("the channel they flip to navigates to that page; its address now differs") covers a frame that is at a *different* page. It does not record or justify re-navigating a frame that is *already at* the target page. So this is not a recorded intent-silent decision. It contradicts "Never for a mode switch" and "every [flip] after it".

    **Remediation**:
    1. Code (`panel.js`): decide "out of date" from where the frame actually is. Either update `rec.src` from `rec.el.contentWindow.location.href` on every load (guarded with try/catch, skipping `about:blank`), or compare `next` against the frame's live location in `show()` and `prime()`, falling back to `rec.src`. A frame already at `next` is then revealed with no navigation and announced through `emit('document')`, and the carry applies the offset to the laid-out document.
    2. AC-2496: rewrite paragraph 3 to say that a frame is pointed elsewhere only when the page it *actually holds* differs from the operator's page. A frame the operator's own link already took to that page is revealed in place. Update the Verification section so the switch back to View asserts no navigation and no load, and that the revealed document receives the carried offset (300).
    3. Test: change lines 413–417 of `test_UAT_AC2496_switching_view_and_edit_keeps_the_page_and_the_scroll_offset` to assert `navsOf(viewFrame())` is `[]`, that no environment load fired, that `viewFrame().contentDocument` is `view.doc`, and that `view.scrolled` ends with `300`.
    4. Consider adding the same link-then-round-trip scenario to `test_UAT_AC2517_…`, whose current scenario never follows a link and so cannot catch this.

    ## Ungrounded Stories

    None.

    ## Supersession Check (Step 4c)

    PASS. BUG-79 replaces a mechanism, not a pinned behaviour. AC-968 and AC-2496 are rewritten rather than superseded, and this is recorded in Reconciliation Decisions. No other sibling AC pins the single-frame model: AC-1029, AC-1036, AC-2145, AC-2497, AC-2498, AC-971 and AC-975 all still hold as written.

    ## Evidence Sufficiency (Step 5b)

    Covering UATs for AC-2517–2522 are in `tests/test_reconciliation_builder_flip_in_place.test.ts`. All passed in REPORT-11685. They run against the real `mountBuilder`, panel, toolbar, carry and framework edit bridge, with stand-ins only for browser behaviour jsdom lacks, and they mock nothing internal. AC-968, AC-2496, AC-2497 and AC-2498 are covered and passing. The AC-2496 UAT is valid as evidence, but it asserts the divergent behaviour (G1), so it has to change together with the AC. The FC file `tests/test_UAT_FC_BUG-79_flip_in_place.test.ts` was not selected by the scoped filter `test_UAT_FC_BUG_79` (hyphen vs underscore). It passes when run directly, and the AC-named suite supplies the evidence regardless.

    ## Plan Item Accounting

    | Plan Item | Expected Story | Status |
    |-----------|---------------|--------|
    | 1. Builder Workspace: Display Panel (upgrade) | story-e674c60a | ✓ Story updated; AC-968 and AC-2496 modified; AC-2517 to AC-2522 added |

    ## Judgment Calls

    - Behaviour 13 (mount mode keeps `current`) is omitted as immaterial. No mount mode is registered, so it cannot happen today.
    - G1 is material. The operator filed BUG-79 because flipping costs a re-render, and the ticket says "Never for a mode switch" and "every [flip] after it". A developer reading AC-2496 would think re-navigating View after a followed link was intended, and the operator would see the BUG-79 symptom on every return trip after browsing.
    - A missed navigation in the other direction (a frame elsewhere while `rec.src` matches) was considered and ruled out. The edit render emits no link targets (`edit-client.ts`), and the Edit frame is re-primed on every View load, so the Edit frame never wanders from its recorded address.

    ## Verdict

    FAIL. AC-2496 and `test_UAT_AC2496_…` absorb a navigation on a mode switch: View is re-fetched after a followed link even though it already shows the operator's page. This contradicts BUG-79's "Never for a mode switch" and is not covered by any recorded decision. Fix the comparison in `panel.js` so it uses the frame's actual location, rewrite AC-2496 paragraph 3 and its Verification, and update the UAT as described in G1. Everything else is faithful and covered.
  proposed_change: Apply the production-code remediation items in the review that
    need a `code_frozen` grant or an operator ruling, and add the UAT each one requires
    (see evidence).
  batch_index: -1
  parent_report_uid: ''
  anchor_ticket: bug-00de1faf
  ruling: granted
  ruling_reason: the planner granted an override in its plan
---

# Review gaps blocked by `code_frozen`

**Evidence**: # Reconciliation Review: Story Coverage

**Result**: FAIL
**Mode**: commits
**Surface**: (none)
**Anchor**: bug-00de1faf
**Stories Reviewed**: 1 (story-e674c60a / STORY-99)

0 overrides audited, 0 touched a trust boundary. No `mode_override`, `blocked_by_handoff` or `aligned_to_tip` reports were injected.

## Intent (Step 1)

BUG-79 body, settled at level 1 of the ladder. The governing statements are:
- "The fix is not a better restore. It is not to navigate."
- "A frame navigates only when what it shows is genuinely out of date: it has never been pointed anywhere, the site changed, an explicit `refresh()`, or a write. **Never for a mode switch.**"
- "...so the FIRST flip is in place as well as every one after it."
- "The carried state still syncs the two channels, captured from the outgoing document and applied to the incoming one."

## Behavior Inventory

There are 14 behaviours in `apps/control-app/src/builder/panel.js`, `app.js` and `builder.css`. The main ones:
1. Each src mode gets a frame at `registerMode` (`makeFrame`), kept for the panel's lifetime.
2. `setMode` invalidates nothing and calls `show()`.
3. `show()` navigates when `rec.stale || !sameUrl(rec.src, next)`. Otherwise it reveals the frame and emits `document`.
4. **`rec.src` is the address the pane last set.** It is never updated from the frame's actual location, so a link the operator follows inside a frame leaves `rec.src` behind.
5. Hiding uses `visibility` and `pointer-events` through `.builder-panel__pane` / `.builder-panel__frame`.
6. A `load` on the shown frame emits `document`. A load on a frame that is not shown emits nothing. Every load calls `prime()`.
7. `prime()` navigates idle frames whose `rec.src` differs from their mode's URL. Frames that are only stale are skipped.
8. `setSite` and `refresh()` invalidate every frame.
9. `reloadDocument()` stales the other frames and reloads the shown frame's own window, falling back to re-pointing it.
10. All three write call sites use `reloadDocument`.
11. `panel.frame` is a getter for the shown frame.
12. `app.js` binds `rebind` (edit bridge, Marked Points, carry) to `panel.on('document')`.
13. A mount mode calls `display(null)` but leaves `current` set.
14. `sameUrl` resolves both addresses before comparing them.

## Coverage Map

| # | Behavior | Coverage | Story / AC | Notes |
|---|----------|----------|-------|-------|
| 1 | Frame per document mode, created at registration | Covered | AC-968, AC-2517 | |
| 2 | Mode switch invalidates nothing | Covered | AC-2517 | Holds only while no link has been followed (see gap G1) |
| 3 | Navigate on switch when the address differs | **Absorbed divergence** | AC-2496 | See G1 |
| 4 | `rec.src` lags behind a followed link | **Absorbed divergence** | AC-2496 | See G1 |
| 5 | Idle frame hidden by visibility | Covered | AC-2518 | |
| 6 | Only the shown frame's load is announced | Covered | AC-2520, decision (b) | |
| 7 | Priming by differing address, not for stale frames | Covered | AC-2519 | |
| 8 | Site change or refresh invalidates every frame | Covered | AC-2522 | |
| 9 | Write reloads the shown frame in place and stales the others | Covered | AC-2521 | |
| 10 | Three write call sites use `reloadDocument` | Covered | AC-2521 | |
| 11 | `panel.frame` getter | Covered | story Technical Context | Internal detail |
| 12 | Edit loop, Marked Points and carry bind to the panel's event | Covered | AC-2520 | |
| 13 | Mount mode leaves `current` set | Uncovered | none | Acceptable: no mount mode is registered today, and nothing a user sees depends on it |
| 14 | Addresses resolved before comparing | Covered | decision (c) | |

## Gaps (for fix_reconciliation_review)

### G1: AC-2496 and its UAT codify a navigation on a mode switch, which BUG-79 forbids (absorbed divergence)

**Code**: `panel.js` `show()`, `if (rec.stale || !sameUrl(rec.src, next)) navigate(rec, next)`. `rec.src` is the address the pane last set (`navigate()`), not where the frame actually is.

**Effect**: the operator follows a link in View from home to `about`, flips to Edit (in place), then flips back to View. View is already showing `about`, but `rec.src` still says home, so `show()` re-points View at `draft/about`. The pane blanks, the page re-renders, and the offset is re-applied on `load`. That is the exact BUG-79 symptom, and it happens in the most natural workflow: browse to the page you want, flip to Edit, flip back. It repeats after every followed link.

**Where it was absorbed**:
- AC-2496 (acceptance_criterion-e2cece6c), paragraph 3: "When the frame being flipped to holds a different page (for example, the operator followed a link inside that channel earlier, so the frame is no longer at the address the pane gave it), that one frame is pointed at the operator's page." This treats "no longer at the address the pane gave it" as if it meant "holds a different page". In the tested case the frame holds *the operator's page*.
- `tests/test_reconciliation_builder_page_carry.test.ts`, lines 407–417 (`test_UAT_AC2496_…`). The test asserts `navsOf(viewFrame())` equals `[previewUrl('acme','draft','about')]` and redelivers the document. This pins the navigation of a frame that was already on the right page as correct behaviour.
- Reconciliation decision (a) ("the channel they flip to navigates to that page; its address now differs") covers a frame that is at a *different* page. It does not record or justify re-navigating a frame that is *already at* the target page. So this is not a recorded intent-silent decision. It contradicts "Never for a mode switch" and "every [flip] after it".

**Remediation**:
1. Code (`panel.js`): decide "out of date" from where the frame actually is. Either update `rec.src` from `rec.el.contentWindow.location.href` on every load (guarded with try/catch, skipping `about:blank`), or compare `next` against the frame's live location in `show()` and `prime()`, falling back to `rec.src`. A frame already at `next` is then revealed with no navigation and announced through `emit('document')`, and the carry applies the offset to the laid-out document.
2. AC-2496: rewrite paragraph 3 to say that a frame is pointed elsewhere only when the page it *actually holds* differs from the operator's page. A frame the operator's own link already took to that page is revealed in place. Update the Verification section so the switch back to View asserts no navigation and no load, and that the revealed document receives the carried offset (300).
3. Test: change lines 413–417 of `test_UAT_AC2496_switching_view_and_edit_keeps_the_page_and_the_scroll_offset` to assert `navsOf(viewFrame())` is `[]`, that no environment load fired, that `viewFrame().contentDocument` is `view.doc`, and that `view.scrolled` ends with `300`.
4. Consider adding the same link-then-round-trip scenario to `test_UAT_AC2517_…`, whose current scenario never follows a link and so cannot catch this.

## Ungrounded Stories

None.

## Supersession Check (Step 4c)

PASS. BUG-79 replaces a mechanism, not a pinned behaviour. AC-968 and AC-2496 are rewritten rather than superseded, and this is recorded in Reconciliation Decisions. No other sibling AC pins the single-frame model: AC-1029, AC-1036, AC-2145, AC-2497, AC-2498, AC-971 and AC-975 all still hold as written.

## Evidence Sufficiency (Step 5b)

Covering UATs for AC-2517–2522 are in `tests/test_reconciliation_builder_flip_in_place.test.ts`. All passed in REPORT-11685. They run against the real `mountBuilder`, panel, toolbar, carry and framework edit bridge, with stand-ins only for browser behaviour jsdom lacks, and they mock nothing internal. AC-968, AC-2496, AC-2497 and AC-2498 are covered and passing. The AC-2496 UAT is valid as evidence, but it asserts the divergent behaviour (G1), so it has to change together with the AC. The FC file `tests/test_UAT_FC_BUG-79_flip_in_place.test.ts` was not selected by the scoped filter `test_UAT_FC_BUG_79` (hyphen vs underscore). It passes when run directly, and the AC-named suite supplies the evidence regardless.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. Builder Workspace: Display Panel (upgrade) | story-e674c60a | ✓ Story updated; AC-968 and AC-2496 modified; AC-2517 to AC-2522 added |

## Judgment Calls

- Behaviour 13 (mount mode keeps `current`) is omitted as immaterial. No mount mode is registered, so it cannot happen today.
- G1 is material. The operator filed BUG-79 because flipping costs a re-render, and the ticket says "Never for a mode switch" and "every [flip] after it". A developer reading AC-2496 would think re-navigating View after a followed link was intended, and the operator would see the BUG-79 symptom on every return trip after browsing.
- A missed navigation in the other direction (a frame elsewhere while `rec.src` matches) was considered and ruled out. The edit render emits no link targets (`edit-client.ts`), and the Edit frame is re-primed on every View load, so the Edit frame never wanders from its recorded address.

## Verdict

FAIL. AC-2496 and `test_UAT_AC2496_…` absorb a navigation on a mode switch: View is re-fetched after a followed link even though it already shows the operator's page. This contradicts BUG-79's "Never for a mode switch" and is not covered by any recorded decision. Fix the comparison in `panel.js` so it uses the frame's actual location, rewrite AC-2496 paragraph 3 and its Verification, and update the UAT as described in G1. Everything else is faithful and covered.

**Proposed change**: Apply the production-code remediation items in the review that need a `code_frozen` grant or an operator ruling, and add the UAT each one requires (see evidence).

## Ruling: granted

the planner granted an override in its plan
