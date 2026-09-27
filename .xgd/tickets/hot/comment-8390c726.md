---
uid: comment-8390c726
id: COMMENT-4022
type: comment
title: Comment on bug BUG-142
created_by: xgd
created_at: '2026-09-27T00:03:38.769217+00:00'
updated_at: '2026-09-27T00:03:38.769217+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: bug-a00b4298
  kind: note
---

`repro-console:repro-joyfulculinarycreations-com#2` — iteration 2 re-measurement: the panel/content viewport-height asymmetry is still here, but it has inverted.

Bundle: `/Users/martin/lagrangefoundry/1stcontact/storage/references/joyfulculinarycreations.com/index`,
captured `2026-09-26T22:09:36.409Z`, `captureSchema: 7` — current. Gate verdict
`structural-failure`, and this is the whole of it: 371 `escape` findings and 27
`overlap` findings, zero of which is a rest-state pixel problem.

## The asymmetry is the other way round now

§3 of this ticket measured it as *"13 of the 14 panels carry
`viewportResponse: {yFactor: 1}`. **No text node carries one, and none
structurally can.**"* On this reproduction text nodes do, and the panels are the
ones that do not. Census over `page.json` (`text × 73`, `container × 18`,
`box × 13`, `image × 5`):

| kind | carries `viewportResponse` | does not |
|---|---|---|
| text | **47** | 26 |
| box | 12 | 1 |
| container | 12 | **6** |
| image | 4 | 1 |

The six containers without one all carry a **fixed keyframe `height`** and all
hold children that do have one:

```
root.17  section-band-0   heights [265, 237, 238, 676, 644, 735]   children: 3 text @ yFactor 0.5, card-0 @ 0.5
root.45  section-band-1   heights [462, 455, 525, 525]             children: card-4 @ yFactor 1
root.47  section-band-2   heights [342.16, 307.53, 239.95, …]      children: 2 text @ yFactor 1
root.14  (unnamed)        heights [210, 265, 282.7, …]             children: image-2 @ 1, text @ 1
root.46  (unnamed)        heights [644.2, 516.7, 282.7, …]         children: 4 text @ 1
root.62  (unnamed, footer nav) heights [105.09, …, 95.52]          children: text @ 1, then 5 with none
```

So the composition this ticket describes is unchanged — a surface and the copy
it backs answer the viewport-height axis differently — but the fix that landed
gave the response to the runs rather than to the panels, and the surfaces were
left behind. `L1ViewportResponse.heightFactor` exists and the fold does emit it
(`backdrop-0` and `backdrop-1` both carry `{heightFactor: 1}`), so nothing in
the substrate is blocking the other half.

## Arithmetic, closing to the pixel on two bands

**`section-band-0` at 320px × 1536px.** Band: `y 88`, `height 265` → bottom 353
(band-local). Child `0.17.2` (`Holistic In-Home Personal Chef Services for the
busy family`): `y 132.39`, `viewportResponse {yFactor: 0.5}`, so at viewport
height 1536 it sits at `132.39 + 0.5 × (1536 − 800) = 500.39`; at 320px its
`lineHeightPx` track gives 19.8 and the copy takes two lines, so its bottom is
`88 + 500.39 + 39.6 = 627.99`. `627.99 − 353 = 274.99`. `gate.json` reports:

> `'Holistic In-Home Personal Chef Services for the busy family' is no longer
> covered by its backing surface section-band-0 — 275px below its bottom edge`

**`section-band-2` at 320px × 1536px.** Band `height 342.16`; child `0.47.1`
`y 124.16` with `{yFactor: 1}` → `860.16` at 1536, ten 17px lines → bottom
`1030.16`, escape `1030.16 − 342.16 = 688`. Reported: **688px**.

## What it costs

- **163 of the 371 escapes** are those three bands alone: `section-band-0` 89,
  `section-band-2` 57, `section-band-1` 17. The rest are `card-*` (104, largely
  REQ-324's single-run-surface shape) and `backdrop-*` (104).
- **18 of the 27 overlaps.** All 18 are at viewport height 1536, and all 18 pair
  a top-level run carrying `{yFactor: 1}` with one of `0.62.1 … 0.62.5` — the
  five footer-nav runs that carry **none**, inside a container that carries
  none. e.g. `at 320px×1536px: We create customized menus… overlaps Meet the
  Chef` (`['0.57','0.62.1']`): `0.57` has `yFactor 1` and descends 736px; the
  nav does not move. The other 9 overlaps are REQ-265's half-leading (`0.17.0`
  over `0.17.1`) and are not this ticket.
- Zero perceptual cost at rest, exactly as this ticket says: none of the 12
  ranked regions is an escape or an overlap.

## Unrelated but visible in the same nodes, already owned elsewhere

`0.62.1 … 0.62.5` are the **header** nav runs parented under the **footer** nav
container and repaired with `y = −4572.42` at 1280 and `−4672.42` at 1440
(`250 + 392.2 − 4572.42 = 70` puts `Meet the Chef` back on the header line,
which is where the reference paints it). That is REQ-302's issue 2 — the
sign-flipping sibling repair — already appended for this bundle in iteration 1
as COMMENT-3962/3963, and not re-filed here.

## How to see it (no browser needed)

```bash
python3 -c "
import json
p=json.load(open('/Users/martin/lagrangefoundry/1stcontact/storage/tmp/repro-console/repro-joyfulculinarycreations-com/iteration-2/page.json'))
def walk(n,path='root'):
    yield path,n
    for i,c in enumerate(n.get('children') or []): yield from walk(c,f'{path}.{i}')
for path,n in walk(p['data']['page']['l1']['root']):
    g=n.get('geometry') or {}
    if n.get('kind')=='container' and 'viewportResponse' not in g and any('height' in k for k in g.get('keyframes',[])):
        print(path, n.get('id'), 'NO viewportResponse; children:',
              [(c.get('id') or c.get('kind'), (c.get('geometry') or {}).get('viewportResponse')) for c in (n.get('children') or [])][:4])"
```
WRONG (now): six containers print, `section-band-0/1/2` among them, each with
children carrying `{'yFactor': 0.5}` or `{'yFactor': 1}`.
RIGHT: nothing prints — a container whose content answers the viewport-height
axis answers it too (`heightFactor`, or the same `yFactor`), or the content and
the surface are bound so the question cannot be answered twice.

```bash
CHROMIUM_LAUNCH_ARGS=--single-process 1c gate repro-joyfulculinarycreations-com \
  --ref /Users/martin/lagrangefoundry/1stcontact/storage/references/joyfulculinarycreations.com/index --sandbox
```
WRONG (now): `verdict: structural-failure`, `layout.findings` 371 escapes / 27
overlaps / 5 clips, with `section-band-0` (89) and `section-band-2` (57) the two
largest offenders. RIGHT: those 163 escapes and 18 overlaps gone.
