---
uid: comment-d137259b
id: COMMENT-4020
type: comment
title: Comment on request REQ-271
created_by: xgd
created_at: '2026-09-27T00:03:27.619904+00:00'
updated_at: '2026-09-27T00:03:27.619904+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-caa17b9d
  kind: note
---

`repro-console:repro-joyfulculinarycreations-com#2` — iteration 2 re-measurement of the band surface-fill blindness, on a second bundle.

Bundle: `/Users/martin/lagrangefoundry/1stcontact/storage/references/joyfulculinarycreations.com/index`,
captured `2026-09-26T22:09:36.409Z` at `captureSchema: 7` — current, nothing has
landed since. Gate `structural-failure`, mean 27.53/255, 65 deltas,
**0 of them `surfaceFill`**.

## The class, much larger, and with a mechanism `bandBaseFill` cannot catch

This ticket's issue 3 named a live fold defect the missing axis hides —
`section-band-0.surfaceFill = #030717` painted as the hero band's opaque base.
Here the same class is **97.6% of the entire ranked pixel score** (566,742.17 of
580,737.87, `regions.json`), in two instances, and `values-diff.json` reports
zero `surfaceFill` deltas for either, exactly as this ticket predicts.

**Region 1 — 356,901.96, 61.46% of the score, mean 136.48/255**, bbox
`{x:0, y:2656, w:1280, h:832}`. The fold emits

```
root.45  section-band-1  axes.surfaceFill "#28542d"  kf@1280 {x:0, y:2950, w:1280, h:525}
```

over a rectangle the capture measured as white: `capture.json`
`sections[1].fields[11]` is `{x:0, y:2949.515625, w:1280, h:525.015625}` with
`"surfaceFill": "#ffffff"`. The reference manifest agrees — `expected-manifest.json`
element 82, same box, `surfaceFill "#ffffff"`. `#28542d` is the *testimonial
card's* fill, read off the runs standing on the band (the two off-screen
carousel slides carry `surfaceFill "#28542d"` on the reference side).

**Region 2 — 209,840.21, 36.13%, mean 67.28/255**, bbox `{x:0, y:160, w:1280, h:640}`:

```
root.17  section-band-0  axes.surfaceFill "#000000"  kf@1280 {x:0, y:156, w:1280, h:644}
```

— an opaque black plate over the lower 644px of the hero photograph.

## The sharpening: the right value is already in the document, on a sibling

On both bands the fold has **already emitted a `backdrop-N` box at the same
rectangle carrying the capture's measured fill**, and then paints the inferred
band on top of it:

```
root.0  backdrop-0  #000000                                  {0, 0,       1280, 800}
root.1  backdrop-1  #000000  opacity 0.49  + HERO…jpeg        {0, 0,       1280, 800}
root.7  backdrop-7  #ffffff                                   {0, 2949.52, 1280, 525.02}
…
root.17 section-band-0 #000000  (opaque, no opacity)          {0, 156,     1280, 644}
root.45 section-band-1 #28542d                                {0, 2950,    1280, 525}
```

`backdrop-0` + `backdrop-1` reproduce the hero correctly from capture
`fields[0]`/`fields[1]`; `section-band-0` then erases the photograph because it
is later in document order and absolutely positioned. `backdrop-7` is `#ffffff`
and correct; `section-band-1` covers it in green. So the band is not merely
mis-coloured — it is a **redundant second plate over a correct one**, and the
correct value is in hand at fold time, three siblings earlier in the same
`root.children` list.

`bandBaseFill` (`tools/generate/src/l1/fold.ts:2003-2022`) cannot catch either
instance. It only overrides the runs' inferred fill when the band's best-overlapping
`SectionValues` carries an `overlay` **of the same colour**:

```ts
if (!best?.overlay) return fill
if (best.overlay.color.toLowerCase() !== fill.toLowerCase()) return fill
```

On this bundle `sectionsAtWidest` is the capture's two degenerate sections
(`{0,50,1280,106.28}` and `{0,0,1280,4743.94}`, both `overlay: null`,
`surfaceFill: null`), so `best?.overlay` is falsy and the runs' fill is returned
unchanged every time. Nothing about the scrim/base distinction is wrong; the
inputs it needs are not there.

## Two prerequisites, and which is which

1. **The capture's section list has to describe the page.** Filed this round as
   **REQ-334 issue 2**: `capture.json` records 2 sections, one spanning
   `{0, 0, 1280, 4743.9375}` with `background {"kind":"none"}`, because
   `extract.ts:2440-2444` gates REQ-269's geometric slicer on
   `bandRoots.length === 1` and this page's `<body>` has three children
   (`<header>`, the full-page `<div data-elementor-type="wp-page">`, `<footer>`).
   Until that lands, `bandBaseFill` has no measured per-band fill to prefer.
2. **The fold should prefer the measured fill over the inferred one.** Even with
   a correct `sections[]`, the code above returns `fill` whenever the overlay
   colours do not match, so a band whose section measured `#ffffff` would still
   be painted `#28542d`. The rule wanted is the other way up: take the band's
   own measured fill when the capture has one, and fall back to the runs'
   inferred fill only when it does not.

## And this ticket's own axis is what would have caught it

With a `surfaceFill` axis on the section pass, region 1 and region 2 would each
be a CRITICAL colour delta (`#ffffff` → `#28542d`, `#000000`-over-photo). As it
is, 97.6% of the pixel score arrives as **zero** value deltas, and the gate's
`values.deltas: 65` is entirely text metrics. Adding the axis will raise the
delta count on this bundle by at least 2, and that rise is the instrument
starting to see the largest thing wrong with the page.

## How to see it (no browser needed)

```bash
python3 -c "
import json
c=json.load(open('/Users/martin/lagrangefoundry/1stcontact/storage/references/joyfulculinarycreations.com/index/capture.json'))
f=c['sections'][1]['fields'][11]; print('capture field 11', f['box'], f['surfaceFill'])
p=json.load(open('/Users/martin/lagrangefoundry/1stcontact/storage/tmp/repro-console/repro-joyfulculinarycreations-com/iteration-2/page.json'))
for n in p['data']['page']['l1']['root']['children']:
    if n.get('id') in ('backdrop-7','section-band-1','backdrop-0','backdrop-1','section-band-0'):
        print(n['id'], n['axes'].get('surfaceFill'), n['axes'].get('opacity'),
              [k for k in n['geometry']['keyframes'] if k['at']==1280])"
```
WRONG (now): `capture field 11 {…2949.515625…} #ffffff` beside
`section-band-1 #28542d … {at:1280, y:2950, height:525}` and `backdrop-7 #ffffff`
at the same rectangle.
RIGHT: `section-band-1` carries `#ffffff`, or is not emitted at all because
`backdrop-7` already paints it.

```bash
python3 -c "
import json;v=json.load(open('/Users/martin/lagrangefoundry/1stcontact/storage/tmp/repro-console/repro-joyfulculinarycreations-com/iteration-2/diff/values-diff.json'))
print(sum(1 for d in v['deltas'] if 'surfacefill' in d['property'].lower()), 'surfaceFill deltas of', len(v['deltas']))"
```
WRONG (now): `0 surfaceFill deltas of 65`.  RIGHT: at least 2.

```bash
CHROMIUM_LAUNCH_ARGS=--single-process 1c gate repro-joyfulculinarycreations-com \
  --ref /Users/martin/lagrangefoundry/1stcontact/storage/references/joyfulculinarycreations.com/index --sandbox
```
WRONG (now): region 1 mean 136.48 and region 2 mean 67.28, together 97.6% of the
ranked score. RIGHT: both fall to the text-metric level of regions 3–12 (mean
31–42).
