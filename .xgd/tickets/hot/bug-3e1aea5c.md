---
uid: bug-3e1aea5c
id: BUG-401
type: bug
title: 'Renderer: a heading''s per-width size is overridden by the heading reset below
  its first width'
created_by: EPIC-19
created_at: '2026-11-09T06:32:15.940593+00:00'
updated_at: '2026-11-09T14:48:14.222328+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: high
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-851c4e2b
  story_points: 2
  commits:
  - working_sha: 7e69ec47ee295da681f8c03e6cc0867ed0ad5eb6
    reconcile_sha: null
    main_sha: null
  - working_sha: 539982c7d68141bf13155cdeb04119b74b1348fe
    reconcile_sha: null
    main_sha: null
  version: 0.2.846
---

## Symptom

On a client test site, the hero title (role `display`, sized per width: 54px@375 → 84px@1280) showed at roughly 10–13pt in the builder's Phone preview, while a slightly wider window showed it correctly. The consultant made a real design change (phone title 44px → 54px) to work round what looked like a preview fault. The preview side is BUG-400. This bug is the renderer fault underneath it, and it affects real visitors.

## Root cause

Rendering the page offline with the real renderer (`resolveL1Design` → `renderL1Document`) gives the title's CSS (`h1.l1-6`) in this order:

```
.l1-6 { font-size: 54px }                                  ← the per-width track's base rule (scalarAxisRules)
.l1-6 { font-size: inherit; font-weight: inherit; color: …; … }   ← the node's own rule
@media (min-width: 375px) { .l1-6 { font-size: calc(54px + …) } } …
```

The node's own rule starts with `font-size: inherit`, the REQ-269 heading reset (`packages/framework/src/l1/render.ts`, text case: `if (headingTag) base.unshift('font-size: inherit', 'font-weight: inherit')`). Its comment assumes "any authored axis is pushed later and wins". But a **per-width** size isn't in the node's own rule: it's a separate rule, emitted *before* it, so the reset beats it. **At any viewport narrower than the first keyframe, every heading (`h1`–`h6`) with a per-width size renders at the inherited size** (the container's or body's). From the first keyframe up, the media rules take over and it looks right.

Visitors are affected, not only the preview. That page's own width ladder includes 320px, so a 320px phone gets the tiny title, and so does any frame whose inner width falls under the first keyframe. Body text with per-width sizes is unaffected (no reset).

## Expected behaviour

1. **A heading with a per-width size has that size at every width.** Below its first keyframe it takes the first keyframe's value, never an inherited one.
2. **The heading reset applies only where the node authors no size of its own.** It never sits between a node and its own per-width track: it's dropped for a property the node sizes per width, or it's emitted at lower precedence than the track. The same goes for `font-weight` and any other property the reset covers.
3. **No per-width axis is masked by its node's own defaults.** Every `responsive.*` track (font size, line height, letter spacing, padding) wins over that node's unshifted base declarations at every width, including below its first keyframe.
4. **Published sites, the preview and the draft all get the fix** at their next render, with no change to any site's definition.

## Test plan

UATs `test_UAT_FC_BUG-<n>_*`, rendering through the real renderer in a real browser:
- an `h1` of role `display` sized 54@375 → 84@1280 has computed `font-size` 54, 54, 54, 56 and 84px at viewports 320, 374, 375, 768 and 1280;
- the same for `h2` and `h3` with their own tracks;
- a heading with a single fixed size (no track) keeps it at every width, and a heading with no size of its own still inherits (REQ-269 kept);
- a body-role paragraph with per-width sizes renders exactly as before (byte-identical CSS).

## What changed

`packages/framework/src/l1/render.ts`:

- Each node records the per-width tracks it owns (`pushTrack`: property → floor, the first keyframe's value). That covers the text axes (font size, line height, letter spacing) and padding (top/right/bottom/left).
- When the node's own rule is emitted, `ownTracksWin` does two things:
  - It **drops** any declaration of exactly a tracked property. A heading sized per width no longer carries REQ-269's `font-size: inherit` (expected behaviour 2).
  - Where a shorthand that also sets a tracked longhand stays in the rule, it **restates the floor after it**. The shorthand stays because it carries other resets: a control's `font: inherit` (font size, line height) and `padding: 0`, and `padding`/`padding-block`/`padding-inline`. So no `responsive.*` track is masked by its node's own defaults below its first keyframe (expected behaviour 3).
- The track's media rules still follow the node's rule, so from the first keyframe up nothing changes.
- A node with no such declaration (body text, a heading with a fixed size, any node without tracks) emits byte-identical CSS.
- `font-weight: inherit` is untouched: weight has no per-width track, and an authored weight is pushed later and wins as before.
- This is a renderer change only. Published sites, the preview and the draft all pick it up at their next render, with no change to any site's definition (expected behaviour 4).

## UATs

`tests/test_UAT_FC_BUG-401_heading_per_width_size_below_first_width.test.ts` (real `resolveL1Design` → `renderL1Document` / `renderL1Fragment`, read off a real Chromium):

- `display_h1_takes_its_first_keyframe_below_it`: role `display` as `h1`, 54@375 / 56@768 / 84@1280. Computed size is 54, 54, 54, 56 and 84px at 320, 374, 375, 768 and 1280. On the old renderer it was 16, 16, 54, 56, 84.
- `h2_and_h3_take_their_own_tracks_below_the_first_width`: each holds its own first keyframe at 320 and 374, and is fluid above.
- `fixed_size_heading_keeps_it_and_unsized_heading_still_inherits`: a fixed 31px heading is 31px at every width, and an unsized `h2` inherits the body's 16px, never the UA's scale (REQ-269 kept).
- `control_font_reset_does_not_mask_its_own_track`: a control's own rule restates the track floor after `font: inherit`.
- `body_paragraph_css_is_unchanged`: a body paragraph with a per-width size still emits the BUG-18 base rule, then its own rule with no size, then the media rules.