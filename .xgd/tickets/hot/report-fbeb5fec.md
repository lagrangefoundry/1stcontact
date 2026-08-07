---
uid: report-fbeb5fec
id: REPORT-1576
type: report
title: 'Overlap resolution: cluster 2'
created_by: xgd
created_at: '2026-08-07T15:49:29.146105+00:00'
updated_at: '2026-08-07T15:49:29.146105+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: overlap_resolution
  subject_uid: report-17a279f7
  cluster_id: '2'
---

## Cluster 2 Resolution

**Boundary**: Site asset listing: CAP-89 absorbs CAP-88 (Site Asset Store), which remains active and empty
**Stories resolved**: 1 (1 confirm, 0 reassign, 0 merge)

### Actions

| Story | Action | From | To | Rationale |
|-------|--------|------|-----|-----------|
| story-c46abfa6 (STORY-102) | confirm | capability-b4ac88fc (CAP-89) | (no change) | Already assigned to the capability that owns the consolidated "site asset store" scope. The absorption has already happened; nothing is ambiguous at the story level. |

### Why confirm rather than reassign or merge

`story-c46abfa6` ("Ask my site what assets it has…") carries
`capability_uid: capability-b4ac88fc` — CAP-89, **Site Materials & Starting
Point**. That is the correct home, and no change is required:

- **CAP-89 explicitly owns this scope.** Its body carries a dedicated
  `### The site asset store` section whose text is a condensation of CAP-88's
  entire scope — the union of declared registry and draft asset directory,
  merged by handle, reported with provenance. CAP-89's preamble states the
  consolidation outright: *"Each was previously its own capability; they are
  consolidated here because they share one subject — the site's own material
  inventory — and none carries enough independent evidence to stand alone."*
- **The story matches that section point for point.** Union of two disagreeing
  sources, provenance per entry, one handle vocabulary, usage kind, reachable
  without an editing gesture — the same five points, in the same order, in
  CAP-89's section, CAP-88's scope, and the story body.
- **No merge candidate exists.** CAP-88 holds zero stories, zero acceptance
  criteria and zero backlinks. There is no second story describing the same
  behaviour, so the merge action has nothing to merge.
- **AC relationships untouched.** The story's six ACs (AC-1018 … AC-1023) remain
  attached to `story-c46abfa6`, which did not move. No AC reassignment and no
  `test_UAT_AC<n>_*` renaming is implicated by this cluster.

### Verification

- STORY-102 belongs to exactly one capability (CAP-89) per its authoritative
  ticket field.
- No story in this cluster was skipped — the cluster contains exactly one story.
- No merges were performed, so no AC relationships were disturbed.

---

## Residual findings (outside this task's authorized actions)

Two items remain that this task's action set (reassign / merge / confirm, story
level only) does not cover. Neither blocks the cluster resolution; both are
recorded here rather than acted on.

### 1. CAP-88 is an empty shell whose scope is fully restated in CAP-89

`capability-105cfacf` (CAP-88, *Site Asset Store*) is `status: active` with:

- 0 stories, 0 acceptance criteria, 0 backlinks;
- a scope section reproduced, in condensed form, inside CAP-89.

This is the structural residue of the absorption, and it is what makes the
cluster look ambiguous: a future story about site asset listing has two
plausible homes, so the next overlap survey is likely to re-flag this cluster.

**Recommendation**: archive `capability-105cfacf`. It is safe (nothing
references it, nothing is orphaned) and reversible via `xgd ticket unarchive`.

**Not done here** because this task authorizes story-level actions only —
capability archival is a matrix-structure decision, not an overlap resolution.

### 2. Stale capability→story entry in the canonical ticket index

The canonical index returns STORY-102 for **both** capabilities:

```
xgd ticket list --type story --filter fields.capability_uid=capability-b4ac88fc
  -> STORY-93, STORY-97, STORY-92, STORY-102    (correct)

xgd ticket list --type story --filter fields.capability_uid=capability-105cfacf
  -> STORY-102                                  (stale — contradicts the ticket)
```

The ticket itself is unambiguous (`capability_uid: capability-b4ac88fc`), so the
CAP-88 hit is an index entry left behind by the reassignment rather than a real
dual assignment. A control query with a nonexistent capability UID returns no
tickets, so the filter is not simply leaky.

This matters beyond cosmetics: the overlap survey's own inputs are these
capability→story queries, so a stale entry can manufacture phantom overlaps.

**Not fixed here**: `xgd ticket rebuild-index` refuses to run from a branch
worktree by design — the index exists only on the canonical (main) store.
Running it with `--branch main` would mutate the canonical store from a
regression worktree, which is what that guard exists to prevent. It should be
rebuilt from `xgd-working`.
