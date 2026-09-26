---
uid: bug-11eaf8bf
id: BUG-153
type: bug
title: 'values-diff/probes: a rotated collage and a wrong mask both read as clean,
  and content-robustness wraps a nowrap run'
created_by: repro-console:repro-faelan-com#2
created_at: '2026-09-26T21:30:35.067519+00:00'
updated_at: '2026-09-26T21:30:35.067519+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  defect_class:
  - instrument-blind
  auto_merge_back: true
  needs_review: false
  priority: medium
---

Found by loop 1, iteration 2 of `repro-faelan-com` against
`storage/references/faelan.com/index` (captured `2026-09-26T20:18:42.340Z`,
`captureSchema: 6`). The engine residuals this round found are filed separately
as the round's gap ticket; this is the ruler.

`gate.json` for that run reads `verdict: "structural-failure"`, 12 value deltas,
worst tier CRITICAL, and **`unmeasured 0`** — `unmeasuredAxes: []`,
`notComparableAxes: []`, `unpairedSections: 0`, `unpairedActual: 0`. All four of
those numbers are wrong in the same direction:

- **91.76% of the ranked pixel score (99037.85 of 107925.69) corresponds to no
  value delta at all**, because the two axes that would name it are read from the
  wrong element (item 1) and compared by presence only (item 2);
- **100% of the `structural-failure` verdict** is an envelope probe wrapping runs
  the document paints `white-space: nowrap` (item 3);
- 3 of the reproduction's 14 manifest elements paired with nothing and
  `unpairedActual` reports `0` (item 4).

Four items, in descending order of what they cost. Items 1 and 3 are worth
having on their own; 2 and 4 are cheap and are here because they are the same
kind of silence.

```
REF=/Users/martin/lagrangefoundry/1stcontact/storage/references/faelan.com/index
ITER=/Users/martin/lagrangefoundry/1stcontact/storage/tmp/repro-console/repro-faelan-com/iteration-2
```

`1c` was not on `PATH` in this session; every command below was run as
`node tools/generate/bin/1c.mjs …` and is written as `1c …`.

---

## Item 1 — `transformRotateDeg` is compared, and reads `0` on BOTH sides, so four photographs rotated 3–8° are invisible to the score

**`defect_class`: `instrument-blind`** — the axis exists, the comparator runs, and
it compares two zeros. The score is not wrong; over the dominant defect on this
page it is empty.

`tools/generate/src/cli/capture/values-diff.ts:2643-2650` does compare it, with a
2° tolerance:

```ts
if (exp.transformRotateDeg !== undefined && act.transformRotateDeg !== undefined) {
  const dr = Math.abs(exp.transformRotateDeg - act.transformRotateDeg)
  if (dr > 2) push(exp, 'transform', `rot ${exp.transformRotateDeg}°`, `rot ${act.transformRotateDeg}°`, dr)
}
```

Both manifests say `0` for every element:

```
$ node -e 'for (const f of ["expected","actual"]) console.log(f,
    require("/Users/martin/lagrangefoundry/1stcontact/storage/tmp/repro-console/repro-faelan-com/iteration-2/diff/"+f+"-manifest.json").elements.map(e=>e.transformRotateDeg).join(","))'
expected 0,0,0,0,0,0,0,0,0,0,0
actual   0,0,0,0,0,0,0,0,0,0,0,0,0,0
```

The page rotates all four of its collage photographs. `$REF/raw.html` puts each
`<img>` inside a wrapper div, and `$REF/assets/index.BM9-dqc-.css` — the page's
own stylesheet, mirrored into the bundle — rotates the wrapper:
`.photo-circle{transform:rotate(-5deg)}`, `.photo-torn{transform:rotate(3deg)}`,
`.photo-soft-1{transform:rotate(-8deg)}`,
`.photo-soft-2{transform:rotate(4deg)}`. `transform` is not inherited, so
`getComputedStyle(img).transform` is `none`, and the *reference side's* projection
is produced by the same extractor as ours — so both sides report the same wrong
zero and the difference reads as clean.

**Why this is the ruler's problem and not only the capture's.** The engine-side
loss is filed as the gap ticket's issue 1. What belongs here is that the
instrument cannot tell an operator it happened: `unmeasuredAxes` is `[]`, so the
gate positively asserts that nothing went unmeasured, while the two regions it
ranks 1st and 2nd — 91.76% of the score, `meanAbsDiff` 27.81 and 52.49, with
identical `nodes` on both sides whose boxes agree to 0.01px — have **zero**
deltas under them. `$ITER/diff/values-diff.json`'s `objects` entry for each of the
four images compares exactly four params (`name`, `objectFit`, `aspect`, `box`)
and every one matches: `"deltaCount": 0, "worstSeverity": 0, "worstTier": null`,
four times.

A ruler that reads a property off the leaf while the page paints it on an
ancestor is not measuring the page. **Proposed change:** where an axis can be
inherited-or-composed from ancestors — `transform` above all, but the same is
true of `overflow` clipping and of an ancestor's `opacity` — the projection must
read the *effective* value, and where it cannot, the axis must be reported in
`unmeasuredAxes` rather than defaulted to the identity. A zero that means "we did
not look" must not be comparable to a zero that means "upright".

**Reproduce.**

```
grep -o 'transform:rotate([^)]*)' \
  storage/references/faelan.com/index/assets/index.BM9-dqc-.css
node -e 'const m=require("/Users/martin/lagrangefoundry/1stcontact/storage/tmp/repro-console/repro-faelan-com/iteration-2/diff/expected-manifest.json");
  console.log(m.elements.filter(e=>e.role==="img").map(e=>[e.alt||e.text,e.transformRotateDeg]))'
```

**Wrong (today):** the stylesheet prints four `transform:rotate(…)` and the
reference manifest prints `transformRotateDeg: 0` for all four images.
**Right (fixed):** the reference manifest reads `-5`, `3`, `-8`, `4`; a
`transform` delta appears as soon as the two sides differ; and until the
extractor can read it, `gate.json`'s `values.unmeasuredAxes` contains
`"transform"` instead of being empty. **Note this will RAISE the delta count** —
by four rows on this bundle — because it makes four currently-skipped
measurements real.

---

## Item 2 — the `mask` axis compares presence, so a mask that erases a fifth of a photograph reads as clean

**`defect_class`: `instrument-blind`** — it measured the wrong thing: whether a
mask exists, not what it does.

`tools/generate/src/cli/capture/values-diff.ts:2620-2628`:

```ts
// mask-feather / clip edge). Like box-shadow, compare *presence*: a missing
// glow or a rounded-vs-masked edge is pixel-obvious, while exact value strings
// (blur radii, mask gradients) drift across engines and would be noise.
compareTreatment(exp, act, 'mask', exp.maskEdge, act.maskEdge)
```

The rationale is sound — the strings do drift — and the consequence is that a
*present but wrong* mask is indistinguishable from a correct one. On this bundle
the two strings are, `$ITER/diff/expected-manifest.json` element 5 against
`actual-manifest.json` element 6:

```
ref:    radial-gradient(92% 92%, rgb(0, 0, 0) 72%, rgba(0, 0, 0, 0) 100%)
ours:   radial-gradient(closest-side, rgb(0, 0, 0) calc(100% - 62px), rgba(0, 0, 0, 0) 100%)
```

and what they paint over the 330.33 × 222.17 box is not close. The reference's
ending ellipse is 92% of each box dimension — 303.9 × 204.4 — so the box's own
corner sits at normalised radius `hypot(165.16/303.9, 111.08/204.4) = 0.769`
against an opaque stop of `0.72`: the photograph is opaque everywhere except its
extreme corners, which reach `alpha 0.826` at the point `border-radius: 8px` has
already rounded away. Ours, under `closest-side`, is opaque only to
`(165.16 − 62)/165.16 = 0.625` and fully transparent beyond `t = 1`:

| photograph | `featherPx` | ours: fully opaque over | ours: erased outright | ref: alpha at box corner |
|---|---|---|---|---|
| `ghostship-eyes.jpg` | 62 | 30.6% of the box | 21.5% | 0.826 |
| `faelan-violin-bw.jpg` | 88 | 12.6% of the box | 21.5% | 0.714 |
| `heal-click-alley.jpg` | 123 | 19.5% of the box | 21.5% | **1.000** |

`values-diff` reports **0** `mask` deltas.

**The regression this hid is the sharpest evidence.** At iteration 1 of this same
bundle the fold emitted no mask at all and this axis reported **3 MEDIUM `mask`
deltas** (REQ-331's issue 3, `mask: present → none`). REQ-331's fix landed, the
fold now emits a mask with the wrong geometry, and the axis went to **0 deltas**.
The instrument's reading improved while the page got no closer — and, on
`heal-click-alley.jpg`, measurably further away, because the reference attenuates
nothing there and we now erase a fifth of it.

**Proposed change:** compare a *derived, engine-independent* scalar rather than
the string. The cheapest one that would have caught this: resolve each side's
gradient against that side's own box and compare the **fraction of the box at
full opacity** (and, optionally, the fraction fully transparent), with a
tolerance. `0.306` against `1.000` is a delta; `radial-gradient(...)` against
`-webkit-radial-gradient(...)` is not. That keeps the string drift out and puts
the geometry in.

**Reproduce.**

```
node -e 'const d="/Users/martin/lagrangefoundry/1stcontact/storage/tmp/repro-console/repro-faelan-com/iteration-2/diff/";
 const e=require(d+"expected-manifest.json"), a=require(d+"actual-manifest.json");
 console.log("ref :", e.elements.filter(x=>x.maskEdge).map(x=>x.maskEdge));
 console.log("ours:", a.elements.filter(x=>x.maskEdge).map(x=>x.maskEdge));'
node -e 'const v=require("/Users/martin/lagrangefoundry/1stcontact/storage/tmp/repro-console/repro-faelan-com/iteration-2/diff/values-diff.json");
 console.log("mask deltas:", v.deltas.filter(d=>d.property==="mask").length)'
```

**Wrong (today):** three pairs of visibly different gradient strings and
`mask deltas: 0`.
**Right (fixed):** three `mask` deltas naming the opaque fraction on each side
(`30.6% → 100%` and so on). **This will RAISE the delta count by three**, and
that is the point.

---

## Item 3 — the content-robustness probe wraps runs the document paints `white-space: nowrap`, which is 100% of the `structural-failure` verdict

**`defect_class`: `instrument-blind`** — it measured the wrong thing: a wrapping
model of a run that cannot wrap. It then names the wrong failure kind and the
gate prescribes the wrong remedy.

`gate.json` says:

```json
"verdict": "structural-failure",
"layout": { "pass": false, "findings": [
  { "kind": "escape", "detail": "at 375px×768px: '© 2025 Faelan Westhead. All rights reserved.' is no longer covered by its backing surface section-band-1 — 8px below its bottom edge", "width": 375, "height": 768, "paths": ["0.2.0","0.2"] },
  { "kind": "escape", "detail": "at 375px×1536px: … — 8px below its bottom edge", "width": 375, "height": 1536, "paths": ["0.2.0","0.2"] } ] }
```

and `nextStep`: *"Make each escaping surface size itself from the content it
backs rather than from a pinned rectangle measured once."*

`1c l1-gate repro-faelan-com --ref storage/references/faelan.com/index --sandbox
--json` gives the full set — `sample-fidelity PASS (maxΔ 0.009px)`, `on-sample
PASS`, `off-sample PASS across 20 width×height samples`, and
`content-robustness FAIL (18 findings)`: 12 × `overlap` *"FAELAN overlaps
Artist • Musician • Creator"* (one per width×height sample), 4 × `overlap`
*"Faelan overlaps Worlds End Studio founder, DJ, Producer and Fiddle Player"* (at
320 and 375 only), 2 × the `escape` above.

### The escape, arithmetic closed

`contentRobustnessProbe` runs at `scale: 2.5`
(`tools/generate/src/l1/probes.ts:1763-1773`). `estimateTextHeight`
(`probes.ts:417-431`) is the whole model:

```ts
const avgChar = fs * 0.5
const perLine = Math.max(1, Math.floor(Math.max(1, availWidth) / avgChar))
const chars = Math.max(1, Math.ceil(runCharCost(content) * scale))
const lines = Math.max(1, Math.ceil(chars / perLine))
return lines * lh
```

and `probes.ts:804-823` grows the oracle's measured height by that model's own
line-count ratio. For the footer copy at 375:

- `runCharCost("© 2025 Faelan Westhead. All rights reserved.")` = 44 characters,
  `× 2.5 = 110`;
- `perLine = floor(327 / (14 × 0.5)) = 46`;
- `lines = ceil(110/46) = 3`, so `natural(2.5) = 60` and `natural(1) = 20`;
- ratio 3, `measured 20 × 3 = 60`, run top 32 within an 84px band →
  `32 + 60 = 92`, and `92 − 84 =` **8px**, the number in the finding.

The run cannot wrap. `$ITER/page.json` gives it `"nowrapFromPx": 375`, and
`$ITER/site/home.html` emits, inside `@media (min-width: 375px)`:

```css
.l1-12 { white-space: nowrap }
```

`estimateTextHeight` has no `nowrapFromPx` parameter — `grep -n nowrap
tools/generate/src/l1/probes.ts` returns **nothing** — so the model wraps it
anyway. The confirmation is which widths the finding fires at: **375, and not
320.** At 320 the axis is below `nowrapFromPx`, the run genuinely wraps, and the
fold gave that band 104px instead of 84 to hold it — so the only two samples
where the model and the renderer disagree are the only two that report an escape.

### The 16 overlaps, same cause

`FAELAN` carries `"nowrapFromPx": 320`, so it is painted `white-space: nowrap` at
every sampled width; the model gives it 2 lines at `scale 2.5`
(`ceil(6 × 2.5 / floor(267.65/32)) = 2` at 1280), doubling its height into the
sentence below it — 12 findings, one per sample. The band-0 heading `Faelan` also
carries `"nowrapFromPx": 320` and grows into the paragraph under it at the two
narrow widths — 4 findings. Under a nowrap-aware model every one of the 18 is 1
line and the probe passes. I have not closed the per-pair arithmetic for the
band-0 pair: `l1-gate`'s finding record is `{kind, detail, paths}` with **no
boxes** (contrast `regions.json`, which carries `bbox` and both sides' `nodes`),
so an overlap cannot be checked from the artifact without re-running the
evaluator. That is a small second ask of this item: put the two boxes and the
width in the finding.

### Why it is not merely a false alarm

A `nowrap` run whose copy grows 2.5× *is* a robustness problem — it overflows its
column horizontally by ~406px, and `probes.ts` already has a `clip` finding kind
for exactly that. So the probe is right that the page is not content-robust here
and wrong about **how**, which matters because the two have opposite fixes: the
gate currently tells the implementer to make the footer band size itself from its
content, and the band's height is not the problem — the run's inability to wrap
is. This is the same shape as BUG-113, which found that the estimator "was the
model arguing with itself" and fixed it by handing the probe the oracle's
measured heights; the measured path is used at `scale === 1` and the estimator
still decides everything above it (`probes.ts:811-821`).

**Proposed change:** pass `axes.nowrapFromPx` into `estimateTextHeight` and
return `1 × lineHeight` when the sampled width is at or above it, so the growth
ratio is 1 and the measured height stands; then let the widened run produce the
horizontal `clip` finding the model can already express.

**Reproduce.**

```
1c l1-gate repro-faelan-com --ref storage/references/faelan.com/index --sandbox --json \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s.slice(s.indexOf("{")));
      const f=j.contentRobustness.byWidth.flatMap(w=>w.findings.map(x=>`${w.width}x${w.height} ${x.kind}: ${x.detail}`));
      console.log(f.length, "findings"); f.forEach(l=>console.log(" ", l));})'
grep -n 'white-space: nowrap' \
  storage/tmp/repro-console/repro-faelan-com/iteration-2/site/home.html
grep -c nowrap tools/generate/src/l1/probes.ts
```

**Wrong (today):** `18 findings`, two of them the 8px footer escape at 375; the
served CSS carries `white-space: nowrap` on `.l1-2`, `.l1-9`, `.l1-10` and
`.l1-12`; and `grep -c nowrap probes.ts` prints `0`.
**Right (fixed):** `content-robustness` reports no `escape` and no `overlap`
involving a run that is `nowrap` at that width — on this bundle, `0 findings` —
`l1-gate` passes, and `gate.json`'s verdict moves off `structural-failure` onto
the perceptual/value residuals, which is where this page's real defects are.

---

## Item 4 — `unpairedActual` reports `0` while three of the reproduction's fourteen elements paired with nothing

**`defect_class`: `instrument-blind`** — the count of what did not pair is
reported as zero when it is three, so the unmeasured set understates itself.

`$ITER/diff/values-diff.json`:

```json
"matched": 11, "unmatched": 0,
"elementCounts": { "expected": 11, "actual": 14 },
"unpairedActual": []
```

and `gate.json`: `"unpairedActual": 0`. `14 − 11 = 3`, and the three are
identifiable: `actual-manifest.json` elements 4, 11 and 13, `role: "generic"`,
boxes `(0,0) 1280×800`, `(0,800) 1280×311` and `(0,1111) 1280×84`, with
concatenated `accessibleName`s — `"FAELANArtist • Musician• Creator"`,
`"FaelanWorlds End Stu…"`, `"© 2025 Faelan Westhe…"`. They are the reproduction's
three band containers, projected as **elements as well as sections**, where the
reference's equivalents (`.montage-container`, `<section>`, `<footer>`) are
projected as sections only. `sectionPairing` shows all three sections pairing
1:1 at `overlap: 1`, so the section list is fine; it is the element list that is
asymmetric.

Whether those three *should* pair is arguable — they describe the same boxes as
the sections. What is not arguable is the report: three elements entered the
comparison on one side, paired with nothing, and the field whose job is to say so
says `0`. Per the standing brief, elements that paired with nothing belong in the
unmeasured set (BUG-106), so `unmeasured 0` on this run is understated by three
before any of items 1–3 are counted.

**Proposed change:** either stop projecting a band as an element when it is
already a section (making the two element lists symmetric, which is the better
fix), or report the three in `unpairedActual` so the count is honest. Not both
silently.

**Reproduce.**

```
node -e 'const d="/Users/martin/lagrangefoundry/1stcontact/storage/tmp/repro-console/repro-faelan-com/iteration-2/diff/";
 const v=require(d+"values-diff.json");
 console.log("elementCounts", v.elementCounts, "matched", v.matched, "unpairedActual", v.unpairedActual.length);
 const a=require(d+"actual-manifest.json");
 a.elements.forEach((e,i)=>{ if(e.role==="generic") console.log(i, JSON.stringify(e.box), JSON.stringify((e.accessibleName||e.text||"").slice(0,30))) });'
```

**Wrong (today):**
`elementCounts { expected: 11, actual: 14 } matched 11 unpairedActual 0`, with
three `generic` band boxes listed.
**Right (fixed):** either `elementCounts.actual` is 11 and the three band
elements are gone from the element projection, or `unpairedActual` has length 3
and `gate.json`'s unmeasured tally includes them.
