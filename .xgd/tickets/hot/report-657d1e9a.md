---
uid: report-657d1e9a
id: REPORT-3814
type: report
title: 'Capability-Intent Alignment: In-Page Copy Editing: The Editable Render & The
  Click-to-Edit Gesture (level=ac)'
created_by: xgd
created_at: '2026-09-10T23:14:00.815812+00:00'
updated_at: '2026-09-10T23:14:00.815812+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-12fee326
  level: ac
  violations: 2
  warnings: 3
  needs_review_count: 0
---

# Capability-Intent Alignment: In-Page Copy Editing: The Editable Render & The Click-to-Edit Gesture
# Level: ac

**Result**: FAIL
**Violations**: 2
**Warnings**: 3
**Needs review**: 0

Two stories, both `story_kind: upgrade`, 54 ACs in scope:

- **STORY-98** (`story-af36c2cb`) — the edit render channel, 14 ACs. **All 14 aligned, no finding.**
- **STORY-101** (`story-3bf94bd4`) — the click-to-edit gesture, 40 ACs. Both violations sit here.

Both violations are the **same drift shape, and both were predicted by the previous
ac-level cycle** (report-20d419a4, FAIL, 2026-08-16): an AC that states a behaviour
is *absent or not offered* which a now-`free_and_reconciled` intent has since
delivered. One of that report's two violations (AC-1138) **is repaired**; its other
(AC-1028) is **untouched** — `updated_at: 2026-08-16T04:19:09`, i.e. unchanged since
the report that named it — and the item that report explicitly deferred to
"REQ-140 reconciliation" (AC-1140's parenthetical) was never revisited when REQ-140
reconciled.

No ac-level fix ran between report-20d419a4 and now: the store holds fix reports for
the `story` level only (report-388c3cff, "attempt 5", 2026-09-10), and the two story
bodies were rewritten 2026-09-10T22:59Z. **The story bodies repaired at story level
now contradict these two ACs** — the gap is in the AC layer, not the bodies.

## Cumulative Intent Considered

At `ac` level the story bodies are the working reference, and both passed story level
8 minutes before this check (report-1321eb22, PASS, 0 violations, 2026-09-10T23:07Z).
I did not rebuild the intent ledger from scratch; I adopted that report's ledger —
built minutes ago from the same store, widened beyond `intent_uid`/`updated_by` by
body and title sweep — and escalated to intent bodies only for the two subjects where
an AC contradicts its own story body. Statuses below re-read from the store.

| Intent ID | UID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|---|
| REQ-116 | `request-41796766` | free_and_reconciled | merged `cd8f98c8` 2026-08-06 | The edit render: non-functional channel, settled state, derived segments, addresses, renderer-drawn outlines. Origin of STORY-98 | YES |
| REQ-117 | `request-395b67e6` | free_and_reconciled | merged `1741ee5d` 2026-08-07 | Click segment → fields modal → validated diff → re-render. Origin of STORY-101 | YES |
| REQ-118 | `request-66e4c630` | free_and_reconciled | 2026-08-07 | Image selection through the same loop — **the intent AC-1028 was written against** | YES |
| REQ-121 | `request-9707484c` | free_and_reconciled | completed 2026-08-10 | The modal made elegant: themed surface, one app typeface, dropped label column, dressed box + size clamp, Save reachable | YES — **drives W2** |
| REQ-128 | `request-de67e1a1` | free_and_reconciled | 2026-08-08 | A painted panel's background image reaches the dialog | YES |
| REQ-132 | `request-5946d045` | free_and_reconciled | 2026-08-12 | Picker becomes a thumbnail grid labelled with file names | YES |
| REQ-135 | `request-a8ccd0dd` | free_and_reconciled | 2026-08-12 | A run's typography — size, weight, italic, capitalisation | YES |
| **REQ-136** | `request-8a132869` | **free_and_reconciled** | merged `a23c4c51` 2026-08-12 | **Image framing, shape, rotation, scale and colour adjustment offered on the image region beside the picker; supersedes "an image segment exposes exactly `src` + `alt`"** | YES — **drives V1** |
| REQ-138 | `request-1ff09fab` | free_and_reconciled | 2026-08-12 | Live preview: four parameters restyle the words | YES |
| REQ-139 | `request-3f57cd0c` | free_and_reconciled | 2026-08-12 | Locked controls, with the reason. **Was `ready_to_reconcile` at the last ac check; now reconciled and covered** | YES |
| **REQ-140** | `request-3c0fec69` | **free_and_reconciled** | 2026-08-15 | **A run's colour and a panel's background, from the palette. Was `ready_to_reconcile` at the last ac check** | YES — **drives V2** |
| REQ-133 | `request-8467b1a3` | free_and_reconciled | 2026-08-12 | The palette popup as the pick surface the colour row opens | YES |
| BUG-34 | `bug-13082cb4` | free_and_reconciled | 2026-08-12 | Gradient-filled text previewed invisible. Was `bundled` at the last ac check | YES |
| BUG-35 | `bug-1bde3bf9` | free_and_reconciled | 2026-08-13 | Capitalisation + tracking never reach the glyphs — the UA reset. Was `ready_to_reconcile`; **now reconciled, which is what closes the previous cycle's V1** | YES |
| REQ-145 / REQ-147 / BUG-37 | — | free_and_reconciled | 2026-08-15 → 08-31 | Request-time edit render at the operator-gated builder origin | YES (context) |
| REQ-134 | `request-ba3e3fba` | abandoned | 2026-08-12 | An image generation component | NO |
| REQ-154 | `request-b88b79fe` | bundled | 2026-08-20 | Browser Rendering driver on the capture/fidelity seam | imminent, no ask here |

**Four intents changed status since the last ac-level check** (REQ-139, REQ-140,
BUG-34, BUG-35 were all `bundled`/`ready_to_reconcile` then and are
`free_and_reconciled` now). Three of those four are now properly covered — the lock
rule by AC-1282/AC-1283, the colour row by AC-1279/AC-1280/AC-1281, the glyph paint
by AC-1143 — which closes report-20d419a4's warning 4 on its coverage half. Its
*other* half ("revisit AC-1140's parenthetical") was not done, and is V2 below.

**Provenance note, unchanged and still load-bearing**: no AC under this capability
carries an `intent_uid` or `updated_by` of its own — their `fields` hold only
`story_uid`, `kind`, `regression_only` and sometimes `uat_coverage`. An AC's alignment
to an intent is always inferred through its story, never read off the ticket. That is
the structural reason an AC can keep asserting a retired fact for a month while every
layer around it is repaired.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-98's 14 ACs (AC-948…AC-958, AC-1007, AC-1008, AC-1135) | REQ-116; REQ-117 (page stamp, vocabulary, seam marker); REQ-136 (paint parity) | **aligned** — every in-scope bullet of the rewritten body has a covering AC: the channel/output location (AC-958), deliberate inertness (AC-948), settled state (AC-949 scroll-reveal, AC-950 carousel), derived segmentation (AC-951), addressing (AC-953, AC-954, AC-955), the page stamp (AC-1007), the module's own seam marker (AC-954 ¶3), renderer-drawn outlines + hover (AC-952), the published vocabulary (AC-1008), no leakage (AC-956), the element identifier preserved (AC-957), one emitter / paint parity (AC-1135). No gaps, no overlaps, nothing contradicting the 22:59Z rewrite |
| **AC-1028** (`acceptance_criterion-26ffac6d`) | REQ-118; **superseded in part by REQ-136** | **violation V1** — says framing, scale, rotation and position "are not offered"; REQ-136 offers all four through this very dialog, the rewritten story body says so, and AC-1135 (sibling story) asserts they paint identically in both channels |
| **AC-1140** (`acceptance_criterion-b04cbb23`) | REQ-138; **overtaken by REQ-140** | **violation V2** — its Verification asserts "the run's colour and family, which the sheet has no control for at all". REQ-140 gave the run's colour a control in the sheet, and AC-1279 + AC-1123 both say so |
| AC-1138 (`acceptance_criterion-2d587432`) | REQ-138, BUG-35 | **repaired** — report-20d419a4's V1 is closed: title now claims four parameters, the "recorded divergence" paragraph is replaced by "**The previously recorded divergence is closed**", and the Verification asserts both halves for capitalisation. Matches the story body's own "closed" ruling. (Its *test name* is stale — W3) |
| AC-1279, AC-1280, AC-1281 | REQ-140, REQ-133 | **aligned** — the colour row, the read-only panel-behind-the-words row with save-then-navigate, and the empty-palette state. Each traces to a body bullet |
| AC-1282, AC-1283 | REQ-139 | **aligned** — the two halves of the lock rule (drawn unavailable + reason under the row; and no note where nothing is wrong), matching the body's "A control that cannot tell the truth" bullet |
| AC-1143, AC-1284 | BUG-34, BUG-35 | **aligned** — glyph paint on the control that draws the words, and tracking asserted on both the box and the words with the sheet held to chrome. Both carry the body's "report loudly as unverified" clause |
| AC-1112…AC-1116 | REQ-132 | aligned — grid presentation, file-name label + tooltip, real bytes, placeholder tile, one keyboard-reachable single-selection group |
| AC-1050 (`acceptance_criterion-170a171f`) | REQ-128, REQ-140 | **aligned, and updated since the last check** (2026-08-20) — now reads "the picker where there is one, the colour row, the footer, and nothing else". See info finding 5: it is **more** complete than its story body, and must not be narrowed to match it |
| AC-1037, AC-1038 | REQ-121 items 1, 2, 4 | **aligned to intent, not derivable from the story body** — W2 |
| AC-1041, AC-1042, AC-1043, AC-1044, AC-1039 | REQ-121 items 3, 5, 6 | aligned — each traces to the body's "The words in a box, the parameters under it" bullet |
| AC-993…AC-1006 | REQ-117 | aligned — hover, innermost resolution, seam scoping, one-form-one-change, save / refuse / the two dead ends / stale rendering / viewing-is-not-editing / one address implementation |
| AC-1123 (`acceptance_criterion-35907074`) | REQ-135, REQ-136, REQ-140 | **aligned, 1 warning** — the criterion's "never by the region's kind" is load-bearing and still unexercised by any AC's verification (W1) |
| STORY-101 coverage vs body | — | **complete** — all 15 in-scope bullets of the 22:59Z body have covering ACs, and every out-of-scope exclusion (a run's family, free hex, line-height/alignment, a panel's pattern/overlay/gradient, structural editing) is consistent with what the AC set does *not* claim |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | AC-1028 (`acceptance_criterion-26ffac6d`) | ac-edit | The AC closes: *"Framing (crop, scale, scrim, rotation, position), upload and image processing **are not offered**"*, and describes the image dialog as the picker *"together with its alt text"* and nothing more. **REQ-136 (`request-8a132869`, free_and_reconciled, merged `a23c4c51`) offers four of those five through this same dialog.** `copyFieldsOf` — the one derivation the gesture reads — returns for an `image` node `src`, `alt`, then `...framing.fields` (`packages/site-schema/src/l1/edit.ts:987-1005`), and `imageFramingFields` (`:823-860`) supplies **Fill mode**, **Pan across (%)**, **Pan down (%)** (= position), **Shape**, **Corner rounding (px)**, **Rotate (°)** (= rotation), **Scale (%)** (= scale) plus the `FILTER_CONTROLS` colour adjustments. Only **crop** (true source-rect zoom) and **scrim** genuinely remain out. Three independent layers now contradict this AC: (a) the rewritten story body — *"an image region exposes **which image goes here** … alongside its alt text and **how the picture is seen**, the framing, shape and colour adjustment the write path offers on it"*; (b) that body's out-of-scope list, which excludes only *zoom and true source-rect crop, tint or scrim over an `<img>`, framing of a painted surface's own background image, and drag-driven crop handles*; (c) **AC-1135** in the sibling story, whose title is *"A picture's framing, shape, colour adjustment **and rotation**…"* and which requires them to paint identically in the edit and shipped channels — an AC cannot be required to prove a property of a control another AC says is not offered. **This is report-20d419a4 violation 2, unrepaired: `updated_at` is still `2026-08-16T04:19:09`** | Narrow the exclusion to *crop (true source-rect zoom), scrim, asset upload and any image processing* — or restate it as the body's own four Phase-2 items. State that an image region leads with picker + alt text (the order is load-bearing: the dialog opens into the grid per AC-1044) and then exposes how the picture is framed, shaped, rotated and colour-adjusted in the parameter sheet beneath, routed there by descriptor per AC-1123. Do **not** touch the picker paragraphs — the closed-list, always-includes-the-current-handle and selected-on-open claims are all still exactly right |
| 2 | violation | consistency | AC-1140 (`acceptance_criterion-b04cbb23`) | ac-edit | The Verification reads: *"assert that exactly that aspect changed and every other one — **including the run's colour and family, which the sheet has no control for at all** — is byte-identical"*. **REQ-140 (`request-3c0fec69`, free_and_reconciled, 2026-08-15) gave the run's colour a control in the sheet.** `copyFieldsOf`'s text branch returns `text`, then `...colour.fields`, then `...type.fields` (`packages/site-schema/src/l1/edit.ts:969-984`; the descriptor is built by `colorField` for axis `color`, labelled *Text colour*, `:597-634`). **AC-1279** (`acceptance_criterion-a60fb00d`): *"A run of copy gets one for its own colour. The row is **in the parameter sheet** beneath the words, never in the editing box."* **AC-1123**: *"everything else about how that run is set — **its colour** and its typography — in a separate, labelled sheet beneath that box."* So AC-1140 asserts as settled fact the negation of two sibling ACs under the same story. The AC's *criterion* paragraph is fine — an untouched colour does keep its opening dressing, and the story body confirms the box still takes its colour from the page — so the defect is confined to the stale justification, which has **already propagated into the test layer**: `tests/reconciliation-copy-edit-live-preview.test.ts:620-622` carries it verbatim as a comment ("*The run's colour and its family arrive from the render and have no control in the sheet at all*"). **report-20d419a4 warning 4 named this exact parenthetical and deferred it to "REQ-140 reconciliation"; REQ-140 reconciled on 2026-08-15 and AC-1140 was never revisited** (`updated_at: 2026-08-16T04:19:39`, before AC-1279 existed) | Strike the stale clause and keep the witnesses that survive: *"every other one — including the run's **family**, which the sheet has no control for at all, and its tracking, which is dressing rather than a control — is byte-identical"*. Optionally add the stronger claim REQ-140 makes available: the colour row *does* exist in the sheet, and changing it still does not re-dress the box, because the box reads colour from the page as rendered (the story body's *"the live example of an entry"*). Fix the mirroring comment at `live-preview.test.ts:620-622` in the same pass or the drift simply relocates |
| 3 | warning | coverage | AC-1123 (`acceptance_criterion-35907074`) | ac-edit | AC-1123 carries the capability's load-bearing kind-agnostic claim — *"The split is decided by the kind of control a field declares, **never by the region's kind** and never by the field's name"* — but its Verification exercises only *"a run of copy that exposes its words, its colour and its typography"*, a region exposing no words, and a region exposing only a colour. **All three witnesses are copy-or-panel; no AC's verification routes a non-copy region's parameters into the sheet**, so the "never by region kind" half is asserted and never exercised. REQ-136's image region is the natural witness and has been available since 2026-08-12: it is the only region that carries a grid field, a box field and sheet parameters at once, which is precisely why *which control* cannot be a per-region question. **This is report-20d419a4 warning 3, still open** (AC-1123 was updated 2026-08-20 for REQ-140 but its witness set was not extended) | Extend AC-1123's Verification with one image region: assert its `src` draws as the grid, its `alt` in the box, and its framing parameters in the sheet — one region proving all three routes. Best taken in the same pass as finding 1, since both turn on REQ-136's field list |
| 4 | warning | consistency | AC-1037 (`acceptance_criterion-279f1f6d`) + AC-1038 (`acceptance_criterion-4e320828`) | story-body-edit | Neither AC follows from STORY-101's body. AC-1037 requires the form to open inside the workspace's themed subtree, resolve that theme's palette and follow a theme change with no hardcoded colour; AC-1038 requires one application typeface set once at the themed root and served from the workspace origin. **The story body — including the 22:59Z rewrite — never mentions the dialog's own chrome, theme or typeface at all.** Both trace cleanly to REQ-121 (`request-9707484c`, free_and_reconciled) items 1, 2 and 4, so the ACs are **right and the body is thin**. This is the AC-level face of **report-1321eb22 finding 2** (story level, warning, same intent, same three items), already recorded with the repair on the body. Raised here only so the next ac cycle does not re-derive it, and so no editor "resolves" it by deprecating two correct ACs | **No AC edit.** Take report-1321eb22 finding 2: add one in-scope bullet to STORY-101 for the dialog's own presentation — it opens inside the workspace's themed surface, takes the app typeface and the theme's palette, follows a theme switch, and its Cancel/Save read as the workspace's own controls. AC-1041 needs nothing: it is derivable from the body's dressed-box bullet, since the previewed family cannot resolve without the page's face declarations |
| 5 | warning | consistency | UAT for AC-1138 | uat-edit | The covering test still carries the pre-repair claim in its **name**: `test_UAT_AC1138_size_weight_and_italic_restyle_the_words_as_confirmed_and_write_nothing` (`tests/reconciliation-copy-edit-live-preview.test.ts:377`), while AC-1138's repaired title claims four parameters and the test **body** asserts the fourth — `:513-514` assert `text-transform` both on the box and on the words, `:522` asserts it clears when turned off. A reader trusting the name would conclude capitalisation is untested. Strictly a uat-level item; recorded here because report-20d419a4 warning 5 prescribed that it move **in the same commit as the AC-1138 repair**, and the AC moved without it | Rename to include capitalisation, e.g. `test_UAT_AC1138_size_weight_italic_and_capitalisation_restyle_the_words_as_confirmed_and_write_nothing`. The body needs no change |
| 6 | info | consistency | AC-1138 (`acceptance_criterion-2d587432`) | — | **report-20d419a4's violation 1 is repaired and verified.** The AC now claims all four parameters, the "recorded divergence" paragraph is replaced by "**The previously recorded divergence is closed**", and the Verification demands both measurements for capitalisation ("the property is set on the box, **and** the words themselves are now drawn in that casing") plus a real engine with a loud unverified report where none can be launched. It agrees with the story body's own closure paragraph and with BUG-35, now `free_and_reconciled`. Recorded so the repair is not re-opened | none |
| 7 | info | consistency | AC-1050 (`acceptance_criterion-170a171f`) | — | **Do not narrow this AC to match its story body.** AC-1050 asserts both halves of a painted panel's fields — the background image where there is one (REQ-128) and the colour always (REQ-140) — while the story body's form-over-fields sentence names only the colour. The body is the thin side, and that asymmetry is already logged as **report-1321eb22 finding 1** (story level, warning, `story-body-edit`). The body does allude to the image half two bullets down ("a region that exposes only a background image gets no text-editing box at all"), and `edit.ts:1007-1021` confirms both fields with the fill as the always-present one. AC-1050 is the AC most likely to be over-corrected by someone applying finding 1 too broadly | none |
| 8 | info | consistency | AC-958 (`acceptance_criterion-149faead`) | — | AC-958 rests on the edit channel writing to "an output location distinct from the preview and published channels'", which the 22:59Z story rewrite demotes from the defining property to one of two materialisations ("the mode is what is load-bearing, not the directory"). The AC is **still true and deliberately preserved** — report-4c3e67c5 instructed the body rewrite not to delete the claim AC-958 rests on, and `tools/generate/src/store/paths.ts:15-21` still carries `RenderChannel = 'draft' \| 'published' \| 'edit'` with its own directory. The request-time render needs no AC here: the body assigns that origin and its gate to the workspace capability | none |
| 9 | info | exclusivity | AC-997 + AC-1123 + AC-1279; AC-1000 + AC-1123; AC-1043 + AC-1123; AC-1040 + AC-1284 | — | Four near-misses examined and deliberately not raised. The one-Save-one-change invariant is asserted three times, each over a **different control composition** — grid + form (AC-997), box + sheet (AC-1123), colour row travelling in the same change map (AC-1279) — and merging them would lose a composition, which is the pattern the story body itself endorses ("kind-agnostic a second time over"). Same for the no-op rule (AC-1000's grid-only and form-only dialogs vs AC-1123's two-form pair) and footer reachability under a bounded scrolling child (AC-1043's thumbnail grid vs AC-1123's parameter sheet). AC-1040 and AC-1284 both concern tracking, but AC-1040 measures the **box** (the dressing read the page) and AC-1284 measures the **words** (the dressing reached them) — the two-sided split the story body argues for explicitly, since "measuring the box proves a value was written, which is the thing that stayed true all the way through the defect" | none |
| 10 | info | coverage | AC-1039, AC-1138 | — | Both carry `fields.uat_coverage: "fail"`; AC-1143 and AC-1279…AC-1284 carry no `uat_coverage` at all. That field is owned by check/fix_uat_coverage, is a uat-level question, and is not touched by this level or by any repair suggested above. Noted only so it is not mistaken for a gap this report left unexamined | none |

## Notes for the Editor

- **Both violations are single-passage edits to one AC each, and neither needs a new
  AC, a deprecation or a story-body change.** Finding 1 rewrites AC-1028's closing
  exclusion sentence; finding 2 strikes a parenthetical in AC-1140's Verification.
  Take finding 3 (AC-1123's witness set) in the same pass as finding 1 — both turn on
  REQ-136's field list, and the image region is the witness both want.

- **Do not repair these by editing the story bodies.** The bodies were rewritten
  2026-09-10T22:59Z and passed story level at 23:07Z (report-1321eb22, 0 violations).
  On both subjects the body is already correct and the AC is stale. The two *body*
  warnings that remain (report-1321eb22 findings 1 and 2) run the other way — body
  thin, AC correct — and are recorded here as findings 7 and 4 so neither gets
  "resolved" by narrowing AC-1050, AC-1037 or AC-1038.

- **The recurring drift shape is the closed enumeration, and it has now recurred
  five times in this capability.** report-4c3e67c5 found it on the story body for the
  image region (REQ-136); report-1321eb22 found it for the painted panel (REQ-128) and
  the dialog's chrome (REQ-121); and it is both violations here (AC-1028 for REQ-136,
  AC-1140 for REQ-140). Every instance is a sentence naming what a region exposes —
  a list this story does not own. The story body says why: *"which parameters a run
  exposes … are all the write path's"*. **An AC that enumerates a region's fields
  should name the derivation, not copy its output**: prefer "exposes whatever the
  surface offers on it, which today is …" to a bare list, and state exclusions as
  what is *unbuilt* rather than as what is *not offered*.

- **Why a month-old ac finding survived five fix attempts.** The attempt counter
  reached 5 at the `story` level on 2026-09-10, but the store holds **no ac-level fix
  report at all** — the last ac cycle ran 2026-08-16 (report-20d419a4, FAIL) and the
  workflow advanced to `uat` rather than repairing. AC-1028's `updated_at` is
  `2026-08-16T04:19:09`, 39 minutes *before* that report was written. AC-1140's is
  `2026-08-16T04:19:39`, four days before AC-1279 existed. Both findings are
  therefore carried forward verbatim rather than newly derived, with their code
  citations re-verified in this branch today.

- **The deferred half of report-20d419a4 warning 4 is now actionable and half-done.**
  REQ-139 and REQ-140 were `ready_to_reconcile` then and are `free_and_reconciled`
  now. The coverage half landed well — AC-1282/AC-1283 for the locks, and
  AC-1279/AC-1280/AC-1281 for the colour row, all created 2026-08-20. The revisit half
  did not: AC-1140's parenthetical is finding 2. AC-1050's phase-2 scoping, the other
  item that report asked to revisit, **was** correctly updated on 2026-08-20.

- **STORY-98 needs nothing at this level.** All 14 ACs were re-read against the
  rewritten body and every in-scope bullet has exactly one covering AC. The one place
  worth watching is the AC-958 / AC-1135 pair, both of which the body rewrite touched
  around — see findings 8 and 1.
