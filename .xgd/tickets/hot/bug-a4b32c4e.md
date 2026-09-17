---
uid: bug-a4b32c4e
id: BUG-99
type: bug
title: 'fidelity diff: ranked pixel regions carry no geometry, only crop image paths'
created_by: REQ-256
created_at: '2026-09-16T18:28:26.584326+00:00'
updated_at: '2026-09-16T18:28:26.584326+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  severity: high
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-561123fd
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