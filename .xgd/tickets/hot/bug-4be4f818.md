---
uid: bug-4be4f818
id: BUG-103
type: bug
title: 'values-diff / gate: the reproduction-side value manifest is computed and discarded,
  with no flag to write it'
created_by: martin-github@westhead.me
created_at: '2026-09-17T02:59:38.410536+00:00'
updated_at: '2026-09-20T18:54:53.705336+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: medium
  priority: medium
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-1ad0ba73
  commits:
  - working_sha: f5b819a8d3dd556c0fcb86b1660621035b5b9af0
    reconcile_sha: null
    main_sha: null
  - working_sha: ceb78ba93701944ed858f40accf4ddfdead7f74c
    reconcile_sha: null
    main_sha: null
  version: 0.2.237
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

**Companion:** **BUG-102** is the delta this blocked a round from closing
(`values-diff` joins section-level values by ordinal index). **BUG-101** is why
the commands above redirect `1c page get` to a file rather than piping it.


---

## Scope for the fix (agreed 2026-09-17, after reading the code)

### Three corrections to the report above

**1. The failure is silent, not an error.** `1c`'s argv parser
(`tools/generate/src/cli/args.ts`) is permissive — any `--x value` lands in
`flags` and nothing validates the set — so `1c values-diff … --actual-out
/tmp/actual.json` today exits **0**, prints a normal report, and writes no file.
The "Wrong result (now)" above should read: the run looks clean and `/tmp` stays
empty.

**2. The reference side is derived and discarded too, and the §0 question needs
both sides.** On the default (no `--size`) path the expected manifest is
`flattenCapture(readCapture(bundle))` — a projection computed in-process, not a
stored artifact. Only `--size` / `--multi-viewport` take the reference from
persisted `multistate.json` projections. And the two sides are not the same kind
of list: `flattenSignals`' own docstring says the reproduction's sections come
from the **raw, uncoalesced** bands while the capture's are **coalesced**, with
only index 0 guaranteed to correspond. So a round holding only the reproduction's
section list still cannot tell a misplaced hero from a band-count mismatch. The
fix writes **both** manifests.

**3. The reproduction screenshot is discarded the same way, one file over.**
`cmdDiff` (`cli/perceptual.ts`) shoots the reproduction into a `mkdtemp`
scratch directory and `rmSync`s it in a `finally`, then persists the path it just
deleted as fact. `iteration-2/diff/regions.json` records
`"actual": "/var/folders/…/T/req38-diff-HQ40UY/actual.png"`, which does not
exist. The per-region `-ours.png` crops survive; the full reproduction raster
does not, so a round cannot crop an area the region ranker did not pick and
cannot re-run `1c diff --actual` offline. It is the same defect in the same
artifact set — the perceptual half of the offline seam is one-way for the same
reason the value half is — and it is fixed here rather than filed again.

### What this ticket changes

- `1c values-diff` gains `--actual-out <manifest.json>` and
  `--expected-out <manifest.json>`. Each writes the manifest that side of the
  comparison actually used, in the same serialised shape `--actual` already
  accepts as input, so the offline re-diff path round-trips.
- `1c diff` gains `--actual-out <png>`: the reproduction screenshot it shoots is
  kept at that path instead of being deleted with the scratch directory, and
  `regions.json`'s `actual` field names a file that exists.
- `1c gate` needs no new flag. When it is given `--out <dir>` it writes
  `actual-manifest.json`, `expected-manifest.json` and `actual.png` into that
  directory beside `values-diff.json`, `regions.json` and `gate.json`,
  unconditionally. This is what puts the evidence in the reproduction console's
  iteration directory, since the console already runs `1c gate … --out <diff>`.
- The round brief's "Where the evidence is" list names the three new files, or
  rounds will not know they exist.
- Writing happens whether or not the side was supplied from disk. Feeding
  `--actual <in.json> --actual-out <out.json>` copies the input rather than
  skipping the write, so the flag means the same thing on every path and the
  round-trip claim holds without a caveat.
- `--multi-viewport` is **out of scope**: its actual side is a whole
  `MultiStateCapture` across the ladder, not one manifest. Combining it with
  `--actual-out` / `--expected-out` is rejected with an error naming the
  single-width and `--size` paths, rather than silently ignored — silent
  ignoring of an unrecognised flag is what made correction 1 above possible.

### How to know it is fixed (replaces the check above)

```
REF=/Users/martin/lagrangefoundry/1stcontact/storage/references/gigabytealchemy.ai/index
CHROMIUM_LAUNCH_ARGS=--single-process ./bin/1c values-diff repro-gigabytealchemy-ai \
  --ref $REF --sandbox --actual-out /tmp/actual.json --expected-out /tmp/expected.json
```

Both files exist; each has a `sections` array; the reproduction's section count,
band boxes and `contentAnchorRatio`s can be read beside the reference's, so the
`§0` `contentAnchor` delta can be argued from evidence on both sides. Feeding
`/tmp/actual.json` back through `--actual` reproduces the same report with no
browser. After a gate run with `--out`, the three files are in the iteration's
`diff/` directory and `regions.json`'s `actual` path exists on disk.