---
uid: request-cb651734
id: REQ-384
type: request
title: 'capture: an underline propagated from a <u> ancestor is dropped; the reference
  paints a fractional half-leading the reproduction floors'
created_by: repro-console:repro-www-hearingzone510-com#4
created_at: '2026-10-04T16:21:19.317130+00:00'
updated_at: '2026-10-04T16:22:29.944584+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  defect_class:
  - capture-loses-it
  - cannot-tell
  auto_merge_back: true
  needs_review: false
  priority: medium
---

# capture: an underline propagated from a `<u>` ancestor is dropped; and the reference paints a fractional half-leading that the renderer floors

Round: `repro-console:repro-www-hearingzone510-com#4`. Reference bundle
`storage/references/www.hearingzone510.com/index`, captured 2026-10-04T15:41:21.943Z at
extractor schema 19 (re-captured for this iteration; no engine commit landed after it).
Evidence: `storage/tmp/repro-console/repro-www-hearingzone510-com/iteration-4/diff/`.
This is the **only** bundle I have evidence from for either issue.

## The verdict, and what it is made of

`gate.json`: verdict **structural-failure**, `l1Pass: false`; perceptual mean 1.64/255,
1.65% over threshold, 12 ranked regions (total score 6539.81); 24 value deltas; unmeasured 4
(0 axes, 0 bands, 4 populations, 0 probes).

None of the headline numbers is new, so they are not in this ticket:

- **All 52 `layout.findings`** are `contentRobustness` escapes ("copy grown 2.5×"), 0 at rest.
  `bin/1c l1-gate --ref storage/references/www.hearingzone510.com/index --json` on HEAD
  (4e47f2ebbe) reproduces the same 52 on the same 8 surfaces, and its
  `.recovery` is `served:false, fidelityMaxDeltaPx 1977.67, fidelityResiduals 519`. Running
  `promoteToFlow` on this bundle's `l1.json` drops `pin-0-rail`, `pin-0`, `card-0`. That is
  REQ-383 issues 1 and 2 on a second bundle. I appended it there.
- **Unmeasured 4** = `unmatched 2` + `unpairedActual 2`. These are the Facebook/LinkedIn icons, read
  as `link` "(link)" on the reference and `img` "Go to Facebook page" on ours (ours emits
  `<a href style="display:contents"><img alt=…>`). That is BUG-199. I commented there.
- The 3 CRITICAL `position` deltas on SCHEDULE AN APPOINTMENT / EXPLORE MORE SERVICES /
  510-865-8113 compare the reference's anchor (button) box with our text box. The glyphs agree
  to 0.15–0.31px. The "F" / "or over 20 years" swap is the same thing. Both are BUG-187 item 3,
  and I commented there.
- The 9 footer `position` deltas (+2px on Monday & Wednesday, Hours, 9 am – 5 pm, …): the
  reference box is the `<a>`'s 19px content area under line-height 24, and the fold wrote it as
  the line-box top. That is REQ-265's class, and I commented there.

What is left is **the whole of the ranked pixel score**, at 0 value deltas. It has two
independent causes, listed below by certainty.

---

## Issue 1: the capture drops an underline a `<u>` ancestor paints, because it reads only the element's own computed `text-decoration-line`

**Kind:** class 1, engine shortfall. **Residual class:**
`capture-reads-only-an-element-s-own-text-decoration-and-drops-a-propagated-underline`.
**defect_class: `capture-loses-it`.** The reference paints the line and `capture.json` /
`multistate.json` record `textDecoration: null`. Nothing downstream can recover it. L1 can
express it (`fold.ts:884` folds `textDecoration: 'underline'` onto a run), and the fold and
renderer are innocent.

**Test I ran (the three questions):**
1. Can L1 express it? Yes. `foldTextDecoration` (fold.ts:1975) maps `underline` to the run's
   `textDecoration` axis.
2. Is the value in L1, and is it right? It isn't there.
   `page.json` `root.children[45]` ("Discover what our clients think about our service.") has
   no `textDecoration`. It isn't in the capture either: `expected-manifest.json` has
   `textDecoration: None` for that run, so the value is lost before the fold.

**Evidence:**
- `raw.html` / `rendered.html`: `<p class="body" …><span style="font-family: Montserrat; font-weight: 400;"><u><a … href="/about-patient-centered-service-provider#reviews" style="text-decoration: none;">Discover what our clients think about our service.</a></u></span></p>`.
  The `<a>`'s own `text-decoration: none` does **not** cancel a decoration its `<u>` ancestor
  propagates (CSS Text Decoration §2.1), so the line paints.
- `regions.json` **#1**: bbox `{x:400,y:3808,w:480,h:16}`, score **1014.49** (15.5% of 6539.81),
  meanDiff 33.82. `nodes.ref[0]` and `nodes.actual[0]` are the same run with the same box
  `(393.72, 3800.41) 492.41×26`, so the text is unmoved and the difference is something drawn.
- Pixels, measured row by row (sum of |RGB − (214,214,214)| > 30 across x 390–890 of
  `screenshot.full.png` vs `diff/actual.png`): **ref rows 3821 and 3822 each have 494 ink pixels of
  exactly (0,30,66) = #001e42; ours has 0 on both rows.** Every other row in the run agrees within
  a few pixels.
- It is not the only one. `rendered.html` has 6 `<u>` elements. For each, I took the widest ink
  row just under the glyph box, as a fraction of the run width:
  Discover 1.00 vs ours 0.47, `info@hearingzone510.com` 0.94 vs 0.54, `PHONE (510) 865-8113`
  0.97 vs 0.48, `FAX (510) 865-8115` 0.96 vs 0.55. Ours is only glyph ink. So **4 underlines are
  lost**, and 1 of them is in the ranked regions.

**Mechanism:** `tools/generate/src/cli/capture/extract.ts:1827` `textDecorationOf(s)` returns
`s.textDecorationLine` of the run's own element. `text-decoration-line` is not inherited. A
decoration propagated from an ancestor never shows up in a descendant's computed style.
`underlineOffsetOf` (l.1835) is gated on the same read, so REQ-365's offset is lost for these
runs too.

**Proposed change:** in the capture, walk from the run's element up to its block container. If
any ancestor's computed `text-decoration-line` includes `underline`, `line-through` or
`overline`, record that line. Decorations propagate through inline ancestors, not through
atomic inlines or out-of-flow boxes, so stop at an `inline-block`, a float or a positioned
ancestor. Take `underlineOffsetOf` from the element that declares the decoration. The colour
the line paints is that ancestor's `text-decoration-color` (here `currentColor` of the `<u>` =
#001e42). Thickness and colour are already in `unmeasuredProperties` as not-expressible
(19 uses), so this issue only restores the line.
**Needs a re-capture** after it lands.

**This will add deltas, and that is intended.** Both manifests read the same per-element
property, so the comparator sees `null == null` today. Once the capture reads the propagated
line, the reference side says `underline` and the 4 runs should produce 4 `textDecoration`
deltas until the fold carries them through.

**How to see it:**
```
cd /Users/martin/lagrangefoundry/1stcontact
python3 -c "import json;E=json.load(open('storage/tmp/repro-console/repro-www-hearingzone510-com/iteration-4/diff/expected-manifest.json'));print([(e['text'][:24],e.get('textDecoration')) for e in E['elements'] if (e.get('text') or '').startswith(('Discover what','info@','PHONE (510)','FAX (510)'))])"
```
- **Wrong (now):** every entry is `None`.
- **Right (after a re-capture):** every entry is `'underline'`. After a fold and gate,
  `CHROMIUM_LAUNCH_ARGS=--single-process bin/1c gate repro-www-hearingzone510-com --ref storage/references/www.hearingzone510.com/index --sandbox`
  ranks no region at `(400,3808)`, and the reproduction's row 3821 at x 390–890 has ~494 pixels
  of #001e42.

---

## Issue 2: the reference's glyphs sit a fractional half-leading below the line top, and the renderer's sit at the floored value

**Kind:** by the three-question test this is class 3, renderer bug. L1 carries the reference's
box top, font, size and line-height exactly, and the render disagrees. **But I could not find
out why the reference is fractional.** So the defect class I can defend is
**`cannot-tell`**. **Residual class:**
`reproduction-floors-a-half-leading-the-reference-paints-fractional`.

**Evidence (9 of 12 ranked regions, 4104.61 of 6539.81 = 62.8% of the ranked score, 0 value deltas):**
regions #3 (716.47), #4 (704.06), #5 (585.18), #7 (503.50), #8 (392.16), #9 (366.79),
#10 (311.64), #11 (279.43), #12 (245.38). In every one, `nodes.ref[0]` and `nodes.actual[0]`
are the same run with a box equal to within 0.01px (e.g. #7 "We match advanced hearing…"
ref `(439.11, 2766.57) 459.7×93.56`, ours `(439.11, 2766.56) 459.7×93.56`).

The two manifests carry identical `fontFamily`, `fontWeight`, `fontSizePx`, `lineHeightPx`,
`letterSpacingPx` and `color` for every one of these runs. The colours in the region crops match
to the RGB value: #001e42 ink on (214,214,214), white on (34,78,122). What differs is
`renderedTextBox.y − box.y`, i.e. where the glyph content area starts inside the line:

| run (manifest text) | font / line-height | ref offset | ours offset |
|---|---|---|---|
| We match advanced hearing… | Montserrat 18 / 23.39 | **0.70** | **0.00** |
| Hearing stimulates… / Reconnect… / Feel confident… | Montserrat 18 / 23.39 | 0.70 | 0.00 |
| Adjustments, repairs… / Modern solutions… / As an independent… | Montserrat 18 / 27 | **2.5** | **2.0** |
| So glad I chose… / Dr. Ray is… | Montserrat 16 / 24 | 2.5 | 2.0 |
| 3346 Lakeshore Ave / 1660 Solano Ave | Montserrat 16 / 24 | 2.5 | 2.0 |
| Ongoing Care for Long-Term… | Prata 24 / 31.21 | −0.89 | −1.0 |
| headings at line-height = integer leading (Home, Better Communication, …) | — | equal | equal |

The reference values are exact half-leading for the mirrored font's metrics. I decoded
`assets/font-file-1-1-1` (WOFF2, Google's latin subset of Montserrat 400): hhea ascender 968,
descender −251, upm 1000. At 18px that rounds to 17+5 = 22, so (27−22)/2 = **2.5** and
(23.39−22)/2 = **0.695**. Ours is the same quantity floored to a whole pixel.

The pixels confirm a real paint difference, not a measuring one. Per-line ink centroids
(ref → ours): Hearing stimulates 2562.35 / 2585.12 / 2608.19 → 2561.34 / 2584.09 / 2608.18;
Adjustments 3513.31 / 3540.21 → 3512.32 / 3539.21; Lakeshore 4875.40 → 4874.38. A ~0.5–0.7px
offset is invisible as such. Chromium snaps each line's baseline to a whole pixel, so it shows up
as a 1px jump on 50–100% of the lines, which is what the regions are.

**The tests I ran, and what they returned:**
1. Is L1 right? `page.json` `root.children[34]` puts "We match…" at `y 2766.57` at 1280 with
   `lineHeightPx 23.39`, `fontSizePx 18`, `fontFamily Montserrat`. That matches the reference box
   (`expected-manifest` box.y 2766.57). **Yes.**
2. Does the served CSS say anything odd? `site/index.html` emits `.l1-53 { position:absolute;
   top:2766.57px; … font-size:18px; line-height:23.39px; margin:0 }` with no trim, padding or
   transform.
3. Does stock Chromium (playwright 1.61.1 chromium, `--single-process`) floor it? Yes, in every
   shape I tried. With the mirrored font file and `font:400 18px/23.39px`, the glyph offset is
   0.000 (and 2.000 at 27px). It is the same for a bare `<p>`, `<p><span>`, a segmented
   `unicode-range` family, a strut in a different font than the span, a sub-pixel `translateY`,
   and `text-rendering: geometricPrecision`. I also measured the served reproduction itself:
   We match off 0.000, Adjustments 2.000, Lakeshore 2.000.
4. Can I reproduce 2.5 from the reference DOM offline? **Not yet.** Loading `rendered.html` with
   its mirrored CSS and font files (scripts off) does not apply Zyro's theme variables, so the
   text fell back to 16px/normal Times and the measurement is meaningless.

So every local configuration gives the floored value, and the live capture gives the exact one.
The capture (`extract.ts`) and the gate both launch through the same `browserLaunchOptions()`
(`cli/capture/launch-args.ts`). I didn't establish whether the capture of a live page runs with
a different Chromium flag, a different font-loading path, or a layout path my controls didn't
hit.

**What would separate it (the next round's starting point):** load the reference DOM in the
gate's Chromium with Zyro's theme applied, for example by letting `app.CdpBJIAD.js` hydrate from
`assets/`, or by inlining the `--body-*`/`--font-*` variables from `raw.html`. Then read the
"We match…" range offset.
- If it is **0.70**, some CSS shape in the reference produces it, and the renderer can emit that
  shape. That makes it `renderer-wrong`.
- If it is **0.00**, the capture's browser differs from the gate's. Then it is
  `instrument-asymmetric`: the oracle and the reproduction are being laid out by two different
  engines.

**Proposed change (either branch):** the capture already records the glyph top the reference
painted (`renderedTextBox`, 88 occurrences in `capture.json`). The fold or renderer can make the
reproduction's glyph top equal it. For example, emit the fractional remainder
`(renderedTextBox.y − box.y) − floor-half-leading` as a `padding-top` and subtract it from the
height. Or place the run by its glyph top. I don't recommend picking one before the separating
test above, because if the cause is the instrument this would be a per-engine fudge.

**How to see it:**
```
cd /Users/martin/lagrangefoundry/1stcontact/storage/tmp/repro-console/repro-www-hearingzone510-com/iteration-4/diff
python3 -c "
import json
E=json.load(open('expected-manifest.json'));A=json.load(open('actual-manifest.json'))
f=lambda M,t:[round(e['renderedTextBox']['y']-e['box']['y'],2) for e in M['elements'] if (e.get('text') or '').startswith(t)]
for t in ('We match advanced','Adjustments, repairs','3346 Lakeshore'): print(t, 'ref', f(E,t), 'ours', f(A,t))"
```
- **Wrong (now):** `We match advanced ref [0.7] ours [0.0]`, `Adjustments, repairs ref [2.5] ours [2.0]`, `3346 Lakeshore ref [2.5] ours [2.0]`.
- **Right:** equal on both sides. After
  `CHROMIUM_LAUNCH_ARGS=--single-process bin/1c gate repro-www-hearingzone510-com --ref storage/references/www.hearingzone510.com/index --sandbox`,
  regions #3/#4/#5/#7/#8/#9/#10/#11/#12 are gone.

---

## defect_class, one line each

- `capture-loses-it` (issue 1): `raw.html` wraps the run in `<u>`, the reference paints 494px of
  #001e42 at rows 3821–3822, and `expected-manifest.json` reads `textDecoration: None`, because
  `textDecorationOf` (extract.ts:1827) reads only the element's own non-inherited longhand.
- `cannot-tell` (issue 2): L1 matches the reference box/font/line-height and the render
  disagrees by 0.5–0.7px. But every Chromium configuration I could build floors the
  half-leading, so I can't yet say whether the renderer emits the wrong shape or the capture's
  browser differs from the gate's.


---

**Correction (same round, `repro-console:repro-www-hearingzone510-com#4`):** the footer set
handed to REQ-265 is **8** CRITICAL `position` deltas, not 9: Oakland; Hours; Monday & Wednesday;
9 am - 5 pm ×2; Tuesday &  Thursday; Friday; 10 am - 4 pm. Re-measured there as COMMENT-4892, with
regions #2/#6 = 21.7% of the ranked score. The remaining ranked score splits as 15.5% (issue 1
here) + 62.8% (issue 2 here) + 21.7% (REQ-265) = 100%. The button-box and "F" deltas are on
BUG-187, and the unmeasured 4 is on BUG-199. The 5 `arrangement` deltas (Hours ×2, 9 am - 5 pm,
Services, FAX) and the HIGH `a11yRole` on "5" sit in the same footer block. I didn't trace them,
and they are not claimed by any issue here.
