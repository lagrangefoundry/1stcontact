---
uid: bug-a78cf9fb
id: BUG-180
type: bug
title: 'fold: the reflow-window hold writes segments onto responsiveLayout, so any
  page with a layout switch fails repro outright'
created_by: EPIC-12
created_at: '2026-10-03T17:23:19.154669+00:00'
updated_at: '2026-10-03T18:18:11.229969+00:00'
completed_at: null
last_field_updated: body
status: free_coding
fields:
  severity: high
  priority: high
  defect_class:
  - fold-wrong
  epic_parent: epic-bf282b3d
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-a569eddb
---

## Symptom

Two new sites fail iteration 1 outright, with no reproduction:

- **www.hearingzone510.com** fails at `repro`, exit 1, on a long list of `…/responsiveLayout: Unrecognized key: "segments"`, e.g. `/root/children/7`, `/root/children/6/children/0/children/4`, `…/children/7`, and more.
- **www.bluelotusintegralhealing.com** fails at `repro`, exit 1: `promoteToFlow: produced an invalid L1 document — /root/children/5/children/3/responsiveLayout: Unrecognized key: "segments"; /root/children/6/children/1/responsiveLayout…; /root/children/7/responsiveLayout…`

Both bundles are at `storage/references/<host>/index`. The operator's requirement: **the engine may produce a poor reproduction, but it must always produce one.** An invalid document from one of our own passes must never end the run.

## Root cause (one cause, both sites)

`holdAcrossReflowWindows` (`tools/generate/src/l1/fold.ts:2012`) finds "responsive tracks" by **duck typing**: `tracksOf` treats any object on a node, or one level below it, that has a `keyframes` array of length > 1 as a geometry track, and in its `hold` pass writes `track.segments = […]` onto it.

`responsiveLayout` (`l1ResponsiveLayoutSchema`, `packages/site-schema/src/l1/schema.ts:393`) also has a `keyframes` array, but it is a different shape: layout keyframes with **no** `segments` key, under a `.strict()` schema. So on any page that has both of the following, the pass writes a key the validator rejects:

1. a container whose `responsiveLayout` changes between captured widths (≥ 2 keyframes), and
2. at least one reflow window, where some node `snap`s,

There are two call sites, and that is why the two sites fail in different places:

- **`fold.ts:4512`**, the fold itself, which fails hearingzone510's fold-time validation
- **`probes.ts:3629`**, inside the flow recovery ([[BUG-113]] / `b14a67f78c` "hold the tracks the recovery invents"), which fails as `promoteToFlow: produced an invalid L1 document` on bluelotus

gigabytealchemy, faelan and joyful never had a multi-keyframe `responsiveLayout` inside a reflow window, which is why this has not shown up before.

## Fix

1. **`holdAcrossReflowWindows` touches only tracks whose schema carries `segments`.** That means `geometry` and the scalar tracks (`l1GeometrySchema`, `l1ScalarTrackSchema`), selected by an explicit list of axes rather than by "has a `keyframes` array". `responsiveLayout` is left unchanged. If a layout switch inside a reflow window genuinely needs holding, that is a separate decision: add `segments` to the layout schema deliberately and have the renderer honour it, rather than smuggling the key in. The implementer records which choice they made and why.
2. **A recovery that produces an invalid document is declined, not fatal.** When `promoteToFlow` (or any later improvement pass) produces a document that fails `validateL1`, the run serves the pre-recovery document. It reports the recovery as declined, quoting the validation error, in the gate output (the same place [[BUG-113]] reports a recovery declined on cost). The fold's own output is the only document with nothing to fall back to, so an invalid fold still fails. Fix 1 removes the known cause of that.

## Test plan

`tests/test_UAT_FC_BUG-<n>_responsive_layout_has_no_segments.test.ts`:

- A synthetic L1 tree with a container whose `responsiveLayout` has 2 keyframes, plus a sibling whose geometry `snap`s across the same window: after `holdAcrossReflowWindows`, `responsiveLayout` has no `segments` key, the snapping window is still held on geometry tracks, and the document passes `validateL1`. Before the fix it fails validation with `Unrecognized key: "segments"`.
- A recovery pass that returns an invalid document: the repro serves the base document, exits 0, and the gate output names the declined recovery with the validation message.
- Real bundles, main checkout only (bundles are gitignored): `1c repro` on `storage/references/www.hearingzone510.com/index` and `storage/references/www.bluelotusintegralhealing.com/index` exits 0 and writes a page.
- Existing reflow-window UATs (BUG-142, BUG-173, REQ-278 and the `holdAcrossReflowWindows` cases) stay green.

## Verification after landing

Restart the console, then press **[recapture]** on both sites. Each should reach `gate` and render a reproduction, whatever its quality.


## Addendum: a third site, joyfulculinarycreations.com (2026-10-03)

Iteration 6 fails the same way: `promoteToFlow: produced an invalid L1 document — /root/children/14/children/3/responsiveLayout: Unrecognized key: "segments"; /root/children/19/responsiveLayout: Unrecognized key: "segments"`. This is the recovery call site (`probes.ts:3629`).

Iteration 5 on this site reached the gate. So a site that previously reproduced can begin failing when a fold change produces new reflow windows (today's `d20a12c157` is a candidate). This failure is not limited to new sites, and fix 2 ("declined, not fatal") is what keeps one bad pass from blocking a working site.

Test plan addition: `1c repro` on `storage/references/joyfulculinarycreations.com/index` exits 0 and writes a page (main checkout only).


## Implementation (what landed)

**Fix 1: choice made, `responsiveLayout` left unchanged.** `holdAcrossReflowWindows` now collects tracks from an explicit list of segment-bearing axes: `geometry`, every track under `responsive` (`fontSizePx` / `lineHeightPx` / `letterSpacingPx`), and every track under `responsivePadding`. It no longer collects "anything with a `keyframes` array". `responsiveLayout` is never touched. **Why not add `segments` to the layout schema:** the schema already documents a layout keyframe as discrete ("no `segments` companion — a layout mode has nothing to interpolate, it snaps"). A layout switch already behaves as a held window, so there is nothing for the hold to add. (`column.*.pxTrack` was outside the old one-level duck-typed reach and stays outside it, so this does not change behaviour there.)

**Fix 2: an invalid recovery is declined, not fatal.**
- `promoteToFlow` throws a typed `InvalidRecoveryError` (same message: `promoteToFlow: produced an invalid L1 document — …`) instead of a bare `Error`.
- `chooseRecovery` catches only that error type. It serves the base and returns `served: false`, `promoted: []`, `invalid: <validation detail>`, with the recovery priced as the base. Any other error still propagates, so a genuine bug still ends the run loudly.
- `RecoveryVerdict` gains `recovered` (the recovery's document, or the base when it is declined). `l1-gate` prices `recoveredFindings` from it rather than calling `promoteToFlow` a second time, which would have re-thrown.
- The output names the reason: `1c repro` prints `recovery declined: produced an invalid L1 document — <detail>` in its served-document block, and `1c l1-gate` prints the same line under its recovery line (`RecoveryCost.invalid`, `ServedEnvelope.recovery.invalid`).
- `flowL1` (the author's "stack this group" edit) refuses an invalid result as `SCHEMA_INVALID` instead of throwing.
- `RecoveryChoiceOptions.promote` is an optional override for the recovery pass. It exists so the declined path has evidence: once fix 1 is in, nothing live produces an invalid recovery.
- The fold's own output still fails if it is invalid, as specified.

## Test evidence

`tests/test_UAT_FC_BUG-180_responsive_layout_has_no_segments.test.ts`:
- `hold_writes_no_segments_onto_responsive_layout`: a row whose `responsiveLayout` switches 375→768, beside a banner whose geometry snaps across that window. After the hold, `responsiveLayout` has only `keyframes`, the row's geometry and the banner's `responsive.fontSizePx` are `snap` on that window, and the document passes `validateL1`. Verified RED without the fold fix.
- `invalid_recovery_is_declined_and_the_base_served`: `chooseRecovery` with a recovery that raises `InvalidRecoveryError` serves the base, `served: false`, and `invalid` carries the detail.
- `any_other_recovery_error_still_ends_the_run`: a non-validation error still throws.
- `real_bundles_with_a_layout_switch_reproduce` (main checkout only, because bundles are gitignored): `cmdRepro` on hearingzone510, bluelotus and joyful writes a draft, with no invalid recovery.

Manual run on copies of the three real bundles: `1c refold` then `1c repro` exits 0 for all three, and the recovery is valid on each (declined on cost, not on validity). `1c l1-gate` on bluelotus runs to a verdict. Regression scope passed: BUG-112/113/142/160/173, REQ-278/337/350, bug8-reflow, req11 structured edit (15 files, 91 tests). `tools/generate` typecheck is clean.
