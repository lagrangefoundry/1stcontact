---
uid: comment-6e988a95
id: COMMENT-4483
type: comment
title: Comment on request REQ-265
created_by: xgd
created_at: '2026-09-29T21:00:26.299942+00:00'
updated_at: '2026-09-29T21:00:26.299942+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-47ab4ddc
  kind: note
---

`repro-console:repro-joyfulculinarycreations-com#4` — iteration 4 re-measurement on a **re-captured** bundle, with what the class is worth in page pixels rather than in ranked score.

Bundle: `/Users/martin/lagrangefoundry/1stcontact/storage/references/joyfulculinarycreations.com/index`,
now `capturedAt 2026-09-29T19:46:13.536Z`, `captureSchema 8` — a different capture from the one
`COMMENT-4021` measured (2026-09-26T22:09:36.409Z, schema 7). **Both instances survive the re-capture
byte for byte**, which rules out the stale-bundle reading: this is live.

## The two numbers, unchanged

`diff/expected-manifest.json` vs `diff/actual-manifest.json`:

| run | ref `box` | ours `box` | ref `renderedTextBox` y | ours | error |
|---|---|---|---|---|---|
| `Dreaming of healthier meals` | `(20, 311.296875) 815.203125×97` | same x/y, **h 75.40625** | **311.296875** | **300.296875** | −11 |
| `on your dinner table?` | `(20, 386.703125) 631.21875×97` | same x/y, **h 75.40625** | **386.703125** | **375.6875** | −11.015625 |
| `What people are saying` | `(265, 2969.515625) 750×92.8125` | same x/y, **h 46.40625** | **3008.921875** | **2962.515625** | **−46.40625** |

`lineHeightPx` agrees on both sides in all three (75.4, 75.4, 46.4) and so does `renderedTextBox`
*height* (97, 97, 60) — only the box the glyphs sit in differs. `92.8125 = 2 × 46.40625` is the leading
`<br>` in `raw.html`'s `<h2 class="elementor-heading-title elementor-size-medium"><br>What people are saying </h2>`;
`(97 − 75.40625) / 2 = 10.797` is the half-leading on the `<h1><br><br>Dreaming … <br>on your dinner table?</h1>`.

`values-diff.json` still carries all three as CRITICAL `position` deltas
(`severity 4030.978905735003`, `4030.9167750325096`, `4030.9166666666665`) — 3 of this round's 20.

## New: what it is worth in page pixels

Previous rounds quoted the ranked region score. Measured directly against the two screenshots, this
class is **30.55% of the page's total absolute difference mass** — more than any other single cause on
this page:

| band | share of page diff mass | mean |
|---|---|---|
| y 324–389 (`Dreaming of healthier meals`) | **15.65%** | 44.4 |
| y 400–465 (`on your dinner table?`) | **11.76%** | 33.4 |
| y 2978–3011 + y 3025–3057 (`What people are saying`, both edges of the 46.4px shift) | **3.14%** | 10.3 / 7.5 |

and it takes **4 of the 12 ranked regions** — #1 `bbox {16,320,640,144}` `score 21567.59`,
#5 `{672,320,160,80}` `3495.09`, #8 `{304,320,64,48}` `827.18` (the hero pair), and #6/#10/#11 around
`What people are saying` (`1030.16 + 493.93 + 428.29`). That is **27810.24 of the 67497.33 ranked total
= 41.2%**.

Region #1's `nodes` say it plainly without opening a crop: `ref[0]` is
`Dreaming of healthier meals` at 61% of the region, `actual[0]` is **`on your dinner table?`** at 52%
— the same two runs on both sides, the reproduction's one line higher.

## And it is 12 of the 27 gate overlaps

`gate.json` `layout.findings`, `kind: "overlap"`: 12 of 27 are
`'Dreaming of healthier meals' overlaps 'on your dinner table?'`, at every sampled viewport, e.g.

```json
{ "kind": "overlap", "width": 320, "height": 768, "paths": ["0.21.2", "0.21.3"],
  "boxes": [ {"x":20,"y":86.16,"width":234.16,"height":64.078125},
             {"x":20,"y":142.31,"width":233.08,"height":36} ] }
```

`86.16 + 64.08 = 150.24 > 142.31` — a 7.9px overprint. The reference's two lines are 75.4px apart and
do not touch; the reproduction's boxes are one line-height shorter than the glyphs they hold, so the
ink of the first sits inside the box of the second. **A shorter box is not a cosmetic error here — it
makes the reproduction fail its own containment probe.**

Nothing new about the mechanism or the proposed fix; `COMMENT-4021` §3 already bounds it (a top-only
correction fixes the hero and leaves `What people are saying` 46.4px wrong, because the fold has to
carry the captured box **height**). Census re-run on this bundle: `page.json` has `text × 73` and
**0 text keyframes carrying `height`**, exactly as before.
