---
uid: report-f1b6cf2b
id: REPORT-1274
type: report
title: 'Overlap resolution: cluster 3'
created_by: xgd
created_at: '2026-08-05T17:51:43.079722+00:00'
updated_at: '2026-08-05T17:51:43.079722+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: overlap_resolution
  subject_uid: report-31234d67
  cluster_id: '3'
---

## Cluster 3 Resolution

**Boundary**: 1c CLI argument parsing and stdout hygiene: shared toolchain infrastructure parked in the capture/diff capability while covering pipeline commands
**Stories resolved**: 3 (3 confirm, 0 reassign, 0 merge)

### Actions

| Story | Action | From | To | Rationale |
|-------|--------|------|-----|-----------|
| story-e15a19ef (STORY-79) | confirm | capability-aa030c83 (CAP-63) | (no change) | CAP-63 explicitly declares "CLI argument parsing and output hygiene" as a scope bullet, having absorbed CAP-66 in the 2026-08-05 structural rebalance (`capability-ac7ca849.fields.merged_into = capability-aa030c83`). STORY-79 was CAP-66's sole story; CAP-63 is its designed home, not an accident of parking. |
| story-24098299 (STORY-86) | confirm | capability-2049c9ec (CAP-71) | (no change) | All 11 ACs are 3-probe gate semantics (sample-fidelity, off-sample envelope, content-robustness, demand-driven recovery, analytic evaluator). Body and AC titles contain no CLI-parsing or stdout-hygiene content. Squarely CAP-71's declared scope. |
| story-8acc338d (STORY-84) | confirm | capability-2049c9ec (CAP-71) | (no change) | All 13 ACs are fold semantics (geometry keyframes, interpolate/snap, visibility rules, hint sidecar, oracle retention, typed residuals). No CLI surface content. Squarely CAP-71's declared scope. |

### Why the overlap is acceptable

The survey flagged STORY-79 because AC-738 ("Every 1c command boots quietly") enumerates
`repro` and `l1-gate` — commands owned by CAP-71 — among the invocations it checks.

That enumeration is the **subject list of a toolchain-wide invariant**, not a claim on
pipeline behavior. The same AC also enumerates `help`, `list`, `capture`, and
`values-diff`; the guarantee under test is "the launcher's Astro bootstrap does not emit
this warning on either stream", which is a property of the CLI entry point, not of the
fold or the gate. A CLI-surface invariant is only meaningful when asserted across the
whole command surface — narrowing it to capture/diff commands would weaken the AC
without moving any pipeline behavior into a better home.

The boundary is clean in both directions and verified:

- **CAP-63 to CAP-71**: STORY-79 asserts nothing about fold or probe semantics. Its four
  guarantees are flag parsing, stdout/stderr separation and quiet bootstrap, store-flag
  propagation into sub-commands, and whether the render path constructs an Astro
  container at all.
- **CAP-71 to CAP-63**: STORY-84 and STORY-86 assert nothing about argument parsing or
  output streams. Scanned both bodies and all 24 AC titles — zero matches.

CAP-71's own body places the `1c` capture/values-diff surface explicitly out of scope, so
reassigning STORY-79 into CAP-71 would breach CAP-71's stated boundary *and* orphan the
CLI clause CAP-63 now declares. No merge candidate exists: no two stories in the cluster
describe the same behavior.

### Follow-up flagged (not actioned)

Two of STORY-79's seven ACs reach past the capture/diff spine into a *third* area, which
is an intra-story breadth question rather than a two-capability overlap:

- AC-720 (acceptance_criterion-72db61ca) — `aligned-crops --sandbox` store routing;
  touches the perceptual aligned-crops path.
- AC-739 (acceptance_criterion-fcf814b5) — conditional Astro container construction;
  touches the render path (CAP-70 framework-substrate territory).

Both still fit STORY-79's stated theme ("store-selecting flags propagate into
sub-commands" / "the render path is Astro-free unless a page needs Astro"), and
separating them would require splitting a story — outside this task's remit
(reassign / merge / confirm only). Recorded here for a future structural pass.

### Index defect observed

`xgd ticket get <human-id>` (e.g. `CAP-63`, `AC-738`) returns TICKET_ID_NOT_FOUND for
tickets that resolve correctly by UID, and `xgd ticket list --type capability` returns
stale duplicate entries carrying pre-rebalance titles. Story-to-capability filter queries
inherit the staleness: filtering on `capability-ac7ca849` (CAP-66, absorbed) still
returns story-e15a19ef, although the authoritative ticket read shows
`capability_uid: capability-aa030c83`. This is consistent with the blocking index defect
already noted in CAP-66's body. All findings above were derived from UID reads, not the
index.

### Verification

- Every story in the cluster belongs to exactly one capability (confirmed by UID read of
  each story's `capability_uid`).
- No story was skipped: 3 of 3 resolved.
- No merges performed, so no AC relationships were disturbed; no test renames required.
