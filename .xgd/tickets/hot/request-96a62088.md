---
uid: request-96a62088
id: REQ-324
type: request
title: 'fold: a bordered panel''s flow offsets are measured from its border box, and
  a one-child panel never flows at all'
created_by: repro-console:repro-gigabytealchemy-ai#7
created_at: '2026-09-25T21:44:49.637957+00:00'
updated_at: '2026-09-25T22:59:30.515848+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  defect_class:
  - fold-wrong
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-ba838d12
---

# fold: a bordered panel's flow offsets are measured from its border box, and a one-child panel never flows at all

Filed by `repro-console:repro-gigabytealchemy-ai#7`, iteration 7 of the reproduction of
https://gigabytealchemy.ai (sandbox site `repro-gigabytealchemy-ai`).

Reference bundle: `/Users/martin/lagrangefoundry/1stcontact/storage/references/gigabytealchemy.ai/index`,
`capturedAt` `2026-09-25T21:29:23.458Z`, `captureSchema` 6. **This capture is NEWER than every engine
commit**, including BUG-142's `8ecd455d16` (2026-09-25T17:14:57Z), BUG-143's `26f5491165`
(17:25:37Z) and the merge `1a9983de64` (20:43:18Z). Nothing below is a landed fix waiting on a
re-capture; all of it is measured by the instrument running now.

Both residuals below are **consequences of BUG-142's surface-containment nesting**, which is
`ready_to_reconcile` and whose fix is in the tree this round measured. They are not arguments
against it — BUG-142 took escapes from 17/50 to 1/50 — they are the two places the new nesting is
not yet exact. Both are `fold-wrong`. Neither existed in iteration 6 (which ran before those
commits: `layout.pass: true`, 0 findings, 0 regions, mean 0.22).

Gate verdict this round: **structural-failure**. 52 layout findings (all `kind: "escape"`),
perceptual mean 1.6/255, 1.06% over threshold, 12 ranked regions totalling **21294.82** score,
27 value deltas of which 23 are CRITICAL, unmeasured **1**.

**Fix issue 1 before issue 2.** Issue 2's fix routes card-3 and card-7's content through exactly
the code path issue 1 is wrong in, and both of those panels carry a 4px `borderLeft` — so landing
2 alone would create two NEW +4px shifts where today there are none. The dependency is stated
again under issue 2.

---

## Issue 1 — `recovery-measures-flow-lead-from-the-border-box`

**Class 1 (engine shortfall).** L1 can carry the value; the fold's absolute base carries it
correctly; the recovery that produces the served document writes the wrong one.

**`defect_class`: `fold-wrong`** — the test below reads the capture (right), the fold's base L1
(right), and the served L1 (wrong by exactly the panel's left border width), with the renderer
never consulted. The wrong number is in the document, so it is not `renderer-wrong`; the axis
exists and accepts the right value, so it is not `l1-cannot-express`.

**Exhibited on:** `storage/references/gigabytealchemy.ai/index` (gigabytealchemy.ai). This is the
only bundle I have evidence from. It will occur on any reference where a backing surface carries
`border` or `borderLeft` and owns two or more runs.

### The test I ran, and what came back

Three reads, no browser:

1. **`capture.json` → `sections[4].content[2]`** (the run `"Sanctum Voice"`):
   ```
   "box":      {"x": 124, "y": 2151.25, "width": 167.296875, "height": 32},
   "borderLeft": {"widthPx": 4, "color": "#ffb900"},
   "surface":  {"self": false,
                "box": {"x": 88, "y": 2119.25, "width": 896, "height": 332},
                "borderRadiusPx": 8,
                "border": {"widthPx": 4, "color": "#ffb900", "style": "solid"}}
   ```
   The panel's border box starts at x 88; its 4px left border occupies 88–92; its content box
   starts at 92; the run is at 124. **Content-box-relative x = 32.**

2. **the bundle's `l1.json` (the fold's absolute base)** — `card-4`, `axes.borderLeft.widthPx` 4,
   keyframe at 1280 `{"x": 88, "width": 896, "height": 332}`; its first leaf `"Sanctum Voice"`
   geometry keyframe at 1280 **`x: 32`**, pinned. Correct: 88 + 4 + 32 = 124. This is
   `rebaseInto` (`tools/generate/src/l1/fold.ts:2125-2135`) doing exactly what its own comment
   says — it subtracts `surfaceBorderInset(axes).left`.

3. **the served document** —
   `./bin/1c page get repro-gigabytealchemy-ai home --sandbox --json > /tmp/pg.json`, then
   `card-4` → first leaf `"Sanctum Voice"`: `{"at": 1280, "x": 36, "y": 32, "width": 167.3}`,
   `geometry.place: "flow"`. **36, not 32.** The same value is in this round's
   `iteration-7/page.json`.

The +4 lands on the page. `expected-manifest.json` `elements[19].box.x` = **124**;
`actual-manifest.json` `elements[22].box.x` = **128**. y is identical (2151.25 on both sides) —
and that is corroboration, not luck: `card-4.axes` has `borderLeft` but no `border`, so
`surfaceBorderInset` returns `{top: 0, right: 0, bottom: 0, left: 4}` and only x is wrong.

### Blast radius, from the artifacts

- **23 of the 27 value deltas**, every one of them CRITICAL at severity 4030.8, every one a
  `position` delta, every one dx = +4.00 and dy = 0.00. From `values-diff.json`:
  `"Sanctum Voice"` expected `@ (124, 2151)` actual `@ (128, 2151)`; `"✓"` expected `@ (124, 2323)`
  actual `@ (128, 2323)`; `"Completely on-device—your thoughts never leave your phone"` expected
  `@ (150, 2319)` actual `@ (154, 2319)`; `"XGD (Extreme Generative Development)"` expected
  `@ (124, 2515)` actual `@ (128, 2515)`; `"In development"` expected `@ (826, 2151)` actual
  `@ (830, 2151)`; and 18 more of the same shape.
- **100% of the ranked region score.** All 12 regions in `regions.json` lie between y 2160 and
  y 2976 — the three panels these runs sit in — and sum to 21294.82. The largest, region 1,
  `bbox {x: 128, y: 2512, w: 448, h: 32}`, score 3366.21, meanDiff 88.58, area 14336: `nodes.ref`
  carries `{"text": "XGD (Extreme Generative Development)", "role": "subheading", "box": {"x": 124,
  "y": 2515.25, "w": 448.44, "h": 32}}` and `nodes.actual` carries the same text and role at
  `{"x": 128, ...}` — same text, same width, same y, 4px apart. That is the signature the brief
  names: same text on both sides, different boxes.
- **Exactly the three panels that have a left border AND flowed content.** Every surface in
  the base `l1.json`: `card-3` (1 child, borderLeft 4), `card-4` (10, 4), `card-5` (10, 4),
  `card-6` (3, 4), `card-7` (1, 4), `card-0/1/2` (2 children, no border), `section-band-*`
  (no border). Runs under card-4, card-5 and card-6 are shifted +4; runs under card-0/1/2 (flowed,
  no border) are not; runs under card-3 and card-7 (border, but never flowed — issue 2) are not.
  A sweep of every element pair across the two manifests finds **23 shifted and no others**
  (the only other non-zero dx is −0.02/−0.03 on the two footer links, which is sub-pixel).

### Hypothesis — where it is

`promoteToFlow` in `tools/generate/src/l1/probes.ts`.

`rewrite`'s `lefts`/`tops` maps are documented (probes.ts:2613-2617) as *"where this node's content
box starts"*. They are not. `childFrame` (probes.ts:2623-2640) computes a child's frame as

```ts
map.set(w, own === undefined ? outer : outer + own + (axis === 'x' ? inset.left : inset.top))
```

where `inset` is **the parent's** border inset, and `own` is the child's padding-box-relative
keyframe. For `card-4` that gives `0 (section content left) + 88 + 0 = 88` — the card's **border
box** left, not its content box left, because a node's own inset is never added to its own frame.

The absolute frames of grandchildren are still right, because the card's own inset is added one
level further down. What is wrong is the leading offset. In `plan()` (probes.ts:2779):

```ts
const left = lefts.get(w) ?? 0
...
const placed = placeFlow(cell.map(...), false, top, left)
```

and `placeFlow` (probes.ts:2168) emits `leads.push({ x: box.x - left, y: box.y - penY })`.
So the lead is `124 − 88 = 36`, measured from the border box, and both the renderer and
`evaluateLayout` then read it from the content box at 88 + 4 → 128.

The same error exists on the y axis and is latent here only because this page has no surface with
a full `border` axis: `cursor` is seeded with `tops.get(w)` (probes.ts:2745) with no `inset.top`.

### Proposed change

In `plan()`, seed the flow frame from this node's **content** box: `const left = (lefts.get(w) ?? 0)
+ inset.left`, and `const cursor = new Map(widths.map(w => [w, (tops.get(w) ?? 0) + inset.top]))`.
`inset` is already in scope on line 2622. Do not change `childFrame` — it is correct, and adding
the inset there too would double-count it.

Whichever way it is fixed, please also settle the contract in one comment: **an L1 child's
`geometry.x/y` is relative to its parent's PADDING box**, which is what `rebaseInto` writes and
what `childFrame` reads, and rename `lefts`/`tops` (or their doc comment) so the next reader is
not told they hold a content-box origin when they hold a border-box one.

A regression test is cheap and needs no browser: fold any capture with a bordered panel over two
runs, `promoteToFlow` it, and assert the emitted flow lead equals the base's pinned x.

### How to see it

```bash
cd /Users/martin/lagrangefoundry/1stcontact
mkdir -p .xgd/tmp && cat > .xgd/tmp/border-lead.mjs <<'EOF'
import fs from 'node:fs'
import { createServer } from '/Users/martin/lagrangefoundry/1stcontact/tools/generate/node_modules/vite/dist/node/index.js'
const repoRoot = '/Users/martin/lagrangefoundry/1stcontact'
const server = await createServer({ root: repoRoot, configFile: false,
  server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom', logLevel: 'error' })
const probes = await server.ssrLoadModule('/tools/generate/src/l1/probes.ts')
const base = JSON.parse(fs.readFileSync(
  repoRoot + '/storage/references/gigabytealchemy.ai/index/l1.json', 'utf8'))
const find = (n, id) => n.id === id ? n : (n.children ?? []).reduce((a, c) => a ?? find(c, id), undefined)
const at = (n, w) => (n.geometry?.keyframes ?? []).find(k => k.at === w)
const leaf = (n) => n.kind === 'text' ? n : leaf((n.children ?? [])[0])
for (const [label, doc] of [['BASE   ', base], ['RECOVER', probes.promoteToFlow(base).doc]]) {
  const card = find(doc.root, 'card-4')
  const run = leaf(card)
  console.log(label, 'card-4.x', at(card, 1280).x,
              '| borderLeft', card.axes.borderLeft.widthPx,
              '|', JSON.stringify(run.text), 'place', run.geometry.place ?? '(pinned)',
              'x', at(run, 1280).x)
}
await server.close()
EOF
node .xgd/tmp/border-lead.mjs
```

**Wrong (what it prints today):**

```
BASE    card-4.x 88 | borderLeft 4 | "Sanctum Voice" place (pinned) x 32
RECOVER card-4.x 88 | borderLeft 4 | "Sanctum Voice" place flow x 36
```

**Right:** `RECOVER` prints `x 32` — the same number as `BASE`, because the panel's border width
is not part of the offset from its content box.

The end-to-end confirmation, browser-backed:

```bash
CHROMIUM_LAUNCH_ARGS=--single-process ./bin/1c gate repro-gigabytealchemy-ai \
  --ref /Users/martin/lagrangefoundry/1stcontact/storage/references/gigabytealchemy.ai/index --sandbox
```

**Wrong:** 27 deltas, worst tier CRITICAL, 23 `position` deltas of +4px in x.
**Right:** those 23 deltas are gone; `values.deltas` falls to 4 and `worstTier` to LOW (the four
remaining are REQ-302's `surfaceFill` scrim deltas, tracked there).

---

## Issue 2 — `single-child-surface-never-flows-and-keeps-its-pinned-height`

**Class 1 (engine shortfall).** The capture carries the panel and its run; L1 can express a panel
sized by its content (`card-4` is exactly that, with `responsivePadding.bottomPx`); the recovery
declines to do it for a panel that owns exactly one run.

**`defect_class`: `fold-wrong`** — the test below shows the served document keeps
`height: 29.25` on `card-3` and `card-7` with the child left `pinned`, while the sibling panels
that own two or more runs have their height dropped and `responsivePadding.bottomPx` added. The
capture recorded all five panels identically; the difference is made downstream, in the fold's
recovery.

**Exhibited on:** `storage/references/gigabytealchemy.ai/index` only. It will occur wherever a
backing surface owns exactly one run — a single-line callout or pull-quote panel, which is a
common shape.

### The test I ran, and what came back

`./bin/1c l1-gate --ref storage/references/gigabytealchemy.ai/index --json`, findings tallied by
kind and by the surface named in `detail`:

| probe | escapes |
|---|---|
| on-sample | 0 |
| off-sample | `card-5` 20 |
| content-robustness | `card-3` 12, `card-7` 12, `section-band-2` 4, `section-band-4` 4 |

That is 32 escapes for card-3/card-7 and their bands, and it matches this round's `gate.json`
`layout.findings` exactly: 52 findings, all `kind: "escape"`, tallying `card-5` 20 (widths 506,
637), `card-3` 12, `card-7` 12, `section-band-2` 4, `section-band-4` 4. **32 of the 52 are this
issue**; the other 20 are card-5 and belong to REQ-302 (see "Not in this ticket" below).

Verbatim findings from `gate.json`:

```
at 1024px×768px: 'These aren't just features—they're foundations. Every tool we build starts
  with these principles.' is no longer covered by its backing surface card-3 — 15px below its bottom edge
at  768px×768px: … card-3 — 59px below its bottom edge
at  320px×768px: … card-3 — 146px below its bottom edge
at  320px×768px: … section-band-2 — 50px below its bottom edge
at  320px×768px: 'We're not trying to change you. …' … card-7 — 146px below its bottom edge
```

card-3 and card-7 escape at **every** captured width — 320, 375, 768, 1024, 1280 and 1440 —
and at both sampled heights.

### Why those two and no others

From the base `l1.json`, every synthesized surface with its child count, left border and declared
height at 1280:

```
section-band-1  4 children  no border   h 488
section-band-2  6           no border   h 594
card-0          2           no border   h 192
card-1          2           no border   h 192
card-2          2           no border   h 192
card-3          1           borderLeft 4  h 29.25
section-band-3  5           no border   h 1257
card-4         10           borderLeft 4  h 332
card-5         10           borderLeft 4  h 332
card-6          3           borderLeft 4  h 196
section-band-4  5           no border   h 549
card-7          1           borderLeft 4  h 29.25
section-band-5  3           no border   h 116
```

`card-3` and `card-7` are the only two surfaces with **one** child, and they are exactly the two
that escape. 2 of 2 — and the mechanism is readable in the source rather than inferred:

- `promoteToFlow`'s `rewrite` builds `components` from pairs of pinned children that **overlap
  under a 2.5× content perturbation**, then `.filter(g => g.length >= 2)` (probes.ts:2655-2657).
  A node with one child can produce no pair, so `components.length === 0` and `rewrite` returns
  on probes.ts:2659 before the flow machinery runs at all. The child stays pinned.
- `heightBelongsToContent` (probes.ts:2337-2345) then returns `false`, because its last clause is
  `childrenOf(node).some(c => !isPinned(c))` and there are no non-pinned children.
- So `withContentInset` (probes.ts:2372) returns the node untouched, the panel keeps
  `height: 29.25` — its at-rest ONE-LINE height — and the run inside it is free to wrap. At 320px
  the run becomes 175px tall and hangs 146px below a panel that is still 29.25px.

The gate's own `nextStep` states the general form of this: *"a panel whose height is a constant
cannot follow copy that reflows."* The narrow finding is that BUG-142 already fixed that for
panels with two or more runs, and a panel with one run falls through an exemption written for a
different case — `heightBelongsToContent`'s comment says a node whose children are *all* out of
flow "has an interior the browser measures as empty, so handing it its height collapses it to
nothing". That is true of a panel whose children are *legitimately* absolute; it is not true of a
panel whose only child was never offered the flow.

### Proposed change

Let a lone pinned child be promoted. In `rewrite`, before the `components.length === 0` early
return, admit the case where the node has exactly one promotable pinned child: there is no
collision to resolve, so there is nothing for the component search to find, but flowing it is
what lets the panel's height come from it. Concretely, treat a single pinned, non-`keepsAbsolute`
child as its own one-member region so it goes through `plan()` / `flowNode` /
`withContentInset` like any other member, and its panel gets `responsivePadding.bottomPx` for the
captured slack (29.25 − the run's height, per width) instead of a frozen `height`.

Guard the `heightBelongsToContent` collapse case as it was intended: keep the height where the
children are pinned **because they are genuinely out of flow** (`keepsAbsolute`, `stacked`, a
`viewportResponse.heightFactor`), not merely because the component search had nothing to chew on.

**Depends on issue 1.** `card-3` and `card-7` both carry `borderLeft: {widthPx: 4}`, and today
their runs land at the right x precisely because they never enter `plan()`. Flow them while issue 1
stands and their two runs join the 23 that are 4px too far right — a fix that trades 32 escapes for
2 new CRITICAL position deltas. Land issue 1 first, or land both together.

### How to see it

```bash
cd /Users/martin/lagrangefoundry/1stcontact
./bin/1c l1-gate --ref storage/references/gigabytealchemy.ai/index --json > /tmp/l1gate.json
python3 - <<'EOF'
import json, re, collections
d = json.load(open('/tmp/l1gate.json'))
for probe in ('onSample', 'offSample', 'contentRobustness'):
    t = collections.Counter()
    for w in d[probe]['byWidth']:
        for f in w['findings']:
            m = re.search(r'backing surface ([\w-]+)', f['detail'])
            t[f['kind'] + ':' + (m.group(1) if m else '-')] += 1
    print(probe, dict(t))
EOF
```

**Wrong (today):**

```
onSample {}
offSample {'escape:card-5': 20, 'overlap:-': 4}
contentRobustness {'overlap:-': 186, 'escape:card-3': 12, 'escape:section-band-2': 4, 'escape:card-7': 12, 'escape:section-band-4': 4}
```

**Right:** `escape:card-3`, `escape:card-7`, `escape:section-band-2` and `escape:section-band-4`
are all 0. (`escape:card-5` 20 is REQ-302's and will remain. The `overlap` counts here are larger
than the acceptance gate's because `1c l1-gate` measures text analytically while the gate supplies
measured heights — the gate reports 0 overlaps and the 52 escapes above; compare escapes, not
overlaps.)

And end to end:

```bash
CHROMIUM_LAUNCH_ARGS=--single-process ./bin/1c gate repro-gigabytealchemy-ai \
  --ref /Users/martin/lagrangefoundry/1stcontact/storage/references/gigabytealchemy.ai/index --sandbox
```

**Wrong:** `verdict: "structural-failure"`, `layout.pass: false`, 52 findings.
**Right:** 20 findings (card-5 only), and once REQ-302's issue 2 also lands, `layout.pass: true`.

---

## Not in this ticket, and why

Re-measured this round, confirmed still live, and belonging to classes that already have tickets.
I did not re-file them and I did not fold them in here.

- **`card-5`, 20 of the 52 escapes**, at the off-sample widths 506 and 637 only (`'✓'` 12/52/92px
  below card-5's bottom edge; `'XGD (Extreme Generative Development)'` and `'Coming soon'` 16px
  *above* its top edge). This is REQ-302's issue 2 — the fold emits card-5's flow siblings out of
  DOM order and repairs it with negative leads (in the served document card-5's first flowed leaf
  is `'✓'` at y 204 and `'XGD …'` is at y −268), which the recovery holds across a `snap` segment,
  so between 375 and 768 the held offsets no longer match a cursor that has reflowed. I appended
  this round's numbers to REQ-302 as a comment rather than filing them here.
- **4 LOW `surfaceFill` deltas**, `#030717` expected vs `#a39e9b` actual on the four hero runs
  (`"Gigabyte Alchemy"`, `"Intentional Software"`, `"Tools for clarity, presence, and positive
  connection"`, `"We're a software studio building technology to elevate—no…"`), severity
  1060.363100579612 each. Unchanged from iteration 6. REQ-302 issue 4, already appended at REQ-308.
- **The unmeasured 1.** `gate.json` `values.notComparableAxes` holds one entry, `§1.contentAnchor`,
  declined because "§0 sits inside this band, so the reference measured its anchor over a
  DOM-descendant population that EXCLUDES those runs while the reproduction's geometric band
  includes them". Identical to iteration 6's entry, character for character. REQ-270's residual 4,
  and BUG-139 covers the counting of it. `coverage.findings` is empty, `unreferencedImages` is
  empty, the single mirrored image `assets/AlchemistLabWithTech.png` is referenced,
  `unpairedActual` and `unpairedActualSections` are both 0 — content completeness is clean this
  round.

## Secondary

One `1c` defect filed separately against the region ranker and the two manifests' element sets,
as required by §5 — it is what made both residuals above invisible in the round's own digest.