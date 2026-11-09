---
uid: report-ab8bfe35
id: REPORT-11701
type: report
title: 'Reconciliation Review: commits (BUG-79 flip in place)'
created_by: xgd
created_at: '2026-11-09T04:51:04.457194+00:00'
updated_at: '2026-11-09T04:51:04.457194+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: reconciliation_review
  subject_uid: bug-00de1faf
  anchor_uid: bug-00de1faf
  overrides_audited: 1
  trust_boundary_overrides: 0
  gaps:
  - 'G1 story-e674c60a Technical Context, bullet ''The frame-per-mode panel (BUG-79)''
    (story-e674c60a.md:654-656): says each record holds ''the address that frame was
    last pointed at''. Since override report-569fb9d5 the record holds the address
    the frame ACTUALLY holds, refreshed from contentWindow.location.href on every
    load (panel.js:84-88, follow() at 178-185, called at 159), and show()/prime()
    compare against that. Rewrite the bullet to say so and that a frame the operator
    moved by following a link is judged by where it arrived (matching AC-2517 para
    2 and AC-2496 para 3).'
  - 'G2 story-e674c60a Reconciliation Decisions, BUG-79 entry (story-e674c60a.md:984-996):
    decision (a) says that after a followed link ''the channel they flip to navigates
    to that page''. That contradicts AC-2496 para 3, AC-2517 para 2 and the code:
    after the link''s load the idle channel is primed at that page (prime() on load),
    so the flip reveals it in place, and a frame is re-pointed only when the page
    it actually holds differs. Restate (a) accordingly. Also replace ''No contradiction
    between the code and BUG-79 was found'' with a record of the divergence found
    in review (show()/prime() compared against the pane-set rec.src, so a flip after
    a followed link re-navigated a frame already holding the page, i.e. the BUG-79
    symptom) and that it was fixed in panel.js under mode_override report-569fb9d5
    (code_frozen, rung 1).'
  - 'G3 AC-2522 evidence (tests/test_reconciliation_builder_flip_in_place.test.ts:484-523,
    test_UAT_AC2522_a_change_of_site_or_a_refresh_invalidates_every_channel): the
    claim ''Once the shown frame has loaded, an idle frame now pointing at a different
    address is primed behind it'' is not exercised. The test flips to Edit before
    View''s new-site document arrives, and the View frame it later checks was navigated
    by setSite itself, not by prime. Add a case: with View shown, setSite(''other''),
    deliver View at other (arrive(viewFrame(), ''draft'', ''other'', '''', ...)),
    and assert, before any flip, that Edit received a src write of previewUrl(''other'',
    ''edit''). Then flip to Edit, deliver it, and assert the reveal holds other''s
    edit document.'
  - 'G4 AC-2518, AC-2519, AC-2520, AC-2521 and AC-2522: each ''Reference UAT'' line
    names tests/test_UAT_FC_BUG-79_flip_in_place.test.ts, but the covering test_UAT_AC25xx_*
    UATs are in tests/test_reconciliation_builder_flip_in_place.test.ts (lines 307,
    347, 393, 434, 484). Point each Reference UAT at that file and test name, as AC-2517
    already does.'
---

# Reconciliation Review: Story Coverage

**Result**: FAIL
**Mode**: commits
**Surface**: (none)
**Anchor**: bug-00de1faf (BUG-79)
**Stories Reviewed**: 1 (story-e674c60a / STORY-99)

## Intent

BUG-79: "The fix is not a better restore. It is not to navigate." One frame per document mode, kept alive; a switch changes which frame is visible; idle frames are hidden by visibility, never display; a frame navigates only when it was never pointed anywhere, the site changed, refresh() was called, or a write happened; the idle channel is primed after the visible one loads, but only when its URL differs (never just because it is stale); the panel announces a document on reveal as well as on load, and the builder binds to the panel's event; panel.reloadDocument() reloads the shown document in place and marks the others stale; panel.frame is a getter for the frame on screen. There is one comment (the chat comment) and nothing in it contradicts the body.

## Behavior Inventory

13 behaviors identified in panel.js, app.js and builder.css.

## Coverage Map

| # | Behavior | Coverage | Story/AC | Notes |
|---|----------|----------|----------|-------|
| 1 | A frame per src-mode is created at registerMode and kept | Covered | AC-968, AC-2517 | |
| 2 | setMode invalidates nothing; show() navigates only if stale or the URL differs | Covered | AC-2517 | |
| 3 | Idle frames: .builder-panel__pane with visibility:hidden and pointer-events:none; the shown frame also carries .builder-panel__frame | Covered | AC-2518 | |
| 4 | A mount mode hides every frame by class, not by hidden | Covered | AC-968 | |
| 5 | prime() after any frame load navigates idle frames whose URL differs; a stale frame is not primed | Covered | AC-2519 | |
| 6 | follow(): on load, rec.src takes the frame's live href (so a frame moved by a followed link is judged by where it is) | Partial | AC-2517 para 2, AC-2496 para 3 | ACs are right; the story Technical Context still says 'last pointed at' (G1) |
| 7 | document is emitted on load of the shown frame and on reveal of a current frame; idle loads are not announced | Covered | AC-2520 | |
| 8 | app.js binds rebind (edit bridge, Marked Points, carry) to panel.on('document') | Covered | AC-2520 | |
| 9 | reloadDocument(): the shown frame reloads via location.reload (the followed link is kept), the others are marked stale, with a src re-point fallback | Covered | AC-2521 | |
| 10 | Palette, assistant and segment-save writes call panel.reloadDocument() | Covered | AC-2521 | |
| 11 | setSite / refresh() invalidate every frame and re-show | Covered | AC-2522 | the post-load priming claim in AC-2522 is unevidenced (G3) |
| 12 | panel.frame is a getter for the shown frame (null before any show) | Covered | story Technical Context | internal API, documented |
| 13 | URL comparison resolves against document.baseURI | Covered | story Reconciliation Decision (c) | |

## Intent Fidelity

Every behavior BUG-79 declares has an AC that captures it, so the ACs are faithful to the intent. One divergence (code against intent) came up during this run: show()/prime() compared against the pane-set rec.src, so after a followed link a flip re-navigated a frame that already held the page, which is the BUG-79 symptom. It was correctly resolved in favour of the intent: the code was fixed (follow()) and AC-2496 and AC-2517 were rewritten. The story narrative was not brought along with it. The Technical Context still describes the superseded rec.src semantics (G1). Reconciliation Decision (a) still says the flipped-to channel navigates after a followed link, and the BUG-79 decisions record still says no contradiction was found (G2). A developer who reads only the story gets exactly the model that produced the defect. That is material.

## Ungrounded Stories

None. Nothing in the story is supported by neither the intent nor the code. The stale passages in G1 and G2 describe behavior the code had earlier in this run and has since dropped.

## Supersession Check (Step 4c)

PASS. BUG-79 replaces a mechanism (one frame, re-pointed), not a criterion's outcome. AC-968 and AC-2496 were rewritten in place and no longer pin the single-frame or navigate-then-restore mechanism. The decision is recorded in Reconciliation Decisions ('Nothing is superseded'). AC-2497 (the panel survives the post-save reload) and AC-2145 still hold as written. No active sibling AC pins retracted behavior.

## Evidence Sufficiency (Step 5b)

I ran tests/test_reconciliation_builder_flip_in_place.test.ts, tests/test_reconciliation_builder_page_carry.test.ts, tests/test_UAT_FC_BUG-79_flip_in_place.test.ts, tests/test_UAT_FC_REQ-215_panel_control.test.ts, tests/reconciliation-builder-workspace-chrome.test.ts, tests/req115-builder-composition.test.ts and tests/reconciliation-palette-popup-surface.test.ts by path: 7 files, 52 tests, all passing, none skipped. The UATs mount the real composition (mountBuilder, the real panel, toolbar, carry, page-state and edit bridge). The only patching is of the browser: iframe contentWindow/contentDocument getters (jsdom does not load iframes), plus scroll and reload recording. Nothing repository-owned is replaced. Navigation is observed as src writes through a MutationObserver plus counted environment loads, so 'no navigation' is asserted directly, not inferred. AC-968, AC-2496, AC-2517, AC-2518, AC-2519, AC-2520 and AC-2521 each have assertions that would fail if their claims were broken; in particular AC-2517 and AC-2496 now cover the follow-a-link round trip, which fails without follow(). The one gap: in AC-2522, the claim that an idle frame is primed after the shown frame loads following a site change is not exercised (G3). The Reference UAT lines of AC-2518 to AC-2522 point at the FC file and not at the covering test_UAT_AC* tests (G4, bookkeeping).

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. Builder Workspace: Display Panel (upgrade) | story-e674c60a | ✓ (story updated_by bug-00de1faf; AC-2517 to AC-2522 added; AC-968 and AC-2496 modified) |

## Mode Override Audit

1 override audited, 0 touched a trust boundary.

report-569fb9d5 (code_frozen, rung 1, batch 0), not misjudged:
1. Named files only: files=[panel.js]; unnamed_files_touched is empty; the test edits fall outside code_frozen. Pass.
2. Earlier tests pass: the 7 suites that mount the panel pass (52/52). The STORY-99-scoped `xgd quality run --stories story-e674c60a` showed reds that are not caused by this diff. AC1030 and AC1417 fail because git cannot run in the sandbox (GIT_CONFIG_KEY_0, exit 128). The BUG-67 backend-settings tests fail on config. AC2186 (contacts tab, story-0034d937) fails because .builder-people__invite-* does not exist, in code this branch does not touch. A later builder run was killed by the sandbox's listen EPERM. The follow() diff touches none of these paths. Pass, noted.
3. Consistent with intent: BUG-79 says a frame never navigates for a mode switch and that the first flip is in place like every one after it; follow() is what makes that true after a followed link. AC-2517 and AC-2496 demand it. Pass.
4. Within stated scope: the diff adds follow() and its one call in the load handler, and changes nothing about staleness, reloadDocument, setSite/refresh or the visibility classes, as the planner instructed. The test edits match the instructions (AC2496 asserts no navs, no load, same doc, scrolled 300; AC2517 gains the link round trip). Pass.
5. Trust boundary: trust_boundary_touched is false and trust_boundary_mismatch is false. Pass.
6. code_frozen: edits only panel.js, and adds only behavior that AC-2517 and AC-2496 (and the BUG-79 body) demand. Pass.

Recorded but not a failure: follow() reads the live href, so a server redirect or a normalised query string could make sameUrl() see a difference that is not one and re-point a frame. That is acceptable under the same-origin preview model and is not a gap.

## Judgment Calls

- G1 and G2 are flagged as material. They are the exact mechanism behind the defect found in this run, and the story's own ACs contradict them. A reader of the story would be surprised by follow().
- G3 is flagged under Step 5b: the AC makes a specific claim that no assertion would catch being broken. The AC-2519 UAT covers prime() in general, but not after a site change.
- G4 is bookkeeping, listed so the fix pass covers it cheaply. On its own it would not fail the review.
- panel.frame being a getter, and URL resolution before comparison, are internal details that are already documented. They are not gaps.

## Gap List (for fix_reconciliation_review)

- **G1**, story-e674c60a.md:654-656, Technical Context 'The frame-per-mode panel (BUG-79)': replace 'the address that frame was last pointed at' with: the address the frame actually holds, i.e. the one it was last pointed at or the one it reached through a link followed inside it, refreshed from the frame's location on every load (panel.js follow()). show() and prime() compare against it, so a frame already holding the operator's page is revealed and not re-pointed.
- **G2**, story-e674c60a.md:984-996, Reconciliation Decisions, the BUG-79 entry: restate (a) so that after a followed link the idle channel is primed at that page behind it and the flip reveals it in place, and a frame is re-pointed only when the page it actually holds differs from the operator's page. Replace 'No contradiction between the code and BUG-79 was found' with a note of the divergence (rec.src tracked only pane-set addresses, so a flip after a followed link re-navigated, i.e. the BUG-79 symptom) and its code fix under mode_override report-569fb9d5.
- **G3**, tests/test_reconciliation_builder_flip_in_place.test.ts, test_UAT_AC2522 (line 484): add the site-change priming case. With View shown, setSite('other'), arrive View at other, and assert that Edit gets a src write of previewUrl('other','edit') before any flip. Then flip, deliver, and assert that the revealed document is other's edit document.
- **G4**, AC-2518, AC-2519, AC-2520, AC-2521, AC-2522: point each 'Reference UAT' line at tests/test_reconciliation_builder_flip_in_place.test.ts and its test_UAT_AC25xx_* test.

## Verdict

FAIL. The ACs and code faithfully implement BUG-79 and the mode override was correctly judged, but the story narrative still describes the superseded rec.src mechanism and says the flip navigates after a followed link (G1, G2), and AC-2522's post-site-change priming claim has no evidence (G3). The fix loop should address G1 to G4. They are matrix and test-only changes; no code change is needed.
