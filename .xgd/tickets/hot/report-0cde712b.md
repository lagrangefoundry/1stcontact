---
uid: report-0cde712b
id: REPORT-3778
type: report
title: 'Capability-Intent Alignment: Structured Copy Editing: One Validated, Atomic
  Write Path (level=uat)'
created_by: xgd
created_at: '2026-09-10T18:52:01.284759+00:00'
updated_at: '2026-09-10T18:52:01.284759+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-f753cecd
  level: uat
  violations: 3
  warnings: 2
  needs_review_count: 0
---

# Capability-Intent Alignment: Structured Copy Editing: One Validated, Atomic Write Path
# Level: uat

**Result**: FAIL
**Violations**: 3
**Warnings**: 2
**Needs review**: 0

Anchor report: report-e37a6b4a · Capability: capability-f753cecd (CAP-86) ·
Story: story-37a3921b (STORY-100, `story_kind: upgrade`) · 43 active ACs ·
previous_attempt_count: 3.

## Cumulative Intent Considered

The capability carries one story, whose `intent_uid` is BUNDLE-16 and whose
`updated_by` is BUNDLE-19. Both bundles are fully reconciled, and every intent
the in-scope UATs cite by ID is `free_and_reconciled`. **No intent in this
capability's ledger is abandoned, deprecated or wont_fix**, so no UAT rests on a
retired behaviour and Step 2.5's stale-vehicle-citation case is not triggered
anywhere.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-82 | free_and_reconciled | 2026-07-20 | L1 substrate + safety envelope — the structured-only invariant this surface inherits | YES |
| REQ-117 | free_and_reconciled | 2026-07-31 | Copy editing end-to-end: address → fields → validated diff → re-render (the write path itself) | YES |
| REQ-118 | free_and_reconciled | 2026-07-31 | Image selection as the second half of the same surface (`src`, `alt`) | YES |
| REQ-119 | free_and_reconciled | 2026-07-31 | Request-time draft/edit renders — moved *where* "both views current" is observed | YES |
| BUNDLE-16 | free_and_reconciled | 2026-08-07 | REQ-117 + REQ-115 + REQ-44 — the story's originating intent | YES |
| REQ-132 | free_and_reconciled | 2026-08-12 | `format: 'image'` declared on the field itself | YES |
| REQ-133 | free_and_reconciled | 2026-08-12 | Palette popup — the component a colour field opens | YES |
| REQ-135 | free_and_reconciled | 2026-08-12 | Text properties: size, weight, italic, capitalisation beside the words | YES |
| REQ-136 | free_and_reconciled | 2026-08-12 | Non-destructive image framing and colour adjustment | YES |
| REQ-137 | free_and_reconciled | 2026-08-12 | `shade` on the reference replaces named steps | YES |
| REQ-140 | free_and_reconciled | 2026-08-15 | Colour: a run's text colour and a panel's fill, from the palette | YES |
| BUNDLE-19 | free_and_reconciled | 2026-08-18 | REQ-133 + BUG-35 + REQ-131 + REQ-140 + REQ-139 + REQ-123 + REQ-141 + REQ-144 + REQ-142 — the story's `updated_by` | YES |

## Alignment Ledger

Every one of the 43 active ACs has at least one substantively-named UAT. The
evidence set is 53 test functions across 7 files, all of which drive **real entry
points only** — the command line through `run(argv)` (argv in, `{ok,data}` /
`{ok,error}` envelope and exit code out), the builder origin over HTTP through
`startBuilder`, and the bytes of the draft page document and the rendered
channels on disk. **No internal component is mocked anywhere in the evidence
set**, and no test is skipped, focused or `todo`. The evidence-validity rules are
satisfied; every finding below is about *completeness of a test against its own
AC*, never about test shape.

| Element | AC(s) | Intents aligned to | Outcome |
|---|---|---|---|
| `reconciliation-copy-edit-write-path.test.ts` | 980–992 (13) | REQ-117, REQ-118, REQ-119, REQ-82 | aligned |
| `reconciliation-copy-edit-image-selection.test.ts` | 1024–1027, 981, 986, 988, 991, 992 | REQ-118, REQ-136 | aligned |
| `reconciliation-copy-edit-background-selection.test.ts` | 1045–1049 (5) | REQ-118, REQ-140 | gap: AC-1045's palette clause unverified (F1); AC-1049 clauses partly cross-covered (F4) |
| `reconciliation-copy-edit-field-format.test.ts` | 1111 | REQ-132, REQ-140 | aligned |
| `reconciliation-copy-edit-typography.test.ts` | 1117–1122, 980, 988, 991 | REQ-135, REQ-140 | gap: AC-1117's no-declared-weight clause unverified (F2) |
| `reconciliation-copy-edit-image-framing.test.ts` | 1129–1132, 1121, 1122 | REQ-136 | gap: AC-1130's hue/blur no-conversion clause unverified (F3) |
| `reconciliation-copy-edit-colour-and-availability.test.ts` | 1269–1278 (10) | REQ-140, REQ-133, REQ-137 | aligned (F5 is a minor render-side gap) |

Exclusivity: seven ACs carry more than one test (980, 981, 986, 988, 991, 992,
1121, 1122). Each multi-test AC was inspected; none is a redundant duplicate —
see the info rows below.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | AC-1045 / `test_UAT_AC1045_a_painted_panel_exposes_one_closed_picker_for_the_background_it_carries` (`tests/reconciliation-copy-edit-background-selection.test.ts:284`) | uat-edit | AC-1045's criterion states "The site's palette entries travel back with that answer, so a caller can draw the choices it offers without a second call", and its Verification requires a seeded site "whose definition declares a palette" and "Assert the site's palette entries come back with the same answer". The test never reads `data.palette`, and its fixture (`seedSite`, line 100) sets only `base.assets` — `cmdNew`'s scaffold declares no palette (`tools/generate/src/cli/scaffold.ts:30-45`, "a starter page needs no palette"), so the clause is not merely unasserted but unverifiable in this fixture. The behaviour is implemented for every region kind at `tools/generate/src/cli/edit.ts:652` (`...(base.palette ? { palette: base.palette } : {})`) and is asserted only for a **run** (`colour-and-availability.test.ts:598`, `:622`) — never for a painted panel. A regression that withheld the palette from a panel's answer would ship green. | In `seedSite`, set `site.palette` to a known map; in the AC-1045 test assert `got.data!.palette` equals it (and that the origin's answer at `:364` carries it too), mirroring `colour-and-availability.test.ts:598` |
| 2 | violation | consistency | AC-1117 / `test_UAT_AC1117_a_copy_region_reports_how_the_run_is_set_beside_its_words` (`tests/reconciliation-copy-edit-typography.test.ts:337`) | uat-edit | AC-1117's Verification requires: "address a run on the same page that declares **no** weight of its own and assert the reported weight is the lowest face the document declares; re-post that reported value alongside new words and assert the save succeeds and reports the words alone as changed." No such run exists in the fixture — every run in `seedPage` declares a `fontWeight` (headline 700, lede 600, giant 400, inherited 400, full 400, long 400, slide 700), and the one run without one (`A_SYSTEM`, line 137) is in a family declaring no faces, so it is offered no weight field at all and cannot exercise the clause. Both halves are implemented and distinguishable: `packages/site-schema/src/l1/edit.ts:564` reports `String(axes.fontWeight ?? weights[0])`, and `:1317` makes a re-post of that derived value a no-op (`axes.fontWeight === undefined && String(next) === String(current)`). Neither line has covering evidence. | Add a run with a faced family (`SATOSHI_STACK`) and no `fontWeight` axis; assert its reported `fontWeight` is `'400'`, then `set(addr, { text: <new>, fontWeight: '400' })` and assert `changed` is `['text']` alone |
| 3 | violation | consistency | AC-1130 / `test_UAT_AC1130_colour_is_adjusted_in_percentages_over_the_fractions_the_definition_holds` (`tests/reconciliation-copy-edit-image-framing.test.ts:344`) | uat-edit | AC-1130's Verification requires "Assert that the hue shift and the blur are held under the same name the control offers, with **no conversion** between what is submitted and what is stored", and "Save **each** of those controls back to its own identity — a hundred for brightness, contrast and saturation, zero for black-and-white, the hue shift and the blur". The test submits only `saturatePct`, `grayscalePct` and `brightnessPct`; `hueRotateDeg` and `blurPx` are never written through this surface in **any** of the 7 in-scope files (they appear only in `reconciliation-l1-*` fold/renderer tests, a different capability). The no-conversion property is exactly the discrimination the AC exists to draw and is a distinct code path: `edit.ts:795-798` give the four percentage controls `scale: 100` while `:799-800` give hue and blur `scale: 1`. The test's only mention of them (`:379-381`) asserts they are *absent* when never submitted, which cannot see a wrong scale. `contrastPct` is likewise never returned to its identity. | Extend the change map to include `hueRotateDeg` and `blurPx` at non-identity values; assert `draftAxes(A_PLAIN).filter` holds `{ hueRotateDeg: <same>, blurPx: <same> }` un-converted beside the converted fractions, and add `contrastPct: 100`, `hueRotateDeg: 0`, `blurPx: 0` to the return-to-identity sweep |
| 4 | warning | consistency | AC-1049 / `test_UAT_AC1049_a_painted_panel_with_no_background_offers_no_picker` (`tests/reconciliation-copy-edit-background-selection.test.ts:374`) | uat-edit | Two clauses of AC-1049's own Verification are absent from its own test. (a) "Assert a value written into the fill of a panel that declared none lands in the draft and the re-rendered page paints it" — the test writes no fill at all, and neither `A_FILL_ONLY` (`surfaceFill: '#f4f0e8'`) nor the appended `A_EMPTY_HANDLE` (`surfaceFill: '#0a0a0a'`) declares none. The behaviour *is* proven, cross-AC, by `test_UAT_AC1270` (`colour-and-availability.test.ts:667`, `:673-676`) writing `{ ref: 'moss' }` into `A_BARE_BOX`, which carries only a radius — which is why this is a warning rather than a violation. (b) "no control on either form can clear a fill" is untested (only the background-add back door at `:415` is). | Either write a fill into a panel declaring none in AC-1049's own test, or record the cross-AC delegation explicitly in the test comment; add a refusal assertion for a fill-clearing attempt |
| 5 | warning | consistency | AC-1269 / `test_UAT_AC1269_a_run_exposes_its_colour_and_writes_only_a_palette_reference` (`tests/reconciliation-copy-edit-colour-and-availability.test.ts:566`) | uat-edit | AC-1269's Verification asks that the re-rendered page "paints the colour that entry resolves to **at that position**". The un-shaded case is render-asserted (`:607`, `renderedHtml` contains `PALETTE.brand.value`), but the shaded reference written at `:611` (`{ ref: 'ink', shade: -0.25 }`) is asserted only against the stored axes at `:612` — the render is never read, so shade resolution (which produces a hex distinct from the entry's own `value`) has no covering evidence here. | After `:612`, assert the re-rendered page carries the hex `ink` resolves to at `shade: -0.25` |
| 6 | info | exclusivity | AC-980, AC-981 (two tests each) | — | The write-path and typography copies of AC-980, and the write-path and image-selection copies of AC-981, overlap substantially and share one shape (CLI envelope). They are not redundant: each file's header states it re-asserts the criteria its phase *widened*, and each copy adds a distinct claim (typography's AC-980 asserts the words stay **first** now the list is longer than one; image-selection's AC-981 contrasts the empty list against an image region's non-empty one). Kept as deliberate re-assertion, not duplication. | none |
| 7 | info | consistency | AC-986, AC-988, AC-991, AC-992, AC-1121, AC-1122 (multi-test) | — | Each multi-test AC divides genuinely complementary ground rather than repeating: AC-986 copy-edit vs image-edit validation; AC-988 per-field shape families (text, enum, integer, boolean, read-only); AC-991 literal text, alt-attribute escape path, and the five-shape sweep; AC-992 words vs images over the origin; AC-1121 and AC-1122 a run's size vs a picture's bounds, which `image-framing.test.ts:446-451` documents as REQ-136 widening what "every bounded control" means. | none |

## Notes for the Editor

**One cross-cutting pattern accounts for all three violations.** Each is a
clause of an AC's own `## Verification` section that names a *second* case
alongside a first, where the fixture only supplies the first: a site *with* a
palette beside one without (F1), a run declaring no weight beside runs that do
(F2), an un-converted control beside converted ones (F3). In each case the
first case is asserted thoroughly and the second is silently absent. The fix
shape is the same throughout — extend the fixture with the missing contrast case
and add the assertion; **no test needs rewriting and no production code is
suspected.** Every behaviour behind these three findings was checked against the
implementation and found already correct (`edit.ts:652`, `:564`, `:1317`,
`:795-800`), so these are `uat-edit` repairs, not `code-issue`s.

**Do not widen the fix beyond the named clauses.** The 43 ACs of this story are
densely cross-referential — several deliberately assert the *absence* of a field
that a neighbouring AC asserts the presence of (AC-1045 vs AC-1049 vs AC-1270 on
a panel's fill; AC-1024 vs AC-1049 on an image region's field list). The test
comments record, at length, which counts were deliberately relaxed to
`toBeGreaterThan(0)` or `.slice(0, 2)` when a later REQ grew a field list
(`background-selection.test.ts:338-342`, `:425-427`; `image-selection.test.ts:309-311`,
`:391-393`). Re-pinning any of those counts while fixing F1–F3 would falsify a
neighbouring AC that is currently correct.

**On the aggregate fields.** `capability-f753cecd.uat_coverage` and
`story-37a3921b.uat_coverage` both read `fail`, and none of the 43 ACs carries a
`uat_coverage` field at all. Those fields are owned by check/fix_uat_coverage,
not by this check, and this report does not set them; F1–F3 are the alignment
defects this level found, and they are independent of whatever the coverage
gate is separately reporting.

**Scope confirmed clean.** `reconciliation-copy-edit-colour-row.test.ts`
(AC-1279..1281) and `reconciliation-copy-edit-control-availability.test.ts`
(AC-1282..1283) also seed a palette and name copy-edit ACs, but those ACs belong
to the browser-gesture/chrome capability that CAP-86's body explicitly places
out of scope ("how a click becomes an address in a browser… the chrome that hosts
it"). They were not counted as evidence for any of the 43 ACs here.
