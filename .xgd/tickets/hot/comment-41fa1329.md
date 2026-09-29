---
uid: comment-41fa1329
id: COMMENT-4307
type: comment
title: Comment on request REQ-333
created_by: xgd
created_at: '2026-09-29T04:04:51.829622+00:00'
updated_at: '2026-09-29T04:04:51.829622+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-d3eb602b
  kind: note
---

repro-console:repro-faelan-com#4

Re-measured on this ticket's own bundle, `storage/references/faelan.com/index`,
iteration 4.

**Issue 2 (`.photo-circle`'s 50% clip, 4px ring and two shadows lost to leaf
attribution) has landed for the *properties* and left the *box* behind.**
`frameOf` now finds the wrapper and hands back its ring — `capture.json` →
`sections[0].fields[0]` carries `borderWidthPx 4`, `borderColor "#ffffff4d"`,
`borderStyle "solid"`, `borderRadiusPx 108` and the two-layer `boxShadow`, and
`page.json`/`home.html` paint a circular, ringed, shadowed photo. That half is
done.

What it is attributed to is still the `<img>`'s content box:

```js
// extract.ts:2484-2488
var fieldBox = layoutBoxOf(el, fieldTf);        // the <img>: (932, 68) 216×216
var frame    = isImg ? frameOf(el, fieldBox) : null;   // the wrapper's ring
```

The wrapper is `width:224px;height:224px;border:4px` under a global
`box-sizing:border-box` (both in `assets/index.BM9-dqc-.css`), so its border box
is `(928, 64) 224×224` — and `grep -c '\b224\b' capture.json` returns **0**. The
recorded `borderRadiusPx: 108` is 50% of 216, where the source's `border-radius:50%`
of 224 is 112; the recorded `clip` 234.0037 = 216 × 1.08335 is the rotated AABB of
the 216 box, not of the 224 one (242.67).

Painted consequence, measured at the circle's centre row `y = 176` on
`screenshot.full.png` vs `iteration-4/diff/actual.png`:

| | ring left | ring right | ring outer | photo |
|---|---|---|---|---|
| reference | 928–931 | 1148–1151 | 224px | 216px |
| reproduction | 932–935 | 1144–1147 | 216px | 208px |

`object-fit: cover` then reframes the 1.25:1 source into 208×208 instead of
216×216, so the whole circle's contents are 4px right, 4px down and 3.8%
differently scaled. That is ranked regions #2, #3, #7, #8, #9, #10 and #11 —
3661.81 of 10203.76 = **35.9%** of this iteration's ranked region score — at
**zero value deltas**, because both manifests report the identical box
`(932.0000431436988, 68.00002559466203) 215.99991371260234 × 215.999964069465`
and the identical `border: 4px solid #ffffff4d`.

Filed as **REQ-347 issue 2** rather than reopened here, since this ticket is
frozen in a pipeline. It needs the same `[recapture]` this ticket's issues 1 and 2
did.

Also confirmed landed on this bundle: issue 3 (the mask feather) — `home.html`
emits `mask-image: radial-gradient(ellipse 92% 92% at 50% 50%, #000 72%,
transparent 100%)`, character-for-character the source gradient, and likewise
90%/70% and 95%/75% on the other two photographs.
