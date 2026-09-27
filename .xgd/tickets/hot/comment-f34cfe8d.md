---
uid: comment-f34cfe8d
id: COMMENT-4046
type: comment
title: Comment on request REQ-332
created_by: xgd
created_at: '2026-09-27T01:19:20.891250+00:00'
updated_at: '2026-09-27T01:19:20.891250+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-a7b4cce9
  kind: note
---

`repro-console:repro-joyfulculinarycreations-com#3` — iteration 3 re-measurement of this ticket's four issues on the same bundle, re-captured.

Bundle `/Users/martin/lagrangefoundry/1stcontact/storage/references/joyfulculinarycreations.com/index`,
now `capturedAt 2026-09-27T00:47:21.132Z`, `captureSchema 7` (iteration 1 measured schema 6 at
`2026-09-26T19:06:28.966Z`). Artifacts:
`/Users/martin/lagrangefoundry/1stcontact/storage/tmp/repro-console/repro-joyfulculinarycreations-com/iteration-3/`.
Gate is still `structural-failure`, but for a different reason (see issue 1).

## Issues 1, 3 and 4 are CONFIRMED LANDED

**Issue 1 — bands folding to `box-N`.** Gone. Every id in the reproduction's L1 is now one of
`section-bg` ×4, `section-band` ×3, `backdrop` ×11, `card` ×13, `image` ×5, and

```
python3 -c "…; print([i for i in ids if i.startswith('box-')])"   →   []
```

The overlap count moved with it: **1172 → 27**. `gate.json` `layout.findings` is now 400 findings —
367 `escape`, 27 `overlap`, 6 `clip` — and the 27 overlaps are a different shape entirely (the hero's
two heading lines at all 6 widths, plus 10 nav-item collisions that only fire at viewport height
1536). The `structural-failure` verdict this round is carried by the 367 escapes, not by the bands.

**Issue 3 — the (font file → weight, style) pairing.** Fixed. `page.json`
`data.page.l1.resources.fonts` now reads:

```json
[ {"family":"Lato","src":"/assets/lato-s6u9w4bmutphh7usswipgq.woff2","weight":300,"style":"normal"},
  {"family":"Lato","src":"/assets/lato-s6uyw4bmutphjx4wxg.woff2","weight":400,"style":"normal"},
  {"family":"Lato","src":"/assets/lato-s6u9w4bmutphh6uvswipgq.woff2","weight":700,"style":"normal"},
  {"family":"Oswald","src":"/assets/oswald-tk3iwkuhhaijg752gt8g.woff2","weight":[200,700],"style":"normal"},
  {"family":"Raleway","src":"/assets/raleway-1ptug8zys_skggpnyc0itw.woff2","weight":[100,900],"style":"normal"},
  {"family":"Karla","src":"/assets/karla-qkbvxvyc6trat7rqht6e4q.woff2","weight":[200,800],"style":"italic"},
  {"family":"Karla","src":"/assets/karla-qkbbxvyc6trat7rvltw.woff2","weight":[200,800],"style":"normal"} ]
```

— seven faces, variable ranges preserved, and **Karla's italic file declared italic and its normal
file declared normal**, which is exactly what this issue said was destroyed. The corroboration is in
the deltas: `values-diff.json` is down from 122 to **14**, and not one of the 14 is a typography axis.
`renderedTextBox` **widths** now agree to 4dp on runs in all four families (e.g. "In-home weekly,
bi-weekly or monthly service" is `134.796875` on both sides, Karla 500).

**Issue 4 — `l1FilterSchema` cannot express a filter chain's function order.** Fixed. `page.json`
node `backdrop-1`:

```json
"filter": { "saturate": 1.06, "brightness": 0.67, "contrast": 0.88,
            "order": ["brightness", "contrast", "saturate"] }
```

and the bundle's own mirrored stylesheet declares
`filter:brightness( 67% ) contrast( 88% ) saturate( 106% ) blur( 0px ) hue-rotate( 0deg )`
(`assets/post-4401.css`, `.elementor-element-8d3c33b .elementor-background-overlay`) — same three
functions, same order.

## Issue 2 is HALF landed and still open, and the half that landed has a new cost

**The `clip` axis now exists.** `page.json` node `0.16` (the carousel slide container) carries
`"clip": true`, which it could not express when this ticket was filed.

**The horizontal overflow is unchanged.** The served document is still wider than the viewport:

- `diff/actual.png` is **1720 × 4743** against a 1280 viewport — 439.75px of overflow (iteration 1
  measured 419.75px, so it has grown slightly with the re-capture);
- `values-diff.json` still carries the HIGH `overflow` delta
  `{"text":"I cannot say enough good things about our meal. Sarah Joy…","property":"overflow","expected":"≤1280w","actual":"1700w","magnitude":420,"severity":3080.9976247030877}`;
- `gate.json` `layout.findings` still has **6 `clip`** findings, four of them of the form
  `leaf right edge 1905px exceeds viewport 1024px` / `1700px exceeds viewport 1280px` /
  `1780px exceeds viewport 1440px`, all on path `0.16.1`.

The reason `clip: true` did not close it is visible in the geometry: the clip is on the **slide**, and
the slide itself is placed outside the viewport. `page.json` `0.16` at 1280 is
`{"x":1006.75,"y":3082.33,"width":713,"height":332.2}` — right edge **1719.75**. Clipping a box's
children does not stop the box from extending the document's scroll width. What is still missing is
the thing this issue named: an `overflow` on the **track**, so the off-viewport slides are clipped by
their container rather than merely clipping themselves.

**And the new clip axis has a side effect worth knowing about.** Inside that same clipping container
the fold has parented `image-2` (`/assets/10.jpg`) at `{"at":1280,"x":-332.03,"y":-1423.86,"width":162.06,"height":162.06}`
— an absolute position of `(674.72, 1658.47)`, which is correct and is nowhere near the carousel. It
is wholly outside the clip rect, so it now paints **nothing**: `diff/actual.png` over
(674..836, 1658..1820) has variance `0.0` and reads a uniform `(122, 122, 122)` where the reference
has a photograph (variance `1035.535`). Before `clip: true` that image was merely in the wrong
coordinate space; now it is erased. Filed as **REQ-338 issue 8** (a fold mis-parenting, not a defect
in this ticket's clip work) rather than added here.

## Not re-filed

The round's own gap is **REQ-338** — the fold painting each band two or three times with the least
faithful copy on top, which is 75.6% of this page's pixel disagreement and 98.7% of its ranked region
score. Three instrument defects went to **BUG-161**.
