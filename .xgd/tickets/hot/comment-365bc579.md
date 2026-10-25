---
uid: comment-365bc579
id: COMMENT-4482
type: comment
title: Comment on request REQ-332
created_by: xgd
created_at: '2026-09-29T20:59:45.015853+00:00'
updated_at: '2026-09-29T20:59:45.015853+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-a7b4cce9
  kind: note
---

`repro-console:repro-joyfulculinarycreations-com#4` — iteration 4 re-measurement of issue 2 (no `overflow`, no clip axis) on a fresh capture of joyfulculinarycreations.com.

Bundle: `/Users/martin/lagrangefoundry/1stcontact/storage/references/joyfulculinarycreations.com/index`,
`capturedAt 2026-09-29T19:46:13.536Z`, `captureSchema 8`. **Still open, and it has grown**: 6 clip
findings at iteration 3, **10** now.

## The document is 1700px wide against a 1280px reference

`diff/actual.png` is **1700 × 4743**; `screenshot.full.png` is **1280 × 4744**. `values-diff.json`:

```json
{ "text": "I cannot say enough good things about our meal. Sarah Joy…", "role": "body",
  "property": "overflow", "expected": "≤1280w", "actual": "1700w",
  "kind": "overflow", "tier": "HIGH", "magnitude": 420, "severity": 3080.9976247030877 }
```

## The 10 clip findings, all on two nodes

`gate.json` `layout.findings`, `kind: "clip"` — `paths` `["0.66"]` ×8 and `["0.69"]` ×2:

```
at  768px×768px : leaf right edge 1412px exceeds viewport 768px    ['0.66']
at  768px×1536px: leaf right edge 1412px exceeds viewport 768px    ['0.66']
at 1024px×768px : leaf right edge 1905px exceeds viewport 1024px   ['0.66']
at 1024px×1536px: leaf right edge 1905px exceeds viewport 1024px   ['0.66']
at 1280px×768px : leaf right edge 1700px exceeds viewport 1280px   ['0.66']
at 1280px×1536px: leaf right edge 1700px exceeds viewport 1280px   ['0.66']
at 1440px×768px : leaf right edge 1780px exceeds viewport 1440px   ['0.66']
at 1440px×768px : leaf right edge 1462px exceeds viewport 1440px   ['0.69']
at 1440px×1536px: leaf right edge 1780px exceeds viewport 1440px   ['0.66']
at 1440px×1536px: leaf right edge 1462px exceeds viewport 1440px   ['0.69']
```

`page.json` node `0.66` is the carousel's next slide, pinned at positive x far past the viewport:

```json
{ "kind": "text", "geometry": { "keyframes": [
  { "at": 768,  "x": 760.2,   "y": 4537.47, "width": 652, "atHeight": 1024 },
  { "at": 1024, "x": 1009.59, "y": 2798.7,  "width": 895, "atHeight": 768 },
  { "at": 1280, "x": 1027.25, "y": 3070.33, "width": 673, "atHeight": 800 },
  { "at": 1440, "x": 1107.25, "y": 3070.33, "width": 673, "atHeight": 900 } ] } }
```

and node `0.65` is the *previous* slide at negative x — `{at: 768, x: -643.8}`, `{at: 1024, x: -880.41}`,
`{at: 1280, x: -419.25}`. The reference clips both; the reproduction paints them and the document grows
sideways.

## It is also 56 of this round's 259 escapes

Every one of `section-band-1`'s 56 escapes (28 at height 768, 28 at height 1536) is the same two runs
leaving the band horizontally, not vertically:

```json
{ "kind": "escape", "width": 768, "height": 768,
  "detail": "at 768px×768px: '“So fabulous. We are planning to do this as often as possible. YUMMM “​​' is no longer covered by its backing surface section-band-1 — 644px left of its left edge",
  "boxes": [ {"x":-643.8,"y":4281.47,"width":652,"height":25.5},
             {"x":0,"y":4142,"width":768,"height":462} ] }
```

so this issue is worth 10 clips + 56 escapes + 1 HIGH delta on this bundle. `section-band-1` itself
carries `{"yFactor": 1}` and is otherwise well-behaved — the band is fine, the runs are outside it.

## And two of the round's four LOW `surfaceFill` deltas are downstream of it

```json
{ "text": "“So fabulous. We are planning to do this as often as poss…", "property": "surfaceFill",
  "expected": "#28542d", "actual": "#7a7a7a", "tier": "LOW", "severity": 1060.1623972494212 }
{ "text": "I cannot say enough good things about our meal. Sarah Joy…", "property": "surfaceFill",
  "expected": "#28542d", "actual": "#7a7a7a", "tier": "LOW", "severity": 1060.1623972494212 }
```

`#28542d` is the scrim the reference composites behind those runs *inside* the panel; `#7a7a7a` is the
page canvas, which is what a run sitting at `x = −643.8` stands on. They will go to zero when the
slides stop being painted off-canvas, and should not be worked separately.

## Re-run

```
CHROMIUM_LAUNCH_ARGS=--single-process 1c gate repro-joyfulculinarycreations-com \
  --ref /Users/martin/lagrangefoundry/1stcontact/storage/references/joyfulculinarycreations.com/index \
  --sandbox --out /tmp/gate-after
python3 -c "from PIL import Image;print(Image.open('/tmp/gate-after/actual.png').size)"
```

- **wrong now**: `(1700, 4743)`, and `gate.json` `layout.findings` holds 10 `clip` entries.
- **right when fixed**: `(1280, 4743…4744)`, 0 `clip` findings, `section-band-1`'s 56 escapes gone, and
  the `overflow` HIGH delta gone.
