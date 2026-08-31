---
uid: acceptance_criterion-21faffe2
id: AC-1391
type: acceptance_criterion
title: The filesystem store applies a write carrying a version expectation unconditionally
  rather than reporting a guarantee it cannot hold
created_by: xgd
created_at: '2026-08-31T09:47:42.810724+00:00'
updated_at: '2026-08-31T09:47:42.810724+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-fde7370b
  kind: behavior
  regression_only: false
---

## Criterion

The filesystem-backed store accepts a change carrying a version expectation and **applies it
unconditionally**: the change lands, and the expectation has no effect on whether it does.

It does not raise a conflict, and it does not perform a read-then-write comparison of its own. A
store that cannot make the check and the write one indivisible act reports no guarantee rather
than a guarantee that does not hold — a caller relying on a reassuring refusal that leaves the
race intact would be worse off than a caller that knows it got none.

The consequence is stated positively and is what a caller can rely on: against this store, a
change always lands; against the transactional store, a stale expectation always refuses. A caller
gets a genuine refusal or no refusal at all.

## Verification

Against the filesystem store, read a site's version, advance it with an unrelated write so the
reading is stale, then apply a change carrying the stale version. Observe that it lands and its
content is readable back, with no conflict raised. Run the same sequence against the transactional
store and observe the conflict, so the difference between the two stores is the observed
difference and not an assumption.
