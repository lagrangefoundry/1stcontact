---
uid: request-3cb0e179
id: REQ-420
type: request
title: 'L1: vertical rhythm — text styles carry space above and below, so a heading
  attaches to its paragraph'
created_by: EPIC-19
created_at: '2026-10-20T23:26:20.891074+00:00'
updated_at: '2026-10-21T00:19:36.943070+00:00'
completed_at: null
last_field_updated: body
status: free_coding
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

## As implemented

**Language (`packages/site-schema`).**
- `site.rhythm = { unitPx, responsive?: { unitPx: track } }` (1–200 px, `.strict()`).
  Absent, the unit is the default text style's line height (its per-width track
  when it has one), else 24px. Set through `set_config` key `rhythm`.
- `spaceAbove` / `spaceBelow` (rhythm units, 0–16) on `l1TextStyleSchema` and on
  every node (shared node axis group) as the per-node override. Styles resolve
  onto runs at the same boundary as type (`resolveL1TextStyles`), so the
  renderer reads literals. A heading never inherits spacing from the site's
  default style; otherwise a body style saying `spaceBelow: 1` would float every
  heading.
- Container `spacing: 'rhythm' | 'gap'`. Unset: `gap` when `gapPx` is set; `rhythm`
  for a `stack` (no responsive layout) holding a text run and no child placed by
  geometry; otherwise `gap`. Recovered/folded stacks (pinned or offset children)
  stay `gap`, and the recovery code (`flow_l1`/promote) now says `spacing: 'gap'`
  on the stacks it builds.
- Defaults live in one table, `L1_RHYTHM_DEFAULTS` (`l1/rhythm.ts`): H1 3/0.75,
  H2 2.5/0.5, H3 2/0.5, H4–H6 1.5/0.5, body text 0/1, any other node 1/1. An
  unpainted, unpadded rhythm container passes its first and last children's
  space through. `l1RhythmPlan` (leads + keep-with-next groups) is shared by the
  renderer and the analytic evaluator so they cannot disagree.
- Email pages refuse `spacing` on a container; `spaceAbove`/`spaceBelow` are inert
  there (a run can pick them up from a style).

**Renderer (`packages/framework`).** A rhythm member gets
`margin-top: calc(var(--l1-ru, <unit>px) * k)`, with k = max(previous below, own
above), and 0 for the first member. The unit is declared once on `:root`, with
per-width rules for a track, and only by a page that uses rhythm. Rhythm space is
vertical: at widths where a container is a row or grid its members get 0. A
rhythm container emits no `gap`. Keep-with-next: a heading (or run of headings)
plus the next child is wrapped in `<div data-l1-keep role="group"
aria-labelledby="<heading id>">`, a column carrying the first member's lead.
In a stack nothing moves; in a wrapping row or restacking layout the heading and
its text move as one item. Section addressing (layout check, page sections) looks
through `data-l1-keep`, so `0.n` still names node n. Documents with `gapPx` render
byte-identically. Across the 13 stored fixture/sandbox pages, only the 4 with
plain text stacks and no `gapPx` change (xgd home and whitepapers, Charlie's home,
sandbox demo); they now space by rhythm.

**Analytic evaluator (`probes.ts`).** Advances a stack's cursor by each member's
lead × unit (`EvaluateOptions.rhythm`). Rows in a rhythm container are modelled
with no space between members, as rendered.

**Capture / fold.** `tools/generate/src/l1/read-rhythm.ts` reads a laid-out page's
rhythm. The unit is the median body line height; body→body gaps give body
`spaceBelow`, heading→body gives the heading's `spaceBelow`, body→heading its
`spaceAbove`. Medians, to the nearest quarter unit. Gaps over 8 units are ignored
as section breaks. The fold itself produces pinned geometry and no styles, so
the reading is recorded where a reproduction's styles are created: `1c type
assign` puts the measured space on the `heading-<n>` styles it creates and on
the main body-text style it creates, and sets `site.rhythm` when the site has
none. It does this only on a site with no rhythm container, so the retrofit stays
a change of description (the page paints byte-identically). It also no longer
resolves an existing style's spacing into per-run literals. `captureL1` accepts
render options, so the round trip renders with the site's unit.

**REQ-415 layout check.** The floating-heading finding is [[BUG-238]]'s
`loose_heading` (landed concurrently, `1b860b3810`): space below a heading at least
`belowOverAbove` (0.75) times the space above, with at least `minAbovePx` (16) above,
thresholds in `layout-check.json`. REQ-420's own `floating_heading` duplicated it and
was dropped in the merge (`4e6eb7f99e`); REQ-420 does not add a finding kind. Its UAT
asserts `loose_heading` fires on an evenly spaced (`gapPx`) stack and not on a
rhythm stack. The layout check and page-section scripts look through
`data-l1-keep` wrappers.

**Teaching.** Builder priming (both variants), continuing BUG-238's "put clearly
less space below it than above it" sentence: text stacks space by rhythm, no
`gapPx`; `gapPx` with `spacing: "gap"` is for rows and grids; change spacing on
the style, override per element only for a reason, and report it. Consultant
priming: heading spacing is a property of the text style; change the style,
not one element. Surface (`surface_version` 20 → 21): `set_text_style` /
`add_text_style` / `get_text_styles` describe `spaceAbove`/`spaceBelow`,
`set_config` describes `rhythm`, page-map `warnings` names the floating heading.
`REF-l1` and the builder vocabulary pick the new fields up from the schema.

## UAT coverage (`tests/test_UAT_FC_REQ-420_vertical_rhythm.test.ts`)
- `text_styles_and_the_unit_carry_bounded_space`: styles accept bounded space;
  out-of-range values and a freeform key are refused; the unit is a bounded
  setting, declared on `:root` per width.
- `a_rhythm_stack_attaches_each_heading_to_its_text`: H2→p 0.5, p→p 1, p→H2 2.5,
  first child 0; heading and text in one labelled group; no `gap`.
- `the_style_sets_every_use_and_an_override_one`: a style's space reaches every
  use; a node's own `spaceAbove` changes only that node, and survives a style change.
- `gap_documents_render_unchanged`: a `gapPx` document's output is identical with
  any unit and with `spacing: 'gap'` stated, and the served page does not change
  when the site's unit does.
- `type_assign_keeps_the_rhythm_a_reproduction_was_laid_out_with`: measured
  offsets → `rhythm.unitPx` 20, `heading-2` 2.5/0.5, body style 0/1; served page
  byte-identical.
- Browser (Chromium): `round_trip_recovers_the_unit_and_the_style_spacing`
  (measured 10/20/50/40px gaps; read back exactly);
  `a_heading_is_kept_with_its_text_when_a_row_wraps` (phone width);
  `a_group_is_transparent_to_section_addresses`;
  `the_layout_check_names_a_floating_heading` (BUG-238's `loose_heading`: even
  `gapPx` flagged, rhythm clean).
- Existing sweeps extended: REQ-105 / AC802 node-axis-group samples include
  `spaceAbove` / `spaceBelow`.
