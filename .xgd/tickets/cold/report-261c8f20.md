---
uid: report-261c8f20
id: REPORT-886
type: report
title: 'Overlap resolution: cluster 6'
created_by: xgd
created_at: '2026-07-24T06:30:59.452874+00:00'
updated_at: '2026-07-24T06:30:59.452874+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: overlap_resolution
  subject_uid: report-b1a287b0
  cluster_id: '6'
---

## Cluster 6 Resolution

**Boundary**: Reproduction treatments expressed via L1 leaf axes and capability-module config
**Stories resolved**: 3

### Summary

The cluster groups one **reproduction-outcome** story (STORY-82) with the two
**mechanism** stories it consumes (STORY-83, the L1 substrate; STORY-85, the
capability-module contract). Reading each story and its ACs shows a clean
altitude separation, not a misassignment or behaviour-level duplication:

- **STORY-82 / CAP-69** documents the *author-observable reproduction treatments*
  (frosted card veil/border, footer copyright/text/link-colour departures,
  compact placeholder-labelled / inline contact form). Its ACs — AC-719
  ("card/band and footer visual treatments are expressed via L1 leaf axes, not
  module dials") and AC-718 ("contact-form presentation treatments are authored
  via capability config + L1 slots, not module dials") — assert the reproduction
  *outcome* is expressible through the post-pivot surfaces. They name the L1
  leaf axes and the contact-form capability config, but assert the treatment,
  not the mechanism.
- **STORY-83 / CAP-70** documents the *L1 layout substrate mechanism itself*:
  typed shape, envelope validation, safe emitter, geometry keyframes,
  round-trip, cross-browser fidelity (AC-682 typed-tree acceptance, AC-685
  injection-inert, AC-686 out-of-range rejection, AC-688 cross-browser, etc.).
- **STORY-85 / CAP-72** documents the *capability-module contract mechanism
  itself*: vetted behavioural core + typed config + named L1 presentation slots
  + conformance/isolation, with carousel and contact-form as the two reframed
  survivors.

STORY-82 references the axes and config owned by STORY-83 and STORY-85 because a
reproduction treatment naturally *consumes* both mechanisms — that consumer
relationship is what the survey detected. It is not duplication: no AC is shared,
and STORY-82 spans both mechanisms (L1 axes for the card/footer look **and** the
contact-form capability for the form), so it fits neither mechanism capability
and correctly belongs to the reproduction capability (CAP-69). Reassigning it
into CAP-70 or CAP-72 would split its cross-cutting scope and lose the
reproduction-treatment intent; merging would erase the distinct
reproduction-outcome altitude. The boundaries are clean as they stand.

### Actions

| Story | Action | From | To | Rationale |
|-------|--------|------|-----|-----------|
| story-46e3b3c7 (STORY-82) | confirm | capability-938f26ec | (no change) | Reproduction-outcome story; ACs (AC-718/719) assert treatments expressible via post-pivot surfaces. Consumes but does not duplicate the L1-substrate / capability-module mechanisms. Spans both mechanisms, so belongs to the reproduction capability. |
| story-d0a8cfad (STORY-83) | confirm | capability-ae9d65d6 | (no change) | Documents the L1 substrate mechanism itself (typed shape, envelope, safe emitter, geometry, round-trip, cross-browser). Correctly in the L1 Layout Substrate capability. |
| story-179b8c06 (STORY-85) | confirm | capability-ce902be4 | (no change) | Documents the capability-module contract mechanism itself (vetted core + config + L1 slots + isolation; carousel & contact-form survivors). Correctly in the Capability Module Contract capability. |

### Verification

- Every story belongs to exactly one capability (unchanged, all correct).
- No stories skipped: all 3 in the cluster resolved.
- No merges/reassignments performed, so no AC relationships altered.
