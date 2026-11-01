---
uid: report-c2998d19
id: REPORT-882
type: report
title: 'Overlap resolution: cluster 4'
created_by: xgd
created_at: '2026-07-24T06:24:48.765586+00:00'
updated_at: '2026-07-24T06:24:48.765586+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: overlap_resolution
  subject_uid: report-b1a287b0
  cluster_id: '4'
---

## Cluster 4 Resolution

**Boundary**: Absolute value validation lives in the L1 substrate
**Stories resolved**: 2 (both confirmed — clean boundary, no changes)

### Summary

The cluster pairs one story from the **value-system** capability with one from the
**L1 substrate** capability. Both touch absolute-value validation, but they cover
different behaviour at different altitudes and already cross-reference cleanly. No
reassignment or merge is warranted.

- **CAP-67 (`capability-6e088083`) — Framework Absolute-or-Overlay Value System** owns
  the design *principle*: absolute values are the base; a named scale is an overlay of
  constants (overlay half parked in L2).
- **CAP-70 (`capability-ae9d65d6`) — L1 Layout Substrate + Safety Envelope** owns the
  substrate *mechanism*: the typed element tree, the envelope validator, and the single
  safe renderer.

**STORY-80** documents the conceptual absolute-or-overlay value model (colour/length/
radius carried as validated literals; named overlay parked in L2) — the reason CAP-67
exists. Its single AC (**AC-716**) explicitly states *"Detailed L1 axis and envelope
behaviour is owned by the L1 substrate story"*, deferring implementation detail to
STORY-83.

**STORY-83** documents the L1 substrate itself (7 ACs: AC-682..688 — typed tree
accepted, out-of-range/oversize/freeform rejected, injection inert, geometry keyframes,
round-trip identity, per-field errors, cross-browser fidelity) — the reason CAP-70
exists.

Reassigning STORY-80 into CAP-70 would hollow out the value-system capability and erase
the distinct absolute-or-overlay concept (including the parked-L2 overlay half). Merging
would collapse a meaningful conceptual layer. AC-716's explicit deferral to STORY-83 is
the disambiguation that makes the boundary clean by construction.

### Actions

| Story | Action | From | To | Rationale |
|-------|--------|------|-----|-----------|
| story-c490f1cf (STORY-80) | confirm | capability-6e088083 (CAP-67) | (no change) | Owns the conceptual absolute-or-overlay value *model* + parked-L2 overlay — the reason CAP-67 exists. AC-716 explicitly defers L1/envelope detail to STORY-83, keeping the boundary clean. |
| story-d0a8cfad (STORY-83) | confirm | capability-ae9d65d6 (CAP-70) | (no change) | Owns the L1 substrate *mechanism* (validator/renderer/geometry/round-trip/cross-browser) — the reason CAP-70 exists. Distinct altitude from STORY-80's principle-level scope. |

### Verification

- Every story belongs to exactly one capability (STORY-80 → CAP-67; STORY-83 → CAP-70).
- No story skipped; both explicitly resolved.
- No merges performed, so all AC relationships are untouched (AC-716 on STORY-80;
  AC-682..688 on STORY-83).
