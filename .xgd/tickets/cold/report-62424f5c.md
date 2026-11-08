---
uid: report-62424f5c
id: REPORT-1275
type: report
title: 'Overlap resolution: cluster 4'
created_by: xgd
created_at: '2026-08-05T17:54:30.569891+00:00'
updated_at: '2026-08-05T17:54:30.569891+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: overlap_resolution
  subject_uid: report-31234d67
  cluster_id: '4'
---

## Cluster 4 Resolution

**Boundary**: Element/occurrence pairing contract: values-diff pairing rules (1c) vs the gate's sample-fidelity pairing contract (pipeline)
**Stories resolved**: 3
**Verdict**: all three confirmed in place — no reassignment, no merge, no ticket changes.

### Actions

| Story | Action | From | To | Rationale |
|-------|--------|------|-----|-----------|
| story-d5de22a5 (STORY-75) | confirm | capability-aa030c83 (CAP-63) | (no change) | `1c values-diff` reference-vs-reproduction pairing. CAP-63's scope statement explicitly claims "the element-pairing rules that decide which two elements are compared" for the intrinsic value axes. AC-633 is the only pairing AC and it pairs by **nearest rendered box centre** — a positional rule, deliberately *not* document order. |
| story-2c7069fe (STORY-78) | confirm | capability-aa030c83 (CAP-63) | (no change) | `1c responsive-diff` is not a two-sided comparison at all — it analyses **one** capture across the viewport ladder. CAP-63's scope names it directly ("the standalone `responsive-diff` N-way cross-size node analysis with its change classifier"). AC-651 aligns occurrences across *size columns of the same site*, a third axis that neither of the other two contracts touches. |
| story-24098299 (STORY-86) | confirm | capability-2049c9ec (CAP-71) | (no change) | The gate's sample-fidelity probe pairs the reproduced L1 document against the retained capture **oracle** by occurrence index in document order within a key (normalized text for text leaves, leaf `kind` for image/box leaves). CAP-71's scope claims "sample-fidelity against the retained oracle at captured widths" verbatim. |

### Why this is a topical adjacency, not a scope overlap

All three stories contain the phrase "repeated/duplicate text pairing", which is what the
survey detected. They are nonetheless three different contracts, in three different
subsystems, over three different pairs of inputs:

| | Inputs compared | Pairing key | Owner |
|---|---|---|---|
| values-diff (AC-633) | reference capture ↔ reproduction capture | nearest rendered box centre (positional) | CAP-63 |
| responsive-diff (AC-651) | one capture ↔ itself at other widths | document-order occurrence, per size column | CAP-63 |
| gate sample-fidelity (AC-705, AC-724) | folded L1 document ↔ retained capture oracle | occurrence index in document order within key (text, else leaf `kind`) | CAP-71 |

The two capabilities' scope statements already fence each other explicitly and
symmetrically: CAP-63 puts "the fold/gate reproduction pipeline that consume these
captures" out of scope; CAP-71 puts "the `1c` capture/values-diff axes the fold consumes"
out of scope. Neither fence is crossed by any AC in this cluster.

The distinction is also already load-bearing in the ticket text, written by the prior
cycle rather than inferred here:

- STORY-86 Technical Context: "**Not to be conflated with the `1c values-diff`
  duplicate-text pairing**, which pairs repeated text by rendered position in a
  different subsystem. Both pipelines handle duplicate text; neither AC covers the
  other."
- AC-705 Criterion closes with: "This rule governs the L1 reproduction gate. The `1c
  values-diff` fidelity pipeline pairs duplicate text by its own (positional) rule and
  is unaffected by this criterion."

Verified by reading all 30 ACs across the three stories: no AC in CAP-63 asserts anything
about the oracle, the fold, or gate probes; no AC in CAP-71 asserts anything about
`values-diff`, `responsive-diff`, or a capture axis. Each story belongs to exactly one
capability, and each pairing rule has exactly one owning AC.

### Verification

- Every story in the cluster was examined; none skipped.
- No merges performed, so no AC relationships were disturbed and no test renaming is
  required (all `test_UAT_AC<n>_*` numbering is untouched).
- Post-state: story-d5de22a5 → capability-aa030c83; story-2c7069fe → capability-aa030c83;
  story-24098299 → capability-2049c9ec. Exactly one capability each.

### Note for a later cycle (not actioned — outside this prompt's mandate)

STORY-86's Technical Context cross-references the values-diff pairing rule as living in
"CAP-72". That capability was consolidated into CAP-63 (`capability-aa030c83`) by the
2026-08-05 structural rebalance, per CAP-63's own History section. The cross-reference is
a stale capability ID. It does not affect the boundary decision above — the referenced
*behaviour* is correctly located — and this prompt forbids modifying story content except
when merging, so it was left as-is. Worth a cheap correction whenever STORY-86's body is
next edited.
