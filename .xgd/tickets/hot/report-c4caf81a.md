---
uid: report-c4caf81a
id: REPORT-2282
type: report
title: Claude structural_rebalance report
created_by: xgd
created_at: '2026-08-20T00:48:34.232019+00:00'
updated_at: '2026-08-20T00:48:34.232019+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: structural_rebalance
  subject_uid: report-2485c83c
---

I halted the rebalance. **The input report is measurement noise, not a structural finding — executing it would have deprecated most of the capability matrix on a false premise.**

## Root cause

`.xgd/uat_index.json` is `{"updated_at": "2026-08-20T00:43:21…", "acs": {}}` — empty, regenerated at the regression start.

`xgd_source/quality/uat_index_builder.py:158` filters test names with an **anchored** pattern:

```python
ac_pattern = re.compile(r"^test_UAT_", re.IGNORECASE)   # then .match(test_name)
```

This project's quality reports are **vitest**, whose `name` is the full suite path. Real example from report-aa9c9eb4:

```
"AC-716 L1 leaf axes carry the absolute (literal) colour / length / radius value test_UAT_AC716_absolute_literals_carried_verbatim_and_malformed_rejected"
```

The `^` anchor never matches, so *every* UAT is skipped and the builder writes the empty result anyway. `UATCountIndex._load` then sets `loaded = True` on any successful parse — so the BUG-1015 suppression at `structural_validation.py:360` (`elif uat_index_loaded and uat_count < cap_min`) does **not** fire, and all 26 capabilities emit a spurious `under_min` of `0 / 20`. The `mean 0.0, stddev 0.0` signature is the tell. `extract_ac_id_from_test_name` is already unanchored, so the anchor is the only blocker.

## What the matrix actually looks like

Measured independently (476 distinct `test_UAT_AC*` across 78 files, 26 capabilities / 30 stories / 429 ACs, 0 orphan ACs):

| Group | Count | Detail |
|---|---|---|
| Healthy | 8 | 30–105 UATs; largest is `capability-ae9d65d6` (Framework Substrate) at **105** |
| Genuinely under min | 5 | 9–15 UATs: `2d32662d`, `00e77e55`, `fe236246`, `7e4714b7`, `44a04848` |
| **Zero stories at all** | 13 | `105cfacf`, `e382c142`, `745b9a6c`, `25f7e486`, `ccac1b1d`, `36dd68c5`, `bd0b722e`, `ce902be4`, `938f26ec`, `6e088083`, `8108afab`, `ac7ca849`, `18a822ac` |
| Over max | **0** | no split is warranted anywhere |

Two independent reasons not to proceed: the 8 healthy capabilities would have been merged away on phantom zeros, and the 13 empty shells make the procedure structurally inapplicable — rebalance reparents *stories*, and those have none. They look like declared-but-unimplemented shells superseded by the consolidated capabilities (e.g. `1c Gradient Fidelity` by `1c Capture & Diff Fidelity`; `Framework Absolute-or-Overlay Value System` by `Framework Substrate`).

## Recommended sequence

1. Fix `uat_index_builder.py:158` — `.search()` instead of `.match()` (one line, in the **xgd** repo, not 1stcontact). Optionally guard the builder against writing an empty `merged_acs`, and make `UATCountIndex.loaded` false on an empty `acs` so the BUG-1015 suppression works as designed.
2. Re-run the index rebuild and `structural_health_check` to get truthful input.
3. Handle the 13 zero-story shells as a **matrix curation** decision (deprecate as superseded, or leave as roadmap placeholders) — an operator call, not an automated merge.
4. Only then rebalance the 5 real under-min capabilities against the system's own numbers.

```yaml
## Rebalance Summary
status: blocked
previous_attempts: 0
reason: input health report is invalid — empty uat_index.json yields 26 phantom under_min issues
tickets_modified: 0
splits: []
merges: []
```

No tickets were created, updated, or deprecated. Steps 1–2 are outside this task's scope (xgd package source) and step 3 needs your decision, so I stopped rather than proceeding — I did not complete the assigned rebalance. I also updated the standing memory note to record the recurrence and the real distribution.
