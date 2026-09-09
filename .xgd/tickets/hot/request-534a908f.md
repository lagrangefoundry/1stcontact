---
uid: request-534a908f
id: REQ-209
type: request
title: 'The AI can measure a drawing: an anchor vocabulary, geometry that answers
  relationships, and a write that verifies itself'
created_by: CHAT-49
created_at: '2026-09-09T21:24:52.609301+00:00'
updated_at: '2026-09-09T23:48:14.623298+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  priority: high
  story_points: 8
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-6ab9144c
  commits:
  - working_sha: 1e0e30bd07c0affb6a8044bf37d69bce345be9b6
    reconcile_sha: null
    main_sha: null
  version: 0.2.141
---

## What changes

**The AI can measure a drawing instead of guessing at it.** Today it authors absolute
coordinates into a space it can only see as a picture, so positioning anything
precisely means render, screenshot, squint, adjust, repeat. On 2026-09-09 that loop
ran **13 `write_image` calls and 13 `screenshot` calls in sixteen minutes** on the 1st
Contact wordmark and still did not land it — ending with the AI drawing a **ruler grid
into the drawing itself** and reading a glyph edge off a screenshot by eye. The user's
summary: *"when the AI fumbles about it does not fill the user with confidence."*

This gives drawings a geometry channel that returns numbers, a vocabulary for naming
the features those numbers describe, and an operation that turns a stated intention
into the value to write.

Specified in full in [[DOC-52]] §3.1–3.4 and §5.

## Authoring guidance — no code, and it ships first

Three rules go into `write_image`'s description. They are documentation, they cost
nothing, and two of them alone would have prevented most of the failure above.

- **Text runs compose.** A run of styled text is ONE `<text>` with `<tspan>` children,
  not several absolutely-positioned `<text>` elements. The browser advances the pen,
  so horizontal position is automatic and exactly right in whatever font resolves.
  `<tspan>`, `dx`, `dy`, `font-size`, `font-weight` and `fill` are already allowed —
  this capability existed the whole time and nothing in the documentation mentioned
  it.
- **A mark names a real font.** `system-ui`, `-apple-system` and bare `sans-serif`
  must not appear in a generated drawing. They resolve to different faces with
  different advance widths per platform, so a mark tuned on one machine is wrong on
  most others. A mark names a font registered in `fonts/registry.yaml`. *(The wordmark
  currently in the 1st Contact draft has this defect and should be corrected.)*
- **Give a node an `id` when you intend to position it precisely.** `id` is already
  allowed on `<text>` and `<tspan>`; it is how everything below addresses a node.

## The anchor vocabulary

`<node>.<anchor>`, node addressed by `id`, anchor from a closed set. The set
distinguishes **three families that are not interchangeable**, and that distinction is
the point of the whole ticket:

| Family | Anchors | Applies to |
|---|---|---|
| Box | `left` `right` `top` `bottom` `centre-x` `centre-y` | any node |
| Ink | `ink-left` `ink-right` `ink-top` `ink-bottom` | text |
| Font | `baseline` `cap-top` `x-top` `ascender` `descender` | text |
| Advance | `advance-start` `advance-end` | text |

In "st" the `t`'s ascender rises **above** cap height; a digit sits **at** it. So
aligning ink-tops and aligning cap-tops give visibly different results — which is
exactly what the user was seeing and could not name. Likewise *"where the 1 ends"* is
`ink-right` for tight optical spacing and `advance-end` for ordinary typesetting; in
the wordmark those differ by 8.4 units.

**Axis is inferred** from the anchor (`top`/`baseline`/`cap-top` → y, `left`/`right` →
x), so a mismatched pair such as `relate(a.top, b.left)` is a refusal rather than a
silently meaningless number.

**The anchor set lives in a shared `site-schema` module, not inside the tool.** It is
a contract that `measure_page` ([[DOC-52]] §3.6) will import later, and a second
definition site is free to drift from the first.

## `measure_drawing`

Renders an SVG asset headless and returns **the primitives every anchor derives
from** — not the anchors themselves, because fifteen scalars per node is both larger
and unable to answer the sixteenth relationship nobody enumerated.

Per node: the box, the ink box, the baseline, the advance width. Per document: the
viewBox, and **font metrics reported once per font rather than per node** — cap-height,
x-height, ascender and descender ratios, from which every font line derives.

Everything is in **root user space with nested transforms resolved** — a node inside a
`<g transform="…">` reports where it actually is, not its pre-transform coordinates.

Requirements on the response:

- **Text nodes carry per-glyph extents** (`getExtentOfChar`), which is precisely the
  question the ruler grid was built to answer.
- **The resolved font is reported alongside the requested one.** A `requested` ≠
  `resolved` mismatch is how the `system-ui` rule above is caught in practice rather
  than only in principle.
- **Nodes without an `id` still appear**, under a path reference. An un-id'd drawing
  measuring to nothing is a bad first experience, and seeing the path is what prompts
  adding an id.
- **`<defs>`, gradients and clip paths are skipped** — they have no meaningful
  geometry.
- **Degenerate nodes are reported with a flag rather than omitted**, so "empty" is
  never ambiguous with "not measured".
- A `<text>` with `<tspan>` children reports each id'd node's own box and the parent's
  union.

## `relate` and `solve`

**`relate(a, b)`** returns the signed delta between two anchors and the axis it lies
on. One number. This is the verification primitive.

**`solve({ move, so, equals, offset? })`** returns the attribute value that achieves
the relation:

```
solve({ move: '#ord', so: '#ord.cap-top', equals: '#one.cap-top' })
  → { node: '#ord', attr: 'y', value: 29.4 }
```

**`solve` is the operation that removes the iteration.** With `measure` and `relate`
alone the loop is still measure → compute → write → re-measure; with `solve` it is
state the intent → get the number → write it once.

- **`solve` handles translation only.** For translation the delta from `relate` *is*
  the correction, so this is nearly free. Scale and rotation are out of scope and are
  not needed, because alignment is entirely translational.
- **`solve` returns the node and the attribute, never a bare number.** `measure`
  reports root space; an attribute is written in local space. Returning a bare number
  across that asymmetry is a bug factory.
- **Relations are `equals` and `offset(n)`.** Equal-distribution ("make this gap match
  that gap") is deliberately deferred — it needs multi-node solving and a different
  return shape.

## `assert` on `write_image`

`solve` is arithmetic and will be right; the risk is the gap between `solve` and the
artifact. `solve` applies nothing, and the AI then rewrites the **entire SVG document
by hand**. That transcription hop fails in ordinary ways: the number lands on the
wrong node or attribute, the same rewrite also changes the font-size so the solved
value is stale before it is written, an ancestor gains a transform, the document names
a different font than `solve` computed against.

So the check belongs on **the write**. `write_image` accepts an optional `assert`
block naming the relations the AI intends to hold, evaluates them after writing, and
echoes the deltas back.

- **Advisory, never gating.** Assertions report; they do not refuse the write. A
  refusal would be a new failure mode with no upside — the AI may have deliberately
  changed something, and a blocked write on a stale assertion is worse than a visible
  non-zero delta.
- **A render happens only when `assert` is present.** `write_image` today is a pure
  string scan with no browser; assertions need one. Opt-in cost, no impact on ordinary
  writes.
- **It cannot be skipped.** Models forget to verify. A write that echoes its own
  relations checks them whether or not anyone remembered.

## Recorded intent

SVG comments pass the validator, so the AI may record a relation it has solved as
`<!-- #ord.cap-top = #one.cap-top -->`. It is a note, not an enforced constraint — SVG
has no constraint system and none is proposed — but when the font-size later changes,
the intent is still legible and can be re-solved rather than re-guessed.

## What this does not do

- **It does not make `write_image` a layout engine.** Nothing here positions anything
  automatically; the AI still authors the document.
- **It does not add a constraint system.** A solved number is a number, and it is
  wrong again when its inputs change. The durable practice is to re-solve, which is
  what the recorded comment and the `assert` block support.
- **It does not touch the page.** `measure_page` is a follow-on that reuses this
  vocabulary; extending to responsive geometry and box-model anchors is deliberately
  held until the vocabulary has met reality on the simpler surface.
- **It does not convert text to outlines.** `outline_text` ([[DOC-52]] §3.5) is the
  portability fix and carries an open licence question; it is specified but
  unscheduled.

## Behaviour to verify

- A drawing authored as one `<text>` with `<tspan>` children places its runs without
  any `x` being authored for the second and third runs.
- `measure_drawing` on the 1st Contact wordmark reports `ink-right` and `advance-end`
  for the "1" as materially different values.
- `measure_drawing` reports a `requested` ≠ `resolved` font mismatch when a drawing
  names `system-ui`.
- A node with no `id` appears in the response under a path reference.
- `relate` on two anchors of different axes is refused.
- `solve` returns the node and attribute, and applying its value makes the
  corresponding `relate` delta zero.
- `write_image` with an `assert` block reports a non-zero delta when the written
  document does not satisfy the stated relation, and still writes it.
- `write_image` without an `assert` block performs no render.


---

## How it landed

Implementation decisions taken in the free-coding session, recorded here because
they are behaviour a reader of the ticket would otherwise have to infer from the
diff.

### Where the operations live

`measure_drawing`, `relate` and `solve` are **operations on the L1 surface**, in
a new read-effect group `MeasureDrawings`, sitting immediately before
`write_image` in the declaration so the drawing operations read in the order they
are used. They are not on the fidelity surface, even though that is where the
browser lives, because the thing they read is a drawing *in this site* and
reaching it needs the site store — which the fidelity surface deliberately has
not got. To the model there is one flat list of tools, so which surface carries
them is an internal matter.

The browser they need is taken from **the same place the fidelity surface's
comes from** rather than added as a second dependency. A deployment either has a
browser or it does not, and asking that question twice is how the two answers
come to disagree — a session that could take a picture of a drawing but not
measure one is a shape nobody asked for.

### A deployment with no browser says so

Where there is no browser, the three operations are still declared and still
granted, and they **refuse with a sentence naming the reason** rather than being
withheld. Withholding them per deployment would put the grant in two places and
turn a capability question into a start-up failure. A `write_image` carrying an
`assert` block on such a deployment still writes, and reports against each
relation that nothing could be checked.

### The relation syntax, shared by `assert` and the recorded comment

A relation is one string: `<node>.<anchor> = <node>.<anchor>`, optionally `+` or
`-` a number. `assert` takes a list of them, and it is the same sentence the
drawing records in a comment — deliberately, because they are the same claim.
Nothing richer is accepted: no operators, no expressions. A relation is a claim
about two anchors, and anything more is the constraint system this ticket says it
is not building.

`measure_drawing` **reports every relation the drawing records, with what it is
worth now**. That is what makes recording one worth doing: the intent outlives
the number, so when a type size changes the claim is still legible and its delta
is already on the table.

### Assertions report; nothing disappears

A relation that cannot be evaluated at all — a misspelt anchor, a node that is
gone, a string that is not a relation — is **reported with the reason** rather
than dropped. An absent assertion reads exactly like one that passed, which is
the one thing an advisory check must never look like.

### Refusals that name what to do instead

- A node reference the drawing has not got is refused **with the list of
  references it does have**, because the commonest cause is a node with no `id`
  and seeing its path is what prompts adding one.
- `solve` refuses a node no single attribute can move (a `<line>`, a `<path>`)
  and says which kinds it does move. It moves `<text>`, `<tspan>`, `<rect>`,
  `<circle>` and `<ellipse>`.
- `solve` refuses a node inside a rotated or skewed transform, where moving along
  one axis is not something one attribute can do.
- `solve` takes `move` as an optional parameter — `so` already names the node —
  and refuses when the two disagree rather than silently preferring one.

### What the measurement does not hand over

The current attribute values, the local-to-root scale that `solve` works from,
whether a rotation stands in the way, and each node's own path through the tree
are **stripped before the model sees the measurement**. They are how the
arithmetic is done, not something to do arithmetic with, and every field a model
can see is a field it will try to reason from. The path is carried on the node
rather than read back out of the walk that produced it: a composed run's ink is
the union of the runs inside it, the nesting is what says which those are, and
recovering it by position would go quietly wrong the moment a node with no
measurable box was passed over.

### How the browser is asked

The drawing is rendered **inside the site's own draft page, in a shadow root**.
The page is the font context: a drawing's geometry is the geometry of the font it
actually gets, and which font that is depends on the `@font-face` rules the site
declares, so measuring against a blank document would measure a different drawing
from the one a visitor sees. The shadow root is what stops the page's own
stylesheets restyling the drawing on the way past — `@font-face` is
document-scoped and reaches inside it, ordinary selectors do not.

Ink extents come from the canvas text metrics (`actualBoundingBox*`) rather than
from `getBBox()`, because Chromium's `getBBox()` on a `<text>` returns a box built
from the font's ascent and descent — which is the box family, and is already
reported. The font's proportions are **measured in the browser rather than parsed
out of the font file**: a parser is a dependency bought for four numbers, and
measuring gives the proportions of the face that actually resolved rather than of
the one that was asked for.

### The wordmark itself

Correcting the wordmark currently in the 1st Contact draft is a change to site
data, not to code, and is not part of this commit.

## Test plan

`tests/test_UAT_FC_REQ-209_measure_a_drawing.test.ts` — always runs. The anchor
vocabulary and the arithmetic over a measurement, plus the surface that carries
them, against DOC-52 §5.3's own measurement of the wordmark as a fixture: ink
against advance (8.4 units apart), cap-top against ink-top as two different
alignments, axis inference and the refusal of a mismatched pair, `solve` handing
back a place as well as a number and its value zeroing the relation, `assert`
reporting without blocking, and a write with no assertion costing no render.

`tests/test_UAT_FC_REQ-209_measure_in_a_browser.test.ts` — the measuring script
against real Chromium: composed `<tspan>` runs placing themselves with no `x`
authored, ink against advance measured rather than fixtured, per-glyph extents, a
node with no `id` under its path, an empty node flagged, the cap-height ratio
landing on a capital's real ink top, a platform-dependent font stack reporting a
`requested` ≠ `resolved` mismatch, an absent family falling through to its
fallback, and a nested transform resolved away.

Where no Chromium can be launched — none installed, or an OS sandbox that refuses
to let one start — every case in that file **marks itself skipped with the
reason** rather than passing on an empty body. A green tick standing in for a
measurement nobody took is indistinguishable from evidence, which is the one
thing the only test of the geometry must never look like.