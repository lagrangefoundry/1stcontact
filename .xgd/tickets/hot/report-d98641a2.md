---
uid: report-d98641a2
id: REPORT-3558
type: report
title: Claude structural_rebalance report
created_by: xgd
created_at: '2026-09-09T22:53:52.548595+00:00'
updated_at: '2026-09-09T22:53:52.548595+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: structural_rebalance
  subject_uid: report-e37a6b4a
---

I halted before executing any rebalance. The report's input is false.

## The report is a measurement artifact, not a structural imbalance

All 35 capabilities report `actual_count: 0`, with `mean 0.0, stddev 0.0, coefficient_of_variation 0.0`. A uniform-zero distribution across every capability is the signature of a broken index, not of 35 simultaneously-empty capabilities.

Confirmed root cause — `.xgd/uat_index.json` is 67 bytes:
```json
{ "updated_at": "2026-09-09T22:50:28Z", "acs": {} }
```
It regenerated **empty** minutes before the check. Meanwhile the repo holds 2007 distinct `test_UAT_*` names across 294 test files, and 683 AC-keyed ones resolve cleanly: `test_UAT_AC1450_…` ↔ ticket `AC-1450`. This is a known xgd bug (`uat_index_builder.py` anchors `^test_UAT_` while vitest reports suite-prefixed names, so every UAT is skipped and the empty result is written anyway). It is the **seventh** recurrence since 2026-08-19, still unfixed at xgd 0.17.7.

## True distribution (measured independently)

635 ACs, 634 with ≥1 UAT, zero unparented:

| Status | Count | Range |
|---|---|---|
| healthy | 12 | 24–108 UATs |
| genuinely under_min | 10 | 9–18 UATs |
| **over_max** | **0** | — |
| no stories at all | 13 | n/a |

## Why executing the rebalance would have been destructive

- **No split is warranted anywhere** — `over_max` is 0. Every split in the prescribed procedure would have been fabricated.
- **It would have dissolved the matrix's healthiest capabilities.** `capability-ae9d65d6` (framework_substrate) carries **108 real UATs** across 7 stories, the largest in the matrix. The report lists it as `0/20` — a merge candidate.
- **It is structurally inapplicable to 13 of the 35.** Rebalance reparents *stories*; those capabilities have none. There is nothing to move.
- Each reparent and deprecation is its own git commit, reversible only by hand.

## On the 10 genuinely under-threshold capabilities

I did not merge these either, and I'd push back on doing so mechanically. Rebalance conflates "few UATs" with "too small a scope." `money_time_presentation` (9 UATs) and `assistant_pane` (9) have coherent, well-bounded scope and thin *coverage* — the correct remedy is adding UATs, not dissolving the boundary. The 13 no-story shells are declared-but-unimplemented intent; deprecating them is a product call, not a structural one.

```yaml
## Rebalance Summary
status: halted_invalid_input
previous_attempts: 0
reason: >-
  Health check input is invalid. .xgd/uat_index.json regenerated empty
  ("acs": {}), so all 35 capabilities read 0 UATs. Real counts: 12 healthy,
  10 under_min, 0 over_max, 13 no-stories. Executing the prescribed
  rebalance would merge away capabilities holding up to 108 UATs.
splits: []      # over_max == 0; no split warranted
merges: []      # under_min counts are real but merging is the wrong remedy
```

**Blocking recommendation:** fix the index builder in the xgd repo (unanchored `test_UAT_` search, plus a guard against writing an empty `merged_acs`), then re-run `structural_health_check`. The bug is upstream in `/Users/martin/lagrangefoundry/xgd`, not in this repo, so I can't fix it from this worktree. My reproduction script is at `.xgd/tmp/real_counts.py` if you want the table regenerated after the fix.

One caveat worth flagging: `ticket list --flags frontmatter,fields` did not surface `capability_uid` here, so I derived the mapping by walking `.xgd/tickets/hot/` directly. Only the `hot` tier is materialised under sparse checkout — every AC resolved to a capability, but if cold-tier stories exist the counts are a lower bound.
