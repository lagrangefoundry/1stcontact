---
uid: report-0a2d49ad
id: REPORT-2081
type: report
title: 'Capability-Intent Alignment: Structured Copy Editing: One Validated, Atomic
  Write Path (level=ac)'
created_by: xgd
created_at: '2026-08-16T06:36:13.121953+00:00'
updated_at: '2026-08-16T06:36:13.121953+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-f753cecd
  level: ac
  violations: 2
  warnings: 5
  needs_review_count: 0
---

# Capability-Intent Alignment: Structured Copy Editing: One Validated, Atomic Write Path
# Level: ac

**Result**: FAIL
**Violations**: 2
**Warnings**: 5
**Needs review**: 0

The capability holds one story (STORY-100, `story_kind: upgrade`, `story-37a3921b`)
carrying 33 active ACs. Per the level cascade, STORY-100's body is the working
reference — except in the one place this cycle's story-level check
(REPORT-2080 / `report-4c7acd7e`, **FAIL**, 1 violation) proved that body wrong.
Both violations below sit in exactly that place, and both were verified against
the code and the intent directly rather than inherited on trust.

## Cumulative Intent Considered

REPORT-2080 rebuilt this ledger from the commit history of the surface's own
definition site plus each intent's body, because STORY-100's `intent_uid`
(BUNDLE-16) and `updated_by` (REQ-136) record only two of the fourteen intents
that have grown it. Every status below was re-queried this cycle and matches.

| Intent ID | UID | Status | Asked / changed *on this surface* | Counts? |
|---|---|---|---|---|
| REQ-117 | `request-395b67e6` | free_and_reconciled | Created the surface: strict address + one resolution rule, `copyFieldsOf`/`applyCopyFields`, one-map-one-diff, shared whole-definition validator, empty field list, module-slot scoping, no-raw-code | YES |
| REQ-118 | `request-66e4c630` | free_and_reconciled | Image selection as the same surface: `src` + `alt`, closed list, current handle always an option, membership refused at the field, nothing baked | YES |
| REQ-119 | `request-64864801` | free_and_reconciled | Request-time draft/edit renders — moved the two origin-facing criteria from stored artifacts to the origin | YES |
| REQ-126 | `request-d9407f80` | free_and_reconciled | L1 control-surface API + error taxonomy — the refusal envelope this surface reuses | YES (silent) |
| REQ-128 | `request-de67e1a1` | free_and_reconciled | A painted panel's `backgroundImageUrl` through the same picker: selection only, no empty option, change-never-add | YES |
| REQ-132 | `request-5946d045` | free_and_reconciled | `format: 'image'` on both picker fields — a hint, never a constraint | YES |
| REQ-135 | `request-a8ccd0dd` | free_and_reconciled | Phase A typography: size (proportional track write), weight from declared faces ∪ current, italic locked on positive evidence of absence, "a bound binds a change, never the status quo". Phase B (colour) deferred | YES |
| REQ-136 | `request-8a132869` | free_and_reconciled | Thirteen framing/shape/colour-adjustment controls, identity removes the axis, no empty bags, shape list ∪ current, nothing touches a file | YES |
| REQ-138 | `request-1ff09fab` | free_and_reconciled | Live parameter preview in the modal — client only; "nothing about the write path, the validator or the diff changes" | YES (silent) |
| REQ-133 | `request-8467b1a3` | ready_to_reconcile | Palette popup — the blocker STORY-100 names by number for colour | imminent |
| REQ-137 | `request-d2980a95` | bundled | L1 palette `shade` on the reference | imminent (silent) |
| REQ-139 | `request-3f57cd0c` | ready_to_reconcile | Generalises `locked` to `{locked, reason}`, adds `GLYPH_GRADIENT_LOCK` and `lockError`. **Restates the already-shipped rule: "A lock refuses a CHANGE, never the status quo."** | imminent |
| REQ-140 | `request-3c0fec69` | ready_to_reconcile | Colour on this surface: a `'color'` descriptor type, `L1Color` values, `palette` options, palette-membership refusal | imminent |
| REQ-134 | `request-ba3e3fba` | abandoned | An image-generation component | NO |

**On the two imminent intents that touch this surface.** REQ-139 and REQ-140 are
not yet on `main` — the descriptor type union is still
`'string' | 'enum' | 'integer' | 'boolean'` and no `reason` field exists. No AC
should be repaired ahead of them. Findings 1 and 2 are **not** such a case: the
refuse-on-change rule they concern is *already shipped*, attributed to REQ-135 in
the code (`packages/site-schema/src/l1/edit.ts:1134`), and REQ-139 merely restates
it. Those ACs are wrong about `main` **today**.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-980, AC-990 | REQ-117 | aligned to intent; but their shared multi-line-control rule is asserted twice (finding 6) and has no parent bullet in the story body (finding 7) |
| AC-981, AC-1049 | REQ-117, REQ-128 | aligned. AC-981 narrowed correctly when REQ-128 landed (REPORT-1742 F5 now repaired). Partial setup overlap only — see Notes |
| AC-982, AC-983, AC-984, AC-985, AC-986, AC-987, AC-989, AC-991, AC-992 | REQ-117, REQ-119, REQ-126 | aligned |
| AC-988 | REQ-117, REQ-118, REQ-135 | **gap: the read-only refusal bullet states presence, not change** (finding 2) |
| AC-1024, AC-1025, AC-1026, AC-1027 | REQ-118, REQ-136 | aligned on substance; origin-parity and one-diff clauses duplicated (findings 4, 5) |
| AC-1045, AC-1046, AC-1047, AC-1048 | REQ-128, REQ-132 | aligned; AC-1045/AC-1048 have since picked up the duplicated origin-parity clause (finding 4) |
| AC-1111 | REQ-132 | aligned; same origin-parity clause (finding 4) |
| AC-1117, AC-1118, AC-1119 | REQ-135 | aligned — size-as-a-rule, first-family match and weight ∪ current all trace exactly |
| AC-1120 | REQ-135, REQ-139 | **gap: refusal stated on presence; both intent and code say on change** (finding 1) |
| AC-1121 | REQ-135, REQ-136 | aligned — states the status-quo exemption correctly, and generalises it to every bounded control as REQ-136 requires |
| AC-1122 | REQ-135, REQ-136 | aligned on substance; "absent is the default" over-generalised to every parameter (finding 3) |
| AC-1129, AC-1130, AC-1131, AC-1132 | REQ-136 | aligned — both-or-neither pan, projection-not-storage colour, shape ∪ current written bare, browser-painted defaults |
| — | REQ-133, REQ-137, REQ-139, REQ-140 (imminent) | no AC yet, correctly. Colour ACs arrive with REQ-140; the lock becomes a family with REQ-139 |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | AC-1120 (`acceptance_criterion-3235871e`) | ac-edit | Criterion states "A value posted for a read-only field is **refused** — not applied, not silently dropped", and the title repeats it ("a value posted for a read-only field is refused"). The shipped and intended rule is refusal **on change, never on presence**: `edit.ts:1159` guards `field.locked && value !== derived.values[name]`, with the reasoning at `:1134-1142` ("the modal posts every staged field… Refusing it outright therefore refused the whole change map — on a run whose family declares faces but no italic one, nothing could be saved at all"). REQ-139 (`request-3f57cd0c`) states it outright: "A lock refuses a CHANGE, never the status quo." Under the AC as written, no save of a run with a locked italic could ever succeed, including one that only edited the words | Restate as: a value that **differs** from the one the region just reported for a read-only field is refused; a value that merely echoes it passes. AC-1121 already words this correctly for bounds — mirror its sentence. **Verification needs no change**: it posts italic for a run whose derived value is `false`, so the value genuinely differs |
| 2 | violation | consistency | AC-988 (`acceptance_criterion-97f5dee6`) | ac-edit | Same defect, in the general refusal AC. Fourth refusal bullet reads "An entry for a field the region offered **read-only**… a value for it can only have come from a caller that ignored what the region said about itself" — presence-based, contradicting `edit.ts:1159`. Because AC-988 is the AC that enumerates *all four* refusal classes, it is the more load-bearing of the two statements | Restate the fourth bullet as an entry that **changes** a read-only field. Also tighten the verification, which currently says only "Submit a value for a field the region offered read-only" — name a value *differing* from the one reported, and add that echoing the reported value is accepted, so the UAT pins the rule that actually holds |
| 3 | warning | consistency | AC-1122 (`acceptance_criterion-66f57a24`) | ac-edit | "**Absent is the default.** Setting a field back to the value it has when nothing is declared *removes* the parameter" is stated of every parameter. Two have no such value and no delete path: `fontSizePx` (`edit.ts:876-887` — writes or no-ops) and `fontWeight` (`:888-907` — writes or no-ops on the seeded value; the enum offers no empty option). Mirrors REPORT-2080 finding 2 at the AC layer; no intent asks for one (REQ-136's identity-removal is scoped to framing, REQ-135's to italic and capitalisation) | Narrow to the parameters that *have* an identity — "a field that has a value at which it says nothing is removed when set back to it". Keep the rest of the AC unchanged; the no-empty-container and no-op-is-no-diff halves are true of all four typography fields. Sequence after the story-body repair so both read the same |
| 4 | warning | exclusivity | AC-1024, AC-1026, AC-1045, AC-1048, AC-1111 vs AC-992 (`acceptance_criterion-9561711e`) | ac-edit | AC-992 owns origin parity for both region kinds ("the same single endpoint for a change of words and a change of image"). Five other ACs restate it: AC-1024 and AC-1045 ("Assert the same answer is returned when the region is read through the builder origin"), AC-1026 (twice, criterion and verification), AC-1048 ("Assert the refusal is reported identically from the command line and through the builder origin"), AC-1111 ("Assert the declaration is present in the answer read through the builder origin"). **Carried unrepaired from REPORT-1614 F1 and REPORT-1742 F1, and now spread from two ACs to five** | Drop the origin clauses from all five; leave AC-992 sole owner. Do **not** narrow AC-992 to copy. Worth repairing this cycle rather than deferring a fourth time — the pattern is propagating into each new AC batch |
| 5 | warning | exclusivity | AC-983 + AC-1026 | ac-edit | AC-983 owns atomicity ("applied as a single atomic change however many fields it names… a well-formed map results in exactly one modified page document"); AC-1026 restates its multi-field half for images ("one change, not two… a single operation producing a single diff"). Carried unrepaired from REPORT-1614 F2 and REPORT-1742 F2 | Reduce AC-1026's second paragraph to what AC-983 does not cover — that *both* fields are reported as changed — and let AC-983 own the one-diff claim |
| 6 | warning | exclusivity | AC-980 + AC-990 | ac-edit | The "a long or multi-line value asks for a multi-line control, a short one does not" rule is asserted in AC-980 (criterion and verification) and again in AC-990 ("together with a request for a control able to display it in full" / "assert… the multi-line control is requested"). AC-990's distinct core — overflowing copy is *accepted* and reads back character-for-character — is not duplicated. Carried unrepaired from REPORT-1614 F3 and REPORT-1742 F3 | Keep the rule in AC-980, which owns the descriptor shape; reduce AC-990 to the full-fidelity readback it uniquely covers |
| 7 | warning | coverage | STORY-100 (`story-37a3921b`) body ← AC-980, AC-990 | story-body-edit | REQ-117 asks that copy longer than its box remain legible in full on reopen; AC-990 asserts it and AC-980 asserts the multi-line-control rule serving it. The story body carries **no** corresponding language — a full read of all 525 lines finds no mention of overflow, truncation, legibility or a multi-line control anywhere in In scope, Out of scope or Technical Context. The ACs are correct and intent-grounded (`widgetFor`/`MULTILINE_AT`, `edit.ts:180-186`); the gap is upward, so this is not AC drift, but two ACs still have no parent bullet. **Carried unrepaired from REPORT-1742 F4; this cycle's story-level check (REPORT-2080) did not re-detect it** | Add to the "Asking what a region exposes" bullet, or as a further in-scope bullet: overflowing copy is accepted, reads back in full and is never truncated or elided, and a long or multi-line value asks for a control able to display it whole |

## Notes for the Editor

**Sequence.** Findings 1 and 2 are the only ones that must be repaired for this
level to pass, and both are one sentence. They are the same sentence as
REPORT-2080 finding 1 on the story body — repair all three together so the story
body, AC-988 and AC-1120 state the rule identically, and do it before REQ-139
reconciles, or REQ-139's own edit lands on three statements that are already
wrong. Finding 3 is the AC-layer twin of REPORT-2080 finding 2 and is best
repaired in the same pass.

**The regression is upstream of the ACs, not in them.** Every one of the 33 ACs
is on the correct side of the surface's actual behaviour except in this single
locked-field sentence, which the AC layer inherited verbatim from the story body.
Nothing here calls for a `code-issue`: the implementation is right and
well-commented, and it is the prose that drifted from it.

**Three exclusivity warnings are now on their third unrepaired cycle**
(REPORT-1614 → REPORT-1742 → here), and finding 4 has grown from two ACs to five
in that time because each new AC batch copies the origin-parity clause from its
neighbours. They do not block this level, but they are getting more expensive to
repair, not less. If any warning is repaired this cycle, make it that one.

**Checked and confirmed aligned, not findings:** the four "current value is always
among its own options" ACs (AC-1025 image handle, AC-1047 panel background,
AC-1119 weight, AC-1131 shape) are the same correctness rule applied to four
different fields, which the story body itself frames as "the identical
correctness rule" — that is specialisation, not duplication. AC-981 and AC-1049
overlap only in seeding a painted panel with no background; each carries a claim
the other does not (AC-981 owns "an empty list is a success, not an error" and
the module-instance case; AC-1049 owns selection-only / no-empty-choice from
REQ-128), so they are not redundant. Every in-scope bullet of the story body
traces to at least one AC, and no AC describes behaviour the out-of-scope list
retires — no colour, family, geometry, alignment, upload, zoom-crop, tint, panel
framing, drag-handle or stylisation field appears in any AC.

**One deliberate story-body caveat has no AC, and does not need one.** The body
records that a framing control's whole-number resolution means an AI-set
fractional value is reported at the nearer whole number and rewritten on re-save
— the single exception to "a save that changes nothing changes nothing". No AC
states it, and none contradicts it: AC-1132 and AC-1122 both exercise the no-op
re-save against values the region itself reported, which are already whole
numbers. Recorded so a later cycle does not read the silence as a coverage gap.
