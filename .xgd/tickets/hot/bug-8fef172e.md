---
uid: bug-8fef172e
id: BUG-110
type: bug
title: 'gate: the verdict is decided by the perceptual floor alone, so 13 HIGH semantic
  deltas still report pass'
created_by: repro-console:repro-gigabytealchemy-ai#3
created_at: '2026-09-18T02:08:33.305770+00:00'
updated_at: '2026-09-18T03:56:56.655050+00:00'
completed_at: null
last_field_updated: story_points
status: free_coded
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-bfb31b12
  commits:
  - working_sha: db4402de04dd8c9d0abdb9391bc87b8292b64517
    reconcile_sha: null
    main_sha: null
  - working_sha: 0d322e88de182622a48af7f604fa73031ed082c1
    reconcile_sha: null
    main_sha: null
  version: 0.2.260
  story_points: 3
---

Found by loop 1, iteration **3** of `repro-gigabytealchemy-ai` against
`storage/references/gigabytealchemy.ai/index`.

**Residual class:** `gate-verdict-ignores-values-diff-severity`

`1c gate` reduces three gates to one verdict, and the ladder that does it is
driven entirely by the perceptual floor and the L1 gate. **The value gate's
severity never reaches the verdict at all.** A reproduction that has lost every
heading and every link on the page passes, provided its pixels are close enough.

This is the sibling of **BUG-106**, which fixed the *prose* on the pass rung and
said so explicitly in a comment it left in place (`gate-core.ts:408`):

```
// THE LADDER IS UNCHANGED. Nothing here decides a verdict — a run that
// passed still passes. What changes is that it says what it did not measure.
```

That was the right call for BUG-106's scope. This ticket is about the ladder.

## Evidence — from this round's own artifacts

`storage/tmp/repro-console/repro-gigabytealchemy-ai/iteration-3/diff/gate.json`:

```json
{
  "pass": true,
  "verdict": "pass",
  "floor": { "mean": 8, "pct": 25 },
  "perceptualBreach": false,
  "l1Pass": true,
  "perceptual": { "meanDiff": 0.31, "pctOverThreshold": 0.1, "regions": 10 },
  "values": { "deltas": 14, "matched": 59, "unmatched": 0, "unpairedActual": 7 },
  "coverage": { "findings": [] }
}
```

`verdict: "pass"` — while the value gate on the same run reports:

```
$ jq '[.deltas[]|select(.tier=="HIGH")]|length' .../diff/values-diff.json
13
```

All 13 are `a11yRole`, `kind: "semantics"`, `tier: "HIGH"`, `severity: 3100`:

```json
{"text":"A Different Approach","property":"a11yRole","expected":"heading","actual":"generic","tier":"HIGH","severity":3100}
{"text":"Our Mission","property":"a11yRole","expected":"heading","actual":"generic","tier":"HIGH","severity":3100}
{"text":"LinkedIn","property":"a11yRole","expected":"link","actual":"generic","tier":"HIGH","severity":3100}
{"text":"GitHub","property":"a11yRole","expected":"link","actual":"generic","tier":"HIGH","severity":3100}
```

(11 headings, 2 links — the full list is in the artifact.) The reproduction has
**no document outline and no links at all**, and the gate's one-word answer is
`pass`.

## Where it is

`tools/generate/src/cli/gate-core.ts`:

```ts
 71: export const PERCEPTUAL_MEAN_FLOOR = 8
 72: export const PERCEPTUAL_PCT_FLOOR = 25
...
381:  const perceptualBreach = meanDiff > floor.mean || pctOverThreshold > floor.pct
382:  const deltas = input.values.deltas.length
...
390:  if (!input.l1Gate.pass) {          // -> structural-failure
...
395:  } else if (!perceptualBreach) {
396:    verdict = 'pass'                 // <- deltas are counted, never weighed
```

`deltas` is read on line 382 and used only to *narrate* the pass rung
(`gate-core.ts:415–419`, BUG-106's `outstanding` list). Every rung below `pass`
is unreachable once `perceptualBreach` is false, so no value-gate finding of any
severity can change the verdict.

## Why it matters here specifically

This loop's exit criterion is the gate. The round brief tells a diagnosing
session that `pass` means "there may be no gap this round. Say so — a round with
no gap is a real outcome." On this run that reading would have been wrong by 13
HIGH deltas, and the only thing that prevented it was BUG-106's prose rung
saying "this run is NOT silent" — a sentence, not a verdict. The next consumer
that branches on `pass` (an automated iteration loop, a rail baseline, a
promotion check) has no sentence to read.

## Proposed change

Give the value gate a floor of its own, echoed into the report exactly as the
perceptual floor is:

- add a `values` floor next to `PERCEPTUAL_MEAN_FLOOR` / `PERCEPTUAL_PCT_FLOOR`
  — e.g. "no `HIGH`-tier delta", or a worst-severity ceiling;
- in `reconcileGates`, treat a breach of it the same way `perceptualBreach` is
  treated, so a run with HIGH semantic deltas lands on `reproduction-wrong`
  rather than `pass`;
- echo the floor into `gate.json` (`floor.valuesTier` or similar) so it is never
  implicit, matching the existing `floor` contract.

A conservative first cut that changes no current behaviour except this class:
keep the ladder, but make `pass` conditional on `deltas.every(d => d.tier !==
'HIGH')`, and route the rest to `reproduction-wrong` with the existing
`nextStep` text.

## How to see it, and how to know it is fixed

```
ITER=/Users/martin/lagrangefoundry/1stcontact/storage/tmp/repro-console/repro-gigabytealchemy-ai/iteration-3

jq -c '{pass, verdict, floor, values}' $ITER/diff/gate.json
jq '[.deltas[]|select(.tier=="HIGH")]|length' $ITER/diff/values-diff.json
```

**Wrong (today):**

```
{"pass":true,"verdict":"pass","floor":{"mean":8,"pct":25},"values":{"deltas":14,"matched":59,"unmatched":0,"unpairedActual":7}}
13
```

**Right (fixed):** the same 13 HIGH deltas produce `"pass": false` and
`"verdict": "reproduction-wrong"`, and `floor` names the value-gate bound that
was breached.

To regenerate the report:

```
CHROMIUM_LAUNCH_ARGS=--single-process 1c gate repro-gigabytealchemy-ai \
  --ref /Users/martin/lagrangefoundry/1stcontact/storage/references/gigabytealchemy.ai/index --sandbox --json
```

(`1c gate` drives Chromium; without `CHROMIUM_LAUNCH_ARGS=--single-process` an
agent session dies at `bootstrap_check_in … Permission denied (1100)` before the
first frame. That is the sandbox, not a missing browser.)


---

## What changed (free-coded)

The value gate now has a **floor of its own**, held and echoed exactly as the
perceptual floor is. A run whose pixels are within the perceptual floor still
fails when the value gate reports a delta above that bound.

### The bound

`VALUES_TIER_FLOOR` in `tools/generate/src/cli/gate-core.ts`, next to
`PERCEPTUAL_MEAN_FLOOR` / `PERCEPTUAL_PCT_FLOOR`. It is a **severity-tier
ceiling** — the worst `SeverityTier` a passing run may carry — and it defaults to
`MEDIUM`, so `HIGH` and `CRITICAL` breach and nothing else does.

The line is where the existing tier table already draws it: `LOW` is tone
(colour, scrim, spacing) and `MEDIUM` is treatment (shape, border, weight) —
residual drift on a reproduction an operator would accept. `HIGH` and above is
structure: a lost heading, a link that is no longer a link, a wrong rendered
size, something absent. That keeps REQ-94's reason for the gate intact — `1c
values-diff` already exits non-zero on **any** delta, and a gate that did the
same would be a duplicate of it rather than the cross-gate reconciliation.

The ordering is read from `TIER_RANK` in `capture/values-diff.ts`, which is now
exported rather than copied: a second severity table in `gate-core.ts` could
silently disagree with the one the deltas were ranked by. A delta carrying a tier
the table does not know ranks `0` and cannot breach — the bound fails runs on
evidence, never on a value it could not classify.

### The ladder

`reconcileGates`'s rungs are otherwise unchanged:

- `pass` now requires **both** floors — `!perceptualBreach && !valuesBreach`.
- `capture-incomplete` is explicitly gated on the **perceptual** breach. Its
  whole diagnosis is that the eye sees a page-scale difference the value gates
  are BLIND to; a run whose pixels are clean and whose value gate *did* see the
  break is the opposite case. Under a breaching eye the rung order BUG-100 pins
  (coverage **before** the delta count) is untouched.
- `reproduction-wrong` now has two prose variants, because two different findings
  reach it. The both-eyes-agree text is unchanged. The values-only variant names
  the gate that failed the run, the worst tier present and the bound it broke,
  and says why the eye could not have seen it — a heading rendered as a generic
  box paints the same glyphs in the same place. When that run is also carrying a
  coverage finding, the next step names it (BUG-106's rule for facts a verdict
  does not turn on).
- `unexplained-disagreement` is unreachable from a value breach by construction
  (a value breach implies `deltas > 0`), so its text stays true.

### What the report now carries

- `floor.valuesTier` — the bound in force, `null` when the value gate is held to
  nothing. `PerceptualFloor` is renamed `GateFloor`: it is one object carrying
  every bound the verdict was decided against, and the name it had would have
  been a lie about the third one.
- `valuesBreach` — beside `perceptualBreach`.
- `values.worstTier` — the worst tier among the deltas, `null` when there are
  none. A **count** says nothing about severity: the run this ticket came from
  read `deltas: 14` on a page that had lost its entire outline, and 14 is also
  what fourteen slightly-off colours reads.
- The operator read prints the value bound on its own line beside the counts it
  is read against, in the same `✓ within` / `✗ over` form the perceptual floor
  uses.

### The dial

`1c gate --values-tier <CRITICAL|HIGH|MEDIUM|LOW|none>`, mirroring
`--mean-floor` / `--pct-floor`. `none` holds the value gate to nothing, which is
exactly the pre-BUG-110 behaviour — a caller that wants pixels to decide alone
says so explicitly rather than by being an older build. An unusable tier is
refused by name rather than silently ignored: a typo'd bound that reads as "no
bound" is this ticket's own defect.

### The assistant surface

`fidelity-surface.json` (`surface_version` 5 → 6): `check_fidelity` returns
`reconcileGates`' own report, so the new bound travels to an assistant whether or
not the declaration mentions it. The declaration now says what `pass` means (both
floors, not "the pixels matched"), what `floor.valuesTier` is, and that
`values.worstTier` is what the verdict was decided against — read it before the
count.

## Design decisions

**A tier ceiling, not "no HIGH delta".** The ticket's conservative first cut was
`deltas.every(d => d.tier !== 'HIGH')`. That leaves `CRITICAL` — absent content,
changed text, a visibly re-composed layout — passing, which is the same defect
one tier up. A ceiling is one comparison and closes the class.

**`capture-incomplete` stays a perceptual verdict.** The alternative was to let a
coverage finding outrank a value breach on every run. Rejected: if the pixels
agree, the reproduction paints what the reference paints, so an impoverished
manifest is not an explanation for the semantic deltas the value gate *did*
raise. The finding is reported in the next step instead of deciding the verdict.

**The bound is overridable.** The perceptual floor is a per-run dial because it
is provisional (DOC-21 §4); this one is provisional for the same reason, and the
symmetry is cheaper than an asymmetry that has to be explained.

## Supersession — AC-856 is narrowed

**AC-856** (`story-24098299`) reads: *"The value eye's delta count is reported as
evidence and never enters the verdict… a reproduction whose perceptual eye sits
within its floor and whose geometry gate passes is reported as passing even while
the value eye still reports deltas."*

The first half is intact and is why the bound is a tier ceiling rather than a
delta count: the **count** still never enters the verdict, and a run with forty
tonal deltas still passes. The second half is **narrowed to sub-floor deltas** —
a reproduction carrying a `HIGH` or `CRITICAL` delta no longer passes however
close its pixels are. BUG-110 is the later intent and supersedes AC-856 on that
point.

Its UAT (`test_UAT_AC856_…`) and the three neighbours whose fixtures reached the
pass rung through an **empty** reproduction manifest — `test_UAT_AC852_…`,
`test_UAT_AC855_…` (rung e), and REQ-94's
`test_UAT_FC_REQ-94_faithful_reproduction_passes_despite_value_deltas` — now
carry a reproduction that *has* the reference's run with one axis drifted
(a LOW-tier colour). That is the case those ACs are actually about — residual
drift on a page an operator would accept. An empty manifest is a CRITICAL
`presence` delta: a page with none of its content on it, which is the verdict
this ticket exists to correct.

**AC-853** is extended, not contradicted: the floor object it pins carries one
more bound, and its "the floor is never implicit" claim is what made
`floor.valuesTier` non-optional.

## Test plan

New: `tests/test_UAT_FC_BUG-110_gate_weighs_value_severity.test.ts` — 11 UATs
driving the real `1c gate` (`cmdGate`, and `cli.run(['gate', …])` for exit
status) through the offline `--actual-image` / `--actual-manifest` seams. No
headless browser; nothing we own is mocked.

- **the ticket's own run**: eleven headings and two links reproduced as `generic`,
  byte-identical screenshots — 13 HIGH `semantics` deltas read back off the run's
  own `values-diff.json` exactly as the ticket's `jq` line reads them, and the
  verdict is `reproduction-wrong`. (The semantic axis is only comparable from the
  ladder projection, so these probes run `--size desktop`; a single-width
  `capture.json` content run carries no `a11yRole` field at all.)
- the values-only diagnosis names the gate, the tier and the bound, and does
  **not** claim both eyes agree;
- a CRITICAL delta fails it too — the bound is a ceiling, not one tier;
- sub-floor deltas (LOW colour + MEDIUM weight) still pass and are still
  enumerated with `values-diff` named as their home;
- a clean run reports `worstTier: null`, not a floor value standing in;
- the bound is in `gate.json` on disk and on its own line in the operator read,
  on both a failing and a passing run, with the perceptual mark untouched;
- the bound loosens (`CRITICAL` → the same run passes), switches off (`null` →
  the pre-BUG-110 verdict), and the default is neither;
- the CLI exit status follows the value breach, `--values-tier none` restores the
  old status, and an unusable tier is refused by name;
- the ladder is intact both ways: a breaching eye with suspect coverage still
  reads `capture-incomplete`, and a values-only breach carrying a coverage
  finding reads `reproduction-wrong` while still naming the finding.

Regression scope: `tests/req94-cross-gate-reconciliation.test.ts`,
`tests/reconciliation-cross-gate-reconciliation.test.ts`,
`tests/test_UAT_FC_BUG-100_coverage_background_images.test.ts`,
`tests/test_UAT_FC_BUG-106_gate_reports_what_it_measured.test.ts`,
`tests/test_UAT_FC_REQ-157_fidelity_surface.test.ts`, plus the full suite.