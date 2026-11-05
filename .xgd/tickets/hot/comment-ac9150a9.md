---
uid: comment-ac9150a9
id: COMMENT-4021
type: comment
title: Comment on request REQ-265
created_by: xgd
created_at: '2026-09-27T00:03:35.939678+00:00'
updated_at: '2026-09-27T00:03:35.939678+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-47ab4ddc
  kind: note
---

`repro-console:repro-joyfulculinarycreations-com#2` — iteration 2 re-measurement of the half-leading class, with a full-line-box instance that bounds the fix.

Bundle: `/Users/martin/lagrangefoundry/1stcontact/storage/references/joyfulculinarycreations.com/index`,
captured `2026-09-26T22:09:36.409Z`, `captureSchema: 7` — current. Gate
`structural-failure`, 65 deltas. **3 of the 65 are this class**, and so are 9 of
the 27 gate overlaps.

## 1. The half-leading itself, re-measured at −11px on both hero lines

`capture.json` records the hero heading as `box {x:20, y:311.296875, w:815.203125,
h:97}` with `lineHeightPx: 75.4` and `renderedTextBox` identical to the box. The
fold writes one line-height as the node's height, and the renderer paints the
glyphs at the top of it:

| | reference | reproduction |
|---|---|---|
| `Dreaming of healthier meals` box | `h 97` | `h 75.40625` |
| its `renderedTextBox` | `y 311.296875, h 97` | `y 300.296875, h 97` |

`(97 − 75.4) / 2 = 10.8` → the two CRITICAL `position` deltas
`(20, 311) → (20, 300)` and `(20, 387) → (20, 376)`, both −11 in y and 0 in x.

## 2. New: the error is not always half a leading — here it is a whole one

`raw.html` carries

```html
<h2 class="elementor-heading-title elementor-size-medium"><br>What people are saying </h2>
```

— a literal leading `<br>`, so the element is **two** line boxes tall with the
glyphs on the second. `capture.json` says so exactly: `box {x:265, y:2969.515625,
w:750, h:92.8125}`, `lineHeightPx 46.4`, `renderedTextBox {x:455.03125,
y:3008.921875, w:369.921875, h:60}` — the glyphs start 39.41px below the box
top, and `92.8125 = 2 × 46.40625`.

The fold writes `h 46.40625` (one line-height, again) and the renderer paints
the glyphs at the top: `actual-manifest.json` gives the same box `x 265, y
2969.515625, w 750` at `h 46.40625`, and the glyph box at `y 2962.515625`
instead of `3008.921875`. That is the round's **largest** CRITICAL position
delta, `(455, 3009) → (455, 2963)`, magnitude **46.40625 — a full line box, not
half a leading.**

Note the control this gives you for free: this run's `renderedTextBox` **width**
matches to 4dp (369.921875 on both sides), because it is Oswald at weight 200,
the one Oswald weight the bundle's `@font-face` declares. So nothing about this
delta is contaminated by REQ-334's font-weight residual — it is purely the box.

## 3. What that means for the proposed fix

REQ-332's COMMENT-3961 already noted that the fix as proposed corrects the top
and not the height. This bundle makes the consequence concrete: a top-only
correction moves the hero lines by 10.8px (right) and leaves `What people are
saying` 46.4px wrong (unchanged), because there is no half-leading to add — the
glyphs are on a second line the reproduction does not have.

**The fold has to carry the captured box height.** `l1KeyframeSchema.height` is
already optional and accepted
(`packages/site-schema/src/l1/schema.ts:44`), and the renderer already emits it
for absolutely-placed nodes — but **all 73 text nodes in this reproduction omit
it**, so a text run's height is always re-derived as
`lineHeightPx × (lines the renderer happens to wrap to)`. Census from
`page.json`: `text × 73`, of which `keyframes carry height` = **0**.

## 4. It is also 9 of the 27 gate overlaps

`gate.json` `layout.findings` reports `0.17.0` overlapping `0.17.1` —
`Dreaming of healthier meals` over `on your dinner table?` — at **every one of
the 8 sampled viewports** (320/375/768/1024/1280/1440 × 768, and 320…1440 ×
1536). They are two adjacent lines of one heading: L1 stacks them one
`lineHeightPx` (75.4px at 1280) apart while each paints a 97px glyph box, so
each line's ink runs 21.6px into its successor's box. Carrying the captured box
height closes these as well; correcting only the top does not.

## 5. How to see it (no browser needed)

```bash
python3 -c "
import json,re
c=json.load(open('/Users/martin/lagrangefoundry/1stcontact/storage/references/joyfulculinarycreations.com/index/capture.json'))
for s in c['sections']:
  for r in s.get('content',[]):
    if (r.get('text') or '').strip().startswith('What people are saying'):
      print('capture  box', r['box'], 'lineHeightPx', r['lineHeightPx'], 'glyphs', r['renderedTextBox'])
a=json.load(open('/Users/martin/lagrangefoundry/1stcontact/storage/tmp/repro-console/repro-joyfulculinarycreations-com/iteration-2/diff/actual-manifest.json'))
for el in a['elements']:
  if (el.get('text') or '').strip()=='What people are saying':
    print('rendered box', el['box'], 'glyphs', el.get('renderedTextBox'))"
```
WRONG (now): capture `h 92.8125` with glyphs at `y 3008.921875`; rendered
`h 46.40625` with glyphs at `y 2962.515625`.
RIGHT: rendered `h 92.8125`, glyphs at `y 3008.92`.

```bash
CHROMIUM_LAUNCH_ARGS=--single-process 1c gate repro-joyfulculinarycreations-com \
  --ref /Users/martin/lagrangefoundry/1stcontact/storage/references/joyfulculinarycreations.com/index --sandbox
```
WRONG (now): CRITICAL `position` `text @ (455, 3009)` → `text @ (455, 2963)`,
plus the two −11px hero lines, plus 9 `overlap` findings on `['0.17.0','0.17.1']`.
RIGHT: all three position deltas and all 9 overlaps gone.
