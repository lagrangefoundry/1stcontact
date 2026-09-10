---
uid: report-efb2ed3c
id: REPORT-3816
type: report
title: 'Capability-Intent Alignment: In-Page Copy Editing: The Editable Render & The
  Click-to-Edit Gesture (level=ac)'
created_by: xgd
created_at: '2026-09-10T23:32:30.068385+00:00'
updated_at: '2026-09-10T23:32:30.068385+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-12fee326
  level: ac
  violations: 1
  warnings: 3
  needs_review_count: 0
---

# Capability-Intent Alignment: In-Page Copy Editing: The Editable Render & The Click-to-Edit Gesture
# Level: ac

**Result**: FAIL
**Violations**: 1
**Warnings**: 3
**Needs review**: 0

Two stories, both `story_kind: upgrade`, **54 ACs** in scope:

- **STORY-98** (`story-af36c2cb`) — the edit render channel, 14 ACs. **All 14 aligned, no finding** (re-verified independently, not merely adopted).
- **STORY-101** (`story-3bf94bd4`) — the click-to-edit gesture, 40 ACs. The one violation and all three warnings sit here.

**Both violations of report-657d1e9a are closed and verified.** AC-1028 and AC-1140
were repaired at 2026-09-10T23:17Z by report-9393c98c (attempt 5), and its warning 1
(AC-1123's missing image witness) with them. I re-read all three against the story
body and against `packages/site-schema/src/l1/edit.ts` in this branch; the repairs
are correct and complete. See findings 5 and 6.

**The violation below is newly derived, not carried forward.** It is the *same drift
shape* the previous report named as recurring — a closed enumeration of what a
region or dialog holds, overtaken by REQ-136/REQ-140 — found in an AC no previous
cycle examined for it. Attempt 5 repaired the three instances it was pointed at; a
sweep of all 54 AC bodies for exclusion/enumeration phrasing surfaces three more,
one of which is material.

## Cumulative Intent Considered

Story level passed 2026-09-10T23:07Z (report-1321eb22, 0 violations) and neither
story body has moved since (`updated_at` 22:59:01Z / 22:59:05Z, `last_field_updated:
body`). Per the level cascade the story bodies are my working reference; I escalated
to intent bodies only for the subjects where an AC contradicts its body. I adopt the
ledger of report-1321eb22 / report-657d1e9a rather than rebuilding it — no intent has
changed status in the intervening hour — and re-read from the store the three
statuses the findings below turn on.

| Intent ID | UID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|---|
| REQ-116 | `request-41796766` | free_and_reconciled | 2026-08-06 | The edit render channel. Origin of STORY-98 | YES |
| REQ-117 | `request-395b67e6` | free_and_reconciled | 2026-08-07 | Click → fields modal → validated diff → re-render. Origin of STORY-101 | YES |
| REQ-118 | `request-66e4c630` | free_and_reconciled | 2026-08-07 | Image selection through the same loop | YES |
| REQ-121 | `request-9707484c` | free_and_reconciled | 2026-08-07 | The modal made elegant: themed chrome, app typeface, dressed box | YES — **drives W3** |
| REQ-128 | `request-de67e1a1` | free_and_reconciled | 2026-08-08 | A painted panel's background image reaches the dialog | YES |
| REQ-132 | `request-8467b1a3`/`request-5946d045` | free_and_reconciled | 2026-08-12 | Picker becomes a thumbnail grid | YES |
| REQ-135 | `request-a8ccd0dd` | free_and_reconciled | 2026-08-12 | A run's typography | YES |
| **REQ-136** | `request-8a132869` | **free_and_reconciled** | merged `a23c4c51` 2026-08-12 | **"Image editor: non-destructive framing and colour adjustment" — an image region gains 13 parameters beside its picker and alt text** | YES — **drives V1, W1** |
| REQ-138 | `request-1ff09fab` | free_and_reconciled | 2026-08-12 | Live preview | YES |
| REQ-139 | `request-3f57cd0c` | free_and_reconciled | 2026-08-12 | Locked controls, with the reason | YES |
| **REQ-140** | `request-3c0fec69` | **free_and_reconciled** | 2026-08-15 | **"Page editor: colour — text colour and panel background from the palette" — every paintable surface gains a colour row** | YES — **drives W2** |
| BUG-34 / BUG-35 | `bug-13082cb4` / `bug-1bde3bf9` | free_and_reconciled | 2026-08-12/13 | Glyph paint; capitalisation + tracking reaching the glyphs | YES |
| REQ-145 / REQ-147 / BUG-37 | — | free_and_reconciled | 2026-08-15 → 08-31 | Request-time edit render at the builder origin | YES (context) |
| REQ-134 | `request-ba3e3fba` | abandoned | 2026-08-12 | An image generation component | NO |
| REQ-154 | `request-b88b79fe` | bundled | 2026-08-20 | Browser Rendering driver | imminent, no ask here |

**Provenance note, unchanged and still load-bearing**: no AC under this capability
carries an `intent_uid` or `updated_by` of its own. An AC's alignment to an intent is
always inferred through its story, never read off the ticket — which is the
structural reason an AC can keep asserting a superseded composition for a month while
every layer around it is repaired. The `updated_at` census makes the exposure precise:
**36 of the 40 ACs under STORY-101 were last touched on 2026-08-16 or earlier**, i.e.
before REQ-140 reconciled and four days before AC-1279 existed; six more on 2026-08-20;
only the three attempt-5 repaired today.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-98's 14 ACs (AC-948…AC-958, AC-1007, AC-1008, AC-1135) | REQ-116; REQ-117; REQ-136 (paint parity) | **aligned** — re-checked bullet by bullet against the 22:59Z body: channel/output location (AC-958), inertness (AC-948), settled state (AC-949, AC-950), derived segmentation (AC-951), addressing (AC-953, AC-954, AC-955), page stamp (AC-1007), the module's own seam marker as a **catalog-wide obligation** (AC-954 ¶3, verification quantified "for each module in the catalog that exposes a presentation seam"), renderer-drawn outlines + hover (AC-952), published vocabulary (AC-1008), no leakage (AC-956), element identifier preserved (AC-957), one emitter / paint parity (AC-1135). No gaps, no overlaps |
| **AC-1028** (`acceptance_criterion-26ffac6d`) | REQ-118, REQ-136 | **repaired and verified** — see finding 5 |
| **AC-1140** (`acceptance_criterion-b04cbb23`) | REQ-138, REQ-140 | **repaired and verified** — see finding 5 |
| **AC-1123** (`acceptance_criterion-35907074`) | REQ-135, REQ-136, REQ-140 | **witness set repaired** (finding 6); **1 warning** on the criterion's own routing enumeration (W1) |
| **AC-997** (`acceptance_criterion-e2413484`) | REQ-117, REQ-118; **overtaken by REQ-136** | **violation V1** — describes the image dialog as holding "two controls" |
| AC-1000 (`acceptance_criterion-43e5a016`), AC-1043 (`acceptance_criterion-8acf277e`) | REQ-118, REQ-132; **overtaken by REQ-140** | **warning W2** — both illustrate with "a region that exposes nothing but which image it carries", which no longer exists |
| AC-1037, AC-1038 | REQ-121 items 1, 2, 4 | **aligned to intent, not derivable from the story body** — W3, carried forward unresolved by design |
| AC-1279, AC-1280, AC-1281 | REQ-140, REQ-133 | aligned — colour row, read-only panel-behind-the-words row with save-then-navigate, empty-palette state |
| AC-1282, AC-1283 | REQ-139 | aligned — the two halves of the lock rule |
| AC-1138, AC-1139, AC-1143, AC-1284, AC-1040 | REQ-138, BUG-34, BUG-35 | aligned — AC-1138's four-parameter repair holds and its test name now matches (report-9393c98c #8) |
| AC-1112…AC-1116 | REQ-132 | aligned — grid presentation, file-name label + tooltip, real bytes, placeholder tile, keyboard group. AC-1112 is where the grid carve-out is actually owned (see W1) |
| AC-1050 (`acceptance_criterion-170a171f`) | REQ-128, REQ-140 | aligned, **do not narrow** — finding 8 |
| AC-1041, AC-1042, AC-1044, AC-1039 | REQ-121 items 3, 5, 6 | aligned — AC-1044 correctly handles the image case ("an image region's box is a single alt-text field" beside the grid) without claiming the dialog holds nothing else |
| AC-993…AC-996, AC-998…AC-1006 | REQ-117 | aligned — hover, innermost resolution, seam scoping, save / refuse / the two dead ends / stale rendering / viewing-is-not-editing / one address implementation |
| STORY-101 coverage vs body | — | **complete** — every in-scope bullet has a covering AC; every out-of-scope exclusion is consistent with what the AC set does not claim. The gap below is a **consistency** gap inside a covering AC, not a missing one |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | AC-997 (`acceptance_criterion-e2413484`) | ac-edit | The criterion reads: *"A dialog over an image region holds **two controls** — the thumbnail grid for the image and the form for its alt text — and the values staged in both merge into a single change on confirm."* **Since REQ-136 (`request-8a132869`, free_and_reconciled, merged `a23c4c51`, 2026-08-12) an image dialog holds three.** `copyFieldsOf`'s image branch returns `src`, `alt`, then `...framing.fields` (`packages/site-schema/src/l1/edit.ts:987-1005`), and `imageFramingFields` (`:823-876`) supplies 13 parameters — Fill mode, Pan across/down, Shape, Corner rounding, Rotate, Scale and six `FILTER_CONTROLS` adjustments. Those route to the **parameter sheet**, a third mounted control: `tests/reconciliation-copy-edit-parameter-sheet.test.ts:522-533` opens an image region and asserts `.builder-modal__picker`, `.builder-modal__box` **and** `.builder-modal__props` are all present at once. Three layers contradict the AC: (a) the story body's own bullet — *"an image region's picker, its alt text **and the parameters that say how the picture is framed, shaped and adjusted** sit in one dialog … one unsaved-changes state spans all of them"*; (b) AC-1123, which asserts the merge generically across *"either [form] — and the controls the dialog draws itself"*; (c) AC-1028 as repaired at 23:17Z today, which now states the framing parameters are exposed and routed to the sheet. **The consequence is not cosmetic**: AC-997 is the AC that owns one-confirmed-form-is-one-change, and both its criterion and its Verification stop at grid + alt text, so **nothing in the matrix asserts that a framing parameter staged in the sheet merges into the same single change for an image region** — the exact composition REQ-136 created. Its covering UAT stops there too (`tests/reconciliation-copy-edit-image-picker.test.ts:657-693` picks a tile, types alt text, asserts one POST; `:689` asserts untouched `axes` did not travel, which is the *other* half). This is the sixth instance of the closed-enumeration shape the previous report named, and the first in an AC no prior cycle inspected for it | Restate the composition as three controls rather than two — *"a dialog over an image region holds the thumbnail grid the dialog draws itself, the editing box for its alt text and the parameter sheet for how the picture is seen, and the values staged in all of them merge into a single change on confirm"* — or, better, state it by derivation (*"however many controls the region's fields were spread across"*), which the title already does and which the recurring drift argues for. Extend the Verification's image leg by one step: alter the thumbnail, the alt text **and one framing parameter**, and assert a single change request carries all three. Leave the *only-what-was-touched* paragraph and its picker-re-report clause exactly as they are — both are still precisely right |
| 2 | warning | consistency | AC-1123 (`acceptance_criterion-35907074`) | ac-edit | The criterion's routing sentence is binary: *"A field that is plain words is drawn in the box; every other shape a region can expose — a bounded number, a choice from a list the surface supplied, a yes/no, a colour — is drawn in the sheet."* An image `src` **is** "a choice from a list the surface supplied" (`type: 'enum'`, `format: 'image'`, `edit.ts:992-999`) and is **not** drawn in the sheet — it is drawn as the thumbnail grid. The AC's own Verification, as repaired at 23:17Z today, asserts exactly that (*"its `src`, whose descriptor declares its options are images, is drawn as the thumbnail grid"*), and the covering test partitions on `f.format === 'image'` before the box/sheet split (`parameter-sheet.test.ts:515-519`). So the AC's Criterion and its Verification now disagree about where a closed image list lands. The story body states the rule with four routes, not two (*"the dialog routes each field to one of **four** controls … a field whose descriptor declares that its options are images is drawn as the grid … a field that declares a colour is drawn as the colour row … plain text … in the box, and everything else … in the parameter sheet"*). **Warning rather than violation**: the carve-out is genuinely owned by AC-1112 (*"the picker replaces only the control for the closed list"* — *"a field that is not an image choice is still drawn by the shared form component"*), AC-1123's very next sentence names the grid as descriptor-chosen, and the AC's load-bearing claim — the split is by declared control, never by region kind — is correct and now exercised. It is one imprecise clause, exposed rather than caused by attempt 5's correct repair | Carve the image-options descriptor out of the enumeration in one clause, deferring the grid itself to AC-1112: *"…a field whose descriptor declares its options are images is drawn as the grid this dialog draws itself (AC-1112); every other non-words shape — a bounded number, a choice from a list the surface supplied, a yes/no, a colour — is drawn in the sheet."* No change to the Verification, which is already right |
| 3 | warning | consistency | AC-1000 (`acceptance_criterion-43e5a016`) + AC-1043 (`acceptance_criterion-8acf277e`) | ac-edit | Both illustrate with a region that no longer exists. AC-1000: *"A dialog whose **only control is the thumbnail grid** — a region that exposes nothing but which image it carries"*, and its Verification *"Repeat over a region whose dialog is **all thumbnails and no form at all**"*. AC-1043: *"a dialog that is **all thumbnails and no text**"*, Verification *"Open a dialog that **exposes only an image choice**"*. **REQ-140 (`request-3c0fec69`, free_and_reconciled, 2026-08-15) gave every paintable surface a colour**, unconditionally: `colorField('surfaceFill', …)` is derived even where the node holds none (`edit.ts:1022-1024`, with the comment stating exactly why). A painted backdrop therefore exposes its background handle **and** its fill, so its dialog is a grid plus a colour row in the sheet — not "all thumbnails", and not a region that "exposes nothing but which image it carries". No node kind in `copyFieldsOf` yields an image field alone. The substantive claims survive intact — AC-1000's normative sentence leads with the universal (*"This spans **every control the dialog holds**, not only its form"*) and AC-1043's narrowing is keyed on *"the absence of **any editing surface**"*, which a painted backdrop still satisfies — which is why this is a warning and finding 1 is not. The covering tests already read the weaker, true property (`image-picker.test.ts:704-710` asserts `.builder-modal__form` is null, not that the dialog is grid-only) | In both ACs replace the stale description of the witness region with what it actually is: *"a painted backdrop, whose dialog is its picker and its colour row with no editing box at all"*. Keep AC-1000's universal opening sentence and AC-1043's absence-of-an-editing-surface key untouched — those are the criteria; only the example is stale |
| 4 | warning | consistency | AC-1037 (`acceptance_criterion-279f1f6d`) + AC-1038 (`acceptance_criterion-4e320828`) | story-body-edit | **Carried forward unresolved, by design.** Neither AC follows from STORY-101's body, which never mentions the dialog's own chrome, theme or typeface; both trace cleanly to REQ-121 (`request-9707484c`, free_and_reconciled) items 1, 2 and 4, so the **ACs are right and the body is thin**. Raised at ac level in report-657d1e9a finding 4 and explicitly deferred by report-9393c98c as a story-level item ("Recorded so the next ac cycle does not re-derive it — and so nobody 'resolves' it by deprecating two correct ACs"). That deferral was correct: this is the AC-level face of report-1321eb22 finding 2 and the repair belongs on the body. Re-recorded here for the same reason, and it does not gate this level | **No AC edit.** Add one in-scope bullet to STORY-101 at the story level: the dialog opens inside the workspace's themed surface, takes the app typeface and the theme's palette, follows a theme switch, and its Cancel/Save read as the workspace's own controls |
| 5 | info | consistency | AC-1028 (`acceptance_criterion-26ffac6d`) + AC-1140 (`acceptance_criterion-b04cbb23`) | — | **Both violations of report-657d1e9a are closed and verified — do not re-open.** AC-1028 (`updated_at` 2026-09-10T23:17:17Z) no longer says framing is "not offered": it now leads with picker + alt text, states the region exposes *"whatever else the write path offers on a picture, which today is …"*, routes those to the sheet by descriptor per AC-1123, and restates the exclusions as what is **unbuilt** (zoom/true crop, scrim, a painted surface's own background image, drag handles, upload). Every clause checks out against `edit.ts:823-876` and `:987-1005`. AC-1140 (`:23:17:21Z`) has struck *"including the run's colour and family, which the sheet has no control for at all"*; its Verification now names family (no control) and tracking (dressing, not a control) as the surviving witnesses and adds the stronger REQ-140 claim — the colour **does** have a row and must still hold the render's value while untouched — with a matching Criterion paragraph. The mirroring comment in `reconciliation-copy-edit-live-preview.test.ts:620-621` was corrected in the same pass, so the drift did not relocate to the test layer | none |
| 6 | info | coverage | AC-1123 (`acceptance_criterion-35907074`) | — | **report-657d1e9a warning 3 (= report-20d419a4 warning 3) is closed.** The "never by the region's kind" half is now exercised: the Verification adds an image region as a third witness carrying all three routes at once, and the covering test implements it by **partitioning the descriptors the origin reports** rather than a list written into the test (`parameter-sheet.test.ts:507-537`), so a parameter the derivation grows lands by its declared control without the test being told. That is the right shape and closes a warning open since 2026-08-16. Its criterion still needs W1's one-clause tightening | none |
| 7 | info | — | evidence execution | — | **The cited UATs could not be executed in this sandbox, and this report does not rest on them.** `npm test -- tests/req118-image-selection.test.ts tests/reconciliation-copy-edit-parameter-sheet.test.ts tests/reconciliation-copy-edit-live-preview.test.ts` ran 241s and ended **3 files failed, 7 passed, 8 skipped, 3 errors** — every error identical: `Error: listen EPERM: operation not permitted 0.0.0.0` from `startBuilder` (`tools/generate/src/cli/builder.ts:362-363`), raised in each suite's `beforeAll` (e.g. `parameter-sheet.test.ts:284-291`). That is the sandbox refusing to bind a socket, not a failing assertion — **no assertion failed**. It does mean the AC-1123 image block at `:507-537` and the AC-997/AC-1000 image-picker legs **did not run here**, so report-9393c98c's "11 / 1 / 3 passed" is neither confirmed nor contradicted by me. All code citations in this report were verified by reading the source directly, not inferred from a test result | none |
| 8 | info | consistency | AC-1050 (`acceptance_criterion-170a171f`) | — | **Do not narrow this AC to match its story body**, and do not narrow it while applying finding 3 either — it is the AC most exposed to an over-broad edit in the same neighbourhood. AC-1050 asserts both halves of a painted panel's fields (the background image where there is one, per REQ-128; the colour always, per REQ-140) while the body's form-over-fields sentence names only the colour. The body is the thin side, logged as report-1321eb22 finding 1. `edit.ts:1022-1035` confirms both fields with the fill as the always-present one — which is also the fact finding 3 turns on | none |
| 9 | info | exclusivity | AC-997 + AC-1123 + AC-1279; AC-1000 + AC-1123; AC-1043 + AC-1123; AC-1028 + AC-1123 | — | Re-examined and again deliberately not raised. The one-Save-one-change invariant is asserted over three **different control compositions** and merging them would lose a composition. Note that finding 1 makes AC-997 *more* distinct from AC-1123, not less: AC-1123 proves the merge over a copy region's box + sheet + colour row, AC-997 over an image region's grid + box + sheet. Likewise AC-1028 (what an image region exposes) cites AC-1123 for the routing rule rather than restating it, which is the correct division and should be preserved | none |

## Notes for the Editor

- **One violation, one passage, one AC.** Finding 1 rewrites a single sentence of
  AC-997's criterion and adds one step to its Verification. Findings 2 and 3 are the
  same class and are cheap to take in the same pass — all three are the *closed
  enumeration* shape. Nothing here needs a new AC, a deprecation or a story-body
  change.

- **The drift shape has now recurred six times in this capability, and the sixth was
  found by sweeping rather than by being pointed at.** Every instance is a sentence
  enumerating what a region exposes or what a dialog holds — a list this story does
  not own. The previous report's prescription stands and should be applied
  prophylactically to findings 1–3: **an AC that enumerates a region's fields or a
  dialog's controls should name the derivation, not copy its output.** Prefer
  "however many controls the region's fields were spread across" to "two controls",
  and "which today is …" to a bare list.

- **Why a sweep was warranted.** 36 of STORY-101's 40 ACs have not been touched since
  2026-08-16 — before REQ-140 reconciled — and no AC carries its own `intent_uid`, so
  nothing in the ticket graph links an AC to the intent that superseded it. The three
  ACs repaired today were repaired because a report named them. I re-read all 54 AC
  bodies and grepped them for exclusion and enumeration phrasing; findings 1–3 are
  what that turned up. An editor applying finding 1 should assume the shape recurs
  rather than that this sweep was exhaustive.

- **Attempt 5 did good work and none of it should be undone.** AC-1028, AC-1140 and
  AC-1123's witness set are all correct (findings 5 and 6), and the two pre-existing
  test failures it repaired in passing (`.builder-modal__props` on a painted panel;
  the parameter type set gaining `color`) were both real consequences of REQ-140 that
  had been sitting unfixed. Finding 2 is not a regression it introduced — it is a
  latent imprecision its correct repair made visible.

- **STORY-98 needs nothing at this level**, re-verified independently rather than
  adopted: all 14 ACs re-read against the 22:59Z body, every in-scope bullet covered
  exactly once, including the catalog-wide seam-marking obligation (AC-954 ¶3, whose
  verification is quantified over every module in the catalog) and paint parity
  (AC-1135).

- **W3 (AC-1037/AC-1038) must not be "resolved" at this level.** It is a
  `story-body-edit` and the ACs are correct. Deprecating them to match a thin body
  would delete two REQ-121 criteria.
