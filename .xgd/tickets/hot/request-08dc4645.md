---
uid: request-08dc4645
id: REQ-269
type: request
title: 'capture/fold: a form field loses its padding, line-height rounds to whole
  pixels, and three more residuals a passing gate cannot see'
created_by: repro-console:repro-gigabytealchemy-ai#1
created_at: '2026-09-17T23:28:40.678988+00:00'
updated_at: '2026-09-17T23:28:40.678988+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  auto_merge_back: true
  needs_review: false
---

Loop 1, iteration 1 of `repro-gigabytealchemy-ai` against the stored reference
bundle `storage/references/gigabytealchemy.ai/index`. This is iteration 1 of a
**new** console run: the previous run's REQ-265 residuals have both landed, and
the ranked region score has fallen from 8025.02 to 1051.13 (see "What I checked
and found clean").

`gate.json` verdict: **`pass`** — mean 0.31/255, 0.1% of pixels over threshold,
10 ranked regions, **0 value deltas**, `l1Pass: true`.

**A `pass` with 0 deltas is not "nothing to find" here, and the two numbers are
weaker than they look.** `reconcileGates` returns `pass` at rung 2
(`!perceptualBreach`, `gate-core.ts:301`) against a floor of mean 8 / pct 25 —
25x above the measured mean — so the coverage finding, the delta count and the
10 ranked regions are never consulted. And `values-diff.json` says in its own
words that a whole class of values was **not measured**: `sectionsNotComparable`
(issue 5). Every one of the five residuals below is invisible to both numbers.

## Summary — five residual classes, in the order to work them

| # | residual class | kind | what it costs |
|---|---|---|---|
| 1 | `capture-drops-form-control-padding` | **class 1** — engine shortfall | 788.33 of the 1051.13 ranked region score (75%): 7 of the 10 regions |
| 2 | `capture-rounds-line-height-to-whole-pixels` | **class 1** — engine shortfall | the other 262.80 (25%): the remaining 3 regions, incl. the highest-mean one |
| 3 | `capture-drops-link-targets` | **class 1** — engine shortfall | no reproduction of any site can carry a working link; 2 roles lost here |
| 4 | `l1-has-no-heading-role-axis` | **class 2** — L1 cannot express it | the reproduced page has no document outline: 11 headings become `generic` |
| 5 | `repro-l1-render-has-no-section-bands` | **class 1** — engine shortfall | section values (`overlay`, `contentAnchor`, `textAlign`) are UNMEASURED on every reproduction |

Issues 1 and 2 are independent of each other and account for 100% of the ranked
pixel residual between them; do them first and in that order (1 is 3x the
score). Issue 3 is independent. Issue 4 depends on nothing, but **its link half
is issue 3's**: an `<a>` emitted by the existing `link` axis gets
`a11yRole: link` back for free, so fix 3 before measuring 4. Issue 5 blocks
nothing above it, but until it lands no section-level fix can be verified at
all. Landing 1–3 is a good outcome; 4 and 5 will still be visible to a later
round.

Two instrument defects found on the way are filed separately as bugs, not folded
in here: the gate reporting a measured-nothing as `deltas: 0`, and `values-diff`
never comparing `role`/`a11yRole` (which is why issue 4 shows as zero deltas).

Everything below is quoted out of a file on disk or is the output of a command
this round ran. Nothing is read off a screenshot.

### Paths used throughout

```
REF=/Users/martin/lagrangefoundry/1stcontact/storage/references/gigabytealchemy.ai/index
ITER=/Users/martin/lagrangefoundry/1stcontact/storage/tmp/repro-console/repro-gigabytealchemy-ai/iteration-1
SLUG=repro-gigabytealchemy-ai
```

---

## Issue 1 — a captured form field's padding is never recorded, so every placeholder paints hard against the field's left edge

**Residual class:** `capture-drops-form-control-padding`

**Class: 1 — engine shortfall.** L1 carries the axis and the renderer honours it
on a control; the capture puts nothing in.

### The three questions, and what each returned

1. **Can L1 express it?** **Yes.** `padding: l1PaddingSchema.optional()` is in
   `nodeAxisGroupsShape` (`packages/site-schema/src/l1/schema.ts:1179`), which
   `l1ControlSchema` spreads (`:1367–1382`); `l1PaddingSchema` is at `:646`
   ("a node-level structured axis … so it applies to any leaf/box kind").
   The renderer demonstrably honours it **on a control in this very
   reproduction**: the two submit buttons carry
   `padding {"topPx":12,"rightPx":32,"bottomPx":12,"leftPx":32}` in
   `$REF/forms.json` and emit
   `padding-top: 12px; padding-right: 32px; padding-bottom: 12px; padding-left: 32px`
   into `$ITER/site/home.html`. → not class 2.
2. **Is the value in the L1 document, and is it right?** It is **absent**, and
   it should be 16px left/right and 12px top/bottom. → **class 1, stop here.**

### Evidence

**The reference (`$REF/raw.html`, ground truth) pads every field.** All four
controls are Tailwind `px-4 py-3` (= 16px horizontal, 12px vertical):

```html
<input type="email" placeholder="Your email address" class="flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400">
<input type="text" name="name" placeholder="Your name" required class="w-full px-4 py-3 border rounded-lg …">
<input type="email" name="email" placeholder="Your email" required class="w-full px-4 py-3 border rounded-lg …">
<textarea name="message" rows="5" placeholder="Your message" required class="w-full px-4 py-3 border rounded-lg …">
```

**The capture records no padding for a field.** `$REF/capture.json`
`/sections[6]/fields[0]` in full carries `box`, `borderRadiusPx`,
`borderWidthPx`, `borderColor`, `borderStyle`, `backdropFilter`, `blendMode`,
`opacity`, `outline`, `pseudo`, `boxShadow`, `arrangement`, `zIndex`, `filter`,
`textShadow`, `maskEdge`, `transformRotateDeg`, `transformScale`, `motion`,
`objectFit`, `objectPosition`, `intrinsicAspect`, `src`, `alt`,
`backgroundImageUrl`, `surfaceFill`, `accessibleName`, `nameSource`,
`controlType`, `formAction`, `placeholderColor` — **and no padding key at all**.

**So the fold writes none.** `$REF/forms.json`:

```
form-0-your-name      axes {borderRadiusPx 8, border{1,#000000,solid}, placeholderColor #746f69}  padding null
form-0-your-email     axes {…}                                                                    padding null
form-0-your-message   axes {…}                                                                    padding null
form-0-submit         axes {…}                                   padding {topPx 12, rightPx 32, bottomPx 12, leftPx 32}
form-1-your-email-address  axes {…}                                                               padding null
form-1-submit         axes {…}                                   padding {topPx 12, rightPx 24, bottomPx 12, leftPx 24}
```

**And the renderer's reset then governs.** `$ITER/site/home.html`:

```css
.form-0-form-l1-1 { -webkit-appearance: none; appearance: none; margin: 0; padding: 0; border: 0; background: transparent; font: inherit; color: inherit; border-radius: 8px; border: 1px solid #000000 }
```

`padding: 0` is correct as a UA reset (`render.ts:3040–3049`, "the zero-look
baseline … Pushed BEFORE the axes so any axis the instance did author still
wins") — there is simply no axis to win.

**The pixels agree, and this is 75% of them.** Seven of the ten ranked regions
in `$ITER/diff/regions.json` lie inside the four control boxes, 788.33 of the
1051.13 total ranked score:

| region | bbox | score | the control it is inside (box from the manifests) |
|---|---|---|---|
| 1 | (704, 3920) 80x32 | 246.40 | `Your message` (664, 3916) 528x146 |
| 2 | (672, 3872) 80x16 | 153.98 | `Your email` (664, 3850) 528x50 |
| 3 | (96, 3920) 64x16 | 133.45 | `Your email address` (88, 3900) 313.25x50 |
| 4 | (176, 3920) 64x16 | 121.66 | `Your email address` |
| 7 | (688, 3808) 48x16 | 80.03 | `Your name` (664, 3784) 528x50 |
| 9 | (672, 3920) 16x16 | 28.14 | `Your message` |
| 10 | (688, 3936) 16x16 | 24.67 | `Your message` |

The direction is the one a lost 16px left inset predicts: in the same 80px
window at x=704, `region-1-ref.png` shows `ur message` and `region-1-ours.png`
shows `message` — our glyphs are further along the string, i.e. further left.
(The crops are cited as a pointer only; the claim rests on the CSS above.) The
textarea additionally loses its 12px top inset, which is why region 1 is 32px
tall where the single-line fields are 16px.

**The value gate cannot see it.** `$ITER/diff/values-diff.json` has
`"deltas": []`, because a control object compares only
`['name', 'nameSource', 'placeholderColor', 'box']`
(`tools/generate/src/cli/capture/values-diff.ts:1819`) and padding is not on the
control `ValueElement` on either side — the two sides agree by construction.

### Hypothesis

- `tools/generate/src/cli/capture/extract.ts:1489` `fieldsUnder(root, excludes)`
  builds the field record at `:1526–1577` with no padding, although the same
  script computes padding for ordinary elements 90 lines earlier
  (`:1437–1439`, `paddingLeftPx: Math.round(parseFloat(s.paddingLeft)) || 0`).
- `tools/generate/src/cli/capture/sections.ts:144` `toField(f: RawField)` then
  projects only what the raw record has (`:144–186`).
- `tools/generate/src/l1/forms.ts` therefore has no padding to write onto the
  control leaf, and `packages/framework/src/l1/render.ts:3040–3049` pushes
  `padding: 0` into every control's base rule.

### Proposed change

Record the four per-side paddings on a captured field in `fieldsUnder`, carry
them through `toField`, and have the forms fold write the typed `padding` axis
onto the control leaf — exactly what AC-1626 already specifies for text, image
and box leaves ("A captured element's per-side padding folds onto the leaf it
becomes … carrying top, right, bottom and left independently"). The renderer
needs no change: the submit buttons prove it already emits `padding-*` for a
control that carries the axis.

### How to see it, and how to know it is fixed

```
REF=/Users/martin/lagrangefoundry/1stcontact/storage/references/gigabytealchemy.ai/index

# 1. the reference pads its fields
grep -o -E '<input[^>]*>|<textarea[^>]*>' $REF/raw.html

# 2. the capture records no padding for any of them
python3 -c "import json;d=json.load(open('$REF/capture.json'));
f=d['sections'][6]['fields'][0];print(sorted(f.keys()))"

# 3. the folded control leaves carry none
python3 -c "import json;d=json.load(open('$REF/forms.json'));
print([(c['id'], c.get('padding')) for fm in d for c in fm['form']['children']])"

# 4. and the render emits padding: 0
grep -o -E '\.form-0-form-l1-1 \{[^}]*\}' \
  /Users/martin/lagrangefoundry/1stcontact/storage/tmp/repro-console/repro-gigabytealchemy-ai/iteration-1/site/home.html
```

**Wrong result (now):** step 2 prints a key list with no `padding*` in it; step 3
prints `padding` `None` for all four text fields (and the two submits' padding
dicts); step 4 prints `padding: 0`.

**Right result (fixed):** step 2's key list contains `paddingTopPx`,
`paddingRightPx`, `paddingBottomPx`, `paddingLeftPx`; step 3 prints
`{'topPx': 12, 'rightPx': 16, 'bottomPx': 12, 'leftPx': 16}` for all four text
fields; step 4's rule ends with `padding-top: 12px; padding-right: 16px;
padding-bottom: 12px; padding-left: 16px`; and re-running the gate

```
CHROMIUM_LAUNCH_ARGS=--single-process ./bin/1c gate repro-gigabytealchemy-ai --ref $REF --sandbox
```

drops regions 1, 2, 3, 4, 7, 9 and 10 from `regions.json`.

---

## Issue 2 — the capture rounds `line-height` to a whole pixel, so every wrapped paragraph drifts 0.25px per line

**Residual class:** `capture-rounds-line-height-to-whole-pixels`

**Class: 1 — engine shortfall.** The axis takes any finite number; the capture
and then the fold each round it.

### The three questions, and what each returned

1. **Can L1 express it?** **Yes.** `l1TextAxesSchema.lineHeightPx` is
   `finite.optional()` (`packages/site-schema/src/l1/schema.ts:1063`) — any
   finite number, not an integer. → not class 2.
2. **Is the value in the L1 document, and is it right?** It is in the document
   and it is **wrong**: L1 says `29`, the reference paints `29.25`.
   → **class 1, stop here.**

### Evidence — the true value, derived from the reference manifest itself

Two paragraphs in `$ITER/diff/expected-manifest.json`, same 18px font, same
family, one wrapping to 3 lines and one to 2:

```
"We're a software studio building…"   fontSizePx 18  renderedTextBox height 79.5   (3 lines)
"Our name isn't accidental. Alche…"   fontSizePx 18  renderedTextBox height 50.25  (2 lines)
```

`79.5 - 50.25 = 29.25` — that is one line, measured out of the file. Both
elements report `lineHeightPx: 29`.

`$REF/raw.html` corroborates: both are
`class="text-lg leading-relaxed …"` — 18px x 1.625 = 29.25.

**What the reproduction then does.** `$ITER/page.json`: both nodes carry
`axes.lineHeightPx: 29`. `$ITER/site/home.html`:

```css
.l1-19 { color: #f5e6a3; font-family: ui-sans-serif, …; font-size: 18px; font-weight: 400; line-height: 29px; letter-spacing: 0px; text-align: left; margin: 0 }
```

`$ITER/diff/actual-manifest.json` reports those same two runs at
`renderedTextBox` heights **79** and **50** — exactly 3 x 0.25 and 2 x 0.25
short of the reference.

**The pixels: the other 25%, including the worst region by mean.** The three
ranked regions not inside a control are all on an *interior* line of a wrapped
paragraph:

| region | bbox | score | mean | the run it is inside |
|---|---|---|---|---|
| 6 | (96, 512) 48x16 | 115.72 | **38.57** (highest of the ten) | `We're a software studio building…`, `renderedTextBox` y **452 on both sides** |
| 5 | (128, 3344) 64x16 | 116.77 | 29.19 | `Our name isn't accidental…`, line 2 |
| 8 | (128, 3504) 16x16 | 30.31 | 30.31 | `That's what we're building: tech…`, line 2 |

Region 6 is the proof, because that run's box top is **identical** on both sides
(`renderedTextBox.y = 452` in both manifests): nothing but the per-line advance
can displace its third line. `452 + 2 x 29.25 = 510.5` against
`452 + 2 x 29 = 510`, and the region starts at y 512.

**Why no gate can see this.** Both manifests are produced by the same extraction
script, so both read 29 and `values-diff` reports `lineHeightPx` equal. The
script says as much about a different value at `extract.ts:532`: *"Both sides of
a diff read the same rule, so an uncorrected run is uncorrected symmetrically."*
This class of residual can only ever be found by going back to `raw.html` or by
the arithmetic above.

### Hypothesis

The value is rounded **twice**, and both must change or the fix is inert:

- `tools/generate/src/cli/capture/extract.ts:1418` —
  `lineHeightPx: isNaN(lh) ? null : Math.round(lh)`. The very next line keeps
  letter-spacing to two decimals
  (`Math.round(parseFloat(s.letterSpacing) * 100) / 100`), so the precision is a
  per-field choice, not a manifest constraint.
- `tools/generate/src/l1/fold.ts:650` —
  `axes.lineHeightPx = Math.round(el.lineHeightPx)`, and the responsive track's
  coercer at `fold.ts:683` — `lineHeightPx: (v: number) => Math.round(v)`.

### Proposed change

Capture and fold `lineHeightPx` at two decimals, exactly as `letterSpacingPx` is
already handled on the adjacent line in both files.

**Sibling residual, same family, smaller — do it after, and measure it
separately.** `fold.ts:1904` pins `x: Math.round(box.x), y: Math.round(box.y)`,
so a block whose captured top is `3307.25` is pinned at `3307`. 48 of the 59
paired elements carry a `box` delta of this kind (all <= 0.75px; e.g.
`Our name isn't accidental…` expected y `3307.25`, actual `3307`), and the
section bands inherit it (expected `§2` height `487.5` -> actual band `488`).
`l1KeyframeSchema.y` is `finite` (`schema.ts:42`), so the fraction is
expressible. It compounds with the line-height error but is **not** its cause —
region 6's run has an identical y on both sides.

### How to see it, and how to know it is fixed

```
REF=/Users/martin/lagrangefoundry/1stcontact/storage/references/gigabytealchemy.ai/index
ITER=/Users/martin/lagrangefoundry/1stcontact/storage/tmp/repro-console/repro-gigabytealchemy-ai/iteration-1

# the true line-height, out of the reference manifest: 3-line run minus 2-line run
python3 -c "import json;e=json.load(open('$ITER/diff/expected-manifest.json'))['elements'];
f=lambda t:[x for x in e if (x.get('text') or '').startswith(t)][0];
a=f(\"We're a software studio\");b=f(\"Our name isn't accidental\");
print(a['renderedTextBox']['height'], b['renderedTextBox']['height'],
      a['renderedTextBox']['height']-b['renderedTextBox']['height'], a['lineHeightPx'])"

# what the reproduction was told
./bin/1c page get repro-gigabytealchemy-ai home --sandbox --json > /tmp/l1.json   # redirect, do not pipe (BUG-101)
python3 -c "import json;d=json.load(open('/tmp/l1.json'))['data']['page']['l1'];
w=lambda n:[n]+[x for c in n.get('children',[]) for x in w(c)];
print([(x['text'][:24], x['axes'].get('lineHeightPx')) for x in w(d['root'])
       if isinstance(x.get('text'),str) and x['text'].startswith(\"We're a software\")])"
```

**Wrong result (now):** `79.5 50.25 29.25 29` — the file's own arithmetic says
29.25 and the recorded axis says 29; the L1 node says `29`.

**Right result (fixed):** the recorded axis reads `29.25` and the L1 node reads
`29.25`; `site/home.html` emits `line-height: 29.25px`; and the gate rerun drops
regions 5, 6 and 8.

---

## Issue 3 — the capture never records a link's target, so no reproduction can carry a link

**Residual class:** `capture-drops-link-targets`

**Class: 1 — engine shortfall.** L1 has carried a typed link since REQ-106; the
capture discards the href before the fold can see it.

### The three questions, and what each returned

1. **Can L1 express it?** **Yes.** `l1TextSchema.link` —
   *"REQ-106 — the navigation role; the renderer is the sole `<a>` sink"*
   (`packages/site-schema/src/l1/schema.ts:1305`; `l1ImageSchema.link` at
   `:1321`). REQ-106 is `free_and_reconciled`. → not class 2.
2. **Is the value in the L1 document?** **No**, and it cannot be: `href` occurs
   **0 times** in `$REF/capture.json` and **0 times** in `$REF/multistate.json`.
   The extractor reads the attribute and throws it away —
   `extract.ts:1127`: `if (t === 'a') return el.getAttribute('href') != null ? 'link' : 'generic'`
   — the href decides the a11y role and is then discarded. → **class 1.**

### Evidence

- `$REF/rendered.html` (the DOM the capture navigated) contains 9 anchors:
  `/`, `/blog`, `#about`, `#mission`, `#products`, `#philosophy`, `#contact`,
  and two `#`.
- `$ITER/site/home.html` contains **0** (`grep -c '<a ' -> 0`).
- The two anchors the capture did record as painted content lose their role:
  `LinkedIn` and `GitHub` are `role: link, a11yRole: link` in
  `expected-manifest.json` and `role: body, a11yRole: generic` in
  `actual-manifest.json`, at identical boxes
  (`GitHub` (1146.73, 4308) 45.27x20).

**Honest scope on this site.** The reference's two footer anchors are
`href="#"`, and its six nav anchors are not painted at any captured width —
`"About"`, `"Mission"`, `"Philosophy"` and `"Blog"` occur **0 times** in both
`capture.json` and `multistate.json`, so they are correctly absent from both
sides. On *this* page nothing navigable is therefore lost. The class is general:
because the value never survives capture, a reference with a real navigation
reproduces as dead text, and this bundle is only evidence that the value is
dropped, not that this page suffers for it.

### Hypothesis

`extract.ts` reads `href` at `:1127` for role classification only; no element
record in the raw projection carries it, so `sections.ts` cannot project it and
`fold.ts` has nothing to write onto `l1TextSchema.link`.

### Proposed change

Record the resolved `href` on a captured element next to `a11yRole` (the
resolver already exists in the same script: `new URL(raw, location.href).href`,
`:643`), project it through `sections.ts`, and have the fold write the typed
`link` on the text/image leaf. Schema, validator and renderer are already in
place.

### How to see it, and how to know it is fixed

```
REF=/Users/martin/lagrangefoundry/1stcontact/storage/references/gigabytealchemy.ai/index
ITER=/Users/martin/lagrangefoundry/1stcontact/storage/tmp/repro-console/repro-gigabytealchemy-ai/iteration-1

grep -o -E '<a [^>]*href="[^"]*"' $REF/rendered.html | wc -l   # the reference's anchors
grep -c 'href' $REF/capture.json                               # what the capture kept
grep -c '<a ' $ITER/site/home.html                             # what the reproduction emits
```

**Wrong result (now):** `9`, then `0`, then `0`.

**Right result (fixed):** `9`, a non-zero href count in `capture.json`, and the
reproduction emitting an `<a>` for each anchor the capture saw painted — after
which `LinkedIn` and `GitHub` read `a11yRole: link` in the reproduction's own
manifest.

---

## Issue 4 — L1 cannot say "this run is a heading", so the reproduced page has no document outline

**Residual class:** `l1-has-no-heading-role-axis`

**Class: 2 — L1 cannot express it.** There is no field, and the schema is
`.strict()`, so a document that invented one is rejected rather than ignored.

### The three questions, and what each returned

1. **Can L1 express it?** **No.** `l1TextSchema`
   (`packages/site-schema/src/l1/schema.ts:1287–1309`) has exactly
   `kind`, `id`, `text`, `axes`, `responsive`, the node axis groups, `link` and
   `action`, and closes with `.strict()` (`:1309`). There is no `heading`,
   `level`, `tag` or semantic-role field anywhere in the L1 schema, and the
   renderer has no `<h1>…<h6>` sink. → **class 2, stop here.**

### Evidence

The capture records the browser's own role on both sides (`a11yRole` occurs 59
times in `capture.json`, 413 times in `multistate.json`), and the two sides
disagree on 13 elements:

```
expected-manifest.json  a11yRole:  generic 40 | heading 11 | textbox 4 | button 2 | link 2
actual-manifest.json    a11yRole:  generic 60 | textbox 4  | button 2   (heading 0, link 0)
```

The 11, each `role: heading|subheading -> body` and `a11yRole: heading ->
generic`: `A Different Approach`, `Our Mission`, `Presence`, `Positivity`,
`Connection`, `What We're Building`, `Sanctum Voice`,
`XGD (Extreme Generative Development)`, `What We're Exploring`, `The Alchemy`,
`Get in touch`.

Tags, both sides: `$REF/raw.html` has 1 `<h1`, 5 `<h2`, 6 `<h3`;
`$ITER/site/home.html` has **0**.

**This moves no pixel.** All 11 reproduce with the right family, size, weight
and colour — there is no typography delta on any of them, and no ranked region
sits on one. DOC-24's test (*an axis belongs in L1 iff it moves a pixel*)
therefore does not admit it on its own, which is precisely why it needs a
decision rather than an assumption. Two things argue for it:

- DOC-23 §7's acceptance is `capture(render(L1)) ~= L1` **measured on the
  capture/values-diff spine**, and `a11yRole` is on that spine. A reproduction
  that projects `heading` to `generic` fails round-trip identity on a field the
  capture records.
- The product consequence is not cosmetic: the reproduced marketing page has no
  heading structure at all, which is what a search engine reads and what a
  screen reader navigates by.

### Proposed change

A typed semantic-role field on the text leaf, with the renderer as the sole
`<h1>…<h6>` sink — mirroring `link` (REQ-106) and `action` (REQ-212), both of
which are precedents for "a non-painted fact the reference carries that L1 had
to grow a field for". Two halves:

- **Capture must also learn the level.** `a11yRole` flattens h1…h6 to
  `"heading"` (112 occurrences in `multistate.json`); `ariaLevel` / `level`
  occur nowhere. The level has to be recorded alongside the role.
- **The fold** then writes the role+level onto the text leaf, and `validateL1`
  bounds the level to 1..6.

The **link** half of this role delta is issue 3's, not this one's: an `<a>`
emitted by the existing `link` axis gets `a11yRole: link` back for free.

### How to see it, and how to know it is fixed

```
ITER=/Users/martin/lagrangefoundry/1stcontact/storage/tmp/repro-console/repro-gigabytealchemy-ai/iteration-1
REF=/Users/martin/lagrangefoundry/1stcontact/storage/references/gigabytealchemy.ai/index

python3 -c "import json;from collections import Counter
for f in ['expected-manifest.json','actual-manifest.json']:
    d=json.load(open('$ITER/diff/'+f))['elements']
    print(f, Counter(x.get('a11yRole') for x in d))"

grep -o -E '<h1|<h2|<h3' $REF/raw.html | wc -l          # the reference's heading tags
grep -o -E '<h1|<h2|<h3' $ITER/site/home.html | wc -l   # the reproduction's
```

**Wrong result (now):** the reference counter has `heading: 11`, the
reproduction's has none; the tag counts are 12 and **0**.

**Right result (fixed):** both counters carry `heading: 11`, and the
reproduction emits one `<h1>`, five `<h2>` and six `<h3>` at the same boxes.

---

## Issue 5 — an L1 render has no section bands, so every reproduction's section values are unmeasured

**Residual class:** `repro-l1-render-has-no-section-bands`

**Class: 1 — engine shortfall**, on the reproduction side of the capture: the
bands exist in the document and in the paint, and the extraction cannot see
them.

### The evidence

`$ITER/diff/actual-manifest.json` carries **one** section:

```json
{"index": 0, "overlay": null, "contentAnchorRatio": 0.5, "paddingTopPx": 0,
 "paddingBottomPx": 0, "textAlign": "left",
 "box": {"x": 0, "y": 0, "width": 1280, "height": 4376}}
```

`$ITER/diff/expected-manifest.json` carries **eight**, including

```json
{"index": 1, "overlay": {"color": "#030717", "opacity": 0.3},
 "contentAnchorRatio": 0.53, "backgroundImageUrl": "assets/AlchemistLabWithTech.png",
 "box": {"x": 0, "y": 0, "width": 1280, "height": 800}}
```

`values-diff.json` says what that costs, in its own words:

```json
"sectionPairing": [],
"sectionsNotComparable": "the reproduction segments into ONE body-spanning band (4376px, covering its whole page), so the reference's 8 sections have no bands to compare against — section-level values (overlay, contentAnchor, textAlign) are UNMEASURED here, not clean"
```

**The bands are not missing from the reproduction — only from its manifest.**
`$ITER/page.json` root children include `section-band-0` (`surfaceFill
#030717`) and its siblings, and the actual manifest carries seven of them as
*elements* with the right fills and boxes:

```
#030717  (0,0)    1280x800     #e8dfd3 (0,800)  1280x488
#d9ccba  (0,1288) 1280x594     #e8dfd3 (0,1882) 1280x1257
#d9ccba  (0,3139) 1280x549     #0f172b (0,4260) 1280x116
null     (0,0)    1280x800   (the hero backdrop box)
```

They are elements, not bands, because `extract.ts` builds bands from the direct
children of `<body>` and `render.ts:3444` emits one root element into `<body>`.

**Why this is a gap and not a duplicate.** BUG-102 (`ready_to_reconcile`)
diagnosed exactly this and produced the `sectionsNotComparable` message above,
but scoped the structural fix out by name: *"Giving an L1 reproduction real
section bands. The structural fix is to derive the repro's bands from painted
full-bleed backdrops…"*. Nothing carries that work today. Until it lands,
`overlay`, `contentAnchorRatio` and `textAlign` are unevaluated on **every**
reproduction of **every** site — a standing blind spot of exactly the kind that
let REQ-265's half-leading residual live through two rounds.

**It is not a render defect here.** The hero's backdrop and overlay are
pixel-clean in this round: the only ranked region above y = 3344 is region 6, at
y = 512, and that one is issue 2's.

### Proposed change

Derive the reproduction's section bands from painted full-bleed backdrops rather
than from `<body>` children (BUG-102's own out-of-scope note names
`backdropBoxes()`), or emit band boxes as body-level children so the existing
segmentation finds them. Either way the acceptance is the same: the
reproduction's manifest reports 8 bands whose boxes pair with the reference's by
vertical overlap, and `sectionsNotComparable` disappears.

### How to see it, and how to know it is fixed

```
ITER=/Users/martin/lagrangefoundry/1stcontact/storage/tmp/repro-console/repro-gigabytealchemy-ai/iteration-1

python3 -c "import json
for f in ['expected-manifest.json','actual-manifest.json']:
    d=json.load(open('$ITER/diff/'+f)); print(f, len(d['sections']), d['sections'][0]['box'])"
python3 -c "import json;print(json.load(open('$ITER/diff/values-diff.json')).get('sectionsNotComparable'))"
```

**Wrong result (now):** `8` against `1`, the single band covering
`{x:0, y:0, width:1280, height:4376}`, and the not-comparable sentence printed.

**Right result (fixed):** both sides report 8 sections whose boxes pair by
vertical overlap, the not-comparable line is `None`, and `values-diff.json`
carries a populated `sectionPairing` with an `overlay` comparison for `§1`.

---

## What I checked and found clean

- **REQ-265's two residuals have landed.** The wordmark's `renderedTextBox` is
  now identical on both sides —
  `{"x": 88, "y": 79, "width": 685.3125, "height": 97}` in both manifests —
  where the previous round measured a 4px half-leading error; and
  `placeholderColor` is `#746f69` on both sides of all four controls, emitted as
  `.form-0-form-l1-1::placeholder { color: #746f69; opacity: 1 }`. The ranked
  region score fell from 8025.02 to 1051.13.
- **`formAction`** differs on all four controls (expected
  `https://api.gigabytefoundry.ai/contact`, actual
  `http://localhost:53398/api/lead`). That is the sandbox render rewiring a form
  to the platform's own lead endpoint — by design, not a residual.
- **`borderRadiusPx` on the two pill badges** (`In development`, `Coming soon`):
  expected `33554400`, actual `100000` (`fold.ts:1139` clamps to
  `L1_ENVELOPE.lengthPx.max`). Both are a full pill on a 33px-tall badge; no
  ranked region is near either. Not filed.
- **`arrangement`, `textAlign`, `paddingTop/Right/BottomPx`** differ on 22–55
  paired elements as `null` (expected) against a value (actual). That is a
  projection asymmetry between `flattenCapture` and `flattenSignals` — the
  actual side reports the defaults (`0`, `left`) where the reference side
  reports absence — not a reproduction difference. Instrument noise; not filed.
- **The unreferenced mirrored image** (`gate.json` `coverage.findings[0]`,
  `assets/AlchemistLabWithTech.png`) is the known false positive of **BUG-100**:
  this round's evidence agrees with it (the image is named in `capture.json`
  `sections[].background.image`, in `multistate.json`
  `projections[].manifest.sections[].backgroundImageUrl` x7, and in the
  reproduction's own L1 `axes.backgroundImageUrl`), and the previous round
  already appended there. Not re-filed.

## Companion bugs filed this round

- **the gate reports a measured-nothing as `deltas: 0`** — `gate.json` carries
  `values {deltas 0, matched 59, unmatched 0}` and
  `nextStep "Nothing outstanding from this gate."` while `values-diff.json`
  carries `sectionsNotComparable` and 7 `unpairedActual` objects, and
  `coverage.findings` is non-empty.
- **`values-diff` never compares `role`/`a11yRole`** — which is why issue 4
  shows as zero deltas.

Found while diagnosing loop-1 iteration 1 of `repro-gigabytealchemy-ai`.
Related: REQ-265 (the previous round's gap ticket, both residuals landed) ·
BUG-102 (the section join; this ticket's issue 5 is its out-of-scope half) ·
BUG-100 (the unreferenced-image false positive) · BUG-101 (`1c --json` truncated
when piped) · AC-1626 (padding folds onto a leaf) · REQ-106 (the L1 link axis).
