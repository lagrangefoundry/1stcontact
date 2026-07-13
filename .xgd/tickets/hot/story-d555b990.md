---
uid: story-d555b990
id: STORY-72
type: story
title: Tailwind-aligned content-width scale with literal escape hatch
created_by: xgd
created_at: '2026-07-13T20:37:33.706963+00:00'
updated_at: '2026-07-13T20:44:28.154771+00:00'
completed_at: null
last_field_updated: status
status: completed
fields:
  intent_uid: bundle-d9c2e655
  capability_uid: capability-1a67c2a0
  story_kind: feature
  story_points: 2
---

## Story
**As a** site author reproducing a real reference design, **I want** the `contentWidth` (and `rowWidth`) dial to offer named width steps aligned to the de-facto standard scale plus a literal escape hatch, **so that** I can cap a section's content column to the exact measure a reference uses — landing on a named step for common widths and specifying an off-scale width directly when no step fits.

## Description
Sizes the content column *within* a section's full-width frame (the `align` dial still governs where that column sits). Two ways to express the width:

- **Named scale** — the `contentWidth` steps are aligned 1:1 to the Tailwind `max-w` scale: `sm 384 · md 448 · lg 512 · xl 576 · 2xl 672 · 3xl 768 · 4xl 896 · 5xl 1024 · 6xl 1152 · 7xl 1280` (px @ root-16), plus `bleed` (fills the frame). A real site (e.g. a 896px block) now lands on a named step (`4xl`) that the previous scale skipped.
- **Literal escape hatch** — for a width off the scale, `contentWidth` also accepts a bare number (interpreted as `px`, matching captured render values) or a CSS length string (e.g. `"56rem"`).

The same mechanism backs the equivalent `rowWidth` dial that boxes a grouped multi-column row, and applies wherever a content column is capped — hero subhead, text-block, services-grid. `bleed` (or an absent dial) means "no cap / fill the frame."

**In scope**: the named width scale, the literal escape hatch, uniform application across the width-bearing modules, and migration of existing site docs off the retired scale so no site references a removed name.

**Out of scope**: the intrinsic typography/colour dials (live on styled runs); vertical spacing and other structural dials.

## Technical Context
- The named scale and the resolver are the single authority for both the named layer and the literal hatch; a named step resolves to the themeable container width token for that step, a number to `<n>px`, any other string straight through, and `bleed`/absent to "no cap."
- The resolved measure is applied via a single inline content-width custom property (with a marker class), replacing the former per-name CSS classes — so a literal and a named step travel through one mechanism.
- Container width tokens span the full `sm..7xl + bleed` scale and every named step is themeable (a theme may override individual steps; defaults fill the rest).
- Fixed framework layout widths were repointed onto the new scale (former canonical body container → `6xl`; the contact-form measure → a `40rem` literal).
- Replaces the idiosyncratic `xnarrow/narrow/readable/default/wide` scale with no legacy dual-set — the old names are removed and existing site docs were migrated (per project policy: no backward-compat aliases).

## Dependencies
None.

## Story Points
2