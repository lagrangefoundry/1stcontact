---
uid: request-472ca7d6
id: REQ-308
type: request
title: 'capture/values-diff: a placeholder-only control is captured with no typography,
  so the textarea placeholder paints 3px high with zero deltas — and a reference band
  that paints nothing can never be paired'
created_by: repro-console:repro-gigabytealchemy-ai#5
created_at: '2026-09-23T02:30:12.030295+00:00'
updated_at: '2026-09-25T02:13:49.511603+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  defect_class:
  - capture-loses-it
  - instrument-no-axis
  - instrument-asymmetric
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-1c3b9d80
  commits:
  - working_sha: cbcde4aef74d2407545decdf5694b91e3552d000
    reconcile_sha: null
    main_sha: null
  - working_sha: f697f337eaf567667a90b117fca02deae4027674
    reconcile_sha: null
    main_sha: null
  - working_sha: 817277dfbb6a3b062f65051031c35ce5726d7b56
    reconcile_sha: null
    main_sha: null
  - working_sha: 1ad07cd6bf825264e4d082519782494c962a17db
    reconcile_sha: null
    main_sha: null
  version: 0.2.352
  story_points: 5
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


---

# Implementation (free-coded)

Both residuals are fixed. Issue 1 runs the length of the pipeline — every hop had
the same hole. Issue 2 is a single classification in the comparator, plus making
the two places that report the number say why it fell.

## Issue 1 — a form control carries its own type

**What a user sees.** A reproduced contact form's placeholder text now sits where
the reference's does. The textarea that painted its placeholder three pixel rows
high paints it on the reference's rows, because the document it renders from now
carries the control's leading instead of falling through to the browser's
`normal`.

**What the capture now records.** `fieldsUnder` reads the type a form control
paints with onto the control's **existing** text axes — `fontFamily`,
`fontSizePx`, `fontWeight`, `lineHeightPx` — rather than under a parallel
`placeholder*` name. That is where L1 already keeps them (`l1ControlAxesSchema`
is the text axes plus `placeholderColor`), so no new axis exists anywhere in the
pipeline.

- Read off the `::placeholder` **pseudo-element** when the control has a
  placeholder — that is the ink that actually paints, it can author type of its
  own, and the capture already queries it for its colour — falling back to the
  control's own computed style, which is also what a control with no placeholder
  (a `select`, a filled field) paints its typed text with.
- Recorded for `input` / `textarea` / `select` only. An `<img>`, an `<hr>` and a
  painted backdrop box are text-free too and have no type to describe; they keep
  the empty/zero constants they have always carried.
- `lineHeightPx` is `null` for `line-height: normal`, whose used value is a font
  metric no computed style exposes — recorded exactly as a text run records it.

**Where it travels.** `Field` / `RawField` declare the four axes; `toField`
carries them into the bundle; `FIELD_AXES` reads them instead of returning the
`''` / `0` constants and gains a `lineHeightPx` row; the fold writes them onto
`L1ControlAxes`; the renderer's existing `emitTextAxes` emits them, and its
zero-look `font: inherit` reset is already pushed ahead of the axes so an
authored value wins.

**Technical consequence, requested indirectly.** The fold also emits **per-width
type tracks** for a control (`responsiveTextTracks` over the same framed samples
the padding tracks already use). `axes` is read off the widest cell only, so
without this a control whose type shrinks at mobile would be pinned to its
desktop size at every width — BUG-18's defect, on the route BUG-18 did not cover.
A type that holds one value across the ladder stays a scalar and emits no track.

**What the instrument now compares.** The field pass of `values-diff` compares
the four axes, guarded on **both sides carrying a real size** — which is exactly
the pre-REQ-308 test, because the axes were constants before the extractor read
them, so a stored bundle and every non-control stay inert rather than firing a
delta against every placeholder on every page.

`lineHeightPx` is the one place an absent value is **not** skipped. On a text run
an absent leading means the bundle predates the axis; on a control it cannot mean
that, because the guard has already established that both sides ran a
typography-recording extractor. What it means there is `line-height: normal` — a
measurement — and `normal` against a reference's 24px is precisely the shift this
ticket came from. Skipping it would leave the instrument blind to its own defect
the moment the fold stopped emitting the axis. Reported symmetrically, and silent
when both sides are on `normal`.

REQ-51's control card gains the four type rows, so the grouped view an operator
reads stops listing everything about a control except the substance of its ink.
`fontSizePx: 0` prints `—` (it is the text-free constant, not a size) and an
absent leading on a control whose type was read prints `normal`.

**The bundle has to be re-taken.** This value is persisted in the bundle, so
landing it changes nothing on a stored reference until the operator presses
recapture — `1c refold` cannot pick it up, exactly as the ticket says.
`CAPTURE_SCHEMA` is therefore bumped **5 → 6** and the axis is registered in
`CAPTURE_SCHEMA_AXES`, so `staleCaptureAxes` names it on any older bundle instead
of leaving the next round to re-measure a residual whose fix already shipped.
Presence is probed as a **non-zero size**, not the presence of the key: every
earlier schema wrote `fontSizePx: 0` onto every text-free element, so the key has
always existed and has never been a measurement.

**Expect the delta count to rise on the stored bundle** until the re-capture
lands. That is the instrument sharpening, and it is the point.

## Issue 2 — a reference band that paints nothing is not a surface

**Which of the two candidate fixes.** The instrument side, which the ticket names
as preferred — and within it the *"classify it as not-a-band"* variant rather than
*"pair it to the geometric slice that contains its runs"*. That slice is §1, the
800px hero; comparing a 192px transparent header's band values against it would
put a second category error in place of the first.

**The rule.** An **unpaired** reference band whose fill was **measured** as absent
(`surfaceFill: null`), with no background image and no overlay, paints nothing.
The reproduction's bands are what the fold emits, and `foldSectionBackgrounds`
emits a band node only for a section carrying an image or an overlay — solid
bands arrive as run surfaces — so there is no document any fold could produce
that would have a counterpart for it. It is a content grouping, not a surface.

- It leaves `unpairedSections` and is listed in a new `nonSurfaceSections`, with
  its geometry and the reason it is not counted. **Reclassified, not dropped**:
  BUG-111's discipline (an uncompared band must be visible somewhere a reader
  actually looks) applied to BUG-111's own count.
- Derived from the same pairing pass the counts are, so the two lists cannot
  disagree with the rows they summarise.
- `surfaceFill: undefined` — a bundle older than schema 3, whose transparent
  bands were recorded as an opaque fabrication of the body's colour — stays
  unpaired: "paints nothing" is unknowable there.
- A band that paints a fill, an image **or** an overlay is a surface the fold can
  emit, so a reproduction missing it is a real gap and keeps being counted.
- Only ever reached for an unpaired band, so a paintless band the reproduction
  *does* segment is compared exactly as before.

**What it does not do.** It does not rescue the overlapped band's
`contentAnchorRatio`. REQ-270 declines that comparison because the two sides
measure it over different populations of runs, and reclassifying the band lying
over it says nothing about that. The page still has a measurement this ticket
does not deliver, and the report still says so.

**Technical consequence, requested indirectly.** Two reporting surfaces would
otherwise have gone quietly smaller:

- `gate.json` gains `values.nonSurfaceSections`, and the pass rung names the
  category — a count that merely shrank would read as a reproduction that
  improved.
- The repro console's `unmeasured N` headline (REQ-277) is the number this round
  was told to drive down. The band leaves the count, and the `bands` part now
  carries a `detail` naming the reclassification. It is **not** a fifth part of
  the unmeasured set and is not summed into `bands`: a band no fold could emit a
  counterpart for is not a measurement anybody failed to make.

## Test plan

Two new UAT files, plus one existing assertion updated.

- `tests/test_UAT_FC_REQ-308_a_control_carries_its_own_type.test.ts` — the
  capture reads a placeholder-only control's type off a real page (browser-gated,
  new fixture `tests/fixtures/capture/req308-control-type.html`); the
  `::placeholder` pseudo is what is read, not the element; `normal` is recorded
  as `normal`; a divider and an image still record none. Then, with no browser:
  the schema bump names the axis on a schema-5 bundle and the probe only ever
  removes it; L1 accepts the type on its existing axes and the bag stays closed;
  the fold authors it, keeps a pre-REQ-308 bundle folding exactly as it did, and
  earns a per-width track only for a type that varies; the renderer emits it over
  its own `font: inherit` reset and emits nothing without it; the diff reports a
  type difference, reports the `normal`-against-24px leading in both directions,
  stays inert for a pre-REQ-308 reference and for a non-control, and the control
  card shows the rows.
- `tests/test_UAT_FC_REQ-308_a_paintless_reference_band_is_not_a_surface.test.ts`
  — the reclassification and its reason; a band painting a fill, an image or an
  overlay is still counted; an unmeasured fill is not read as "paints nothing";
  the overlapped band's anchor is still declined; a paintless band that pairs is
  compared as before. Then through the real `cmdGate` on a real bundle: the gate
  reports the reclassification instead of an unpaired band, the pass rung says
  so, a painting band the reproduction lost still fails loudly, and a page whose
  bands all pair says neither thing. Finally the console's `unmeasured` headline
  names the reclassified band, and a report with nothing to reclassify (or one
  predating the field) reads as it always did.
- `tests/req51-object-grouped-report.test.ts` — the control param table gained
  the four type rows, updated exactly as it was when REQ-265 added
  `placeholderColor`.

**Not observed in this session.** The four browser-gated UATs report SKIPPED:
`chromiumAvailable()` is false under this sandbox (a denied Mach bootstrap port,
and a Playwright build-number pin), so they run the moment a capable runner does.
The extractor change was verified offline instead — the full `EXTRACT_SCRIPT`
parses, and `controlTypographyOf` was driven through all seven shapes the
browser-gated UATs assert (inherited type, a `::placeholder` authoring its own,
`normal`, a `select` with no placeholder, an `img`, an `hr`, and an engine that
refuses the pseudo) with the results those UATs expect.

Everything else is green: the two new files, and the ~90 existing node suites
that touch `diffManifests` / `cmdGate` / `foldToL1` / `flattenCapture` /
`projectField` / `renderL1Fragment` / `EXTRACT_SCRIPT`.