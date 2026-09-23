---
uid: comment-25c71903
id: COMMENT-3671
type: comment
title: Comment on request REQ-302
created_by: xgd
created_at: '2026-09-23T02:32:09.981398+00:00'
updated_at: '2026-09-23T02:32:09.981398+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-edbc7e5f
  kind: note
  payload:
    created_by: repro-console:repro-gigabytealchemy-ai#5
---


---

## Iteration 5 re-measurement (`repro-console:repro-gigabytealchemy-ai#5`)

Same bundle, re-captured for this iteration
(`capturedAt: 2026-09-23T01:58:40.658Z`, `captureSchema: 5`,
`iteration.json: "recaptured": true`). Paths below:

```
REPO=/Users/martin/lagrangefoundry/1stcontact
REF=$REPO/storage/references/gigabytealchemy.ai/index
ITER=$REPO/storage/tmp/repro-console/repro-gigabytealchemy-ai/iteration-5
```

`gate.json` moved from mean 0.52/255 · 0.38% · 10 regions · 23 deltas · unmeasured 5,
to **mean 0.23/255 · 0.01% · 2 regions · 4 deltas · unmeasured 1**, `matched: 59`,
`unmatched: 0`, `unpairedActual: 0`, `worstTier: LOW`, `valuesBreach: false`,
`layout.pass: true`.

### Four of the seven are gone — read out of this iteration's artifacts

- **Issue 1 (stretch to container): landed.** `$ITER/diff/actual-manifest.json` gives
  `"Gigabyte Alchemy"` `box: {x: 88, y: 82.5, width: 685.3125, height: 90}` — byte-equal
  to the reference, against `width: 1192` last round. The three ranked regions that
  carried 58.4% of the score are gone; no region in `$ITER/diff/regions.json` lies in the
  hero at all. Its 10 dependent deltas (`borderLeft` ×6, `surfaceGradient` ×2,
  `surfaceFill` ×2) are gone with it.
- **Issue 3 (`a11yRole` on the text node): landed.** The actual side now records
  `a11yRole: "link"` + `href: "/"` on the wordmark and `a11yRole: "heading"` +
  `headingLevel: 1` on `"Intentional Software"`, matching the reference. The two
  3100-severity deltas are gone.
- **Issue 5 (three padding sides + `textAlign`): landed.** All four `padding*Px` and
  `textAlign` are present on both sides of `$ITER/diff/*-manifest.json`, and
  `gate.json` reports `values.unmeasuredAxes: []` (was 4 axes).
- **Issue 6 (whole-pixel rounding): landed.** `y: 82.5` on both sides; the served CSS
  carries `.l1-16 { margin-top: 82.5px }`.

### Issue 2 is still present, and is now the ONLY reason the gate says FAIL

`1c l1-gate --ref $REF --json` this round:

```
sampleFidelity : pass  (tolerancePx 2, maxDelta 0.008125px, 0 residuals)
offSample      : pass  (500px, 900px — 0 findings)          ← was FAIL at 500px
onSample       : pass  (320/375/768/1024/1280/1440 — 0 findings)
contentRobustness: FAIL — 17/16/15/15/15/15 findings by width = 93 overlaps
```

`gate.json` follows it exactly: `l1Pass: false`, `layout.pass: true`,
`perceptualBreach: false`, `valuesBreach: false` — the verdict is
`structural-failure` on content robustness alone.

**The negative-margin repair is still in the served document.** `$ITER/site/index.html`
carries **15** `margin-top: -Npx` declarations across 6 classes; the most negative is
**−598px** (`.l1-64`/`.l1-65`), then −524, −506, −486, −412, −268, −232, −220, −92, −20.
Last round's −946px is gone; the mechanism is not.

**And the probe's findings name exactly those siblings.** From `$ITER/page.json`, inside
the promoted flow container `0.15` at `at: 1280`:

```
0.15.8.0  "✓"                                       y:  268
0.15.8.1  "Designed for developers building AI-…"    y:  264
0.15.11.0 "XGD (Extreme Generative Development)"     y: -268
0.15.11.1 "Coming soon"                              y: -268
0.15.12   "AI-powered development methodology…"      y: -220
```

and the first four `contentRobustness` findings at every width are
`0.15.8.0 ↔ 0.15.11.0`, `0.15.8.0 ↔ 0.15.12`, `0.15.8.1 ↔ 0.15.11.0`,
`0.15.8.1 ↔ 0.15.12`. A sibling pulled back 268px over its predecessor is already
sharing that predecessor's vertical span, so any growth in either overlaps the other —
which is what the probe grows text 2.5× to find.

The same shape sits in the form slots: `0.17.2` (`form-0`) is at `y: -92` and `0.17.3`
(`form-1`) at `y: -232`, and inside them the controls are absolutely placed
(`$ITER/site/index.html`: `.form-0-form-l1-3 { position: absolute; top: 132px; … }`),
producing the `control overlaps control` findings and
`control overlaps "Protected by Cloudflare Turnstile."` (`0.18`, `y: 198`).

### Issue 4 is half fixed, and the surviving half has a sharper mechanism

The axis split is **gone**: both sides now land the scrim on `surfaceFill`, and the band
records agree (`overlay: {color: "#030717", opacity: 0.3}` on the hero band of both
manifests — the alpha survives there now). What remains is 4 of this round's 4 deltas:

```
surfaceFill  "Gigabyte Alchemy"                      #030717 → #a39e9b  LOW 1060.36
surfaceFill  "Intentional Software"                  #030717 → #a39e9b  LOW 1060.36
surfaceFill  "Tools for clarity, presence, and …"    #030717 → #a39e9b  LOW 1060.36
surfaceFill  "We're a software studio building …"    #030717 → #a39e9b  LOW 1060.36
```

while the perceptual bands over the hero read **0.74 / 0.73 / 0.70 of 255**
(`$ITER/diff/regions.json: bands[0..2]`) and no region is ranked there. The deltas are
the instrument's.

**The mechanism, end to end, all of it re-read this round:**

1. `surfaceFillOf` (`tools/generate/src/cli/capture/extract.ts:1004-1033`) composites down
   the geometric surface chain until it reaches an opaque layer, and at line 1031-1032
   **returns the accumulator's RGB with its alpha discarded** when it never does.
2. On the reference the chain over the wordmark is
   `span → section(bg-image only) → div.bg-slate-950/30 → header → body` — and `<body>`
   paints **nothing**: `$REF/multistate.json` reports `bodyBackground: "#ffffff"` in all
   7 projections, which is the `|| '#ffffff'` UA-canvas fallback at `extract.ts:2167`,
   and `$REF/capture.json`'s `theme.colors` lists `#e8dfd3` with `usage: background`
   `freq: 3` (three section elements paint it; the body is not one of them). So the walk
   ends at 30% alpha and reports the scrim as an opaque `#030717`.
   Ground truth, `$REF/raw.html`:
   `<section class="relative min-h-screen bg-cover …" style="background-image: url('/images/AlchemistLabWithTech.png');"><div class="absolute inset-0 bg-slate-950/30">` —
   no background-colour anywhere on that chain.
3. The reproduction's body **is** opaque: `bodyBackground` is a *carried* axis inferred
   from the widest band on the bundle side (`value-axes.ts:828-833`), so the fold gives it
   `#e8dfd3`, and the same scrim (emitted as `background-image: linear-gradient(#0307174d,
   #0307174d), url(…)` on `.l1-6`) composites over it to **`#a39e9b`** — which is
   `0.3×#030717 + 0.7×#e8dfd3` to the byte.
4. `values-diff` then compares two opaque hexes with `colorDistance` and reports four LOW
   deltas on runs whose pixels agree.

So the axis is procedure-dependent: the *same* design, authored as a translucent element
on one side and as a flat gradient layer over an opaque canvas on the other, yields two
different opaque colours from the same function. Either `surfaceFill` must carry the
alpha (and the comparison composite both sides over the same declared page base), or a
non-opaque accumulator must be reported as "translucent over <what>" rather than flattened
to a colour the page never paints.

### What iteration 5 did NOT bring back here

Two residuals this round found are not this ticket's classes and were filed as
[[REQ-308]]: a placeholder-only control is captured with no typography at all (100% of
this round's ranked region score, 0 deltas), and the reference's paintless `<header>`
band can never be paired (the whole `unmeasured 1`, plus a declined hero anchor).
