---
uid: bug-c35f573f
id: BUG-102
type: bug
title: 'values-diff: section-level values are joined by ordinal index, so §n compares
  unrelated bands'
created_by: martin-github@westhead.me
created_at: '2026-09-17T02:59:32.864506+00:00'
updated_at: '2026-09-17T22:01:52.477327+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  severity: medium
  priority: medium
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-3d422f9d
  commits:
  - working_sha: 5e6d1405e781774736dedec31eb9cdfb590c7440
    reconcile_sha: null
    main_sha: null
  - working_sha: e6e988e870a639f9d0dc1ef80259292f4d69bbb8
    reconcile_sha: null
    main_sha: null
  version: 0.2.234
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

**Companion:** the missing-artifact half of this is **BUG-103** (no flag writes
the reproduction-side value manifest). The fold residual that explains the pixel
evidence quoted above is **REQ-265**; the truncation that forces the
file-redirect in the commands above is **BUG-101**.


---

## Root cause, corrected (investigation 2026-09-17)

The ordinal join is the defect, but the reproduction side is not "6 bands offset
by one". **It carries exactly ONE section.**

`flattenSignals` reads section values from `signals.bands`, and `extract.ts`
builds `bands` from the **direct children of `<body>`** whose painted extent is
≥ 8px. An L1 render emits a single root element into `<body>`
(`render.ts:3444`, `emitNode(doc.root, …)`), so there is exactly one band root
and its `paintedExtent` is the whole document. The `section-band-*` nodes quoted
above are its *grandchildren* — never band roots. This is BUG-15's flat-DOM
problem one level up, at the section layer instead of the element layer.

Confirmed by running the real `EXTRACT_SCRIPT` under jsdom over an L1-shaped DOM
(one relative wrapper; absolutely-positioned band boxes and text as siblings):

```
L1-shaped DOM -> bands: 1
[{ box: { x: 0, y: 0, width: 1280, height: 1900 }, anchor: 0.33, overlay: null }]
```

The stored evidence agrees with this and not with the ordinal-offset reading. If
the reproduction really had six bands offset by one, reference `§1` (the hero,
`overlay {#030717, 0.3}`) would have been compared against the cream band at
y 800 and an `overlay` delta would be in the report. There is no overlay delta in
either stored iteration
(`storage/tmp/repro-console/repro-gigabytealchemy-ai/iteration-{1,2}/diff/values-diff.json`
— both carry the same two deltas and nothing else).

So the true behaviour today is:

- the only section-level comparison ever made against an L1 reproduction is
  reference `§0` against the whole-page wrapper;
- `§1 … §n` hit `if (!as) continue` and are **silently skipped** — `overlay`,
  `contentAnchor` and `textAlign` are unevaluated axes, not mispaired ones;
- the one delta produced is a false positive by construction, and it is frozen:
  identical in iteration 1 and iteration 2, unfixable by changing the
  reproduction, and re-presented every round as work to do.

## Scoped behaviour

Join sections by geometry and be honest when they cannot be joined at all. This
ticket does **not** change what the reproduction extracts — giving an L1 render
real section bands is a separate, larger piece of work (see "Deliberately out of
scope" below), so the outcome here is that the false delta disappears and the
blindness is stated rather than hidden.

1. **Pair by vertical overlap, not by ordinal.** Both sides carry
   `SectionValues.box` in the same full-page document coordinate space. Two
   sections pair when their vertical intervals overlap by at least half their
   union (vertical IoU ≥ 0.5) — sections are full-bleed bands, so the vertical
   interval is what distinguishes them. Pairing is one-to-one: candidate pairs
   are taken best-overlap-first, and a section already paired is not re-used.
   The reference's absolutely-positioned header (`§0`, y 0…192) therefore does
   **not** pair with a hero band spanning y 0…800 (IoU 0.24), while a hero that
   reproduces at the same geometry pairs at IoU ≈ 1.

2. **A reference section with no overlapping counterpart is reported, not
   compared.** It is recorded as unpaired instead of being compared against
   whatever shares its index. The reference's header strip having no band in the
   reproduction is the interesting fact; the ordinal join converted it into a
   0.16 anchor difference.

3. **A reproduction that segments into one body-spanning band reports that
   section values are NOT COMPARABLE.** When the actual manifest carries exactly
   one section whose band vertically covers the full extent of the
   reproduction's own elements, and the reference carries more than one, no
   section values are compared and no per-section unpaired rows are emitted:
   there is a single stated reason instead. Eight unpaired rows saying nothing
   but "this is a flat L1 render" would be louder noise than the false delta
   they replace.

4. **Pairing stays visible in the report.** `values-diff.json` reported `§0` in
   `deltas` but carried nothing describing what either side's section actually
   was. The report now carries, per reference section, its label and band box,
   the repro band it paired with (label + box) or null, and the overlap
   fraction — plus the not-comparable reason when it is set. The human
   `formatReport` output gains a matching block.

5. **Sections without geometry keep the ordinal join.** Geometry pairing needs
   `box` on every section of both sides. A pre-REQ-88 manifest (and a fixture
   built without boxes) has none, so the old ordinal join is kept as the
   documented fallback rather than silently comparing nothing.

6. **Paired sections diff exactly as before.** `overlay`, `contentAnchor` and
   `textAlign` are compared with the same tolerances on sections that do pair —
   this ticket changes *which* two sections are compared, never how.

7. **Exit semantics are unchanged.** An unpaired section and a not-comparable
   verdict are report facts, not deltas: they do not enter `deltas`, do not
   count toward the gate's delta count, and do not make `1c values-diff` exit
   non-zero. A segmentation difference is not by itself a fidelity defect, and a
   permanent diagnostic row would make a clean page fail forever.

As a technical consequence of (1) and (5): `SectionValues.box`'s doc comment
still says "Present iff `backgroundImageUrl` is", which REQ-88 made untrue on
both projection paths. The geometry join depends on that field, so the comment
is corrected to match the code.

**Expected result on the evidence above:** the `§0 contentAnchor`
`bottom (0.66)` vs `center (0.50)` delta is gone; the report states that the
reproduction segments into one body-spanning band, so the reference's 8 sections
have no bands to compare against.

## Deliberately out of scope

- **Giving an L1 reproduction real section bands.** The structural fix is to
  derive the repro's bands from painted full-bleed backdrops (`backdropBoxes()`
  already finds exactly the `section-band-*` / `section-bg-0` boxes but emits
  them as *fields*), which additionally requires `overlayOf` and `anchorRatioOf`
  to work by box containment rather than DOM descent — in a flat L1 tree the
  scrim and the text runs are siblings of the band box, not its children. That
  is the REQ-88 / BUG-20 surface-chain treatment applied at the section layer,
  and it is its own ticket. Until it lands, section-level fidelity against an L1
  reproduction is unmeasured — which is precisely what (3) now says out loud.
- **A `§n` card in `objects`.** `ObjectCard` / `buildObjectCard` are typed on
  `ValueElement` and bucketed by `ObjectKind` (`text | image | control |
  divider`); a section is neither. The readability complaint is answered by (4)
  instead.