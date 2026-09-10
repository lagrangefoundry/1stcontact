---
uid: report-ca925e0f
id: REPORT-3769
type: report
title: 'Capability-Intent Alignment: Structured Copy Editing: One Validated, Atomic
  Write Path (level=ac)'
created_by: xgd
created_at: '2026-09-10T17:42:39.214959+00:00'
updated_at: '2026-09-10T17:42:39.214959+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-f753cecd
  level: ac
  violations: 2
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Structured Copy Editing: One Validated, Atomic Write Path
# Level: ac

**Result**: FAIL
**Violations**: 2
**Warnings**: 1
**Needs review**: 0

The capability holds one story (STORY-100, `story_kind: upgrade`) carrying 43
active ACs, all `status: active`. Per the level cascade STORY-100's body is the
working reference: its story-level check passed today (REPORT-3765, 2026-09-10
17:19) and the body was last written 2026-09-10 17:33 by the attempt-4 repair.
Intent history was consulted only where an AC and the body disagree.

**This cycle executed the sweep the previous cycle deferred.** REPORT-3766 closed
by recommending that every pre-colour AC be re-read against the post-colour body,
and REPORT-3768 recorded that ~25 such ACs "were not re-swept this call". All 43
AC bodies were read in full this cycle. The sweep found two survivors of exactly
that lag, both of them **arithmetic claims inside a verification section** that
survived a surgical edit to the same AC:

- **AC-1111** was edited *today* (17:30) — but only to drop the origin clause, so
  its "assert **its one field**" survived REQ-140 giving every painted panel a
  second field.
- **AC-991** was edited on 2026-08-20 in the colour batch itself — but
  `last_field_updated: title`, so the body's "exactly five shapes" was corrected
  while the verification's "four of the five shapes" was not.

Both were verified against `packages/site-schema/src/l1/edit.ts` **and** against
the shipped UAT, and in both cases the code and the test agree with the story and
contradict the AC. Neither is a code issue.

**The nine repairs REPORT-3766 called for are confirmed applied** (see the ledger
and finding 3). The three violations and all seven warnings of the previous
cycle — including warnings 4, 5 and 6, which had gone four cycles unrepaired —
are closed.

## Cumulative Intent Considered

Carried forward from REPORT-3763 / REPORT-3765 / REPORT-3766, whose ledger was
rebuilt from `xgd ticket history story-37a3921b`, each bundle's member list and
the commit history of `packages/site-schema/src/l1/edit.ts`. Re-checked here only
for the intents the findings turn on (REQ-132 and REQ-140 for finding 1; REQ-117,
REQ-135 and REQ-140 for finding 2).

| Intent ID | Status | When | Asked / changed *on this surface* | Counts? |
|---|---|---|---|---|
| REQ-117 | free_and_reconciled | 2026-07-31 | Created the surface: strict address + one resolution rule, one-map-one-diff, the shared whole-definition validator, empty field list, module-slot scoping, no raw code, no undo | YES (finding 2) |
| REQ-118 | free_and_reconciled | 2026-07-31 | Image selection as the same surface: `src` → `alt`, closed list, current handle always an option, membership refused at the field, nothing baked | YES |
| REQ-119 | free_and_reconciled | 2026-07-31 | Request-time draft/edit renders — moved the two origin-facing criteria off stored artifacts onto the origin | YES (repaired last cycle) |
| REQ-128 | free_and_reconciled | 2026-08-08 | A panel's background through the same picker: selection only, no empty option, change-never-add | YES (finding 1) |
| REQ-132 | free_and_reconciled | 2026-08-12 | `format: 'image'` on both picker fields — a hint, never a constraint. **AC-1111 is this intent's AC** | YES (finding 1) |
| REQ-135 | free_and_reconciled | 2026-08-12 | Phase A typography: size, weight from declared faces ∪ current, italic lock, capitalisation, "a bound binds a change, never the status quo"; also the run→panel escalation | YES (finding 2) |
| REQ-136 | free_and_reconciled | 2026-08-12 | Thirteen framing/shape/adjustment controls, identity removes the axis, no empty bags, shape list ∪ current, nothing touches a file | YES |
| REQ-137 | free_and_reconciled | 2026-08-12 | L1 palette: entry = one colour, continuous `shade` on the reference | YES |
| REQ-139 | free_and_reconciled | 2026-08-12 | `{locked, reason}` pairing, `GLYPH_GRADIENT_LOCK`, `lockError`, CLI prints the reason, a lock refuses a change, a sibling is not occlusion | YES |
| REQ-140 | free_and_reconciled | 2026-08-15 | **Colour on this surface**: a `'color'` descriptor type on a run and on a panel's fill, palette riding the read call, membership + bounds refused at the field, hex refused, the read-only "panel behind this text" row. **The fifth control shape, and the panel's second field** | YES (findings 1, 2) |
| REQ-133 | free_and_reconciled | 2026-08-12 | Palette popup (CAP-98) — supplies the colour choices, builds no control here | YES (adjacent) |
| REQ-131 / REQ-142 | free_and_reconciled | 2026-08-18 | Draft change journal (CAP-99); async `SiteStore` port, explicitly no behaviour change (CAP-101) | YES (adjacent) |
| REQ-115 / REQ-121 / REQ-122 / REQ-126 / REQ-127 / REQ-129 / REQ-130 / REQ-138 / REQ-141 / REQ-144 / REQ-123 / REQ-44 / BUG-35 | free_and_reconciled | 2026-07→08 | Neighbour capabilities or client-only changes; no ask on this surface | YES (silent) |
| REQ-134 | abandoned | 2026-08-12 | An image-generation component | NO |

No intent in the ledger retires behaviour any active AC still describes, and no
reconciled intent's ask is absent from the AC tree. Both findings are *statement*
defects inside an AC's verification section, not a missing or surplus capability.

## Alignment Ledger

Every one of the 43 AC bodies was read in full this cycle.

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-980 words lead the answer | REQ-117 | aligned — sole owner of the multi-line rule since AC-990 was reduced |
| AC-981 empty field list succeeds | REQ-117, REQ-128, REQ-140 | aligned — worked example is a module seam |
| AC-982 CLI save → both channels | REQ-117 | aligned (warning 1 — the claim is not scoped to the command line in prose) |
| AC-983 one map, one diff | REQ-117 | aligned — sole owner of one-diff since AC-1026 was reduced |
| AC-984 rejected edit changes no byte | REQ-117 | aligned |
| AC-985 structured refusal + exit status | REQ-117, REQ-126 | aligned |
| AC-986 one shared whole-definition validator | REQ-117, REQ-118 | aligned |
| AC-987 malformed address refused outright | REQ-117 | aligned |
| AC-988 the five refusal classes | REQ-117, REQ-118, REQ-135, REQ-139, REQ-140 | aligned |
| AC-989 module-slot scoping | REQ-117 | aligned |
| AC-990 overflowing copy reads back whole | REQ-117 | aligned — reduced last cycle; story body gained its parent bullet |
| AC-991 five field shapes, no raw code | REQ-117, REQ-135, REQ-136, REQ-140 | **gap: finding 2** — verification still says a run exposes "four of the five shapes"; it exposes all five |
| AC-992 origin parity | REQ-117, REQ-118, REQ-119 | aligned — repaired last cycle; sole owner of origin parity |
| AC-1024 image region field order + framing | REQ-118, REQ-136 | aligned — origin clause dropped |
| AC-1025 current handle always an option | REQ-118 | aligned |
| AC-1026 choosing an image, one diff | REQ-118, REQ-119 | aligned — repaired last cycle |
| AC-1027 nothing is baked | REQ-118, REQ-136 | aligned |
| AC-1045 panel read shape | REQ-128, REQ-132, REQ-140 | aligned — reduced last cycle (info 5) |
| AC-1046 choosing a background | REQ-128 | aligned |
| AC-1047 panel's current handle always an option | REQ-128 | aligned |
| AC-1048 background membership refused at the field | REQ-128 | aligned — origin clause dropped |
| AC-1049 no background picker where none is painted | REQ-128, REQ-140 | aligned |
| AC-1111 `format: 'image'` is a hint | REQ-132, **REQ-140** | **gap: finding 1** — verification says a panel carrying a background has "its one field"; it has two |
| AC-1117 typography read shape | REQ-135, REQ-140 | aligned — repaired last cycle; now leads with words, then colour, then the four typography controls, and counts five shapes |
| AC-1118 resize scales every keyframe | REQ-135 | aligned |
| AC-1119 weights ∪ the run's own | REQ-135 | aligned |
| AC-1120 italic unavailable + reason | REQ-135, REQ-139 | aligned |
| AC-1121 a bound binds a change | REQ-135, REQ-136 | aligned |
| AC-1122 write-into, absent-is-default, no empty bag | REQ-135, REQ-136, REQ-140 | aligned — gained the negative half last cycle |
| AC-1129 pan writes a typed pair | REQ-136 | aligned |
| AC-1130 adjustment as a projection | REQ-136 | aligned |
| AC-1131 shapes ∪ the one it carries | REQ-136 | aligned |
| AC-1132 no framing = browser-painted values | REQ-136 | aligned |
| AC-1269 a run's colour | REQ-137, REQ-140 | aligned — AC-1117 no longer contradicts it |
| AC-1270 every painted panel's fill | REQ-140 | aligned — sole owner of the every-painted-panel rule |
| AC-1271 colour refused at the field | REQ-140 | aligned |
| AC-1272 an unchanged colour is not a change | REQ-140 | aligned |
| AC-1273 unavailable ⇔ a reason, swept | REQ-139 | aligned — rephrased last cycle as a property of the derivation |
| AC-1274 gradient-painted glyphs: inert + lossy | REQ-139 | aligned |
| AC-1275 a sibling is not occlusion | REQ-139 | aligned |
| AC-1276 a change to an unavailable colour | REQ-139, REQ-140 | aligned |
| AC-1277 the CLI listing marks it | REQ-139 | aligned |
| AC-1278 the panel behind this text | REQ-140 | aligned — the `panel` key is a sibling of `fields`, so it does not disturb AC-1117's field-order claim (`tools/generate/src/cli/edit.ts:644-657`) |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | AC-1111 (`acceptance_criterion-285dd8d6`) | ac-edit | The verification reads "Ask the same of a painted panel carrying a background image and assert **its one field** declares the same thing". A painted panel carrying a background image exposes **two** fields, not one. `copyFieldsOf` pushes `backgroundImageUrl` and then `surfaceFill` for any `box`/`container` with `opts.paints` (`packages/site-schema/src/l1/edit.ts:1022-1046`); the fill is derived unconditionally, which is REQ-140's whole point ("Before REQ-140 a container painting only a radius or an image returned `null` here", `:1010-1014`). AC-1045 — this AC's neighbour, rewritten 2026-09-10 17:33 — states it plainly: a panel returns its fill "plus, **when the panel carries one**, which image sits behind it". The shipped UAT already contradicts AC-1111's prose and says so in a comment: `expect((panel.data!.fields as Field[]).map((f) => f.name)).toEqual(['backgroundImageUrl','surfaceFill'])`, preceded by "REQ-140 added the panel's FILL, which every painted panel carries; the image handle is still the only field **of its kind** here" (`tests/reconciliation-copy-edit-field-format.test.ts:238-247`). AC-1111 was created 2026-08-12 under REQ-132, when a panel genuinely did expose one field; today's 17:30 edit dropped its origin clause without re-reading the sentence beside it | Replace "its one field" with the field the criterion is actually about: assert the panel's **background-image field** carries the same declaration, and — since this AC's own rule is "attached by kind of field, not kind of region" — assert the **fill field beside it on the same panel** carries no such declaration, exactly as the alt text beside an image region's picker does not. That turns the stale count into a second instance of the discrimination the criterion exists to make |
| 2 | violation | consistency | AC-991 (`acceptance_criterion-08c7ebe8`) | ac-edit | The verification reads "read every region of a page — including a run of copy, which exposes fields of **four of the five** shapes". A run of copy exposes fields of **all five**: `text` is `string` and the colour row is `color` (`packages/site-schema/src/l1/edit.ts:975-984`, `colorField` at `:643`), while `typographyFields` supplies `fontSizePx` as `integer` (`:513-523`), `fontWeight` as `enum` (`:556-560`), `italic` as `boolean` (`:575-577`) and `textTransform` as `enum` (`:583-585`) — string, color, integer, enum and boolean, which is the whole of the `L1FieldDescriptor` type union at `:187`. The AC's own criterion is correct ("There are exactly five shapes"); only the verification retained the pre-colour count. The shipped UAT asserts the corrected claim directly — `for (const shape of CONTROL_SHAPES) expect(runShapes, shape).toContain(shape)` where `CONTROL_SHAPES` is `['string','enum','integer','boolean','color']` (`tests/reconciliation-copy-edit-typography.test.ts:264, 801-802`) — so a UAT written to AC-991's verification as worded would be weaker than the one that already ships. AC-991 was touched in the 2026-08-20 colour batch, but with `last_field_updated: title`: the criterion was raised from four shapes to five and the verification was left at four. This is the same defect REPORT-3766 finding 1 repaired in AC-1117 ("four control shapes" → five); AC-991 is its unrepaired twin | Change "which exposes fields of four of the five shapes" to "which exposes fields of **all five** shapes". Nothing else in the AC needs to move — the criterion, the narrowing argument and the free-colour-value refusal step are all correct as they stand |
| 3 | info | consistency | AC-982, AC-990, AC-992, AC-1024, AC-1026, AC-1045, AC-1048, AC-1111, AC-1117, AC-1122, AC-1273, STORY-100 | — | All nine repairs REPORT-3766 asked for are confirmed present. AC-1117 now orders the answer words → colour → size/weight/italic/capitalisation and counts five shapes; AC-992's third bullet is the origin observable with "before reporting success" gone; AC-1026 has dropped its origin sentence and its one-diff restatement; AC-982 owns the command line's both-channels claim; the origin clause is gone from AC-1024, AC-1048 and AC-1111 and rephrased in AC-1273; AC-990 is reduced to the readback; AC-1122 carries the size/weight/colour negative half; AC-1045 is reduced to the read shape with AC-1270 sole owner of the every-painted-panel rule; and STORY-100's "Asking what a region exposes" bullet now carries the overflow parent (body 52,815 → 53,352 chars). Warnings 4, 5 and 6 — four cycles unrepaired — are closed | none |
| 4 | warning | consistency | AC-982 (`acceptance_criterion-99f7c64d`) | ac-edit | The criterion added last cycle says "the page is re-rendered as part of the same operation — **both** the editable rendering and the plain draft rendering… Each rendered output **on disk** therefore contains the new words", with no clause naming which producer it is about. AC-992 states the opposite for the other producer — "A successful save writes the draft and replies; there is **no rendering step in between**" — and the code agrees with both (`tools/generate/src/cli/index.ts:1347-1354` renders both channels and emits `rendered` + `renderedDraft`; `/api/copy` POST calls `editCopySet` and returns, `apps/control-app/src/router.ts:545-571`). The two ACs do not actually collide, because "on disk" and "the path of each of the two renderings" are unambiguously command-line artifacts — which is why this is a warning and not a violation. But the surface has two producers by design, and this is the one AC that asserts a re-render without saying whose | Open the criterion with the producer: "Submitting a change map **from the command line**…". One clause; the rest of the AC and its UAT are correct and need no change |
| 5 | info | exclusivity | AC-1045 + AC-1049 | — | Last cycle's warning-9 repair replaced AC-1045's rounded-corner worked example with "Address a second panel carrying no background image and assert it returns the colour field and no image field", which is the scenario AC-1049 owns ("assert… exactly one field is returned, and that it is the fill rather than an image picker"). Recorded rather than raised: AC-1045's criterion is explicitly conditional ("plus, **when the panel carries one**, which image sits behind it"), and the negative half of a conditional cannot be verified without the negative case. AC-1049's own claims — change-never-add, the empty handle, the fill's set-but-never-clear asymmetry — are not duplicated. Logged so a later cycle does not re-open it as drift |
| 6 | info | coverage | STORY-100 body → (no AC) | — | The body's caveat that a framing control's whole-number resolution means an AI-set fractional value is reported at the nearer whole number and rewritten on re-save — the single stated exception to "a save that changes nothing changes nothing" — still has no AC and still needs none. AC-1132 and AC-1122 exercise the no-op re-save against values the region itself reported, which are already whole numbers. Carried forward from REPORT-3766 finding 13 so the silence is not read as a gap |
| 7 | info | exclusivity | AC-1025, AC-1047, AC-1119, AC-1131 / AC-988, AC-1048, AC-1119, AC-1121, AC-1271 / AC-1120, AC-1276 | — | Three families of "the same rule applied to a different field" were re-examined and re-confirmed as specialisation rather than duplication: the four "a region's current value is always among its own options" ACs (the story body itself calls this "the identical correctness rule"); AC-988's enumeration of the five refusal classes against its per-field specialisations; and the change-refused/status-quo-passes rule owned generally by AC-988 and specialised by AC-1120 (italic) and AC-1276 (colour). Carried forward from REPORT-3766 finding 12 and re-affirmed |

## Notes for the Editor

**Both violations are one-sentence edits, and they are independent.** Neither
touches a criterion — only a verification step — and neither has any sequencing
constraint against the other. Neither is a code issue: in both cases the
implementation and the shipped UAT already assert the corrected claim, so the AC
prose is the only layer still wrong, and no test changes.

**The lag pattern has a sharper shape than last cycle described it.** REPORT-3766
framed the risk as "ACs untouched since 2026-08-16". Both survivors falsify that
framing: AC-1111 was edited **today** and AC-991 was edited **in the colour batch
itself**. What they have in common is that each edit was *surgical* — a clause
dropped, a title raised — and stopped at the sentence it came for. AC-991 is the
starkest: the same 2026-08-20 pass that raised its criterion from four shapes to
five left the verification saying four, and it took REPORT-3766 finding 1
repairing the identical "four control shapes" error in AC-1117 for the twin to
become visible. `updated_at` and `last_field_updated` are therefore *not* a
usable proxy for "this AC has been reconciled with the current body" — only a
full read is. The useful successor rule is narrower and cheaper than a sweep:
**whenever a repair changes a count, an ordering or an exhaustive list in one AC,
grep the whole tree for the same number.**

**The exclusivity backlog is gone.** Warnings 4, 5 and 6 had run four cycles and
warning 4 had grown from two ACs to six. All three are closed, and the two
scans that would have caught a recurrence — the count grep above and a re-read of
every verification section — found no new instance of the origin-parity clause,
the one-diff restatement or the multi-line-control rule outside its owner. What
remains is finding 5's single boundary case, which is inherent to a conditional
criterion rather than copied prose.

**One observation outside this level's scope, for whoever runs the `uat` check
next.** `test_UAT_AC991_every_field_is_one_of_four_closed_shapes_and_markup_stays_literal`
(`tests/reconciliation-copy-edit-typography.test.ts:757`) carries the same stale
arithmetic in its *name* and its opening comment ("exactly four shapes", "the
vocabulary has now grown twice"), while its assertions are correct and test all
five. Fixing AC-991 per finding 2 leaves the test name as the last carrier of the
pre-colour count. It is a rename, not a behaviour change, and it belongs to the
uat level rather than here.
