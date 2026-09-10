---
uid: report-df2ef2a7
id: REPORT-3775
type: report
title: 'Capability-Intent Alignment: Structured Copy Editing: One Validated, Atomic
  Write Path (level=ac)'
created_by: xgd
created_at: '2026-09-10T18:28:23.430631+00:00'
updated_at: '2026-09-10T18:28:23.430631+00:00'
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

The capability holds one story — STORY-100 (`story-37a3921b`, `story_kind:
upgrade`, `intent_uid: bundle-15c1f647`, `updated_by: bundle-77b28def`) —
carrying 43 active ACs, every one `kind: behavior`. Per the level cascade
STORY-100's body is the working reference; its story-level check passed at 17:19
(REPORT-3765) and its last body edit was 17:33. Intent was consulted only where
an AC's own enumeration had to be checked against the one it came from — which
is again where this cycle's violation is.

All 43 AC bodies were read in full this cycle from the live tickets, not from any
prior report. Coverage was re-walked bullet-by-bullet against STORY-100's twelve
**In scope** headings. The read-shape claims were re-confirmed against
`copyFieldsOf` (`packages/site-schema/src/l1/edit.ts:959-1050`),
`typographyFields` (`:543-591`) and `FILTER_CONTROLS` (`:794-800`), and the two
attempt-7 edits were read as diffs (`xgd ticket history`) rather than taken from
the fix report.

**Attempt 7's two repairs are confirmed applied, and both are substantively
right.**

- AC-1130 (`updated_at` 18:14:09) now names the two partitions separately —
  "the four **percentage** adjustments — brightness, contrast, saturation and
  black-and-white" for the unit partition, "unchanged (100%) for brightness,
  contrast and saturation, none-at-all (0) for black-and-white, the hue shift and
  the blur" for the identity partition — and adds the recurrence guard stating
  the two deliberately do not coincide. Both partitions check out against
  `FILTER_CONTROLS` (`brightnessPct`/`contrastPct`/`saturatePct` at
  `identity: 100, scale: 100`; `grayscalePct` at `identity: 0, scale: 100`;
  `hueRotateDeg`/`blurPx` at `identity: 0, scale: 1`) and against REQ-136 line
  107 ("1 the identity of every scaling filter, 0 of the rest") and line 98-99
  ("Brightness / Contrast / Saturation / Black & white (%) · Hue shift (°) ·
  Blur (px)"). REPORT-BF5F3E68's violation 1 is closed.
- AC-1117 (`updated_at` 18:14:12) now qualifies the reported-values sentence with
  the absent-weight seed. Confirmed at `edit.ts:564` —
  `values.fontWeight = String(axes.fontWeight ?? weights[0])` — and
  `weightChoices` (`:498-503`) sorts ascending, so `weights[0]` is the lowest
  declared face. REPORT-BF5F3E68's warning 2 is closed.

**What this cycle found is, once again, a defect the repair itself introduced —
and in the same shape as last cycle's.** Attempt 7 narrowed a deliberately
general sentence in AC-1130's *Verification* by appending an enumeration that
omits two of the six controls the sentence covers. Before the edit, "Save each of
those controls back to its own identity" was open and true of all six; after it,
the parenthetical names only the four percentage controls, while the sentence two
before it requires the hue shift and the blur to have been submitted and stored.
Following the verification as it now stands leaves `hueRotateDeg` and `blurPx` in
the region, so the assertion that immediately follows — "the region carries no
colour adjustment at all and no empty group in its place" — cannot hold.

Not a code issue and not a UAT issue. The implementation is right, and the
shipped UAT never submits the hue shift or the blur at all
(`tests/reconciliation-copy-edit-image-framing.test.ts:379-398` names
`contrast`, `hueRotateDeg` and `blurPx` as the controls "offered and never
submitted"), so no test asserts the broken sequence. The AC's prose is the only
layer wrong, and the *newly added* clause is what makes the *old* sentence
unreachable.

## Cumulative Intent Considered

STORY-100 carries `intent_uid: bundle-15c1f647` (BUNDLE-16, `free_and_reconciled`,
`merged_at_commit: 1741ee5d`) and `updated_by: bundle-77b28def` (BUNDLE-19,
`free_and_reconciled`, `merged_at_commit: b18b859d`); both were re-read directly
from the live tickets this cycle. The ACs carry no `intent_uid` of their own, so
per-AC attribution is carried forward from REPORT-3763 / REPORT-3766 /
REPORT-3769 / REPORT-3771 / REPORT-3773, whose ledger was built from
`xgd ticket history story-37a3921b`, each bundle's member list and the commit
history of `packages/site-schema/src/l1/edit.ts`. **Every status in the table
below was re-verified against the live ticket store this cycle** (a single
`--all` listing resolved by human ID), not carried forward. REQ-136 was re-read
in full because the finding turns on its identity rule.

| Intent ID | Status | When | Asked / changed *on this surface* | Counts? |
|---|---|---|---|---|
| REQ-117 (`request-395b67e6`) | free_and_reconciled | 2026-07-31 | Created the surface: strict address + one resolution rule, one-map-one-diff, the shared whole-definition validator, empty field list, module-slot scoping, no raw code, no undo | YES |
| REQ-118 (`request-66e4c630`) | free_and_reconciled | 2026-07-31 | Image selection as the same surface: `src` → `alt`, closed list, current handle always an option, membership refused at the field, nothing baked | YES |
| REQ-119 (`request-64864801`) | free_and_reconciled | 2026-07-31 | Request-time draft/edit renders — moved the two origin-facing criteria off stored artifacts onto the origin | YES |
| REQ-128 (`request-de67e1a1`) | free_and_reconciled | 2026-08-08 | A panel's background through the same picker: selection only, no empty option, change-never-add | YES |
| REQ-132 (`request-5946d045`) | free_and_reconciled | 2026-08-12 | `format: 'image'` on both picker fields — a hint, never a constraint | YES |
| REQ-135 (`request-a8ccd0dd`) | free_and_reconciled | 2026-08-12 | Phase A typography: size, weight from declared faces ∪ current, italic lock, capitalisation, "a bound binds a change, never the status quo"; the run→panel escalation | YES |
| REQ-136 (`request-8a132869`) | free_and_reconciled | 2026-08-12 | Thirteen framing/shape/adjustment controls; **its control table separates (%) from (°) and (px)**, and its design rules fix the identity partition: "1 the identity of every scaling filter, **0 of the rest**" | YES (**violation 1**) |
| REQ-137 (`request-d2980a95`) | free_and_reconciled | 2026-08-12 | L1 palette: entry = one colour, continuous `shade` on the reference | YES |
| REQ-139 (`request-3f57cd0c`) | free_and_reconciled | 2026-08-12 | `{locked, reason}` pairing, `GLYPH_GRADIENT_LOCK`, `lockError`, CLI prints the reason, a lock refuses a change, a sibling is not occlusion | YES |
| REQ-140 (`request-3c0fec69`) | free_and_reconciled | 2026-08-15 | Colour on this surface: a `'color'` descriptor on a run and on a panel's fill, palette riding the read call, membership + bounds refused at the field, hex refused, the read-only "panel behind this text" row | YES (warning 1 is adjacent) |
| REQ-133 (`request-8467b1a3`) | free_and_reconciled | 2026-08-12 | Palette popup (CAP-98) — supplies the colour choices, builds no control here | YES (adjacent) |
| REQ-131 / REQ-142 | free_and_reconciled | 2026-08-18 | Draft change journal (CAP-99); async `SiteStore` port, explicitly no behaviour change (CAP-101) | YES (adjacent) |
| REQ-115 / REQ-121 / REQ-122 / REQ-123 / REQ-126 / REQ-127 / REQ-129 / REQ-130 / REQ-138 / REQ-141 / REQ-144 / REQ-44 / BUG-35 | free_and_reconciled | 2026-07→08 | Neighbour capabilities or client-only changes; no ask on this surface | YES (silent) |
| REQ-134 (`request-ba3e3fba`) | **abandoned** | 2026-08-12 | An image-generation component | **NO** |

No intent in the ledger retires behaviour an active AC still describes — REQ-134
is the only retired one and nothing in the AC tree offers image *generation*. Every
reconciled intent's ask on this surface is expressed somewhere in the AC tree
(coverage map below). Both findings are *statement* defects inside an existing
criterion, not a missing or a surplus one.

## Alignment Ledger

Coverage was checked bullet-by-bullet against STORY-100's twelve **In scope**
headings; every one has at least one AC, and no AC claims behaviour the **Out of
scope** list retires (an out-of-scope sweep for
`sepia|invert|tint|zoom|crop|drag|upload|undo|alignment|letter spacing|line
height|font family|geometry` returns hits only where an out-of-scope parameter is
named as something that must *survive* an edit or be *absent* from the answer —
AC-1027, AC-1117, AC-1122, AC-1275).

| In-scope bullet | ACs expressing it | Outcome |
|---|---|---|
| Naming a region | AC-987, AC-989 | covered |
| Asking what a region exposes | AC-980, AC-981, AC-990, AC-1024, AC-1025, AC-1045, AC-1047, AC-1049, AC-1111, AC-1117, AC-1119, AC-1131, AC-1132, AC-1269, AC-1270, AC-1278 | covered |
| Offering a control only when it is faithful | AC-1120, AC-1273, AC-1274, AC-1275, AC-1276, AC-1277 | covered |
| Applying one change as one change | AC-983, AC-1026, AC-1122, AC-1130 | covered |
| Writing a parameter as the rule it is | AC-1118, AC-1122, AC-1129 | covered |
| Validating the whole result | AC-986 | covered |
| Refusing legibly | AC-984, AC-985, AC-988, AC-1048, AC-1271 | covered |
| Refusing a change, never the status quo | AC-1121, AC-1272, AC-1276, AC-988 (closing clause) | covered |
| Making the change visible | AC-982, AC-992, AC-1026, AC-1046 | covered |
| Being incapable of raw code | AC-991 | covered |
| Changing nothing but structured fields | AC-1027, AC-1046, AC-1122 | covered |
| Leaving no trace when nothing changed | AC-1122, AC-1129, AC-1130, AC-1131, AC-1132, AC-1272 | covered |

Per-AC alignment:

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-980 words lead the answer | REQ-117 | aligned — order re-confirmed, `text` is first at `edit.ts:975-981` |
| AC-981 empty field list succeeds | REQ-117, REQ-128, REQ-140 | aligned — `copyFieldsOf` returns `null` for an unpainted box/container and the seam is the worked example, matching AC-1270's split |
| AC-982 CLI save → both renderings | REQ-117, REQ-119 | aligned |
| AC-983 one map, one diff | REQ-117 | aligned |
| AC-984 rejected edit changes no byte | REQ-117 | aligned |
| AC-985 structured refusal + exit status | REQ-117, REQ-126 | aligned |
| AC-986 one shared whole-definition validator | REQ-117, REQ-118 | aligned |
| AC-987 malformed address refused outright | REQ-117 | aligned |
| AC-988 the five refusal classes | REQ-117, REQ-118, REQ-135, REQ-139, REQ-140 | aligned |
| AC-989 module-slot scoping | REQ-117 | aligned |
| AC-990 overflowing copy reads back whole | REQ-117 | aligned |
| AC-991 five field shapes, no raw code | REQ-117, REQ-135, REQ-136, REQ-140 | aligned — a run really does expose all five (`text` string, `color` palette ref, `fontSizePx` integer, `fontWeight`/`textTransform` enum, `italic` boolean) |
| AC-992 origin parity | REQ-117, REQ-118, REQ-119 | aligned |
| AC-1024 image region field order + framing | REQ-118, REQ-136 | aligned — `src` → `alt` → framing re-confirmed at `edit.ts:986-1000`; thirteen framing controls re-counted (fill mode, pan ×2, shape, rounding, rotate, scale, six filters) |
| AC-1025 current handle always an option | REQ-118 | aligned |
| AC-1026 choosing an image, one diff | REQ-118, REQ-119 | aligned |
| AC-1027 nothing is baked | REQ-118, REQ-136 | aligned |
| AC-1045 panel read shape | REQ-128, REQ-132, REQ-140 | aligned — order-neutral by its own text; code returns background-then-fill (`edit.ts:1020-1046`) |
| AC-1046 choosing a background | REQ-128 | aligned |
| AC-1047 panel's current handle always an option | REQ-128 | aligned |
| AC-1048 background membership refused at the field | REQ-128 | aligned |
| AC-1049 no background picker where none is painted | REQ-128, REQ-140 | aligned — "exactly one field" matches `copyFieldsOf`'s panel branch when `backgroundHandleOf` is `undefined` |
| AC-1111 `format: 'image'` is a hint | REQ-132, REQ-140 | aligned |
| AC-1117 typography read shape | REQ-135, REQ-140 | **gap: warning 1** — the criterion gained the absent-weight seed at 18:14; its Verification was left unchanged and now checks none of it |
| AC-1118 resize scales every keyframe | REQ-135 | aligned |
| AC-1119 weights ∪ the run's own | REQ-135 | aligned (`weightChoices`, `edit.ts:498-503`) |
| AC-1120 italic unavailable + reason | REQ-135, REQ-139 | aligned (`lockedItalic`, `edit.ts:572-573`) |
| AC-1121 a bound binds a change | REQ-135, REQ-136 | aligned |
| AC-1122 write-into, absent-is-default, no empty bag | REQ-135, REQ-136, REQ-140 | aligned |
| AC-1129 pan writes a typed pair | REQ-136 | aligned |
| AC-1130 adjustment as a projection | **REQ-136** | **gap: violation 1** — criterion body now correct on both partitions; its *Verification* was narrowed at 18:14 and no longer reaches its own final assertion |
| AC-1131 shapes ∪ the one it carries | REQ-136 | aligned |
| AC-1132 no framing = browser-painted values | REQ-136 | aligned |
| AC-1269 a run's colour | REQ-137, REQ-140 | aligned — colour sits between the words and typography (`edit.ts:963-981`), matching AC-980, AC-1117 and AC-1269 in all three places |
| AC-1270 every painted panel's fill | REQ-140 | aligned |
| AC-1271 colour refused at the field | REQ-140 | aligned |
| AC-1272 an unchanged colour is not a change | REQ-140 | aligned |
| AC-1273 unavailable ⇔ a reason, swept | REQ-139 | aligned |
| AC-1274 gradient-painted glyphs: inert + lossy | REQ-139 | aligned |
| AC-1275 a sibling is not occlusion | REQ-139 | aligned |
| AC-1276 a change to an unavailable colour | REQ-139, REQ-140 | aligned |
| AC-1277 the CLI listing marks it | REQ-139 | aligned |
| AC-1278 the panel behind this text | REQ-140 | aligned |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | AC-1130 (`acceptance_criterion-0e2f38fa`) | ac-edit | AC-1130's **Verification** now instructs a sequence whose final assertion cannot be reached. Sentence 2 requires the hue shift and the blur to be submitted and stored: "Assert that the hue shift and the blur are held under the same name the control offers, with no conversion **between what is submitted and what is stored**." Sentence 4 then says "Save each of **those controls** back to its own identity — **a hundred for brightness, contrast and saturation, zero for black-and-white** — and assert the region carries **no colour adjustment at all** and no empty group in its place." The em-dash enumeration names four of the six controls and omits the hue shift and the blur, whose identity is also 0 (`FILTER_CONTROLS`: `hueRotateDeg` and `blurPx` both `identity: 0`, `packages/site-schema/src/l1/edit.ts:799-800`; REQ-136 line 107, free_and_reconciled 2026-08-12: "1 the identity of every scaling filter, **0 of the rest**"). The defect survives both readings of "those controls": if it means all six that were saved, the enumeration is short by two and following it leaves `hueRotateDeg` and `blurPx` in the region; if it means only the four percentage controls, the hue shift and the blur are submitted in sentence 1, asserted stored in sentence 2 and then never cleared. Either way the region still carries a colour adjustment and the group is not empty, so "no colour adjustment at all and no empty group in its place" is false. This was introduced by attempt 7 (commit `5cc23e1b`, 18:14:09): the pre-edit text read "Save each of those controls back to its own identity and assert…" — deliberately general and true of all six — and the appended enumeration is what narrowed it. The criterion **body** is not affected: its identity paragraph names all six correctly ("unchanged (100%) for brightness, contrast and saturation, none-at-all (0) for black-and-white, the hue shift and the blur"), so the Verification now contradicts the very paragraph the same repair got right. No code or UAT change is implied — `tests/reconciliation-copy-edit-image-framing.test.ts:379-398` never submits the hue shift or the blur (it names `contrast`, `hueRotateDeg` and `blurPx` as the controls "offered and never submitted"), so nothing shipped asserts the broken sequence | Extend the enumeration to all six so it matches the criterion's own identity paragraph: replace "— a hundred for brightness, contrast and saturation, zero for black-and-white —" with "— a hundred for brightness, contrast and saturation, zero for black-and-white, the hue shift and the blur —". One clause; nothing else in the AC moves. Do **not** revert to the pre-attempt-7 bare "its own identity": naming the numbers is what closes REPORT-BF5F3E68's finding, and the criterion body's partition sentence must stay exactly as it is. If the editor would rather keep the verification's hue/blur assertion out of the identity sweep, the alternative is to make sentence 2 explicitly read-only ("assert the hue shift and the blur are **offered** under the same name the axis carries") — but the enumeration fix is the smaller change and the one that leaves the AC asserting more |
| 2 | warning | coverage | AC-1117 (`acceptance_criterion-0c85504b`) | ac-edit | The criterion gained a substantive behavioural claim at 18:14:12 (commit `85ccbdbf`) that its own **Verification** does not exercise. The new clause asserts two things: that a run declaring no weight reports a value "**seeded from the lowest declared face**", and that "**echoing the seed straight back is not a change**" — a no-op rule with real consequences for a save that only rewrites the words. The Verification was left verbatim and still says only "Assert the reported values are the run's own — the representative size for a run whose size varies by viewport, and **the weight it is actually set in**", which is the *declaring* case exclusively. Nor is the gap closed downstream: every seeded run in `tests/reconciliation-copy-edit-typography.test.ts` declares a `fontWeight` (lines 106, 125, 131, 143, 149, 155, 196, 607), so no test covers the absent-weight read either. The claim itself is correct — `values.fontWeight = String(axes.fontWeight ?? weights[0])` (`edit.ts:564`) with `weightChoices` sorting ascending (`:498-503`), and the write path names the seed "a fabrication, not a reading of the node" (`:1302-1310`) — so this is an unverified true statement, not a false one, which is why it is a warning rather than a violation | Append one clause to the Verification: "Address a run declaring **no** weight of its own on a page declaring several faces, and assert the reported weight is the lowest declared face; re-post that value alongside new words and assert the save succeeds and reports the words alone as changed." That makes the AC self-consistent and hands the `uat` pass a concrete test to add. Nothing else in the AC moves |

## Notes for the Editor

**One violation, one warning, and they are independent.** Both are confined to a
single AC's **Verification** section; neither touches a criterion body, a UAT or
production code. Finding 1 is a one-clause enumeration extension, finding 2 a
one-clause addition.

**The successor rule this cycle adds.** Attempt 7 ran the rule the previous cycle
asked for — *when a repair pins a phrase, re-read every other occurrence of that
phrase inside the same AC, and check it against the intent's own usage* — and ran
it soundly across all 43 ACs. Finding 1 escaped it because the repair did not
reuse the pinned phrase at all: it **replaced an open quantifier with a closed
list** ("each of those controls back to its own identity" → "… — a hundred for
X, Y and Z, zero for W —"). The general form worth adding: **when a repair
replaces a general phrase with an enumeration, check the enumeration against every
member the general phrase covered — in this AC, in the criterion's own body, and
in the intent** — because an enumeration that is right about the members it names
can still be wrong about the ones it omits. This is now the fourth consecutive
cycle whose finding came from an AC's own enumeration rather than from the story
body, which deliberately abstracts over units, identities and counts.

**A structural observation about where these keep landing.** Findings 1 and 2 are
both *Verification*-section defects following a *Criterion*-section repair, in the
two ACs attempt 7 touched, and in both cases the fix report stated the
Verification was deliberately left alone or moved only in form. The pattern
suggests a standing rule for the fixer rather than another one-off: **a criterion
edit that adds, narrows or enumerates a behavioural claim should be followed by
re-reading that AC's Verification in full and asking whether it still reaches its
own last assertion.** Both of this cycle's findings would have been caught by that
one question.

**Carried forward, still info, still needing no AC.** STORY-100's caveat that a
framing control's whole-number resolution means an AI-set fractional value is
reported at the nearer whole number and rewritten on re-save — the single stated
exception to "a save that changes nothing changes nothing" — has no AC and needs
none (REPORT-3766 finding 13, REPORT-3769 finding 6, REPORT-3771, REPORT-3773). A
repair to AC-1130 must not absorb it: finding 1 is an enumeration fix and nothing
more.

**A story-level omission, deliberately not raised as an AC finding.** STORY-100's
"Asking what a region exposes" bullet justifies withholding the size control on
the ground that "a fabricated number and a chooser holding its only option are
both controls that lie about what they do", and is silent on the fact that the
*weight* control does show a fabricated value (the seed) when a run declares
none. AC-1117 now states that seed openly and truthfully, so at this level the AC
is sound; the omission is STORY-100's and belongs to a story-level pass. Recorded
here so the next story-level cycle has it, not as a fix for this one.

**Exclusivity re-checked, nothing new.** The families affirmed by REPORT-3769
finding 7 and re-affirmed since — the four "current value is always among its own
options" ACs (AC-1025, AC-1047, AC-1119, AC-1131), AC-988's enumeration against
its per-field specialisations (AC-1120, AC-1121, AC-1271, AC-1276), and the three
"save it and the re-render shows it" ACs (AC-982 words, AC-1026 image, AC-1046
background) — remain specialisation rather than duplication; STORY-100 states each
paired rule in both places on purpose. The AC-1045 / AC-1049 / AC-1270 boundary
over a painted panel's fill stays delegated by AC-1045's own text ("Which panels
are offered a fill at all, and what may be written into it, are a separate
criterion's business").

**Still outside this level, for whoever runs `uat` next.** Four items, three
carried forward and re-confirmed against the live tree this cycle:

1. `test_UAT_AC991_every_field_is_one_of_four_closed_shapes_and_markup_stays_literal`
   (`tests/reconciliation-copy-edit-typography.test.ts:757`) carries the
   pre-colour count in its *name* while its assertions test all five shapes.
2. AC-981 has two UATs
   (`reconciliation-copy-edit-image-selection.test.ts:370`,
   `reconciliation-copy-edit-write-path.test.ts:253`) that overlap in shape.
3. `test_UAT_AC1130_colour_is_adjusted_in_percentages_over_the_fractions_the_definition_holds`
   (`tests/reconciliation-copy-edit-image-framing.test.ts:344`) still carries the
   pre-repair phrasing as a comment at lines 383-385 ("unchanged (100%) for the
   **scaling** adjustments, none-at-all (0) for the rest") and a name saying "in
   percentages". Its assertions are correct — it clears `saturatePct`/
   `brightnessPct` with `100` and `grayscalePct` with `0` — so the uat pass should
   close the prose and leave the logic alone, in the same shape finding 1 settles
   on. Note that this test does **not** submit the hue shift or the blur, which is
   why finding 1 is invisible from the test side.
4. The ten colour/availability ACs (AC-1269 … AC-1278) carry **no `uat_coverage`
   field at all**, while the other 33 carry `uat_coverage: pass`. The capability's
   own aggregate reads `uat_coverage: fail`. That mismatch is the `uat` level's
   and `check_uat_coverage`'s business — it is not an ac-level alignment defect
   and this pass deliberately did not touch the field.
