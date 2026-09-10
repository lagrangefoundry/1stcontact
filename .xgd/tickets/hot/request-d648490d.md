---
uid: request-d648490d
id: REQ-211
type: request
title: 'Text can vary within a run: multi-variate L1 text'
created_by: CHAT-49
created_at: '2026-09-09T21:25:01.708637+00:00'
updated_at: '2026-09-10T17:25:21.749279+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  priority: medium
  story_points: 13
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-6f40c2bc
  commits:
  - working_sha: df9862ce77203dac7d95e47cf07db2f2908e36d3
    reconcile_sha: null
    main_sha: null
  - working_sha: abd3f5388a5c3bbbedae3740659ec392ba4fcb32
    reconcile_sha: null
    main_sha: null
  version: 0.2.145
---

## What changes

**One string of page text can vary within itself** — a coloured word in a headline, an
ordinal set as a superscript, an emphasised phrase in a paragraph.

Today it cannot. `l1TextSchema` is one flat string with one set of axes:

```ts
export const l1TextSchema = z.object({
  kind: z.literal('text'),
  text: z.string(),                     // ← flat string
  axes: l1TextAxesSchema.optional(),    // ← applies to the whole run
  …
}).strict()
```

Specified in [[DOC-52]] §3.7.

## This is a latent hazard, not a missing nicety

The only way to get one coloured word in a headline today is **three text nodes
positioned absolutely** — which is exactly the trap that produced [[DOC-52]] §2, except
worse on the page than in a drawing: absolutely-positioned text fragments are fragile
at every breakpoint and break the moment copy reflows.

**The schema actively pushes the AI toward brittle geometry for ordinary typography.**
An ordinal, a trademark, an emphasised phrase — each currently costs a hand-positioned
fragment whose coordinates are a guess and whose responsive behaviour is wrong. The
session in [[DOC-52]] §2 reached for exactly this construction, believed inline
formatting was impossible, and was correct about L1 while being wrong about SVG.

## The shape

`text` accepts **either** a string — unchanged, so every existing document stays
valid — **or** a one-level array of `{ text, axes? }` runs.

- **Run axes are a narrow subset**: fill / palette ref, size scale, weight, baseline
  shift. Not the full text axis set.
- **One level only.** No nesting, no links inside runs. The schema stays closed.
- **The string form remains canonical for single-run text.** A one-element array is
  not the preferred spelling of a plain string; the fold and the renderer should not
  produce one.

## The blast radius is the real cost

The schema change is small. What it touches is not:

- **The renderer** emits a span per run, carrying the run's axes.
- **The fold** must *recover* runs from captured HTML — a capture of a real site with
  an emphasised word currently flattens it, and after this it should not.
- **`probes.ts` text estimation** measures a run's natural height; a multi-run text
  node changes what it is estimating.
- **The editor's exposure rule.** [[DOC-28]] §3 promises the user *"a plain string or
  a pick from a closed list"*. Multi-run copy has to be exposed without breaking that.
  **One field per run** is the proposed answer — simple, honest, and it keeps every
  control a plain string. Whether it survives contact with a real example is the open
  question ([[DOC-52]] §7 Q3).

## What this does not do

- **It does not add inline links.** A link inside a run is a second addressing
  problem; the renderer remains the sole `<a>` sink.
- **It does not add nesting.** One level is deliberate. Arbitrary nesting is rich text,
  and rich text is a different product decision.
- **It does not replace outlines for logos.** For a *mark* the right answer is
  `outline_text` ([[DOC-52]] §3.5), because a logo needs to be identical everywhere.
  Runs are for *page copy*. Different surfaces, different answers — these do not
  compete.
- **It does not change how the AI draws.** Inline formatting inside an SVG already
  works via `<tspan>`; that is [[REQ-209]].

## Decisions taken while implementing

Each of these is a consequence of the shape above rather than a separate intent, and
each is recorded because it is a claim the tests make.

### The run-axis subset, exactly

`color`, `sizeScale`, `fontWeight`, `fontStyle`, `baselineShiftEm` — and nothing else.

- **`fontStyle` is in the subset**, though [[DOC-52]] §3.7's list omitted it. An
  emphasised phrase is the ticket's own motivating example, and in prose emphasis is
  italic at least as often as it is bold; a subset that could not express it would not
  cover the case it was written for.
- **Both sizes are relative** — `sizeScale` is a multiplier emitted as `em`,
  `baselineShiftEm` is `em` of the run's own size. This is not shorthand. A node
  routinely carries a per-width `responsive.fontSizePx` track (BUG-18), and a run
  declaring absolute pixels would win at every width that track covers — pinning the
  ordinal at its desktop size on a phone, which is the responsive failure this whole
  capability exists to avoid.
- **Everything else stays a node axis.** Alignment, measure, family, tracking,
  line-height, the painted surface, the wrap threshold: each either describes the
  block (meaningless on a fragment of a line) or describes the face (what makes a
  paragraph read as one paragraph).
- **`baselineShiftEm` renders as `vertical-align`**, not a transform, so the line box
  still accounts for the lifted run and neighbouring lines do not collide with it.

### The canonical form is structural

A one-element run array is **refused by the schema**, not merely discouraged. Two
spellings of the same thing is the drift this codebase refuses everywhere else: the
fold, the renderer and the editor would each need a rule about which one they emit,
and the first one to disagree makes a document that reads differently depending on
who wrote it.

The renderer follows the same rule in its output: **a run with no axes emits no
span**, so the markup a multi-run node produces is the markup the same copy would
have produced as a plain string, plus exactly the spans that carry a difference.

### Run axes are inside the envelope

A run is a piece of the same paragraph, so the L1 envelope reaches into it: weight
takes the existing `fontWeight` bounds, and two new bounds are added —
`runSizeScale` (a scale so small the reader cannot see it still reserves a line box;
a scale so large is a display heading smuggled into a paragraph) and
`runBaselineShiftEm` (a lift large enough to fling a run clear of its own line box,
overlapping whatever is above it, with nothing in flow to say so). An envelope that
stopped at the node would leave the one place inline variation can be authored as the
one place it is unbounded.

### The fold rejoins only flows that *vary*

The capture already walks text nodes, so a sentence with an emphasised word has always
arrived as several runs. What it did not record is **which runs are pieces of one
inline flow**, so five new capture fields say so: the flow's id, the run's position in
it, the flow root's rect, the run's text with its own separating spaces kept, and the
run's `vertical-align`. A `<br>` ends a flow, and so does any element the browser
blockifies — which is what keeps a flex row of links from silently becoming one
sentence.

The fold then rejoins **only the flows whose runs actually differ** in fill, size,
weight or slope. A flow that varies in nothing has no inline variation to express, and
rejoining it would trade a set of exactly-transcribed boxes for one flowed box on
nothing but a hope that the browser re-wraps them identically. This also means a
rejoined node always carries at least one run with axes, so the canonical-form rule
above is satisfied by construction.

The node's own axes — its family, its measure, its alignment, its per-width size track —
come from the flow's **longest** run, not its first. Those axes belong to whichever run is
the paragraph rather than the ornament, and length is what tells them apart: an ordinal is
two characters and a headline is forty. Taking the first would hand a sentence that opens
with an emphasised word its emphasis's type as the paragraph's own. Ties go to the earlier
run, so the choice is stable across widths.

A rejoined node lays out in the **flow root's** rect, not in the tight box of whichever
fragment carries it, and it does **not** take a `nowrapFromPx` pin: that threshold
states a fact about one fragment's glyph extent inside a box the fold pinned to it, and
a rejoined node's box is one the reference already sized to hold the whole sentence.

### The fidelity oracle rejoins the same flows

**This is the property that keeps the change from breaking the gate.** The oracle is
the reference side of the fidelity measure; if the fold rejoins a flow the oracle still
counts as three elements, every page that emphasises a word reports two phantom
`unmatched` runs — the measure manufacturing the defects it exists to find. So the
decision is stated once, in one module, and both sides ask it.

For the same reason the **round-trip expected manifest projects one element per run**,
not per node: the browser gives a run its own text node the moment the run paints
anything, so a projection that expected one element for a three-run heading would
report the two it never claimed as unmatched while saying nothing about whether the
coloured word was actually coloured.

### The editor's fields

A plain-string node keeps the field name `text` it has always had. A multi-run node
exposes `text1 … textN`, labelled `Text 1 … Text N`, each a plain string and each
first in the schema so the modal still puts the cursor in the words. Editing one run
writes only that run's words and leaves its axes — and every other run — untouched.

Per-run *axes* are deliberately not exposed. The words are content; the axes are the
AI's, like every other axis on the node.

A name that addresses no run — `text9` on a three-run node, or `text` on a multi-run one —
is refused naming the field, not guessed at. That is the rule the modal's write path
already applies to every field it did not derive, and a run field is not an exception to
it: a name outside the derivation means the client resolved against a different node than
the one it is writing to, and writing part of that map would land a partial edit.

## Behaviour to verify

- An L1 document whose text node is a plain string validates and renders exactly as
  before.
- An L1 document whose text node is a run array validates, and each run renders
  carrying its own fill and weight.
- A run array rejects nesting, and rejects an axis outside the permitted subset.
- A one-element run array is refused: the string is the only spelling of single-run
  copy.
- A run with no axes of its own renders as bare text, with no span.
- Run axes are bounded by the L1 envelope — an out-of-range scale, lift or weight is
  refused, and the ordinary values a superscript uses are admitted.
- A captured page containing an emphasised word folds to a multi-run text node rather
  than a flattened string, and that node lays out in its flow root's box.
- A captured flow whose runs vary in nothing is left as separate nodes.
- The capture records which runs share an inline flow; a `<br>` and a blockified child
  end one.
- The fidelity oracle counts a rejoined flow exactly once, and counts a flow the fold
  declined to rejoin exactly as many times as the fold emits nodes for it.
- The editor opens a multi-run text node as one field per run, each a plain string;
  editing one run leaves the other runs and every run's axes untouched.
- A copy field naming no run is refused, naming the field.
- A rejoined node takes its own axes from the flow's longest run.
- Text-height estimation over a multi-run node produces a height consistent with the
  same copy as a single run, and a run set at a smaller scale consumes less of the
  line.