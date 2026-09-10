---
uid: report-1321eb22
id: REPORT-3813
type: report
title: 'Capability-Intent Alignment: In-Page Copy Editing: The Editable Render & The
  Click-to-Edit Gesture (level=story)'
created_by: xgd
created_at: '2026-09-10T23:07:24.538763+00:00'
updated_at: '2026-09-10T23:07:24.538763+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-12fee326
  level: story
  violations: 0
  warnings: 3
  needs_review_count: 0
---

# Capability-Intent Alignment: In-Page Copy Editing: The Editable Render & The Click-to-Edit Gesture
# Level: story

**Result**: PASS
**Violations**: 0
**Warnings**: 3
**Needs review**: 0

Two stories are in scope, both `story_kind: upgrade`:

- **STORY-98** (`story-af36c2cb`) — the edit render channel
- **STORY-101** (`story-3bf94bd4`) — the click-to-edit gesture

**Both violations from report-4c3e67c5 (attempt 5) are repaired, and both of its
warnings with them.** Both bodies now read `last_field_updated: body`,
`updated_at: 2026-09-10T22:59Z` — the edits reached the paragraphs the previous
report named, verbatim in the shape it suggested. Every load-bearing structural
claim in both bodies was re-verified against code in this pass (citations below).
The three findings that remain are warnings of one shape: an in-scope enumeration
written against the intent that created the story and not revisited when a later
reconciled intent added a field to it. None is false, none is a coverage gap, and
none blocks this level.

## Cumulative Intent Considered

Ledger built from `fields.intent_uid` / `fields.updated_by` on both stories
(bundle-0385746c = BUNDLE-14, bundle-15c1f647 = BUNDLE-16, bundle-77b28def =
BUNDLE-19, request-8a132869 = REQ-136), expanded to member intents, then widened
two ways this pass: a sweep of every `request-*` / `bug-*` body in the store for
`edit channel` / `edit render` / `edit mode` / `click-to-edit`, and a title sweep
for `editor|modal|copy.edit|segment|picker|palette|render`. That widening added
**REQ-121** and **REQ-128** to the ledger — both reconciled, both absent from
report-4c3e67c5's ledger — and confirmed nothing reconciled after 2026-08-31
touches this capability.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-116 (`request-41796766`, BUNDLE-14) | free_and_reconciled | created 2026-07-31, merged `cd8f98c8` 2026-08-06 | The edit render: third channel, deliberately non-functional, settled state, derived segmentation, render-scoped addresses, renderer-drawn outlines. Originating intent of STORY-98 | YES |
| REQ-119 (`request-64864801`) | free_and_reconciled | 2026-07-31 | Request-time draft **and edit** renders inside control-app | YES |
| REQ-117 (`request-395b67e6`, BUNDLE-16) | free_and_reconciled | created 2026-07-31, merged `1741ee5d` 2026-08-07 | Click segment → fields modal → validated diff → re-render; stamp vocabulary moved to `site-schema`; hover rule in `L1_EDIT_CSS`; contact-form seam marker. Originating intent of STORY-101 | YES |
| **REQ-121** (`request-9707484c`) | **free_and_reconciled** | created 2026-08-07, completed 2026-08-10 | **The copy-edit modal made elegant: (1) modal mounts inside the shell root and takes the theme, (2) one app typeface via the shell's `font` token, (3) heading + `Text` label column dropped, (4) CTAs follow the theme, (5) editing box mirrors page typography/background with size clamped, (6) modal sized for copy with Save reachable** | **YES — newly added to this ledger** |
| **REQ-128** (`request-de67e1a1`) | **free_and_reconciled** | 2026-08-08 | **Background image selection: the container segment's `backgroundImageUrl` reaches the phase-1 dialog** | **YES — newly added to this ledger** |
| REQ-129 (`request-b1300473`) | free_and_reconciled | 2026-08-09 | Verbatim `get_l1`/`set_l1` on the control surface — "click-to-edit modal unchanged" | YES (explicit non-change here) |
| REQ-132 (`request-5946d045`) | free_and_reconciled | 2026-08-12 | Image picker as a thumbnail grid with file-name labels | YES |
| REQ-133 (`request-8467b1a3`, BUNDLE-19) | free_and_reconciled | 2026-08-12 | Palette popup as the pick surface the colour row opens | YES |
| REQ-135 (`request-a8ccd0dd`) | free_and_reconciled | 2026-08-12 | Text properties — size, weight, italic, capitalisation on the run | YES |
| REQ-136 (`request-8a132869`) | free_and_reconciled | created 2026-08-12, merged `a23c4c51` | Image framing, shape, rotation, scale and colour adjustment offered on the image region beside the picker; supersedes "an image segment exposes exactly `src` + `alt`". Last intent to touch STORY-98 | YES |
| REQ-138 (`request-1ff09fab`) | free_and_reconciled | 2026-08-12 | Parameter changes preview live in the editing box | YES |
| REQ-139 (`request-3f57cd0c`) | free_and_reconciled | 2026-08-12 | Locked controls that cannot express what the element holds, with the reason | YES |
| BUG-34 (`bug-13082cb4`) | free_and_reconciled | 2026-08-12 | Gradient-filled text previewed invisible | YES |
| BUG-35 (`bug-1bde3bf9`) | free_and_reconciled | 2026-08-13 | Capitalisation never previews — UA reset blocks `text-transform` | YES |
| REQ-140 (`request-3c0fec69`) | free_and_reconciled | 2026-08-15 | Colour — a run's colour and a panel's background, from the palette | YES |
| REQ-145 (`request-b474390f`) | free_and_reconciled | created 2026-08-15, completed 2026-08-31 | control-app becomes the builder; request-time L1 render in workerd. AC1: with `1c builder` not running, `app.1stcontact.io` renders the draft **and edit** channels | YES |
| REQ-147 (`request-23fd6e61`) | free_and_reconciled | 2026-08-15 | Cloudflare Access on `app.1stcontact.io` — the builder origin is operator-gated | YES (context) |
| REQ-148 (`request-7ae3c2cc`) | free_and_reconciled | 2026-08-15 | Behavior modules render in workerd, contact-form precompiled — records that "the edit channel switches the behaviour off" still holds there. **No new ask of this capability** | YES (confirmatory only) |
| REQ-149 (`request-554ac441`) | free_and_reconciled | 2026-08-17 | Publish in the cloud: revisions and rendered output without a filesystem. Does not disturb "never published, never content-addressed, never in revision history" | YES (context) |
| BUG-37 (`bug-6612c4b7`) | free_and_reconciled | 2026-08-24 → 2026-08-31 | Edit-mode CPU cost at the deployed origin; measured the edit channel served request-time from the Worker | YES |
| REQ-134 (`request-ba3e3fba`) | abandoned | 2026-08-12 | An image generation component | NO |
| REQ-154 (`request-b88b79fe`) | bundled | 2026-08-20 | Browser Rendering driver behind the existing headless seam — capture/fidelity path, not this gesture's evidence | imminent, but no ask here |
| REQ-155/156/157/158–166 | draft | 2026-08-20 → 2026-08-31 | KB, ingestion, fidelity surface, library — none touch this capability | NO |

No intent in the ledger retires behaviour either story still describes. No
reconciled intent's asked behaviour is missing from the story tree.

## Verification of the attempt-5 repairs

| report-4c3e67c5 finding | Current text | Verdict |
|---|---|---|
| 1 (violation) STORY-101 out-of-scope excluded delivered image framing | Now excludes only REQ-136's own *Phase 2 — still open* list: "**zoom and true source-rect crop** (a picture pans today but does not zoom), **tint or scrim over an `<img>`**, **framing of a painted surface's own background image**, and **drag-driven crop handles** — together with asset upload and any image processing". Matches REQ-136 §"Phase 2 — still open" item-for-item (`request-8a132869`: zoom/`object-view-box`, tint/duotone over an `<img>`, background-surface framing, drag-driven crop handles). Crop-pan, scale, rotation and shape/corner-rounding no longer denied | **repaired** |
| 2 (violation) STORY-98 called the channel "a local render channel", published+preview "the only shipped ones" | Now: "**Serving the edit render to site visitors.** The edit channel is never published and never reaches a visitor of the site it renders … reachable only through the operator-gated builder origin, which renders it per request; that origin, and the gate in front of it, belong to the workspace capability". Both offending phrases gone; REQ-145 + REQ-147 correctly stated | **repaired** |
| 3 (warning) STORY-101's three pre-REQ-136 image enumerations | All three folded: "alongside its alt text and **how the picture is seen**, the framing, shape and colour adjustment the write path offers on it"; the arrival list now ends "…then a picture's framing and adjustment with nothing here changed at all"; "Kind-agnosticism proved **four times**"; and the composed-dialog bullet now reads "its picker, its alt text and the parameters that say how the picture is framed, shaped and adjusted" | **repaired** |
| 4 (warning) STORY-98's "into its own output location" | Now a render **mode**: "never published, never content-addressed, never entered into a site's revision history. Where it is materialised it lands in its own output location … it is also rendered per request, with no output location at all, by the origin that serves the editing workspace — the mode is what is load-bearing, not the directory." The output-location claim AC-958 rests on is preserved, as the report instructed | **repaired** |

## Implementation re-verification (chain of authority, tier 3)

Re-checked this pass rather than inherited, because both bodies were rewritten
four minutes before this check ran:

- **Request-time serving of the edit channel** — `apps/control-app/src/router.ts:68`
  (`const PREVIEW_CHANNELS: PreviewChannel[] = ['draft', 'edit']`), used at `:596`.
- **Materialised output location still exists** — `tools/generate/src/store/paths.ts:15-21`
  (`RenderChannel = 'draft' | 'published' | 'edit'`, "It gets its own directory"),
  `tools/generate/src/cli/commands.ts:104-128` (`--edit` forces `source = 'draft'`,
  channel `'edit'`).
- **Always from the draft** — `commands.ts:120-124`: "a revision is immutable, so
  an edit render of one would be a page offering to change" — exactly STORY-98's
  sentence.
- **One published vocabulary** — `packages/site-schema/src/l1/edit.ts:32-59`
  declares `L1_EDIT_PATH_ATTR`, `L1_EDIT_SEGMENT_ATTR`, `L1_EDIT_MARKER_ATTR`,
  `L1_EDIT_PAGE_ATTR`, `L1_EDIT_MODULE_ATTR`, `L1_EDIT_SLOT_ATTR`,
  `L1_EDIT_HOT_CLASS`; re-exported at `packages/site-schema/src/l1/index.ts:40-46`
  and consumed by `packages/framework/src/l1/render.ts` and `edit-client.ts`.
- **Renderer-drawn outline, hover treatment included, outside layout** —
  `packages/framework/src/l1/render.ts:1804-1807`: the resting rule is
  `outline: 1px solid …; outline-offset: -1px`, the hot rule
  `[segment].l1-edit-hot { outline: 2px solid …; outline-offset: 3px }`. Drawn with
  `outline`, so neither treatment can move a box — STORY-98's claim verbatim.
- **Every module that has a seam marks it** — `data-l1-slot` emitted by
  `packages/framework/src/modules/carousel/component.ts:67` ("REQ-117 — `data-l1-slot`
  marks the seam") *and* `packages/framework/src/modules/contact-form/component.ts`.
  The obligation is on the catalog, as STORY-98 says, and REQ-148's precompilation
  did not drop it.
- **A module declares its own behaviour-off state** — `packages/framework/src/modules/behavior.ts:171-172`
  (`edit?: boolean` — "render the edit channel: the module's own behaviour switched
  off") and `packages/framework/src/modules/carousel/styles.css:30-44`, an
  edit-scoped rule keyed off the document-level `data-fc-edit` marker.
- **The carve-out STORY-98 claims landed on the contract story really landed** —
  STORY-85 (`story-179b8c06`, CAP-70) §"A behavior module ships zero CSS — with two
  declared carve-outs", lines 174-198: the settled state is the second carve-out,
  scoped to the edit channel by the document-level marker. STORY-98's "(resolved)"
  is accurate, not aspirational.
- **Every cross-reference in both bodies resolves**: STORY-85 (`story-179b8c06`,
  CAP-70), STORY-98, STORY-99 (`story-e674c60a`, CAP-85 — matches the body's
  "CAP-85"), STORY-100 (`story-37a3921b`, CAP-86 — matches), STORY-113
  (`story-ee073693`, completed) and STORY-114 (`story-4300366a`, completed), both
  in CAP-98. **Neither body cites any REQ/BUG at all**, so Step 2.5's
  named-abandoned-vehicle case does not arise anywhere in this capability.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-98 (`story-af36c2cb`) | REQ-116 (origin); REQ-117 (hover rule, page stamp, vocabulary move, contact-form seam); REQ-119 + REQ-145 + BUG-37 (request-time render, deployed origin); REQ-147 (the gate); REQ-136 (paint parity); REQ-148 + REQ-149 (confirmatory) | **aligned** — both attempt-5 findings repaired; every structural claim re-verified in code above |
| STORY-101 (`story-3bf94bd4`) | REQ-117 (origin); REQ-121 (dressed box, size clamp, dropped label column, footer reachable); REQ-128 (panel background image); REQ-132 (grid); REQ-135 + REQ-138 (typography, live preview); REQ-136 (framing through the unchanged split); REQ-139 (locks); REQ-140 + REQ-133 (colour row, palette popup); BUG-34, BUG-35 (glyph paint, capitalisation + tracking); REQ-129 (explicitly unchanged) | **aligned, 3 warnings** — two in-scope enumerations trail a later reconciled intent (findings 1, 2) and one provenance sentence overstates REQ-117 (finding 3). No false behavioural claim, no coverage gap |
| STORY-98 ↔ STORY-101 boundary | REQ-116 §Non-goals / REQ-117 | **aligned** — the render owns what a hot segment *looks like* (and code agrees: `L1_EDIT_CSS` carries both treatments), the gesture owns *which* segment is hot. The seam obligation splits the same way: the channel requires a seam be identifiable, the module identifies it. Neither restates the other |
| BUG-35's four-parameter closure | BUG-35, REQ-135, REQ-138 | **aligned** — the body records the capitalisation/tracking divergence as *closed* and the covering criterion as claiming four parameters; AC-1138 is titled "Size, weight, italic **and capitalisation** all restyle the words…" and AC-1284 carries tracking separately. Body and AC layer agree |
| CAP-84 (`capability-25f7e486`) | — | **aligned (info)** — `status: superseded`, zero stories attached; the consolidation the CAP-87 body describes is complete in the ticket graph |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | STORY-101 (`story-3bf94bd4`) | story-body-edit | The in-scope bullet "**A form over that region's fields**" enumerates the painted-panel case as exposing one thing: "a painted panel exposes the colour it is painted". REQ-128 (`request-de67e1a1`, free_and_reconciled, 2026-08-08) put the container segment's `backgroundImageUrl` into this same dialog, and AC-1050 (`acceptance_criterion-170a171f`) asserts both halves — "A panel **carrying a background image** exposes a closed picker of the site's own images, drawn as the **same grid of thumbnails** … Every painted panel — with a background image or without one — **also** exposes the colour it is painted". The body is not false (it names the colour, which is the always-present half) and it alludes to the other half two bullets down ("a region that exposes only a background image gets no text-editing box at all"), but the enumeration reads as complete and is not. **This is the same drift shape as report-4c3e67c5 finding 3, one intent earlier** | In the same sentence, give the panel both: "a painted panel exposes the colour it is painted and, where it carries one, which image it is painted with". Phrase it as what the region exposes rather than as a closed list, per REQ-136's own supersession precedent |
| 2 | warning | coverage | STORY-101 (`story-3bf94bd4`) | story-body-edit | REQ-121 (`request-9707484c`, free_and_reconciled, completed 2026-08-10) is one intent over six behaviours; the body carries items 3, 5 and 6 in detail (the dressed box, the size clamp, the dropped label column, "the footer — and therefore Save — stays reachable") but is **silent on items 1, 2 and 4**: the modal mounting inside the shell root so it takes the theme's palette and re-colours on a theme switch, the single app typeface set through the shell's `font` token, and Cancel/Save taking the theme accent and real hover/focus/disabled states. Those three are carried by AC-1037 (`acceptance_criterion-279f1f6d`), AC-1038 (`acceptance_criterion-4e320828`) and AC-1041 (`acceptance_criterion-fc456d2d`), so **the tree expresses the intent and coverage is met** — this is an asymmetry in the body, which is otherwise exhaustive about every other intent's asks (locks, grid, colour row, live preview, glyph paint). Not a violation for that reason | Add one in-scope bullet for the dialog's own presentation: it opens inside the workspace's themed surface, takes the app typeface and the theme's palette, follows a theme switch, and its Cancel/Save read as the workspace's own controls. Cite nothing new — AC-1037/1038/1041 already assert it |
| 3 | warning | consistency | STORY-101 (`story-3bf94bd4`) | story-body-edit | The closing technical-context note reads "**Known defect, deliberately not fixed here**: saving a copy change rewrites the whole page definition with different unicode escaping … Pre-existing, cosmetic, and **carried as its own ticket**." REQ-117 (`request-395b67e6`) §"Known, not fixed here" says the defect is "Pre-existing in `writeJson`, cosmetic, and **worth its own ticket**" — a recommendation, not a record. A store-wide sweep for `unicode escap` across every `request-*` / `bug-*` file returns **only REQ-117 itself**; no such ticket exists. The story asserts a tracking artifact that is not there, which is exactly the kind of claim a later reader would act on | Restate to match REQ-117: "cosmetic, pre-existing in `writeJson`, and worth its own ticket" — or file the ticket and cite it. Do not delete the note; the defect is real and REQ-117 records it |
| 4 | info | consistency | STORY-101 (`story-3bf94bd4`) | — | The repaired out-of-scope list matches REQ-136's Phase 2 list except for two items it does not mention: **`sepia`/`invert`** ("exist in L1 and in the fold but are not offered in the editor — stylisation rather than adjustment") and the **derived-render cache** (a cost concern, not this gesture's surface). Neither omission makes a false claim — the list is scoped to "the half of image framing that is still **unbuilt**", and sepia/invert are built but unoffered. Recorded so a later reader does not mistake the absence for drift | none |
| 5 | info | exclusivity | STORY-98 + STORY-101 | — | No overlap at story level, and none at the level below it either: the two stories divide treatment-of-a-hot-segment (STORY-98) from choice-of-hot-segment (STORY-101), and `L1_EDIT_CSS` (`render.ts:1804-1807`) shows the renderer owning both outline treatments while the client only names which segment is hot — code matching the declared split | none |
| 6 | info | coverage | CAP-84 (`capability-25f7e486`) | — | The superseded predecessor holds zero stories and carries `superseded_by_uid: capability-12fee326`. No duplicate story surface survived the consolidation | none |

## Notes for the Editor

- **This level passes. All three findings are warnings and none blocks it.** If they
  are taken, take findings 1 and 2 in one pass on STORY-101's in-scope list and
  finding 3 in the same write — all three are single-sentence edits to one body, and
  no AC needs adding, editing or deprecating for any of them. Finding 1's behaviour
  is AC-1050's and finding 2's is AC-1037/1038/1041's; both are already asserted.
- **The recurring drift shape in this capability is the closed enumeration, and it
  has now recurred four times.** report-4c3e67c5 found it for the image region
  (REQ-136); findings 1 and 2 here find it for the painted panel (REQ-128) and the
  dialog's own chrome (REQ-121). The body's own text explains why it keeps happening
  — "which parameters a run exposes … are all the write path's" — so any sentence
  here that lists a region's fields is a copy of a list this story does not own.
  Prefer "exposes whatever the write path offers on it, which today is …" to a
  bare list.
- **Two intents were missing from the previous ledger** (REQ-121, REQ-128), found by
  sweeping intent *bodies* for `edit channel` / `edit render` / `edit mode` /
  `click-to-edit` and intent *titles* for `editor|modal|copy.edit|segment|picker|palette|render`
  rather than walking `intent_uid` / `updated_by` alone. Those two fields name the
  intent that *created* and the intent that *last touched* an element — for a story
  eleven intents deep they are a starting point, not the ledger. A future check on
  this capability should repeat the sweep.
- **Nothing reconciled after 2026-08-31 touches this capability.** REQ-148 and
  REQ-149 land nearby (behavior modules in workerd; publish without a filesystem)
  and both were checked: REQ-148 only *confirms* the edit channel still switches
  behaviour off, and REQ-149 does not disturb "never published, never
  content-addressed, never in revision history". REQ-154 is `bundled` (imminent) but
  its Browser Rendering driver sits on the capture/fidelity seam, not on this
  gesture's browser evidence. Everything from REQ-155 onward is `draft`.
- **The attempt-5 fix report's claim checks out.** report-388c3cff said 7 passage
  edits across 2 story-body updates with 0 violations remaining; both bodies carry
  `last_field_updated: body` at `2026-09-10T22:59Z`, and each of the four findings
  it answered is repaired in the shape report-4c3e67c5 prescribed — including the
  instruction *not* to delete STORY-98's output-location claim, which AC-958 rests
  on. That claim is still there and still true in code
  (`tools/generate/src/store/paths.ts:15-21`).
