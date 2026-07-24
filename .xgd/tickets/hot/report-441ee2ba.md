---
uid: report-441ee2ba
id: REPORT-880
type: report
title: 'Overlap resolution: cluster 3'
created_by: xgd
created_at: '2026-07-24T06:22:17.777995+00:00'
updated_at: '2026-07-24T06:22:17.777995+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: overlap_resolution
  subject_uid: report-b1a287b0
  cluster_id: '3'
---

## Cluster 3 Resolution

**Boundary**: CLI flag parsing vs the diff commands the flags configure
**Stories resolved**: 2

### Decision: Confirm both (no change)

The overlap is thematic, not behavioral. Both stories touch the shared
`values-diff` command surface, but they own disjoint concerns with a clean
boundary, and each explicitly scopes the other's domain out:

- **CAP-66 / STORY-79** owns the *mechanical CLI contract* — boolean-flag
  parsing (`--multi-viewport` does not consume the positional slug), `--json`
  stdout/stderr hygiene, and store-flag propagation (`--sandbox`/source into
  `aligned-crops`). These guarantees hold regardless of what the command
  computes. STORY-79's body explicitly places "the content/shape of the diff or
  crop artifacts themselves" out of scope, deferring to the values-diff /
  size-aware / aligned-crops capabilities. Its ACs (656–659, 720) are all
  parse/stream/propagate correctness — none touch diff semantics.

- **CAP-65 / STORY-77** owns the *diff semantics of `--size`* — what is compared
  at each viewport width (reference from the persisted ladder, actual rendered
  at that width), fail-loud on missing ladder data, and per-width reference
  screenshots at capture time. Its ACs (639–647) are all about which cell is
  compared at which width.

The flags involved are disjoint (`--multi-viewport` / `--json` / `--sandbox`
vs `--size`). There is zero AC overlap and no duplicated behavior. CAP-63
(Values-Diff Fidelity) is a related domain both reference for context but is the
home for neither story. Each story already belongs to exactly one capability,
and that assignment is correct. No reassignment or merge is warranted.

### Actions

| Story | Action | From | To | Rationale |
|-------|--------|------|-----|-----------|
| story-e15a19ef (STORY-79) | confirm | capability-ac7ca849 (CAP-66) | (no change) | Owns mechanical CLI parsing/stream/propagation contract; explicitly scopes out diff artifact content; ACs are all parse/stream correctness. Clean fit for CAP-66. |
| story-16f2793c (STORY-77) | confirm | capability-18a822ac (CAP-65) | (no change) | Owns `--size` diff semantics (what is compared at which width); ACs all about width-selection comparison. Clean fit for CAP-65. |
