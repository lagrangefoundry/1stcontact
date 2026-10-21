---
uid: request-0ca14af3
id: REQ-423
type: request
title: 'Drawing stays with the consultant: SVG composition moves from builders to
  the principal, stored in the Library'
created_by: EPIC-19
created_at: '2026-10-21T18:52:32.985885+00:00'
updated_at: '2026-10-21T21:21:14.629458+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: high
  story_points: 5
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-9c913f76
---

## Why (Ariel's AR Welding run, 2026-10-21; operator decision)

The site's logo (`ariels-sign.svg`) was a hand-written SVG composed through
`write_image` on the L1 surface — the builders' grant, i.e. Haiku 4.5. Drawing in
SVG means planning curves and proportions in coordinates with no eyes on the
result: spatial reasoning plus design judgement, where the larger model is much
stronger. An earlier logo (xgd) drawn when the consultant worked directly was
"moderately successful"; this one was worse.

> SVG should be taken from the delegate and kept with the principal. (operator)

A logo is small in tokens and large in impact — exactly where the principal's
judgement is worth paying for (EPIC-19's cost model: tokens are scarce, so spend
them where judgement matters).

## What changes

1. **Builders can't draw SVG.** `write_image` (and any other tool that composes an
   image from markup) is removed from the builder grant. A builder asked to
   produce a picture refuses with a pointer back to the consultant; builders still
   **place** images (`place_on_site`) that already exist in the Library.
2. **The consultant draws.** The consultant gets an image-drawing operation on a
   surface it holds while commissioning (not the L1 write surface — see
   REQ-343/416): it composes an SVG and stores it **as a Library item** (REQ-404:
   every site image has a Library item), with a label (IMAGE-n) and a
   description. Builders then place it like any other Library image.
3. **It looks before using.** After drawing, the consultant looks at the result —
   alone and at the header's actual size — before briefing anything around it
   (a `screenshot` of the Library item; counts as a look under REQ-415).
4. **The consultant's logo method (priming):**
   - Start with a **wordmark**: the business name well set — typeface, weight,
     spacing, maybe one simple mark or rule — which L1 typography does well and
     stays crisp and editable.
   - An **illustrated mark** comes from image generation (`CreateImage` /
     `EditImage`) with the consultant iterating with the client, not from
     hand-drawn paths.
   - Hand-drawn SVG (by the consultant) is for simple geometric marks, icons and
     dividers.
5. **Talker:** drawing stays withheld from the talker (REQ-416) — it changes
   assets the build uses.

## Test plan
- The builder's granted tools contain no image-composing operation; a builder
  brief to draw a logo gets the refusal.
- The consultant's drawing operation stores an SVG as a Library item with a label
  and description; a builder can `place_on_site` it.
- The SVG passes the same safety validation as before (no script, no external
  references).
- Priming carries the wordmark-first / generate-for-illustration / look-before-use
  method.


## Design decisions (implementation session, 2026-10-21)

- **The drawing operation is `draw_image` on the Library surface** (group `DrawImages`,
  effect write), not on L1. The Library grant travels with its surface and is not
  narrowed while the consultant commissions (REQ-343), so the consultant holds it;
  builders get the Library read-only (REQ-387, derived by `readOnlyGrant`), so they
  never hold it.
- **`write_image` is removed from the L1 surface entirely** — its operation, its
  `DrawImages` group, its "Draw an image and use it" sequence, and both
  `instances.json` grants. One way to draw, not two. This explicitly supersedes the
  REQ-209 behaviour of `assert` relations on `write_image`: `measure_drawing`,
  `relate` and `solve` still measure a drawing once it is on the site.
- **A drawing is a Library item from its first write.** `draw_image` validates the SVG
  with the same `validateSvg` envelope as before (no script, no event handler, no
  stylesheet, no external reference; refused whole with the reason, nothing stored),
  then stores it through the same path a generated picture takes
  (`generatedMaterialStore`): a `material` ticket, `origin: generated`, `kind: image`,
  `role: site`, republishable, a label (IMAGE-n), the description as its body, the
  SVG attached as `<name>.svg` (`image/svg+xml`), indexed. Every draw is a new item —
  a redraw is a new IMAGE-n.
- **The result hands back a `display` line** (where the deployment can show one) so
  the client sees the drawing in the conversation, plus the item's `item` handle and
  `label`.
- **Placing is the consultant's.** Builders do not hold `place_on_site` (REQ-387).
  The consultant places the drawing (`place_on_site`, which works for an SVG item
  exactly as for any picture) and briefs the builder with the `/assets/…` handle.
- **Builders are told drawing is not theirs**: the builder priming says a builder
  asked to draw or compose a picture refuses and names the consultant.
- **Talker:** `draw_image` is on the talker's withhold list.
- **Look before using**: `screenshot` with `of.image` already shows a stored SVG
  whole; the consultant looks at the item alone, and at the header after it is placed.

## Test plan (as implemented)

- `test_UAT_FC_REQ-423_*` in `tests/`: the builder's composed tool list holds no
  `draw_image`/`write_image`; the consultant's (commissioning) list holds `draw_image`;
  `draw_image` stores a labelled, described SVG Library item that `place_on_site`
  puts on the site; hostile SVG is refused and nothing is stored; the talker
  withholds `draw_image`; priming carries the logo method and the builder refusal.
- Existing tests that drew with `write_image` are retargeted to the new operation or
  to the site store directly.