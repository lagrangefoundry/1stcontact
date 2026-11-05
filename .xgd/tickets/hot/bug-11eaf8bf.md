---
uid: bug-11eaf8bf
id: BUG-153
type: bug
title: 'values-diff/probes: a rotated collage and a wrong mask both read as clean,
  and content-robustness wraps a nowrap run'
created_by: repro-console:repro-faelan-com#2
created_at: '2026-09-26T21:30:35.067519+00:00'
updated_at: '2026-10-04T04:54:48.038623+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  defect_class:
  - instrument-blind
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-4307aaec
  commits:
  - working_sha: 18389b822e2707419728e86e6a3e83d911bb6583
    reconcile_sha: null
    main_sha: null
  - working_sha: da3c01e5846bbf1a44dec207cd4a9ee5df1306c7
    reconcile_sha: null
    main_sha: null
  - working_sha: d94d62a9e8b8ce702b68402271054b4c70380b04
    reconcile_sha: null
    main_sha: null
  version: 0.2.387
  story_points: 5
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


---

# Implementation (free-coded, BUG-153)

All four items are implemented. The report below records what was built, the
decisions taken where the ticket's own proposals were incomplete or in tension,
and one defect found during implementation that the ticket did not name.

## Item 1 — TWO causes, and REQ-333 landed both of them first

The item diagnosed one cause (the axis is read off the leaf while the page paints
the rotation on an ancestor). While proving it offline a **second and deeper
cause** turned up, sufficient on its own:

`EXTRACT_SCRIPT` is a template literal. Inside one, a backslash before a
character that is not a recognised escape is **dropped**. The source
`/matrix\(([^)]+)\)/` therefore reached the browser as `/matrix(([^)]+))/` — a
capturing group where a literal parenthesis was meant. Against
`matrix(0.996, -0.087, …)` the group captured `"(0.996, -0.087, …"`,
`parseFloat("(0.996")` gave `NaN`, and the guard below it returned the identity.
So the axis returned `{rotate: 0, scale: 1}` for **every element of every page
since REQ-48 added it** — including an element carrying its own
`transform: rotate(…)`, which the ancestor fix alone would not have rescued.
Neither `tsc` nor any test could see it: the literal is a string to the compiler,
and only a browser evaluates it. Proven by reconstructing the pre-fix runtime
text and driving the function:

```
RUNTIME TEXT:   var m = t.match(/matrix(([^)]+))/);
rotate(-5deg) -> {"rotate":0,"scale":1}
rotate(20deg) -> {"rotate":0,"scale":1}
```

**Both of those causes were independently found and fixed by REQ-333 while this
was in flight, and REQ-333's commits landed on `xgd-working` first** (16:45
against 17:01 the same afternoon). Its `accTransformOf` does the ancestor walk;
its `linearPartOf` reads `matrix()`, `matrix3d()` AND a declared function list,
composing the chain as 2×2 matrix products rather than by summing degrees; and
it double-escaped the same regex, plus two more in the gradient extractor, and
pinned the whole class with a guard UAT over the literal's text. It also carries
consequences this ticket did not reach — `layoutBoxOf` recovering the layout box
from the AABB a rotation inflates, and `frameOf` attributing a wrapper's crop
and ring to the image it frames.

REQ-333's implementation is strictly the more capable one, so the merge takes it
wholesale and **this ticket's contribution to item 1 is the one thing REQ-333
still conflates: the THIRD outcome.** The two earlier spellings written here
(`decomposeTransform`, `effectiveTransformOf`) are gone; nothing is kept in
parallel.

**The third outcome.** The item's rule — *"a zero that means 'we did not look'
must not be comparable to a zero that means 'upright'"* — needs a projected state
that is neither of the two numbers, and `linearPartOf` had no way to say it:
`null` meant both "this element has no transform" and "this element has one I
could not read", so an unreadable chain fell back to the identity and the
comparator, handed two of them, called the pair clean. Implemented as:

- `linearPartOf` returns a third value, `TF_UNREADABLE`, for a transform it saw
  and could not decompose — an unparseable `matrix()`/`matrix3d()`, or a spelling
  its function list does not carry (a skew is the ordinary one). A value spelled
  only out of the translate family still returns `null`, because it genuinely has
  no linear part and translation is already folded into every rect the extractor
  records; flagging it would put a permanent unmeasured row on most pages and
  bury the chains that really are unreadable.
- `accTransformOf` carries `readable` out beside the numbers. One unreadable link
  makes the **whole** effective transform unknown rather than partially known:
  the links below it still paint, so what is left is not the element's transform
  and must not be projected as one.
- `transformFields(tf)` is the single projection site for both leaf kinds. Where
  the chain was unreadable, `transformRotateDeg` and `transformScale` are
  **absent** and `transformUnreadable: true` is set in their place. The diff
  reports that as a row in `values.unmeasuredAxes`, naming the side — the item's
  "reported in `unmeasuredAxes` rather than defaulted to the identity", applied
  to the case that survives REQ-333's extractor fix rather than as a stand-in
  for it. A page with no transform anywhere still reports `0` / `1` and carries
  no flag, so a non-zero reading always means the page really is transformed.

The item's other two candidates for the same treatment — ancestor `overflow`
clipping and ancestor `opacity` — are **not** implemented. `overflow` clipping is
already read from the ancestor chain (`clipOf`, REQ-332); ancestor `opacity` is
left alone because it is a compositing group rather than a value composed onto
the leaf, and folding it into the leaf's own `opacity` would misreport which
element is ghosted. Neither is named in the item's Wrong/Right pair.

## Item 2 — coverage, not the string

`maskEdge` is now compared by a **derived, engine-independent scalar resolved
against each side's own box**, exactly as proposed: the fraction of the box at
full opacity, and the fraction erased outright, both carried in the delta's
label. New module `tools/generate/src/cli/capture/mask-geometry.ts`.

Resolution is **numeric** — the box is sampled on a 64×64 grid and each sample's
alpha evaluated against the gradient — rather than closed-form, because the
closed form differs per ending-shape keyword while a grid is one piece of code
for all of them and generalises to shapes nobody wants to integrate by hand. It
reproduces the ticket's own arithmetic: on the 330.33 × 222.17 box the
`closest-side` / 62px feather resolves to **30.9% opaque / 21.2% erased** against
the ticket's hand-computed 30.6% / 21.5% (the erased figure is the grid's
estimate of `1 − π/4`), and the reference gradient resolves to **99.0% opaque**.

Presence is still the first question and still the right one, so a feather
present on one side and absent on the other is reported exactly as REQ-48 always
reported it. The tolerance is 2% of the box's area (5% under `--tolerant`), and
is deliberately non-zero even in the exact mode: the two sides' boxes differ by
sub-pixel layout, so a pair of masks that paint the same thing land near each
other rather than on the same number.

**Where it cannot resolve the shape it declines rather than guessing** — a
`clip-path` polygon, a linear feather, an off-centre gradient. When the two sides
then carry *different* strings, the run records a `maskEdge` row in
`values.unmeasuredAxes`: swapping the wide silence this item is about for a
narrower one would repeat the defect at a smaller scale.

## Item 3 — nowrap, and the one proposal deliberately not taken

`estimateTextHeight` takes a `nowrap` argument and returns `1 × lineHeight` when
set; `isNowrapAt(node, width)` decides it by mirroring the renderer's own rule
(`render.ts`, REQ-88: the pin starts at `axes.nowrapFromPx` and holds at every
width from there up). It is decided **once** per text node and passed to both the
perturbed call and the unperturbed baseline it is divided by, so the growth ratio
is 1 and BUG-113's measured height stands.

Measured against the filed document
(`storage/tmp/repro-console/repro-faelan-com/iteration-2/page.json`, driven
through `contentRobustnessProbe`): **26 findings → 14**, and the two the item
closes the arithmetic on are gone —

- both `'© 2025 Faelan Westhead. All rights reserved.' … 8px below its bottom
  edge` escapes at 375, which were 100% of the `structural-failure` verdict;
- all four `Faelan overlaps Worlds End Studio founder, DJ, Producer and Fiddle
  Player` overlaps at 320 and 375;
- and six of the twelve `FAELAN overlaps Artist • Musician • Creator`.

The residual 14 are an artifact of driving the probe **without the oracle's
measured heights** (`1c l1-gate` supplies them; that path needs a browser, which
this sandbox blocks). Without them the estimator gives `FAELAN` its full 96px
`lineHeightPx` where the pinned keyframes place the next run 68px below it, so
the pair overlaps at 320–768 even at `contentScale: 1` — a missing-oracle
artifact, not a model defect, and the reason the ticket's `on-sample PASS` and
this run disagree.

**Not implemented: the horizontal `clip` finding.** The item's proposal ends
*"then let the widened run produce the horizontal `clip` finding the model can
already express"*, which would require widening a nowrap run's box to its
single-line natural width. That directly contradicts the item's own stated
oracle — **"on this bundle, `0 findings` … `l1-gate` passes, and `gate.json`'s
verdict moves off `structural-failure`"** — because at 375 the footer run's
single-line natural width under 2.5× content is ~770px against a 375px viewport,
which fires the viewport-overflow clip check that already exists. Widening would
also inject new `overlap` findings from the wider box. The checkable half of the
item is the one implemented; a run that genuinely leaves the viewport is still
caught by the existing horizontal-clip scan.

**The item's second ask is implemented.** `LayoutFinding` now carries `boxes` —
one resolved box per entry in `paths`, in the same order — and the `width` the
evaluation ran at, on every emitter (`overlap`, `escape`, and both `clip`
kinds). The intersection or overhang a finding asserts is now arithmetic a
reader can close from the artifact, as `regions.json` has always allowed.

## Item 4 — reported, not dropped

REQ-271's exclusion is kept: a reproduction's full-bleed band box can never pair
with anything, so counting it as an unpaired object would state a gap no fold
could close. What was wrong was the **report**, so the ticket's second option is
taken, in the shape REQ-308 already established one level up.

`ValuesDiffReport` gains `bandPaintActual` — the repro elements lifted OUT of
`unpairedActual`, carrying the same `UnpairedObject` record with each one's
manifest index. `gate.json` gains `values.bandPaintActual` as a count, the pass
rung names it, and `1c gate`'s console prints a `⚠` line for it. The three
numbers a reader was asked to reconcile —
`matched + unpairedActual + bandPaintActual = elementCounts.actual` — now add up,
which is the fact the report could not state.

The ticket's first option (stop projecting a band as an element) was **not**
taken: REQ-271 records that a full-bleed textless box is exactly what the fold
reads to rebuild a backdrop (BUG-27), so removing it upstream would take a hero
photograph out of the fold's input on a page-builder site.

## Expected effect on this bundle

Every item RAISES what the instrument reports, which is the point of all four:

| | before | after |
|---|---|---|
| `transform` deltas | 0 | up to 4 (one per rotated photograph) |
| `mask` deltas | 0 | 3 |
| `unmeasuredAxes` | `[]` | non-empty wherever a transform or a mask could not be read |
| `bandPaintActual` | not reported | 3 |
| content-robustness findings | 18 (`structural-failure`) | the two 8px footer escapes and the four `Faelan` overlaps gone |

## Found, and fixed by REQ-333 — the same escaping defect, two functions away

The template-literal escape sweep that found item 1's regex found two more in
`EXTRACT_SCRIPT`, in the gradient colour-stop extractor: `/url\([^)]*\)/g` and
the `rgba?\(`/`hsla?\(` alternation both shipped having lost the closing
parenthesis from the match, which left a stray `)` behind on a stripped `url()`
and returned unparseable colours (`"rgba(3, 7, 23, 0.3"`). This was filed here as
outside every Wrong/Right pair and deliberately left alone rather than fixed
silently — and **REQ-333 fixed all three regexes in the same pass that fixed
item 1's**, so there is nothing left to scope. Recorded because the class, not
the instance, is the finding: any regex inside that literal is one escape away
from compiling into something that still matches and still returns a number.

## Merge with REQ-333, and the one existing UAT amended

Merging `xgd-working` after REQ-333 landed left two things to settle beyond the
transform code itself.

**`package.json`** takes working's version; the bump is re-applied on top.

**`tests/test_UAT_FC_REQ-302_a_flow_placed_run_shrinks_to_fit.test.ts` is
amended, for a reason that is item 3's model and not an accommodation.** REQ-302
asserts that a *flow-placed* relaxed run resets its width to `fit-content`, so
its fixture has to make `promoteToFlow` actually choose flow — which it did by
declaring a stack of runs each captured on ONE line at every width (the condition
REQ-117's floor sits behind) and then relying on the perturbation probe growing
the top one downwards into the run below. Those are contradictory: a run the
renderer pins `white-space: nowrap` cannot gain a line, so it cannot overrun
anything downwards, and after item 3 the probe correctly no longer says it does —
no overlap pair, no promoted region, nothing in flow. The fixture gains a wrapped
two-line paragraph ABOVE the wordmark, so the run that grows is one that really
can wrap and the wordmark reaches flow by being collided WITH, which is the
ordinary way a pinned sibling joins a flowed region. REQ-302's own assertions are
untouched and still pass: `fit-content` on every relaxed rung, `auto` on none,
and REQ-117's `min-width: 686px` floor intact.

This is the honest shape of item 3's cost: suppressing a finding the model was
wrong about also removes it as an input to flow recovery. A run that genuinely
leaves its box sideways is still caught by the existing horizontal-clip scan.

## Test plan

Two UAT files, both running without a browser (`chromiumAvailable()` is false in
this sandbox, so a browser-gated leg would report SKIPPED and leave the fix with
no evidence):

`tests/test_UAT_FC_BUG-153_the_ruler_reads_the_page.test.ts` — 16 UATs over items
1, 2 and 4. Item 1's extractor leg slices `TF_UNREADABLE`, `linearPartOf`,
`mul2`, `accTransformOf` and `transformFields` **out of `EXTRACT_SCRIPT`'s own
text** and builds them with `new Function` and stub styles, so the
browser-evaluated string is really the code under test; the slice is keyed on the
functions' source text, not a line number, and drives the pair the way the
projection does (one ancestor walk, fields read off its result). The four legs
that matter for the third outcome: an unreadable chain projects the flag and
NEITHER number; an unreadable link poisons the whole chain rather than yielding
the readable remainder; a translate-only transform is read, not declined; and a
readable chain still projects both numbers — that last one is the guard that a
projection answering `transformUnreadable` for everything would fail. The two
legs that restated REQ-333's ancestor composition over four rotations and a
three-deep chain are **removed**: that behaviour is REQ-333's, its own UATs prove
it over a parsed DOM, and asserting it twice here would claim it as this
ticket's. Items 1 (diff side), 2 and 4 run through `diffManifests`, and item 4
also through `reconcileGates` so the fact is proven to reach `gate.json`.

`tests/test_UAT_FC_BUG-153_a_nowrap_run_does_not_wrap.test.ts` — 7 UATs over
item 3, on a synthetic document that reproduces the filed shape (84px band, a
44-character footer line, `nowrapFromPx: 375`) and is validated by `validateL1`
so the axis under test is the one the renderer reads. The fixture's only variable
is `nowrapFromPx`, so the "still reports a real escape" leg differs from the
"no longer escapes" leg in nothing else — a fix that simply stopped growing every
run would fail it.

Regression scope run green after the merge: all 93 suites importing any changed
module (`values-diff`, `gate-core`, `gate`, `probes`, `value-axes`, `extract`,
`sections`, `mask-geometry`, the `l1` barrel, `evaluateLayout`/`promoteToFlow`),
in four batches — plus REQ-333's three suites and `req88-viewport-relative-and-nowrap`.
One failure found and resolved: REQ-302's fixture, above. `tsc --noEmit` clean on
`tools/generate`, and `EXTRACT_SCRIPT` extracted from the literal and
`node --check`ed so the emitted script is known to parse.

## Files

- `tools/generate/src/cli/capture/extract.ts` — `TF_UNREADABLE`, the third
  outcome in `linearPartOf`, `readable` on `accTransformOf`, `transformFields`,
  and the two projection sites
- `tools/generate/src/cli/capture/mask-geometry.ts` — new
- `tools/generate/src/cli/capture/values-diff.ts` — `compareMask`,
  `unreadableTransformAxes`, `bandPaintActual`, `maskCoverageTolerance`
- `tools/generate/src/cli/capture/value-axes.ts` — the `transformUnreadable` row
- `tools/generate/src/cli/capture/types.ts`, `sections.ts` — the flag's persistence
- `tools/generate/src/cli/gate-core.ts`, `gate.ts` — `bandPaintActual` on the
  report, the pass rung, and the console
- `tools/generate/src/l1/probes.ts` — `isNowrapAt`, the `nowrap` argument,
  `boxes` + `width` on `LayoutFinding`
- `tests/test_UAT_FC_REQ-302_a_flow_placed_run_shrinks_to_fit.test.ts` — fixture
  amended (see above); REQ-302's assertions unchanged


## Post-merge baseline on `xgd-working` (main checkout only)

Four suites in the scope fail in the main checkout after the merge. All four are
real-bundle tests — they read a retained third-party capture from
`storage/references/`, which is gitignored, so they silently return early in every
branch worktree and can only be observed here:

| suite | failure |
|---|---|
| `bug14-fold-surface-hierarchy` | `real_captures_get_bands_and_treated_cards` |
| `bug20-chip-self-surface` | `real_gigabytealchemy_badges_fold_as_pills` |
| `req96-control-composition` | `gigabyte_submit_recovers_its_per_width_position` (`122.75` vs `123`) |
| `test_UAT_FC_REQ-278_flow_recovery_preserves_geometry` | `the_stored_references_are_measured_in_the_units_BUG-113_used` |

**None of them is this ticket's.** Each was re-run in the main checkout with all
nine of this ticket's source files reverted to `xgd-working`'s tip immediately
before the merge (`e6ae7df0b3`) and `mask-geometry.ts` moved aside, and each fails
**identically** in that state — the sub-pixel shapes point at REQ-333's
`layoutBoxOf`, which un-inflates a rotated element's AABB and therefore moves
real-bundle geometry by fractions of a pixel. REQ-333 is at
`ready_to_reconcile`; recorded here so the next reader does not attribute them to
this ticket's commits.