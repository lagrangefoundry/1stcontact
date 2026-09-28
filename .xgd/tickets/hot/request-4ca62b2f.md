---
uid: request-4ca62b2f
id: REQ-337
type: request
title: 'recovery: a content-derived bottom-padding track carries no segments, so it
  interpolates through a reflow window the geometry holds'
created_by: repro-console:repro-gigabytealchemy-ai#9
created_at: '2026-09-27T01:12:22.021251+00:00'
updated_at: '2026-09-27T01:12:54.759541+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  defect_class:
  - fold-wrong
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-216ce8dc
---

# recovery: a content-derived bottom-padding track carries no `segments`, so it interpolates through a reflow window the geometry holds

Loop 1, **iteration 9** of `repro-gigabytealchemy-ai` against
`storage/references/gigabytealchemy.ai/index` (re-captured this round at
`capturedAt: 2026-09-26T23:35:01.861Z`, `captureSchema: 7`).

`gate.json` verdict: **`structural-failure`** — perceptual mean 0.62/255, 0.22%
of pixels over threshold, 7 ranked regions; `values.deltas: 4` (all LOW);
**unmeasured 1** (0 axes, 0 bands, 0 populations, 1 probe). `l1Pass: false`, and
the whole of that failure is 20 `escape` findings against one panel, `card-5`.

**Residual class: `recovery-padding-track-drops-its-segments`.
`defect_class: fold-wrong`** — the capture carries the padding, L1 can express
the segment kinds (the schema already has the field and the renderer already
emits it), and the recovery pass writes the track without them.

---

## Issue 1 — `withContentInset` writes `responsivePadding.bottomPx` with no `segments`, so 12 of 12 padding tracks interpolate through the `snap` window

### Which of the three classes, and the test I ran

**Class 1 — engine shortfall.** The three questions of the brief §5, in order:

1. **Can L1 express it?** Yes. `packages/site-schema/src/l1/schema.ts:81-86`:

   ```ts
   export const l1ScalarTrackSchema = z
     .object({
       keyframes: z.array(l1ScalarKeyframeSchema).min(1),
       segments: z.array(l1SegmentSchema).optional(),
     })
     .strict()
   ```

   with the doc comment above it: *"absent segment flags default to
   `interpolate` (fluid)"*. `l1PaddingResponsiveSchema`
   (`schema.ts:857-860`) types every side as `l1ScalarTrackSchema`, so
   `responsivePadding.bottomPx.segments` is authorable **today**. Not class 2.

2. **Is the value in the L1 document, and is it right?** The value is there and
   it is **wrong** — the track is emitted with `keyframes` and nothing else.
   Read out of this iteration's own L1
   (`storage/tmp/repro-console/repro-gigabytealchemy-ai/iteration-9/page.json`,
   node `0.1.0.0.3`, `id: card-5`):

   ```json
   "axes": { "surfaceFill": "#f8f5f2", "borderRadiusPx": 8,
             "borderLeft": { "widthPx": 4, "color": "#50a2ff" } },
   "geometry": {
     "keyframes": [ {"at":320,"x":24,"y":32,"width":272}, {"at":375,"x":24,"y":32,"width":327},
                    {"at":768,"x":24,"y":32,"width":720}, {"at":1024,"x":24,"y":32,"width":896},
                    {"at":1280,"x":88,"y":32,"width":896}, {"at":1440,"x":168,"y":32,"width":896} ],
     "segments": ["interpolate", "snap", "interpolate", "interpolate", "interpolate"],
     "place": "flow"
   },
   "responsivePadding": {
     "bottomPx": {
       "keyframes": [ {"at":320,"value":264}, {"at":375,"value":216}, {"at":768,"value":156},
                      {"at":1024,"value":156}, {"at":1280,"value":156}, {"at":1440,"value":156} ]
     }
   }
   ```

   `geometry.segments[1] === "snap"` — the 375→768 window is a reflow window and
   the node's own box **holds** 375's value through it. The padding track beside
   it carries no `segments` at all, so the renderer's documented default takes
   over and it interpolates.

   This is not one node. Counted over the whole document
   (`l1.widths = [320,375,768,1024,1280,1440]`):

   | track kind | count | carries `segments` |
   |---|---|---|
   | `geometry` | 69 | **69 / 69** |
   | `responsive.{fontSizePx,lineHeightPx,letterSpacingPx}` | 18 | **18 / 18** |
   | `responsivePadding.bottomPx` | 12 | **0 / 12** |

   and **all 12** of those owners have `geometry.segments[1] === "snap"`:

   | path | id | `bottomPx` keyframe values @ 320/375/768/1024/1280/1440 | swing across the snapped 375→768 window |
   |---|---|---|---|
   | `0.0.0` | `section-bg-0` | 127.25, **185.75**, **488.25**, 232.25, 264.25, 364.25 | **+302.50px** |
   | `0.1.0.0.3` | `card-5` | 264, **216**, **156**, 156, 156, 156 | **−60.00px** |
   | `0.0.2.0.2.1` | `card-1` | 24, **24**, **50**, 24, 24, 24 | +26.00px |
   | `0.0.2.0.2.2` | `card-2` | 24, **24**, **50**, 24, 24, 24 | +26.00px |
   | `0.1.0` | `section-band-3` | 96, 96.5, 95.75, 95.75, 95.75, 95.75 | −0.75px |
   | `0.0.1` | `section-band-1` | 96, 95.75, 96.25, 96.5, 96.5, 96.5 | +0.50px |
   | `0.0.2` | `section-band-2` | 96, 96.25, 96.25, 96, 96, 96 | 0.00px |
   | `0.1.1` | `section-band-4` | 96, 96.25, 95.75, 96, 96, 96 | −0.50px |
   | `0.4` | `section-band-5` | 48, 48, 47.75, 48, 48, 48 | −0.25px |
   | `0.0.2.0.2.0` / `0.1.0.0.2` / `0.1.0.1` | `card-0` / `card-4` / `card-6` | 24 / 32 / 32 everywhere | 0.00px |

3. Question 3 does not arise — the value is already wrong at L1.

### `defect_class: fold-wrong`, defended in one line

The capture carries every padding side, `l1ScalarTrackSchema` already accepts
`segments`, and `scalarAxisRules` already emits `snap` — so the only thing that
put the wrong value into L1 is the pass that wrote the track, which is the fold's
recovery half. Not `renderer-wrong`: the renderer honours `segments` where they
are present (see below). Not `l1-cannot-express`: the field exists and validates.

### The reproduction is wrong in the browser's own CSS

None of this is inferred from the probes. The served document says it. From
`storage/tmp/repro-console/repro-gigabytealchemy-ai/iteration-9/site/home.html`
(`card-5` is `.l1-54`, `section-bg-0` is `.l1-2`):

```css
@media (min-width: 375px) { .l1-54 { margin-left: 24px; margin-top: 32px; width: 327px } }
@media (min-width: 375px) { .l1-54 { padding-bottom: calc(216px + (-60 * (100vw - 375px) / 393)) } }

@media (min-width: 375px) { .l1-2  { margin-left: 0px; margin-top: 0px; width: 375px } }
@media (min-width: 375px) { .l1-2  { padding-bottom: calc(185.75px + (302.5 * (100vw - 375px) / 393)) } }
```

Read those two pairs together. In the **same media block**, geometry is emitted
as literals (`width: 327px`, `margin-top: 32px` — that is `snap` doing its job)
and the padding beside it is emitted as an interpolating `calc()`. Neither node
is emitted with a `height` at all, so its height *is* content + this padding.

I scanned the whole `@media (min-width: 375px)` block: **12 of its 102 rules
contain `100vw`, and all 12 of them are `padding-bottom`.** Between 375px and
768px these twelve declarations are the only thing in the entire document that
changes with viewport width. So at any width strictly inside that window:

- `section-bg-0` (the hero band) is **+100.83px** too tall at 506px
  (185.75 + 302.5·131/393 = 286.58 against the 185.75 the fold measured at 375)
  and **+201.67px** too tall at 637px (387.42) — and everything below the hero is
  pushed down by that much;
- `card-5`'s bottom inset is **20.00px short** at 506px (196.00) and **40.00px
  short** at 637px (176.00) while every box inside it is pinned at its 375
  layout.

Every reference screenshot and every perceptual diff is taken at a ladder width,
where `snap` and `interpolate` agree by construction — so no mean, no region and
no value delta can ever see this. Only the off-sample probe can, and this round
it is the probe that failed.

### Which stored reference exhibits it

`storage/references/gigabytealchemy.ai/index`, iteration 9. **Evidence from this
one bundle only** — but the defect is not bundle-shaped: it is 12 of 12 tracks on
this page, and the line that writes them writes every page's.

### Hypothesis — by file and function

`tools/generate/src/l1/probes.ts:2544-2571`, `withContentInset`, the last line:

```ts
  const padding = { ...(('responsivePadding' in node ? node.responsivePadding : undefined) ?? {}) }
  return { ...node, responsivePadding: { ...padding, bottomPx: { keyframes } } } as L1Node
```

`{ keyframes }` — the node's `geometry.segments` is one property away and is not
carried. `withContentInset` is part of `promoteToFlow` (`probes.ts:2774`), the
recovery pass that runs **after** `foldToL1`, and `foldToL1` is where the hold
lives: `holdAcrossReflowWindows` (`tools/generate/src/l1/fold.ts:1684`, called at
`fold.ts:3732`) exists precisely to do this job and says so —

> *"Every responsive track on a node is held, not just geometry. An inset track
> inherits its node's segments by construction (see `insetTrack`), and a scalar
> axis sliding its type size through a window whose geometry is holding would
> re-introduce the same disagreement one axis down."*

Its `tracksOf` walk **would** find `responsivePadding.bottomPx` — it descends one
level into object-valued node properties, which is exactly where that track sits,
and that is why the 18 `responsive.*` type tracks all carry `segments`. The
padding tracks miss it because they do not exist yet when it runs: the ones
`foldToL1` itself writes (`responsivePaddingTracks`, `fold.ts:813-828`, also
`out[field] = { keyframes }`) are held, and then `promoteToFlow` **replaces** the
node with a fresh, segment-free track downstream of the hold. All 12 tracks in
this document are `withContentInset`'s, which is why 0 of 12 carry segments.

The renderer is innocent and can be shown to be: `scalarAxisRules`
(`packages/framework/src/l1/render.ts:2837-2851`) already branches on them —

```ts
const seg = track.segments?.[i] ?? 'interpolate'
const value = seg === 'snap' ? `${a.value}px` : lerpCalc(a.value, a.at, b.value, b.at)
```

— and `padding-bottom` is routed through it at `render.ts:4512`.

### Proposed change

1. In `withContentInset`, carry the node's own geometry segments onto the track
   it invents: `bottomPx: { keyframes, ...(geo.segments ? { segments: geo.segments } : {}) }`.
   `geo` is already in scope (`const geo = geometryOf(node)` two lines up) and its
   `keyframes` are the same ladder the padding keyframes are built from, so the
   arrays line up index for index.
2. Better, and it covers the class rather than this one site: re-run
   `holdAcrossReflowWindows` (or the `hold` half of it) over `promoteToFlow`'s
   output before it is validated at `probes.ts:3201`. That makes the invariant
   *"no track interpolates through a window another track on the same node
   snaps"* hold over the document that is actually served, not only over the base
   fold. `fold.ts:813-828`'s own `{ keyframes }` then stops being a latent bug
   too.
3. Consider making it structural: a document-level assertion that for every node
   and every window `i`, all of that node's tracks agree on `segments[i]`. Twelve
   of twelve is not a slip, it is an invariant nothing checks.

### How to see it

```
# 1 — the L1 the reproduction is serving. No browser needed.
node tools/generate/bin/1c.mjs page get repro-gigabytealchemy-ai home --sandbox --json > /tmp/p.json
python3 - <<'EOF'
import json
d=json.load(open('/tmp/p.json'))
def walk(n,p='0'):
    yield p,n
    for i,c in enumerate(n.get('children') or []): yield from walk(c,f'{p}.{i}')
for p,n in walk(d['data']['page']['l1']['root']):
    rp=n.get('responsivePadding')
    if rp:
        g=n.get('geometry') or {}
        print(p, n.get('id'), 'geom.segments=',g.get('segments'),
              '| padding sides without segments:',[s for s,t in rp.items() if 'segments' not in t])
EOF
```

- **wrong, today:** 12 lines, every one of them
  `geom.segments= ['interpolate', 'snap', 'interpolate', 'interpolate', 'interpolate'] | padding sides without segments: ['bottomPx']`
- **right, once fixed:** the same 12 lines with `padding sides without segments: []`.

```
# 2 — the consequence, in the CSS a browser gets. No browser needed.
node tools/generate/bin/1c.mjs render repro-gigabytealchemy-ai --out /tmp/r
grep -o '\.l1-2 { padding-bottom: [^}]*}' /tmp/r/home.html
```

- **wrong, today:** `padding-bottom: calc(185.75px + (302.5 * (100vw - 375px) / 393))`
  inside the `@media (min-width: 375px)` block, beside `width: 375px` as a literal.
- **right, once fixed:** `padding-bottom: 185.75px` in that block — held, exactly
  as the width beside it is held — and the interpolating `calc()` only in the
  windows whose `segments` entry really is `interpolate` (320→375, 768→1024,
  1024→1280, 1280→1440).

```
# 3 — the probe. No browser needed.
node tools/generate/bin/1c.mjs l1-gate --ref storage/references/gigabytealchemy.ai/index --json > /tmp/g.json
python3 -c "
import json,collections
d=json.load(open('/tmp/g.json'))
for row in d['offSample']['byWidth']:
    print(row['width'], row['height'], len(row['findings']), collections.Counter(f['kind'] for f in row['findings']))"
```

- **wrong, today:** every off-sample width clean **except** 506 and 637 — the two
  and only two off-sample widths that fall inside the snapped 375→768 window:
  `506 → 2 escapes`, `637 → 10 escapes + 2 overlaps`, and
  `338 / 357 / 853 / 939 / 1109 / 1195 / 1333 / 1387 → 0`. *Which widths fire is
  the tell*: 338 and 357 sit in an `interpolate` window and are clean; every
  width in the one `snap` window fails.
- **right, once fixed:** 506 and 637 report what the other ten report. **Read the
  companion bug first** — a second, independent defect inflates these same
  overhangs, so do not expect this fix alone to zero them, and re-measure rather
  than assume.

### Note on `1c` on `PATH`

`1c` is not on `PATH` in an agent session; every command above is spelled
`node tools/generate/bin/1c.mjs …` from the repo root, which is the same binary
(`tools/generate/package.json` → `"bin": {"1c": "./bin/1c.mjs"}`).

---

## What else this round measured, and where it went

Nothing else here is new, and each piece is recorded against the ticket that owns
its class rather than re-filed:

- **The instrument, first.** The 20 escapes above are reported against content
  the L1 evaluator models as **96px (at 506) / 192px (at 637) shorter inside
  `card-5` alone** than the document paints, because the oracle's measured-height
  ladder is interpolated across the same `snap` window. So the *magnitudes* in
  `gate.json`'s diagnosis are partly the ruler's. Filed separately as a `bug`
  (`probe-measured-text-height-ladder-ignores-snap-segments`), and it is the
  first thing to fix: this ticket's own "right result" cannot be read until it
  is. What survives regardless is everything in Issue 1 above, because that is
  quoted out of the served CSS and not out of a probe.
- **The wordmark, 100% of the ranked pixel score** (all 7 regions, 8402.53 of
  8402.53, are inside `'Gigabyte Alchemy'`): the render emits
  `@font-face { font-family: "Cinzel"; …; font-weight: 400 }` where the page's
  only Cinzel weight is 600. That is **REQ-334**'s class exactly, its fix
  (`757a4c1686`, 17:32:57) has **landed**, and it is capture-side, so it needs a
  **re-capture** — this bundle was captured at 16:35:01, 58 minutes before.
  Re-measurement appended to REQ-334.
- **All 4 value deltas** (`surfaceFill` `#030717` → `#a39e9b` on the four hero
  runs) and **`card-5`'s negative-margin sibling repair** (`.l1-66 { margin-top:
  -598px }`, `'XGD (Extreme Generative Development)'` sitting 16px **above** its
  own panel's top edge at 637px) are **REQ-302**'s issues 4 and 2. Appended
  there as a comment.
- **The unmeasured 1** (`§1.contentAnchor` declined, plus `nonSurfaceSections`
  `§0`) is **REQ-308**'s issue 2, re-measured **identical** to the iteration it
  was filed from — nothing to add.
- **Landed-since-the-run, do not re-file:** `gate.json`'s escape findings carry
  no `boxes` and `values-diff.json` carries no `bandPaintActual`; both arrived in
  `18389b822e` at 17:01:54, **25 minutes after** these artifacts were written at
  16:36. A re-run of `1c gate` picks both up — the live `l1-gate` above already
  returns `boxes`.

## Related

[[DOC-53]] · [[DOC-19]] · [[DOC-23]] · [[DOC-27]] · [[DOC-30]] · [[EPIC-12]]
§7.1 · [[REQ-88]] (the responsive ladder) · [[REQ-278]] / [[REQ-324]]
(`promoteToFlow`, `withContentInset`) · [[REQ-277]] (the unmeasured set)


---

**Companion ticket filed by the same round:** **BUG-160** — `probes/values-diff: the oracle measured-height ladder ignores segments`. Fix it first: it is the reason the 20 `escape` findings quoted above cannot be read at face value, and it is why this ticket's own "right result" for command 3 is stated as *re-measure*, not as a number.

Also appended this round: **REQ-334** (the Cinzel `@font-face` weight — 100% of the ranked pixel score, fix landed, needs a re-capture) and **REQ-302** (its issues 2 and 4, re-measured on this bundle).