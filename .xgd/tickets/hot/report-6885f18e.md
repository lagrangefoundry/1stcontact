---
uid: report-6885f18e
id: REPORT-3819
type: report
title: 'Capability-Intent Alignment: In-Page Copy Editing: The Editable Render & The
  Click-to-Edit Gesture (level=uat)'
created_by: xgd
created_at: '2026-09-11T00:05:31.046261+00:00'
updated_at: '2026-09-11T00:05:31.046261+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-12fee326
  level: uat
  violations: 3
  warnings: 3
  needs_review_count: 0
---

# Capability-Intent Alignment: In-Page Copy Editing: The Editable Render & The Click-to-Edit Gesture
# Level: uat

**Result**: FAIL
**Violations**: 3
**Warnings**: 3
**Needs review**: 0

Anchor report: report-e37a6b4a. Previous attempts: 4. The `ac` level of this
cycle passed at REPORT-3818 (`report-25b51548`, 2026-09-10 23:53Z), so AC bodies
are the working reference here and intent history was consulted only to date the
clauses the ACs now carry.

**Tooling note for whoever runs the fixer**: every `xgd` subcommand in this
worktree dies with `CONFIGURATION_ERROR: Failed to load config file: [Errno 1]
Operation not permitted: .../main/.xgd/config.yaml`. That is a denied **write**,
not a denied read — the packaged template holds a key the live config lacks, so
`validate_config_file()` tries to rewrite main's `config.yaml` and the sandbox
refuses. This session ran the whole CLI through a shim that replaces
`validate_config_file` with its own body minus the write-back. The real remedy is
to add the missing key to main's `.xgd/config.yaml` via `xgd quality config` or
the dashboard.

## Cumulative Intent Considered

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
| REQ-139 | `request-3f57cd0c` | free_and_reconciled | 2026-08-12 | Locked controls that cannot express what the element holds | YES — **was `ready_to_reconcile` at REPORT-2062; now landed** |
| BUG-34 | `bug-13082cb4` | free_and_reconciled | 2026-08-12 | Gradient-filled text previews as invisible | YES — **was `bundled`; now landed** |
| BUG-35 | `bug-1bde3bf9` | free_and_reconciled | 2026-08-13 | Capitalisation never previews — UA reset blocks `text-transform` | YES — **was `ready_to_reconcile`; now landed** |
| REQ-140 | `request-3c0fec69` | free_and_reconciled | 2026-08-15 | Text colour and panel background from the palette | YES — **was `ready_to_reconcile`; now landed** |
| BUNDLE-19 | `bundle-77b28def` | free_and_reconciled | 2026-08-18 | REQ-133 + BUG-35 + REQ-131 + REQ-140 + REQ-139 + 4 more — STORY-101's `updated_by` | YES |

No intent in the ledger is `abandoned`, `deprecated` or `wont_fix`; none retires
behaviour another one asked for. The four intents REPORT-2062 recorded as
*imminent* (REQ-139, REQ-140, BUG-34, BUG-35) have all since reconciled and all
four now have ACs **and** substantive UATs under this capability — AC-1282/1283,
AC-1279/1280/1281, AC-1143 and AC-1138 respectively. That is the largest single
change at this level since the last uat cycle and it is clean.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-98 AC-948…958, AC-1007, AC-1008 — `tests/reconciliation-edit-render-channel.test.ts` (13 tests) | BUNDLE-14, REQ-116 | **aligned** — validated test-by-test by REPORT-1764 and re-read by REPORT-2062. The only change since is `30abfebebd` (2026-08-20), which added `await` to two `cmdRevisions` calls at `:871`/`:902` when the store went async. No assertion changed. AC bodies are untouched; their later `updated_at` is the `uat_coverage` stamping of 2026-08-16 04:18–04:19. |
| STORY-98 AC-1135 — `tests/reconciliation-edit-render-paint-parity.test.ts:137` | REQ-136 | **aligned** — applies the adjustment through the ordinary editing path, compares the picture's framing/shape/filter/transform across edit vs preview vs published, and defeats vacuous equality by asserting the pan and the saturation are genuinely present. |
| STORY-101 AC-993, AC-995, AC-996, AC-998, AC-999, AC-1004, AC-1005, AC-1006 — `reconciliation-copy-edit-gesture.test.ts` | BUNDLE-16, REQ-117 | aligned — real bridge, real origin, real browser where the claim is geometric. |
| STORY-101 AC-997 — `reconciliation-copy-edit-gesture.test.ts:531` + `reconciliation-copy-edit-image-picker.test.ts:658` | BUNDLE-16, REQ-117, REQ-132, REQ-136 | **gap: V2** — the AC was rewritten 2026-09-10 23:34Z around a **three-control** dialog; both tests predate it and neither stages a sheet parameter. |
| STORY-101 AC-994, AC-1001, AC-1002, AC-1003 — `reconciliation-copy-edit-gesture-modal.test.ts` | BUNDLE-16, REQ-117, REQ-140 | aligned — AC-1001's specimen moved to a **seam** when REQ-140 gave painted panels a colour, and the test moved with it (`:409`, asserting `kind === 'slot'`, empty field list, no form controls). |
| STORY-101 AC-1000 — `gesture-modal.test.ts:522` + `image-picker.test.ts:699` | REQ-117, REQ-128, REQ-140 | aligned — confirm and cancel proven equivalent on a copy region, and an untouched backdrop dialog (picker + colour row, no box) proven to issue no POST. The fixture at `image-picker.test.ts:160` carries both `backgroundImageUrl` and `surfaceFill`, so the AC's new "and its colour" clause lands on the right dialog even though the row itself is not asserted present — not raised, but see the second bullet in Notes. |
| STORY-101 AC-1050 — `gesture-modal.test.ts:621` | REQ-128, REQ-132, REQ-140 | **gap: W3** — the fill-only panel is opened and proven not to be a dead end (`:693`, `:732`), but the AC's "a colour chosen there lands on that panel" and "a container that paints nothing is not offered as a region at all" are proven only under other ACs. |
| STORY-101 AC-1037, AC-1038, AC-1041, AC-1042 — `reconciliation-copy-edit-form-presentation.test.ts` | REQ-121, REQ-135 | aligned — browser-driven where the claim is a resolved value, each asserting its own precondition first. |
| STORY-101 AC-1039 — same file `:689` | REQ-121, REQ-135 | **gap: V1** — the box-side drop, the dialog's accessible name, the control's, and both retained headings are proven; the sheet-keeps-its-labels half is asserted nowhere in the repository. |
| STORY-101 AC-1040 — same file `:771` | REQ-121, REQ-135, BUG-34 | **gap: W2** — the paint-order backdrop from a sibling layer is measured in a browser with real geometry, and the alt-text-is-not-page-copy clause is proven; the transparent-foreground backstop has evidence only under an FC-named test. |
| STORY-101 AC-1043 — same file `:1078` + `image-picker.test.ts:587` | REQ-121, REQ-132, REQ-140 | aligned — panel width, editing-area height and Save reachability measured in a browser at 900×320 and *driven*, the narrow dead-end width measured, the refusal-does-not-narrow case driven, and the grid bounded from the other direction. |
| STORY-101 AC-1044 — same file `:1286` | REQ-121, REQ-132, REQ-136 | **gap: W1** — the lone-field case and the grid case are proven; "two or more fields **to the box**" is not exercised and the typography-beside-the-box precondition is not pinned. Unchanged since REPORT-2062. |
| STORY-101 AC-1028 — `req118-image-selection.test.ts:177`, `:408`, `image-picker.test.ts:628` | REQ-118, REQ-132, REQ-136 | **aligned, and REPORT-2062's Info 4 is closed** — the AC's stale "framing is not offered" sentence was repaired at ac level, and the test now positively asserts the list does not stop at `src`/`alt`: it reads the framing descriptors from the response and asserts every one is a bounded integer or a closed enum, with no free-form length, colour function or path. |
| STORY-101 AC-1112…AC-1116 — `reconciliation-copy-edit-image-picker.test.ts` | REQ-132 | aligned — exact-in-both-directions grid, file-name labels with the handle as tooltip and as the committed value, thumbnails fetched and byte-compared, the unloadable tile kept named/selected/saveable, and the radiogroup with initial focus. |
| STORY-101 AC-1123 — `reconciliation-copy-edit-parameter-sheet.test.ts:422` | REQ-135, REQ-136, REQ-140 | **gap: V3** — the split is partitioned from the origin's own descriptors across three region kinds, the box/sheet document order is asserted, the panel's sheet-without-a-box is asserted, one Save carries both forms, sheet-only and nothing-touched are both driven, and the bound is measured in a browser at a viewport derived from what the sheet really measures. The one clause with no assertion is the **row order within the sheet**. |
| STORY-101 AC-1138 — `reconciliation-copy-edit-live-preview.test.ts:377` | REQ-138, BUG-35 | **aligned — REPORT-2062's violation V1 is repaired.** The AC was retitled and its recorded divergence deleted (2026-08-20 03:36Z), and the test now asserts all four parameters on `.builder-modal__box .fields-control` in a real engine, both halves for capitalisation (`:514`, `:515`), and the clear-on-off for italic and capitalisation alike. The repair went the way REPORT-2062 asked: the AC moved, the evidence did not weaken. |
| STORY-101 AC-1139, AC-1140 — same file `:531`, `:601` | REQ-138, REQ-140 | aligned — AC-1140 now snapshots every declared custom property including `--preview-color` (which gained a control under REQ-140 and must still come from the render) and re-checks each after one change, then drives the inherited-weight case in a browser. |
| STORY-101 AC-1143 — `reconciliation-copy-edit-glyph-paint.test.ts:191` | BUG-34 | aligned — real render, real editor, opened by clicking the words; gradient run and ordinary run in one test; the last hop is asserted against `builder.css` and the reason (jsdom resolves no `var()`) is stated in the test header rather than hidden. |
| STORY-101 AC-1279, AC-1280, AC-1281 — `reconciliation-copy-edit-colour-row.test.ts:329`, `:442`, `:559` | REQ-140, REQ-133 | aligned — new since the last uat cycle and read in full. AC-1280 asserts the no-panel case **first** so "the row is present" cannot pass on an unconditional row, and drives the second lap (panel repainted from the palette, row still reports it). AC-1281 drives the **real** popup and transport rather than the stub the other two use, which is the only honest way to test what an empty palette does. |
| STORY-101 AC-1282, AC-1283 — `reconciliation-copy-edit-control-availability.test.ts:267`, `:346` | REQ-139 | aligned — one fixture, two locks from two different control families, asserted indistinguishable; `disabled` asserted natively rather than by class, with the picker proven unreachable; and the contrast run proves the lock is per-control rather than per-dialog. |
| STORY-101 AC-1284 — `reconciliation-copy-edit-tracking.test.ts:169` | REQ-138, BUG-35 | aligned — browser-only by construction, both halves kept apart, the untracked run proving the fix is an inheritance rather than a forced value, and the sheet asserted to stay at the chrome's own tracking so a widened selector fails here. |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | AC-1039 (`acceptance_criterion-fd4471a9`) + `tests/reconciliation-copy-edit-form-presentation.test.ts:689` | uat-edit | Half of the AC's own title — *"the parameter sheet, refusals and dead ends keep theirs"* — and an explicit Verification sentence — *"Assert the parameter sheet beneath the box does render visible labels for the parameters it holds"* — are asserted nowhere. The test proves the box side at `:724` (`box.querySelectorAll('.fields-label')` is empty) and the two retained headings at `:749`/`:759`, but never looks at `.builder-modal__props`. A repo-wide grep for `.fields-label` outside `dist-assets` returns exactly two sites, `:724` and `req121-copy-modal-elegance.test.ts:285`, and both are "there are none" assertions — so a component change that dropped labels **globally** would leave every test in this capability green while deleting the thing REQ-135 added. The AC carries `uat_coverage: fail`. Raised as a violation rather than the warning REPORT-2062 gave it because the unproven clause is a title clause, not a detail, and the scope of the drop *is* what distinguishes this AC from its pre-REQ-135 form | In `test_UAT_AC1039_…`, on the same already-open copy dialog: take `.builder-modal__props` and assert it renders one non-empty `.fields-label` per parameter row, with text matching the labels the origin reported in `loaded.fields` (which the test already has in hand at `:709`). It is the mirror of the `:724` assertion, four lines below it |
| 2 | violation | consistency | AC-997 (`acceptance_criterion-e2413484`) + `tests/reconciliation-copy-edit-image-picker.test.ts:658` | uat-edit | The AC was rewritten at ac level on **2026-09-10 23:34Z** around the three-control dialog: its Criterion now says *"A dialog over an image region holds the thumbnail grid…, the editing box for its alt text, and the parameter sheet for how the picture is framed…; a new image, new alt text and an altered framing parameter travel in one change"*, and its Verification says *"Then alter the thumbnail, the alt text **and one framing parameter in the sheet**, and assert a single change request carries all three together and produces one re-rendering."* No test does this. `image-picker.test.ts:658` stages a tile and the alt text and then asserts the framing axes are **unchanged** (`:689`, `expect(node.axes).toEqual({ objectFit: 'cover' })`) — the deliberate opposite of the clause. `gesture.test.ts:531` is a single text field. The nearest neighbours reach only two of the three controls: `parameter-sheet.test.ts:422` stages box+sheet, `colour-row.test.ts:329` stages box+colour. The one merge that has never been exercised is the one with the **grid** in it, which is exactly the seam the story's "controls are composed, not chained" note says silently undid every pick once | Extend `test_UAT_AC997_a_picked_image_and_new_alt_text_travel_in_one_change`: after picking the tile and typing the alt text, also set one framing parameter in `.builder-modal__props` (read its name from the descriptors the origin reports, not from a list in the test), then assert exactly one POST, that its `values` carries all three, that `saves` has length 1, and replace the `:689` axes assertion with one that the touched axis moved and the untouched ones did not |
| 3 | violation | consistency | AC-1123 (`acceptance_criterion-35907074`) + `tests/reconciliation-copy-edit-parameter-sheet.test.ts:422` | uat-edit | The AC states *"The sheet holds **one order, and it is the surface's**… a control the dialog draws itself must not reorder the field list the surface declared"* and its Verification requires *"that the sheet's rows appear in the order the surface declared them."* The test asserts **membership only** — `rowIn(sheet, field.name)` per field at `:469`/`:472`/`:501` — and the only order assertion in the file is box-before-sheet (`:478`, `:536`). A repo-wide grep finds no assertion anywhere that compares the sheet's rendered row sequence to the descriptor sequence. This is load-bearing rather than cosmetic: the colour rows are drawn by the dialog and the typed rows by the shared component, so the sheet is assembled from two sources and the surface's order is the only thing saying how they interleave; STORY-101's Technical Context records that the colour row *"sits first in the sheet, which is where the derivation puts it"*, and nothing would fail if it stopped doing so | In `test_UAT_AC1123_…`, after the membership loops: read the sheet's rows in document order (`[...sheet.querySelectorAll('[data-field]')].map(el => el.getAttribute('data-field'))`) and assert that sequence equals `parameters.map(f => f.name)` — the descriptor list the test already derived from the origin at `:451`. Repeat over the picture dialog for `asSheet`, where the interleave actually has more than one shape |
| 4 | warning | coverage | AC-1044 (`acceptance_criterion-472674ff`) + `tests/reconciliation-copy-edit-form-presentation.test.ts:1286` | uat-edit | Unchanged since REPORT-2062 raised it. The AC states three cases and the test exercises two. (a) *"where a region exposes two or more fields **to the box**, none is opened"* — the test's two-field case (`:1347`) is the **image** dialog, which is the other bullet (a lone alt-text field beside a grid); no region with two box fields is constructed, so the clause the AC leads with shows nothing. (b) *"Assert this still holds where the region also exposes typography parameters in the sheet"* — the headline does expose them since REQ-135, but nothing pins it: the test never asserts `.builder-modal__props` is present in that dialog, so a derivation that stopped exposing typography would quietly turn this back into the pre-REQ-135 easy case while staying green | Assert `.builder-modal__props` is present in the lone-field dialog before reading `.fields-control` (pinning the REQ-135 case), and either construct a region exposing two fields to the box or amend the AC to record that none does today. Optionally assert `document.activeElement` is inside the picker in the image case so all three bullets read in one place |
| 5 | warning | coverage | AC-1040 (`acceptance_criterion-15ea0e87`) | uat-edit | The AC's *"A foreground that paints nothing is not a foreground"* paragraph is explicitly scoped as *"a backstop over the whole mirroring rule rather than a case of it"*, and its Verification asks for it on *"a run whose resolved colour is fully transparent **and which carries no glyph paint**"*. `test_UAT_AC1040_…` (`:771`) does not open such a run. The case is genuinely covered — `tests/test_UAT_FC_BUG-34_glyph_fill_preview.test.ts:215` opens a `GHOST` run and asserts `--preview-color` is `''` with no glyph image — but under an FC name traceable to BUG-34 rather than to the AC that claims it, so the evidence is not AC-traceable. `reconciliation-copy-edit-glyph-paint.test.ts` covers only the gradient case, which is the *other* branch | Either open the transparent-no-glyph-paint run inside `test_UAT_AC1040_…` (two assertions, the fixture already exists in the BUG-34 suite), or fold the `GHOST` case into `test_UAT_AC1143_…` and cite it from AC-1040. The former keeps the backstop attached to the rule it backs |
| 6 | warning | coverage | AC-1050 (`acceptance_criterion-170a171f`) + `tests/reconciliation-copy-edit-gesture-modal.test.ts:621` | uat-edit | Two clauses the AC's Verification names are not reached by its own test. *"Then click a painted panel that carries **no** background image and assert the dialog opens offering its background colour… and that a colour chosen there lands on that panel"* — the test proves the panel's field list is `['surfaceFill']` (`:693`) and that its dialog opens without "Background image" (`:732`–`:734`), but never picks a colour or checks where it lands; that half exists only at `colour-row.test.ts:412` under AC-1279, over a different panel. *"Assert a box or container that paints nothing at all is not offered as a region at all"* — proven under AC-951 in the render suite, not here. Neither clause is unevidenced in the repository; both are unevidenced at the AC that claims them | Add two assertions to `test_UAT_AC1050_…`: after clicking `FILL_ONLY_PANEL_PATH`, drive its colour row through the existing stub and assert the panel's `surfaceFill` becomes that palette reference; and assert the unpainted container on the same page carries no `L1_EDIT_PATH_ATTR` |
| 7 | info | consistency | AC-1138 (`acceptance_criterion-2d587432`) | — | REPORT-2062's violation V1 is **closed, and closed the right way round**. The AC was retitled to *"Size, weight, italic and capitalisation all restyle the words…"*, the recorded-divergence paragraph replaced by *"The previously recorded divergence is closed"*, and BUG-35 has since gone `free_and_reconciled`. The test at `:377` was not weakened: it still asserts `text-transform` on the box **and** on `.builder-modal__box .fields-control`, and adds the clear-on-off half the AC now demands | none |
| 8 | info | exclusivity | AC-named reconciliation suites vs `req121-copy-modal-elegance.test.ts`, `test_UAT_FC_BUG-34_glyph_fill_preview.test.ts`, `test_UAT_FC_REQ-138_live_preview.test.ts` | — | Each FC-named suite covers, in the same jsdom shape and often on the same fixture, scenarios the AC-named reconciliation suites also cover — `FC_BUG-34` and `reconciliation-copy-edit-glyph-paint.test.ts` are near-identical. Under a strict reading these are same-shape duplicates. Not raised, for the same reason REPORT-2062 did not raise it: they trace to the intent rather than to an AC, which is this repo's normal way of keeping free-coded evidence beside reconciled UATs. Recorded so a later reader does not "resolve" the overlap by deleting the AC-named copies — and note that Finding 5 depends on the FC copy continuing to exist until AC-1040 grows its own | none |
| 9 | info | coverage | The browser- and webui-gated half of this capability's evidence | — | Every test under STORY-101 is either `skipIf(!WEBUI_INSTALLED)` or returns early with a `console.warn` naming what went unverified; AC-1138, AC-1140, AC-1284, AC-1043, AC-1123, AC-993, AC-997 and AC-1040 additionally need a launched chromium and a listening socket for their strongest clauses. On this machine none of that is producible — the shared `@lagrangefoundry/webui-*` store is installed out of band above the worktree, the sandbox refuses `listen`, and chromium cannot pass the Mach bootstrap. The gating is loud and is explicitly sanctioned by STORY-101's Technical Context and by AC-1138's and AC-1284's own Verification text, so it is not a finding — but a green run here is **not** browser-verified evidence, and `uat_coverage` stamps earned on such a run should be read accordingly | none — the honest fix is the private registry STORY-101 already names |
| 10 | info | consistency | `tests/reconciliation-copy-edit-live-preview.test.ts:703` | — | A comment in `test_UAT_AC1140_…` reads *"Measured on the BOX, which is where this particular property lands and stops — that is AC-1138's recorded divergence"*. AC-1138 no longer records a divergence and `text-transform` does now reach the words. The assertion is unaffected (it only needs the driven change to land somewhere observable); the comment is stale and will mislead the next reader | none required; delete or reword the clause if the file is touched for Finding 2's neighbours |

## Notes for the Editor

- **All three violations are additive assertions in tests that already open the
  right dialog.** None of them requires a new fixture, a new suite, or a change
  to any AC. Findings 1 and 3 are four lines each inside existing tests; Finding
  2 is one extra control driven in a test that already drives two. Do **not**
  resolve any of them by editing an AC — the ac level passed at REPORT-3818 four
  hours ago and the AC text is the settled side in every case.

- **Findings 2 and 3 are both "the ac fixer tightened an AC today and nothing
  propagated".** AC-997, AC-1000, AC-1043 and AC-1123 were all edited at
  2026-09-10 23:34Z; the suites covering them were last touched on Sep 9–10
  *before* that. I checked all four: AC-1000's and AC-1043's new backdrop clauses
  happen to land on fixtures that already carry both a `backgroundImageUrl` and a
  `surfaceFill` (`image-picker.test.ts:160`), so their tests remain true; AC-997's
  and AC-1123's do not. Expect the same pattern if the ac level runs again.

- **The single biggest change since the last uat cycle is clean and should not be
  re-litigated.** REQ-139, REQ-140, BUG-34 and BUG-35 were all *imminent* at
  REPORT-2062 and are now reconciled, and every one of them arrived here with an
  AC and a substantive UAT: `colour-row.test.ts`, `control-availability.test.ts`,
  `glyph-paint.test.ts` and the rewritten `live-preview.test.ts`. These are among
  the strongest tests in the capability — AC-1280 asserts the negative case before
  the positive one so the row cannot pass by being unconditional, and AC-1281
  drives the real palette popup and the real transport rather than the stub its
  neighbours use, because "what an empty palette does" is precisely what a stub
  would fake.

- **Do not read the stored `uat_coverage` stamps as current.** AC-1039 and
  AC-1138 carry `fail`; AC-1143 and AC-1279…AC-1284 carry nothing at all because
  they postdate the last `uat_coverage_check` (REPORT-2063, 2026-08-16 04:21Z).
  Of those, only AC-1039's `fail` corresponds to a finding here. This session was
  not permitted to run the suites, so no stamp was re-earned; that field belongs
  to `check_uat_coverage` and nothing here should set it.
