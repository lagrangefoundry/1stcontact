---
uid: request-3bdcdcd9
id: REQ-352
type: request
title: 'capture: a band''s content anchor is measured by DOM descent on one path and
  geometry on the other, so a hero with a header over it is permanently unmeasured'
created_by: EPIC-12
created_at: '2026-09-29T21:23:37.137276+00:00'
updated_at: '2026-09-30T00:18:30.465811+00:00'
completed_at: null
last_field_updated: body
status: free_coding
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

5. **The anchor is derived ONCE, and not in the page script.** The page script
   measures (a run's line box, a band's box) and derives nothing — a `RawBand`
   carries no anchor field at all. The derivation is one module read by both the
   capture side and the reproduction side, so there is one implementation instead
   of two and the split cannot reopen by a branch being added to the page script.

6. **A coalesced section's anchor is measured against the box it publishes.** A
   second, independent instance of the same defect class, found during
   implementation. A capture bundle's *section* coalesces consecutive bands that
   share a style signature and publishes their UNION box, but took its anchor from
   the FIRST band — a ratio against a box that is not the section's the moment two
   bands coalesce. This is the `repro-joyfulculinarycreations-com` `contentAnchor`
   delta reported as `top (0.22)` against a reproduction's `center (0.55)`, on
   content the reproduction had placed correctly. A section's anchor is now every
   coalesced band's text, measured against the section's own box.

7. **Each side records WHICH population it was measured over.** A new axis
   `anchorPopulation`, `geometric` or `dom`, carried and not compared. The
   reproduction is measured by the extractor running now, so it is always
   `geometric`; a bundle is `geometric` from capture schema 9 and `dom` before it.
   This is what lets behaviour 3's guard tell an older bundle from a current one
   rather than guessing, and it is carried rather than compared because the two
   sides legitimately differ on an older bundle — what the comparator does about
   that is decline the anchor, not record a delta on the population.

8. **A bundle whose anchor was measured by an older instrument is named as
   such.** `CAPTURE_SCHEMA` goes to 9, with a schema axis whose probe recomputes
   the geometric anchor from the runs and boxes the bundle already carries and
   compares it against the stored value. A disagreement dates the bundle, so the
   operator-facing staleness sentence names re-capture as the lever rather than
   leaving a round to re-run a fold against a frozen oracle. Agreement proves
   nothing — an ordinary page's two populations always coincided — so the probe
   only ever REMOVES the axis from a finding, and an older bundle of an ordinary
   page is not accused of a defect it cannot be shown to have.

## 4. Approach — the decision taken, and why it inverts the preference below

`SectionValues` (`values-diff.ts:316`) carries only the precomputed
`contentAnchorRatio` and none of the runs behind it, so this **cannot** be
recomputed at diff time. The change belongs in the extractor, which means:

- **Reference bundles must be re-captured** to pick up the corrected anchor.
  Existing bundles keep the old value and go on being declined by behaviour 3.

**The preferred shape originally named here — teach the DOM path (`anchorRatioOf`)
to exclude runs claimed by a nested band root — was weighed during implementation
and REJECTED.** It cannot work, for a reason that is a property of the
reproduction rather than a matter of taste: an L1 reproduction's bands are the
painted slices of ONE page-wide root and are therefore a partition, so a header's
runs sit inside the hero slice with nothing marking them as another section's.
"Exclude the nested section's runs" is a question that side cannot answer at all,
so teaching the reference to answer it would MOVE the disagreement rather than
close it. "Every run whose centre falls in this box" is a question BOTH sides can
answer, from the runs each already collected.

So the ticket's stated alternative is what landed: both paths measure over the one
geometric population. That is the more uniform change and it touches the path every
ordinary page takes, so behaviour 4 carries the risk and has its own UAT.

The population is **document-wide** rather than per-root for the same reason a
per-band walk fails: a page-builder page's `<header>` is a SIBLING of the
full-page wrapper whose slices the hero is one of, so a per-root walk excludes it
and reintroduces the very split this closes.

**It is nearly inert on the ordinary page, and the exceptions are the two defects
themselves.** Recomputed across the three stored references — 21 sections in all —
the geometric population moves FOUR:

| reference | § | stored | one population | which defect |
|---|---|---|---|---|
| gigabytealchemy.ai | 1 | 0.53 | 0.39 | header over hero |
| joyfulculinarycreations.com | 1 | 0.58 | 0.43 | header over hero |
| joyfulculinarycreations.com | 2 | 0.22 | 0.55 | coalesced section |
| joyfulculinarycreations.com | 3 | 0.50 | 0.48 | coalesced section |

The other seventeen keep the anchor their DOM walk already reported. Three of the
four are the two defects at exactly the magnitudes the fidelity diff reported
(0.53/0.39 declined as incomparable per §2; 0.22/0.55 reported as a live delta);
the fourth moves 0.02, well inside the 0.15 tolerance, so it was never a delta
either way.

## 5. Out of scope

- The `structural-failure` verdict on `repro-gigabytealchemy-ai` (56 backing
  surfaces leaving the content they back at 506px and 637px viewports). That is
  a real and larger defect on the same reproduction, tracked separately; this
  ticket does not make that gate pass.
- Widening `anchorTol`. REQ-270 already rejected this: a tolerance that absorbs
  a 0.14 population artefact would also absorb a real 100px content shift.

## 6. Consequences in the tests

`BUG-103`'s manifest-seam fixture declared `contentAnchorRatio` on its
reproduction band and gave that band's run no geometry at all. With the anchor
derived from run geometry the run must carry a line box — and a single-band
reproduction whose runs have geometry IS the flat-L1 degenerate case
(`spansWholePage`), which `values-diff` correctly reports UNMEASURED rather than
comparing the reference's two sections against one body-spanning band. The old
fixture escaped that guard only because its run had no box. The fixture becomes
three bands so that it is not degenerate; BUG-103's own claims — both manifests
reach disk, the reproduction's section list is readable, the anchor delta is
legible — are unchanged and still asserted.

Every other fixture that declared `contentAnchorRatio` on a `RawBand` drops it,
because the field no longer exists.
