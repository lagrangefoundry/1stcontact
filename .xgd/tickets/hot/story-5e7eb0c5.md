---
uid: story-5e7eb0c5
id: STORY-97
type: story
title: 'Colour census and repeatable palette retrofit: measure a site''s colours,
  then migrate it onto a palette without moving a pixel'
created_by: xgd
created_at: '2026-08-06T21:06:52.787637+00:00'
updated_at: '2026-08-16T22:27:49.454560+00:00'
completed_at: null
last_field_updated: status
status: updated
fields:
  intent_uid: bundle-0385746c
  capability_uid: capability-b4ac88fc
  story_kind: upgrade
  story_points: 3
  uat_coverage: pass
---

## Story

**As a** site author with an already-authored site whose every colour is an
individually chosen literal, **I want** one command that measures the site's
colours and converts them onto a derived palette, refusing to write unless every
converted colour is provably within a stated bound of where it was, **so that** I
can change one conceptual colour and have every use of it follow — without
gambling the site's appearance on the migration.

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
  fact about the bytes), then hue-family fitting (colours sharing a hue family
  become one entry plus a `shade` on each reference, where the mix can actually
  reach them). The entry a family is built on is the member that **reaches the
  most others**, because mixing toward black or white only removes chroma, so
  the reach relation runs one way and picking the pale end shatters a real ramp.
  Grouping runs in rounds — what a base cannot reach re-enters the next round
  rather than dropping straight to a singleton — and whatever is still unreached
  at the end keeps its own entry, as an exact literal. A slightly large palette
  is a fine outcome, a wrong one is not.
- **Bounded, reported, or nothing** — the write is gated on two proofs: every
  derived reference resolves back to within a stated per-channel bound of the
  literal it replaces (byte-exactly, for any reference carrying no shade, and
  byte-exactly for alpha always), and the converted definition still validates.
  Either failing aborts before anything touches disk. What is *within* the bound
  is not swallowed either: the command reports the drift it accepted, colour by
  colour, so the conversion's cost is read rather than assumed.
- **Reproducible naming** — derived families are named after what they are (a
  cool grey ramp, a teal, a cream) rather than after a role they may not play;
  `--names <derived>=<chosen>` promotes them to role vocabulary from the command
  line, so a retrofit is reproducible from a command line rather than finished
  by hand.
- **Re-runnable to a fixpoint** — a site that already carries a palette censuses
  and re-assigns exactly as it did the first time, and a second run leaves the
  site definition and every page byte-identical, so adding a page or renaming a
  family is one command rather than a manual un-assignment.

**Out of scope**

- The palette *model* — the site-level palette shape, the single-colour entry,
  the `shade` and `alpha` axes of a reference, the rejection of a dangling
  reference, and resolution at the load boundary. That is STORY-80
  (story-c490f1cf), on which this story depends.
- Any colour-picker or palette-editor UI. Explicitly deferred by the intent.
- Any change to the capture→L1 fold, which continues to emit literals only.
  Palette assignment is a separate pass over a folded site.

## Technical Context

- **Depends on the palette model** (STORY-80 / story-c490f1cf): the references
  this command writes are only meaningful because a colour axis accepts them and
  the load boundary resolves them back to hex. The retrofit fits a shade by
  searching over the *model's own* shade function rather than a second copy of
  the colour arithmetic, so the drift this command measures and reports is the
  drift the site will actually paint.
- **The guarantee changed shape with the model** (REQ-137 §3, operator-approved).
  A named step stored a member's exact hex, so byte-identity was free. A shade
  *computes* it, so a genuine ramp member lands within a bounded distance of
  where it was rather than exactly on it. The bound is 8/255 per channel, and it
  is measured rather than chosen: fitting all 32 stored steps put 24 at 0–8 and
  the remaining 8 at 15–101, with nothing in between — the gap is where two
  populations genuinely separate, and 8/255 on one channel is under what a
  viewer picks out on a flat fill. This supersedes the pixel-identity guarantee
  REQ-114 AC3 made; it is not a relaxation of an unmet promise but a different
  promise, stated and measured.
- **The upper population is not approximated.** The 8 colours above the gap are
  more saturated than their base, and a mix toward black or white can only
  remove chroma, so they are not shades of anything. Each becomes its own entry
  and stays an exact literal. Seven such colours split out across the two stored
  sites — four of `gigabytealchemy`'s "blues" were never a ramp, and `xgd`'s
  `#4aafc9` is both lighter *and* more saturated than `#2e86a3`, so it is now its
  own entry (`primary-bright`) rather than a shade of the brand teal. Widening
  the tolerance to keep those families nominally intact was considered and
  rejected this session.
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
- **The family-change refusal is what makes the retrofit a fixpoint.** A shade
  replaces the stored literal, so the next census reads the colour the shade
  *paints*. A fit that drifts across a classification boundary — measured on
  `gigabytealchemy`, where `#f1f5f9` fitted to slate paints a chroma-3 neutral —
  gets refiled on the next run and the palette grows under a command that is
  supposed to be reproducible. So a fit must land within the bound *and* stay in
  its own family; one that cannot is treated as unreached and gets its own entry.
- **Intent/observation note — the census reproduces the §5.3 *measurement*, not
  its historical numbers.** The intent's AC7 asks the census to "reproduce the
  DOC-23 §5.3 table", which measured `xgd` at 17 distinct colours / 15 distinct
  RGB. The site has since gained a document-level text colour, so the command
  now reports 18 / 16. The census measures the definition as it stands; the
  durable property is the method and the collapse (distinct RGB strictly fewer
  than distinct literals), not the frozen counts.
- **Intent/observation note — retrofit reach, as re-run under the shade model.**
  `xgd` lands at 7 entries and `gigabytealchemy` at 15, both with zero steps
  (they were 6 + 10 steps and 8 + 22 steps under the named-step model). The
  palettes are legitimately *larger* than before, because the colours a mix
  cannot reach were split out as their own exact entries; they remain materially
  smaller than the distinct colour counts. Colour-slot counts are unchanged
  (210 and 91 slots, compared in document order), with worst per-channel
  movement Δ5 on `xgd` and Δ8 on `gigabytealchemy`.
- **Intent/observation note — two of the four sites are vacuously retrofitted.**
  The intent's AC6 asks for all four `storage/sites/*` retrofitted. `1stcontact`
  and `harbor-cafe` census at zero colour literals, so there is nothing to
  convert and no palette is written. Not a divergence — but a test author should
  not read "every site carries a palette" into the retrofit.
- **`xgd`'s curated vocabulary is one command line.** Under the new palette shape
  it is reproduced with
  `--names slate=text,teal=primary,orange=accent,sand=surface,slate-2=surface-accent,teal-2=primary-bright`.
  `gigabytealchemy`'s names are all derived.

## Dependencies

- STORY-80 (story-c490f1cf) — the L1 palette colour model: the single-colour
  entry, the `shade`/`alpha` reference axes, and reference resolution at the
  load boundary.

## Story Points

3