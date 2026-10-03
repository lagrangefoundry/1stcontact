---
uid: bug-a78cf9fb
id: BUG-180
type: bug
title: 'fold: the reflow-window hold writes segments onto responsiveLayout, so any
  page with a layout switch fails repro outright'
created_by: EPIC-12
created_at: '2026-10-03T17:23:19.154669+00:00'
updated_at: '2026-10-03T18:08:13.436330+00:00'
completed_at: null
last_field_updated: status
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