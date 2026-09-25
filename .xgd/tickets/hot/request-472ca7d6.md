---
uid: request-472ca7d6
id: REQ-308
type: request
title: 'capture/values-diff: a placeholder-only control is captured with no typography,
  so the textarea placeholder paints 3px high with zero deltas — and a reference band
  that paints nothing can never be paired'
created_by: repro-console:repro-gigabytealchemy-ai#5
created_at: '2026-09-23T02:30:12.030295+00:00'
updated_at: '2026-09-25T01:46:23.246398+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  defect_class:
  - capture-loses-it
  - instrument-no-axis
  - instrument-asymmetric
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-1c3b9d80
---

Loop 1, iteration **5** of `repro-gigabytealchemy-ai` against the stored bundle
`storage/references/gigabytealchemy.ai/index`.

`gate.json` this round: verdict **`structural-failure`** — `l1Pass: false`,
`layout.pass: true` (no collisions at any captured width), `perceptualBreach: false`,
`valuesBreach: false`, mean **0.23/255**, **0.01%** of pixels over threshold,
**2** ranked regions totalling **159.48** score, **4** value deltas
(`matched: 59`, `unmatched: 0`, `unpairedActual: 0`, `worstTier: LOW`),
**unmeasured 1** (0 axes, 1 band, 0 populations, 0 probes).

The bundle is stamped `capturedAt: 2026-09-23T01:58:40.658Z`, `captureSchema: 5`, and
was re-captured for this iteration (`iteration.json: "recaptured": true`), so every
residual below is measured by the instrument running now.

## What landed since iteration 4 — measured, not remembered

Four of [[REQ-302]]'s seven residuals are gone from the artifacts:

| REQ-302 issue | state this round | read from |
|---|---|---|
| 1 · run stretches to container | **gone** — `actual-manifest.json` gives `"Gigabyte Alchemy"` `box.width 685.3125`, byte-equal to the reference | `diff/actual-manifest.json` |
| 3 · `a11yRole` read on the text node | **gone** — actual now carries `a11yRole: link` + `href: "/"`, and `a11yRole: heading` + `headingLevel: 1` | `diff/actual-manifest.json` |
| 5 · three padding sides + `textAlign` dropped | **gone** — all four `padding*Px` and `textAlign` present on both sides; `values.unmeasuredAxes: []` | `diff/gate.json`, both manifests |
| 6 · geometry rounded to whole pixels | **gone** — `y: 82.5` on both sides; the served CSS carries `margin-top: 82.5px` | `diff/*-manifest.json`, `site/index.html` |
| 2 · mis-ordered flow siblings repaired with negative margins | **still present, and now the sole cause of the FAIL** | appended to REQ-302, not re-filed |
| 4 · scrim alpha / axis split | **half fixed** — both sides now land on `surfaceFill`; the alpha is still dropped on the reference side | appended to REQ-302, not re-filed |

Issues 2 and 4 are REQ-302's own residual classes, so this round **appended** its new
measurements to REQ-302 rather than opening a second ticket for them. What follows is
what REQ-302 does not cover.

## Paths used throughout

```
REPO=/Users/martin/lagrangefoundry/1stcontact
REF=$REPO/storage/references/gigabytealchemy.ai/index
ITER=$REPO/storage/tmp/repro-console/repro-gigabytealchemy-ai/iteration-5
```

All commands are run from `$REPO`. Neither issue needs a browser.

## Summary — two residuals

| # | residual class | `defect_class` | what it costs |
|---|---|---|---|
| 1 | `capture-drops-a-placeholder-only-control-s-typography` | `capture-loses-it` (+ `instrument-no-axis`) | **100% of the ranked region score** (159.48 of 159.48, both regions) — and **0 value deltas**, because no axis compares it |
| 2 | `reference-band-that-paints-nothing-can-never-be-paired` | `instrument-asymmetric` | **the whole `unmeasured 1`**, plus §1's `contentAnchorRatio` declined — 2 of the reference's 8 bands have an anchor compared nowhere |

**Order.** Issue 1 first: it is a capture change and it moves pixels. Issue 2 is
measurement only and moves none — but it is the number this round was told to drive
down, and no amount of folding will drive it down, which is the finding.

Issue 1 writes a value **persisted in the bundle** (`fieldsUnder`'s field records in
`$REF/capture.json` / `$REF/multistate.json`), so landing it changes nothing until the
operator presses **recapture**; `1c refold` cannot pick it up.

---

## Issue 1 — a control whose only ink is its placeholder is captured with no typography at all, so the one multi-line field paints its placeholder 3px high

**Residual class:** `capture-drops-a-placeholder-only-control-s-typography`

**Class: `capture-loses-it`.** The value is absent from every file in the bundle —
`fontSizePx: 0`, `fontFamily: ""`, `fontWeight: 0`, and no `lineHeightPx` key at all on
the field record, on **both** sides of the diff — so neither the fold nor the renderer
could have written it. Defended by the three questions below.

**Second class: `instrument-no-axis`.** The field pass of `values-diff`
(`tools/generate/src/cli/capture/values-diff.ts:2493-2563`) compares containment,
`placeholderColor`, `backgroundImage`, `surfaceFill`, padding and geometry — and no
typography axis; the text pass skips every `textless` element outright
(`values-diff.ts:2593: if (exp.textless) continue`). So the element that owns 100% of
this round's ranked region score produced **zero deltas**, and only the perceptual eye
saw it.

**Stored reference exhibiting it:** `storage/references/gigabytealchemy.ai/index`.

### The three questions, and what each returned

1. **Can L1 express it?** **Yes.** `l1ControlAxesSchema`
   (`packages/site-schema/src/l1/schema.ts:1531`) is `l1TextAxesSchema.extend({ placeholderColor })`,
   and `l1TextAxesSchema` carries `fontFamily` / `fontSizePx` / `lineHeightPx`
   (`schema.ts:1199-1202`). Not class 2 — the axis bag exists and is simply empty.
2. **Is the value in the capture?** **No.** → **`capture-loses-it`, stop here.**

### Evidence

**Both ranked regions are the same control, and nothing else is ranked.**
From `$ITER/diff/regions.json` (`rankedBy: "score"`, `dims {w: 1280, h: 4376}`, `blockPx: 16`):

- **#1** `bbox {x: 720, y: 3936, w: 64, h: 16}` · score **129.16** · meanDiff 32.29 —
  `nodes.ref[0]` = `{kind: element, index: 55, text: "Your message", role: "textbox", box: {664, 3916, 528, 146}}`,
  `nodes.actual[0]` = the same text, role and box at `index: 59`. `ofRegion: 1` on both sides.
- **#2** `bbox {x: 688, y: 3936, w: 16, h: 16}` · score **30.32** — same two leads.

129.16 + 30.32 = **159.48**, which is the whole ranked score. The two sides agree on the
field's box to the byte; the disagreement is inside it.

**The placeholder is painted 3px high, and only in the textarea.** Crop both screenshots
at the same rectangle and measure the ink rows (threshold: mean RGB < 190):

```
node tools/generate/bin/1c.mjs crop $REF/screenshot.full.png --box 670,3920,160,40 --out /tmp/t-ref.png
node tools/generate/bin/1c.mjs crop $ITER/diff/actual.png     --box 670,3920,160,40 --out /tmp/t-ours.png
```

| control | box | ref ink rows | ours ink rows | ink columns |
|---|---|---|---|---|
| `Your message` (**textarea**) | `{664, 3916, 528, 146}` | **15–29** | **12–26** | 11–112 on both |
| `Your name` (input) | `{664, 3784, 528, 50}` | 15–26 | 15–26 | 11–87 on both |
| `Your email` (input) | `{664, 3850, 528, 50}` | 14–26 | 14–26 | 11–84 / 11–85 |
| `Your email address` (input) | `{88, 3900, 313.25, 50}` | 14–26 | 14–26 | 11–147 on both |

The row histogram of the textarea crop is the **same shape** on both sides, translated by
exactly 3 rows — identical columns, identical glyph widths, identical darkest pixel
(`#746f69`-ish, measured `(116, 111, 105)` on both). It is not a font, a size, a colour or
a padding difference: it is where the first line box starts.

**Why only the textarea.** A single-line `<input>` centres its inner editor in the field
regardless of `line-height`, so all three inputs agree to the pixel. A `<textarea>`'s
first line sits at the content-box top and its glyphs are offset by the **half-leading**
— which is the one metric neither side records.

**The capture records no typography for a placeholder-only control.** From
`$ITER/diff/expected-manifest.json` **and** `$ITER/diff/actual-manifest.json` — the two
records are field-for-field identical:

```json
{ "text": "Your message", "role": "textbox", "color": "", "fontFamily": "",
  "fontSizePx": 0, "fontWeight": 0, "textless": true,
  "accessibleName": "Your message", "nameSource": "placeholder",
  "paddingTopPx": 12, "paddingLeftPx": 16, "controlType": "textarea",
  "placeholderColor": "#746f69", "box": {"x":664,"y":3916,"width":528,"height":146} }
```

There is no `lineHeightPx` key on either. The same is true in the bundle itself
(`$REF/multistate.json`, all 7 projections).

**The value exists on the page and the capture already takes it from the sibling
control.** From `$REF/forms.json`, every control node the bundle carries:

```
form-0-your-name    {"borderRadiusPx":8,"border":{...},"placeholderColor":"#746f69"}
form-0-your-email   {"borderRadiusPx":8,"border":{...},"placeholderColor":"#746f69"}
form-0-your-message {"borderRadiusPx":8,"border":{...},"placeholderColor":"#746f69"}
form-0-submit       {"color":"#ffffff","fontFamily":"ui-sans-serif, system-ui, …",
                     "fontSizePx":16,"fontWeight":500,"lineHeightPx":24, …}
form-1-your-email-address {"borderRadiusPx":8,"border":{...},"placeholderColor":"#746f69"}
form-1-submit       {"color":"#ffffff", …,"fontSizePx":16,"fontWeight":500,"lineHeightPx":24, …}
```

The **submit button in the same form** — a control with visible text, so it goes down the
text path — records `fontSizePx: 16, lineHeightPx: 24`. The four placeholder-only controls
record none. `24px` is also exactly the line-height the 3px gap predicts: the reproduction
emits `font: inherit` with no line-height (`$ITER/site/index.html`:
`.form-0-form-l1-3 { … font: inherit; … padding-top: 12px; … }`) over a body that sets
none (`body { margin: 0; font-family: var(--font-family-body); }`), so its line box is
`normal` (~18.4px at 16px system-ui) against the reference's 24px — a half-leading
difference of ≈2.8px, measured 3px.

**Where it is dropped.** `tools/generate/src/cli/capture/extract.ts:1963-2070`
(`fieldsUnder`) builds the field record. It reads `getComputedStyle(el)` into `s` at
line 1994 and records padding from it at 2066-2069 — whose own comment says
"read exactly as the text-run path 90 lines above reads it" — and `placeholderColorOf(el)`
at 2061, which already calls `getComputedStyle(el, '::placeholder')`. It never reads
`s.fontSize`, `s.lineHeight` or `s.fontFamily`, which `runsUnder` (line 1708) does for
every text run.

### Reproduce / wrong / right

**Reproduce (no browser):**

```
python3 -c "
import json
m=json.load(open('$ITER/diff/expected-manifest.json'))
for e in m['elements']:
    if e.get('controlType'):
        print(e['accessibleName'], e['controlType'], 'fontSizePx=',e['fontSizePx'],
              'fontFamily=',repr(e['fontFamily']), 'lineHeightPx' in e)
"
```

**Wrong (what it prints now):**

```
Your email address email    fontSizePx= 0 fontFamily= '' False
Your name text              fontSizePx= 0 fontFamily= '' False
Your email email            fontSizePx= 0 fontFamily= '' False
Your message textarea       fontSizePx= 0 fontFamily= '' False
```

**Right:** the placeholder's own computed `font-size` / `line-height` / `font-family`
(from the `::placeholder` pseudo-element the capture already queries, falling back to the
control's own computed style), written onto the control's existing text axes, so the
renderer can emit them and `1c crop … --box 670,3920,160,40` puts the ink on rows 15–29
on both sides.

**Guard against a regression of the false negative:** the field pass compares no
typography, so this fix is invisible to `values-diff` unless the axis is added there too
(`values-diff.ts:2493-2563`). Adding it will **raise** the delta count on this bundle
until the capture change lands — that is the instrument sharpening, and it is the point.

---

## Issue 2 — a reference band that paints nothing has no counterpart a reproduction could ever emit, and it is the entire `unmeasured` number

**Residual class:** `reference-band-that-paints-nothing-can-never-be-paired`

**Class: `instrument-asymmetric`.** The two section lists are built by different
procedures — the reference's bands are `document.body`'s children qualified on their
subtree's *painted extent* (`extract.ts:2184-2197`, BUG-27), the reproduction's are L1 box
nodes the fold emits — and `foldSectionBackgrounds` emits a band node **only** for a
section carrying an image or an overlay (`tools/generate/src/l1/fold.ts:1492:
if (!sv.backgroundImageUrl && !sv.overlay) continue`), with solid bands coming from run
surfaces. The reference band in question carries neither, and no fill: there is nothing
for any fold to emit, so the absence is the comparison's, not the reproduction's.

### Evidence

**The unpaired band is the header.** From `$ITER/diff/values-diff.json`:

```json
"unpairedSections": [ { "label": "§0", "box": {"x":0,"y":0,"width":1280,"height":192} } ]
```

and from `$ITER/diff/expected-manifest.json` that same §0 is:

```json
{"index":0,"overlay":null,"contentAnchorRatio":0.66,"textAlign":"left","surfaceFill":null,
 "box":{"x":0,"y":0,"width":1280,"height":192}}
```

`surfaceFill: null`, no `backgroundImageUrl`, `overlay: null` — it paints **nothing**. Its
ground truth is `$REF/raw.html`:
`<header class="absolute top-0 left-0 right-0 z-40">` — an absolutely-positioned,
transparent header lying over the hero. It is a band only because BUG-27 qualifies a
collapsed-but-painting child on its subtree's extent.

**The reproduction's 7 bands pair with the other 7, exactly.** `expected-manifest.json`
has 8 sections, `actual-manifest.json` has 7, and `sectionPairing` pairs §1…§7 to §0…§6
with `overlap` 0.9990, 0.9992, 0.9998, 0.9995, 1, 1 and 1. The list is off by one from the
top and by nothing else.

**It also silently costs a second measurement.** `sectionPairing[1]` (the hero) carries:

```json
"anchorComparable": false,
"anchorReason": "§0 sits inside this band, so the reference measured its anchor over a
 DOM-descendant population that EXCLUDES those runs while the reproduction's geometric
 band includes them — the two anchors are not the same measurement and are not compared"
```

That is REQ-270's landed refusal doing its job. The consequence is that **2 of the
reference's 8 bands have a `contentAnchorRatio` that is compared nowhere** — §0 because it
has no partner, §1 because its partner's population is not the same one — and the hero /
header anchor is precisely what an eye would check on this page.

### Reproduce / wrong / right

**Reproduce (no browser):**

```
python3 -c "
import json
d=json.load(open('$ITER/diff/values-diff.json'))
print('unpaired:', d['unpairedSections'])
for p in d['sectionPairing']:
    print(p['label'], '->', p['actualLabel'], 'anchorComparable' in p and p['anchorComparable'])
"
```

**Wrong:** `§0 -> None`, `§1 -> §0 False`, and `gate.json` reports
`unpairedSections: 1` — one number, for two declined measurements.

**Right:** two candidate fixes, and the ticket does not pick between them because the
evidence does not:

- *Instrument side (preferred).* A reference band that paints nothing — no fill, no image,
  no overlay — is a **content grouping**, not a surface, and pairing it against a
  reproduction's surface bands is a category error. Either pair it to the geometric slice
  that contains its runs (which is what §1 already is), or classify it as
  not-a-band and stop counting it as unmeasured. Note this does **not** rescue §1's
  anchor: the populations still differ, which is why REQ-270 declines it.
- *Engine side.* The fold could emit a paintless band node purely as a measurement anchor.
  It would render nothing, which is why it is the weaker of the two.

**What would separate them:** a second reference whose page has an overlapping,
transparent, absolutely-positioned band. If the same `unmeasured` band appears there, the
shape is general and belongs in the comparator; if it never appears again, it is this
page's header and the cheaper fix is on the fold. That reference does not exist in
`storage/references/` today.

---

## What this round did NOT file here

- REQ-302 issues 2 and 4 — re-measured and **appended to [[REQ-302]]**, per the class list
  the round was given. Issue 2 is now the only reason the gate says FAIL.
- The `unmeasured` headline undercounting a declined per-section measurement — that is a
  defect in the gate report's shape and in the console's tally, not in the reproduction
  engine, so it is its own bug ticket.