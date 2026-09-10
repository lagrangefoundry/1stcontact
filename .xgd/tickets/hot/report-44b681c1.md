---
uid: report-44b681c1
id: REPORT-3771
type: report
title: 'Capability-Intent Alignment: Structured Copy Editing: One Validated, Atomic
  Write Path (level=ac)'
created_by: xgd
created_at: '2026-09-10T17:57:44.148149+00:00'
updated_at: '2026-09-10T17:57:44.148149+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-f753cecd
  level: ac
  violations: 1
  warnings: 2
  needs_review_count: 0
---

# Capability-Intent Alignment: Structured Copy Editing: One Validated, Atomic Write Path
# Level: ac

**Result**: FAIL
**Violations**: 1
**Warnings**: 2
**Needs review**: 0

The capability holds one story (STORY-100, `story_kind: upgrade`) carrying 43
active ACs. Per the level cascade STORY-100's body is the working reference: its
body was last written 2026-09-10 17:33 by the attempt-4 repair and its
story-level check passed at 17:19 (REPORT-3765). Intent history was consulted
only where an AC and the body disagree — which happened once, and there the
intent settled it against the AC.

**Attempt 5's three repairs are confirmed applied.** AC-1111's verification now
names the panel's background-image field and the fill beside it (and the run's
"none of its fields"); AC-991's verification says "all five shapes"; AC-982 now
opens "Submitting a change map … **from the command line**". Both of REPORT-3769's
violations and its one warning are closed. All 43 AC bodies were read in full
again this cycle.

**What this cycle found is the same lag pattern, one layer deeper.** Attempt 5
executed the count-grep successor rule and reported "no third instance", which
was true of *counts*. The two survivors are not counts:

- **AC-1026 is AC-982's twin.** Attempt 5 fixed AC-982 because it asserted an
  on-disk re-render without naming which of the two producers it was about, and
  its fix report claimed this "removes the last AC that asserts a re-render
  without naming whose". AC-1026 carries the identical clause — "the rendered
  output **on disk**" plus "**where** the re-rendered output was written" — and
  was itself edited at 17:29 the same cycle. A grep for `written|on disk` finds
  exactly these two ACs; only one was repaired.
- **AC-1130 collapses a unit distinction REQ-136 makes explicitly.** It calls all
  six colour-adjustment controls "bounded **percentage** controls" and its
  verification asks that each be "converted from the percentages that were
  submitted". REQ-136 (free_and_reconciled) lists them as "Brightness / Contrast
  / Saturation / Black & white **(%)** · Hue shift **(°)** · Blur **(px)**", and
  the code agrees: `FILTER_CONTROLS` gives `hueRotateDeg` and `blurPx`
  `scale: 1` — no conversion, and a field name identical to the axis name
  (`packages/site-schema/src/l1/edit.ts:794-801`).

Neither is a code issue. In both cases the implementation and the shipped UAT are
right and the AC prose is the only layer still wrong.

## Cumulative Intent Considered

STORY-100 carries `intent_uid: bundle-15c1f647` (BUNDLE-16, `free_and_reconciled`,
merged at `1741ee5d`) and `updated_by: bundle-77b28def` (BUNDLE-19,
`free_and_reconciled`, merged at `b18b859d`); both statuses were re-read directly
this cycle. The ACs carry no `intent_uid` of their own, so the per-intent
attribution below is carried forward from REPORT-3763 / REPORT-3766 / REPORT-3769,
whose ledger was rebuilt from `xgd ticket history story-37a3921b`, each bundle's
member list and the commit history of `packages/site-schema/src/l1/edit.ts`. The
four intents this cycle's findings turn on were re-read directly and their
statuses re-confirmed (REQ-118, REQ-119, REQ-136, REQ-139 — all
`free_and_reconciled`, as is REQ-140).

| Intent ID | Status | When | Asked / changed *on this surface* | Counts? |
|---|---|---|---|---|
| REQ-117 | free_and_reconciled | 2026-07-31 | Created the surface: strict address + one resolution rule, one-map-one-diff, the shared whole-definition validator, empty field list, module-slot scoping, no raw code, no undo | YES |
| REQ-118 | free_and_reconciled | 2026-07-31 | Image selection as the same surface: `src` → `alt`, closed list, current handle always an option, membership refused at the field, nothing baked. **AC-1026 is this intent's AC** | YES (warning 1) |
| REQ-119 | free_and_reconciled | 2026-07-31 | Request-time draft/edit renders — moved the two origin-facing criteria off stored artifacts onto the origin, which is what makes an unqualified "on disk" claim ambiguous | YES (warning 1) |
| REQ-128 | free_and_reconciled | 2026-08-08 | A panel's background through the same picker: selection only, no empty option, change-never-add | YES |
| REQ-132 | free_and_reconciled | 2026-08-12 | `format: 'image'` on both picker fields — a hint, never a constraint | YES (repaired last cycle) |
| REQ-135 | free_and_reconciled | 2026-08-12 | Phase A typography: size, weight from declared faces ∪ current, italic lock, capitalisation, "a bound binds a change, never the status quo"; the run→panel escalation | YES |
| REQ-136 | free_and_reconciled | 2026-08-12 | Thirteen framing/shape/adjustment controls, identity removes the axis, no empty bags, shape list ∪ current, nothing touches a file. **Its control table separates (%) from (°) and (px)** | YES (violation 1) |
| REQ-137 | free_and_reconciled | 2026-08-12 | L1 palette: entry = one colour, continuous `shade` on the reference | YES |
| REQ-139 | free_and_reconciled | 2026-08-12 | `{locked, reason}` pairing, `GLYPH_GRADIENT_LOCK`, `lockError`, CLI prints the reason, a lock refuses a change, a sibling is not occlusion. **AC-1275 is this intent's AC** | YES (warning 2) |
| REQ-140 | free_and_reconciled | 2026-08-15 | Colour on this surface: a `'color'` descriptor on a run and on a panel's fill, palette riding the read call, membership + bounds refused at the field, hex refused, the read-only "panel behind this text" row | YES |
| REQ-133 | free_and_reconciled | 2026-08-12 | Palette popup (CAP-98) — supplies the colour choices, builds no control here | YES (adjacent) |
| REQ-131 / REQ-142 | free_and_reconciled | 2026-08-18 | Draft change journal (CAP-99); async `SiteStore` port, explicitly no behaviour change (CAP-101) | YES (adjacent) |
| REQ-115 / REQ-121 / REQ-122 / REQ-123 / REQ-126 / REQ-127 / REQ-129 / REQ-130 / REQ-138 / REQ-141 / REQ-144 / REQ-44 / BUG-35 | free_and_reconciled | 2026-07→08 | Neighbour capabilities or client-only changes; no ask on this surface | YES (silent) |
| REQ-134 | abandoned | 2026-08-12 | An image-generation component | NO |

No intent in the ledger retires behaviour an active AC still describes, and every
reconciled intent's ask on this surface is expressed somewhere in the AC tree
(coverage map below). All three findings are *statement* defects inside an AC, not
a missing or a surplus criterion.

## Alignment Ledger

All 43 AC bodies read in full this cycle. Coverage was checked bullet-by-bullet
against STORY-100's twelve **In scope** headings; every one has at least one AC
and no AC describes anything under **Out of scope** (swept for family, geometry,
alignment, per-run restyling, upload, undo, zoom, tint, drag, sepia/invert — the
only hits are the three ACs naming them as parameters that must survive an edit).

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-980 words lead the answer | REQ-117 | aligned — sole owner of the multi-line rule |
| AC-981 empty field list succeeds | REQ-117, REQ-128, REQ-140 | aligned — the "no editable copy" human statement it claims is real (`copy get` human output, asserted in both shipped UATs) |
| AC-982 CLI save → both channels | REQ-117, REQ-119 | aligned — producer clause landed this cycle |
| AC-983 one map, one diff | REQ-117 | aligned |
| AC-984 rejected edit changes no byte | REQ-117 | aligned |
| AC-985 structured refusal + exit status | REQ-117, REQ-126 | aligned |
| AC-986 one shared whole-definition validator | REQ-117, REQ-118 | aligned |
| AC-987 malformed address refused outright | REQ-117 | aligned |
| AC-988 the five refusal classes | REQ-117, REQ-118, REQ-135, REQ-139, REQ-140 | aligned |
| AC-989 module-slot scoping | REQ-117 | aligned |
| AC-990 overflowing copy reads back whole | REQ-117 | aligned |
| AC-991 five field shapes, no raw code | REQ-117, REQ-135, REQ-136, REQ-140 | aligned — repaired this cycle |
| AC-992 origin parity | REQ-117, REQ-118, REQ-119 | aligned — sole owner of origin parity |
| AC-1024 image region field order + framing | REQ-118, REQ-136 | aligned — order `src` → `alt` → framing confirmed at `edit.ts:987-1004` |
| AC-1025 current handle always an option | REQ-118 | aligned (`imageChoices`, `edit.ts:387-391`) |
| AC-1026 choosing an image, one diff | REQ-118, **REQ-119** | **gap: warning 1** — asserts an on-disk re-render and a reported path without naming the command line as the producer; AC-982's twin |
| AC-1027 nothing is baked | REQ-118, REQ-136 | aligned |
| AC-1045 panel read shape | REQ-128, REQ-132, REQ-140 | aligned |
| AC-1046 choosing a background | REQ-128 | aligned — says "the re-rendered page", not an on-disk artifact, so warning 1 does not reach it |
| AC-1047 panel's current handle always an option | REQ-128 | aligned |
| AC-1048 background membership refused at the field | REQ-128 | aligned |
| AC-1049 no background picker where none is painted | REQ-128, REQ-140 | aligned — "exactly one field" verified against `copyFieldsOf` (`edit.ts:1022-1046`): `backgroundImageUrl` only when `background !== undefined`, and `colorField` contributes exactly one |
| AC-1111 `format: 'image'` is a hint | REQ-132, REQ-140 | aligned — repaired this cycle |
| AC-1117 typography read shape | REQ-135, REQ-140 | aligned — order words → colour → size/weight/italic/capitalisation confirmed at `edit.ts:963-985` and `typographyFields` `:544-590` |
| AC-1118 resize scales every keyframe | REQ-135 | aligned |
| AC-1119 weights ∪ the run's own | REQ-135 | aligned (`weightChoices`, `edit.ts:498-503`; family matched by `facesFor`) |
| AC-1120 italic unavailable + reason | REQ-135, REQ-139 | aligned — `NO_ITALIC_FACE_LOCK` names the font, not the build (`edit.ts:442-446`); lock condition is `faces.length > 0 && !some(italic)` (`:571`) |
| AC-1121 a bound binds a change | REQ-135, REQ-136 | aligned |
| AC-1122 write-into, absent-is-default, no empty bag | REQ-135, REQ-136, REQ-140 | aligned |
| AC-1129 pan writes a typed pair | REQ-136 | aligned |
| AC-1130 adjustment as a projection | **REQ-136** | **gap: violation 1** — calls all six controls percentages and asks for a conversion on each; REQ-136 and the code make hue shift degrees and blur pixels, unconverted |
| AC-1131 shapes ∪ the one it carries | REQ-136 | aligned (`shapeChoices`, `edit.ts:761-765`) |
| AC-1132 no framing = browser-painted values | REQ-136 | aligned |
| AC-1269 a run's colour | REQ-137, REQ-140 | aligned |
| AC-1270 every painted panel's fill | REQ-140 | aligned — "the first three" is correct for its own seeded page |
| AC-1271 colour refused at the field | REQ-140 | aligned — "four things" matches its four bullets; `PALETTE_REF_KEYS` (`edit.ts:701`) is the unrecognised-part check |
| AC-1272 an unchanged colour is not a change | REQ-140 | aligned |
| AC-1273 unavailable ⇔ a reason, swept | REQ-139 | aligned |
| AC-1274 gradient-painted glyphs: inert + lossy | REQ-139 | aligned — `GLYPH_GRADIENT_LOCK` names the gradient and the route (`edit.ts:429-433`) |
| AC-1275 a sibling is not occlusion | **REQ-139** | **gap: warning 2** — opens "A **region** is marked unavailable on the test…"; unavailability is a property of a field, as the rest of the AC, its own title and AC-1273 all have it |
| AC-1276 a change to an unavailable colour | REQ-139, REQ-140 | aligned |
| AC-1277 the CLI listing marks it | REQ-139 | aligned |
| AC-1278 the panel behind this text | REQ-140 | aligned |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | AC-1130 (`acceptance_criterion-0e2f38fa`) | ac-edit | The criterion opens "A picture's colour is adjusted through **bounded percentage controls** — how bright, how contrasty, how saturated, how black-and-white, how far its hue is shifted and how far it is blurred", and continues "The control and the stored parameter therefore carry **different names and different numbers** on purpose". Two of the six named controls are neither. `FILTER_CONTROLS` gives `hueRotateDeg` `{ identity: 0, scale: 1, max: 360 }` and `blurPx` `{ identity: 0, scale: 1, max: BLUR_MAX_PX }` against the four scaling controls' `scale: 100` (`packages/site-schema/src/l1/edit.ts:794-801`) — so for hue and blur the number is not converted and the field name is *identical* to the axis name. REQ-136 (free_and_reconciled, 2026-08-12), which is this AC's own intent, states the distinction explicitly in its control list: "Brightness / Contrast / Saturation / Black & white **(%)** · Hue shift **(°)** · Blur **(px)**", and STORY-100's own sentence is unit-neutral ("Each of those is a bounded whole number or the closed set of words the parameter itself admits"). The verification carries the error into an instruction: "assert the stored region carries **each** adjustment in the browser's own form, **converted from the percentages that were submitted**" — which no implementation can satisfy for hue or blur. The shipped UAT already works around it, scoping the percentage assertion to `['brightnessPct','contrastPct','saturatePct','grayscalePct']` and naming `hueRotateDeg`/`blurPx` only as controls "offered and never submitted" (`tests/reconciliation-copy-edit-image-framing.test.ts:344-397`). AC-1130 was last body-edited 2026-08-16 and predates the count-grep sweep, which looked for numbers rather than units | In the criterion, replace "bounded percentage controls" with the unit-accurate list — bounded whole numbers, percentages for brightness, contrast, saturation and black-and-white, degrees for the hue shift, pixels for the blur — and scope the projection sentence to the four scaling adjustments, noting that hue shift and blur *are* the axis (same name, same number), which is the same "the control is a projection only where it is one" rule AC-1117 states for `italic` over `fontStyle`. In the verification, change "each adjustment … converted from the percentages that were submitted" to "each scaling adjustment … converted from the percentage submitted, and the hue shift and blur stored unconverted". The title's "bounded percentage controls" needs the same softening. The identity/removal half, the one-change half and the rendered-page assertion are all correct and must not move |
| 2 | warning | consistency | AC-1026 (`acceptance_criterion-d4bc1184`) | ac-edit | The criterion reads "Submitting a new choice of image for a region … re-renders the page as part of the same operation, so the rendered output **on disk** references the newly chosen image", and "The result reports which fields changed and **where** the re-rendered output was written" — with no clause naming which of the surface's two producers it is about. This is the defect attempt 5 repaired in AC-982 (REPORT-3769 finding 4), and its fix report asserted the repair "removes the last AC that asserts a re-render without naming whose"; AC-1026 is the counterexample. REQ-119 (free_and_reconciled) is why it matters: the origin produces both renderings at request time and its save has no rendering step at all (AC-992: "A successful save writes the draft and replies; there is **no rendering step in between**"). An on-disk artifact with a reported path is a command-line-only observable. Graded a warning on the identical reasoning REPORT-3769 applied to AC-982 — "on disk" and "where … was written" are unambiguously CLI artifacts, so the two ACs do not actually collide. AC-1026 was itself edited 2026-09-10 17:29 to drop its origin sentence and its one-diff restatement; the surgical edit stopped at the sentence it came for, exactly the pattern REPORT-3769's notes described | Open the criterion with the producer, matching AC-982's repaired wording: "Submitting a new choice of image for a region **from the command line** updates the draft definition and re-renders the page…". One clause. The one-diff claim, the no-change claim and the verification are correct and need no change. AC-1046 does **not** need this edit — it says "the re-rendered page", not an on-disk artifact |
| 3 | warning | consistency | AC-1275 (`acceptance_criterion-073d2b90`) | ac-edit | The criterion's first sentence reads "**A region** is marked unavailable on the test 'is the write observable and complete?'". Unavailability is a property of a *field*, never of a region: it is carried on the descriptor as the `{locked, reason}` pair (`packages/site-schema/src/l1/edit.ts:404-408`, spread into a single `L1FieldDescriptor`), AC-1273 states the rule as "wherever this surface marks a **field** unavailable", STORY-100 states it as "a **control** is offered only when it is faithful", and this AC's own title and body do too ("keeps **both controls** live", "with no reason attached to either"). No region-level unavailability exists anywhere in the derivation, so the sentence names a mechanism the surface does not have. Cosmetic in effect — the rest of the AC is exact and its UAT is unaffected — but it is the sentence that states the faithfulness test, which is the one place the wrong noun is most likely to be copied forward | Change "A region is marked unavailable" to "A **field** is marked unavailable". Nothing else in the AC moves |

## Notes for the Editor

**Finding 1 is the only one that blocks.** Findings 2 and 3 are one-clause and
one-word edits respectively, independent of each other and of finding 1, and none
touches a UAT: for finding 1 the shipped test already asserts the corrected claim,
and findings 2 and 3 change no assertion at all. No code changes.

**The successor rule needs widening, and this is the evidence.** Attempt 5 ran
"whenever a repair changes a count, an ordering or an exhaustive list, grep the
whole tree for the same number" and correctly found no third *count*. Both
survivors this cycle are the same lag arriving through a different door:

- Finding 2 is a **twin by clause, not by number**. AC-982 and AC-1026 are the
  only two ACs in the tree containing `on disk` or `was written`; one grep on the
  repaired *phrase* rather than on a number would have caught it at the moment
  AC-982 was fixed. The general form: **when a repair adds a qualifier to one AC,
  grep for the unqualified claim, not for the qualifier.**
- Finding 1 is a **unit**, which no numeric or phrase grep reaches. It was found
  by reading the AC against its intent's own control table. The general form:
  **an AC that enumerates controls should be checked against the intent's
  enumeration, not only against the story body** — the story body deliberately
  abstracts over units ("a bounded whole number or the closed set of words"), so
  it cannot catch this class on its own. This is the one place this cycle where
  the level cascade's "consult intent only when the story is ambiguous" had to be
  overridden, and it paid.

**Carried forward, still info, still needing no AC.** STORY-100's caveat that a
framing control's whole-number resolution means an AI-set fractional value is
reported at the nearer whole number and rewritten on re-save — the single stated
exception to "a save that changes nothing changes nothing" — has no AC and needs
none (REPORT-3766 finding 13, REPORT-3769 finding 6). AC-1132 and AC-1122
exercise the no-op re-save against values the region itself reported, which are
already whole. Note it is adjacent to finding 1: both concern the gap between the
control's vocabulary and the axis's, so a repair to AC-1130 must not accidentally
absorb this caveat.

**Exclusivity re-checked, nothing new.** The three families REPORT-3769 finding 7
re-affirmed — the four "current value is always among its own options" ACs, AC-988's
enumeration against its per-field specialisations, and the change-refused/status-quo-passes
rule owned by AC-988 and specialised by AC-1120 and AC-1276 — remain specialisation
rather than duplication. The AC-1045/AC-1049 boundary (REPORT-3769 finding 5) is
unchanged and still inherent to a conditional criterion. AC-1024's cross-reference
to the multi-line rule ("under the same rule copy does") is a pointer to AC-980's
claim rather than a second statement of it, and stays.

**Still outside this level, for whoever runs `uat` next.** Two items:
`test_UAT_AC991_every_field_is_one_of_four_closed_shapes_and_markup_stays_literal`
(`tests/reconciliation-copy-edit-typography.test.ts:757`) still carries the
pre-colour count in its *name* and opening comment while its assertions test all
five — flagged and deliberately deferred by attempt 5. And AC-981 has two UATs
(`reconciliation-copy-edit-image-selection.test.ts:370` and
`reconciliation-copy-edit-write-path.test.ts:253`) which overlap substantially in
shape; both are valid, but the pair is worth a uat-level exclusivity look.
