---
uid: report-9216baaf
id: REPORT-2063
type: report
title: 'UAT Coverage: In-Page Copy Editing: The Editable Render & The Click-to-Edit
  Gesture'
created_by: xgd
created_at: '2026-08-16T04:21:39.832370+00:00'
updated_at: '2026-08-16T04:21:39.832370+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-12fee326
  violations: 3
  warnings: 3
  needs_review_count: 0
---

# UAT Coverage Assessment: In-Page Copy Editing: The Editable Render & The Click-to-Edit Gesture

**Result**: FAIL
**AC verdicts**: 45 pass, 2 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 1 pass (STORY-98), 0 fail, 1 stale (STORY-101), 0 needs_review
**Capability verdict**: fail

Assessed on `regression-d24ebf03`, attempt 5.

**Stated limitation of this run — no execution.** Every attempt to run the suite
(`npx vitest run …`) was denied by this session's permission mode, as it was for
REPORT-2060/2061/2062. So every judgement below is from **reading** the ACs, the
tests and the production code they drive — not from a pass/fail run. This is a
coverage assessment (does substantive evidence exist and does it exercise real
entry points), not a green/red gate; red/green remains `check_uat_coverage`'s
execution job. Where a verdict would have changed had a test been red, that is
called out.

Also worth stating: `node_modules/@lagrangefoundry` does not exist in this
worktree and no `webui-*` package is in its `pnpm` store, which is precisely the
linked-worktree resolution hazard `tools/generate/src/cli/webui.ts` documents. If
`WEBUI_INSTALLED` is false here, the dialog halves of most STORY-101 tests report
`NOT VERIFIED` and the whole image-picker file skips **on this machine**. That is
the story's declared, loud caveat rather than a matrix defect — recorded as
warning W3.

Read in full this round: `reconciliation-copy-edit-gesture-modal.test.ts`,
`reconciliation-copy-edit-gesture.test.ts`,
`reconciliation-copy-edit-image-picker.test.ts` (AC-1112…AC-1116, AC-997,
AC-1000, AC-1028, AC-1043), `reconciliation-copy-edit-parameter-sheet.test.ts`,
`reconciliation-copy-edit-live-preview.test.ts` (AC-1138 half),
`reconciliation-edit-render-paint-parity.test.ts`, and AC-1037/1038/1039/
1040/1041/1042/1043/1044 in `reconciliation-copy-edit-form-presentation.test.ts`.
Sampled (AC-953, AC-954) rather than re-read line by line:
`reconciliation-edit-render-channel.test.ts` — unchanged since 2026-08-07
(`git log` on the path) and validated test-by-test by REPORT-1766, with its ACs
unchanged since 2026-08-10. `req118-image-selection.test.ts` was read at
AC-1028's two entry points only.

## Cumulative Intent Considered

All statuses re-read from the ticket store this turn.

| Intent ID | UID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|---|
| BUNDLE-14 | `bundle-0385746c` | free_and_reconciled | 2026-08-06 | Originated STORY-98 — the edit render channel (BUG-31 + REQ-114 + REQ-116) | YES |
| BUNDLE-16 | `bundle-15c1f647` | free_and_reconciled | 2026-08-07 | Originated STORY-101 — the gesture; updated STORY-98 (page stamp, hover rule, vocabulary→schema, contact-form seam) | YES |
| REQ-118 | `request-66e4c630` | free_and_reconciled | 2026-07-31 | Image selection through the same kind-agnostic gesture | YES |
| REQ-121 | `request-9707484c` | free_and_reconciled | 2026-08-07 | The modal made elegant: themed chrome, app typeface, dressed box, editing range | YES |
| REQ-128 | `request-de67e1a1` | free_and_reconciled | 2026-08-08 | A painted panel's background image through the same dialog | YES |
| BUG-33 | `bug-ede1fb8c` | free_and_reconciled | 2026-08-08 | Test-side repairs to the builder-chrome suites | YES — closes REPORT-1766's findings 1–6 |
| REQ-132 | `request-5946d045` | free_and_reconciled | 2026-08-12 | The picker becomes a thumbnail grid labelled by file name | YES |
| REQ-135 | `request-a8ccd0dd` | free_and_reconciled | 2026-08-12 | Text properties in a parameter sheet beneath the box (colour deferred) | YES |
| REQ-136 | `request-8a132869` | free_and_reconciled | 2026-08-12 | Image framing/shape/colour adjustment; updated STORY-98 (paint parity, AC-1135) | YES |
| REQ-138 | `request-1ff09fab` | free_and_reconciled | 2026-08-12 | Live preview: **four** parameters restyle the words as each is confirmed | YES — **drives V1/V3** |
| BUG-35 | `bug-1bde3bf9` | ready_to_reconcile | 2026-08-13 | Capitalisation never previews — UA reset blocks `text-transform` on the control; **fix present in the tree** | imminent — **drives V1/V3** |
| BUG-34 | `bug-13082cb4` | bundled | 2026-08-12 | Gradient-filled text previews as invisible | imminent — no AC under this capability yet, correctly absent |
| REQ-139 | `request-3f57cd0c` | ready_to_reconcile | 2026-08-12 | Locked controls that cannot express what the element holds | imminent — correctly absent |
| REQ-140 | `request-3c0fec69` | ready_to_reconcile | 2026-08-15 | Text colour and panel background from the palette | imminent — correctly absent; AC-1140 and STORY-101 already scope colour out |

**No intent retires any behavior these 47 ACs describe**, so no AC is
`deprecated`. Every AC's behavior is supported by at least one reconciled or
imminent intent, so none is `needs_review`. One intent pair (REQ-138 + BUG-35)
retires a *clause* — the "capitalisation does not arrive" divergence — which is
what V1 and V3 are about.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-98 `story-af36c2cb` (14 ACs) | BUNDLE-14, BUNDLE-16, REQ-136 | **aligned, covered** | Every behavior the body claims — the third channel, the inert page, the settled state, derived segmentation, addresses, the page stamp, the module's own seam marker, renderer-drawn outlines, one published vocabulary, no leakage, and REQ-136's paint parity — has an AC and a test driving `cmdRender`/`cmdPublish`/`cmdRevisions`/`copy set` over bytes on disk. 14/14 pass. |
| STORY-101 `story-3bf94bd4` (33 ACs) | BUNDLE-16, REQ-118, REQ-121, REQ-128, REQ-132, REQ-135, REQ-136, REQ-138, BUG-35 | **stale** | 31/33 ACs covered by substantive, real-entry-point evidence. Two defects, both about the same seam: the body (and AC-1138) still record capitalisation as a delivered-minus-one divergence, which BUG-35's fix — live in `apps/control-app/src/builder/builder.css:281-284` — and the covering test have both retired. |

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | ac | AC-1138 `acceptance_criterion-2d587432` | **ac-edit** (NOT uat-edit) | The covering test asserts the **negation** of the AC. AC-1138's Criterion says *"Capitalisation is written but does not arrive … it never reaches the copy"* and its Verification demands asserting the words' capitalisation is **unchanged**. `test_UAT_AC1138_…` (`tests/reconciliation-copy-edit-live-preview.test.ts:515`) asserts `expect((await shown()).transform, 'and reaches the words').toBe('uppercase')` — measured on `.builder-modal__box .fields-control`, the element the words are drawn in — and at `:522` that it clears on turning it off. The test is the correct side: `builder.css:281-284` re-declares `text-transform: inherit; letter-spacing: inherit` on that control under a comment naming REQ-138, so the mechanism the AC blames is repaired in the tree. REQ-138 (reconciled) asked for four parameters; BUG-35 (`ready_to_reconcile`) exists to close exactly this. The AC's own escape clause — *"the day the words are drawn in something that carries that property, this assertion fails and the criterion is rewritten"* — has already fired. Carried over unrepaired from REPORT-2061/2062 | Retitle to *"Size, weight, italic and capitalisation restyle the words in the editing box as each is confirmed, and nothing is written"*; delete the "recorded divergence" paragraph; rewrite the Verification's capitalisation clause to require the property is set on the box **and** reaches the words, and clears when turned back off. Keep **both** measurements so a regression in either half stays attributable. **Do not** weaken `:515`/`:522` to match today's AC text — that would retire verified behaviour REQ-138 asked for |
| 2 | violation | uat | AC-1039 `acceptance_criterion-fd4471a9` | uat-edit | The clause the AC itself calls load-bearing is asserted **nowhere**. AC-1039's title and Verification both make the *scope* of the drop the criterion — *"the parameter sheet … keeps theirs"*, *"Assert the parameter sheet beneath the box does render visible labels for the parameters it holds"*. `test_UAT_AC1039_…` (`reconciliation-copy-edit-form-presentation.test.ts:659`) proves the box side (`:694` no `.fields-label` inside `.builder-modal__box`, `:697` the component's `stacked` layout), the dialog's accessible name (`:702`), the control's (`:704`) and the two headings that stay (`:718`, `:729`) — and nothing about the sheet. A repo-wide grep for `.fields-label` returns only two "there are none" assertions (this file and `req121-copy-modal-elegance.test.ts:285`); `reconciliation-copy-edit-parameter-sheet.test.ts` never mentions a label. A component change that dropped labels globally would leave every test in this capability green | Extend the AC-1039 test: on the same copy region take `.builder-modal__props` and assert it renders a visible, non-empty label per parameter row, matching each descriptor's `label`. One added block; no AC change |
| 3 | violation | story | STORY-101 `story-3bf94bd4` | story-body-edit | Independent story judgement (not an aggregate of the ACs). The body claims, in the *in-scope* bullet "The box follows the sheet": *"**Capitalisation is written like the others and does not arrive**… It is recorded as a divergence from what this was asked for rather than claimed as delivered"*, and the Technical Context repeats it at length under *"Capitalisation is written and does not arrive, and the mechanism is the font shorthand"* (including *"the covering criterion claims three parameters rather than four"*). BUG-35's fix is in the tree and the covering test proves the words do change, so the body describes behaviour cumulative intent has retired. Everything else in the body — kind-agnosticism, the two forms, the grid, the scale rule, the dead ends, the refusal path — is supported and covered | Rewrite the capitalisation clause to say all four parameters reach the words, delete the Technical Context divergence paragraph, and drop *"three of the four move"*. Land with finding 1 — they are one edit in two tickets |
| 4 | warning | uat | AC-1044 `acceptance_criterion-472674ff` | uat-edit / ac-edit | Two of the AC's three cases are proven — a lone box field opens in its control holding the region's words (`:1270-1272`) and an image dialog with a grid opens none (`:1312`). The third, *"where a region exposes two or more fields **to the box**, none is opened"*, is not exercised: the image case is a lone alt-text field beside a grid, not two fields in the box. No region kind can produce two box fields today, so the case may be unreachable rather than untested. The "keyboard is in the grid instead" clause is proven only indirectly, by AC-1116's test | Either add a case once a region exposes two text fields, or narrow the AC's Verification to the cases the derivation can actually produce and say why. Also worth scoping the lone-field assertion to `.builder-modal__box .fields-control`, since `querySelector` currently takes the first control in the dialog |
| 5 | warning | uat | AC-1043 `acceptance_criterion-8acf277e` | uat-edit | The grid half of AC-1043 is asserted from **stylesheet text** only: `test_UAT_AC1043_the_thumbnail_grid_is_bounded_and_scrolls_within_its_own_bounds` (`reconciliation-copy-edit-image-picker.test.ts:594-611`) regexes `max-height: min(52vh, 460px)` and `overflow-y: auto` out of `builder.css` and then only checks the dialog has a picker, no box and a Save button. A rule that exists but is overridden, or a grid that pushes the footer out anyway, passes. The panel/Save half **is** measured in a browser (`form-presentation:1128-1233`), and AC-1123's sheet obeys the same rule under real measurement (`parameter-sheet:542-598`) — so the pattern for a proper measurement already exists in the suite | Add a measured clause to the grid test on the model of AC-1123's: shrink the viewport, assert `clientHeight < scrollHeight` on `.builder-modal__picker` and that Save's box stays inside the viewport and is clickable |
| 6 | warning | — | environment (STORY-101's evidence) | — | This worktree has no `node_modules/@lagrangefoundry` and no `webui-*` package in its store, which is the linked-worktree resolution hazard `tools/generate/src/cli/webui.ts:124-137` documents. If `WEBUI_INSTALLED` is false in a run from here, AC-1002 skips outright, the ten `it.skipIf` tests in `reconciliation-copy-edit-image-picker.test.ts` (AC-997, AC-1000, AC-1028, AC-1043, AC-1112…AC-1116) skip outright, and the dialog halves of AC-994/1000/1001/1003/1037/1038/1039/1040/1041/1043/1044/1050/1123/1138/1139/1140 report `NOT VERIFIED`. The story declares this caveat and the skip is loud by design; it is recorded here so a green run from this worktree is not read as evidence it is not | No matrix change. Run the capability's suites from a checkout where `bin/install --lang js --component all` has been run, until a private registry exists |

## Notes for the Editor

- **Findings 1 and 3 are one repair in two places.** The same sentence lives in
  AC-1138's Criterion/Verification and in two places in STORY-101's body. Fix
  them together, and fix the *tickets* — the test and the CSS are already right.
  Anyone tempted to "make the test match the AC" should read `bug-1bde3bf9`
  first: it names the UA-reset mechanism, the probe that proved it, and the
  two-line fix that is already in `builder.css`.
- **REPORT-1766's six violations are closed.** Its root cause — `settle()` being
  a single `setTimeout(0)` against a real HTTP round trip — is repaired:
  `settle()` (`gesture-modal.test.ts:248`) and `until()` (`:265`) now poll the
  thing being waited on, and every test destroys its editor in a `finally`, so
  the cross-test modal and request bleed that produced findings 3 and 4 cannot
  recur. AC-994, AC-1000, AC-1001, AC-1002 and AC-1003 are re-stamped `pass`
  this round on that basis (subject to the no-execution limitation above).
- **Findings 2 and 5 are the same shape**: a criterion whose distinguishing half
  is asserted against source text, or not at all, while its obvious half is
  measured properly. Both have a worked model elsewhere in the same suite
  (AC-1123's sheet), so both are small edits rather than new harness.
- **Nothing here is an ac-add.** No behavior in either story body lacks an AC,
  and no AC lacks a test. Every gap this round is either a wrong AC (1), a
  wrong story body (3), or a test that stops one clause short (2, 4, 5).
