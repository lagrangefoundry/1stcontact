---
uid: comment-963bf890
id: COMMENT-3962
type: comment
title: Comment on request REQ-302
created_by: xgd
created_at: '2026-09-26T19:52:23.766659+00:00'
updated_at: '2026-09-26T19:52:23.766659+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-edbc7e5f
  kind: note
---

`repro-console:repro-joyfulculinarycreations-com#1` — iteration 1 re-measurement of this ticket's **issue 2** (the fold emits flow siblings out of order and repairs it with a negative margin) on a second bundle, joyfulculinarycreations.com, where the repair reaches **−7160.51px** and **changes sign across the width ladder**.

- reference bundle: `/Users/martin/lagrangefoundry/1stcontact/storage/references/joyfulculinarycreations.com/index`
  (`capturedAt` `2026-09-26T19:06:28.966Z`, `captureSchema` 6 — nothing has landed in the engine since,
  so this is measured by the instrument running now)
- artifacts: `/Users/martin/lagrangefoundry/1stcontact/storage/tmp/repro-console/repro-joyfulculinarycreations-com/iteration-1/`

Only issue 2 of this ticket is re-measured here. This round's other residuals are elsewhere: the
`structural-failure` verdict on this bundle is **not** issue 2 — it is a different mechanism, filed as
**REQ-332** issue 1 (a full-bleed band backdrop folds to `box-N`, so the overlap exemption written for
it never fires: 1160 of the 1172 `overlap` findings). The half-leading shift is appended to REQ-265.
The ruler defects are BUG-151.

## The measurement

This ticket reported `margin-top: -946px` on gigabytealchemy. Here the same repair is an order of
magnitude larger, and it comes as a **matched pair of opposite-signed leads on adjacent siblings**.
From `page.json`, the two nodes' `geometry.keyframes[].y` (all `place: "flow"`, so `y` is the flow
lead, emitted as `margin-top`):

| viewport | `0.0.0.4` `Meet the Chef` (first nav link) | `0.0.1.0` `box-2` (the `#ffffff` band) |
|---|---|---|
| 320 | **+7125.80** | **−7160.51** |
| 375 | +6363.56 | −6398.36 |
| 768 | +6167.95 | −6186.00 |
| 1024 | +3420.41 | −3446.14 |
| 1280 | −730.00 | +684.00 |
| 1440 | −830.00 | +784.00 |

Served verbatim — `iteration-1/site/index.html`:

```css
.l1-20 { position: relative; margin-left: 0px; margin-top: -7160.51px; width: 320px; height: 847.06px }
…
.l1-20 { margin-left: calc(0px + (0 * (100vw - 1280px) / 160));
         margin-top: calc(684px + (100 * (100vw - 1280px) / 160));
         width: calc(1280px + (160 * (100vw - 1280px) / 160));
         height: calc(535.97px + (0 * (100vw - 1280px) / 160)) }
```

`box-2`'s lead swings **7844.51px** across the six-width ladder and reverses sign between 1024 and
1280. Every other band backdrop in the document has a sane lead — `box-3` 16, `box-5` 10/11,
`box-6` 69.39–448.32, `box-7` 83.31, `box-8` 15–159.2, `box-10` 73–81 — so this is not the fold's
normal magnitude; it is one node's repair.

## Why it is this ticket's issue 2 and not a new class

The cause is the emission order. The served body, in document order inside the header/hero container:

```html
<div class="l1-3" id="box-0"></div>          <!-- hero opaque base            -->
<div class="l1-4" id="box-1"></div>          <!-- hero scrim + photograph      -->
<a href="./"><img class="l1-5" id="image-0" …></a>   <!-- the logo, y = 70     -->
<div class="l1-6" id="section-band-0">…</div> <!-- the hero COPY: two h1s, the
                                                   paragraph, the CTA card    -->
<a class="l1-14" …>Meet the Chef</a>          <!-- the nav, which paints at y = 70 -->
<a class="l1-15" …>Our Services</a>
…
```

The nav is emitted **after** the entire hero copy block, so at narrow widths the flow cursor has
already advanced past a container that is ~7100px tall (everything wraps at 320px), and the fold hauls
the nav back into place… by pushing it *further* down (+7125.80) and then pulling the next band up
(−7160.51). The four remaining nav links follow the first with sane sibling leads (−17.55 at 320,
−46 at 1280), which confirms the whole correction lives in the first one — the seam between the two
mis-ordered groups.

The reference has no such thing: `expected-manifest.json` puts the five nav links at `y: 70`
(`elements[0..4]`) and the white band at `y: 800`
(`elements[73]`, `box {"x":0,"y":800,"width":1280,"height":535.96875}`), at every width.

## What it costs on this bundle — honestly, nothing yet

I could not attribute a single `gate.json` finding to it here, and I want that on the record rather
than inferred. Of the 121 distinct `overlap` leaf pairs, 120 involve a band backdrop (REQ-332 issue 1)
and the 1 remaining is the hero's two heading lines (REQ-265); none is the nav or `box-2`. The 56
`escape` findings are all on the two carousel slides. The `segments` array is
`["snap","snap","snap","snap","interpolate"]`, so the ladder holds the lower keyframe below 1280 rather
than interpolating through it, which is what keeps the ±7000px pair from producing garbage at
intermediate widths.

So on this bundle the defect is **latent**: exact at the six widths it was measured at and correct by
cancellation, with the cancellation resting entirely on the preceding sibling's rendered height being
exactly the oracle's. That is the same standing hazard this ticket already describes, and it is worth
recording because it says something the gigabytealchemy measurement could not: the repair's magnitude
is **not bounded** by anything. −946px was not the size of the problem; it was the size of that page's
hero. Here it is 7.5× larger, and a page whose narrow-width flow is taller still will be larger again.

## Re-running it

```
1c page get repro-joyfulculinarycreations-com home --sandbox --json > /tmp/p.json
python3 -c "import json;d=json.load(open('/tmp/p.json'));r=d['data']['page']['l1']['root'];rows=[];
walk=lambda n,p:[rows.append((kf['y'],kf['at'],p,n.get('id'))) for kf in ((n.get('geometry') or {}).get('keyframes') or []) if (n.get('geometry') or {}).get('place')=='flow'] and None;
[None]
"
```

or, more simply, read the served CSS:

```
grep -o 'margin-top: -[0-9]\{4,\}[0-9.]*px' \
  /Users/martin/lagrangefoundry/1stcontact/storage/tmp/repro-console/repro-joyfulculinarycreations-com/iteration-1/site/index.html
```

**Wrong now** — `margin-top: -7160.51px` (three times, once per snap breakpoint below 768).
**Right when fixed** — no four-digit negative `margin-top` anywhere in the document, because the flow
siblings are emitted in the order they paint and no repair is needed.
