---
uid: report-06cfcf1e
id: REPORT-1873
type: report
title: 'Reconciliation Review: commits (REQ-135 phase A — a text run''s typography)'
created_by: xgd
created_at: '2026-08-12T18:45:47.421384+00:00'
updated_at: '2026-08-12T18:45:47.421384+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: reconciliation_review
  subject_uid: request-a8ccd0dd
  anchor_uid: request-a8ccd0dd
---

# Reconciliation Review: Story Coverage

**Result**: PASS
**Mode**: commits
**Surface**: —
**Anchor**: request-a8ccd0dd (REQ-135, phase A)
**Commit**: `35f0cb90` (on this branch as `eba1c3385`)
**Stories Reviewed**: 2 — story-37a3921b (STORY-100), story-3bf94bd4 (STORY-101)

## Behavior Inventory

Fourteen behaviors read independently from the diff (`packages/site-schema/src/l1/edit.ts`, `tools/generate/src/cli/edit.ts`, `apps/control-app/src/builder/editor.js`, `builder.css`), not taken from the plan's inventory.

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | `copyFieldsOf` derives four typography fields beside the copy field, which stays first | Covered | story-37a3921b | AC-1117; AC-980 rescoped to "leads with" |
| 2 | Size withheld where the run declares none | Covered | story-37a3921b | Recorded as an intent divergence, not absorbed |
| 3 | Weight withheld where fewer than two options exist | Covered | story-37a3921b | AC-1117 asserts the withholding on `A_SYSTEM` |
| 4 | `primaryFamily` matches the FIRST family of the run's CSS stack | Covered | story-37a3921b | AC-1119; asserted against a four-name stack |
| 5 | `weightChoices` = declared weights ∪ the run's own | Covered | story-37a3921b | AC-1119; `A_LEDE` is weight 600, undeclared |
| 6 | Italic locked only on positive evidence of absence | Covered | story-37a3921b | AC-1120; §9.2 amendment |
| 7 | `typeError` — per-descriptor type check replaces the blanket string check | Covered | story-37a3921b | AC-988 modified accordingly |
| 8 | `rangeError` — skipped when the value equals what the derivation reported | Covered | story-37a3921b | AC-1121 |
| 9 | A `locked` field is refused outright | Covered | story-37a3921b | AC-988 (modified) + AC-1120 |
| 10 | `scaleTrack` — every `responsive.fontSizePx` keyframe scaled by one ratio, segments untouched | Covered | story-37a3921b | AC-1118 — the criterion this phase lives on |
| 11 | `writeTypography` — assignment into the existing axes bag; absent-is-the-default | Covered | story-37a3921b | AC-1122 |
| 12 | `segmentOptions` supplies the PAGE document's faces, incl. inside a module slot | Covered | story-37a3921b | AC-1117's slot clause; asserted on `A_SLIDE` |
| 13 | The dialog's two forms, split by descriptor type; merged staging and dirty state | Covered | story-3bf94bd4 | AC-1123 |
| 14 | `openLoneControl` counted over the box's fields; label drop scoped to the box | Covered | story-3bf94bd4 | AC-1044, AC-1039 both modified |

No uncovered behaviors.

## Intent Fidelity

Both divergences between REQ-135's body and what shipped are **explicitly flagged in the stories rather than silently absorbed**:

- **Size on a run that declares none.** Intent §4 says the control seeds from the rendered value and the first change writes an explicit axis; the code withholds the control instead. STORY-100's *"Where the intent and the implementation differ"* records this verbatim, states the reasoning (the rendered value lives in the browser, not the page), and — correctly — leaves the intent's version *open rather than refuted*.
- **The italic lock.** Intent §5 said "locked where no italic face is declared"; §9.2 of the ticket itself amends this to positive evidence of absence. STORY-100 records the amendment and why the original would have disabled a working control.

STORY-101 likewise records the pre-existing "opens nothing" vs "nothing to edit here" divergence, and documents the two rescoped criteria as *rescoped, not relaxed*.

## Ungrounded Stories

None. Every claim in both stories maps to a behavior in the diff.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. Structured copy editing — the write path (upgrade, 3pts) | story-37a3921b | ✓ +6 ACs (AC-1117…AC-1122), 3 modified (AC-980, AC-988, AC-991) |
| 2. In-page copy editing — the dialog's two forms (upgrade, 2pts) | story-3bf94bd4 | ✓ +1 AC (AC-1123), 2 modified (AC-1044, AC-1039) |

Both items produced output. All five criteria the plan required *modified* were verified individually and each carries the narrowed claim rather than a relaxed one — AC-980 now leads with the words rather than claiming they are the only field; AC-991 enumerates all four control shapes; AC-988 tests per-descriptor shape and adds the read-only refusal; AC-1044 and AC-1039 are both scoped to the box.

## Evidence Sufficiency (Step 5b)

All seven new ACs carry UATs, and I executed them rather than reading the quality report:

- `tests/reconciliation-copy-edit-typography.test.ts` — AC-980, AC-988, AC-991, AC-1117…AC-1122
- `tests/reconciliation-copy-edit-parameter-sheet.test.ts` — AC-1123
- `tests/reconciliation-copy-edit-form-presentation.test.ts` — AC-1039, AC-1044

**Verified by execution**: 16 passed (typography + FC REQ-135), 9 passed (parameter sheet + form presentation), 86 passed across the nine suites amended by §9.3. **111 tests, 0 failures, 0 skips.**

Quality of the evidence, not merely its presence:

- Every typography UAT drives the **real `1c` entry point** (`cmdNew`/`cmdRender`/`run` imported from `tools/generate/src/cli`), argv in and an `{ok,data}`/`{ok,error}` envelope plus exit code out. Nothing internal is stubbed — no `vi.mock`, no stubs anywhere in either file.
- Observables are the **bytes of the draft document** and the rendered page, not return values of the function under test. Refusal tests capture `draftBytes()` before and assert byte-identity after.
- AC-1123's UAT partitions the box and sheet **against the descriptors the origin actually reports** (`type === 'string'` vs the rest) rather than a hardcoded field list — so a split keyed on the region kind or on the literal name `text` would fail it. Its height-bound clause is measured in a real Chromium, with the viewport narrowed until the bound genuinely binds rather than asserted against a fixed window.
- No AC is evidenced by source inspection. No AC would survive its behavior being removed: AC-1118 asserts the specific scaled keyframe values (36/54/72 → scaled), so both cheap wrong implementations — writing the axis alone, and flattening the track — fail it.
- The parameter-sheet suite did **not** skip, despite STORY-101's recorded caveat about the out-of-band component install.

## Judgment Calls

- **`textTransform` shipped as a four-value enum where intent §6's table said "Uppercase … toggle" — accepted, not failed.** The ticket's own §9, written after implementation, re-describes the field as "capitalisation" rather than "uppercase", which reads as the operator adopting the broader control; and a two-valued toggle over a four-valued axis would silently destroy a run set in `capitalize`. This is intent-internal evolution (§6 → §9), the same shape as the §5 → §9.2 italic amendment. Recorded here rather than treated as absorbed divergence, since it is the one such change the stories do not name explicitly.
- **The weight fallback is undocumented but unreachable — acceptable omission.** Where a run declares no `fontWeight` and its family declares ≥2 faces, the derivation reports `weights[0]` as the current value, which a save would then write — the symmetric fabrication the story explicitly refuses for size. I measured both real sites in `storage/sites`: **0 of 139 text runs lack `fontWeight`** (and 0 lack `fontSizePx`), so the path has no observed instance, matching §9.1's report that the size guard never fires. An internal detail of an unreachable branch, not a behavior a developer would meet. Worth a glance if a future fold stops writing an explicit weight.
- **Two guards named in ACs but without dedicated FC evidence** — the size withholding and the weight withholding — are both asserted inside the AC-1117 UAT (`A_INHERITED`, `A_SYSTEM`) as clauses rather than as separate tests. The plan's closing uncertainty about whether they warranted their own assertions is therefore resolved in favour of clauses, which is adequate: each has a specific assertion that would fail if the guard were removed.
- **Eight FC files from earlier tickets remain on disk** (REQ-122 ×3, REQ-126, REQ-127 ×2, REQ-129, REQ-130). Not this reconciliation's business and no item claims them; flagged only in case `check_fc_orphans` does not distinguish them from REQ-135's.

## Verdict

**PASS.** Stories accurately and completely document the behavior surface, and — the harder test — they represent the *operator's intent* rather than merely the code's behavior: both places where the implementation departed from REQ-135's body are named, reasoned and, in the size case, left open rather than retroactively justified. All fourteen behaviors are covered, both plan items produced output, all five required AC modifications landed as narrowings rather than relaxations, and every new AC is proven by a UAT that drives the real entry point and asserts an observable that a broken implementation would fail. A developer reading these two stories would have a correct mental model of what this code does and of what it was asked to do.
