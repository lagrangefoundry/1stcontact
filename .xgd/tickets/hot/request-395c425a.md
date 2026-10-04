---
uid: request-395c425a
id: REQ-381
type: request
title: 'capture: a carousel''s clip is recorded at the slide, not the swiper that
  cuts it; fold drops a band''s height response when its bottom is not a section edge'
created_by: repro-console:repro-joyfulculinarycreations-com#8
created_at: '2026-10-04T15:03:19.208056+00:00'
updated_at: '2026-10-04T15:26:09.595030+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  defect_class:
  - capture-loses-it
  - fold-wrong
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-068553ef
---

# capture: a carousel's clip is recorded at the slide, not at the swiper that cuts it — plus a band whose bottom is not a section edge loses its height response

Filed by `repro-console:repro-joyfulculinarycreations-com#8`, iteration 8 of the reproduction of
https://joyfulculinarycreations.com (sandbox `repro-joyfulculinarycreations-com`).

- reference bundle: `/Users/martin/lagrangefoundry/1stcontact/storage/references/joyfulculinarycreations.com/index`
  (`capturedAt 2026-10-04T12:31:56.595Z`, `captureSchema 17`). One commit since
  (`302d79e26b feat(chat): a running build shows a heartbeat status line`) — touches nothing below.
  **Not a stale-bundle round.**
- artifacts: `/Users/martin/lagrangefoundry/1stcontact/storage/tmp/repro-console/repro-joyfulculinarycreations-com/iteration-8/`
- `gate.json`: `verdict "structural-failure"`, `l1Pass false`, perceptual mean 2.84/255, 2.32% over
  threshold, 12 regions (ranked total 29384.07); `values.deltas` 19; unmeasured 1;
  `layout.findings` 194 = 10 clip + 184 escape.
- Evidence from **this one bundle only**.
- Every command below runs from the repo root. If `1c` is not on PATH it is `bin/1c` (verified this round:
  the `page get` command under issue 2 printed exactly the "wrong" output quoted there).

## Where the 194 layout findings come from (counted from `gate.json` `layout.findings[].paths` + detail)

| cause | clip | escape on-sample | escape off-sample | escape contentRobustness | total |
|---|---|---|---|---|---|
| issue 1 — carousel slides `0.81`/`0.82`/`0.85` | 10 | 16 | 28 | 16 | **70** |
| issue 2 — `section-band-2` children `0.51.0`/`0.51.1` | 0 | 7 | 11 | 14 | **32** |
| REQ-337/BUG-160 class (card-3, backdrop-2..9, copy grown 2.5x) | 0 | 0 | 0 | 92 | 92 |

**Every on-sample finding — i.e. the whole structural-failure verdict — is issue 1 or issue 2.**

---

## Issue 1 — `capture-records-the-nearest-overflow-box-not-the-one-that-cuts` (lead)

**defect_class: `capture-loses-it`** — the capture's `clip` names the slide (which contains its copy
and cuts nothing); the swiper that actually cuts the slide is never recorded on the slide's runs, so
the fold's `nestClipRegions` correctly concludes nothing escapes and builds no container.

### Class test
1. Can L1 express it? Yes — `clip: true` containers exist and this very page has one: `page.json`
   node `0.50.0.4` is `{"kind":"container","clip":true,...}` built for the carousel's two arrow glyphs.
2. Is the L1 value right? No — the slides `0.81` ("“So fabulous…"), `0.82` ("I cannot say enough…"),
   `0.85` ("Gray R.") are **root children**, not inside any clip container; `0.81` at 768 is
   `x: -643.8`. → engine shortfall; question is which side.
3. The capture: `multistate.json`, projection 1280x800 —
   - "“So fabulous…" `box {x:-419.25, w:673}` `clip {"id":"1.2.5.0.0.0.0.0.0.0.1.0.0.0.0.0", x:-439.25, w:713}`
   - "I cannot say enough…" `box {x:1026.75, w:673}` `clip {"id":"1.2.5.0.0.0.0.0.0.0.1.0.0.0.0.2", x:1006.75, w:713}`
   - arrows ``/`` `clip {"id":"1.2.5.0.0.0.0.0.0.0.1.0.0.0", x:283.75, w:712.5}`
   Resolving those paths in the bundle's `rendered.html`: `…1.0.0.0.0.0` = `div.swiper-slide.swiper-slide-duplicate.swiper-slide-prev`,
   `…1.0.0.0.0.2` = `div.swiper-slide.swiper-slide-next`, and the arrows' `…1.0.0.0` = their ancestor
   `div.elementor-main-swiper.swiper` — the slides' grandparent (slide → `.swiper-wrapper` → `.swiper`).
   The mirrored stylesheet declares both: `.swiper-slide{…overflow:hidden…}` and `.swiper{…overflow:hidden…}`.

So each slide's text sits **inside** its own recorded clip box (−419.25 ≥ −439.25; 1026.75+673 ≤ 1006.75+713),
the slides carry two **different** ids, and `nestClipRegions` (fold.ts:3346) — grouping by id then
requiring a member to escape its box (fold.ts:3426-3437) — rightly builds nothing. The ancestor that
cuts them (`.swiper`, x 283.75..996.25 at 1280) is in the bundle, but only on runs with no nearer
`overflow` box.

### Cause
`tools/generate/src/cli/capture/extract.ts:841` `clipOf(el)` returns the **first** ancestor-or-self with
`overflow !== visible`. Elementor/Swiper put `overflow:hidden` on every slide, so for every slide run
the first hit is the slide itself.

### Evidence (deltas and pixels)
- `values-diff.json`: HIGH `overflow` on "I cannot say enough…" expected `≤1280w`, actual `1700w`;
  LOW `surfaceFill` ×2 on "“So fabulous…" / "I cannot say enough…" expected `#28542d`, actual `#ffffff`
  (the runs have slid off `section-band-1` and read the page fill).
- `gate.json` on-sample: `at 1280px×768px: leaf right edge 1700px exceeds viewport 1280px` (path `0.82`),
  `at 1440px×768px: leaf right edge 1462px exceeds viewport 1440px` (path `0.85`), and the
  `section-band-1 — 419px left of its left edge` escapes.
- No ranked region covers it: the slides paint off-canvas in a 1280 screenshot, so the pixel score is blind here.

### History
This is REQ-332 issue 2 coming back by a different route. Iteration 1 (REQ-332's own text) measured "one
group of two" — the clip id was then a sequence number. REQ-338 issue 8 replaced it with `nodePathOf`,
which is correct for identity but exposes that the recorded ancestor was always the *nearest*, and the
nearest is per-slide. REQ-332 is still at `ready_to_reconcile`.

### Proposed change
In `clipOf`, record the nearest ancestor that **actually cuts** the element: walk up while the
candidate's box contains the element's box on the clipped axis (within epsilon), and return the first
`overflow` box the element escapes; if none cuts, keep returning the nearest (so the existing
"self counts"/no-op behaviour holds for content that fits). Alternative: record the whole chain of
`overflow` boxes and let `nestClipRegions` pick the cutting one. Either way the two slides (and
"Gray R.", "Nancy S.") end up with id `…1.0.0.0` — the same id the arrows already have — and
`nestClipRegions` builds one container for slides + arrows. **Capture-side: needs a re-capture after it lands.**

### How to see it / how to know it is fixed
```
python3 -c "
import json
m=json.load(open('storage/references/joyfulculinarycreations.com/index/multistate.json'))
for p in m['projections']:
  if p['viewport']=={'width':1280,'height':800}:
    for e in p['manifest']['elements']:
      t=e.get('text') or ''
      if t[:6] in ('“So fa','I cann','','') or t.startswith('“So f'): print(repr(t[:14]), e['box']['x'], e['clip'])
"
```
Wrong (now): the slides' `clip.id` end in `…1.0.0.0.0.0` / `…1.0.0.0.0.2`, the arrows' in `…1.0.0.0`.
Right: all four share `1.2.5.0.0.0.0.0.0.0.1.0.0.0` with box `x 283.75 w 712.5`.
Then, after a re-capture and `1c refold repro-joyfulculinarycreations-com`:
```
1c l1-gate repro-joyfulculinarycreations-com --ref storage/references/joyfulculinarycreations.com/index --sandbox
```
Wrong: `clip` findings `leaf right edge 1700px exceeds viewport 1280px` and `section-band-1 — 419px left`
escapes. Right: no clip finding on `0.81`/`0.82`/`0.85`; in `1c page get repro-joyfulculinarycreations-com home --sandbox --json`
the slide runs are children of the `clip: true` container. The HIGH `overflow` delta and the two
`#28542d`→`#ffffff` surfaceFill deltas go with it.

---

## Issue 2 — `fold-drops-a-band-s-height-response-when-its-bottom-is-not-a-section-edge`

**defect_class: `fold-wrong`** — the capture measured the band's top edge as travelling 1:1 with viewport
height and L1 can carry `yFactor` per keyframe; `buildSolidBands` writes none because its *bottom* edge
was not measured.

### Class test
1. L1 can express it: `section-band-1` in the same document carries
   `"viewportResponse": {"yFactor": 1}` at 1024/1280/1440.
2. Is the value right? `page.json` `section-band-2` (root child `0.51`): keyframes at 1024
   `{y:3129, height:256.69, atHeight:768}`, 1280 `{y:3490, height:262.94, atHeight:800}`, 1440
   `{y:3590, height:262.94, atHeight:900}` — **no `viewportResponse` at any width**. Its children carry
   `viewportResponse {yFactor: 1}` (e.g. "How it works" `{at:1024, y:99.91}`), which `rebaseInto`
   (rebase.ts:118-143) composes only against a parent response — there is none, so the child keeps
   a document-level factor relative to a band that does not move.
   Reference: `multistate.json` section `#7a7a7a` at 1024 is `y 3128.91` at height 768 and `y 3328.91` at
   height 968; at 1280, `y 3489.53` at 800 and `y 3689.53` at 1000 → the band moves 1:1 (yFactor 1).
   → **class 1, fold-wrong.**

### Cause
`fold.ts:2909-2918` (`buildSolidBands`): the response is written only when **both**
`edges.get(Math.round(top))` and `edges.get(Math.round(bottom))` are defined. `sectionEdgeResponses`
(fold.ts:480) keys only real section edges. `section-band-2`'s top 3129 is an edge (3128.906) but its
bottom 3129+256.69 = 3385.69 at 1024 (3752.94 at 1280) is not — the reference section runs to 3934.03 —
so the known top factor is discarded with the unknown bottom. `section-band-1` closes on a real edge
(2659+455 = 3114 ≈ 3113.906) and gets its response, which is why the two bands disagree.

### Arithmetic (gate.json on-sample, closes to the px)
- 1440x768: Δh = 768−900 = −132; child `y 99.53 − 132 = −32.47` → `'How it works' … 32px above its top edge`.
- 1440x1536: Δh = 636; `99.53 + 636 + 46.4 (run height) − 262.94 = 519` → `519px below its bottom edge`.
- 1280x1536: Δh = 736 → `619px below`; 1024x1536: Δh = 768 → `651px below`.

### Proposed change
When only the top edge is measured, write `yFactor = fTop` and omit `heightFactor` (a band whose bottom
response is unknown is best described as translating with its top), rather than writing nothing.
Same change wherever the same both-or-nothing pattern exists. Separately note: this band is 256.69px
where the reference `#7a7a7a` section is 805.125px at 1024 — band slicing by fill group, the
REQ-380 class (`buildSolidBands` grouping); not re-filed here.

### How to see it / how to know it is fixed
```
1c refold repro-joyfulculinarycreations-com
1c page get repro-joyfulculinarycreations-com home --sandbox --json | python3 -c "
import json,sys; r=json.load(sys.stdin)['data']['page']['l1']['root']
b=[c for c in r['children'] if c.get('id')=='section-band-2'][0]
print([(k['at'],k.get('viewportResponse')) for k in b['geometry']['keyframes']])"
1c l1-gate repro-joyfulculinarycreations-com --ref storage/references/joyfulculinarycreations.com/index --sandbox
```
Wrong: `[(320,None),…,(1024,None),(1280,None),(1440,None)]` and the 7 on-sample `section-band-2`
escapes. Right: `{'yFactor': 1}` at 1024/1280/1440 on the band, the children's response composed to
nothing, and no `section-band-2` escape at any height.

---

## Issue 3 — `fold-emits-no-action-for-a-non-form-button` (low)

**defect_class: `fold-wrong`** (provisional — see below).

`values-diff.json`: HIGH `a11yRole` ×2 on `` / `` expected `button`, actual `generic` — the
carousel's prev/next arrows (`multistate.json` 1280x800: `a11yRole "button"`, `pseudo "before"`,
`fontFamily "eicons"`). The fold records `a11yRole === 'button'` only as a submit candidate (fold.ts:4196)
and the renderer emits `<button>` only when a node carries `action` (render.ts:4505, 4556).
`l1ActionSchema` (packages/site-schema/src/l1/schema.ts:1297) is a strict object whose `opens`/`closes`
are both optional, so `action: {}` reads as authorable — **I did not run `validateL1` on it**. If
`validateL1` refuses an empty action, this item is `l1-cannot-express` (no button without a dialog
target) instead. Fix after issue 1, since issue 1 changes which container the arrows live in.

How to see it: `CHROMIUM_LAUNCH_ARGS=--single-process 1c values-diff repro-joyfulculinarycreations-com --ref storage/references/joyfulculinarycreations.com/index --sandbox`
— wrong: two `a11yRole button → generic` rows; right: none.

---

## Not filed here (known classes, re-measured)
- **Hero heading −11px and "What people are saying" −46.41px** — REQ-265 class: regions #1/#2/#4 =
  25889.86 of 29384.07 (88.1%) and regions #3/#6/#7/#10/#11/#12 = 2410.37 (8.2%). Comment added to REQ-265.
- **3 position + 3 size deltas on pseudo-glyph icons** (`(255,3747)→(250,3747)`, `40×40→50×40`, etc.) —
  BUG-190's host-box vs glyph-advance asymmetry; no ranked region lies within y 3700-4100.
- **92 contentRobustness escapes** on card-3/backdrop-N — REQ-337/BUG-160.
- **5 `#535b53→#626862` surfaceFill deltas** — composited-scrim surfaceFill asymmetry (REQ-302 issue 4 class);
  not separately verified this round.


---

## Free-coding scope (REQ-381 session)

**In scope: issues 1 and 2.** Issue 3 is out of scope. `l1ActionSchema`'s contract says a node naming neither
`opens` nor `closes` is rejected by `L1_STRUCTURAL_RULES`, so `action: {}` cannot carry a plain button. That
puts it in the `l1-cannot-express` class, which needs a schema decision, not a fold fix.

### Issue 1: what changes (capture, `extract.ts` `clipOf`)
- `clipOf` records the nearest `overflow` ancestor (self included) that **actually cuts** the element. It walks up,
  skipping every overflow box that wholly contains the element's border box (within 1px) on each axis that box clips
  (an axis whose computed overflow is `visible` cuts nothing on that axis). It returns the first box the element escapes.
- When no overflow ancestor cuts the element, it returns the nearest one, as before (self counts; content that fits is a no-op for the fold).
- An element with an empty box (no area) also keeps the nearest box, because a 0x0 box placed at the origin would read as escaping everything.
- Result: the off-screen slides of a carousel (each slide `overflow:hidden`, inside a `.swiper` that is also `overflow:hidden`)
  record the `.swiper`'s id and box, the same as the arrows, so `nestClipRegions` builds one clipping container for all of them.
- Needs a re-capture to take effect on existing bundles.

### Issue 2: what changes (fold, `fold.ts` `buildSolidBands`)
- When the band's top lands on a measured section edge but its bottom does not, the keyframe carries
  `viewportResponse {yFactor: fTop}` with no `heightFactor`: the band translates with its top. Before this change it carried no response.
- When both edges are measured, behaviour is unchanged. When the top is unmeasured, no response is written, as before.

### Test plan
- `test_UAT_FC_REQ-381_*`: (1) extract a page with a two-level overflow carousel in Chromium and check that the off-screen
  slide's run records the outer clipper's id, while the visible slide keeps its own nearest box; (2) fold a projection pair
  where a band opens on a section edge and closes mid-section, and check that its keyframes carry `yFactor` and no `heightFactor`.