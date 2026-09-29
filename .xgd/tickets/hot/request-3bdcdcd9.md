---
uid: request-3bdcdcd9
id: REQ-352
type: request
title: 'capture: a band''s content anchor is measured by DOM descent on one path and
  geometry on the other, so a hero with a header over it is permanently unmeasured'
created_by: EPIC-12
created_at: '2026-09-29T21:23:37.137276+00:00'
updated_at: '2026-09-29T21:23:37.137276+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  epic_parent: epic-bf282b3d
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-6e992690
---

# The extractor measures a band's content anchor two different ways, so a hero with a header over it has an anchor nothing can compare

## 1. What is wrong

`extract.ts` computes `contentAnchorRatio` by **two different populations**, and
which one a band gets depends only on which code path it took:

| path | function | population |
|---|---|---|
| sliced band (`extract.ts:2944`) | `anchorRatioInBox(box, runs)` | every run whose centre falls in the geometric box |
| single band (`extract.ts:2983`) | `anchorRatioOf(band, bbox)` | a DOM-descendant walk of the band element |

Those agree on a conventionally nested page and disagree exactly when a
reference section **overlaps** another — an absolutely positioned header sitting
over a hero is its own section, so its runs are not DOM descendants of the hero
and the DOM walk excludes them, while a geometric box is a partition and cannot.

The reference goes down the DOM path; the reproduction's band is geometric. The
two `contentAnchorRatio` numbers are therefore not the same measurement, and
REQ-270's guard (`values-diff.ts:3509`) correctly declines to compare them
rather than firing a phantom delta.

**The guard is right. What is missing is the other half: making the two sides
measure the same population so the comparison can happen at all.** REQ-270
taught the diff to decline and BUG-139 taught the console to count the
declination; neither made it comparable, so the axis is permanently unmeasured
on any page with this shape.

## 2. Evidence

Reference `storage/references/gigabytealchemy.ai/index`, `capture.json`:

```
§0  box y=0   height=192    ← absolutely positioned header
§1  box y=0   height=800    ← hero
```

§0 lies wholly inside §1's vertical span, so `overlappingSmallerSections`
(`values-diff.ts:3341`) matches it and the guard fires, emitting into
`values.notComparableAxes`:

```
§1.contentAnchor — "§0 sits inside this band, so the reference measured its
anchor over a DOM-descendant population that EXCLUDES those runs while the
reproduction's geometric band includes them — the two anchors are not the same
measurement and are not compared"
```

**It does not move.** Character-for-character identical across
`repro-gigabytealchemy-ai` iterations 6, 7, 8, 9 and 10 — including iteration
10, which is a fresh re-capture (`recaptured: true`, bundle captured
2026-09-29T20:39:39Z). A re-capture is the main lever that drives the unmeasured
set down, and it does not clear this.

**It is not one site.** `repro-joyfulculinarycreations-com` iterations 3 and 4
carry the same single entry, `§1.contentAnchor`. A fixed header over a
full-bleed hero is an ordinary layout, so this recurs by construction.

**It is the whole of the remaining unmeasured set.** Iteration 10's four parts
read `axes 0, bands 0, populations 0, probes 1` — the probe being this one
declination. The console tells every round `unmeasured` is "the number to drive
down" (`ai.ts:445`), and on these two reproductions that number cannot reach 0
while this stands.

**No round will file it.** Iteration 7's round examined it and recorded
`contentAnchor, character-for-character identical to iteration 6 —
REQ-270/BUG-139`, then moved on, which is correct: the brief tells a round not
to re-file a class that already has a landed ticket, and REQ-270, BUG-139 and
BUG-102 are all at `ready_to_reconcile`. The loop cannot reach this from the
inside.

## 3. Behaviour required

1. **A band's content anchor is measured over one population, whichever path the
   band took.** A run that belongs to a nested section is excluded from the
   enclosing band's anchor on BOTH sides, so the reference's DOM-descendant
   semantic and the reproduction's geometric band agree by construction rather
   than by luck of layout.

2. **The guard stops firing on a bundle captured after this lands.** A hero with
   a header over it yields a comparable `contentAnchor`, so
   `values.notComparableAxes` is empty for that shape and the unmeasured set's
   `probes` part reads 0.

3. **The guard is kept, not deleted.** A bundle captured before this change
   still carries a DOM-population anchor, and comparing it against a geometric
   one is exactly the phantom delta REQ-270 exists to refuse. The guard must go
   on declining for those, so the fix is not allowed to be "remove the check".

4. **A page with no overlapping sections is unchanged.** The ordinary nested
   page already had one population; its anchor value and its delta must not move.

## 4. Approach, and the cost that comes with it

`SectionValues` (`values-diff.ts:316`) carries only the precomputed
`contentAnchorRatio` and none of the runs behind it, so this **cannot** be
recomputed at diff time. The change belongs in the extractor, which means:

- **Reference bundles must be re-captured** to pick up the corrected anchor.
  Existing bundles keep the old value and go on being declined by behaviour 3.
- Preferred shape: teach the DOM path (`anchorRatioOf`) to exclude runs claimed
  by a nested band root, matching what geometric slicing already produces.
  Alternative — move both paths onto `anchorRatioInBox` with a nested-section
  subtraction — should be weighed during implementation; it is the more uniform
  change but touches the path every ordinary page takes, so behaviour 4 carries
  the risk.

## 5. Out of scope

- The `structural-failure` verdict on `repro-gigabytealchemy-ai` (56 backing
  surfaces leaving the content they back at 506px and 637px viewports). That is
  a real and larger defect on the same reproduction, tracked separately; this
  ticket does not make that gate pass.
- Widening `anchorTol`. REQ-270 already rejected this: a tolerance that absorbs
  a 0.14 population artefact would also absorb a real 100px content shift.