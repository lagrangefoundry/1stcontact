---
uid: bug-edb865dc
id: BUG-111
type: bug
title: 'values-diff / gate: a reference section with no reproduction band is reported
  nowhere the gate reads'
created_by: repro-console:repro-gigabytealchemy-ai#3
created_at: '2026-09-18T02:09:05.808092+00:00'
updated_at: '2026-09-18T02:09:05.808092+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
---

Found by loop 1, iteration **3** of `repro-gigabytealchemy-ai` against
`storage/references/gigabytealchemy.ai/index`.

**Residual class:** `unpaired-reference-section-is-reported-nowhere-the-gate-reads`

A reference section that no reproduction band overlaps is, by BUG-102's design,
"a segmentation mismatch, not a value delta" — so it produces no delta. That
classification is right. The defect is that it then produces **nothing else
either**: no count, no coverage finding, no rung on the pass-report's
`outstanding` list. The fact exists only inside `values-diff.json`'s
`sectionPairing` array, which `gate.json` does not summarise and no consumer of
the gate reads.

On this run the reference has **8** sections and the reproduction **7**, and
`1c gate` says `"unmatched": 0`, `"coverage": {"findings": []}`,
`"verdict": "pass"`.

## Evidence — from this round's own artifacts

`storage/tmp/repro-console/repro-gigabytealchemy-ai/iteration-3/diff/values-diff.json`:

```
$ jq -c '.sectionPairing[]|select(.actualLabel==null)' .../diff/values-diff.json
{"label":"§0","box":{"x":0,"y":0,"width":1280,"height":192},"actualLabel":null,"overlap":0}
```

The counts:

```
$ jq '.sections|length' .../diff/expected-manifest.json   # 8
$ jq '.sections|length' .../diff/actual-manifest.json     # 7
```

What §0 carries and therefore what goes uncompared:

```
$ jq -c '.sections[0]' .../diff/expected-manifest.json
{"index":0,"overlay":null,"contentAnchorRatio":0.66,"textAlign":"left","box":{"x":0,"y":0,"width":1280,"height":192}}
```

And what the gate reports for the same run:

```
$ jq -c '{pass, verdict, values, coverage:{findings:.coverage.findings, sections:.coverage.sections}}' .../diff/gate.json
{"pass":true,"verdict":"pass","values":{"deltas":14,"matched":59,"unmatched":0,"unpairedActual":7},"coverage":{"findings":[],"sections":8}}
```

`unmatched: 0` is true on its own terms — its doc comment
(`gate-core.ts:169–174`) says it counts unpaired *expected objects*, meaning
elements — but read next to `coverage.sections: 8` it states that all 8 sections
were accounted for, and one was not.

## Where it is

`tools/generate/src/cli/capture/values-diff.ts:2983`:

```ts
    sectionPairing.push({ label, box: es.box, actualLabel: as ? `§${as.index}` : null, actualBox: as?.box, overlap: match?.overlap ?? 0 })
    if (!as) return          // <- the only thing that ever happens to an unpaired section
```

`tools/generate/src/cli/gate-core.ts:415–437` — the pass rung's `outstanding`
list has a rung for `deltas > 0`, one for `unpairedActual > 0`, one for
`notComparable`, one for `coverage.findings.length`. There is no rung for an
unpaired expected section, and `GateReport.values` has no field to carry the
count even if one were added.

## The case this hides, on this very bundle

Reference §0 is the 192px header band. The page's `<header>` is
`position: absolute` over the hero (`raw.html`:
`<header class="absolute top-0 left-0 right-0 z-40">`), so it overlaps §1 and is
an overlapping band. The reproduction has no separate band for it — its §0 is
the 0–800 hero. BUG-102's own comment names exactly this page as the reason the
ordinal join was replaced, so the unpairing is expected and correct; what is not
correct is that a whole reference band with its own `contentAnchorRatio: 0.66`
and `textAlign: "left"` disappears from the report without a trace.

It is also not free: merging the header into the hero band changes the run
population the hero's anchor is measured over — reference §1 `0.53` against
reproduction §0 `0.39` — which is the 0.14 phantom anchor gap **REQ-270 issue 4**
already describes, 0.01 under the tolerance that would fire.

## Proposed change

Carry the fact up to the gate and make it visible on the pass rung:

1. In `values-diff.ts`, count unpaired expected sections (and, symmetrically,
   reproduction bands no reference section paired to) and expose them on
   `ValuesDiffReport` alongside `unpairedActual`.
2. In `gate-core.ts`, surface them in `GateReport.values` and add a rung to the
   pass-report's `outstanding` list, in the same shape as the existing
   `unpairedActual` rung: *"N reference section(s) had no reproduction band to
   compare against (`values.unpairedSections`)"*.
3. Include the unpaired section's box in the record so a reader can locate it,
   as `sectionPairing` already does.

Whether an unpaired section should also affect the verdict is BUG-110's
question, not this one.

## How to see it, and how to know it is fixed

```
ITER=/Users/martin/lagrangefoundry/1stcontact/storage/tmp/repro-console/repro-gigabytealchemy-ai/iteration-3

jq -c '.sectionPairing[]|select(.actualLabel==null)' $ITER/diff/values-diff.json
jq -c '{values:.values, coverageSections:.coverage.sections, nextStep:.nextStep}' $ITER/diff/gate.json
```

**Wrong (today):** the first prints one unpaired reference section
(`§0`, `1280x192`, `overlap: 0`); the second prints
`"values":{"deltas":14,"matched":59,"unmatched":0,"unpairedActual":7}` and a
`nextStep` that names the 14 deltas and the 7 unpaired repro objects and says
nothing about the missing section.

**Right (fixed):** `gate.json` carries the unpaired-section count in `values`,
and `nextStep` names it in its `outstanding` list alongside the other two.

To regenerate:

```
CHROMIUM_LAUNCH_ARGS=--single-process 1c gate repro-gigabytealchemy-ai \
  --ref /Users/martin/lagrangefoundry/1stcontact/storage/references/gigabytealchemy.ai/index --sandbox --json
```

(`1c gate` drives Chromium; without `CHROMIUM_LAUNCH_ARGS=--single-process` an
agent session dies at `bootstrap_check_in … Permission denied (1100)` before the
first frame. That is the sandbox, not a missing browser.)
