---
uid: bug-c78f4cdd
id: BUG-148
type: bug
title: 'perceptual/region ranker: the top lead is the band, not the run, and only
  one side can offer a band as an element'
created_by: repro-console:repro-gigabytealchemy-ai#7
created_at: '2026-09-25T21:46:49.867054+00:00'
updated_at: '2026-09-25T23:24:27.525707+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  defect_class:
  - instrument-blind
  - instrument-asymmetric
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-1484c6f5
---

# perceptual/region ranker: the top lead is the band, not the run, and only one side can offer a band as an element

Filed by `repro-console:repro-gigabytealchemy-ai#7`, iteration 7 of the reproduction of
https://gigabytealchemy.ai. Artifacts:
`/Users/martin/lagrangefoundry/1stcontact/storage/tmp/repro-console/repro-gigabytealchemy-ai/iteration-7/diff/`.

This is a defect in the instrument, not in the reproduction engine. It is filed separately from
this round's gap ticket (REQ-324) as §5 of the round brief requires. It is worth having because
it is what made REQ-324's two residuals invisible in the round's own digest: the +4px horizontal
shift of 23 runs — 100% of the ranked region score — is named by none of the twelve one-line
region summaries, and finding it took reading both manifests element by element.

`defect_class`: **`instrument-blind`**, **`instrument-asymmetric`**.

Two issues, the second smaller and dependent on the first.

---

## Issue 1 — the lead order puts a 1257px band above the 32px run that is the subject

**`defect_class`: `instrument-blind`** — the ranker measured the right thing and then reported the
lead that says least about it. The test below reads `regions.json` and finds the top lead on the
reference side has `overlap.ofNode ≤ 0.02` in 9 of 12 regions, so the phrase the digest prints for
those regions ("section (100% of region)") is true and carries no information.

### The test I ran

Over `iteration-7/diff/regions.json`, for each region and each side, the top lead's
`overlap.ofNode` and the index of the first lead whose `ofNode ≥ 0.5`:

```
region  1  ref top ofRegion 1 ofNode 0.01 kind section   | first informative lead at index 1
region  2  ref top ofRegion 1 ofNode 0.02 kind section   | index 1
region  3  ref top ofRegion 1 ofNode 0.64 kind element   | index 0
region  6  ref top ofRegion 1 ofNode 0.01 kind section   | index 1
region  7  ref top ofRegion 1 ofNode 0.00 kind section   | index 1
region  9  ref top ofRegion 1 ofNode 0.00 kind section   | index 1
region 12  ref top ofRegion 1 ofNode 0.00 kind section   | index 1
```

9 of 12 regions on the reference side lead with a `kind: "section"` whose `ofNode` is 0.00–0.02.

Region 1 in full, from `regions.json`, `bbox {"x": 128, "y": 2512, "w": 448, "h": 32}`,
`score 3366.21`:

```json
"ref": [
  {"kind":"section","index":4,"role":"section",
   "box":{"x":0,"y":1882,"w":1280,"h":1257.25},"overlap":{"ofRegion":1,"ofNode":0.01}},
  {"kind":"element","index":29,"text":"XGD (Extreme Generative Development)","role":"subheading",
   "box":{"x":124,"y":2515.25,"w":448.44,"h":32},"overlap":{"ofRegion":0.89,"ofNode":0.89}}
]
```

The subheading IS the region — same width, same height, 3px of vertical offset — and it ranks
second behind a band that explains 1% of itself.

### Why the documented invariant does not hold

`regionNodeLeads` (`tools/generate/src/cli/perceptual-core.ts:441`) sorts

```ts
leads.sort((a, b) => b.overlap.ofRegion - a.overlap.ofRegion || b.overlap.ofNode - a.overlap.ofNode)
```

and its own doc comment (perceptual-core.ts:389-395) asserts:

> The tie-break is what keeps a section band BELOW the run standing on it: both contain the region
> entirely (`ofRegion` 1), and the band is the larger of the two by orders of magnitude, so the run
> wins on `ofNode`.

That is only true when the run's `ofRegion` is *also* exactly 1. It is not, and it structurally
cannot be in the common case: `regions.json` carries `"blockPx": 16`, so a region's bbox is snapped
to a 16px block grid, while manifest boxes sit at the browser's fractional coordinates — every run
in this page's y range is at `.25` (2151.25, 2515.25, 2607.25, 2923.25). Region 1 vs the
subheading: x overlap 444.44/448 = 0.992, y overlap 28.75/32 = 0.898, product 0.891 → `ofRegion`
0.89. The band's is 1. The first comparator decides it and the tie-break never runs.

So the invariant holds only for a run that happens to be block-aligned, and the case the comment
says it handles — "they only surface first where there is no element to beat them" — is in fact
the normal case.

### The harm, concretely

`formatDiffReport` (`tools/generate/src/cli/perceptual.ts:425`) prints `r.nodes.ref[0]` and
`r.nodes.actual[0]` and nothing else, and the console's `evidence-digest.md` reproduces it. This
round's digest therefore reads, for 9 of its 12 regions:

```
#1 (128, 2512) 448×32 · score 3366.21 · mean 88.58
   under it — ref: section (100% of region) · ours: “What We're BuildingFrom personal reflection
   tools to developer platforms, our wo…” (100% of region)
```

Three of twelve regions named the actual subject. The round brief tells a reader that
`nodes.ref[]`/`nodes.actual[]` are ordered best-first and that a region record is quotable as text
without opening its crop — which is right, and is exactly why the order being wrong is expensive.
BUG-99's comment on perceptual.ts:421-424 says the top lead of each side is "the most informative
thing this report can say"; today, nine times out of twelve, it is the least.

Note that the sibling `readout` block added by REQ-302 did its job on the very same regions:
region 1 carries `"deltaRgb": [-0.33, -0.31, -0.27]` against `"meanAbsDiff": 58.51`, which is
precisely "the glyphs moved, the colour did not". The defect is in the lead order alone.

### Proposed change

Rank by how much of the disagreement the node explains *and* how specifically it explains it —
`ofRegion * ofNode` descending is the one-line version and it gives the right answer on every
region here (region 1: run 0.89×0.89 = 0.79 vs band 1×0.01 = 0.01). If the product is felt to be
too blunt, the equivalent is to keep the current sort but demote any lead whose `ofNode` is below
a floor (0.1, say) beneath every lead above it, which preserves the stated intent — a band surfaces
where there is genuinely no element to beat it — while making it true.

Either way, update the doc comment: the tie-break as written is unreachable for a run that is not
block-aligned, and the next reader should not have to re-derive that.

### How to see it

```bash
cd /Users/martin/lagrangefoundry/1stcontact
python3 - <<'EOF'
import json
p = 'storage/tmp/repro-console/repro-gigabytealchemy-ai/iteration-7/diff/regions.json'
for i, r in enumerate(json.load(open(p))['regions'], 1):
    for side in ('ref', 'actual'):
        L = r['nodes'][side]
        top = L[0]
        best = next((j for j, n in enumerate(L) if n['overlap']['ofNode'] >= 0.5), None)
        print(i, side, 'top kind', top['kind'], 'ofNode', top['overlap']['ofNode'],
              '| first ofNode>=0.5 at index', best)
EOF
```

**Wrong (today):** `1 ref top kind section ofNode 0.01 | first ofNode>=0.5 at index 1`, and the
same shape on 8 more regions.

**Right:** every region whose list contains a lead with a high `ofNode` leads with it —
`1 ref top kind element ofNode 0.89 | first ofNode>=0.5 at index 0`.

Regenerating the region record needs a browser:

```bash
CHROMIUM_LAUNCH_ARGS=--single-process ./bin/1c gate repro-gigabytealchemy-ai \
  --ref /Users/martin/lagrangefoundry/1stcontact/storage/references/gigabytealchemy.ai/index --sandbox
```

but the fix is checkable against the committed `regions.json` above without one, because the
ranking is a pure function of the `nodes` arrays it already holds.

---

## Issue 2 — the actual side can offer a band as an element and the reference side cannot

**`defect_class`: `instrument-asymmetric`** — the test below shows the two `nodes` arrays of the
same region are built from element lists of different kinds: `actual-manifest.json` carries 6
whole-band `role: "generic"` aggregates and `expected-manifest.json` carries none, so a "the two
sides name different things" reading of any region is partly the instrument's own.

### The test I ran

```
expected-manifest.json  59 elements, roles: action, body, heading, link, subheading, textbox
actual-manifest.json    65 elements, roles: action, body, generic, heading, link, subheading, textbox
```

The six extra are all `role: "generic"`, all exactly a section band, all carrying that band's
concatenated text:

```
[ 4] generic {"x":0,"y":0,   "w":1280,"h":800}  "Gigabyte AlchemyIntentional SoftwareTools for cl…"
[ 9] generic {"x":0,"y":800, "w":1280,"h":488}  "A Different ApproachMost apps are designed to ca…"
[19] generic {"x":0,"y":1288,"w":1280,"h":594}  "Our MissionOur work is guided by a simple belief…"
[45] generic {"x":0,"y":1882,"w":1280,"h":1257} "What We're BuildingFrom personal reflection tool…"
[51] generic {"x":0,"y":3139,"w":1280,"h":549}  "The AlchemyOur name isn't accidental. Alchemy, a…"
[64] generic {"x":0,"y":4260,"w":1280,"h":116}  "© Gigabyte Alchemy 2025LinkedInGitHub"
```

There is no expected-side element with no actual-side counterpart. These six appeared with
BUG-142's containment nesting (`8ecd455d16`, `1a9983de64`): the reproduction now has container
nodes where the reference capture has only `sections`.

`values-diff` already handles them correctly and deliberately — `isBandPaint` drops them before
the unpaired tally (`tools/generate/src/cli/capture/values-diff.ts:2949-2953`, REQ-271), and
`gate.json` duly reports `values.unpairedActual: 0`. **That part is not the defect.** The defect is
that `regionNodeLeads` is handed `source.elements` unfiltered
(perceptual-core.ts:421-431), so the same six become element leads on one side only.

The effect, over this round's twelve regions: the top lead is `kind: "section"` on the reference
side in 9 of 12 and `kind: "element"` on the actual side in **12 of 12** — because the actual side
always has a generic aggregate whose `ofRegion` is 1 and whose `kind` outranks nothing, while the
reference side only has the section record. The digest then prints `ref: section · ours: "What
We're Building…"` and reads as though the two sides disagree about what is there. They do not.

### Proposed change

Apply the same `isBandPaint` filter (or the `role === 'generic'` test, if the band predicate is
awkward to reach from `perceptual-core.ts`) to the element list before building leads, so both
sides offer a band only through `kind: "section"`. This is smaller than issue 1 and mostly
subsumed by it — with the product ranking of issue 1 the aggregates fall to the bottom on their
own `ofNode` — but the two sides should still be built from like lists, because "a lead on one
side and nothing on the other is usually the whole finding" is advice a round is given and it
should be safe to follow.

### How to see it

```bash
cd /Users/martin/lagrangefoundry/1stcontact
python3 - <<'EOF'
import json, collections
d = 'storage/tmp/repro-console/repro-gigabytealchemy-ai/iteration-7/diff/'
for f in ('expected-manifest.json', 'actual-manifest.json'):
    els = json.load(open(d + f))['elements']
    print(f, len(els), dict(collections.Counter(e.get('role') for e in els)))
r = json.load(open(d + 'regions.json'))['regions']
print('ref top kinds   ', collections.Counter(x['nodes']['ref'][0]['kind'] for x in r))
print('actual top kinds', collections.Counter(x['nodes']['actual'][0]['kind'] for x in r))
EOF
```

**Wrong (today):**

```
expected-manifest.json 59 {... no 'generic' ...}
actual-manifest.json   65 {... 'generic': 6 ...}
ref top kinds    Counter({'section': 9, 'element': 3})
actual top kinds Counter({'element': 12})
```

**Right:** the `generic` count is absent from the leads either side, and `ref top kinds` and
`actual top kinds` agree region for region.