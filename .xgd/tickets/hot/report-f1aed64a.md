---
uid: report-f1aed64a
id: REPORT-3791
type: report
title: 'Fix Site Materials & Starting Point: Scaffold, Assets, Provenance & Palette
  (uat) — attempt 5'
created_by: xgd
created_at: '2026-09-10T20:22:31.735762+00:00'
updated_at: '2026-09-10T20:22:31.735762+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-b4ac88fc
  level: uat
  fixes_applied: 6
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — Site Materials & Starting Point: Scaffold, Assets, Provenance & Palette (uat)

**Attempt**: 5
**Fixes applied this call**: 6
**Violations remaining**: 0
**Needs more work**: false
**Commit**: `b8399b2fcf`

All three violations and both warnings from `report-dde93f42` are discharged. No
finding was left for a later iteration.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | uat-edit (delete) | `tests/reconciliation-colour-census-and-retrofit.test.ts` | Deleted the whole file (`git rm`). It claimed AC-939…AC-947 a second time in the same test shape, with four byte-identical test function names. Discharges **finding 1**. |
| 2 | uat-edit | `…census-and-retrofit.test.ts:548 test_UAT_AC944_render_is_byte_identical_before_and_after_the_retrofit` | Removed with the file above. It asserted the pixel-identity guarantee AC-944's own body says it supersedes (retired by REQ-137, `request-d2980a95`), and passed — reading as green evidence for a retired guarantee. Discharges **finding 2**. |
| 3 | uat-edit | `tests/reconciliation-colour-palette-overlay.test.ts` — the `AC-932` describe block (was lines 477-577) | Deleted the block. Its two substantive assertions are the claims attempt 5's ac-level repair *moved off* AC-932: palette shrink, now solely AC-941's (`48360aec`), and colour-losslessness, now solely AC-944's (`3127e56f`). Its colourless tail stopped at `cmdColors(...).colors === []` and never ran the retrofit, so it reached none of AC-932's three current bullets. Discharges **finding 3**. |
| 4 | uat-edit | `…palette-overlay.test.ts:1-32, 30-48` | Docblock: dropped the stale AC-932 entry, added a pointer stating the retrofit belongs to STORY-97 and naming AC-941 / AC-944 as its owners, and corrected the "real entry points" sentence, which no longer claims the `1c colors --assign` handlers. Removed the now-unused imports (`cpSync`, `fileURLToPath`, `cmdColors`, `cmdColorsAssign`, `collectColorLiterals`) and the `REPO_ROOT` constant. |
| 5 | uat-edit | `tests/reconciliation-colour-retrofit-shade-model.test.ts:2-4, :32, :759` | **Warning 4**: docblock now carries STORY-97's current title ("within a proven per-channel bound", not "without moving a pixel"), and AC-945 now reads "cannot be proved **within the bound**" — matching the retitled AC (`66e919f9`) and the test body's own `/exceeds the shade bound/i` matcher. Also fixed the same stale word in the AC-945 section banner. |
| 6 | uat-edit | `tests/reconciliation-site-asset-listing.test.ts:8-10, :219, :247` | **Warning 5**: "asset **directory**" → "asset **store**" in the docblock and in the AC-1018 / AC-1019 inline comments, per the AC rewording that followed REQ-142 (`request-0dd62a5d`) moving the filesystem behind the async `SiteStore` port. Wording only; the tests drive `run(argv)` / `startBuilder`, above the port. |

## Verification

Both affected suites and the rest of the capability's UAT files were executed,
not merely read:

| Command | Result |
|---|---|
| `npm test -- --project node tests/reconciliation-colour-palette-overlay.test.ts tests/reconciliation-colour-retrofit-shade-model.test.ts` | **2 files, 16 passed, 0 failed** (19.0s) — overlay is 4 tests (AC-928…AC-931) after the AC-932 removal; shade-model is all 12 |
| `npm test -- --project node tests/reconciliation-site-asset-listing.test.ts tests/reconciliation-scaffold-starter-l1.test.ts tests/reconciliation-font-provenance.test.ts` | **3 files, 25 passed, 1 skipped, 0 failed** (2.1s) — the skip is AC-871's `it.runIf(chromiumAvailable())`, the environment property recorded as info 6 |

No test that was not touched changed state. No regression introduced.

## Coverage after the deletions — nothing lost

Checked before deleting, per the report's own "before deleting, nothing needs
porting" note, and re-verified here against the surviving file:

- **AC-941's "materially smaller" claim** is asserted at
  `…shade-model.test.ts:456-471` against the real stored `xgd` site, and it is
  *measured* (censuses first, then asserts `entryCount < literalCount / 2`)
  rather than compared to counts baked into the test — strictly better evidence
  than the deleted overlay assertions, which hard-coded `{distinctRgb: 16,
  entries: 7}` and `{30, 15}`.
- **AC-944's "no colour lost / no colour moved" claim** is asserted at
  `…shade-model.test.ts:684-717`: every reference paired with the literal that
  occupied its own position, byte-exact where unshaded, ≤ 8/255 where shaded,
  alpha byte-identical throughout, and the painted-slot count unchanged.
- **`gigabytealchemy`**, the second stored site the deleted overlay test read,
  is still exercised — at `…shade-model.test.ts:1065` (AC-1146).
- **AC-932's floor case** is covered at `…shade-model.test.ts:988`, which was
  correctly updated in `1a027575a4` and covers all three of the AC's bullets.

## Code Edits

None this call. Every fix was a test-file mutation; no production code was
touched, and no finding was categorized `code-issue`.

## Ticket Mutations

None required. All five findings were categorized `uat-edit`, and no AC's
`uat_coverage` changed: every AC whose duplicate test was deleted retains a
substantive UAT in the surviving file, so `pass` remains correct for all of
them. No AC was added, deprecated or re-worded — this level's lever is the test
files, and the ac level passed at 20:09Z (`report-6c22789e`).

## needs_review Items Forwarded

None. The report recorded 0 `needs_review` items, and nothing in this call's
work reached an ambiguity requiring an operator decision.

## Note for the assessor

The report's warning stands and is worth repeating: a green test is not evidence
of alignment. Both deleted tests passed. The check at this level should keep
reading what a test asserts against the AC body rather than trusting
`uat_coverage: pass` on AC frontmatter.
