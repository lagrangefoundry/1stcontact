---
uid: bug-8fef172e
id: BUG-110
type: bug
title: 'gate: the verdict is decided by the perceptual floor alone, so 13 HIGH semantic
  deltas still report pass'
created_by: repro-console:repro-gigabytealchemy-ai#3
created_at: '2026-09-18T02:08:33.305770+00:00'
updated_at: '2026-09-18T02:08:33.305770+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-bfb31b12
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