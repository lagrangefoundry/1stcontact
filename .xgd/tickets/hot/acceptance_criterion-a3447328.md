---
uid: acceptance_criterion-a3447328
id: AC-503
type: acceptance_criterion
title: Hero exposes height, markdown subhead, subhead colour/size, scrim, and content-anchor
  dials
created_by: xgd
created_at: '2026-07-09T21:57:09.706600+00:00'
updated_at: '2026-07-09T21:57:09.706600+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a224111f
  kind: behavior
  regression_only: false
---

## Criterion
The `hero` module exposes further art-direction dials, all drawn from finite enumerations: `height` (`auto` | `fold`, default `auto`) where `fold` fills the band to the viewport fold (min-height 100vh) with the content vertically centred; `contentAnchor` (`top` | `center` | `bottom`, default `center`) which, on a `fold` band, anchors the content to the band's start/centre/end (no effect on an `auto` band); `scrim` (`none` | `light` | `medium` | `strong`, default `none`) which, on the `bg-image` variant, paints a dark-neutral legibility tint of increasing opacity over the image beneath the content; `subheadColor` (`inherit` or any palette role, default `inherit`) which tints the whole subhead block that role's `--color-<role>` while `inherit` keeps the surface text colour; and `subheadSize` (`sm` | `md` | `lg`, default `md`) which sizes the lead + body copy independently of the heading `size`. The subhead content field is rendered as markdown so multi-paragraph/inline-formatted lead copy renders as HTML.

## Verification
Render heroes exercising each dial and assert: a `fold` hero fills the viewport with centred content and honours `top`/`bottom` anchoring; a `bg-image` hero with a non-`none` scrim paints a tint layer over the image beneath the content; a non-`inherit` `subheadColor` tints the subhead with the role custom property; `subheadSize` scales the subhead independently of the heading; and the subhead renders markdown to HTML. Assert defaults (`auto` / `center` / `none` / `inherit` / `md`) reproduce the prior behaviour.
