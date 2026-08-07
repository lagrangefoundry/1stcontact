---
uid: comment-6495de34
id: COMMENT-755
type: comment
title: Claude response for overlap_resolution report
created_by: xgd
created_at: '2026-08-07T15:50:15.258136+00:00'
updated_at: '2026-08-07T15:50:15.258136+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-fbeb5fec
  kind: note
---

Cluster 2 is resolved. Working tree is clean — the only mutation was the report ticket (auto-committed by the ticketing API).

## Resolution: **confirm**, no ticket changes

| Story | Action | Capability | Rationale |
|---|---|---|---|
| `story-c46abfa6` (STORY-102) | confirm | `capability-b4ac88fc` (CAP-89) | Already in the capability that owns the consolidated scope |

**Why no reassign or merge:**
- STORY-102's authoritative field is `capability_uid: capability-b4ac88fc` — CAP-89, *Site Materials & Starting Point*. That's already correct.
- CAP-89's body carries a dedicated `### The site asset store` section that condenses CAP-88's entire scope, and its preamble states the consolidation outright: *"Each was previously its own capability; they are consolidated here… none carries enough independent evidence to stand alone."*
- The story matches that section point for point — union of two disagreeing sources, per-entry provenance, one handle vocabulary, usage kind, reachable without an editing gesture.
- **Merge had nothing to merge**: CAP-88 holds 0 stories, 0 ACs, 0 backlinks.
- The six ACs (AC-1018…AC-1023) stayed attached to a story that didn't move, so no AC reassignment and no `test_UAT_AC<n>_*` renaming is implicated.

**Report**: REPORT-1576 (`report-fbeb5fec`) — `report_kind=overlap_resolution`, `subject_uid=report-17a279f7`, `cluster_id="2"`, status `pass`. Verified same shape as the sibling cluster-1 report from this run, so the iterator will detect completion.

## Two things I found but did not act on

**1. CAP-88 is an empty shell.** `capability-105cfacf` is still `active` with zero stories/ACs/backlinks while its scope is fully restated inside CAP-89. This is what makes the cluster *look* ambiguous — a future asset-listing story has two plausible homes, so the next survey will likely re-flag it. Archiving it is safe and reversible, but capability archival isn't in this task's action set (reassign/merge/confirm, story-level), so I recorded the recommendation instead.

**2. The canonical ticket index has a stale entry — worth your attention.** Filtering on *either* capability returns STORY-102:

```
fields.capability_uid=capability-b4ac88fc  -> STORY-93, 97, 92, 102   (correct)
fields.capability_uid=capability-105cfacf  -> STORY-102               (stale)
```

The ticket itself is unambiguous, and a control query with a nonexistent UID returns nothing, so the filter isn't simply leaky — it's residue from the reassignment. This matters because the overlap survey's inputs *are* these capability→story queries, so stale entries can manufacture phantom overlaps. I couldn't fix it here: `xgd ticket rebuild-index` refuses to run from a branch worktree by design, and forcing `--branch main` would mutate the canonical store from a regression worktree, which is exactly what that guard prevents. It needs a rebuild from `xgd-working`.

One process note: the prompt's example passes `report_kind`/`subject_uid` inside `--fields`, which this CLI version rejects (those keys are owned by `--kind`/`--subject`). I used the correct flags; worth fixing in the prompt template so the next cluster doesn't hit it.
