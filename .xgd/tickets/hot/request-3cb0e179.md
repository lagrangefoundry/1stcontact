---
uid: request-3cb0e179
id: REQ-420
type: request
title: 'L1: vertical rhythm — text styles carry space above and below, so a heading
  attaches to its paragraph'
created_by: EPIC-19
created_at: '2026-10-20T23:26:20.891074+00:00'
updated_at: '2026-10-20T23:26:20.891074+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  story_points: 13
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-02c29bae
---

## Why (operator, 2026-10-20)

> Spacing of titles and text — this is really important for a professional
> looking site and feels consistently off to me … the paragraph under a title
> should feel attached to the title; we seem to get title - text - title equally
> spaced … I think this is a big gap in L1; it should structurally understand
> this and support the pairing of title and paragraph. OK for the AI to adjust it
> to meet specific needs but I think we need to bake this in at the language level.

The proximity principle: a heading belongs to the text below it, so the space
above a heading is clearly larger (typically 2–3×) than the space below it.
L1 already knows headings and their level (REQ-269, `heading.level`) and has
named text styles (REQ-350), but spacing exists only as a container's single
uniform `gapPx` (`render.ts` ~5041). A heading/paragraph/heading stack can only
be spaced evenly, so every builder produces the floating-heading look.

## Decisions (operator, 2026-10-20)

- **Implicit pairing.** The pairing comes from spacing carried by text styles,
  not from an explicit "titled block" node. If it's wrong, the AI tweaks it.
- **A default, not a rule.** The language does not forbid a heading whose space
  below ≥ its space above (eyebrows, display headings break it deliberately);
  the AI can override. REQ-415's layout check flags it as a finding.
- **L1, in this repo** (`packages/site-schema` + `packages/framework` renderer).

## What changes

1. **A rhythm unit.** The site declares a base vertical spacing unit (default ≈
   the body text's line height), responsive per viewport width like other
   axes, so phone rhythm can be tighter.
2. **Text styles carry space.** `l1TextStyleSchema` gains `spaceAbove` and
   `spaceBelow` in rhythm units — typed, bounded, `.strict()`, no raw CSS.
   Defaults by heading level: H1 3 / 0.75, H2 2.5 / 0.5, H3 2 / 0.5, body 0 / 1
   (above / below). Values are tunable defaults, set in one place.
3. **Stacks space by rhythm.** A container's spacing mode is `rhythm` or `gap`
   (today's uniform `gapPx`, kept for card grids, image rows, button rows). In
   `rhythm`, the space between neighbours is **max(previous.spaceBelow,
   next.spaceAbove)** — collapsing, as in typesetting. The first child's
   spaceAbove is dropped at the container's top edge (and the last child's
   spaceBelow at the bottom) so section padding governs edges. Stacks of text
   default to `rhythm`.
4. **Local override.** A node may set its own `spaceAbove` / `spaceBelow` (in
   units) for a specific need; changing the style changes every use, an
   override changes one.
5. **Keep-with-next.** A heading stays with the content after it when a layout
   reflows (columns stacking at phone width, wrapping), and the renderer emits
   the grouping semantically so assistive technology reads heading and text as
   one unit.
6. **Validator and renderer.** Bounds and envelope caps as for other axes;
   rendered as typed margins between neighbours, never raw CSS. The security
   invariant (structured-only) holds.
7. **Capture / fold.** The fold reads a reference's vertical rhythm (space above
   and below headings and paragraphs) into the unit and the styles, so
   reproductions keep it; the REQ-82 round-trip gate covers it.
8. **Builders and consultant** are taught: text goes in rhythm stacks; adjust
   spacing on the style, override per node only for a specific reason.
9. **Existing pages** keep `gapPx` and render unchanged; they move to rhythm when
   next restyled. No forced migration.

## Test plan
- Schema/validator: styles accept bounded `spaceAbove`/`spaceBelow`; out-of-range
  and unknown keys are rejected.
- Render: in a rhythm stack, H2 → paragraph spacing equals max(0.5u, 0u) and
  paragraph → next H2 equals max(1u, 2.5u); first child has no space above; a
  `gap` stack renders as today.
- A per-node override changes only that node.
- Keep-with-next: at phone width a heading is never the last item of a column
  separated from its paragraph; heading and text are grouped in the output.
- Round trip: capture(render(doc)) recovers the unit and style spacing within
  tolerance.
- Existing documents with `gapPx` render byte-identically.