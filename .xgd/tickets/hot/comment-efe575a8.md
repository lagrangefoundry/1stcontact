---
uid: comment-efe575a8
id: COMMENT-4042
type: comment
title: Comment on request REQ-302
created_by: xgd
created_at: '2026-09-27T00:58:57.218537+00:00'
updated_at: '2026-09-27T00:58:57.218537+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-edbc7e5f
  kind: note
---

`repro-console:repro-faelan-com#3` — iteration 3 re-measurement of this ticket's
issue 4 (`surfaceFill` asymmetry on the hero scrim), on
`storage/references/faelan.com/index`, re-captured `2026-09-27T00:09:50.010Z`
(`captureSchema: 7`). **The class is still live, and this round's numbers refine
the mechanism the ticket states.**

## This round's arithmetic

4 of 8 deltas, all LOW, severity `1060.1514312600393` each = 4240.61 of the run's
16483.88 total delta severity (25.7%), `magnitude 0.17845491226345167`:

```
{"text":"FAELAN",   "role":"heading","property":"surfaceFill","expected":"#000000","actual":"#0b101e","tier":"LOW"}
{"text":"Artist •", "role":"body",   "property":"surfaceFill","expected":"#000000","actual":"#0b101e","tier":"LOW"}
{"text":"Musician", "role":"link",   "property":"surfaceFill","expected":"#000000","actual":"#0b101e","tier":"LOW"}
{"text":"• Creator","role":"body",   "property":"surfaceFill","expected":"#000000","actual":"#0b101e","tier":"LOW"}
```

Both readings are of the SAME declaration. The page's mirrored stylesheet
(`.../index/assets/index.BM9-dqc-.css`):

```
.montage-overlay[data-astro-cid-j7pv25f6] { position:absolute;inset:0;background:#0000004d }
```

`#0000004d` is black at alpha 77/255 = 0.302, over a `background-image`, and the
capture folds it correctly — `capture.json` `/sections/0/background` is
`{"kind":"image","image":"assets/scorched-earth.jpeg","overlay":{"color":"#000000","opacity":0.3}}`.

- **Reference side** reports `#000000` — the declaration with its alpha
  discarded.
- **Our side** reports `#0b101e` — the declaration composited over an opaque body:
  `round(0.7 x (15,23,43)) = (11,16,30) = #0b101e`, exactly, from `#0f172b`.

Neither is the painted pixel. The reference paints a photograph under 30% black;
so do we (`home.html`: `background-image: linear-gradient(#0000004d, #0000004d),
url("assets/scorched-earth.jpeg")`). The perceptual eye does not corroborate a
paint difference either: no ranked region in `regions.json` names any of these
four runs as its best lead on either side — all 12 regions are on the four
collage photographs, and the whole 71051.80 ranked score is a dropped rotation
(filed this round as REQ-336 issue 1).

## The refinement — the body is NOT the differentiator on this bundle

This ticket states the mechanism as *"surfaceFill drops the scrim's alpha on the
reference side **where the page body paints nothing**, and composites it over an
opaque body on ours"*. On this bundle **both manifests report the same body**:

```
expected-manifest.json bodyBackground= "#0f172b"
actual-manifest.json   bodyBackground= "#0f172b"
```

(and the reference page's own `body` rule is `margin:0;padding:0;overflow-x:hidden`
— no background at all, so `#0f172b` is itself an extractor fallback on the
reference side, which is REQ-271's laundering class.)

So the asymmetry survives a body that agrees, and the differentiator is the **DOM
shape the same scrim takes on each side**:

| side | how the 30%-black scrim exists | what the extractor's ancestor walk finds |
|---|---|---|
| reference | a real element, `.montage-overlay { background:#0000004d }` | an ancestor with a non-transparent `background-color` -> hexified, **alpha dropped** -> `#000000` |
| ours | a `background-image` layer on the band itself, `linear-gradient(#0000004d, #0000004d)` | no ancestor carries that colour as a `background-color`, so the walk resolves a **composite** -> `#0b101e` |

That matters for the fix: making the reference side alpha-aware is necessary but
not sufficient on its own, because the two sides are not reading the same *kind*
of declaration. A fix that only stops discarding alpha would turn the reference
side into `#0000004d` and leave ours at `#0b101e` — still a delta, still false.
The comparison has to agree on what "the surface fill behind this run" means when
the scrim is a gradient layer on one side and an element on the other, and the
honest answer for a run over a photograph may be "not a flat colour".

## Confirmed landed from this ticket, on this bundle

- **Issue 1** (`renderer-stretches-flow-placed-run-to-container-width`): no run is
  stretched here — every `box` in `values-diff.json`'s `objects[]` matches to a
  sixteenth of a pixel on all 11 paired elements.
- **Issue 2** (negative-margin sibling repair / the structural verdict): this
  round's `structural-failure` verdict is BUG-153 item 3's two footer escapes, and
  re-run on HEAD `1c l1-gate --ref storage/references/faelan.com/index --json`
  returns `pass: true` with **0 findings** on all three probes. Not this ticket's
  issue 2, and no longer failing.
- **Issue 5** (geometry rounded to whole pixels): gone —
  `450x599.656`, `260x259.125`, `320x205.703` all carry their fractions on both
  sides now.
