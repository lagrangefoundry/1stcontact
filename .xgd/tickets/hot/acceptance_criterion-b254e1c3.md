---
uid: acceptance_criterion-b254e1c3
id: AC-633
type: acceptance_criterion
title: Duplicate text is paired by nearest rendered position, avoiding false swaps
  while preserving genuine deltas
created_by: xgd
created_at: '2026-07-19T02:18:31.760590+00:00'
updated_at: '2026-08-03T02:27:13.067160+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-d5de22a5
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
When the same normalised text string appears more than once, `values-diff` pairs each reference occurrence with the reproduction occurrence whose rendered box centre is nearest, rather than pairing in document order. So when both sides contain the same repeated string but list the instances in a different order, each instance is matched to its positional counterpart: no false per-instance deltas (e.g. colour or border swaps) are reported. A genuine difference on one instance (e.g. a real colour change on the top occurrence) still surfaces as a delta. Text that appears only once is unaffected.

**The rule is stated against rendered position, so it holds across DOM shapes.** The reference lists its repeated strings in the reading order of its nested containers; a flat, absolutely-positioned reproduction lists the same strings in the order its leaves were emitted, which routinely differs. Because pairing is by nearest rendered box centre and not by document order, each instance still matches its positional counterpart on either shape, and no cross-pair is invented by the ordering difference alone.

## Verification
Diff a case where both sides contain two identical repeated strings at the same two positions but listed in reversed order, with differing per-instance colours arranged so FIFO pairing would cross them. Assert no colour delta (positional pairing matches them correctly). Then change one instance's colour for real and assert that delta now surfaces. Repeat with the reproduction side supplied as a flat tree of absolutely-positioned leaves emitted in a different order from the reference's nesting, and assert the same outcomes.
