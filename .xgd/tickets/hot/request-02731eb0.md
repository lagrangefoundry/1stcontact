---
uid: request-02731eb0
id: REQ-377
type: request
title: 'capture: a sticky header is measured mid smooth-scroll, so every read of the
  oracle puts it somewhere different (and three further residuals)'
created_by: repro-console:repro-www-hearingzone510-com#2
created_at: '2026-10-03T23:09:19.474500+00:00'
updated_at: '2026-10-04T00:18:48.891428+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  defect_class:
  - capture-loses-it
  - cannot-tell
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-faaa37b1
---

# capture: a sticky header is measured mid-way through a smooth scroll back to the top, so every read of the oracle puts it somewhere different

Round: `repro-console:repro-www-hearingzone510-com#2` · bundle
`storage/references/www.hearingzone510.com/index` (capturedAt 2026-10-03T22:32:47.616Z, captureSchema 15,
the re-capture made after REQ-370). Sandbox site `repro-www-hearingzone510-com`, page `home`.
**All evidence comes from this one bundle.** I compare it with the same site's schema-14 capture as
iteration 1 saw it (`storage/tmp/repro-console/repro-www-hearingzone510-com/iteration-1/`).

Gate: `structural-failure`, mean 15.72/255, 16.99% over threshold, 12 regions, ranked score
**401359.11**, 48 deltas, unmeasured 9. **Region 1 alone is 393162.57 = 97.96% of the score**, and
it is this ticket's issue 1. So are 434 of the 690 `layout.findings`. The three engine commits since the
capture (8b82c24a1b, 208a2af8bc, f3a5eb11da) touch l1-gate grading and the fold's padded-run chip.
None of them touches the capture's scroll settle, so nothing here has already landed.

| # | residual class | defect_class | weight |
|---|---|---|---|
| 1 | `capture-measures-sticky-elements-mid-smooth-scroll` | `capture-loses-it` | region 1 (97.96%), 9 CRITICAL position deltas, 434/690 layout findings |
| 2 | `capture-drops-position-sticky-so-l1-sticky-is-never-authored` | `capture-loses-it` | the header scrolls away in every reproduction, even once 1 is fixed |
| 3 | `fold-stitches-section-band-across-widths-to-different-bands` | `cannot-tell` | the 733px #224e7a plate; 431 escape findings on section-band-0 |
| 4 | `capture-run-surface-walk-skips-svg-panel-fills` | `capture-loses-it` | 6 LOW surfaceFill deltas where the reference side is wrong |

**Order.** Do 1 first. It is a capture fix, so **this bundle needs a re-capture after it lands**. Until
then every number below 1 is measured against an oracle that disagrees with itself. 2 depends on
1, because a sticky element has no single "at rest" box to pin until 1 makes the reads agree. 3 must be
re-measured after 1 + re-capture before anyone works on it. 4 does not depend on the others.

---

## Issue 1: `html{scroll-behavior:smooth}` turns SETTLE_SCROLL's return to the top into an animation, and nothing waits for it to finish

**Class 1, engine shortfall → `capture-loses-it`.**
*Test run:* does the capture record the page at rest? No. The same sticky element is recorded at 15
different y values across 15 independent page loads of one bundle (table below). The capture's own
input to the fold is wrong before the fold runs, so the fold and the renderer are innocent.

### What the reference is
`raw.html` offset 152005: `<div class="top-blocks--sticky top-blocks">` holds the sticky bar
(`<section class="block-sticky-bar">`, 40px, gradient `linear-gradient(0deg, rgb(242,179,116),
rgb(240,218,196))`, "Learn to train your brain to hear better.") and `<header class="block-header">`
(`--background-color:rgb(34, 78, 122)`, logo 350×100, the nav).
The mirrored stylesheet `assets/_..Bf-H_B6P.css` has:
```
.top-blocks{z-index:18}
.top-blocks--sticky{position:sticky;top:0}
...html{scroll-behavior:smooth
```
At rest, the iteration-1 capture of the same page (schema 14) put the bar's text at y **7.60**, the
logo at **40** and "Home" at **76.5**. That is the page at scroll 0.

### What this capture recorded: one element, fifteen places
"Learn to train your brain to hear better." `box.y`, by source. At scroll 0 the value is 7.6 at
every width:

| source | y |
|---|---|
| `capture.json` `sections[2].content[0]` | **1336.60** |
| `multistate.json` 320×800 / 320×1000 | 209.1 / 141.1 |
| 375×800 / 375×1000 | 401.7 / 155.7 |
| 768×1024 / 768×1224 | 226.7 / 113.7 |
| 1024×768 / 1024×968 | 245.6 / 54.6 |
| 1280×800 / 1280×1000 | **118.6** / 12.6 |
| 1440×900 / 1440×1100 | 206.6 / 49.6 |
| `hints.json`, the `position:"sticky"` div (id 4), box | y **1289**, h 140 |

The screenshots show the same thing in pixels, read as RGB values. `screenshot.full.png`: rows 0–40
are (255,255,255) at x=10/200/1270. The bar gradient is at y 290 (241,213,185) → y 320 (242,183,125),
and the `#224e7a` header fills rows **325–425**, over the hero. `screenshot-1280.png`: the header
fills rows **1325–1425**, and (241,213,185) is at y 1290.

Every value is consistent with "stuck at viewport top, recorded as `r.top + window.scrollY`
while `scrollY` ≠ 0". `capture.json` gives bar top 1336.60 − 7.6 = 1329 = header top 1369 − 40.
`extract.ts:752/1088/1107` all measure `r.top + window.scrollY`. That is correct for an in-flow box
at any scroll, and wrong for a stuck one at any scroll except 0.

### Why the scroll is not 0
`page-scripts.ts:91` `SETTLE_SCROLL` steps the page down and ends with `window.scrollTo(0, 0)`.
Under `html{scroll-behavior:smooth}` that call **starts an animation and returns**. After it,
`settlePage` (`playwright-driver.ts:195`, `cf-driver.ts:226`) runs `IMAGES_DECODED`,
`REVEAL_MEDIA` and `networkidle`, and `navigate` runs `FONT_BARRIER`. None of these waits for
`scrollY === 0`. Then `captureOnce` (`pipeline.ts:270`), each `runMultiStateCapture` projection
(`pipeline.ts:500`) and each `captureLadderScreenshots` shot (`pipeline.ts:556`) read the page at
whatever point the animation has reached. Each one is a fresh navigation, which is why every read
lands somewhere different. `coverage.ts:441` lists `scroll-behavior` as declined, so nothing records
it either. *What I could not show:* why the schema-14 capture landed at 0. Its waits were timed
differently (REQ-370 added `REVEAL_MEDIA` to the settle). The race was always there.

### What it costs downstream (all of it follows from the table)
- The fold took the 1280 header from the 1280×800 projection. The base `l1.json` and this
  iteration's `page.json` both have `card-0` (the bar) at 1280 `y 118.6`, `viewportResponse.yFactor
  −0.53`. That is exactly (12.6 − 118.6)/(1000 − 800): **the scroll drift between two page loads
  was fitted as a viewport-height response**. `backdrop-0` (#224e7a) is at 1280 `y 151`.
- `values-diff.json`: 9 CRITICAL `position` deltas, each with expected − actual = **1218**:
  "510-865-8113" ×2 (1391→173, 1391→179), "Learn to train your brain to hear better." (1337→119),
  "Hearing Zone logo" (1369→151), Home / How We Can Help / Locations / About / FAQ (1406→188).
  Both sides are wrong. The reference is at scroll 1329 and ours at the 1280×800 projection's ~111.
  The LOW `surfaceFill` on "Learn to train…" (expected `#d6d6d6`, actual `#1d1e20`) is the same
  thing: the reference read the band the bar had drifted over.
- `regions.json` region 1, `bbox {x:0,y:112,w:1280,h:1088}`, score 393162.57, meanDiff 83.21,
  area 1392640. `nodes.ref` holds only the hero section (0,40 1280×1157) and the photo. `nodes.actual`
  leads with a `generic` "510-865-8113HomeHow We Can HelpLocationsAboutFAQ" at **(0,151) 1280×733**,
  ofRegion 0.67. This is the asymmetry: ours paints a 733px `#224e7a` plate the reference does not
  have (`actual.png` rows 151–884 are ≥50% (34,78,122)). That plate is issue 3, built on this issue's
  input.
- `gate.json` `layout.findings`: **434 of 690** have a path in `backdrop-0` (0.0), `card-0` (0.8)
  or `section-band-0` (0.51). The gate's quoted 320px overlaps ("Learn to train … overlaps Our brains
  thrive …", "… overlaps Hear what matters.") come from the bar at its 320×800 drift y of 209.1.
- `values.unpairedActual`: the (0,151) 1280×100, (0,151) 1280×733 and (0,884) 1280×313 boxes. That is
  3 of the 8 unmeasured populations.

### Proposed change
1. In `SETTLE_CSS` add `html,body{scroll-behavior:auto!important}`. It is injected before
   `SETTLE_SCROLL`, so every `scrollTo` becomes instant.
2. Make the end of `SETTLE_SCROLL`
   `window.scrollTo({top:0,left:0,behavior:'instant'})` and then poll until `window.scrollY === 0`
   (bounded). Do the same again at the end of `settlePage`, after `REVEAL_MEDIA`/`networkidle`, because
   a page script can scroll after the settle.
3. Have `EXTRACT_SCRIPT` record `window.scrollY` in its signals, and have `pipeline.ts` refuse (or
   note) a read taken at a non-zero scroll. Then a future race is visible in the bundle instead of in
   the pixels. (The gate half is filed separately as a bug.)
4. Bump the capture schema so this bundle is reported as stale, then **re-capture**
   `www.hearingzone510.com/index`.

### How to see it / how to know it is fixed
No browser needed to see it:
```
python3 - <<'P'
import json
b='storage/references/www.hearingzone510.com/index/'
c=json.load(open(b+'capture.json')); m=json.load(open(b+'multistate.json'))
t=lambda e:(e.get('text') or '').startswith('Learn to train')
print('capture', [e['box']['y'] for s in c['sections'] for e in s.get('content',[]) if t(e)])
for p in m['projections']: print(p['viewport'], [round(e['box']['y'],1) for e in p['manifest']['elements'] if t(e)])
P
```
- **wrong now:** capture `[1336.596875]`, and 12 projection values from 12.6 to 401.7.
- **right:** about 7.6 everywhere (the same at both heights of each width). After the re-capture,
  `bin/1c refold repro-www-hearingzone510-com` then
  `CHROMIUM_LAUNCH_ARGS=--single-process bin/1c gate repro-www-hearingzone510-com --ref storage/references/www.hearingzone510.com/index --sandbox`
  should show no region over (0,112)-(1280,1200) with a 733px `generic` on the actual side, and no
  `position` delta of 1218 on the nav.

Unit test without the network: a jsdom/Playwright page with `html{scroll-behavior:smooth}`, a 4000px
body and a `position:sticky;top:0` header. Run `SETTLE_SCROLL`, then `EXTRACT_SCRIPT` straight away,
and assert the header's `box.y` is 0 and the recorded `scrollY` is 0.

---

## Issue 2: `position: sticky` never reaches `capture.json`, so the fold cannot author L1 `sticky`

**Class 1 → `capture-loses-it`.**
*Tests run:* (a) Can L1 express it? Yes. `packages/site-schema/src/l1/schema.ts:2152`
`sticky: l1StickySchema.optional()` (REQ-325, `topPx`, `fromPx`). (b) Is it in the capture the fold
reads? No. `grep -c '"sticky"' capture.json` → **0**. `hints.json` does record it (`"position":
"sticky"` on the `top-blocks` div id 4 and its `section` id 5), but `coverage.ts:326` declines
`position` as MECHANISM, and `tools/generate/src/l1/fold.ts` contains no `sticky`. *Defended:* the
page has it and L1 can carry it, but the capture's fold input does not, so nothing downstream can
author it.

**Effect.** Even with issue 1 fixed, the reproduction's header is a pinned absolute box at y 40 that
scrolls away. The reference's header follows the reader down a 5650px page. No current axis compares
this, so it costs 0 deltas and 0 pixels in a full-page screenshot: a still image cannot see "sticky".

**Proposed change.** In the extractor, record `sticky: {topPx}` on a field or section whose box or
ancestor has computed `position: sticky|fixed` (take `topPx` from the computed `top`). Only do this
once issue 1 guarantees the box was read at scroll 0. Then have the fold emit L1 `sticky` on the
node that owns the header group. Add `position: sticky` as a `recorded` row in `coverage.ts`.

**See / fixed:** `grep -c '"sticky"' storage/references/www.hearingzone510.com/index/capture.json`
→ now 0. After the change and a re-capture it is ≥1, and `bin/1c page get repro-www-hearingzone510-com home --sandbox --json | grep -c '"sticky"'` → ≥1 (now 0).

---

## Issue 3: `section-band-0` is one band at 320–768 and a different rectangle at 1024–1440

**`cannot-tell`.** The fold's output is plainly wrong, but its input at 1024–1440 is issue 1's drifted
header, so I cannot separate "the fold stitches bands wrongly" from "the fold faithfully followed a
corrupt header".

`page.json` (and the bundle's base `l1.json`, identical here) `section-band-0` (`surfaceFill
#224e7a`) keyframes:
`320 y6128 h1538 · 375 y6130 h1673 · 768 y6130 h1673 · 1024 y278 h484.38 · 1280 y151 h733 · 1440 y239 h645`.
At 320–768 it is the lower blue band (multistate 320 `sections[6]` y 6127.73 h 1538.52). At 1024–1440
it runs from the drifted header's top to the next band (1024: 278 + 484.38 = 762.38 = `section-band-1`'s
1024 y). No projection has a band there: the 1280×800 `sections` are 0/40/1197/2087/2960/3708/4279/5036.
Served `.l1-103` at ≥1280 is `top: 151px; height: 733px; background-color: #224e7a`. Its children are the
footer's location and hours runs, so they "escape" it at every wide width: **431** of the 565 escape
findings (`Hours` ×66, `9 am - 5 pm` ×44, 22 each for the addresses, days, `Where To Find Us`, and so on).
For comparison, iteration 1 (sane header) had `section-band-4` #224e7a consistent at every width
(`320 y6128 … 1280 y4279 h757`).

**What I would need to tell:** re-run after issue 1 + re-capture. If `section-band-0`'s wide keyframes
are then the 4279/757 band, this was issue 1. If a full-width box that does not match any projection
band can still start a band, it is `fold-wrong` in the band-correspondence step. That step would also
need a guard: a band whose keyframes match no projection band at a width should be refused, not
emitted.

**See:** `python3 -c "import json;d=json.load(open('storage/references/www.hearingzone510.com/index/l1.json'));d=d.get('l1',d);[print(n['id'],[(k['at'],k['y'],k['height']) for k in n['geometry']['keyframes']]) for n in d['root']['children'] if n.get('id')=='section-band-0']"`.
**Wrong now:** the line above. **Right:** one band at every width.

---

## Issue 4: a run over an inline-SVG panel reads the band behind the panel as its surface

**Class 1 → `capture-loses-it`** (reference side).
*Test:* is the value in the capture correct? No. `values-diff.json` has 6 LOW `surfaceFill` deltas
(severity 1060.32): "So glad I chose the Hearing Zone…", "Dr. A Harleman ", "Dr. Ray is a terrific
audiologist!…", "★★★★★" ×2, "-B. Kenney". All are expected `#d6d6d6`, actual `#224e7a`. The page
paints `#224e7a` behind them: `raw.html` `GridShape` `--shape-color:rgb(34, 78, 122)` (ids `zp5fL9`,
`zBvYR8`, quoted in REQ-370 issue 2). REQ-370's landed `svgPanelFillOf` records the panel as a field,
and states it was "Not added to the run surface walk". So the reference run's `surfaceFill` still walks
past the panel to the band. *Defended:* ours is right and the capture's value is wrong, so these 6
deltas measure the reference.

(REQ-370 issue 2's pixel half is confirmed landed: none of the 12 ranked regions has a testimonial node
under it, where at iteration 1 it was 44.90% of the score.)

**Proposed change.** Have the run surface walk in `extract.ts` consider an `svgPanelFillOf` panel
that covers the run's box as a surface. To avoid REQ-370's double-paint concern, record it as the run's
`surfaceFill` with `surface.self: false`, without adding the panel to the card reconstruction. Needs a
re-capture.

**See / fixed:** `python3 -c "import json;[print((d['text'] or '')[:30],d['expected'],d['actual']) for d in json.load(open('storage/tmp/repro-console/repro-www-hearingzone510-com/iteration-2/diff/values-diff.json'))['deltas'] if d.get('property')=='surfaceFill']"`
→ now 6 testimonial rows `#d6d6d6 #224e7a`, plus the "Learn to train" row (issue 1) and one `systemic color drift ×7` aggregate. **Right:** none of
the testimonial rows.

---

## Not in this ticket
- The gate called this oracle `structural-failure` although it disagrees with itself in 15 places. That
  is an instrument defect, filed as a bug (`instrument-blind`).
- 114 escape findings on the three self-surface buttons (`SCHEDULE AN APPOINTMENT`/card-1 ×46,
  `EXPLORE MORE SERVICES`/card-2 ×46, `510-865-8113`/card-6 ×22) come from the probe pairing REQ-370
  issue 4's line-box top with the captured border-box height. Filed as a bug
  (`instrument-asymmetric`).