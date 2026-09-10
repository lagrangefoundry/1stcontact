---
uid: report-4c3e67c5
id: REPORT-3811
type: report
title: 'Capability-Intent Alignment: In-Page Copy Editing: The Editable Render & The
  Click-to-Edit Gesture (level=story)'
created_by: xgd
created_at: '2026-09-10T22:55:26.780107+00:00'
updated_at: '2026-09-10T22:55:26.780107+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-12fee326
  level: story
  violations: 2
  warnings: 2
  needs_review_count: 0
---

# Capability-Intent Alignment: In-Page Copy Editing: The Editable Render & The Click-to-Edit Gesture
# Level: story

**Result**: FAIL
**Violations**: 2
**Warnings**: 2
**Needs review**: 0

Two stories are in scope, both `story_kind: upgrade`:

- **STORY-98** (`story-af36c2cb`) — the edit render channel
- **STORY-101** (`story-3bf94bd4`) — the click-to-edit gesture

Both bodies are substantially aligned to the intent ledger. Each carries one
**out-of-scope claim that a later reconciled intent falsified** — STORY-101 still
excludes image framing that REQ-136 put into this dialog, and STORY-98 still calls
the edit channel local and unshipped after REQ-145 made the deployed Worker serve
it. Neither is a coverage gap; both are consistency drift in the story bodies.

## Cumulative Intent Considered

Ledger built from `fields.intent_uid` / `fields.updated_by` on both stories
(bundle-0385746c = BUNDLE-14, bundle-15c1f647 = BUNDLE-16,
bundle-77b28def = BUNDLE-19, request-8a132869 = REQ-136), expanded to the member
intents and widened to the reconciled intents that touch the edit render or the
edit gesture afterwards.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-116 (`request-41796766`, in BUNDLE-14) | free_and_reconciled | created 2026-07-31, merged `cd8f98c8` 2026-08-06 | The edit render: third channel, deliberately non-functional, settled state, derived segmentation, render-scoped addresses, renderer-drawn outlines. Originating intent of STORY-98 | YES |
| REQ-119 (`request-64864801`) | free_and_reconciled | 2026-07-31 | Request-time draft **and edit** renders inside control-app (`tools/generate/src/cli/preview.ts:8`) | YES |
| REQ-117 (`request-395b67e6`, in BUNDLE-16) | free_and_reconciled | created 2026-07-31, merged `1741ee5d` 2026-08-07 | Click segment → fields modal → validated diff → re-render; also moved the stamp vocabulary to `site-schema`, added the hover rule to `L1_EDIT_CSS` and the contact-form seam marker. Originating intent of STORY-101 | YES |
| REQ-132 (`request-5946d045`) | free_and_reconciled | 2026-08-12 | Image picker as a thumbnail grid with file-name labels | YES |
| REQ-133 (`request-8467b1a3`, in BUNDLE-19) | free_and_reconciled | 2026-08-12 | Palette popup as the pick surface the colour row opens | YES |
| REQ-135 (`request-a8ccd0dd`) | free_and_reconciled | 2026-08-12 | Text properties — size, weight, italic, capitalisation on the run | YES |
| **REQ-136** (`request-8a132869`) | **free_and_reconciled** | created 2026-08-12, merged `a23c4c51` 2026-08-12 | **Image framing, shape, rotation, scale and colour adjustment offered on the image region beside the picker; explicitly supersedes "an image segment exposes exactly `src` + `alt`"**. Last intent to touch STORY-98 | **YES** |
| REQ-138 (`request-1ff09fab`) | free_and_reconciled | 2026-08-12 | Parameter changes preview live in the editing box | YES |
| REQ-139 (`request-3f57cd0c`) | free_and_reconciled | 2026-08-12 | Locked controls that cannot express what the element holds, with the reason | YES |
| BUG-34 (`bug-13082cb4`) | free_and_reconciled | 2026-08-12 | Gradient-filled text previewed invisible | YES |
| BUG-35 (`bug-1bde3bf9`) | free_and_reconciled | 2026-08-13 | Capitalisation never previews — UA reset blocks `text-transform` | YES |
| REQ-140 (`request-3c0fec69`) | free_and_reconciled | 2026-08-15 | Colour — a run's colour and a panel's background, from the palette | YES |
| **REQ-145** (`request-b474390f`) | **free_and_reconciled** | created 2026-08-15, completed 2026-08-31 | **control-app becomes the builder; phase 3 is request-time L1 render in workerd. AC1: with `1c builder` not running, `app.1stcontact.io` "renders the draft and edit channels"** | **YES** |
| REQ-147 (`request-23fd6e61`) | free_and_reconciled | 2026-08-15 | Cloudflare Access on `app.1stcontact.io` — the builder origin is operator-gated, not public | YES (context) |
| BUG-37 (`bug-6612c4b7`) | free_and_reconciled | 2026-08-24 → 2026-08-31 | Edit mode CPU cost at the deployed origin; confirms by measurement that the edit channel is served request-time from the Worker | YES |
| REQ-134 (`request-ba3e3fba`) | abandoned | 2026-08-12 | An image generation component | NO |

No intent in the ledger retires behaviour that either story still describes, and no
reconciled intent's asked behaviour is missing from the story tree — the two findings
below are both over-claimed **exclusions**, not missing scope.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-98 (`story-af36c2cb`) | REQ-116 (origin); REQ-117 (hover rule, page stamp, vocabulary move to `site-schema`, contact-form seam marker); REQ-136 (paint parity, AC-1135) | **gap**: out-of-scope still calls the edit render "a local render channel" and names published + preview as "the only shipped ones"; REQ-145 (free_and_reconciled) makes the deployed Worker serve it |
| STORY-101 (`story-3bf94bd4`) | REQ-117 (origin); REQ-132 (grid); REQ-135 + REQ-138 (typography, live preview); REQ-139 (locks); REQ-140 + REQ-133 (colour row, palette popup); BUG-34, BUG-35 (glyph paint, capitalisation/tracking) | **gap**: out-of-scope still excludes image framing; REQ-136 (free_and_reconciled) delivered crop-pan, scale, rotation, shape and colour adjustment into this dialog |
| STORY-98 ↔ STORY-101 boundary | REQ-116 §"Non-goals" / REQ-117 | aligned — the render owns what a hot segment *looks like*, the gesture owns *which* segment is hot; both state the split and neither restates the other |
| CAP-84 (`capability-25f7e486`, `edit_render_channel`) | — | aligned (info): status `superseded`, `superseded_by_uid: capability-12fee326`, zero stories attached — the consolidation left no duplicate story surface |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | STORY-101 (`story-3bf94bd4`) | story-body-edit | The **Out of scope** paragraph reads "image **framing** — crop, scale, scrim, rotation, edge effects and free positioning — together with asset upload and any image processing". REQ-136 (`request-8a132869`, free_and_reconciled, merged `a23c4c51` 2026-08-12) put framing into **this dialog**: "What the image segment now exposes: `src` (picker) · `alt` · then, in the property sheet: Fill mode · Pan across/down (%) · Shape · Corner rounding (px) · Rotate (°) · Scale (%) · Brightness / Contrast / Saturation / Black & white (%) · Hue shift (°) · Blur (px)", reached with "no client change at all" through the dialog's existing non-string split. Confirmed in code at `packages/site-schema/src/l1/edit.ts:833-851` (Fill mode, Pan across/down, Shape, Corner rounding, Rotate, Scale) and `:795-800` (the six adjustment rows), and in the gesture's own evidence at `tests/reconciliation-copy-edit-form-presentation.test.ts:1341` ("REQ-136 added the picture's framing to that dialog, so the ROW COUNT is…"). The sibling write-path story STORY-100 (`story-37a3921b`, CAP-86) already describes the whole list as delivered | Narrow the exclusion to what REQ-136 actually left open (its own "Phase 2 — still open" list): **zoom / true source-rect crop**, **tint / scrim over an `<img>`**, **background-surface framing**, **drag-driven crop handles**, plus asset upload and any image processing. Remove crop-pan, scale, rotation and shape/corner-rounding from the out-of-scope list — they are offered today, through this gesture |
| 2 | violation | consistency | STORY-98 (`story-af36c2cb`) | story-body-edit | The **Out of scope** paragraph reads "Serving the edit render over the public web. It is a local render channel; the published and preview channels remain the only shipped ones." REQ-145 (`request-b474390f`, free_and_reconciled, completed 2026-08-31) makes the deployed control-app Worker render and serve the edit channel — its AC1 is "with `1c builder` **not running**, `app.1stcontact.io` serves the chrome, lists sites, and renders the draft **and edit** channels". Confirmed in code at `apps/control-app/src/router.ts:68` (`const PREVIEW_CHANNELS: PreviewChannel[] = ['draft', 'edit']`) and `tools/generate/src/cli/preview.ts:203`; corroborated by BUG-37 (free_and_reconciled), which measured edit-channel requests at that origin, and by STORY-85's contract text ("the edit channel keeps switching the behaviour off in the portable render as it did in the filesystem one … served from the edge") | Restate the non-goal as what is still true and what REQ-147 (Cloudflare Access, free_and_reconciled) makes it: the edit channel is **never served to site visitors and never published** — it is reachable only through the operator-gated builder origin, which renders it per request. Drop "local render channel" and "the only shipped ones" |
| 3 | warning | consistency | STORY-101 (`story-3bf94bd4`) | story-body-edit | Three in-scope/technical-context passages still enumerate the pre-REQ-136 image field list: "an image region exposes **which image goes here** … alongside its alt text"; "an image region's picker and its alt text sit in one dialog"; and "Kind-agnosticism proved **three times**, not merely claimed" (image selection, typography, colour). REQ-136 is the fourth proof and explicitly records that it needed no change here — it is the strongest instance of the property the story is claiming | Fold framing into the same sentences: an image region exposes its handle and alt text **and how the picture is seen**; the proof count becomes four. Do this in the same pass as finding 1 so the body does not half-agree with itself |
| 4 | warning | consistency | STORY-98 (`story-af36c2cb`) | story-body-edit | "**A third channel** — the same site definition rendered a third way, into its own output location" describes one of two live delivery paths. `1c render --edit` still writes `storage/dist/<root>/<slug>/edit/` (`tools/generate/src/cli/commands.ts:126-127`, `tools/generate/src/store/paths.ts:74`) so the sentence is not false — but since REQ-119 and REQ-145 the channel is also rendered per request with no output location at all | Opportunistic, alongside finding 2: say the channel is a render **mode** that never publishes, is never content-addressed and never enters revision history, and that where it is materialised it lands in its own output location. Do **not** delete the output-location claim — AC-958 still rests on it and the CLI path still behaves that way |
| 5 | info | exclusivity | STORY-98 + STORY-101 | — | The two stories divide the capability cleanly: STORY-98 owns the treatment a hot segment receives, STORY-101 owns choosing which segment is hot; the seam-marker obligation is split the same way (the channel requires a seam be identifiable, the module identifies it) and STORY-85 confirms the settled-state carve-out landed on the contract story as STORY-98 claims. No overlap | none |
| 6 | info | coverage | CAP-84 (`capability-25f7e486`) | — | The superseded predecessor capability holds zero stories and carries `superseded_by_uid: capability-12fee326`. The consolidation described in the CAP-87 body is complete in the ticket graph | none |

## Notes for the Editor

- **Both findings are the same shape**: an out-of-scope bullet written against the
  intent that created the story, never revisited when a later reconciled intent
  moved the boundary. Neither is a coverage gap — the behaviour is delivered,
  tested and owned; only these two stories still deny it. Repair is a body edit on
  each; no AC needs adding, deprecating or editing for either.
- **Do not fix finding 1 by adding ACs to STORY-101.** The field list an image
  region exposes is the write path's, and STORY-100 (`story-37a3921b`, CAP-86)
  already carries it in full — including the ordering rule that `src` and `alt`
  come first. STORY-101's own text says the same ("which parameters a run exposes
  … are all the write path's"), which is exactly why the out-of-scope line is the
  wrong place for framing to be mentioned at all. The minimal correct repair is to
  stop excluding it.
- **Neither story body has been edited in this regression cycle.** STORY-101's
  `updated_at` is 2026-08-20 with `last_field_updated: status`, STORY-98's is
  2026-08-16 with `last_field_updated: uat_coverage`. If earlier attempts in this
  loop reported progress on story-level alignment, it did not reach either body —
  a re-check will keep returning these two findings until the paragraphs named
  above actually change.
- **REQ-136's own supersession note is the precedent to follow.** It records that
  five suites pinned the image segment's field list as exactly `['src','alt']` and
  restates each as "the pair comes first, in that order" rather than as an
  exhaustive list. The story bodies need the same treatment: describe the ordering
  guarantee, not a closed enumeration that the next region kind will falsify again.
