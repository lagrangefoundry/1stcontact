---
uid: bug-d4a790a5
id: BUG-178
type: bug
title: 'gate: unmeasured reports 0 while the capture audit lists 7 used-but-not-expressible
  properties'
created_by: repro-console:repro-faelan-com#6
created_at: '2026-10-03T01:03:32.142754+00:00'
updated_at: '2026-10-03T01:03:32.142754+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  defect_class:
  - instrument-blind
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-49bb7930
---

# gate: `unmeasured` reports 0 while the capture audit already knows 7 used properties the reproduction cannot say

**Seen on:** `storage/references/faelan.com/index`, iteration 6 of `repro-faelan-com`. One bundle.
**defect_class `instrument-blind`:** `gate.json` reports `unmeasured 0 — 0 axes, 0 bands, 0 populations, 0 probes`, and `values-diff.json` has `unmeasuredAxes: []` and `notComparableAxes: []`. Yet `1c capture audit faelan.com/index` lists 7 properties this page uses that the register marks `not-expressible`. One of them, `text-underline-offset: 4px`, is **100% of this round's ranked region score** (region #1, score 333.89). The headline that the brief calls "the number to drive down" says nothing was unmeasured, while the one thing still wrong on the page is exactly the thing nobody measured.

## Evidence (commands I ran)

```
CHROMIUM_LAUNCH_ARGS=--single-process node tools/generate/bin/1c.mjs capture audit faelan.com/index --json
```
- audit header: `elements 22, observed 77, carried 49, stale null`.
- `notExpressible` (7): `background-attachment`, `background-position-x`, `background-position-y`, `background-size`, `overflow-x`, `overflow-y`, `text-underline-offset` (values `["4px"]`).
- `lost` (1): `vertical-align` (values `["middle"]`, note "a run's `verticalAlign` (REQ-211)").
- `untriaged` (0).

`gate.json` / the round digest: `unmeasured 0`. `coverage.findings: []`.

## Hypothesis
REQ-275's audit (`tools/generate/src/cli/capture/audit.ts` `auditObservations`, register in `coverage.ts`) and REQ-277's unmeasured set are two disjoint ledgers. The gate composes its unmeasured count from comparator-side silence (one-sided axes, unpaired bands/elements, declined probes) and never consults the audit. So a property the capture knows the page uses, and declines because L1 cannot say it, is invisible to the score twice. `coverage.ts`'s header says the register exists to keep a not-expressible item "from being mistaken for" an instrument item, and it does that. But nothing then surfaces it **as unmeasured** on the round it costs pixels.

## Proposed change
1. When the gate runs against a bundle, run (or read a cached) `auditObservations` and add its `notExpressible` and `lost` findings to the unmeasured set as a new population, e.g. `N properties`. Each should carry property, values and element count, so the digest's first line names them.
2. **Filter inert declarations before counting.** The single `lost` row here is a false positive. The mirrored stylesheet `index.BM9-dqc-.css` declares `img,svg,video,canvas,audio,iframe,embed,object{vertical-align:middle;display:block}`, and `vertical-align` has no effect on a `display:block` box. Counting it as-is would make the headline lie in the other direction. The register's `present` witness for `vertical-align` reads runs only, so an `<img>` match always reads as lost.
3. **This will raise the unmeasured count** on faelan.com from 0 to 7 (or 8 before step 2). That is the instrument seeing more, not the reproduction getting worse.

## How to see it / how to know it is fixed
```
CHROMIUM_LAUNCH_ARGS=--single-process node tools/generate/bin/1c.mjs gate repro-faelan-com --ref storage/references/faelan.com/index --sandbox
```
- **Wrong (now):** `unmeasured 0 — 0 axes, 0 bands, 0 populations, 0 probes`.
- **Right:** the unmeasured line names `text-underline-offset` (and the six background/overflow properties) as used-but-not-expressible, and does not count `vertical-align` on a block image.

Related gap ticket for the axis itself: REQ-365 (`l1-has-no-text-underline-offset-axis`).