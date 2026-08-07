---
uid: report-530263fe
id: REPORT-1578
type: report
title: 'Overlap resolution: cluster 4'
created_by: xgd
created_at: '2026-08-07T16:00:55.708982+00:00'
updated_at: '2026-08-07T16:00:55.708982+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: overlap_resolution
  subject_uid: report-17a279f7
  cluster_id: '4'
---

## Cluster 4 Resolution

**Boundary**: Colour census and palette retrofit: CAP-89 absorbs CAP-83 (Site Colour Census & Palette Retrofit), which remains active and empty
**Stories resolved**: 1

### Actions

| Story | Action | From | To | Rationale |
|-------|--------|------|-----|-----------|
| story-5e7eb0c5 (STORY-97) | confirm | capability-b4ac88fc (CAP-89) | (no change) | Already homed on the absorbing capability. CAP-89's body carries an explicit `### Site colour census & palette retrofit` scope section that restates CAP-83's scope in full. There is no story-assignment ambiguity to resolve. |

### Finding: this cluster is not a story-assignment overlap

STORY-97 is **already** correctly assigned to CAP-89. Verified three ways:

1. `xgd ticket get story-5e7eb0c5` → `capability_uid: capability-b4ac88fc`.
2. No story ticket file references `e382c142` at all
   (`grep -l e382c142 .xgd/tickets/hot/story-*.md` → none).
3. All 9 ACs (AC-939..AC-947) remain attached to `story-5e7eb0c5`; no AC
   references CAP-83.

The apparent overlap is **consolidation residue**, exactly as diagnosed by the
survey (`report-9d3d87ad`) and the rebalance report (`report-dcc11130`):
CAP-83's stories were moved to CAP-89 and its scope text copied across, but
CAP-83 was left `status: active` with no `merged_into`.

`xgd ticket list --filter fields.capability_uid=capability-e382c142` still
returns STORY-97 — a **stale index hit**, not a real assignment. A local
`xgd ticket rebuild-index` does not clear it: the stale entry lives in main's
canonical index, and in overlay mode `_merge_shadowed` only suppresses a
canonical hit when the overlay layer also matches the same filter.

### Capability-level action taken

Set `merged_into: capability-b4ac88fc` on `capability-e382c142` (CAP-83),
matching the established retirement pattern (CAP-64, CAP-72 both carry
`status: deprecated` + `merged_into`).

### Remaining, and deliberately not worked around

`status: deprecated` on CAP-83 **could not be set**. This reproduces blocker
1 of `report-dcc11130`. Root cause confirmed in code:

- `xgd_source/core/ticketing/__init__.py:3047` runs the invariant on any
  capability update containing `status`.
- `invariants.py:reject_deprecation_if_capability_has_stories` calls
  `attached_story_ids()`, which at `invariants.py:61` issues
  `ticketing.list({type: story, fields.capability_uid: ...})` — the same
  index-backed query that returns the stale STORY-97 hit.

The guard therefore refuses the deprecation. Two observed consequences:

- The refusal is **silent**: the CLI exits 0 and prints no diagnostic. A
  combined `{"status": ..., "merged_into": ...}` patch is rejected wholesale,
  so neither key lands. Splitting the patch let `merged_into` through.
- Deprecation will succeed once the branch merges back and main's index
  rebuilds — the blocker is self-correcting, as `report-dcc11130` predicted.

I did **not** bypass the invariant via the internal `_skip_deprecation_check`
kwarg, and did **not** use `xgd ticket archive` (per `report-dcc11130`,
archiving moves the local copy out of the scanned directory and lets
canonical's *active* version win, silently un-deprecating the capability —
observed and reverted on CAP-64). Either route would hide a real engine bug
behind a green result.

### Integrity

- Stories in cluster: 1 before, 1 after. No content edited, none archived,
  none created.
- AC relationships: 9 before, 9 after, all on `story-5e7eb0c5`. No test
  renames required — no AC changed story.
- Every story in this cluster belongs to exactly one capability. None skipped.
