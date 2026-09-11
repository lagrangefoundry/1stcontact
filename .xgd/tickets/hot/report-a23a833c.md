---
uid: report-a23a833c
id: REPORT-3828
type: report
title: 'UAT Coverage: In-Page Copy Editing: The Editable Render & The Click-to-Edit
  Gesture'
created_by: xgd
created_at: '2026-09-11T00:52:52.644828+00:00'
updated_at: '2026-09-11T00:52:52.644828+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-12fee326
  violations: 0
  warnings: 2
  needs_review_count: 0
---

# UAT Coverage Assessment: In-Page Copy Editing: The Editable Render & The Click-to-Edit Gesture

**Result**: PASS
**AC verdicts**: 54 pass, 0 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 2 pass, 0 fail, 0 stale, 0 needs_review
**Capability verdict**: pass

Anchor report: report-e37a6b4a. Previous attempts: 3.

This is the first `check_uat_coverage` run since REPORT-2063 (2026-08-16 04:21Z)
to reach the field-writing step. Between then and now the capability gained seven
ACs (AC-1143, AC-1279…AC-1284) that had never carried a `uat_coverage` stamp at
all, and two (AC-1039, AC-1138) carried a `fail` that the intervening fix cycle
closed. Every one of those nine was re-judged here by reading the test source,
not by trusting a prior report; the other 45 were spot-checked and left at the
verdict they already carried.

**Fields written**: the nine ACs whose stamp was wrong or absent, plus both
stories and the capability. The 45 ACs already reading `pass` were deliberately
**not** re-stamped — their value was already correct, and re-writing it would
move `updated_at` on 45 tickets and destroy the "latest AC touched" signal the
capability-alignment check reads.

## Cumulative Intent Considered

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-116 (`request-41796766`) | free_and_reconciled | 2026-07-31 | The edit render: non-functional channel, derived segments, L1 addresses, outlines — founds STORY-98 | YES |
| REQ-117 (`request-395b67e6`) | free_and_reconciled | 2026-07-31 | Copy editing end-to-end: click segment → fields modal → validated diff → re-render — founds STORY-101 | YES |
| REQ-118 (`request-66e4c630`) | free_and_reconciled | 2026-07-31 | Image selection through the same gesture (first proof of kind-agnosticism) | YES |
| REQ-119 (`request-64864801`) | free_and_reconciled | 2026-07-31 | Request-time draft and edit renders inside control-app — the channel is a mode, not a directory | YES |
| BUNDLE-14 (`bundle-0385746c`) | free_and_reconciled | 2026-08-06 | BUG-31 + REQ-114 + REQ-116 — STORY-98's `intent_uid` | YES |
| BUNDLE-16 (`bundle-15c1f647`) | free_and_reconciled | 2026-08-07 | REQ-117 + REQ-115 + REQ-44 — STORY-101's `intent_uid` | YES |
| REQ-121 (`request-9707484c`) | free_and_reconciled | 2026-08-07 | The copy-edit modal made elegant: themed chrome, app typeface, page-faithful editing box | YES |
| REQ-128 (`request-de67e1a1`) | free_and_reconciled | 2026-08-08 | Background image selection on the container segment | YES |
| REQ-132 (`request-5946d045`) | free_and_reconciled | 2026-08-12 | Image picker shows thumbnails with file names (the grid replaces the dropdown) | YES |
| REQ-133 (`request-8467b1a3`) | free_and_reconciled | 2026-08-12 | Palette popup: display, pick and edit the site's colors — the surface the colour row opens | YES |
| REQ-135 (`request-a8ccd0dd`) | free_and_reconciled | 2026-08-12 | Text properties: colour, size, weight, italic on the whole segment (the parameter sheet) | YES |
| REQ-136 (`request-8a132869`) | free_and_reconciled | 2026-08-12 | Image editor: non-destructive framing and colour adjustment — STORY-98's `updated_by` (paint parity) | YES |
| BUG-34 (`bug-13082cb4`) | free_and_reconciled | 2026-08-12 | Copy modal: gradient-filled text previews as invisible → AC-1143 | YES |
| REQ-138 (`request-1ff09fab`) | free_and_reconciled | 2026-08-12 | Copy modal: parameter changes preview live in the editing box → AC-1138/1139/1140 | YES |
| REQ-139 (`request-3f57cd0c`) | free_and_reconciled | 2026-08-12 | Lock controls that cannot express what the element holds → AC-1282/1283 | YES |
| BUG-35 (`bug-1bde3bf9`) | free_and_reconciled | 2026-08-13 | Capitalisation never previews — UA reset blocks text-transform on the text control → AC-1138 4th axis, AC-1284 | YES |
| REQ-140 (`request-3c0fec69`) | free_and_reconciled | 2026-08-15 | Colour: text colour and panel background from the palette → AC-1279/1280/1281 | YES |
| BUNDLE-19 (`bundle-77b28def`) | free_and_reconciled | 2026-08-18 | REQ-133 + BUG-35 + REQ-131 + REQ-140 + REQ-139 + 4 more — STORY-101's `updated_by` | YES |

No intent in the ledger retires a behavior either story describes. Nothing in
this capability is deprecated, and nothing is intent-silent: every AC traces to a
reconciled intent above.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-98 (`story-af36c2cb`) | REQ-116, REQ-119, BUNDLE-14, REQ-136 | **aligned** | 14 ACs. Body describes the channel, inertness, settled state, derived segmentation, addresses, the page stamp, the seam marker, renderer-drawn outlines, the published vocabulary, no leakage, and one-emitter paint parity — each mapped to an AC. Nothing in the body is unbacked by intent, and REQ-136's paint-parity clause (added later, hence `updated_by`) is the last addition and carries AC-1135 |
| STORY-101 (`story-3bf94bd4`) | BUNDLE-16, REQ-117, REQ-118, REQ-121, REQ-128, REQ-132, REQ-133, REQ-135, REQ-136, BUG-34, REQ-138, REQ-139, BUG-35, REQ-140, BUNDLE-19 | **aligned** — was stamped `stale`, and is not | 40 ACs. The `stale` stamp dates from REPORT-2063 (2026-08-16), before the body was rewritten. The body was last edited 2026-09-10 22:59Z and now records the capitalisation divergence as **closed** — which matches the shipped code and the test at `…live-preview.test.ts:508`–`:522`. Every in-scope bullet was walked against the AC list; none is unclaimed, and no bullet describes behavior a later intent retired. The stamp is corrected to `pass` |

## AC-level judgment — the nine re-judged this round

| AC | Was | Now | Evidence read |
|---|---|---|---|
| AC-1039 | fail | **pass** | `…form-presentation.test.ts:709`. The half that was missing is present: `:768`–`:792` asserts the `.fields-label` set equals the origin's non-colour labels **and** `.builder-color__label` equals its colour labels, exact in both directions, partitioned on the descriptor's `type` rather than a hand-written name list. The box-side "there are none" (`:746`) can no longer be satisfied by a global label drop. Refusal and dead-end headings still asserted (`:813`, `:824`) |
| AC-1138 | fail | **pass** | `…live-preview.test.ts:377`. All four axes REQ-138 names, each by its own confirming gesture, and **capitalisation measured on the words** (`.builder-modal__box .fields-control`) in a real browser at `:508`–`:522`, with the on-the-box measurement kept beside it so a regression in either half is attributable. Off-clears asserted for italic and capitalisation. Nothing is a write: `net.calls` empty, `saves` empty, draft byte-identical |
| AC-1143 | (none) | **pass** | `…glyph-paint.test.ts:191`. Real `1c render --edit` bytes, real bridge, real dialog opened by clicking the words; the gradient run's `--preview-text-image` is asserted **equal to the page's own computed `background-image`**, with clip/fill/withheld-colour beside it, and the ordinary run next door asserted unaffected on all four. See Warning 2 for the one half that is not behavioral |
| AC-1279 | (none) | **pass** | `…colour-row.test.ts:328`. Row in the sheet and not the box; reports what the region paints; asks the palette with the entry it holds (`null` for a literal); a cancel does not clear the pick; nothing posts before Save; Save carries words + colour in **one** POST and one re-render; the draft stores a `{ref}` and never a hex; the page repaints with it; a refused ref keeps the dialog open and the draft byte-unchanged. **Executed this session, 1574ms** |
| AC-1280 | (none) | **pass** | `…colour-row.test.ts:441`. The no-panel case asserted **first**, so "the row is present" cannot be satisfied unconditionally; read-only (no swatch button); label flips to `save and edit the panel ↗` only when dirty; following it lands the text edit **before** navigating; second lap re-opens the row over a palette-painted panel; a refused save keeps the work and does not navigate. **Executed, 809ms** |
| AC-1281 | (none) | **pass** | `…colour-row.test.ts:558`. Drives REQ-133's **real** popup over the real transport against a site with no palette at all — empty state, add-an-entry form present, zero swatches, then adds an entry, picks it, and the region is painted with it through a real render. **Executed** |
| AC-1282 | (none) | **pass** | `…control-availability.test.ts:267`. Lock set and reason sentences read from the **real `1c copy get`**, never written in the file; both control families (component-drawn `italic`, dialog-drawn `color`) asserted indistinguishably; reason is a `<p>` under the row and not a `title`; `swatch.disabled === true` and activating it reaches no picker. **Executed, 172ms** |
| AC-1283 | (none) | **pass** | `…control-availability.test.ts:346`. The contrast the rule needs: same colour axis on an unlocked run, no `is-locked`, no note, picker reachable — and the locked `italic` beside it still locked, so "unlocked" is per control rather than per dialog. **Executed, 270ms** |
| AC-1284 | (none) | **pass** | `…tracking.test.ts:169`. Real Chromium against the real workspace origin; both halves kept apart (box holds the value = the dressing read the page; **words** hold it = the re-declared inheritance reached them); the untracked run asserted `normal`, so an implementation forcing tracking onto every control fails; the parameter sheet asserted to stay chrome, so a widened selector fails here rather than in the operator's eyes |

The other 45 ACs were spot-checked (AC-1008, AC-1040, AC-1044, AC-1135 read in
full this session) and left at `pass`.

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | ac | AC-1044 (`acceptance_criterion-472674ff`) | ac-edit | The AC's second bullet — *"a box with more [than one field] … opens none"* — is unexercised, and is **unreachable**: `packages/site-schema/src/l1/edit.ts` derives exactly one `type: 'string'` field per region kind (`text` for copy, `alt` for a picture, none for a painted box/container), and `l1SegmentFields` has no `'module'` branch, so no region exposes two fields to the box. The test's two-field case (`…form-presentation.test.ts:1464`) is the **image** dialog, which is the AC's *third* bullet. Carried at this severity since REPORT-2062; it does not block | Amend AC-1044's second bullet and its matching Verification sentence to record that no region exposes two box fields today, so it reads as the forward-looking invariant it is (the shape AC-1028 already uses for its unbuilt list). Do **not** close it by letting the grid case stand in for it — they are different bullets, and do not close it by editing `edit.ts` to manufacture a two-string region |
| 2 | warning | uat | AC-1143 (`acceptance_criterion-86ec6932`) | uat-edit | The AC claims the glyph paint is *"drawn on the words themselves"*. The custom-property half is genuinely behavioral (read off a real rendering), but the **last hop** — the paint reaching `.builder-modal__box .fields-control` — is asserted by regexing `builder.css` for the declarations (`…glyph-paint.test.ts:238`–`:259`). The test header states the reason (jsdom resolves no `var()`), which is why this is a warning and not a violation; but it is the same evidence shape the story's own Technical Context rejects for tracking and capitalisation — *"a declaration existing is precisely the thing that stayed true throughout the defect"* — and it would survive a later rule overriding those declarations in the cascade | Add a browser leg on the pattern AC-1138 and AC-1284 already use: open the gradient run in the workspace in real Chromium and assert `getComputedStyle` on `.builder-modal__box .fields-control` gives the page's `background-image`, `background-clip: text` and a transparent `-webkit-text-fill-color`, with the ordinary run asserted at each property's initial value. Keep the jsdom half and report loudly unverified where no engine can be launched, exactly as `…tracking.test.ts` does |

**Violations: 0. Blocking needs_review: 0.**

## Execution evidence from this session

Read this section before treating any green run in this capability as proof.

- **20/20 passing across the five socket-free suites** — `edit-render-channel`
  (13), `edit-render-paint-parity` (1), `colour-row` (3), `control-availability`
  (2), `tracking` (1). So AC-948…958, AC-1007, AC-1008, AC-1135 and
  AC-1279…AC-1284 were executed here, not only read.
- **Seven suites cannot run in this sandbox.** Every suite that calls
  `startBuilder` dies on a listening socket: `…live-preview.test.ts` reports
  *1 failed file, 3 skipped tests, 0 run* after a 240s `beforeAll` timeout, and
  `…glyph-paint.test.ts` reports its one test skipped. That is the sandbox, not
  the code — it is the same restriction REPORT-3822 recorded, and it means
  AC-1039, AC-1138, AC-1040, AC-1044, AC-1050, AC-1123 and the picker ACs were
  judged by **source reading only** in this session.
- **AC-1284's browser leg did not execute here** and said so:
  `story-3bf94bd4: AC-1284 the box's tracking (this machine refuses to listen on
  a socket, so no engine can reach the workspace) NOT VERIFIED here`. The skip is
  loud and reported, which is what the story's Technical Context requires — the
  criterion is well-constructed and this machine simply cannot run it. That is an
  environment fact, not a coverage gap: the verdict judges the test, not the host.
- **`WEBUI_INSTALLED` is true here only because of a gitignored symlink**
  (`node_modules/@lagrangefoundry` → `/Users/martin/lagrangefoundry/node_modules/@lagrangefoundry`).
  On a checkout without it, every assertion behind a `WEBUI_INSTALLED` gate early-returns
  and the suites still report green. The honest fix is the private registry
  STORY-101 already names in its Known coverage caveat.

## Notes for the Editor

- **There is no violation to fix at this level.** Both findings are warnings, and
  Finding 1's only available repair is an AC-body edit, which is an `ac` action,
  not a `uat` one. If the loop routes Finding 1 to a uat fixer, the correct
  outcome is "no action available at this level" rather than an invented test.

- **Finding 2 is the one piece of real work here**, and it is additive: a browser
  leg inside the existing `test_UAT_AC1143_…`, not a rewrite. The fixture, the
  origin helper and the Chromium-launch helper all already exist in the
  neighbouring suites (`…tracking.test.ts:106`–`:128`, `…live-preview.test.ts:363`),
  so it is a copy of a pattern this story already owns rather than new machinery.

- **The `stale` stamp on STORY-101 was the oldest wrong thing in this
  capability** — it predated the body rewrite by three and a half weeks and had
  survived two full alignment cycles because the alignment check correctly
  refuses to write a field it does not own. It is now corrected. If a future
  round sees `stale` here again, check the body's `updated_at` before believing it.

- **45 ACs were left unstamped on purpose.** They already read `pass`. Re-writing
  an identical value would move `updated_at` on 45 tickets and destroy the signal
  the capability-alignment check uses to decide whether AC bodies have moved ahead
  of their suites. Do not "normalise" this by bulk-setting the field.
