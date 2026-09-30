---
uid: request-0b26b97a
id: REQ-350
type: request
title: 'L1 pages: scoped geometry and scoped style — sections that carry and push
  their contents, styles set once'
created_by: EPIC-20
created_at: '2026-09-29T05:02:46.487789+00:00'
updated_at: '2026-09-30T21:14:26.062602+00:00'
completed_at: null
last_field_updated: title
status: draft
fields:
  priority: medium
  epic_parent: epic-0923bb64
  auto_merge_back: true
  needs_review: false
---

## What this is

A page should say **where things are relative to each other**, and **what a style is once**, instead of repeating both on every element. Today a stored page does neither:

- Every element is placed against the page itself. Grow the header and nothing below it moves. You have to push every element down by hand, at every screen width.
- Every text element carries its own font family and its own size. Changing "the body font" is one edit per element.

This ticket covers both: **scoped geometry** (sections that carry their contents, and content that pushes what follows it down) and **scoped style** (every style parameter can be set once and inherited or referenced, the way colours already are).

## What we found (corrected 2026-09-30 — the original premise was wrong)

The first version of this ticket said reproduced pages contain no structure. That is wrong for current reproductions.

- **The fold already nests.** Since commit `8ecd455d16` (2026-09-25, *"a backing surface owns the content it backs"*), `foldToL1` places content inside its section and card containers. The Gigabyte Alchemy capture (`storage/references/gigabytealchemy.ai/index/l1.json`) comes out as 11 sections, three levels deep. Children's coordinates are measured from their section. In "Our Mission", the section is at `y: 1612` and its heading at `y: 96` within it.
- **The Gigabyte Alchemy site predates that.** It was created 2026-09-06 and was never re-folded, so its home page (`site_pages`, `home.json`) is the older shape: `root` with **69 direct children, depth 1**. The sections survive only as empty backing boxes (`section-band-0`…), and the text is painted over them as siblings. Its first recorded edit already addressed element `0.68`.
- **Nothing uses `flow` placement.** The language has had it since REQ-278 (`geometry.place: 'flow'`). The schema's own description: *"an `absolute` sibling stays put and is overrun, a `flow` sibling is pushed down."* Both the capture and the live page place **all 70 elements `absolute`**. So even the nested capture only means that moving a section carries its contents. Growing the header still overlaps the section below it.
- **Colours are already scoped. Type is not.** On the live page all 52 colour settings are palette references (`{"ref": "slate"}`), and the page has a default text colour. But `fontFamily` is a literal string on 52 text elements (1 Cinzel, 51 system sans), and `fontSizePx` is set separately on 52. There is no named text style and no way for a container to set type for what it contains.

## What it cost in the session that found it

From the first live delegation session (2026-09-29, Gigabyte Alchemy; recorded on EPIC-20):

1. **A repair had to be eight pairs of coordinates.** "Attach these forms to their section" could not be said, because there was no section to attach them to. The consultant computed per-width x/width values instead.
2. **Narrowing a box did not narrow what was painted on it.** The fields were siblings, not children, so 528px inputs sat in 424px boxes.
3. **It maximises the work that cannot be delegated.** REQ-348's finding is that the consultant's irreducible cost is computing values, and a page with nothing scoped turns every change into values.

## What must hold — geometry

1. **A section carries its contents.** Content that belongs to a section is a child of it, with coordinates measured from the section. Moving or resizing the section moves its contents.
2. **Content that follows other content is pushed down by it.** Sections within the page, and content within a section, are placed `flow` wherever that reproduces the capture. The test is the header case: making an element taller moves everything after it down, and nothing overlaps.
3. **Render-identical at the captured widths.** Nesting and `flow` change the description, not the output. At every captured width the page renders as it did. This is the existing round-trip gate (`capture(render(L1)) ≈ L1`, DOC security policy §4), and it is the judge.
4. **Existing flat pages can be structured without re-capturing.** An operation takes a set of element addresses, makes them children of a new container, rebases their coordinates, and keeps the render identical. A second operation switches a container's contents to `flow`. The consultant decides what forms a section (a judgement about meaning); the host does the arithmetic.
5. **Flat stays valid.** Nothing here makes an `absolute` page invalid.

## What must hold — style

6. **Every style parameter can be set once and referred to.** Colours already work this way (palette references). The same model extends to the rest: at least font family, size, weight, line height and letter spacing as named text styles (e.g. heading, body, caption), and repeated values such as spacing, corner radius and shadow. Changing the named value changes every element that refers to it.
7. **A container can set style for what it contains.** A value set on a container is inherited by its descendants unless they set their own, the way the page's default text colour already falls back. This depends on geometry item 1: nothing can be inherited on a page with no containers.
8. **An element can still override.** A local value wins over an inherited or named one.
9. **Structured only.** Named styles and inherited values are typed and validated like every other L1 value. No raw CSS enters through this (security policy §1–§3).
10. **The AI can see and change the scope.** Tools exist to read and change a named style or an inherited value, and to see what refers to it, the way palette colours are managed today.

## Changes to reproduction

- **Nesting: already done** for new reproductions (`8ecd455d16`). Keep it, and make it a guarded property so it doesn't regress.
- **`flow`: new.** The fold must emit `flow` for sections in the page and for content within sections, where the round trip holds, instead of `absolute` everywhere. The current only writer, the collision-repair step (`promoteToFlow`), is not enough.
- **Style: new.** The fold must emit named styles and container-level values, found by grouping elements that share a value, instead of literals on every element. This follows the pattern the fold already uses to turn captured colours into palette references.
- **Existing sites** (Gigabyte Alchemy and anything else created before 2026-09-25) get structure either by being re-folded or through the operation in geometry item 4.

## Open questions

- **How far to group.** Nesting by geometric containment is mechanical. Deciding that two text runs share "body" style is clustering, and over-grouping (merging styles that differ by one pixel on purpose) is a real risk. The round-trip gate catches render changes, not wrong intent.
- **Which parameters get named styles, and which get inheritance only.**
- **The site-level `theme.typography` in `site_json`** (heading/body families) already exists and appears unused by L1 pages. It should become the named text styles or be retired, not left as a second answer.

## Size

This is large and likely too big to free-code as one unit. The natural split is geometry (items 1–5) and style (6–10). Geometry is mostly emission and one operation over language that already exists. Style needs new language.

## Test plan

UATs (`test_UAT_FC_REQ-350_*`), against real captures:
- a fold of the GA capture nests contents in sections and places them `flow`; growing an early element moves later content down with no overlap; the round trip holds at every captured width;
- the group operation on the live flat GA page produces a render-identical nested page;
- a named text style changed once changes every element referring to it; a container value is inherited and a local override wins;
- the validator refuses a style value that isn't typed;
- a flat `absolute` page still validates and renders unchanged.
