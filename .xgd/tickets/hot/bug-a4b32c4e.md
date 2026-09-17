---
uid: bug-a4b32c4e
id: BUG-99
type: bug
title: 'fidelity diff: ranked pixel regions carry no geometry, only crop image paths'
created_by: REQ-256
created_at: '2026-09-16T18:28:26.584326+00:00'
updated_at: '2026-09-17T23:27:11.141579+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  severity: high
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-561123fd
  story_points: 3
  commits:
  - working_sha: 9094f95dce2b1affd12ce86cf6ae308df6704bbc
    reconcile_sha: null
    main_sha: null
  - working_sha: ae37a4b79cb88c8390874c172fb06773c35899f6
    reconcile_sha: null
    main_sha: null
  version: 0.2.243
---

## Residual class

`diff-regions-carry-no-geometry`

## Which stored reference(s) exhibit it

- `example.com` — bundle `/stored/example.com/index`, sandbox site `repro-example-com`, iterations 1, 2 and 3.

Evidence from **one reference only**. The class is not site-specific: it is a property of the region record the differ writes, so any reference whose run produces a non-empty `regions` array will show it.

## The evidence

`gate.json` (iteration 3; byte-identical in iterations 1 and 2):

```json
{"pass":false,"verdict":"reproduction-wrong","diagnosis":"the pixels disagree and the capture looks complete","nextStep":"diagnose the fold","perceptual":{"meanDiff":12.5,"pctOverThreshold":4.25,"regions":1},"values":{"deltas":1},"coverage":{"unreferencedImages":[]}}
```

`regions.json` (iteration 3) — this is the entire file:

```json
{"meanDiff":12.5,"pctOverThreshold":4.25,"regions":[{"id":1,"crops":{"ref":".../iteration-3/diff/region-1-ref.png","actual":".../iteration-3/diff/region-1-ours.png","diff":".../iteration-3/diff/region-1-diff.png"}}]}
```

The region record has exactly two keys — `id` and `crops` — and `crops` has exactly `ref`, `actual`, `diff`. There is no `x`, `y`, `width` or `height`; no area or over-threshold pixel count; no per-region mean; no binding to a node id or selector in the L1 document. The only number anywhere in the entry is `id: 1`.

For contrast, `values-diff.json` (iteration 3; byte-identical in iterations 1 and 2):

```json
{"deltas":[{"selector":"h1","field":"color","ref":"#111","actual":"#222"}]}
```

The value delta carries a selector and both values, so it is quotable as evidence. The region record carries neither.

## Why this is an engine gap, not a site issue

DOC-19's rule — transcribe from the captured DOM, never reconstruct from a screenshot — depends on the region record doing its half of the job: the region says *where* to look so the values can then be read out of the capture. With geometry omitted, the only way to learn where region 1 is is to open `region-1-diff.png` and look at it. The evidence format therefore forces the exact reconstruction-from-a-picture that the runbook forbids — on every round, for every reference.

It also makes REQ-256 §6's ticket contract unsatisfiable as written. That section requires the body to quote "the `regions.json` entry ... with their actual numbers". There are no numbers to quote.

And it makes successive rounds incomparable. Across iterations 1, 2 and 3 of this reference, `meanDiff` (12.5), `pctOverThreshold` (4.25), the region count (1) and the single value delta were all identical; nothing in the region record would have revealed whether region 1 had moved, shrunk, or stayed exactly put. There is no stable key by which iteration 2's region 1 can be shown to be the same region as iteration 3's.

## Hypothesis

The perceptual comparison stage in `tools/generate/src` must already compute connected components over the thresholded difference image — it cannot crop three PNGs per region, or rank regions, without a bounding box and an area. The geometry exists at compute time and is discarded at serialisation time, leaving only the paths of the crops it was used to cut.

I could not name the file and function. `tools/generate/src/` was outside this round's readable roots, as was the reference bundle `/stored/example.com/index` — `capture.json` and `raw.html` were both unreadable, so the reference DOM could not be transcribed either. Whoever implements this should confirm against the component-labelling function that writes `regions.json`.

## Proposed change

Extend each entry of `regions[]` to carry, at minimum:

- **`bbox`** — `{x, y, width, height}` in reference-image pixel coordinates, alongside the reference image dimensions (or device pixel ratio) the coordinates are relative to, so they can be converted.
- **`area`** (pixels over threshold within the bbox) and a per-region **`meanDiff`**. These are also the ranking key, which today is implicit in array order and nowhere stated.
- **`nodes`** — the L1 node id(s) / selector(s) whose layout boxes intersect the bbox, resolved from the reproduction's own geometry. This is what turns a region from a pointer into a lead: it lets a reviewer go straight from a region to that node's captured values, which is precisely the path DOC-19 asks for.

Keep the crops — they are useful to a human — but stop making them the only representation. Sort `regions[]` by `area` descending and state it in the schema, so "regions, largest first" (REQ-256 §3) becomes a guarantee rather than an assumption a reader has to make.

Secondary note for whoever picks this up: the regression rail reported `{"available": false}` in all three iterations of this reference, so the three identical gate results went unremarked. A rail entry (REQ-255) would have flagged the non-convergence independently.


---

## Correction, from the implementing session (2026-09-17)

**The ticket's evidence is a test fixture, not engine output. Two of the three
proposed changes already exist; the third does not, and is the whole of what
this ticket now builds.**

### The evidence is a stub

Every byte quoted above — `meanDiff: 12.5`, `pctOverThreshold: 4.25`, the
`{id, crops}` region record, `values-diff.json`'s
`{"selector":"h1","field":"color","ref":"#111","actual":"#222"}` and `gate.json`
verbatim — is written by the **fake `1c gate`** in
`tests/test_UAT_FC_REQ-254_reproduction_console.test.ts:122-160`. The round was
pointed at a sandbox wired to that stub, not at a reproduction. `example.com`
and `repro-example-com` are the fixture's names.

The stub was written to exercise the console's crop-serving path, so it carries
only the keys that path reads. It is not, and never claimed to be, the shape the
real command writes — but nothing said so, and a round diagnosing the engine
from it cannot tell.

### What the real artifact carries

`tools/generate/src/cli/perceptual.ts:314` writes the whole
`PerceptualDiffReport`. Verified against a real run on disk
(`storage/tmp/repro-console/repro-gigabytealchemy-ai/iteration-1/diff/regions.json`):

```json
{"ref":"…/screenshot.full.png","actual":"…/actual.png","dims":{"w":1280,"h":4376},
 "blockPx":16,"meanDiff":0.31,"pctOverThreshold":0.1,"bands":[…16…],
 "regions":[{"id":1,"bbox":{"x":704,"y":3920,"w":80,"h":32},
             "score":246.4,"meanDiff":30.8,"area":2560,"crops":{…}}, …9 more]}
```

So, against the three proposed changes:

| proposed | state |
|---|---|
| `bbox` + the dimensions it is relative to | **already there** — `bbox {x,y,w,h}` per region, `dims {w,h}` on the report. Screenshots are shot at DPR 1, so image px are document CSS px; `dims.w` is the viewport width. |
| `area` and per-region `meanDiff` | **already there**, plus `score` (the sum of block-averages over the cluster's cells), which is the actual ranking key. |
| `nodes` — the L1 node / selector leads | **missing. This is the gap.** |

`deriveRegions` (`perceptual-core.ts`) already sorts by `score` descending and
`1c diff`'s own `formatDiffReport` already prints `@ x,y w×h`.

### What this ticket now does

1. **Region → node leads.** Each region gains `nodes: {ref[], actual[]}` — the
   manifest elements and section bands whose boxes intersect the region's bbox,
   each carrying its verbatim run text, role, own box, and the two overlap
   fractions (how much of the region this node explains, and how much of the
   node the region covers), best-first, capped at a readable number. This is the
   ticket's own "turns a region from a pointer into a lead": it lets a reader go
   straight from a region to that element's captured values, without opening a
   PNG.

   Both sides are resolved because their *asymmetry* is the signal — a region
   with a `ref` lead and no `actual` lead is something we failed to draw; the
   reverse is something we drew that is not there.

   The material is already written beside `regions.json` by `1c gate`
   (`expected-manifest.json` / `actual-manifest.json`, same document coordinate
   space, every element boxed), so this is pure arithmetic over data that
   already exists, not new capture. When the two coordinate spaces differ the
   scale is derived from the manifest's own viewport width and recorded on the
   report, so the leads are convertible rather than silently mis-registered.

   Node resolution is optional input: a caller that supplies no manifest gets
   exactly today's region record, so `1c diff` on a loose PNG still works.

2. **State the ranking key.** The report gains `rankedBy`, so "regions, largest
   first" stops being an assumption a reader has to make.

   **Ranking stays `score`, not `area`.** The ticket asks for area-descending;
   that would be a regression. `score` is the sum of block-averages over the
   cluster, which deliberately ranks a large-faint region alongside a
   small-intense one — area alone promotes a big pale wash over a small hard
   mismatch. `area` is carried per region either way, so a reader who wants that
   order can take it.

3. **Fix the fixture that caused this ticket.** The console test's fake gate
   writes the real region shape, leads included. A fixture that misrepresents
   the artifact it stands in for is how a round files a gap that is not there —
   which is exactly what happened here, and it cost a round.

4. **Surface the geometry where a round actually reads.** The console's diff
   page captions each triptych with its bbox, score and top lead instead of
   three unlabelled images; the per-iteration digest lists the leads beside the
   geometry it already prints; the round brief says what a region record
   carries.

### Not in scope

- Re-sorting by `area` (item 2 above).
- Renaming `bbox`'s `w`/`h` to `width`/`height` — the crop path and the
  published contract both use `w`/`h`.
- The regression-rail note — that is REQ-255's.

### How to see it

Before: `regions.json` says *where* and nothing else; finding out *what* is
there means opening `region-N-diff.png`. After, on any bundle:

```
./bin/1c gate <slug> --ref storage/references/<host>/index --out /tmp/g
python3 -c "import json;print(json.load(open('/tmp/g/regions.json'))['regions'][0]['nodes'])"
```

The top region names the reference element under it and the reproduction element
under it, with their boxes — the two records to go and read in
`expected-manifest.json` / `actual-manifest.json`.

### Test plan

`tests/test_UAT_FC_BUG-99_region_node_leads.test.ts` — pure-arithmetic UATs over
the lead resolver and the report shape (no browser): a region resolves the
elements under it best-first; an element present on one side only produces a
one-sided lead; a section band with no text run still produces a lead; a
manifest at a different width is scaled; no manifest leaves the record
unchanged; `rankedBy` is on the report and the order matches it.
`tests/test_UAT_FC_REQ-254_reproduction_console.test.ts` — the fake gate's
region record now carries the real shape, and the console's diff page shows it.