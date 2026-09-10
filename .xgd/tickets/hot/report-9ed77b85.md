---
uid: report-9ed77b85
id: REPORT-3788
type: report
title: 'Fix Site Materials & Starting Point: Scaffold, Assets, Provenance & Palette
  (ac) — attempt 5'
created_by: xgd
created_at: '2026-09-10T20:02:24.888586+00:00'
updated_at: '2026-09-10T20:02:24.888586+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-b4ac88fc
  level: ac
  fixes_applied: 6
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — Site Materials & Starting Point: Scaffold, Assets, Provenance & Palette (ac)

**Attempt**: 5
**Fixes applied this call**: 6
**Violations remaining**: 0
**Needs more work**: false

All three actionable findings of `report-dffe95a9` (2 violations, 1 warning) are
applied, plus the AC-tree sweep the report's Notes asked for and the UAT re-point
finding 1 makes mandatory.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | ac-edit | AC-932 (`acceptance_criterion-9f1e7baf`) | **Finding 1.** Narrowed to its one non-duplicated criterion — the zero-colour no-op — and retitled "A site with no colour literals retrofits to an empty palette and remains valid". Claim (a) (materially-smaller palette, incl. the 7/15 "as built" figures that only supported it) dropped to AC-941; claim (b) (no colour lost, within the bound) dropped to AC-944. Not deprecated — the zero-colour case is asserted nowhere else |
| 2 | ac-edit | AC-945 (`acceptance_criterion-66e919f9`) | **Finding 2.** Retitled to the bounded gate: "A retrofit that cannot be proved **within the bound** writes nothing: the command fails with a diagnostic and every file is left untouched". Body untouched — verified clause-by-clause against STORY-97's "Bounded, reported, or nothing" bullet, as the finding directs |
| 3 | ac-edit | AC-1018 (`acceptance_criterion-4cd04340`) | **Finding 3.** "the site's draft asset area" → "the site's asset store"; "a full asset directory beside an empty declared registry" → "a full store beside an empty declared registry"; Verification's "asset directory" → "asset store". AC-1019's "on disk" left alone (entry-flag name, not adapter phrasing) |
| 4 | ac-edit | AC-1020 (`acceptance_criterion-cd61874f`) | **Finding 3 sweep.** Verification: "a site whose asset directory holds the same file" → "whose asset store holds" |
| 5 | ac-edit | AC-1021 (`acceptance_criterion-feaa4db0`) | **Finding 3 sweep.** Verification: "a site whose directory holds pictures" → "whose store holds pictures" |
| 6 | uat-edit | `test_UAT_AC932_*` (`tests/reconciliation-colour-retrofit-shade-model.test.ts:985`) | **Paired with #1**, per the report's `uat_coverage` note. Re-pointed at the zero-colour no-op and renamed to `test_UAT_AC932_a_colourless_site_retrofits_to_an_empty_palette_and_still_validates`; the stored-site shrink/no-colour-lost drive (now AC-941/AC-944 territory, and already covered by `test_UAT_AC941_*` and `test_UAT_AC944_*` in the same suite) is gone. File header docstring updated in step |

## The zero-colour wording question the report flagged

The report declined to settle whether a zero-colour retrofit writes `"palette": {}`
or omits the key, and asked the narrowed AC to say whichever the code does. Settled
from source, not guessed:

- `derivePalette` initialises `const palette: L1Palette = {}` and the family loop
  never runs on an empty census (`tools/generate/src/cli/colors.ts:539`).
- `cmdColorsAssign` spreads it unconditionally — `const nextBase = { ...base, palette }`
  (`tools/generate/src/cli/colors.ts:683`), the line the report pointed at.
- `l1PaletteSchema` is `z.record(...)` (`packages/site-schema/src/l1/palette.ts:85`),
  `.optional()` on the site (`packages/site-schema/src/schema.ts:989`), so `{}` validates.

So the key **is** written, empty. AC-932 now says "a palette with no entries — the
palette is present and empty, not populated with entries no page references", and
the rewritten UAT asserts exactly that (`toBeDefined()` on the written palette, then
zero keys), which is a stronger assertion than the old test's `toBeUndefined()` on a
*pre*-retrofit site. STORY-97's Technical Context reads consistently with this.

## Verification

`npm test -- tests/reconciliation-colour-retrofit-shade-model.test.ts` — **12 passed,
1 file passed**, 18.9s. No test outside the rewritten one changed behaviour. (The run
also emits a wrangler `EPERM` writing its own debug log to `~/Library/Preferences/.wrangler/logs/`;
that is a sandbox filesystem artifact, not a test result.)

Checked for orphans after the rewrite: `seedTemp`, `paintedPages`, `splitColor`,
`maxChannelDelta`, `collectColorLiterals` and `SHADE_FIT_TOLERANCE` all remain in use
by other tests in the file — nothing was left dangling.

## AC-tree sweep (the report's standing instruction)

Swept all `acceptance_criterion-*` bodies for `lossless`, `draft asset area`,
`asset directory` and `directory holds`. After the five edits above, **this
capability's 38-AC tree is clean**. Two hits remain repo-wide, both outside this
capability's four stories and therefore out of scope here:

| AC | Story | Hit |
|---|---|---|
| `acceptance_criterion-4d4ee569` | `story-c4f329d3` (KB corpus) | "the corpus **directory** holds one file per opted-in document" — a corpus directory, not the asset store |
| `acceptance_criterion-ed355bc1` | `story-3bf94bd4` (image picker, REQ-132) | "a site whose **asset directory** also holds a font and a stylesheet" — same REQ-142/143 adapter-phrasing shape as finding 3, but under a different capability |

The second is a genuine instance of finding 3's shape in an adjacent capability. Not
edited (scope), recorded here so its own ac-level check can pick it up.

## `uat_coverage` fields

Not written — the field belongs to `check`/`fix_uat_coverage`, not to this prompt.
AC-932 keeps `uat_coverage: pass` and that is now honest rather than stale: its test
was re-pointed at the narrowed criterion in this same call and passes, so the uat
level will not be reading evidence for a claim AC-932 no longer makes. That was the
specific hazard the report raised, and it is closed.

## Code Edits (if any)

None. The only non-ticket edit is the UAT rewrite in item 6; production code was read
to settle the palette-key question, not modified.

## Forwarded to the uat level (not blocking this level)

| Element | Issue | Recommendation |
|---|---|---|
| `test_UAT_AC932_retrofit_shrinks_the_palette_materially_and_paints_the_same_colours` (`tests/reconciliation-colour-palette-overlay.test.ts:497`) | A **second** test carries the AC-932 label, in `story-c490f1cf`'s suite (a cross-story borrow — that file's header lists AC-932 alongside its own AC-928–931). Its content is entirely the two claims finding 1 moved to AC-941 and AC-944: stored-site entry counts (16→7, 30→15) and the painted-colour multiset. It still passes, but it is now labelled for an AC it no longer proves | Either drop the AC-932 label (its substance is regression coverage for AC-941/AC-944, both of which already have their own passing tests in the shade-model suite) or fold what is unique into `test_UAT_AC944_*`. Left alone here deliberately: restructuring another story's suite is beyond this finding's scope, and AC-932 already has correct, passing evidence from item 6 |

## needs_review Items Forwarded

None. All three findings were actionable and are applied.
