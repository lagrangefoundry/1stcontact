---
uid: comment-dc27f613
id: COMMENT-3954
type: comment
title: Comment on request REQ-265
created_by: xgd
created_at: '2026-09-26T18:58:05.161001+00:00'
updated_at: '2026-09-26T18:58:05.161001+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-47ab4ddc
  kind: note
---

`repro-console:repro-faelan-com#1` — iteration 1 re-measurement of
`fold-drops-half-leading-on-inline-boxed-text-runs` on a second reference bundle.

Seen again on `storage/references/faelan.com/index` (captured
`2026-09-26T18:29:48.415Z`, `captureSchema: 6`; nothing has landed in the engine
since, so this is the instrument running now). Same defect, same direction, and
**worse than this ticket measured** — on this page it does not stay a local glyph
shift, it accumulates down a flow chain and moves the rest of the document.

Three things this round adds. Paths:

```
REF=/Users/martin/lagrangefoundry/1stcontact/storage/references/faelan.com/index
ITER=/Users/martin/lagrangefoundry/1stcontact/storage/tmp/repro-console/repro-faelan-com/iteration-1
```

## 1. The same signature, on three more runs

`$REF/capture.json` `/sections/0/content` — the hero's
`<p>Artist • <a …>Musician</a> • Creator</p>` (`$REF/raw.html`):

| run | `box` | `renderedTextBox` | `lineHeightPx` | `inlineBox` |
|---|---|---|---|---|
| `Artist •` | `{x:102.39, y:172, w:76.78, h:28}` | identical to `box` | 36 | `{x:102.39, y:168, w:267.64, h:36}` |
| `Musician` (the `<a>`) | `{x:179.17, y:168, w:92.70, h:36}` | `{…, y:172, h:28}` | 36 | same |
| `• Creator` | `{x:271.88, y:172, w:98.16, h:28}` | identical to `box` | 36 | same |

`box` is byte-identical to `renderedTextBox` and `box.height` (28) is not
`lineHeightPx` (36) on runs 1 and 3 — exactly the signature this ticket names.
Note run 2: an element-wrapped run's `box` IS its line box (36 at 168), so the
meaning of `box` varies **within one sentence** by whether the run is a bare text
node or an element. The fold transcribes `box.y` from both.

## 2. The error accumulates: +4, +8, +16, and the document grows 16px

The fold's leads are internally consistent with the wrong rects, so the error
compounds through the in-flow sibling chain. `$ITER/page.json` keyframes at
`at: 1280`, against what the renderer then paints (`$ITER/site/home.html`):

| node | L1 lead `y` | rendered box top | reference `box.y` | error |
|---|---|---|---|---|
| `FAELAN` | 64 | 64 | 64 | 0 |
| `Artist •` | 12 | 160+12 = 172 | 168 | **+4** |
| `Musician` | −32 | 208−32 = 176 | 168 | **+8** |
| `• Creator` | −32 | 212−32 = 180 | 172 | **+8** |
| `image-0` | −141 | 216−141 = 75 | 58.998 | **+16** |
| `image-1` | −261.23 | 47.78 | 31.767 | +16 |
| `image-2` | 89.23 | 359.16 | 343.168 | +16 |
| `image-3` | −506.92 | 145.03 | 129.035 | +16 |

The renderer is correct: `.l1-5 { margin-top: 12px } .l1-5 { line-height: 36px }`
and the same shape for `.l1-6`/`.l1-7`. Each run's rendered bottom is 8px later
than the fold assumed (36 against 28), so the next sibling's lead lands late, and
after the last text run everything is +16 for the rest of the page:
`$ITER/diff/expected-manifest.json` vs `actual-manifest.json` —
`viewport.height` **1195 → 1211**, `sections[0].box.height` **800 → 815.96875**,
`sections[1].box.y` **800 → 815.96875**, `sections[2].box.y`
**1111 → 1126.96875**. The hero's `padding-bottom` is right (41.37px;
`758.62 + 41.37 = 799.99` on the reference side, `774.61 + 41.37 = 815.98` on
ours) — only the last child is misplaced.

Cost, measured: **9 CRITICAL `position` deltas** (magnitudes 8, 8, and seven at
15.97–16.01) of the 20 in `$ITER/diff/values-diff.json`, and **~99.8% of the
141276.96 ranked region score** in `$ITER/diff/regions.json`. Region 1
`(0,32) 1280×784`, score 125599.43 (88.9%), is the signature of displacement
rather than recolouring in its own `readout`: `meanRgb` ref
`[71.54,77.42,74.61]` vs ours `[68.87,75.56,71.24]` — `deltaRgb`
`[-2.67,-1.86,-3.37]` while `meanAbsDiff` is 29.92. Regions 2 and 3 carry
`deltaRgb [0,0,0]` with the same run on both sides 16px apart.

## 3. The proposed fix in this ticket's body is incomplete for a run in a flow chain

This ticket proposes `y = box.y + (box.height − lineCount × lineHeightPx) / 2`.
That corrects the run's own **top** and not the **height the next sibling's lead
is measured from**. Applied here it would put `Artist •` at 168 (right) and still
compute `Musician`'s lead as `168 − (168 + 28) = −28`, which the renderer resolves
against a line box of 36: `204 − 28 = 176`, still 8px late, and the chain below
still drifts. **A run's occupied height in the fold's model has to become the
height the renderer will give it (`lineHeightPx`), not `box.height`** — both ends
of the rect, not just the top.

Also, one remark in the body needs narrowing rather than correcting: *"`inlineBox`
is not it — that is REQ-211's flow-root rect … the string `inlineBox` occurs 0
times in this bundle's `capture.json`"*. True of the gigabyte bundle. On this
bundle `inlineBox` **is** present on all three runs and its value
(`y: 168, h: 36`) is exactly the line box the renderer needs, so for a multi-run
flow it is available and is the right source. The `lineHeightPx` conversion is
still needed for the single-run case, where there is no `inlineBox` — which is
the gigabyte case and why this ticket stands on its own.

## Separately filed: why the rejoin that would have made this moot did not happen

REQ-331 (`fold-leaves-a-link-only-inline-flow-unrejoined`, filed this round).
`inline-runs.ts:91` `signature()` compares `[color, fontSizePx, fontWeight,
fontStyle]`, so a flow whose only variation is a link reads as "does not vary",
`rejoinableFlows` drops it, and the three runs above are transcribed as pinned
fragments — which is what puts them on this ticket's path at all. Rejoining this
flow would use `inlineBox` (via `buildGeometry`'s `useFlowBox`) and close this
bundle's instance; it does **not** close this ticket, whose gigabyte runs are
single-run flows with no rejoin available.
