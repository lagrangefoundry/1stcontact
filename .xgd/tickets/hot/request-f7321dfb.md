---
uid: request-f7321dfb
id: REQ-288
type: request
title: Fixing image titles for resizing
created_by: martin-github@westhead.me
created_at: '2026-09-20T23:50:27.799384+00:00'
updated_at: '2026-09-21T00:06:47.499461+00:00'
completed_at: null
last_field_updated: body
status: free_coding
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-027b6e4c
---

`transform`** should accept a static translate, in percent of the node's own size**

**Add:** `translateXPct`, `translateYPct` (and optionally `translateXPx`, `translateYPx`) to the `transform` type, applied at paint time, layout unaffected — CSS `transform: translate` semantics.

**Why percent-of-self matters.** A pixel offset is a different number at every width whenever the node's size is responsive, so it needs per-width keyframes and drifts between them. A percentage of the node's own rendered box resolves correctly at every width with a single value and no keyframes.

**The case that produced this.** Lagrange Foundry: four illustration plates, each with a small copper caption plaque that should hang half off the picture's bottom edge like a museum label. Three of the four sit nested inside a section's reading column, which _wraps_ at narrow widths — the column's width jumps rather than sliding, so pinned `geometry` keyframes cannot track it and the plaque drifts into the middle of the picture between stored widths. There is currently **no way to overlap two elements except by pinning coordinates**, so the effect had to be abandoned. With `translateYPct: 50` on a plaque sitting in normal flow, it works at every width with one value.

**Also settle:** paint order for overlapping siblings (later-over-earlier is the sensible default); and that a node translated outside its parent's box still paints rather than being clipped.

**Precedent:** the `motion` type already carries `offsetXPx`/`offsetYPx`, so the renderer can already emit a translate — this exposes it as a static paint offset.

**Rejected:** signed padding (overloads a layout property with a paint one); a stack `overlap` mode or anchored-sibling positioning (much larger spec, and doesn't subsume "by half my own height").
---

## What was built (free-coded)

**The axis.** `transform` gains four optional, typed, bounded numeric fields:
`translateXPct`, `translateYPct` (a share of the node's **own rendered box** — the
CSS `translate()` percentage basis) and `translateXPx`, `translateYPx` (the same
offset in absolute units, for a nudge that is a fixed distance rather than a share
of anything). Both may be given on one axis; they compose. The px pair was
included rather than deferred: once the percent path exists it is two fields, and
"half my own height, minus a 2px optical correction" is a real composition that
otherwise has no spelling.

**Emission.** The renderer emits `transform: translate(<x>, <y>) rotate(...)
scale(...)`, with the translate **first** — the node is moved in its parent's
frame and *then* spun/scaled about its own centre, so the same two values do not
land it somewhere different for every angle. A percentage is emitted as a
percentage, not resolved to px: the renderer does not know the node's width at
any given viewport, and the browser does, at every one of them. Two components on
one axis compose as `calc(50% + 4px)` — arithmetic over two numbers the emitter
formatted itself, never a value from the document. Identity (all-zero) emits no
`transform` at all, so a no-op leaves no trace.

**Envelope.** `translateXPct`/`translateYPct` are bounded to ±1000 (ten times the
node's own size in either direction is far past any composition; the bound is what
keeps a typo from throwing a plaque off the page where no reader can find it and
no gate can see that anything moved). The px pair takes the existing effect-length
bound. `.strict()` continues to refuse any freeform spelling (`translate: "50%
100%"`), so adding a typed offset opens no hole for an untyped one.

**Composition with `motion`.** A state's `offsetXPx`/`offsetYPx` now **add** to the
node's static translate rather than replacing it. CSS `transform` replaces rather
than accumulates, so a hover that emitted only its own offset would snap a plaque
back into the middle of the picture the moment the pointer arrived. Rotation and
scale keep their existing override semantics — a state names an absolute angle or
factor, so there is something to replace; `motion` has no translate to override
with. Under `prefers-reduced-motion` the state settles back to the node's own
transform, static offset included: the offset is placement, not movement.

## The two consequences the ticket asked to settle

**Paint order.** Document order — a later sibling paints over an earlier one — and
it stays that way because the renderer emits no `z-index` anywhere. A translated
node additionally carries a CSS transform, which promotes it into the positioned
paint layer, so **the node that moved is the node on top of what it moved over**.
That is the right default for the only reason to translate a node onto its
neighbour in the first place, and it is what the plaque case needs.

**Clipping.** Nothing clips it. L1 emits no `overflow` on any node, so a node
translated past its parent's edge paints in full — and stays hit-testable — rather
than being cut off at the boundary. An explicit `mask` still clips; that is what
it is for.

## Consequences in the geometry model

The analytic layout evaluator (the geometry envelope's model, `evaluateLayout`)
moves a translated node's **painted box and its whole subtree** while leaving the
height it advances its parent's flow by untouched. Modelling it any other way
would make the evaluator disagree with the browser about the one thing the axis
exists to do, and the disagreement would surface as findings for overlaps that are
not there and silence about the ones that are. A container resolves its
percentage against its own resolved height, which is why the offset is applied
after the subtree is laid out rather than before.

An overlap a translate produces is still **reported** unless the node declares
`stacked: true` — no measurement can tell a deliberate stack from two runs painted
over each other, so the intent is declared rather than inferred (BUG-112).

**A `stacked` declaration now covers the subtree the node carries.** The node that
IS the composition — a caption plaque, a badge — is routinely a container whose
leaves are its children, and a container pushes no leaf of its own, so before this
the plaque's own declaration exempted nothing and the operator had to repeat
`stacked` on every run inside it to say the one thing they had already said.

## Not changed, deliberately

- **Capture / fold.** A captured box is already the post-transform rect, so a
  translate needs no capture axis and the fold recovers a faithful pinned geometry
  from a reference page that uses one.
- **Email.** `transform` is already dropped from the email projection; the
  translate rides that existing rule.
- **The operator edit surface.** The image-framing panel keeps its closed control
  set; a static translate is a composition decision the AI addresses directly.

## Test plan

`tests/test_UAT_FC_REQ-288_transform_translate.test.ts`:

1. the axis emits CSS re-derived from its typed fields — percent, px, both
   composing via `calc()`, translate applied before rotate/scale, identity absent;
2. the envelope rejects out-of-range percentages, out-of-range px, a freeform
   `translate` key and a string value, each naming its path;
3. a hover `motion` offset adds to the static translate instead of discarding it,
   and reduced motion settles back onto it;
4. the geometry model moves the painted box and its subtree, leaves the flow
   below it untouched, reports the overlap, and honours a `stacked` declaration
   made by the enclosing container;
5. end-to-end in a real browser, the ticket's own case: four plates in a wrapping
   reading column whose width *jumps* between 360px and 1280px, one
   `translateYPct` value hanging the plaque half off the picture at both widths,
   the prose below it not moving, the plaque painting over the picture, and —
   translated the other way — painting past its parent's edge unclipped.
   (Skips cleanly on a runner with no browser engine.)
