---
uid: report-17fad7e0
id: REPORT-780
type: report
title: 'Overlap resolution: cluster 4'
created_by: xgd
created_at: '2026-07-23T06:20:08.274672+00:00'
updated_at: '2026-07-23T06:20:08.274672+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: overlap_resolution
  subject_uid: report-9260fc31
  cluster_id: '4'
---

## Cluster 4 Resolution

**Boundary**: A CLI flag consumed by the diff commands: does parsing/propagation belong to CLI arg-hygiene or to the diff capability that gives it meaning?
**Stories resolved**: 2

### Actions

| Story | Action | From | To | Rationale |
|-------|--------|------|-----|-----------|
| story-e15a19ef (STORY-79) | confirm | capability-ac7ca849 (CAP-66) | (no change) | Owns flag-**shape**/composability mechanics agnostic to any flag's meaning: boolean-vs-value parsing (positional survives — AC-656), `--json` stdout/stderr hygiene (AC-657/658/659), store-flag propagation into sub-commands (AC-720). The flags it names (`--multi-viewport`, `--json`, `--sandbox`) are vehicles for a generic guarantee, not the guarantee itself. No AC touches `--size`. |
| story-16f2793c (STORY-77) | confirm | capability-18a822ac (CAP-65) | (no change) | Owns the `--size` selector's meaning end-to-end, including validating its accepted vocabulary (AC-645). That validation is enum-checking a **domain vocabulary** (mobile\|tablet\|desktop) defined by the viewport ladder — a size-aware-diffing concept, not a generic parsing rule. `--size` is value-taking, so CAP-66's boolean-parsing mechanic does not apply to it. |

### Why the overlap is acceptable (clean boundary)

The two stories concern **different flags at different layers of concern**:

- **CAP-66 = generic parse mechanics** applicable to *any* flag regardless of semantics (boolean-vs-value shape, stdout/stderr separation, cross-command propagation of store-selection flags).
- **CAP-65 = the `--size` flag's domain semantics**, and — critically — validation of *its own* accepted vocabulary, because "which values are legal" is defined by the ladder the diff capability owns, not by flag hygiene.

No duplicated behavior (so no merge) and no misfiled AC (so no reassignment). Boundary rule that resolves the cluster's question: **flag-shape/composability mechanics → CAP-66; a domain flag's meaning *including validation of its own value vocabulary* → the capability that defines that vocabulary (CAP-65).** Both stories are already singly-assigned to the correct capability; all AC relationships are intact.
