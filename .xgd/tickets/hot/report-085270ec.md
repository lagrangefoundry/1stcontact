---
uid: report-085270ec
id: REPORT-2062
type: report
title: 'Capability-Intent Alignment: In-Page Copy Editing: The Editable Render & The
  Click-to-Edit Gesture (level=uat)'
created_by: xgd
created_at: '2026-08-16T04:10:23.501100+00:00'
updated_at: '2026-08-16T04:10:23.501100+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-12fee326
  level: uat
  violations: 1
  warnings: 2
  needs_review_count: 0
---

# Capability-Intent Alignment: In-Page Copy Editing: The Editable Render & The Click-to-Edit Gesture
# Level: uat

**Result**: FAIL
**Violations**: 1
**Warnings**: 2
**Needs review**: 0

Checked on `regression-d24ebf03`. Every path implicated below is byte-identical
to `main` — `git diff --stat main..HEAD` over `tests/`, `apps/control-app/src/builder/`,
`packages/framework/src/l1/` and `packages/site-schema/src/l1/` is empty — so
nothing here was introduced by this branch.

**Coverage (exists)**: all **47 active ACs** (14 under STORY-98, 33 under
STORY-101) have at least one `test_UAT_AC<n>_*` test, and every one of those
tests drives a real entry point: the `1c` CLI command functions, a real builder
origin over HTTP, a DOM parsed from the bytes `1c render --edit` wrote, the real
`defaultModal` composing the real `webui-fields` component, and — where a machine
can — Playwright. No structural/AST-only stand-ins, no internal mocking.

**One limitation of this run, stated rather than hidden**: this session has no
permission to execute the test suite (`vitest`, `pnpm test` and the local binary
were all denied), so every judgement below is from reading the tests, the ACs and
the production code they exercise — not from a pass/fail run. Green/red status is
the `check_uat_coverage` gate's job; the last one for this capability
(REPORT-1766, 2026-08-10 08:52Z) predates a repair that landed the same morning
(see Notes), so its `uat_coverage: fail` stamps should be re-earned rather than
read as current.

## Cumulative Intent Considered

At `uat` level the AC bodies are the working reference. I escalated to intent
history for exactly one AC — AC-1138, where the covering test asserts the
negation of the AC's own Verification, which is the evidence that forces the
question. All statuses re-read from the ticket store.

| Intent ID | UID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|---|
| BUNDLE-14 | `bundle-0385746c` | free_and_reconciled | 2026-08-06 | Originated STORY-98 — the edit render channel (BUG-31 + REQ-114 + REQ-116) | YES |
| REQ-116 | `request-41796766` | free_and_reconciled | 2026-07-31 | Non-functional channel, derived segments, L1 addresses, outlines | YES |
| REQ-117 | `request-395b67e6` | free_and_reconciled | 2026-07-31 | Click segment → fields modal → validated diff → re-render | YES |
| BUNDLE-16 | `bundle-15c1f647` | free_and_reconciled | 2026-08-07 | Originated STORY-101 — the gesture; updated STORY-98 (page stamp, hover rule, vocabulary→schema, contact-form seam) | YES |
| REQ-118 | `request-66e4c630` | free_and_reconciled | 2026-07-31 | Image selection through the same kind-agnostic gesture | YES |
| REQ-121 | `request-9707484c` | free_and_reconciled | 2026-08-07 | The modal made elegant: themed chrome, app typeface, dressed box, editing range | YES |
| REQ-128 | `request-de67e1a1` | free_and_reconciled | 2026-08-08 | A painted panel's background image through the same dialog | YES |
| REQ-132 | `request-5946d045` | free_and_reconciled | 2026-08-12 | The picker becomes a thumbnail grid labelled by file name | YES |
| REQ-135 | `request-a8ccd0dd` | free_and_reconciled | 2026-08-12 | Text properties in a parameter sheet (colour deferred) | YES |
| REQ-136 | `request-8a132869` | free_and_reconciled | 2026-08-12 | Image framing, shape and colour adjustment; updated STORY-98 (paint parity) | YES |
| REQ-138 | `request-1ff09fab` | free_and_reconciled | 2026-08-12 | Live preview: **four** parameters restyle the words as each is confirmed | YES — **drives V1** |
| BUG-35 | `bug-1bde3bf9` | ready_to_reconcile | 2026-08-13 | Capitalisation never previews — the UA reset blocks `text-transform` on the control | imminent — **fix present in the tree**; drives V1 |
| BUG-33 | `bug-ede1fb8c` | free_and_reconciled | 2026-08-08 | Test-side repairs to the builder-chrome suites | YES (see Notes) |
| BUG-34 | `bug-13082cb4` | bundled | 2026-08-12 | Gradient-filled text previews as invisible | imminent — no AC/UAT under this capability yet |
| REQ-139 | `request-3f57cd0c` | ready_to_reconcile | 2026-08-12 | Locked controls that cannot express what the element holds | imminent — correctly absent at UAT level |
| REQ-140 | `request-3c0fec69` | ready_to_reconcile | 2026-08-15 | Text colour and panel background from the palette | imminent — correctly absent at UAT level |

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-98 AC-948…958, AC-1007, AC-1008 — `tests/reconciliation-edit-render-channel.test.ts` (13 tests) | BUNDLE-14, REQ-116, BUNDLE-16 | **aligned** — unchanged since REPORT-1764 validated them test-by-test; neither the AC bodies (all last touched 2026-08-10 08:49–08:50) nor the test file has moved since. Entry-point evidence throughout (`cmdRender`/`cmdPublish`/`cmdRevisions`, bytes off disk). |
| STORY-98 AC-1135 — `tests/reconciliation-edit-render-paint-parity.test.ts:137` | REQ-136 | **aligned** — new since the last uat cycle and read in full here. Applies the adjustment through the *ordinary editing path* (`copy set`), compares the picture's `object-fit`/`object-position`/`filter`/`clip-path`/`transform` across edit vs preview vs published, and defeats the vacuous-equality failure the AC names by asserting the pan and the saturation are genuinely in the output, plus exactly one `filter:` declaration. |
| STORY-101 AC-993, AC-995, AC-996, AC-997, AC-998, AC-999, AC-1004, AC-1005, AC-1006 — `reconciliation-copy-edit-gesture.test.ts` | BUNDLE-16, REQ-117 | aligned — real bridge, real origin, real browser where the claim is geometric (AC-993 measures every region's box before/after hover in Playwright). |
| STORY-101 AC-994, AC-1000, AC-1001, AC-1002, AC-1003, AC-1050 — `reconciliation-copy-edit-gesture-modal.test.ts` | BUNDLE-16, REQ-117, REQ-128 | aligned — and the non-determinism REPORT-1764 raised is **gone**: `settle()` (`:248`) and `until()` (`:265`) now poll the thing being waited on instead of budgeting one macrotask. |
| STORY-101 AC-1037, AC-1038, AC-1040, AC-1041, AC-1042 — `reconciliation-copy-edit-form-presentation.test.ts` | REQ-121, REQ-135 | aligned — the browser-only halves (theme follow, resolved family, paint-order backdrop from a *sibling* layer) are driven in Playwright, and each asserts its own precondition before reading the answer. |
| STORY-101 AC-1039 — same file `:659` | REQ-121, REQ-135 | **gap: W1** — the box-side of the drop is proven; the sheet-keeps-its-labels half is asserted nowhere. |
| STORY-101 AC-1043 — same file `:1050` + `reconciliation-copy-edit-image-picker.test.ts:587` | REQ-121, REQ-132 | aligned — two tests, two clauses (panel width/height/Save reachability measured in a browser; the grid bounded from the other direction). Not duplicates. |
| STORY-101 AC-1044 — same file `:1245` | REQ-121, REQ-132, REQ-136 | **gap: W2** — the lone-field case and the grid case are proven; the "two or more fields *to the box*" case is not exercised, and the typography-beside-the-box precondition is not pinned. |
| STORY-101 AC-1028 — `req118-image-selection.test.ts:177`, `:408`, `reconciliation-copy-edit-image-picker.test.ts:628` | REQ-118, REQ-132, REQ-136 | aligned at this level — three clauses (CLI derivation + click resolution; the same `/api/copy` transport; the current handle is the *selected* tile). See Info 2 on the AC's stale framing sentence, which no test contradicts. |
| STORY-101 AC-1112, AC-1113, AC-1114, AC-1115, AC-1116 — `reconciliation-copy-edit-image-picker.test.ts` | REQ-132 | aligned — exact-in-both-directions grid against the derivation's own `enum`, file-name labels with the handle as tooltip and as the committed value, thumbnails fetched from the origin and byte-compared, the unloadable tile kept named/selected/saveable, and the radiogroup + initial focus. |
| STORY-101 AC-1123 — `reconciliation-copy-edit-parameter-sheet.test.ts:401` | REQ-135 | aligned — the split is partitioned from the descriptors the *origin* reports (not a name list), document order is asserted, one Save carries both forms, and the bound is measured in a browser at a viewport derived from what the sheet actually measures. |
| STORY-101 AC-1138 — `reconciliation-copy-edit-live-preview.test.ts:377` | REQ-138, BUG-35 (imminent) | **violation V1** — the test asserts capitalisation *reaches* the words; the AC's Criterion and Verification assert it does not. |
| STORY-101 AC-1139, AC-1140 — same file `:531`, `:601` | REQ-138 | aligned — AC-1139 asserts its own precondition (the box opened reduced) before testing the reduced case and computes the ratio itself rather than borrowing it; AC-1140 snapshots every declared custom property and re-checks each after one change. |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | AC-1138 (`acceptance_criterion-2d587432`) + `tests/reconciliation-copy-edit-live-preview.test.ts:508-522` | **ac-edit** (NOT uat-edit) | The test asserts the exact negation of its AC. AC-1138's Criterion: *"Capitalisation is written but does not arrive … it never reaches the copy"*; its Verification: *"choose a capitalisation, assert the property **is** set on the box, and assert the words' own capitalisation is **unchanged**"*. The covering test does the opposite at `:515` — `expect((await shown()).transform, 'and reaches the words').toBe('uppercase')`, measured on `.builder-modal__box .fields-control`, i.e. the element the words are drawn in — and at `:522` asserts it clears on turning it off. The test is the correct side: `apps/control-app/src/builder/builder.css:281-284` re-declares `text-transform: inherit; letter-spacing: inherit` on `.builder-modal__box .fields-control` under a comment naming REQ-138, so the mechanism the AC blames is repaired in the tree; REQ-138 (`request-1ff09fab`, free_and_reconciled) names four parameters, and BUG-35 (`bug-1bde3bf9`, ready_to_reconcile, 2026-08-13) exists precisely to close it. The AC's own escape clause — *"The day the words are drawn in something that carries that property, this assertion fails and the criterion is rewritten"* — has already been triggered. Same drift as REPORT-2061 finding 1 (ac level), still unrepaired | Repair the **AC**, not the test. Retitle to *"Size, weight, italic and capitalisation restyle the words in the editing box as each is confirmed, and nothing is written"*; delete the "recorded divergence" paragraph; rewrite the Verification's capitalisation clause to require that the property is set on the box **and** reaches the words, and clears when turned back off. Keep both measurements — they are what makes a regression in either half attributable. **Do not** weaken `:515`/`:522` to match the current AC text: that would retire verified behaviour REQ-138 asked for |
| 2 | warning | coverage | AC-1039 (`acceptance_criterion-fd4471a9`) | uat-edit | The AC's title and Verification both make the *scope* of the drop the criterion: *"the parameter sheet, refusals and dead ends keep theirs"*, and *"Assert the parameter sheet beneath the box does render visible labels for the parameters it holds"*. `test_UAT_AC1039_…` (`reconciliation-copy-edit-form-presentation.test.ts:659`) proves the box side (`:694` no `.fields-label` inside `.builder-modal__box`, `:697` the component's `stacked` layout), the dialog's accessible name (`:702`), the control's (`:704`), and both headings that stay (`:718`, `:729`) — but asserts nothing about the sheet. A repo-wide grep for `.fields-label` returns only the two "there are none" assertions (this file and `req121-copy-modal-elegance.test.ts:285`), so the half that distinguishes this AC from its pre-REQ-135 form is unproven anywhere: a component change that dropped labels globally would leave this test green | Extend the AC-1039 test: open the same copy region, take `.builder-modal__props`, and assert it renders a visible label per parameter row (non-empty `.fields-label` text matching the descriptor labels the origin reported), the mirror of the box assertion above it |
| 3 | warning | coverage | AC-1044 (`acceptance_criterion-472674ff`) | uat-edit | The AC states three cases; the test (`reconciliation-copy-edit-form-presentation.test.ts:1245`) exercises two. (a) *"where a region exposes two or more fields **to the box**, none is opened"* — the test's "two fields" case is the **image** dialog (`:1306`), which is the *other* bullet: a lone alt-text field beside a grid. Whether any region exposes two box fields today is itself unclear from the derivation, so the honest options are to construct one or to record in the AC that the case is unreachable — the current state claims it and shows nothing. (b) *"Assert this still holds where the region also exposes typography parameters in the sheet"* — the headline region does expose them since REQ-135, so the case is exercised incidentally, but nothing pins it: no assertion that `.builder-modal__props` is present in that dialog, so a derivation that stopped exposing typography would silently turn this back into the pre-REQ-135 easy case while staying green. (c) the *"keyboard is in the grid instead"* clause is proven, but under AC-1116 (`reconciliation-copy-edit-image-picker.test.ts:574`), not here | In the AC-1044 test: assert `.builder-modal__props` is present in the lone-field dialog (pinning the REQ-135 case), and either add a genuine two-box-field region or amend the AC to state that no region exposes two fields to the box today. Optionally assert `document.activeElement` is inside the picker in the image case, so all three bullets are readable in one place |
| 4 | info | consistency | AC-1028 (`acceptance_criterion-26ffac6d`) | — | REPORT-2061's second violation (the AC's closing *"Framing (crop, scale, scrim, rotation, position), upload and image processing are not offered"*, contradicted by REQ-136) does **not** manifest at UAT level: no test asserts framing's absence. Both `req118-image-selection.test.ts` assertions were widened for REQ-136 on purpose (`:202` `toMatchObject` with the comment *"the same values map now also reports how the picture is framed"*; `:419` `slice(0, 2)`), and `reconciliation-copy-edit-image-picker.test.ts:628` asserts only the selected tile. The tests are consistent with the AC's *Verification*; the stale sentence is in the Criterion and its repair is AC-side | none at this level — carried by REPORT-2061 |
| 5 | info | consistency | AC-994, AC-1000, AC-1001, AC-1002, AC-1003 | — | REPORT-1764's Finding 1 (the whole of `reconciliation-copy-edit-gesture-modal.test.ts` red on a single-macrotask `settle()`) is **repaired in the tree**: `settle()` now polls `modals().length` up to 200×5ms (`:248-252`) and a second poller `until()` waits on Save completion (`:265-267`), with a comment recording exactly the cascade that report diagnosed. The repair landed in `d4e2d7c98` (2026-08-10 10:50Z), ~2h after that report was written | none — but the five ACs still carry `uat_coverage: fail` stamped at 08:52Z that morning; those stamps predate the fix |
| 6 | info | consistency | AC-997 (`acceptance_criterion-e2413484`) | — | REPORT-1764's Warning 2 (the AC's *"however many fields were edited in it"* clause proven only under an FC-named test) is closed: `test_UAT_AC997_a_picked_image_and_new_alt_text_travel_in_one_change` (`reconciliation-copy-edit-image-picker.test.ts:657`) stages a tile *and* the alt text, asserts zero POSTs before Save, exactly one POST after, both values landed, and that the node's untouched `axes`/`id` travelled unchanged | none |
| 7 | info | exclusivity | AC-1037/1038/1039/1040/1041/1042 tests vs `tests/req121-copy-modal-elegance.test.ts` | — | The REQ-121 suite covers the same six scenarios in the same jsdom shape as the AC-named tests in `reconciliation-copy-edit-form-presentation.test.ts` (typeface token, dialog inside the shell, dropped heading/labels, dead-end heading keeps its own, the box dressed from the page, image fields not dressed as copy, faces copied and replaced, the editing range at both extremes). Under a strict reading these are same-shape duplicates; I am **not** raising it as a finding because they trace to the intent (`test_UAT_FC_REQ-121_*`) rather than to an AC, which is this repo's normal way of keeping free-coded evidence beside reconciled UATs, and because REPORT-1764 treated FC-named tests as valid-but-not-AC-traceable rather than as duplicates | none — recorded so a later reader does not "resolve" the overlap by deleting the AC-named copies |
| 8 | info | coverage | AC-1112, AC-1113, AC-1114, AC-1115, AC-1116 (and AC-1002) | — | Every test in `reconciliation-copy-edit-image-picker.test.ts` is `it.skipIf(!WEBUI_INSTALLED)`, and those five ACs have **no other test**. Where the out-of-band `@lagrangefoundry/webui-*` install is absent they therefore produce no evidence at all — the position REPORT-1764 flagged for AC-1002 alone, now spanning six ACs. The suite warns loudly at load (`:100`), which is what the story's Technical Context sanctions, and the other suites degrade to their CLI/HTTP halves rather than skipping outright. This session cannot determine whether the components resolve on this machine: the repo-local `node_modules` has no `@lagrangefoundry`, and `webuiPackageDir` walks *above* the worktree, which is outside this session's read permission | none — the honest fix is the private registry the story already names, not a test edit |

## Notes for the Editor

- **The only repair this level needs is an AC edit, and it is the same edit
  REPORT-2061 asked for.** V1 and REPORT-2061's finding 1 are one drift seen from
  two levels. If the uat-level fixer cannot edit ACs, this level cannot converge
  on its own — hand it back to the ac-level repair rather than re-running here.
  With four previous attempts on the clock, the failure mode to avoid is
  explicit: **editing `tests/reconciliation-copy-edit-live-preview.test.ts:515`
  to assert `text-transform` does *not* reach the words would make this level
  pass while deleting evidence for behaviour REQ-138 asked for and BUG-35 exists
  to protect.** The test is right; the criterion is stale.

- **Nothing else about the live-preview suite is in question.** AC-1139 and
  AC-1140 are among the strongest tests in this capability — each asserts its own
  precondition before testing the case it is about (AC-1139: the box really
  opened reduced; AC-1140: the sheet really reports a weight the run never
  declared), which is exactly the vacuous-pass failure mode the older suites were
  criticised for.

- **The two warnings are the same shape and are cheap.** Both are a clause an AC
  names and its test does not reach: the sheet's visible labels (W1) and the
  two-fields-to-the-box case (W2). Neither weakens what is currently proven; both
  are additive assertions in tests that already open the right dialogs.

- **Do not read the stored `uat_coverage` stamps as current.** AC-994, AC-1000,
  AC-1001, AC-1002 and AC-1003 carry `fail` from REPORT-1766 (2026-08-10 08:52Z),
  which was measuring the pre-repair `settle()`; STORY-101 and the capability
  carry `fail` from the same run. The race was fixed at 10:50Z the same day and
  the current tree matches `main`. Re-run `check_uat_coverage` before treating
  any of those as live failures — and note that this session was not permitted to
  run tests, so it could not re-earn them here.

- **No intent-level drift at this level beyond V1.** Every other AC traces
  cleanly to a `free_and_reconciled` intent, no test exercises retired behaviour,
  and the two `ready_to_reconcile` intents that would add behaviour (REQ-139
  locked controls, REQ-140 palette colour) are correctly absent from both the AC
  set and the test set. BUG-34 (gradient text previews invisible, `bundled`) has
  no covering AC or UAT under this capability yet; it is imminent rather than
  overdue, so it is recorded here rather than raised.
