---
uid: report-20d419a4
id: REPORT-2061
type: report
title: 'Capability-Intent Alignment: In-Page Copy Editing: The Editable Render & The
  Click-to-Edit Gesture (level=ac)'
created_by: xgd
created_at: '2026-08-16T03:58:08.498731+00:00'
updated_at: '2026-08-16T03:58:08.498731+00:00'
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

Both violations sit on **STORY-101**'s ACs and are the AC-level half of the drift
the story-level cycle found immediately before this one (REPORT-2060, FAIL, 3
violations, unrepaired at the time of writing). Each is an AC that states a
behaviour is *absent or not offered* which a `free_and_reconciled` intent has
since delivered, and whose delivery is verifiable in this branch. **STORY-98's
14 ACs are aligned** — no finding against any of them.

## Cumulative Intent Considered

At `ac` level the story bodies are the working reference. I escalated to intent
history only where the story body is itself known-inconsistent — which the
preceding story-level cycle established for exactly the two subjects below. All
statuses re-read from the ticket store rather than carried over from REPORT-2060.

| Intent ID | UID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|---|
| REQ-116 | request-41796766 | free_and_reconciled | 2026-08-06 | The edit render: non-functional channel, derived segments, L1 addresses, outlines | YES |
| REQ-117 | request-395b67e6 | free_and_reconciled | 2026-08-07 | Copy editing end-to-end: click segment → fields modal → validated diff → re-render | YES |
| REQ-118 | request-66e4c630 | free_and_reconciled | — | Image selection through the same loop, no second mechanism | YES |
| REQ-132 | request-5946d045 | free_and_reconciled | — | Picker becomes a thumbnail grid labelled with file names | YES |
| REQ-135 | request-a8ccd0dd | free_and_reconciled | — | Text properties: size, weight, italic (colour deferred to Phase B) | YES |
| REQ-136 | request-8a132869 | free_and_reconciled | 2026-08-12 | Image framing, shape and colour adjustment; **supersedes "an image exposes exactly src + alt"** | YES — **drives V2** |
| REQ-138 | request-1ff09fab | free_and_reconciled | 2026-08-12 | Live preview: **four** parameters (size, weight, italic, capitalisation) restyle the words | YES — **drives V1** |
| BUG-34 | bug-13082cb4 | bundled | 2026-08-12 | Gradient-filled text previews as invisible | imminent |
| BUG-35 | bug-1bde3bf9 | ready_to_reconcile | 2026-08-13 | Capitalisation/letter-spacing reach the words — re-declares the UA-broken inheritance | imminent (**fix present in branch**) |
| REQ-139 | request-3f57cd0c | ready_to_reconcile | 2026-08-12 | Controls that cannot express what the element holds are shown locked with the reason | imminent — W2 |
| REQ-140 | request-3c0fec69 | ready_to_reconcile | 2026-08-15 | Text colour and panel background from the palette | imminent — W2 |

**Note on the AC layer's own provenance**: no AC under this capability carries an
`intent_uid` or `updated_by` of its own — their `fields` hold only `story_uid`,
`kind`, `regression_only` and (sometimes) `uat_coverage`. Alignment of an AC to an
intent is therefore always inferred through its story, never read off the ticket.
That is the structural reason this drift was invisible until a cycle looked for it.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-98's 14 ACs (AC-948…958, AC-1007, AC-1008, AC-1135) | REQ-116, REQ-136 (parity) | **aligned** — every bullet of the story body has a covering AC: channel/output location (AC-958), inertness (AC-948), settled state (AC-949 scroll, AC-950 carousel), derived segmentation (AC-951), addressing (AC-953, AC-954, AC-955), page stamp (AC-1007), renderer-drawn outlines + hover (AC-952), published vocabulary (AC-1008), no leakage (AC-956), element identifier preserved (AC-957), paint parity (AC-1135). No gaps, no overlaps. |
| AC-1138 (`acceptance_criterion-2d587432`) | REQ-138; BUG-35 (imminent) | **violation V1** — claims capitalisation does not reach the words; the mechanism it blames is repaired in this branch |
| AC-1028 (`acceptance_criterion-26ffac6d`) | REQ-118; superseded in part by REQ-136 | **violation V2** — states framing "is not offered"; REQ-136 offers scale, rotation, pan and corner rounding through this very dialog |
| AC-1039, AC-1042, AC-1043, AC-1044, AC-1050, AC-1123 | REQ-121, REQ-128, REQ-135, REQ-136 | **aligned, and checked specifically against REQ-136** — each survives the image field-list change on its own terms (see Notes) |
| AC-1112…AC-1116 | REQ-132 | aligned — grid presentation, labelling, byte-serving, placeholder tiles, keyboard group |
| AC-1139, AC-1140 | REQ-138 | aligned — the scale rule and the untouched-axis rule are correctly split from AC-1042's opening dressing, and each body says so explicitly |
| AC-993…AC-1006 | REQ-117 | aligned — hover, innermost resolution, seam scoping, one-form-one-change, save/refuse/dead-end paths, viewing-is-not-editing |
| STORY-101 | REQ-139, REQ-140 (imminent) | flagged — W2; correctly absent from the AC set today |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | AC-1138 (`acceptance_criterion-2d587432`) | ac-edit | The AC asserts capitalisation never reaches the words and builds that into its evidence contract. Title: *"**Size, weight and italic** restyle the words"*. Body: *"**Capitalisation is written but does not arrive, and that is a recorded divergence** … REQ-138 names four parameters and this criterion claims three."* Verification: *"choose a capitalisation, assert the property **is** set on the box, and assert the words' own capitalisation is **unchanged**."* REQ-138 (`request-1ff09fab`, free_and_reconciled) names four parameters and its field→property table lists `textTransform` → `--preview-text-transform` explicitly. The blocking mechanism is gone in this branch: `apps/control-app/src/builder/builder.css:281-284` declares `.builder-modal__box .fields-control { text-transform: inherit; letter-spacing: inherit }` under a comment naming REQ-138. The covering UAT asserts the **opposite** of the AC's Verification: `tests/reconciliation-copy-edit-live-preview.test.ts:515` reads `expect((await shown()).transform, 'and reaches the words').toBe('uppercase')`, and `:522` asserts it clears on turning it off. The AC's own escape clause — *"The day the words are drawn in something that carries that property, this assertion fails and the criterion is rewritten"* — has been triggered | Retitle to *"Size, weight, italic and capitalisation restyle the words in the editing box as each is confirmed, and nothing is written"*; delete the "recorded divergence" paragraph; rewrite the Verification's capitalisation clause to assert the property is set on the box **and** reaches the words, and clears when turned back off. Keep the two-sided measurement — it is what makes a regression in either half attributable |
| 2 | violation | consistency | AC-1028 (`acceptance_criterion-26ffac6d`) | ac-edit | The AC closes with *"Framing (crop, scale, scrim, rotation, position), upload and image processing **are not offered**"*, and describes the image dialog's field list as the picker *"together with its alt text"* and nothing more. REQ-136 (`request-8a132869`, free_and_reconciled, 2026-08-12) delivers framing through this same dialog: `copyFieldsOf` — the single derivation the gesture reads — returns for an `image` node `src`, `alt`, **then `...framing.fields`** (`packages/site-schema/src/l1/edit.ts:716-733`), where `imageFramingFields` supplies Fill mode, Pan across (%), Pan down (%), Corner rounding (px), Rotate (°) and Scale (%) (`:586-604`) plus the colour adjustments (`:551-552`). Covered by `tests/reconciliation-copy-edit-image-framing.test.ts`. Only **crop** (true source-rect zoom) and **scrim** genuinely remain out, alongside upload and image processing | Narrow the exclusion to *crop, scrim, asset upload and any image processing*; state that an image region leads with picker + alt text (order load-bearing — the dialog opens into the picker per AC-1044) and then exposes how the picture is framed, shaped and colour-adjusted in the parameter sheet beneath, routed there by descriptor per AC-1123 |
| 3 | warning | coverage | AC-1123 (`acceptance_criterion-35907074`) | ac-edit | AC-1123 carries the load-bearing kind-agnostic claim — *"The split is decided by the kind of control a field declares, **never by the region's kind** and never by the field's name"* — but its Verification exercises only *"a run of copy"* and a panel exposing no words. No AC's verification routes a **non-copy** region's parameters into the sheet, so the "never by region kind" half is asserted and never exercised. REQ-136's thirteen-control image sheet is the natural witness and became available on 2026-08-12 | Once V2 lands, extend AC-1123's Verification with an image region: assert its `src` draws as the grid, its `alt` in the box, and its framing parameters in the sheet — one region proving all three routes |
| 4 | warning | coverage | STORY-101 AC set | ac-add | REQ-139 (`request-3f57cd0c`, ready_to_reconcile) requires a control that cannot faithfully express what the element holds to be shown **locked with the reason**, never hidden; REQ-140 (`request-3c0fec69`, ready_to_reconcile) moves a run's colour and the panel background from declared non-goals into scope. No AC covers either. Both correctly absent today — imminent, not enforced, and AC-1140 and AC-1050 currently state the opposite as settled fact (*"the run's colour and family, which the sheet has no control for at all"*) | No action at this level. On REQ-139/REQ-140 reconciliation, add covering ACs and revisit AC-1140's parenthetical and AC-1050's phase-2 scoping |
| 5 | warning | consistency | UAT for AC-1138 | uat-edit | The covering test's own name carries V1's stale claim: `test_UAT_AC1138_size_weight_and_italic_restyle_the_words_as_confirmed_and_write_nothing` (`tests/reconciliation-copy-edit-live-preview.test.ts:377`), while the body it names asserts all four parameters reach the words. A reader trusting the name would conclude capitalisation is untested | Rename alongside the AC-1138 repair to include capitalisation. Strictly a uat-level item, recorded here because it must move in the same commit as V1 or the drift simply relocates |

## Notes for the Editor

- **The cascade is real and runs in both directions.** REPORT-2060 (story level,
  FAIL, 3 violations) has not been repaired — STORY-101's body was last touched
  2026-08-13, before that report was written on 2026-08-16. Its violation 1 is
  the story-body twin of V1 here, and its violations 2–3 are the twins of V2.
  Repairing either layer alone re-derives the drift: the `ac` cycle takes the
  story body as its working reference, so a repaired AC-1138 against an unrepaired
  story body will read as the AC drifting from the story. **Fix STORY-101's body
  and these two ACs in one pass.**

- **What I could not verify, stated plainly.** Test execution is denied in this
  session, so I report `tests/reconciliation-copy-edit-live-preview.test.ts:515`
  as it reads **in source**, not as an observed pass. That test's browser half is
  additionally gated on `WEBUI_INSTALLED` (`tests/support/webui-installed.ts`) and
  returns early with `unverified(...)` when the out-of-band `webui-*` install is
  absent — the story's own declared coverage caveat. Neither fact weakens V1: the
  violation is that the AC's prose and Verification contract contradict a
  `free_and_reconciled` intent and contradict the assertion its own covering test
  makes, and `builder.css:281-284` is the repair the AC named as its trigger.
  It does mean the *runtime* evidence for capitalisation may be skipping on this
  machine, which is a `uat`-level question worth confirming there.

- **Three ACs were checked specifically against REQ-136 and correctly survive it** —
  worth recording so a later reader does not "fix" them into agreement with V2:
  - **AC-1044** — *"An image region's box is a single alt-text field"* is still
    true. Framing fields are integers and enums, so they route to the sheet, not
    the box; `alt` remains the box's only occupant.
  - **AC-1123** — *"a region that exposes no text at all — a painted panel
    offering only a background image — renders no editing box"* is still true.
  - **AC-1050** — *"it is the grid, and the footer, and nothing else"* for a
    painted panel is still true, because `edit.ts:687-689` scopes framing to the
    `image` leaf **only**: a painted surface's background stays pinned to
    `cover / center / no-repeat` (BUG-13) and the rest of the surface group is
    phase 2. AC-1050 is the AC most likely to be over-corrected by someone
    applying V2 too broadly.

- **No exclusivity findings, and two near-misses deliberately not raised.**
  (a) AC-1000 (nothing changed → nothing written) and AC-1123's closing clause
  both assert the no-op rule, but over different control compositions — AC-1000
  covers the form-only and grid-only dialogs, AC-1123 the box+sheet pair whose
  unsaved-changes state spans two form instances. (b) AC-1043 and AC-1123 both
  assert footer reachability under a bounded scrolling child, applied to the
  thumbnail grid and the parameter sheet respectively. Both pairs are one
  invariant restated across genuinely distinct configurations, which is the same
  pattern the story body endorses for AC-1028/AC-1050 (*"kind-agnostic a second
  time over"*). Merging either would lose a configuration.

- **Nothing to escalate.** Every finding cites a `free_and_reconciled` intent
  whose delivered behaviour is verifiable at a named file and line in this
  branch, so no `needs_review` was raised.
