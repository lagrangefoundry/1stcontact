---
uid: request-936e10eb
id: REQ-365
type: request
title: 'l1: no text-underline-offset axis, so a link underline paints 2px high'
created_by: repro-console:repro-faelan-com#6
created_at: '2026-10-03T01:03:21.646192+00:00'
updated_at: '2026-10-03T01:03:21.646192+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  defect_class:
  - l1-cannot-express
  - instrument-no-axis
  auto_merge_back: true
  needs_review: false
  priority: medium
---

# L1 cannot place an underline: `text-underline-offset` has no axis, so a link's line paints 2px high

**Seen on:** `storage/references/faelan.com/index` only (iteration 6 of `repro-faelan-com`). One bundle of evidence.
**Gate:** verdict `pass`, mean 1.07/255, 0.06% over threshold, unmeasured 0, 5 value deltas, **1 ranked region, and this issue accounts for all of it (score 333.89 of 333.89).** It is the round's only remaining pixel disagreement, and **no value delta reports it.**

The other 5 deltas are two existing instrument classes (REQ-302 issue 4: 4 × `surfaceFill`, and REQ-270 issue 3: 1 × `overlay`). I added this round's measurements to those tickets as comments. They are not repeated here.

Issues in dependency order. Issue 1 is the ceiling item. Issue 2 is the plumbing behind it, and it is only worth doing once issue 1 exists.

---

## Issue 1: L1 has no underline-offset axis (class 2, `l1-cannot-express`)

**Residual class:** `l1-has-no-text-underline-offset-axis`
**defect_class `l1-cannot-express`:** `l1TextRunAxesSchema` (packages/site-schema/src/l1/schema.ts:2311) is `.strict()`, and its only decoration field is `textDecoration: z.enum(['none','underline','line-through','overline'])` (schema.ts:2346; the same enum appears at :1050 for hover state and :2026 for text axes). There is no field that could carry `4px`, and a strict object refuses any extra key. The engine's own triage register already says so: `tools/generate/src/cli/capture/coverage.ts:481-491` lists `text-underline-offset` (and thickness, colour, style, position, skip-ink) as `not-expressible`.

**Test I ran (question 1 of the three: can L1 express it?):** read the schema above. Answer: **no**. I also ran the engine's own audit on the bundle:

```
CHROMIUM_LAUNCH_ARGS=--single-process node tools/generate/bin/1c.mjs capture audit faelan.com/index --json
```
Its `notExpressible` list contains:
```json
{ "property": "text-underline-offset", "count": 1, "values": ["4px"], "verdict": "not-expressible",
  "note": "L1's `textDecoration` is a closed enum of LINES (...); it carries no colour, style, thickness or offset for the line it paints" }
```

### Evidence

- **Ground truth, `raw.html`:**
  `<a href="https://open.spotify.com/artist/4YkpJkV28COxXYjbGUi0S9?..." target="_blank" style="color: inherit; text-decoration: underline; text-underline-offset: 4px; ...">Musician</a>`
- **The capture records the line but not the offset.** Both manifests carry `"textDecoration": "underline"` on the `Musician` run, and the word "offset" never appears. `capture.json` matches `underline` exactly once.
- **The L1 document** (`iteration-6/page.json`): the run is `{"text":"Musician","axes":{"textDecoration":"underline"},"link":{"href":...}}`.
- **The render** (`iteration-6/site/index.html`): `.l1-8-r1 { color: inherit; text-decoration: underline }`. Nothing places the line, so the UA's `auto` offset applies. Emitted by `packages/framework/src/l1/render.ts:4302`.
- **`regions.json` region #1:** `bbox {x:176, y:192, w:96, h:16}`, `score 333.89`, `meanDiff 55.65`, `area 1536`.
  - `nodes.ref[0]`: element 2, "Musician", role `link`, box (179.17, 168) 92.7×36, ofRegion 0.72.
  - `nodes.actual[0]`: element 2, "Musician", role `link`, box (179.16, 168) 92.7×36, ofRegion 0.72.

  The same text and the same box on both sides. The readout's `meanRgb` agrees to within 0.12 (ref [72.84,57.67,55.72] vs ours [72.88,57.79,55.76]), yet `rowDiff` is 217 on exactly four rows (rows 5–8 = y 197–200) and about 1 elsewhere. That is the same ink painted in a different place.
- **The rows, measured.** Mean luminance over x 185–264 of each screenshot, from a PIL read of `screenshot.full.png` and `diff/actual.png`:

  | y | 195 | 196 | 197 | 198 | 199 | 200 | 201 |
  |---|---|---|---|---|---|---|---|
  | ref | 17.7 | 14.4 | 12.4 | 12.2 | **230.9** | **230.8** | 13.1 |
  | ours | 17.2 | 13.8 | **230.9** | **230.8** | 11.9 | 11.1 | 13.1 |

  The reference's 2px underline sits at y 199–200. Ours sits at y 197–198. **Ours is 2px high**: the gap between the UA's `auto` offset and the declared `4px` for this font at 24px.
- **`values-diff.json`:** 0 deltas on `Musician` apart from the `surfaceFill` one, which belongs to REQ-302. Its `textDecoration` comparison (values-diff.ts:3392) compares only the line enum, `underline` = `underline`.

### Hypothesis
This is a substrate gap, not a misread. The capture's `textDecorationOf` (extract.ts:1591) keeps only the first token of `text-decoration-line` on purpose, because there is nowhere to put the rest.

### Proposed change
Add a length axis for the line's placement to the run axes, the text axes and the hover state, beside `textDecoration`. For example `underlineOffsetPx: finite.optional()`, or an `em` value if the vocabulary prefers scale-relative. Thickness and colour are the obvious companions, and this page uses neither. Then:
1. **Capture:** record `textUnderlineOffset` in computed px when it is not `auto`, on the run in `extract.ts` beside `textDecorationOf`. Move `text-underline-offset` from `not-expressible` to `recorded` in coverage.ts, with a `present` witness.
2. **Fold:** carry it through `fold.ts:773-810` beside `foldTextDecoration`, using the same diff-against-base rule as `textDecoration` for a run.
3. **Renderer:** emit `text-underline-offset: <n>px` beside render.ts:4302 (and :4563 for the text-node path, :922 for state).
4. **Docs:** update DOC-27 (vocabulary). DOC-19:177 already names this exact failure ("a markdown link underline hugs the letters without `text-underline-offset`"), so the runbook has known about it with no axis to act on.

The capture change is capture-side, so faelan.com needs a **re-capture** after it lands. `1c refold` cannot pick it up.

### How to see it / how to know it is fixed
```
CHROMIUM_LAUNCH_ARGS=--single-process node tools/generate/bin/1c.mjs capture audit faelan.com/index --json \
  | python3 -c "import json,sys;print([r['property'] for r in json.load(sys.stdin)['notExpressible']])"
```
- **Wrong (now):** the list includes `'text-underline-offset'`.
- **Right:** it no longer does, because the register says `recorded` and the re-captured bundle carries the value.

```
node tools/generate/bin/1c.mjs page get repro-faelan-com home --sandbox --json   # find the Musician run
```
- **Wrong (now):** `"axes":{"textDecoration":"underline"}` only.
- **Right:** the run also carries the offset (4px).

```
CHROMIUM_LAUNCH_ARGS=--single-process node tools/generate/bin/1c.mjs gate repro-faelan-com --ref storage/references/faelan.com/index --sandbox
```
- **Wrong (now):** 1 ranked region at (176,192) 96×16, score 333.89.
- **Right:** no ranked region over "Musician", and the row read above puts the bright rows at y 199–200 on both sides.

---

## Issue 2: the comparator cannot see where a decoration line sits (`instrument-no-axis`)

**Residual class:** `values-diff-has-no-decoration-placement-axis`
**defect_class `instrument-no-axis`:** neither manifest carries any decoration-placement field (key census: `textDecoration` ×84, and no offset/thickness key exists). `values-diff.ts:3392` compares only `exp.textDecoration` against `act.textDecoration`, both `"underline"` here. So the only pixel disagreement on the page is 0 deltas and 0 unmeasured.

**Depends on issue 1.** Until L1 can express the axis, comparing it would add a delta that nothing could close. Once issue 1 lands, add `underlineOffsetPx` to `ValueElement` (values-diff.ts:168 region) on both projections, measured by the same procedure. **This will add a delta**, one on this bundle, which is the instrument getting sharper, not a regression.

**How to know it is fixed:** after issue 1 and before the renderer change, `1c values-diff` (same prefix and args as the gate above) reports a `Musician` delta on the offset axis. After the renderer change it reports none.

---

The gate's headline `unmeasured 0` while the capture audit lists 7 not-expressible properties in use is a separate ruler defect, filed as its own bug and cross-referenced in the closing report.
