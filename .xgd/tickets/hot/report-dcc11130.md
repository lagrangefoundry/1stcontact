---
uid: report-dcc11130
id: REPORT-1573
type: report
title: Claude structural_rebalance report
created_by: xgd
created_at: '2026-08-07T15:33:30.655653+00:00'
updated_at: '2026-08-07T15:33:30.655653+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: structural_rebalance
  subject_uid: report-17a279f7
---

Verified: 25 stories before and after, none duplicated, orphaned, or unassigned.

## What I found

The health check report (`report-5b0cc0f1`) claimed **all 20 capabilities had 0 UATs**. That was a measurement artifact, not a real reading: `uat_count` is derived from `.xgd/uat_index.json`, which is gitignored and had never been built in this fresh regression worktree. `UATCountIndex` silently returns 0 for everything when the file is absent.

I rebuilt it (`xgd quality rebuild-uat-index` → 322 UATs across 308 ACs) and re-derived the tree. The real imbalance was different from the report's: **nothing was over max (200)**, so no splits were needed; 6 capabilities were genuinely under min (20), and 8 more had zero stories left behind by earlier consolidation.

## What I changed

Two merges, no splits. Stories were only reassigned — no content edits, no creates, no deletes.

| Survivor | Absorbed | UATs after |
|---|---|---|
| **CAP-89** `site-materials-and-start-point` (new) | site-asset-store (6), asset-provenance-compliance (12), site_colour_census_and_retrofit (9), site-creation-authoring-start-point (7) | **34** |
| **CAP-87** In-Page Copy Editing | edit_render_channel (13) | **26** |

I also updated CAP-87's title and body to honestly cover the absorbed render channel, and wrote a scoped description for CAP-89. The 8 zero-story capabilities were deprecated.

Final state — all 8 live capabilities within [20, 200], 321 UATs total:

`framework_substrate` 95 · `1c_capture_diff_fidelity` 55 · `site-delivery` 36 · `site-materials-and-start-point` 34 · `l1_reproduction_pipeline` 32 · `In-Page Copy Editing` 26 · `Structured Copy Editing` 22 · `builder_workspace` 21

## Two blockers you should know about

**1. The 5 absorbed capabilities could not be deprecated.** The invariant that guards deprecation calls `ticketing.list({type: story, fields.capability_uid: X})`. In overlay mode on a branch worktree, `_merge_shadowed` only suppresses a canonical hit when the overlay layer *also matches the same filter* — so a story whose local copy no longer matches still surfaces from main's index. The stories are genuinely reassigned (verified per-story via `ticket get`, and the tree shows `story_count: 0` for all five), but the guard sees stale canonical data. Archiving instead makes it worse: the local copy moves out of the scanned dir and canonical's *active* version wins, silently un-deprecating it (I hit this on CAP-64 and reverted it).

This is self-correcting — once the branch merges back and main's index rebuilds, the deprecations will go through.

**2. `run_health_check` does not skip deprecated capabilities.** The balance loop at `structural_validation.py:258` iterates every capability with no status filter, unlike `get_next_capability_for_validation:677` which does filter. So the 8 correctly-deprecated empties will still be flagged `under_min` on re-run. **The health check cannot pass from this worktree regardless of how the matrix is arranged.**

I deliberately did not work around either: I didn't bypass the deprecation invariant via internal flags, and I didn't paper over the check with 13 `min_uats: 0` overrides. Both would hide real engine bugs behind a green result.

```yaml
## Rebalance Summary
status: partial            # story-level rebalance complete; capability retirement blocked
previous_attempts: 0
uat_index_rebuilt: true    # root cause of the "all zero" report
splits: []                 # none required — no capability over max (200)
merges:
  - absorbed: [capability-105cfacf, capability-745b9a6c, capability-e382c142, capability-ccac1b1d]
    absorbed_counts: [6, 12, 9, 7]
    into: capability-b4ac88fc   # CAP-89, newly created
    surviving_count_after: 34
  - absorbed: [capability-25f7e486]
    absorbed_counts: [13]
    into: capability-12fee326   # CAP-87
    surviving_count_after: 26
deprecated_empty_capabilities: 8
blocked_deprecations: 5    # overlay index staleness — resolves on merge-back
integrity: {stories_before: 25, stories_after: 25, orphans: 0, duplicates: 0}
```
