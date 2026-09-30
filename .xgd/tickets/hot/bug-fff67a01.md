---
uid: bug-fff67a01
id: BUG-164
type: bug
title: 'gate: `stacked: true` switches the overlap probe off, so a reproduction whose
  <h1> is completely buried under a photo passes every gate'
created_by: repro-console:repro-faelan-com#4
created_at: '2026-09-29T04:03:03.424338+00:00'
updated_at: '2026-09-30T21:14:49.357861+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  defect_class:
  - instrument-blind
  auto_merge_back: true
  needs_review: false
  priority: medium
---

# Every gate passes a page whose `<h1>` is completely invisible — `stacked: true` switches the overlap probe off, and nothing else asks whether an element was painted

Round: `repro-console:repro-faelan-com#4` · bundle
`/Users/martin/lagrangefoundry/1stcontact/storage/references/faelan.com/index`,
iteration `storage/tmp/repro-console/repro-faelan-com/iteration-4/`.

The reproduction under test paints its 64px `<h1>` "FAELAN" and its whole tagline
*underneath* an opaque collage photograph, so neither is visible at all. The
engine defect is REQ-347. **This ticket is about the fact that every gate said
the page was faithful.** `gate.json`:

```json
"pass": true, "verdict": "pass", "l1Pass": true,
"diagnosis": "The perceptual eye and the structural gate agree the reproduction is faithful.",
"perceptual": { "meanDiff": 2.87, "pctOverThreshold": 1.66, "regions": 11 },
"floor": { "mean": 8, "pct": 25, "valuesTier": "MEDIUM" },
"layout": { "pass": true, "findings": [] },
"coverage": { "findings": [] }
```

Three rulers, three silences, below. The first is a proved regression of the
detector BUG-112 built; the second and third are missing axes.

---

## Item 1 — `stacked: true` exempts the pair, so the detector that exists is switched off by the fold

`probes.ts:1378-1388`:

```ts
for (let i = 0; i < solid.length; i++) {
  for (let j = i + 1; j < solid.length; j++) {
    // BUG-112 — the DECLARED exemption, beside the synthesized-surface one
    // above. ... One side of the pair is enough — an overlap has a figure and a
    // ground, and the declaration is made by whichever node is the composition.
    if (solid[i].stacked || solid[j].stacked) continue
```

REQ-331 made the fold emit `stacked: true` on every collage image (it is on all
four in this bundle's `l1.json` and in `iteration-4/page.json`). One side is
enough, so the pair *(the `<h1>`, the photograph that buries it)* is exempt — and
so is every other text-under-photo pair on any montage page, forever.

### Proved by experiment, on this bundle, offline

```
$ ./bin/1c refold --ref storage/references/faelan.com/index      # 13 nodes, 0 residuals
$ ./bin/1c l1-gate --ref storage/references/faelan.com/index --json
  pass: true          # zero findings at every width

$ cp -R storage/references/faelan.com/index /tmp/faelan-nostack
$ python3 -c "import json;p='/tmp/faelan-nostack/l1.json';d=json.load(open(p));
  [c.pop('stacked',None) for c in d['root']['children'][0]['children']];json.dump(d,open(p,'w'))"
  # stripped stacked from 4 node(s)
$ ./bin/1c l1-gate --ref /tmp/faelan-nostack --json
  pass: false
  offSample 338×768 — 5 findings:
      overlap | FAELAN overlaps image
      overlap | Artist • Musician • Creator overlaps image
      overlap | image overlaps image
      overlap | image overlaps image
      overlap | image overlaps image
  ... identical at every sampled width
```

The detector names the defect in its own words, in the first two findings. Only
the exemption stands between it and the verdict.

### Why the exemption is wrong as written

`stacked: true` says *an overlap here is the design*. It does **not** say **which
layer is on top** — it cannot, because it is documented as **not a paint axis**
and the renderer emits nothing for it (BUG-154's diagnosis, verbatim: *"it is
documented as **not a paint axis** and the renderer emits nothing for it"*). So
the field asserts that a collision is intentional while carrying no statement
about the only thing that makes a collision right or wrong, and the probe then
stops asking.

That is exactly the hole BUG-112 was opened to close, reopened by REQ-331 from the
other side: BUG-112 restored the finding, REQ-331 taught the fold to suppress it.
On this page the net result is the same verdict BUG-112 was filed against —
"a reproduction that paints text over text passes".

### What would fix it

The exemption needs to be about the *pair*, not about one node's flag, and it needs
something to check against. Two workable shapes:

1. Once L1 carries a paint-order field (REQ-347's second half), keep the exemption
   only for pairs whose declared order the render agrees with, and report a pair
   whose order is undeclared or contradicted.
2. Failing that, narrow the exemption to the pairs it was written for — two
   `stacked` nodes, or a `stacked` node against a synthesized backing surface — and
   stop exempting *`stacked` node vs. ordinary text run*, which is the one
   combination that is always a defect if the text is the one underneath.

Option 1 is the real fix; option 2 restores the BUG-112 finding on this page today
with no L1 change.

---

## Item 2 — `values-diff` has no axis for *was it painted*

`values-diff.json` pairs "FAELAN" on both sides and reports:

```
a11yRole heading h1 = heading h1 · fontFamily = · fontSizePx 64 = 64 · fontWeight 900 = 900
color #ffffff = #ffffff · letterSpacingPx 2 = 2 · lineHeightPx 96 = 96
renderedTextBox text 259×76 = text 259×76 · box (102, 64) 268×96 = (102, 64) 268×96
```

Nine of ten parameters identical; the tenth is an unrelated `surfaceFill`
(REQ-302's issue 4). Both manifests are honest — they measure DOM rects and
computed style, and our `<h1>` genuinely has that box and that colour. It is
simply not on the screen.

Every axis in the comparator is a *declared* property. There is no axis that asks
whether the element contributed any ink, so a run that is 100% occluded is
indistinguishable from a run that is perfect. This is also why `unmeasured` is 0
while the largest piece of type on the page is unmeasured in the only sense that
matters.

The manifests already carry enough to derive it cheaply: each element has a `box`,
a `zIndex` and a paint order, and `isBandPaint` already exists for the related
"this box is a band's paint" judgement. A `painted`/`occludedPct` axis — the
fraction of an element's box covered by a later-painting opaque sibling — would
have fired at 100% here on four runs.

## Item 3 — the perceptual floor has no notion of *what* was lost

The whole hero headline and tagline disappearing costs mean **2.87** against a
floor of **8**, and **1.66%** of pixels against a floor of **25%**. That is not a
tuning complaint: 6541.95 of the 10203.76 ranked region score is those four runs
(64.1%), region #1 is mean **80.74/255**, and the ranker put it at the top —
`regions.json` had the answer and the floor overrode it.

A whole-page mean cannot see this, and should not be asked to. What is missing is
a rule with a shape like: *a ranked region whose mean is above N and which covers
a text element that pairs cleanly in `values-diff` is a breach regardless of the
page mean* — the cross-gate disagreement (top-ranked region, zero deltas under it)
is itself the signal, and the `diagnosis` field currently reports the opposite
("no cross-gate disagreement to explain").

---

## Defect class

`instrument-blind` — the rulers reported pass while measuring nothing about the
thing that was wrong. Defended by the experiment in item 1: the same document, the
same command, `pass: true` with `stacked` present and `pass: false` naming "FAELAN
overlaps image" with it removed — the measurement was suppressed, not made and
passed. Items 2 and 3 are the same class reached from the comparator and the
perceptual side: 9-of-10 parameters equal and a page mean of 2.87 on an element
with zero painted pixels.

## Related

- BUG-112 — the finding this restores a hole in.
- BUG-154 — the diagnosis that establishes `stacked` is not a paint axis.
- REQ-347 — the engine defect that made it visible this round; its second half
  (a real L1 paint-order field) is what item 1's option 1 needs.

---

## Scope of the free-coded fix (this session)

**Item 1 is fixed with option 1; items 2 and 3 are not in this change** (see
"Deferred" below). REQ-347 has landed since this ticket was filed: L1 now carries
`paintOrder`, the fold writes it from the captured `zIndex`, and the renderer
emits it as `z-index` on nodes that are all positioned. So the declared order
that option 1 needs now exists.

### What changes (user-visible behaviour)

1. **The envelope evaluator models paint order.** Each evaluated leaf gets a
   paint key that follows the renderer's CSS. A node with a `paintOrder` (or a
   pinned node whose `stacked`/`sticky.lift` makes the pin emit `z-index: 1`)
   opens a stacking context at that level. Everything else paints in tree order
   inside its nearest context. Negative levels paint below tree order and
   positive levels above it.
2. **`stacked` still exempts an overlap from being reported as an `overlap`, with
   one exception:** when the pair is a **text run and an image or painted box**,
   and the paint model puts the **text underneath**, the probe reports a new
   finding kind, **`buried`**, e.g. `"FAELAN" is painted beneath image (a declared
   stack whose words are underneath the picture)`. A `stacked` declaration says
   the overlap is intended. It does not say the words may be hidden, and a
   run painted under an opaque picture is never the intended design.
   - Pairs whose paint order puts the text on top (a headline over a hero photo,
     the BUG-112 case) stay exempt. The fold's REQ-347 `paintOrder` is what
     keeps a faithful faelan.com reproduction passing.
   - Image vs. image, box vs. image and text vs. text pairs under `stacked` stay
     exempt as before.
   - Unmarked overlaps are unchanged and are still reported as `overlap`.
3. **`buried` fails the envelope probe like any other finding.** It reaches the
   gate's `layout.findings` and gives a `structural-failure` verdict. The gate's
   diagnosis names it apart from overlaps ("run(s) painted beneath a picture
   stacked over them"). Its next step says to give the run a `paintOrder` above
   the picture (or fix the capture's `zIndex`), **not** "declare `stacked`",
   because the pair is already declared.
4. `buried` is **not** an input to `promoteToFlow`'s recovery (it reads
   `overlap` only). Paint order is not a flow problem, and moving the run would
   not unbury it.

### Test plan

`tests/test_UAT_FC_BUG-164_stacked_overlap_paint_order.test.ts` checks:
- a `stacked` image painted after a text run it covers (tree order, no
  `paintOrder`) → probe fails with a `buried` finding naming the run;
- the same document with the run given a `paintOrder` above the image → passes
  (the declared order agrees with the design);
- a `stacked` image given a `paintOrder` above a later text run → `buried`
  (explicit level beats tree order);
- image-vs-image under `stacked` stays exempt;
- `reconcileGates` turns a `buried` finding into `structural-failure` with the
  `paintOrder` next step and without the "declare `stacked`" advice.

The existing BUG-112 UATs (declared stack exempt, text after image) must stay
green.

### Deferred (not in this change)

- **Item 2** (a `painted`/`occludedPct` axis in values-diff) needs the reproduction's
  capture to hit-test whether each element contributes ink (e.g. `elementFromPoint`
  sampling). That is a capture-side change in the browser, outside the envelope
  probe.
- **Item 3** (a ranked-region-over-a-clean-pair breach rule in the perceptual
  floor) needs `regions.json` plumbed into `reconcileGates`, which today sees only
  the region count.

Item 1 alone turns this round's verdict from `pass` into `structural-failure`
that names "FAELAN". Items 2 and 3 are the independent second and third rulers.
