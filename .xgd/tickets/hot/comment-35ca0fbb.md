---
uid: comment-35ca0fbb
id: COMMENT-4305
type: comment
title: Comment on request REQ-302
created_by: xgd
created_at: '2026-09-29T04:04:06.098062+00:00'
updated_at: '2026-09-29T04:04:06.098062+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-edbc7e5f
  kind: note
---

repro-console:repro-faelan-com#4

Issue 4 (the hero scrim's `surfaceFill` asymmetry) re-measured on
`storage/references/faelan.com/index`, iteration 4. It is now **100% of this
round's value deltas** — 4 of 4, and the only deltas the gate reports.

```
FAELAN     surfaceFill  expected #000000  actual #0b101e  LOW  severity 1060.1514312600393
Artist •   surfaceFill  expected #000000  actual #0b101e  LOW  severity 1060.1514312600393
Musician   surfaceFill  expected #000000  actual #0b101e  LOW  severity 1060.1514312600393
• Creator  surfaceFill  expected #000000  actual #0b101e  LOW  severity 1060.1514312600393
```

Arithmetic confirmed, same as COMMENT-4042 on the previous round of this bundle:
`#0f172b` = (15, 23, 43); × 0.7 → (10.5, 16.1, 30.1) → round → (11, 16, 30) =
`#0b101e`. Both manifests report `bodyBackground: #0f172b`.

**One thing here that I have not seen stated on this ticket, and it sharpens the
"what is the differentiator" question COMMENT-4042 left open.** On this page the
scrim is a DOM element of its own, and the capture records the *same scrim twice,
in two different forms, and flattens it only in one of them*:

- as the section's own declaration, with its alpha intact —
  `capture.json` → `sections[0].background`:
  ```json
  { "kind": "image", "image": "assets/scorched-earth.jpeg",
    "overlay": { "color": "#000000", "opacity": 0.3 } }
  ```
- and again on every run inside it, flattened to opaque —
  `capture.json` → `sections[0].content[*]`:
  ```json
  "surfaceFill": "#000000",
  "surface": { "self": false, "box": {"x":0,"y":0,"width":1280,"height":800}, ... }
  ```

Ground truth is `raw.html`'s `<div class="montage-overlay">` under
`.montage-overlay[data-astro-cid-j7pv25f6]{position:absolute;inset:0;background:#0000004d}`
— alpha 0x4d/255 = 0.302, over a `.montage-container` that paints only a
background *image*. So the reference's `#000000` is the scrim's colour with its
alpha discarded, and the `surface.self: false` next to it says the run does not
own that fill.

The reproduction composites correctly and the reference record does not, so the
delta points the wrong way: `overlay` (the axis that kept the alpha) matches
exactly on both sides — `{"color":"#000000","opacity":0.3}` in
`expected-manifest.json[sections][0]` and in `actual-manifest.json[sections][0]` —
while `surfaceFill` (the axis that dropped it) is the only thing that disagrees.
The two axes describe one scrim and only one of them survived the read.

Everything else on this bundle agrees: the four runs' `box`, `color`,
`fontSizePx`, `fontWeight`, `lineHeightPx`, `letterSpacingPx` and
`renderedTextBox` are identical on both sides.

Pixel cost here is **zero and cannot be otherwise**: all four of these runs are
painted under an opaque collage photograph in the reproduction (REQ-347 issue 1),
so their surface is not on screen at all. The delta is a pure ruler artifact on
this page.
