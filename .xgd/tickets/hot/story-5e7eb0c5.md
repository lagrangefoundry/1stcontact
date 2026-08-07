---
uid: story-5e7eb0c5
id: STORY-97
type: story
title: 'Colour census and repeatable palette retrofit: measure a site''s colours,
  then migrate it onto a palette without moving a pixel'
created_by: xgd
created_at: '2026-08-06T21:06:52.787637+00:00'
updated_at: '2026-08-07T16:50:23.831795+00:00'
completed_at: null
last_field_updated: uat_coverage
status: completed
fields:
  intent_uid: bundle-0385746c
  capability_uid: capability-b4ac88fc
  story_kind: feature
  story_points: 2
  uat_coverage: pass
---

## Story

**As a** site author with an already-authored site whose every colour is an
individually chosen literal, **I want** one command that measures the site's
colours and converts them onto a derived palette, refusing to write unless the
conversion is provably lossless, **so that** I can change one conceptual colour
and have every use of it follow — without gambling the site's appearance on the
migration.

## Description

The palette colour model makes a reference an admissible form for any colour
axis. On a site that does not exist yet, that is enough. On a site that already
exists, the model is unreachable without a mechanical way to make the trip — and
a reason to trust it. This story is that trip.

**In scope**

- **Census** — `1c colors <slug>` reports what colours a site's definition
  actually contains: the distinct literals with their use counts, the distinct
  RGB ignoring alpha, and the alpha families (one RGB used at several
  opacities, the exact-collapse candidates). Read-only. A `--json` form makes
  the measurement scriptable.
- **Retrofit** — `1c colors <slug> --assign` derives a palette and rewrites
  every literal in the site as a reference to it, in two mechanically distinct
  passes ordered by how much they infer: exact alpha collapse first (one RGB at
  N opacities is one entry plus the reference's opacity axis — a statement of
  fact about the bytes), then hue-family ramp grouping (a genuine lightness ramp
  is one entry with steps). Anything that clusters with nothing keeps its own
  entry: a slightly large palette is a fine outcome, a wrong one is not.
- **Lossless or nothing** — the write is gated on two proofs: every derived
  reference reproduces byte-for-byte the literal it replaces, and the converted
  definition still validates. Either failing aborts before anything touches
  disk. Conversion that moves a pixel is a bug, not a cost.
- **Reproducible naming** — derived families are named after what they are (a
  cool grey ramp, a teal, a cream) rather than after a role they may not play;
  `--names <derived>=<chosen>` promotes them to role vocabulary from the command
  line, so a retrofit is reproducible from a command line rather than finished
  by hand.
- **Re-runnable** — a site that already carries a palette censuses and
  re-assigns exactly as it did the first time, so adding a page or renaming a
  family is one command rather than a manual un-assignment.

**Out of scope**

- The palette *model* — the site-level palette shape, the widened colour axis,
  the rejection of a dangling reference, and resolution at the load boundary.
  That is STORY-80 (story-c490f1cf), on which this story depends.
- Any colour-picker or palette-editor UI. Explicitly deferred by the intent.
- Any change to the capture→L1 fold, which continues to emit literals only.
  Palette assignment is a separate pass over a folded site.

## Technical Context

- **Depends on the palette model** (STORY-80 / plan item 3): the references this
  command writes are only meaningful because a colour axis accepts them and the
  load boundary resolves them back to hex. The round-trip proof this story's
  write is gated on is the same guarantee the model asserts, checked from the
  producing side.
- **Neutrality is measured as chroma, not HSL saturation.** The intent's §3
  measurement (DOC-23 §5.3) groups three warm surfaces into one family; HSL
  saturation reports a cream 7/255 off white as 100% saturated, because its
  denominator collapses near the ends of the lightness range. Reading neutrality
  off saturation would have contradicted the measurement, so the grouping reads
  it off chroma. This is an implementation choice recorded here, not an AC — the
  AC asserts the grouping outcome the measurement calls for.
- **A vivid colour and a near-neutral tinted with its hue are two roles.** Hue
  proximity alone chained a brand blue into the slate scale 11° away and
  produced one 14-member entry that was not a role anyone could edit — the
  *wrong* palette the intent warns against, dressed up as a small one.
- **Intent/observation note — the census reproduces the §5.3 *measurement*, not
  its historical numbers.** The intent's AC7 asks the census to "reproduce the
  DOC-23 §5.3 table", which measured `xgd` at 17 distinct colours / 15 distinct
  RGB. The site has since gained a document-level text colour, so the command
  now reports 18 / 16. The census measures the definition as it stands; the
  durable property is the method and the collapse (distinct RGB strictly fewer
  than distinct literals), not the frozen counts.
- **Intent/observation note — two of the four sites are vacuously retrofitted.**
  The intent's AC6 asks for all four `storage/sites/*` retrofitted. `xgd` (18
  literals → 6 entries) and `gigabytealchemy` (→ 8 entries) carry palettes;
  `1stcontact` and `harbor-cafe` census at zero colour literals, so there is
  nothing to convert and no palette is written. Not a divergence — but a test
  author should not read "every site carries a palette" into the retrofit.

## Dependencies

- STORY-80 (story-c490f1cf) — the L1 palette colour model: the palette shape,
  the widened colour axis, and reference resolution. Plan item 3.

## Story Points

2