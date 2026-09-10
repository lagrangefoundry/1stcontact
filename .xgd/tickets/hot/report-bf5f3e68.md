---
uid: report-bf5f3e68
id: REPORT-3773
type: report
title: 'Capability-Intent Alignment: Structured Copy Editing: One Validated, Atomic
  Write Path (level=ac)'
created_by: xgd
created_at: '2026-09-10T18:11:52.562493+00:00'
updated_at: '2026-09-10T18:11:52.562493+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-f753cecd
  level: ac
  violations: 1
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Structured Copy Editing: One Validated, Atomic Write Path
# Level: ac

**Result**: FAIL
**Violations**: 1
**Warnings**: 1
**Needs review**: 0

The capability holds one story (STORY-100, `story_kind: upgrade`, `intent_uid:
bundle-15c1f647`, `updated_by: bundle-77b28def`) carrying 43 active ACs, all
`kind: behavior`. Per the level cascade STORY-100's body is the working
reference; it was last body-edited 2026-09-10 17:33 and its story-level check
passed at 17:19 (REPORT-3765). Intent was consulted where an AC's own vocabulary
had to be checked against the enumeration it came from — which is where this
cycle's violation is.

**Attempt 6's three repairs are confirmed applied**, verified against the live
ticket bodies rather than the fix report:

- AC-1130 (`updated_at` 17:59:39) now opens "bounded **whole-number** controls …
  each in **percent** … in **degrees** … in **pixels**", and its verification
  splits the conversion claim.
- AC-1026 (17:59:44) now opens "Submitting a new choice of image for a region
  **from the command line** …", matching AC-982.
- AC-1275 (17:59:50) now opens "A **field** is marked unavailable on the test …".

REPORT-3771's violation 1 and both of its warnings are closed. All 43 AC bodies
were read in full this cycle, and coverage was re-walked bullet-by-bullet against
STORY-100's twelve **In scope** headings.

**What this cycle found is a defect the attempt-6 repair itself introduced.**
AC-1130's unit repair pinned the phrase "the four **scaling** adjustments" to
brightness / contrast / saturation / black-and-white. That phrase was already
load-bearing elsewhere in the same AC — in the untouched identity paragraph,
which says the identity is "unchanged for the scaling adjustments, none-at-all
for the rest". Before the repair "scaling adjustments" was undefined inside the
AC and read naturally as the identity-1 set; after it, the AC asserts that
black-and-white's identity is *unchanged* (100%). It is 0. REQ-136 — this AC's
own intent — uses "scaling filter" for exactly the opposite partition: "1 the
identity of every **scaling filter**, 0 of the rest", and states outright that
"`grayscale(0)` and `saturate(1)` are both no-ops; `grayscale(1)` and
`saturate(0)` are both extremes."

Not a code issue. The implementation and the shipped UAT are both right; the AC
prose is the only layer wrong, and the *newly added* half of it is what makes the
*old* half false.

## Cumulative Intent Considered

STORY-100 carries `intent_uid: bundle-15c1f647` (BUNDLE-16, `free_and_reconciled`,
`merged_at_commit: 1741ee5d`) and `updated_by: bundle-77b28def` (BUNDLE-19,
`free_and_reconciled`, `merged_at_commit: b18b859d`); both statuses were re-read
directly this cycle from the live tickets. The ACs carry no `intent_uid` of their
own, so per-intent attribution below is carried forward from REPORT-3763 /
REPORT-3766 / REPORT-3769 / REPORT-3771, whose ledger was rebuilt from
`xgd ticket history story-37a3921b`, each bundle's member list and the commit
history of `packages/site-schema/src/l1/edit.ts`. REQ-136 was re-read in full
this cycle (body, control table and design rules) because the finding turns on
its vocabulary.

| Intent ID | Status | When | Asked / changed *on this surface* | Counts? |
|---|---|---|---|---|
| REQ-117 | free_and_reconciled | 2026-07-31 | Created the surface: strict address + one resolution rule, one-map-one-diff, the shared whole-definition validator, empty field list, module-slot scoping, no raw code, no undo | YES |
| REQ-118 | free_and_reconciled | 2026-07-31 | Image selection as the same surface: `src` → `alt`, closed list, current handle always an option, membership refused at the field, nothing baked | YES |
| REQ-119 | free_and_reconciled | 2026-07-31 | Request-time draft/edit renders — moved the two origin-facing criteria off stored artifacts onto the origin | YES |
| REQ-128 | free_and_reconciled | 2026-08-08 | A panel's background through the same picker: selection only, no empty option, change-never-add | YES |
| REQ-132 | free_and_reconciled | 2026-08-12 | `format: 'image'` on both picker fields — a hint, never a constraint | YES |
| REQ-135 | free_and_reconciled | 2026-08-12 | Phase A typography: size, weight from declared faces ∪ current, italic lock, capitalisation, "a bound binds a change, never the status quo"; the run→panel escalation | YES (warning 1) |
| REQ-136 | free_and_reconciled | 2026-08-12 | Thirteen framing/shape/adjustment controls; **its control table separates (%) from (°) and (px)**, and its design rules define "scaling filter" as the identity-1 set, `grayscale` among "the rest" | YES (violation 1) |
| REQ-137 | free_and_reconciled | 2026-08-12 | L1 palette: entry = one colour, continuous `shade` on the reference | YES |
| REQ-139 | free_and_reconciled | 2026-08-12 | `{locked, reason}` pairing, `GLYPH_GRADIENT_LOCK`, `lockError`, CLI prints the reason, a lock refuses a change, a sibling is not occlusion | YES |
| REQ-140 | free_and_reconciled | 2026-08-15 | Colour on this surface: a `'color'` descriptor on a run and on a panel's fill, palette riding the read call, membership + bounds refused at the field, hex refused, the read-only "panel behind this text" row | YES |
| REQ-133 | free_and_reconciled | 2026-08-12 | Palette popup (CAP-98) — supplies the colour choices, builds no control here | YES (adjacent) |
| REQ-131 / REQ-142 | free_and_reconciled | 2026-08-18 | Draft change journal (CAP-99); async `SiteStore` port, explicitly no behaviour change (CAP-101) | YES (adjacent) |
| REQ-115 / REQ-121 / REQ-122 / REQ-123 / REQ-126 / REQ-127 / REQ-129 / REQ-130 / REQ-138 / REQ-141 / REQ-144 / REQ-44 / BUG-35 | free_and_reconciled | 2026-07→08 | Neighbour capabilities or client-only changes; no ask on this surface | YES (silent) |
| REQ-134 | abandoned | 2026-08-12 | An image-generation component | NO |

No intent in the ledger retires behaviour an active AC still describes, and every
reconciled intent's ask on this surface is expressed somewhere in the AC tree
(coverage map below). Both findings are *statement* defects inside an AC, not a
missing or a surplus criterion.

## Alignment Ledger

All 43 AC bodies read in full this cycle. Coverage was checked bullet-by-bullet
against STORY-100's twelve **In scope** headings; every one has at least one AC.
An out-of-scope sweep (`sepia|invert|tint|zoom|crop|drag|upload|undo|alignment|
letter spacing|line height|font family|geometry`) returned four hits across all
43 ACs, every one of them naming an out-of-scope parameter as something that must
*survive* an edit or be *absent* from the answer (AC-1027, AC-1117, AC-1122,
AC-1275) — no AC claims out-of-scope behaviour.

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-980 words lead the answer | REQ-117 | aligned — sole owner of the multi-line rule |
| AC-981 empty field list succeeds | REQ-117, REQ-128, REQ-140 | aligned |
| AC-982 CLI save → both channels | REQ-117, REQ-119 | aligned — producer clause landed attempt 5 |
| AC-983 one map, one diff | REQ-117 | aligned |
| AC-984 rejected edit changes no byte | REQ-117 | aligned |
| AC-985 structured refusal + exit status | REQ-117, REQ-126 | aligned |
| AC-986 one shared whole-definition validator | REQ-117, REQ-118 | aligned |
| AC-987 malformed address refused outright | REQ-117 | aligned |
| AC-988 the five refusal classes | REQ-117, REQ-118, REQ-135, REQ-139, REQ-140 | aligned |
| AC-989 module-slot scoping | REQ-117 | aligned |
| AC-990 overflowing copy reads back whole | REQ-117 | aligned — matches the bullet the attempt-4 story edit added at 17:33 |
| AC-991 five field shapes, no raw code | REQ-117, REQ-135, REQ-136, REQ-140 | aligned |
| AC-992 origin parity | REQ-117, REQ-118, REQ-119 | aligned |
| AC-1024 image region field order + framing | REQ-118, REQ-136 | aligned — order `src` → `alt` → framing re-confirmed at `edit.ts:991-1003`; its framing sentence is unit-neutral ("a bounded whole number … or a closed pick") and is the corroborating sibling for finding 1 |
| AC-1025 current handle always an option | REQ-118 | aligned |
| AC-1026 choosing an image, one diff | REQ-118, REQ-119 | aligned — repaired this cycle |
| AC-1027 nothing is baked | REQ-118, REQ-136 | aligned |
| AC-1045 panel read shape | REQ-128, REQ-132, REQ-140 | aligned — order-neutral, and the code returns background-then-fill (`edit.ts:1023-1050`), so no ordering claim is contradicted |
| AC-1046 choosing a background | REQ-128 | aligned |
| AC-1047 panel's current handle always an option | REQ-128 | aligned |
| AC-1048 background membership refused at the field | REQ-128 | aligned |
| AC-1049 no background picker where none is painted | REQ-128, REQ-140 | aligned — "exactly one field" matches `copyFieldsOf` |
| AC-1111 `format: 'image'` is a hint | REQ-132, REQ-140 | aligned |
| AC-1117 typography read shape | REQ-135, REQ-140 | **gap: warning 1** — "the values reported are the run's own as they stand in the draft" is false for a run declaring no weight, where the derivation seeds `weights[0]`; order words → colour → size/weight/italic/capitalisation itself re-confirmed at `edit.ts:978-984` and `typographyFields` `:543-591` |
| AC-1118 resize scales every keyframe | REQ-135 | aligned |
| AC-1119 weights ∪ the run's own | REQ-135 | aligned (`weightChoices`, `edit.ts:498-503`) |
| AC-1120 italic unavailable + reason | REQ-135, REQ-139 | aligned (`lockedItalic`, `edit.ts:573`) |
| AC-1121 a bound binds a change | REQ-135, REQ-136 | aligned |
| AC-1122 write-into, absent-is-default, no empty bag | REQ-135, REQ-136, REQ-140 | aligned |
| AC-1129 pan writes a typed pair | REQ-136 | aligned — "only one of the two components may be named" reads as permission, and the following clause ("the other keeps the value the region reported") settles it; both components are independent fields (`edit.ts:834-835`) and either or both may be named |
| AC-1130 adjustment as a projection | **REQ-136** | **gap: violation 1** — the repaired unit paragraph defines "the four scaling adjustments" to include black-and-white; the untouched identity paragraph then asserts that control's identity is "unchanged" |
| AC-1131 shapes ∪ the one it carries | REQ-136 | aligned |
| AC-1132 no framing = browser-painted values | REQ-136 | aligned |
| AC-1269 a run's colour | REQ-137, REQ-140 | aligned |
| AC-1270 every painted panel's fill | REQ-140 | aligned |
| AC-1271 colour refused at the field | REQ-140 | aligned |
| AC-1272 an unchanged colour is not a change | REQ-140 | aligned |
| AC-1273 unavailable ⇔ a reason, swept | REQ-139 | aligned |
| AC-1274 gradient-painted glyphs: inert + lossy | REQ-139 | aligned |
| AC-1275 a sibling is not occlusion | REQ-139 | aligned — repaired this cycle |
| AC-1276 a change to an unavailable colour | REQ-139, REQ-140 | aligned |
| AC-1277 the CLI listing marks it | REQ-139 | aligned |
| AC-1278 the panel behind this text | REQ-140 | aligned |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | AC-1130 (`acceptance_criterion-0e2f38fa`) | ac-edit | The criterion now contains two paragraphs that use the phrase "scaling adjustments" for **different sets**, and the second one is consequently false. Paragraph 2 (rewritten by attempt 6 at 17:59:39) says the projection rule "is true of the four **scaling** adjustments" — the four named in paragraph 1 as carrying percent, i.e. brightness, contrast, saturation **and black-and-white**. Paragraph 3 (untouched since 2026-08-16) says "The identity is not the same number for every control — **unchanged for the scaling adjustments, none-at-all for the rest**". Read together the AC asserts that black-and-white's identity is *unchanged*, i.e. 100%. It is 0: `FILTER_CONTROLS` gives `grayscalePct` `{ identity: 0, scale: 100, max: 100 }` beside `brightnessPct` / `contrastPct` / `saturatePct` at `identity: 100` (`packages/site-schema/src/l1/edit.ts:795-798`). REQ-136 (free_and_reconciled, 2026-08-12), this AC's own intent, uses the phrase for the **opposite** partition — "1 the identity of every **scaling filter**, 0 of the rest" — and states the trap explicitly: "**The identity differs per function.** `grayscale(0)` and `saturate(1)` are both no-ops; `grayscale(1)` and `saturate(0)` are both extremes." The shipped UAT already does it correctly, clearing saturation and brightness with `100` and black-and-white with `0` (`tests/reconciliation-copy-edit-image-framing.test.ts:383-398`), so an editor writing to the AC as it now stands would be writing against both the code and the test. Before attempt 6, "scaling adjustments" was undefined inside the AC and read as the identity-1 set, so paragraph 3 was true; pinning the phrase in paragraph 2 without re-reading paragraph 3 is what broke it | Stop using the word "scaling" for the percentage set — REQ-136 has already spent it on the identity-1 set. In paragraph 2, replace "the four **scaling** adjustments" with "the four **percentage** adjustments — brightness, contrast, saturation and black-and-white" (the unit partition, 4 vs 2). In paragraph 3, replace "unchanged for the scaling adjustments, none-at-all for the rest" with the identity partition named explicitly and separately: "unchanged (100%) for brightness, contrast and saturation, none-at-all (0) for black-and-white, the hue shift and the blur" (3 vs 3). A sentence noting that the two partitions deliberately do not coincide would prevent the next recurrence. The unit paragraph's percent/degrees/pixels list, the projection/italic clause, the one-change clause and the whole verification are correct and must not move |
| 2 | warning | consistency | AC-1117 (`acceptance_criterion-0c85504b`) | ac-edit | The criterion states without qualification: "The values reported are the run's own as they stand in the draft, and for size that is the run's **representative (widest)** value". That is false for the weight of a run that declares none. `typographyFields` reports `String(axes.fontWeight ?? weights[0])` (`packages/site-schema/src/l1/edit.ts:564`), and the write path's own comment names it: "AN ABSENT AXIS IS NOT 400. A run declaring no weight INHERITS one, but the select has to show something, so the derivation seeds the lowest declared face — **a fabrication, not a reading of the node**" (`:1304-1310`). The same AC justifies withholding the size control on precisely that ground — "a run that inherits its size has no honest number to show … a fabricated number is worse than an absent control" — so it states a principle two bullets above a claim the neighbouring control does not keep. Graded a warning rather than a violation because STORY-100 is silent on the absent-weight read (it says only that a size, a weight and a colour "have no setting that means nothing declared"), so at this level the AC does follow its story body; the deeper omission is story-level. Every seeded run in `tests/reconciliation-copy-edit-typography.test.ts` declares a `fontWeight`, so no UAT is affected either way | Qualify the reported-values sentence: "The values reported are the run's own as they stand in the draft — for size the representative (widest) value, and for weight the run's own where it declares one, seeded from the lowest declared face where it does not, which is why echoing that seed is not a change." One clause; nothing else in the AC moves. If the editor prefers, the seed and its stated cost can instead be raised to STORY-100 at the next story-level pass and the AC left pointing at it |

## Notes for the Editor

**One violation, one warning, and they are independent.** Neither touches a UAT
and neither is a code change: for finding 1 the shipped test already asserts the
corrected partition, and finding 2's case has no test at all.

**The successor rule that would have caught finding 1.** Attempts 5 and 6 ran
"grep the tree for the same number / the unqualified claim" across all 43 ACs and
both sweeps were sound. Finding 1 escaped both because it is *intra-AC*: the
repair introduced a defined term into one paragraph of an AC whose other
paragraphs already used that term undefined. The general form worth adding:
**when a repair pins down a phrase, re-read every other occurrence of that phrase
inside the same AC before writing — and check the phrase against the intent's own
usage, because REQ-136 had already bound "scaling" to the other partition.** This
is the third consecutive cycle whose finding came from reading an AC against its
intent's enumeration rather than against the story body, which deliberately
abstracts over units and identities.

**Carried forward, still info, still needing no AC.** STORY-100's caveat that a
framing control's whole-number resolution means an AI-set fractional value is
reported at the nearer whole number and rewritten on re-save — the single stated
exception to "a save that changes nothing changes nothing" — has no AC and needs
none (REPORT-3766 finding 13, REPORT-3769 finding 6, REPORT-3771). It is adjacent
to finding 1 in the same way it was adjacent last cycle: a repair to AC-1130 must
state units and identities only, and must not absorb the re-save caveat.

**Exclusivity re-checked, nothing new.** The families re-affirmed by REPORT-3769
finding 7 and REPORT-3771 — the four "current value is always among its own
options" ACs (AC-1025, AC-1047, AC-1119, AC-1131), AC-988's enumeration against
its per-field specialisations (AC-1120, AC-1121, AC-1271, AC-1276), and the three
"save it and the re-render shows it" ACs (AC-982 words, AC-1026 image, AC-1046
background) — remain specialisation rather than duplication; STORY-100 states
each of the paired rules in both places on purpose. The AC-1045 / AC-1049 /
AC-1270 boundary over a painted panel's fill is explicitly delegated in AC-1045's
own text ("Which panels are offered a fill at all, and what may be written into
it, are a separate criterion's business") and stays.

**Still outside this level, for whoever runs `uat` next.** Three items, all
carried forward from attempt 6's deferral list and re-confirmed here:
`test_UAT_AC991_every_field_is_one_of_four_closed_shapes_and_markup_stays_literal`
(`tests/reconciliation-copy-edit-typography.test.ts:757`) carries the pre-colour
count in its *name* while its assertions test all five; AC-981 has two UATs
(`reconciliation-copy-edit-image-selection.test.ts:370`,
`reconciliation-copy-edit-write-path.test.ts:253`) that overlap in shape; and
`test_UAT_AC1130_...` (`tests/reconciliation-copy-edit-image-framing.test.ts:344`)
carries the same "unchanged (100%) for the scaling adjustments" comment as
finding 1 at line 383 and a name saying "in percentages" — its assertions are
correct, so the uat pass should close the prose, not the logic, and should do it
in the same shape finding 1 settles on.
