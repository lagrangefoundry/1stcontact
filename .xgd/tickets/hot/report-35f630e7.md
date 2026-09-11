---
uid: report-35f630e7
id: REPORT-3822
type: report
title: 'Capability-Intent Alignment: In-Page Copy Editing: The Editable Render & The
  Click-to-Edit Gesture (level=uat)'
created_by: xgd
created_at: '2026-09-11T00:36:05.858524+00:00'
updated_at: '2026-09-11T00:36:05.858524+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-12fee326
  level: uat
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: In-Page Copy Editing: The Editable Render & The Click-to-Edit Gesture
# Level: uat

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

Anchor report: report-e37a6b4a. Previous attempts: 5. The `ac` level of this
cycle passed at REPORT-3818 (`report-25b51548`, 2026-09-10 23:53Z) and no AC body
has been touched since (latest AC `updated_at` in this capability is
2026-09-10 23:34:36Z, AC-1043), so AC bodies are the working reference here and
intent history was consulted only to re-date the ledger.

This cycle's uat check (REPORT-3819, `report-6885f18e`, 2026-09-11 00:05Z) raised
3 violations and 3 warnings. Two fixer calls followed — REPORT-3820
(`report-d48216d3`, committed `2b33084458`) and REPORT-3821 (`report-4a18649d`,
committed `6e6714be30`). **Every one of the three violations is genuinely
closed**, verified by reading the committed test source rather than by trusting
the fix summaries; so are warnings 5 and 6 and info 10. One warning — Finding 4,
AC-1044 — was only half closed, and the unclosed half is now shown to be
unreachable from any test. It is carried forward as a warning below, which is the
severity it has carried since REPORT-2062.

**Execution note, and it is load-bearing for how this report should be read**:
this session could execute only part of the evidence. `npm test` over the four
suites the fixers edited (`form-presentation`, `image-picker`, `parameter-sheet`,
`gesture-modal`) dies at `Error: listen EPERM: operation not permitted 0.0.0.0`
in `tools/generate/src/cli/builder.ts:363` — the sandbox refuses the listening
socket every one of those suites needs for its origin, so vitest reports **4
failed files, 24 skipped tests, 0 run**. That is the sandbox, not the tests. The
suites that need no socket do run: `edit-render-channel`,
`edit-render-paint-parity`, `colour-row`, `control-availability` and `tracking`
give **5 files, 20 passed**. So the five repairs below were confirmed by source
reading; REPORT-3820/3821's claim of 150 passing tests could not be reproduced
here and is neither confirmed nor contradicted.

## Cumulative Intent Considered

Every intent UID in the ledger was re-fetched this session; all 23 read
`free_and_reconciled`. None is `abandoned`, `deprecated` or `wont_fix`, so Step
2.5's named-stale-vehicle case does not arise anywhere in this capability. No
intent ticket created after BUNDLE-19 (2026-08-18) touches either story —
STORY-101's `updated_by` is still `bundle-77b28def` and STORY-98's is still
`request-8a132869`; the 2026-09-10 story/AC `updated_at` stamps are this cycle's
own matrix repairs, not new intent.

| Intent ID | UID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|---|
| REQ-44 | `request-3b78151f` | free_and_reconciled | 2026-07-03 | Tooling hygiene (carried in BUNDLE-16) | YES |
| BUG-31 | `bug-55832d21` | free_and_reconciled | 2026-07-31 | Deploy sandbox keyspace (carried in BUNDLE-14) | YES |
| REQ-114 | `request-3cd338cd` | free_and_reconciled | 2026-07-31 | L1 palette colour model | YES |
| REQ-115 | `request-a6740b4a` | free_and_reconciled | 2026-07-31 | Builder shell + display panel | YES |
| REQ-116 | `request-41796766` | free_and_reconciled | 2026-07-31 | **The edit render**: non-functional channel, derived segments, addresses, outlines | YES — creates STORY-98 |
| REQ-117 | `request-395b67e6` | free_and_reconciled | 2026-07-31 | **Copy editing end-to-end**: click → modal → validated diff → re-render | YES — creates STORY-101 |
| REQ-118 | `request-66e4c630` | free_and_reconciled | 2026-07-31 | Image selection through the same gesture | YES |
| BUNDLE-14 | `bundle-0385746c` | free_and_reconciled | 2026-08-06 | BUG-31 + REQ-114 + REQ-116 — STORY-98's originating intent | YES |
| BUNDLE-16 | `bundle-15c1f647` | free_and_reconciled | 2026-08-07 | REQ-117 + REQ-115 + REQ-44 — STORY-101's originating intent | YES |
| REQ-121 | `request-9707484c` | free_and_reconciled | 2026-08-07 | The modal made elegant: themed chrome, app typeface, page-faithful box | YES |
| BUG-33 | `bug-ede1fb8c` | free_and_reconciled | 2026-08-08 | Test-side repairs to the builder-chrome suites | YES |
| REQ-128 | `request-de67e1a1` | free_and_reconciled | 2026-08-08 | A container's `backgroundImageUrl` in the pick | YES |
| REQ-131 | `request-5d3bf630` | free_and_reconciled | 2026-08-11 | Draft change journal | YES (adjacent) |
| REQ-132 | `request-5946d045` | free_and_reconciled | 2026-08-12 | The picker becomes a thumbnail grid labelled by file name | YES |
| REQ-133 | `request-8467b1a3` | free_and_reconciled | 2026-08-12 | Palette popup: display, pick and edit | YES |
| REQ-135 | `request-a8ccd0dd` | free_and_reconciled | 2026-08-12 | Text properties in a parameter sheet | YES |
| REQ-136 | `request-8a132869` | free_and_reconciled | 2026-08-12 | Image framing, shape and colour adjustment; updated STORY-98 (paint parity) | YES |
| REQ-138 | `request-1ff09fab` | free_and_reconciled | 2026-08-12 | Live preview: four parameters restyle the words as each is confirmed | YES |
| REQ-139 | `request-3f57cd0c` | free_and_reconciled | 2026-08-12 | Locked controls that cannot express what the element holds | YES |
| BUG-34 | `bug-13082cb4` | free_and_reconciled | 2026-08-12 | Gradient-filled text previews as invisible | YES |
| BUG-35 | `bug-1bde3bf9` | free_and_reconciled | 2026-08-13 | Capitalisation never previews — UA reset blocks `text-transform` | YES |
| REQ-140 | `request-3c0fec69` | free_and_reconciled | 2026-08-15 | Text colour and panel background from the palette | YES |
| BUNDLE-19 | `bundle-77b28def` | free_and_reconciled | 2026-08-18 | REQ-133 + BUG-35 + REQ-131 + REQ-140 + REQ-139 + 4 more — STORY-101's `updated_by` | YES |

## Coverage: every active AC has an AC-named test

The capability holds **54 active ACs** — 14 under STORY-98, 40 under STORY-101.
A repo-wide sweep of `test_UAT_AC<n>_` names finds a test for **every one of
them**, with no AC left to a structural/AST-only check. The six ACs that
postdate the last `uat_coverage_check` (AC-1279…AC-1284) and AC-1143 all have
substantive suites: `reconciliation-copy-edit-colour-row.test.ts`,
`…-control-availability.test.ts`, `…-glyph-paint.test.ts`,
`…-tracking.test.ts`. No coverage gap at the AC granularity.

## Alignment Ledger

Only the elements whose state changed since REPORT-3819 are re-argued below; the
rest were validated test-by-test by REPORT-1764, REPORT-2062 and REPORT-3819 and
neither their AC bodies nor their suites have been touched since.

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-98 AC-948…958, AC-1007, AC-1008 — `tests/reconciliation-edit-render-channel.test.ts` | BUNDLE-14, REQ-116 | **aligned — and executed this session**: 13 tests, all passing, no socket required |
| STORY-98 AC-1135 — `tests/reconciliation-edit-render-paint-parity.test.ts:137` | REQ-136 | **aligned — and executed this session**, 1 test passing |
| STORY-101 AC-1039 — `…form-presentation.test.ts:709` | REQ-121, REQ-135 | **gap closed (was V1)**. `:768`–`:792` now takes `.builder-modal__props` and asserts the `.fields-label` set equals the origin's non-colour labels **and** the `.builder-color__label` set equals its colour labels — exact in both directions, partitioned on the descriptor's `type` rather than on a name list, with the component's required-field asterisk normalised. The box-side `:746` "there are none" can no longer be satisfied by a global label drop |
| STORY-101 AC-997 — `…image-picker.test.ts:701` | BUNDLE-16, REQ-117, REQ-132, REQ-136 | **gap closed (was V2)**. The test now drives all three controls — tile, alt text, and one bounded framing axis chosen from the origin's own descriptors (`:711`–`:722`) — asserts exactly one POST to `/api/copy` carrying all three (`:750`–`:764`), `saves` length 1, and replaces the old whole-`axes` equality with a descriptor-driven loop over every *untouched* parameter (`:774`–`:776`). That old assertion was the one the report called the deliberate opposite of the clause; it is gone |
| STORY-101 AC-1123 — `…parameter-sheet.test.ts:422` | REQ-135, REQ-136, REQ-140 | **gap closed (was V3)**. `sheetOrder()` (`:396`, first-occurrence-wins over `[data-field]`, the one attribute both control families stamp) is asserted against the descriptor sequence for the run (`:506`) and again for the **picture** (`:577`), where `:578` pins that the sheet really does mix control shapes — so a component grouping by control type passes the run and fails the picture. `:510`–`:511` states colour-first as a consequence of the rule rather than as a second rule |
| STORY-101 AC-1040 — `…form-presentation.test.ts:771` | REQ-121, REQ-135, BUG-34 | **gap closed (was W5)**. The backstop is now AC-traceable: fixture region `[0.9]` (`:82`–`:84`, `:232`–`:233`) is a run at `color: '#00000000'` carrying the page's own family and weight, appended last so no existing address moved; `:877`–`:893` opens it and asserts `--preview-color` and `--preview-text-image` are both empty **while family and weight are still mirrored** — the box degraded for want of paint, not because the dressing failed. Reached by the transparent-colour route rather than BUG-34's gradient, which is what makes it a backstop rather than the gradient case renamed |
| STORY-101 AC-1050 — `…gesture-modal.test.ts:646` | REQ-128, REQ-132, REQ-140 | **gap closed (was W6)**. Both unreached clauses are now driven at the AC that claims them. *A colour chosen there lands on that panel*: `:769`–`:833` asks the palette with `null`, asserts the pick is staged not committed (`:820`), Saves, and asserts `surfaceFill` on that panel becomes the palette **reference** `{ref:'brand'}` while the panel next door that also paints a fill is untouched (`:833`) — a row wired to the wrong address would be invisible without that last one. *A container that paints nothing is not a region*: `:734`–`:743` anchors on the element (`#root` is rendered, carries neither `data-l1-path` nor `data-l1-segment`, and contains a painted container that **is** addressable), so a page that never rendered cannot satisfy it |
| STORY-101 AC-1044 — `…form-presentation.test.ts:1380` | REQ-121, REQ-132, REQ-136 | **half closed, half now shown unreachable — W1 below.** The REQ-135 precondition is pinned (`:1410`–`:1412`: the lone-field dialog carries a sheet with more than one row), the opened control is asserted to be the box's (`:1420`–`:1423`), boolean rows are excluded with the reason stated (`:1424`–`:1431`), and the grid is asserted to hold the focus (`:1483`–`:1486`). What is still unexercised is the AC's own leading bullet |
| STORY-101 AC-1140 — `…live-preview.test.ts:601` | REQ-138, REQ-140 | **aligned, re-read in full this cycle.** The AC's Verification names family, tracking, the paint behind the words and colour by name; the test asserts `--preview-color` (`:625`), `--preview-font-family` (`:626`), `--preview-letter-spacing` (`:628`) and the background layers' `cssText` (`:630`) before the change and re-checks every declared custom property after it (`:636`–`:645`). Info 10's stale "AC-1138's recorded divergence" comment was reworded at `:701`–`:706` without touching the assertion |
| STORY-101 AC-1028 — `req118-image-selection.test.ts:177`, `:408`, `…image-picker.test.ts:628` | REQ-118, REQ-132, REQ-136 | aligned. The AC's newest paragraph (*"the field list does not stop at those two"*) is read from the derivation rather than a written list, and the three tests are three different scenarios rather than one repeated |
| STORY-101 AC-993…996, 998…1006, 1037, 1038, 1041…1043, 1050, 1112…1116, 1123, 1138, 1139, 1143, 1279…1284 | as per REPORT-3819 | aligned, unchanged. AC-1006 was re-read this session to confirm it is not a bare source scan: it fetches `/framework/edit-client.js` and `/framework/site-schema-edit.js` from a real origin, asserts the served module carries the same exports as the source the renderer is built against with no build-only syntax left in it, imports it as a real module script in a browser when one is available, and then walks the workspace source proving there is no second copy |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | coverage | AC-1044 (`acceptance_criterion-472674ff`) + `tests/reconciliation-copy-edit-form-presentation.test.ts:1380` | ac-edit | The AC's Verification says *"Then open the form over a region exposing two fields **to the box** and assert neither is opened into its control."* No test does this, and this session established **no test can**: `packages/site-schema/src/l1/edit.ts` derives exactly one `type: 'string'` field per region kind — `text` for copy (`:980`), `alt` for a picture (`:1000`), none for a painted box/container (`:1022`–`:1044`) — and `l1SegmentFields` has no branch at all for `'module'`, so a module seam returns `null` rather than a multi-string region. The test's two-field case (`:1464`) is the **image** dialog, which is the AC's *third* bullet (a lone alt-text field beside a grid), not its second. REPORT-3820/3821 pinned the REQ-135 precondition and the grid's focus but left this clause, and REPORT-3821 nonetheless recorded "warnings remaining: 0" — that count is wrong. Kept at the severity it has carried since REPORT-2062: it does not block, and no repair is available at this level | This is an **ac-level** repair, not a uat one — there is nothing to add to a test until the derivation grows a second box field. Amend AC-1044's second bullet and the matching Verification sentence to record that no region exposes two fields to the box today, so the rule reads as the forward-looking invariant it is (the same shape AC-1028 uses for its unbuilt list) rather than as a case that should have evidence. Do **not** resolve it by weakening the grid case into standing for it — they are different bullets |
| 2 | info | consistency | The three violations of REPORT-3819 | — | V1 (AC-1039), V2 (AC-997) and V3 (AC-1123) are all closed, and closed the way that report's Notes directed: additive assertions inside the tests that already opened the right dialog, with no AC body edited, no AC created or deprecated, and no production code changed. `git status` is clean and the two fix commits (`2b33084458`, `6e6714be30`) touch six test files and the change log and nothing else — the diffstat matches the fix summaries exactly, so the commit messages did not outrun their diffs | none |
| 3 | info | coverage | The socket-bound half of this capability's evidence, in **this** sandbox | — | Seven of the twelve suites here start a listening origin (`startBuilder`) and every one of them dies at `listen EPERM 0.0.0.0`: `form-presentation`, `image-picker`, `parameter-sheet`, `gesture-modal`, `gesture`, `live-preview`, `glyph-paint`. Vitest reports these as **failed files with zero tests run**, not as failing assertions. The five socket-free suites execute and pass (20/20). REPORT-3820 and REPORT-3821 both report large green runs, so the restriction is session-scoped rather than a property of the branch — but nothing in this report's reading of those seven suites is backed by an execution in this session | none — the finding is the sandbox, not the code. Whoever re-runs `check_uat_coverage` should confirm a listening socket is available before reading a green or red result as evidence |
| 4 | info | coverage | `node_modules/@lagrangefoundry` → `/Users/martin/lagrangefoundry/node_modules/@lagrangefoundry` | — | The symlink REPORT-3820 created is still present and is what makes `WEBUI_INSTALLED` true in this worktree. It is gitignored and out of band: on a checkout without it every assertion inside a `WEBUI_INSTALLED` gate skips or early-returns and the suites still report green. A green run is only evidence where that link (or a real install of the private packages) exists | none — the honest fix is the private registry STORY-101 already names |
| 5 | info | exclusivity | AC-named reconciliation suites vs `req121-copy-modal-elegance.test.ts`, `test_UAT_FC_BUG-34_glyph_fill_preview.test.ts`, `test_UAT_FC_REQ-138_live_preview.test.ts` | — | Unchanged from REPORT-3819's Info 8 and recorded again for the same reason: these FC-named suites overlap the AC-named ones in the same jsdom shape, but they trace to the intent rather than to an AC, which is this repo's normal way of keeping free-coded evidence beside reconciled UATs. Do not "resolve" the overlap by deleting either side. Note that AC-1040 no longer *depends* on the BUG-34 copy — REPORT-3821 gave it its own transparent-colour specimen — so the two are now genuinely two routes to one backstop rather than one test and its citation | none |
| 6 | info | — | `uat_coverage` stamps across this capability | — | AC-1039 and AC-1138 still read `fail`; AC-1143 and AC-1279…AC-1284 read nothing at all because they postdate the last `uat_coverage_check` (REPORT-2063, 2026-08-16 04:21Z). STORY-101 reads `stale` and the capability reads `fail`. None of these was re-earned or re-stamped here — the field belongs to `check_uat_coverage`, and setting it from an alignment check would be manufacturing progress. AC-1039's `fail` no longer corresponds to any finding in this report | none |

## Notes for the Editor

- **There is nothing for a uat-level fixer to do.** The one open finding is a
  warning whose only available repair is an edit to an AC body, which is an
  ac-level action. If the loop routes it to a uat fixer, the correct outcome is
  "no action available at this level" rather than an invented test — a test that
  manufactures a two-string-field region by editing `edit.ts` would be a
  production change made to satisfy a test, which is the wrong direction.

- **Two fixer calls in a row reported their own work accurately except for one
  count.** Both fix summaries describe mutation probes applied to production code,
  confirmed failing, and reverted; `git status` is clean and `editor.js`,
  `render.ts` and `page-style.js` carry no residue in the committed trees, which
  is consistent with those claims. The single inaccuracy is REPORT-3821's
  "Warnings remaining: 0", which overlooked the unclosed half of Finding 4.

- **The pattern REPORT-3819 warned about did not recur.** It predicted that any
  further ac-level run would leave freshly tightened ACs ahead of their suites.
  The ac level did not run again after 23:53Z, no AC body has moved since
  23:34:36Z, and both of the ACs edited at 23:17Z (AC-1028, AC-1140) were checked
  here against their tests and are aligned. The AC and test layers are, for the
  first time in this cycle, in the same state.
