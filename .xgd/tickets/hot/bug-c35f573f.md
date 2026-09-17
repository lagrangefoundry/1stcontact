---
uid: bug-c35f573f
id: BUG-102
type: bug
title: 'values-diff: section-level values are joined by ordinal index, so §n compares
  unrelated bands'
created_by: martin-github@westhead.me
created_at: '2026-09-17T02:59:32.864506+00:00'
updated_at: '2026-09-17T02:59:32.864506+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  severity: medium
  priority: medium
  auto_merge_back: true
  needs_review: false
---

`tools/generate/src/cli/capture/values-diff.ts:2588–2593` joins the two sides'
section-level values by **ordinal index**:

```ts
for (const s of actual.sections ?? []) actBySection.set(s.index, s)
for (const es of expected.sections ?? []) {
  const as = actBySection.get(es.index)
  if (!as) continue
  const label = `§${es.index}`
```

The two sides do not have the same number of sections, so `§n` on the reference
is not `§n` on the reproduction, and every section-level delta (`overlay`,
`contentAnchor`, `textAlign`) is computed between unrelated bands.

## Evidence — loop-1 iteration 2 of `repro-gigabytealchemy-ai`

Reference bundle: `storage/references/gigabytealchemy.ai/index`.

**The reference has 8 sections.** `gate.json` `coverage.sections: 8`;
`capture.json` `sections` has 8 entries; the widest-rest projection in
`multistate.json` has 8 `manifest.sections`.

**The reproduction's L1 has 6 bands.** From
`1c page get repro-gigabytealchemy-ai home --sandbox --json` (to a file — a pipe
truncates it, see the companion bug), the root's children include exactly six
`section-band-*` nodes and one `section-bg-0`:

```
section-band-0  surfaceFill #030717   y 0     h 800
section-band-1  surfaceFill #e8dfd3   y 800   h 488
section-band-2  surfaceFill #d9ccba   y 1288  h 594
section-band-3  surfaceFill #e8dfd3   y 1882  h 1257
section-band-4  surfaceFill #d9ccba   y 3139  h 549
section-band-5  surfaceFill #0f172b   y 4260  h 116
section-bg-0    backgroundImageUrl + overlay, y 0 h 800
```

**The reference's `§0` and `§1` occupy the same top region.** Both have
`box.y = 0`, because the page's header is `position: absolute` over the hero
(`raw.html`: `<header class="absolute top-0 left-0 right-0 z-40">`). In the
widest-rest projection at 1280:

```json
§0 { "index": 0, "box": { "x": 0, "y": 0, "width": 1280, "height": 192 }, "contentAnchorRatio": 0.66 }
§1 { "index": 1, "box": { "x": 0, "y": 0, "width": 1280, "height": 800 },
     "contentAnchorRatio": 0.53,
     "backgroundImageUrl": "https://gigabytealchemy.ai/images/AlchemistLabWithTech.png" }
```

`0.66` is right for `§0`: the header's only content is the wordmark at
`y 79 … 176` (`capture.json` `/sections[0]/content[0]`), whose centre
`127.5 / 192 = 0.664`.

**The one section-level delta this round produced:**

```json
{ "text": "§0", "role": "section", "property": "contentAnchor",
  "expected": "bottom (0.66)", "actual": "center (0.50)",
  "kind": "contentAnchor", "tier": "LOW", "magnitude": 0, "severity": 1040 }
```

The reproduction has no 192px header band — its `§0` is the 800px hero. The
comparison is between the reference's header strip and the reproduction's hero,
and `|0.66 − 0.50| = 0.16` clears the default `anchorTolerance` of 0.15
(`values-diff.ts:1988`) by 0.01.

The pixels say the content is not misplaced: the hero heading at `y = 320` is
2px out (regions 4 and 8, which align at `dy = +2` with a 0.86–1.94/255
residual), and the wordmark at `y ≈ 96` is 4px out — both accounted for by the
fold half-leading residual filed as the gap ticket this round. Nothing in
`regions.json` shows a band-scale vertical displacement.

## Why I say "most likely" rather than "certainly"

I could not read the reproduction's own section manifest. That is the second
half of this bug — filed separately — so the pairing cannot be checked from
stored evidence.

## Proposed fix

Join sections by **geometry**, not by ordinal. Both sides carry
`box {x, y, width, height}` in the same document coordinate space, so the
natural key is largest vertical overlap, with a section that has no overlapping
partner reported as unpaired rather than silently compared against whatever
shares its index.

A section that genuinely has no counterpart is itself the finding worth
reporting — the reference's absolutely-positioned header having no band in the
reproduction is a more interesting fact than a 0.16 anchor difference, and the
ordinal join converts the first into the second.

While there: `values-diff.json` reports `§0` in `deltas` but carries no `§0`
entry in `objects` (the `objects` array holds only text runs and controls), so a
reader cannot see what either side's section actually was.

## How to see it

```
REF=/Users/martin/lagrangefoundry/1stcontact/storage/references/gigabytealchemy.ai/index

# reference: 8 sections, §0 is a 192px header strip anchored at 0.66
python3 -c "import json;m=json.load(open('$REF/multistate.json'));
man=m['projections'][4]['manifest'];print(len(man['sections']));
print([{k:v for k,v in s.items() if k in ('index','box','contentAnchorRatio')} for s in man['sections'][:2]])"

# reproduction: 6 bands, band 0 is the 800px hero
./bin/1c page get repro-gigabytealchemy-ai home --sandbox --json > /tmp/l1.json
python3 -c "import json;d=json.load(open('/tmp/l1.json'))['data']['page']['l1'];
print([n['id'] for n in d['root']['children'] if (n.get('id') or '').startswith('section-')])"

# the delta the ordinal join produces
CHROMIUM_LAUNCH_ARGS=--single-process ./bin/1c values-diff repro-gigabytealchemy-ai \
  --ref $REF --sandbox --json
```
(`values-diff` drives Chromium; without `CHROMIUM_LAUNCH_ARGS=--single-process`
an agent sandbox denies Chromium's Mach port registration and it dies with
`bootstrap_check_in … Permission denied (1100)` before the first frame.)

**Wrong result (now):** a `§0 contentAnchor` delta, `bottom (0.66)` vs
`center (0.50)`, comparing the reference's header strip against the
reproduction's hero band.
**Right result (fixed):** the reference's `§0` header strip is reported as
having **no counterpart band** in the reproduction, and every paired `§n`
compares two bands that overlap in the page.

Found while diagnosing loop-1 iteration 2 of `repro-gigabytealchemy-ai`.
