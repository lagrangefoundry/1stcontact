---
uid: request-d648490d
id: REQ-211
type: request
title: 'Text can vary within a run: multi-variate L1 text'
created_by: CHAT-49
created_at: '2026-09-09T21:25:01.708637+00:00'
updated_at: '2026-09-10T00:29:59.555875+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  priority: medium
  story_points: 13
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-6f40c2bc
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

## Behaviour to verify

- An L1 document whose text node is a plain string validates and renders exactly as
  before.
- An L1 document whose text node is a run array validates, and each run renders
  carrying its own fill and weight.
- A run array rejects nesting, and rejects an axis outside the permitted subset.
- A captured page containing an emphasised word folds to a multi-run text node rather
  than a flattened string.
- The editor opens a multi-run text node as one field per run, each a plain string.
- Text-height estimation over a multi-run node produces a height consistent with the
  same copy as a single run.