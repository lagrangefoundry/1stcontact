---
uid: bug-edb865dc
id: BUG-111
type: bug
title: 'values-diff / gate: a reference section with no reproduction band is reported
  nowhere the gate reads'
created_by: repro-console:repro-gigabytealchemy-ai#3
created_at: '2026-09-18T02:09:05.808092+00:00'
updated_at: '2026-09-18T05:15:31.208108+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-e0a7ae41
  commits:
  - working_sha: 6873817c340c92b080f2fcde8ec8172c23be1a05
    reconcile_sha: null
    main_sha: null
  - working_sha: 84f9d3e45d6aae94ad2d02eccbe4dbaab44ac705
    reconcile_sha: null
    main_sha: null
  version: 0.2.257
  story_points: 3
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

---

## What landed

All three numbered items above, plus the consequences they force. An unpaired
band is **counted, never escalated** — the verdict ladder is untouched, exactly
as the scope above says.

### 1. `ValuesDiffReport` carries the counts, on both sides

Two new required fields, derived from the same pairing pass that builds
`sectionPairing` so a count can never disagree with the rows it summarises:

- **`unpairedSections`** — reference sections no reproduction band overlapped.
- **`unpairedActualSections`** — the repro-side mirror: bands no reference
  section paired to. This side was visible **nowhere at all**, not even in
  `sectionPairing`, which only ever had a row per *reference* section. The
  reference-side count alone would read as "the reproduction has fewer bands",
  which a page that segments *differently* rather than more coarsely does not
  do — this reproduction has seven bands to the reference's eight and could
  equally have had nine.

Each entry is an **`UnpairedSection`** (`{ label, box? }`), newly exported —
item 3's geometry, so a reader can locate the band without going back to
`sectionPairing` to look it up.

Both lists are **empty under BUG-102's flat-L1 verdict**
(`sectionsNotComparable`): that reason stands in for the whole per-section pass,
and eight "unpaired" rows underneath it would be louder noise than the single
line above them. The one repro band in that case is not "extra" — it is the
reason.

### 2. `gate-core.ts` carries them to the gate, and the pass rung says so

`GateReport.values` gains `unpairedSections` and `unpairedActualSections` as
counts. `ReconcileInput.values` asks for both as `readonly unknown[]`,
**required rather than optional**, for the two reasons BUG-106 gives for
`unpairedActual`: countable-only so a caller with no such type can still satisfy
it, and required because the defect being fixed *is* a fact the type made
impossible to carry.

The pass rung gains **one** rung, not two. The two counts are the same fact seen
from either side — the pages segment differently — and splitting them would put
two near-identical lines in a list whose whole value is that an operator skims
it. It names whichever sides are non-zero and ends with what the count costs:
those bands' section-level values (overlay, contentAnchor, textAlign) are
UNMEASURED rather than clean.

### 3. Consequences beyond the three items

- **`formatGateReport` prints it.** The operator report is the other consumer of
  `GateReport`, and every count on its `values-diff` line is about *elements* —
  a band with no counterpart is invisible in all of them. A row is emitted under
  that line when either count is non-zero, alongside the existing
  `sectionsNotComparable` row.
- **`formatReport` (`1c values-diff`) reads the new fields instead of
  re-deriving them.** It already printed the reference side, computed inline
  from `sectionPairing`; it now reads `report.unpairedSections` so its text and
  the gate's rung cannot drift apart, and prints the repro side too, which it
  never named.
- **The AI fidelity surface documents them.** `check_fidelity` returns
  `report.values` verbatim, so the new keys reach a model with no prose saying
  what they mean. `ai/fidelity-surface.json`'s `fidelity_report.values` entry
  now names both and says what a non-zero count costs.
- **A reproduction manifest carrying *no* bands now reports every reference
  section as unpaired.** That follows directly from the definition — with
  nothing to pair against, nothing pairs — and it corrected one BUG-106 fixture
  that was asserting an *earned* silence (`a_genuinely_silent_pass_still_says_
  nothing_outstanding`) while emitting no repro bands at all. Its
  `actualManifest(…, flat: false)` helper now mirrors the reference's bands one
  for one, so the section pass is genuinely clean and BUG-106's AC — that a run
  with comparable sections still reads exactly as it did — is pinned by a
  fixture that actually meets it. BUG-106's intent is unchanged; only its
  fixture was wrong.

### Test plan

`tests/test_UAT_FC_BUG-111_unpaired_section_reaches_the_gate.test.ts` — 11 UATs
at two levels, because the fact has to survive two hops:

**`diffManifests`** (the real gigabytealchemy geometry, transcribed as BUG-102's
suite transcribes it): the counts exist on both sides with their boxes; they
agree with the `sectionPairing` rows they summarise; the repro side is counted
symmetrically; two sides that segment identically report nothing (the counts are
earned, not decorative); flat-L1 stays a single reason rather than eight counts;
the printed values report names both sides.

**`cmdGate`** (the ticket): driven through the real command over a synthetic
bundle via the same offline seams BUG-100/BUG-106 use — a pre-shot actual PNG
and a pre-extracted actual manifest, no headless browser, nothing we own
mocked. Three reference bands against a reproduction that renders all three
headings but segments into two: every element pairs, the eye is quiet, the
verdict is `pass`, and the middle band was compared by nothing. The UATs pin
that `gate.json` carries the count, that the pass rung names it and points at
`values.unpairedSections`, that the repro side gets the same rung, that a run
whose bands all pair still reads "Nothing outstanding from this gate.", and that
the operator report prints it.

Regression scope run green: the 20 values-diff / gate / fidelity / surface
suites (BUG-100, BUG-102, BUG-103, BUG-106, BUG-107, REQ-31/32/33/35/45/47/48/
49/51/53/58/63/94/157/219/228/254/270/271, `reconcile-values-diff-*`,
`reconciliation-cross-gate-reconciliation`, `bug15-values-diff-l1-flat-dom`),
plus `tsc --noEmit -p tools/generate/tsconfig.json` clean.