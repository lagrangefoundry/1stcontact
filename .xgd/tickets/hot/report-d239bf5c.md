---
uid: report-d239bf5c
id: REPORT-3764
type: report
title: 'Fix Structured Copy Editing: One Validated, Atomic Write Path (story) — attempt
  4'
created_by: xgd
created_at: '2026-09-10T17:10:49.300002+00:00'
updated_at: '2026-09-10T17:10:49.300002+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-f753cecd
  level: story
  fixes_applied: 3
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — Structured Copy Editing: One Validated, Atomic Write Path (story)

**Attempt**: 4
**Fixes applied this call**: 3 body mutations (1 `xgd ticket update` per push, 2 pushes)
**Violations remaining**: 0
**Needs more work**: false

Note on prior attempts: STORY-100's body carried `updated_at 2026-08-20` when this
call started — i.e. attempts 1–3 of this loop landed **no** story-body edit. This
call is the first to mutate it.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | story-body-edit | STORY-100 (story-37a3921b) | **Finding 1 (violation), repaired.** In-scope bullet "Leaving no trace when nothing changed" no longer claims the universal. It now reads "Every parameter that *has* a value at which it says nothing — each framing and shape axis at its identity, italic when it is off, capitalisation when it is none — is *removed* when a control is set back to it rather than recorded", and adds the exclusion explicitly: "Not every parameter has one: a size, a weight and a colour have no setting that means 'nothing declared' — a run inherits each of them when the axis is absent rather than falling to a default this surface could write back — so those controls change a parameter and never clear one, and clearing them is the AI's business, exactly as it already is for a panel's fill and its background image." The group-pruning clause, the canonical-colour-reference clause and the "an edit that changes nothing … byte-for-byte" clause are preserved verbatim, per the report's scope-of-repair note. |
| 2 | story-body-edit | STORY-100 (story-37a3921b) | **Finding 2 (warning), repaired.** In-scope bullet "Refusing a change and never the status quo" no longer says "Every one of those field refusals". It now names the three that take a `current` — "Every one of those field refusals that measures a value against a bound, against this site's palette or against a field's unavailability measures it against what the region *just reported*" — and routes the other two to the mechanism the body already states correctly: "a value of the wrong shape for its field is refused on its shape alone, and a value that is not one of the options the region offered cannot be the one the region holds, because a region's options always include its own current value." The saved-form / re-post-is-a-no-op clause is unchanged. |
| 3 | story-body-edit | STORY-100 (story-37a3921b) | **Same pattern, caught adjacent in Technical Context.** The bullet "Every one of these controls has a value at which it says nothing, and it is not the same value for all of them" sat after the vocabulary/projection bullets, where "these controls" could be read as this surface's controls rather than the framing family it actually enumerates (fill mode, position, turn, blur, scale, saturation, plus a colour reference's shade/opacity). Scoped to "Every one of these **framing and adjustment** controls" so the corrected in-scope bullet is not contradicted two sections later. Substance unchanged — the enumeration was already correct. |

## Verification of the repair against code

Re-read before editing, at this branch tip:

- `packages/site-schema/src/l1/edit.ts:1280-1300` — `fontSizePx`: writes or no-ops; no delete branch, and `current === undefined` returns false rather than clearing.
- `edit.ts:1301-1320` — `fontWeight`: assigns or no-ops; the absent-axis case echoes the seeded value as a no-op, never a delete.
- `edit.ts:1321-1338` — `italic` (`fontStyle`) and `textTransform`: both `delete` at their identity. These are the two the corrected sentence still claims.
- `edit.ts:1251-1265` — `writeColor`: always assigns into the axes bag; prunes only `shade`/`alpha` *inside* the reference. Confirms `color` and `surfaceFill` have no clear path, matching the Out-of-scope bullet "clearing it back to nothing is the AI's business".
- `edit.ts:1064` (`typeError`) and `:1566` (unknown field) take no `current`; `:1099` (`rangeError`), `:1130-1138` (`lockError`), `:1167-1173` (`colorError`) each do. Confirms finding 2's three-versus-two split.

## Ordering asymmetry — checked, nothing to fix

The report's note asked whether any AC or UAT asserts a panel field order the surface does not promise. Checked and clear:

- **AC-1045** (`acceptance_criterion-8a3c8c3e`) enumerates with "plus, when the panel carries one" — an enumeration, not an order claim. **AC-1270** (`acceptance_criterion-c6af20ad`) makes no order claim either.
- Three UATs pin the order — `tests/reconciliation-copy-edit-background-selection.test.ts:296`, `tests/req128-background-image-selection.test.ts:236` and `:448`, all asserting `['backgroundImageUrl', 'surfaceFill']`. That is the order the derivation actually emits (`edit.ts:1022-1046`), so they assert shipped behaviour, not an unmet promise. No AC or UAT asserts the body's prose enumeration order.

## Code Edits (if any)

None this call. No test files were touched, so no test run was warranted; the three mutations are ticket-body text only.

## needs_review Items Forwarded

| Element | Assessor said | Operator decision needed |
|---|---|---|
| STORY-100 — finding 6 (info) | The body records a "Known cosmetic defect, deliberately not fixed" (a save rewrites the whole page document with different unicode escaping) as "recorded in the intent as wanting its own ticket"; no such ticket exists in the store. | Whether to file that ticket. Not created here: the finding's resolution category is "—" ("none at this level"), and creating tickets is outside the editor's remit without an explicit instruction. The body's claim stays accurate either way — it says the intent wants a ticket, not that one exists. |

## Findings 3, 4, 5

Info-only, no action required, and confirmed still accurate after these edits: finding 3 (REPORT-2080 finding 1 repaired) and finding 4 (REPORT-2080 findings 3/4 discharged) are untouched by this call; finding 5's two recorded intent↔implementation divergences remain recorded rather than absorbed, which the report states is the correct treatment.

## Coverage note (not this level's scope)

AC-1269 … AC-1278 — the ten colour-phase ACs — carry no `uat_coverage` value, while the capability reads `uat_coverage: fail`. UATs for that phase do exist (`tests/test_UAT_FC_REQ-140_segment_colour.test.ts`, `tests/test_UAT_FC_REQ-139_locked_controls.test.ts`). That field is owned by check/fix_uat_coverage and was deliberately not set here.
