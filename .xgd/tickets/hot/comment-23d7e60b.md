---
uid: comment-23d7e60b
id: COMMENT-4043
type: comment
title: Comment on request REQ-331
created_by: xgd
created_at: '2026-09-27T00:59:34.240825+00:00'
updated_at: '2026-09-27T00:59:34.240825+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-20156646
  kind: note
---

`repro-console:repro-faelan-com#3` — iteration 3 re-measurement of this ticket's
issue 5 (`l1-shadow-carries-one-layer-only`) and issue 6
(`values-diff-has-no-box-shadow-value-axis`), on the same bundle this ticket was
filed from, `storage/references/faelan.com/index`, re-captured
`2026-09-27T00:09:50.010Z` (`captureSchema: 7`).

**Issue 5's fix landed for `boxShadow` and NOT for `textShadow`, and this bundle's
own wordmark is the case that needs the other half.**

## What landed

`l1BoxShadowSchema` is now the union this ticket asked for
(`packages/site-schema/src/l1/schema.ts:499`):

```ts
export const l1BoxShadowSchema = z.union([l1ShadowSchema, z.array(l1ShadowSchema).min(2).max(4)])
```

with the doc comment above it (479-498) citing this ticket and these three
photographs by name. Confirmed in output — HEAD's fold over this bundle gives all
three collage images a two-layer stack **with their alpha**, which is issue 4
landed as well:

```
image-1 Ghostship          boxShadow=[{"offsetXPx":0,"offsetYPx":15,"blurPx":50,"color":"#00000099"},
                                     {"offsetXPx":0,"offsetYPx":0, "blurPx":30,"color":"#ffffff26"}]
image-2 Faelan with violin  same shape
image-3 Alley scene         same shape
image-0 Faelan             boxShadow=[{... 20/60 "#000000099"->"#00000099"},{... 0/40 "#ffffff33"}]
```

## What did not land — `textShadow` is still one layer

`packages/site-schema/src/l1/schema.ts:1718`, unchanged:

```ts
    /** A glow / drop shadow on the glyphs. */
    textShadow: l1ShadowSchema.optional(),
```

`l1ShadowSchema`, not `l1BoxShadowSchema`. So the same defect this ticket
described for box shadows is still true of text shadows, and **the `FAELAN`
wordmark on this bundle paints two of them**:

`.../index/assets/index.BM9-dqc-.css`:

```
.header-text[data-astro-cid-j7pv25f6] h1[data-astro-cid-j7pv25f6] {
  font-size:4rem;font-weight:900;color:#fff;
  text-shadow:4px 4px 20px rgba(0,0,0,.9),0 0 40px rgba(255,255,255,.3);
  margin:0;letter-spacing:2px }
```

**The capture carries both layers in full** — `capture.json`
`/sections/0/content/0/textShadow`:

```
"rgba(0, 0, 0, 0.9) 4px 4px 20px, rgba(255, 255, 255, 0.3) 0px 0px 40px"
```

(and `multistate.json`'s projection agrees, verbatim.) **The L1 document carries
one**, `page.json`, the `FAELAN` text node:

```json
"textShadow":{"offsetXPx":4,"offsetYPx":4,"blurPx":20,"color":"#000000e6"}
```

— the dark drop, with its 0.9 alpha kept (issue 4's helper doing its job), and the
40px white glow at 30% simply gone. The served document confirms it:

```
$ grep -o "text-shadow:[^;}]*" .../iteration-3/site/home.html | sort -u
text-shadow: 2px 2px 10px #000000e6
text-shadow: 4px 4px 20px #000000e6
```

**And the validator is the class-2 proof.** Grafting the two layers the capture
recorded onto HEAD's own fold output:

```
folded textShadow: {"offsetXPx":4,"offsetYPx":4,"blurPx":20,"color":"#000000e6"}
validateL1 with the two layers the capture recorded:
  {"ok":false,"errors":[{"path":"/root/children/0/children/0/axes/textShadow",
                         "message":"Invalid input: expected object, received array"}]}
```

There is no way to author it. `defect_class: l1-cannot-express` — **ceiling**,
same as issue 5.

What is lost to the eye is the separation: a 40px white glow at 30% around a 64px
900-weight wordmark sitting on a photograph is what lifts it off the picture, and
the reproduction has only the dark drop behind it.

## Issue 6's twin: `textShadow` is compared by PRESENCE, so this is worth 0 deltas

`values-diff.ts:2728` routes it through `compareTreatment`:

```ts
    compareTreatment(exp, act, 'textShadow', exp.textShadow, act.textShadow)
```

whose contract (2723-2726) is *"Like box-shadow, compare **presence**: a missing
glow or a rounded-vs-masked edge is pixel-obvious, while exact value strings
(blur radii, mask gradients) drift across engines and would be noise."* Both sides
paint a text shadow, so presence agrees and the delta count is 0 — a two-layer
glow and a one-layer glow are the same measurement. That is exactly issue 6's
shape one axis over, and **fixing it will add a delta on this bundle**, which is
the outcome, not a regression.

The suggested fix is issue 6's: parse both sides into layers and compare layer
count first, then each layer's offsets/blur/colour. The layer count alone would
have caught this.

## Proposed change for issue 5's remaining half

`textShadow: l1BoxShadowSchema.optional()` at schema.ts:1718 — the union already
exists, the envelope walk in `validate.ts` already iterates shadow lengths, and
the renderer's text-shadow emitter needs the same `join(', ')` the box-shadow one
already has. The fold's `foldShadows` already returns a layer list (it produces
the two-layer `boxShadow` arrays quoted above), so the fold side may need nothing
but the axis widening.

## How to see it

```
grep -o "text-shadow:[^;}]*" storage/references/faelan.com/index/assets/index.BM9-dqc-.css
#   text-shadow:4px 4px 20px rgba(0,0,0,.9),0 0 40px rgba(255,255,255,.3)
python3 -c "import json; c=json.load(open('storage/references/faelan.com/index/capture.json')); \
print(c['sections'][0]['content'][0]['textShadow'])"
#   rgba(0, 0, 0, 0.9) 4px 4px 20px, rgba(255, 255, 255, 0.3) 0px 0px 40px
grep -o "text-shadow:[^;}]*" storage/tmp/repro-console/repro-faelan-com/iteration-3/site/home.html | sort -u
#   wrong (today): text-shadow: 4px 4px 20px #000000e6   (one layer)
#   right:         text-shadow: 4px 4px 20px #000000e6, 0 0 40px #ffffff4d
```

## Also confirmed landed from this ticket on this bundle

Issues 1 (rejoin — the `Artist • Musician • Creator` sentence is one text node
with three runs and a link on the middle one), 2 (`stacked: true` on all four
photographs), 3 (the mask is emitted, and now matches the source stylesheet
declaration for declaration) and 4 (shadow alpha) are all confirmed present in
this round's `page.json`.
