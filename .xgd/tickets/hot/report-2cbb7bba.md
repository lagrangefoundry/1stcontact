---
uid: report-2cbb7bba
id: REPORT-777
type: report
title: 'Overlap resolution: cluster 3'
created_by: xgd
created_at: '2026-07-23T06:17:50.828805+00:00'
updated_at: '2026-07-23T06:17:50.828805+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: overlap_resolution
  subject_uid: report-9260fc31
  cluster_id: '3'
---

## Cluster 3 Resolution

**Boundary**: The typed L1 leaf-axis value surface — shared by the substrate, the literal-or-overlay value system, and reproduction treatments
**Stories resolved**: 3

All three stories reference the same physical surface — L1 leaf axes carrying
validated literals — but each views it from a distinct altitude and is already
assigned to its matching capability. The overlap is deliberate, layered
cross-referencing, not misassignment or duplication.

- **Substrate (mechanism)** — STORY-83 / CAP-70 owns the typed element tree,
  envelope validator, safe renderer, geometry keyframes, round-trip and
  cross-browser gates (AC-682/683/684/685/686/687/688/717).
- **Value model (contract)** — STORY-80 / CAP-67 owns the absolute-or-overlay
  value-semantic contract across colour/length/radius TYPES: the absolute
  literal lands verbatim (the reproduction mandate). Its AC-716 explicitly
  defers substrate detail to STORY-83 ("Detailed L1 axis and envelope behaviour
  is owned by the L1 substrate story").
- **Treatments (specific looks)** — STORY-82 / CAP-69 owns the specific
  reproduction treatments those axes must express: frosted card veil/border,
  footer copyright/colour overrides, contact-form presentation via capability
  config + L1 slots (AC-718/719). It consumes the leaf axes; it does not define
  them.

### Actions

| Story | Action | From | To | Rationale |
|-------|--------|------|-----|-----------|
| story-d0a8cfad (STORY-83) | confirm | capability-ae9d65d6 (CAP-70) | (no change) | Owns the L1 substrate mechanism itself — the leaf-axis surface, validator, renderer, geometry, round-trip. Correctly in the substrate capability. |
| story-c490f1cf (STORY-80) | confirm | capability-6e088083 (CAP-67) | (no change) | Owns the literal-or-overlay value contract (absolute value lands verbatim) across colour/length/radius types; AC-716 explicitly defers substrate detail to STORY-83. Not redundant — it is CAP-67's post-pivot L1 anchor; merging would leave the value-system capability with no representation. |
| story-46e3b3c7 (STORY-82) | confirm | capability-938f26ec (CAP-69) | (no change) | Owns the specific reproduction treatments (frosted card, footer overrides, contact-form presentation) expressed via L1 leaf axes + capability config/slots. Consumes the axes; distinct behaviour from both the substrate and the value model. |

### Verification
- Every story belongs to exactly one capability (unchanged; each already in its matching capability).
- No stories skipped — all 3 (STORY-83, STORY-80, STORY-82) resolved.
- No merges performed, so all AC relationships preserved intact
  (AC-682/683/684/685/686/687/688/717 → STORY-83; AC-716 → STORY-80;
  AC-718/719 → STORY-82).
