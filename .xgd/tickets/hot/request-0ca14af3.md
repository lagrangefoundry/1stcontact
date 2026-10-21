---
uid: request-0ca14af3
id: REQ-423
type: request
title: 'Drawing stays with the consultant: SVG composition moves from builders to
  the principal, stored in the Library'
created_by: EPIC-19
created_at: '2026-10-21T18:52:32.985885+00:00'
updated_at: '2026-10-21T18:52:32.985885+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  story_points: 5
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
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
