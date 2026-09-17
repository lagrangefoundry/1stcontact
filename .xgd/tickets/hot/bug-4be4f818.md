---
uid: bug-4be4f818
id: BUG-103
type: bug
title: 'values-diff / gate: the reproduction-side value manifest is computed and discarded,
  with no flag to write it'
created_by: martin-github@westhead.me
created_at: '2026-09-17T02:59:38.410536+00:00'
updated_at: '2026-09-17T02:59:38.410536+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  severity: medium
  priority: medium
  auto_merge_back: true
  needs_review: false
---

`1c values-diff` and `1c gate` compute a full value manifest for the
**reproduction** — every element's resolved colour, type, box, plus the
section-level values — and then discard it. What lands on disk is only the
deltas and the paired `objects`.

There is no way to get it back. `1c values-diff --help` lists
`--actual <manifest.json>` as an **input** (the offline re-diff path) and
`1c gate` lists `--actual-image <png> --actual-manifest <manifest.json>`, also
inputs. Neither command has a flag that **writes** the manifest it just built.

## Why it matters

A diagnosing round is told to work the value deltas, and for any delta whose
`expected` and `actual` are summarised rather than raw, it cannot see what the
reproduction side actually was.

Concretely, this round (loop-1 iteration 2 of `repro-gigabytealchemy-ai`) could
not close a section-level delta:

```json
{ "text": "§0", "role": "section", "property": "contentAnchor",
  "expected": "bottom (0.66)", "actual": "center (0.50)",
  "kind": "contentAnchor", "tier": "LOW", "magnitude": 0, "severity": 1040 }
```

`anchorLabel` (`values-diff.ts:1623–1626`) renders a ratio as a band name plus
two decimals, so `0.50` is all that survives. To decide whether that is a real
misplacement or an artifact of the ordinal section join (filed separately), a
round needs the reproduction's own section list — its count, each band's box,
each band's `contentAnchorRatio`. None of it is persisted, and re-deriving it
means re-running the browser and instrumenting the tool.

The `objects` array does not fill the gap: it carries text runs and controls
only. `values-diff.json` this round has 55 `objects` and not one of them is a
`§n`, even though `§0` appears in `deltas`.

## Proposed fix

Add `--actual-out <manifest.json>` to `1c values-diff` (and the equivalent to
`1c gate`, which already knows the path it is writing its other artifacts to).
It is the same serialised shape `--actual` already accepts as input, so it needs
no new type and it makes the offline re-diff path round-trip:

```
1c values-diff <slug> --ref <bundle> --actual-out /tmp/actual.json
1c values-diff        --ref <bundle> --actual    /tmp/actual.json   # identical report, no browser
```

Better still for the reproduction console: have the gate write it into the
iteration's `diff/` directory by default, next to `values-diff.json` and
`regions.json`. It is the one artifact in the set that describes the
reproduction rather than the comparison, and the whole loop is built on rounds
reading stored evidence rather than re-running instruments.

## How to know it is fixed

```
REF=/Users/martin/lagrangefoundry/1stcontact/storage/references/gigabytealchemy.ai/index
CHROMIUM_LAUNCH_ARGS=--single-process ./bin/1c values-diff repro-gigabytealchemy-ai \
  --ref $REF --sandbox --actual-out /tmp/actual.json
python3 -c "import json;d=json.load(open('/tmp/actual.json'));
print(len(d['sections']), [ (s['index'], s.get('contentAnchorRatio')) for s in d['sections'] ])"
```
(`values-diff` drives Chromium; without `CHROMIUM_LAUNCH_ARGS=--single-process`
an agent sandbox denies Chromium's Mach port registration and it dies with
`bootstrap_check_in … Permission denied (1100)` before the first frame.)

**Wrong result (now):** `error: unknown option --actual-out` — the manifest
exists only inside the process.
**Right result (fixed):** the reproduction's section list, so the `§0`
`contentAnchor` delta above can be read on both sides; and feeding the file
straight back through `--actual` reproduces the same report with no browser.

Found while diagnosing loop-1 iteration 2 of `repro-gigabytealchemy-ai`.
