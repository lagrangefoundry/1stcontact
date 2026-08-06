---
uid: report-dfe20a06
id: REPORT-1455
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-08-06T20:17:02.701857+00:00'
updated_at: '2026-08-06T20:17:02.701857+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-0385746c
  plan_item_index: '1'
---

Upgrade mutations applied for plan item 1 of 6

Target Stories: story-5349d01f (STORY-94)
Primary Story UID: story-5349d01f
Stories Modified: 1
ACs Modified: 4
ACs Added: 3
ACs Removed: 0

```yaml
tickets_modified:
  stories:
    - "story-5349d01f"          # STORY-94 — body + story_kind: feature → upgrade
  acceptance_criteria:
    modified:
      - "acceptance_criterion-0854ccc9"   # AC-892 — URL qualified by store tree (+ title)
      - "acceptance_criterion-cff7798d"   # AC-899 — prune scoped to the tree being pruned
      - "acceptance_criterion-bf89142e"   # AC-900 — final line is the destination, not always a URL (+ title)
      - "acceptance_criterion-5a097866"   # AC-896 — published deploy's URL qualified by tree
    added:
      - "acceptance_criterion-1fd2d4da"   # AC-924 — every written key is scoped to the store tree
      - "acceptance_criterion-c996ef8e"   # AC-925 — non-servable tree reports no URL, and says why
      - "acceptance_criterion-1d90d433"   # AC-926 — each tree keeps its own deploy index
    removed: []
```

**Intent alignment.** BUG-31's body resolves the fix explicitly as *option (b) — namespace, do not refuse*, and states the invariant as "sandbox content is never publicly servable, and sandbox keys never collide with real ones." The code matches: `manifestKey(root, slug)`, the preview/rev prefixes and `unreferencedKeys` all build from `ctx.root`; `DeployResult.url` is `null` for a non-servable root and `formatDeployReport` prints the prefix plus `(sandbox — not publicly reachable)`. The rejected alternative (outright refusal) and the throwaway-slug workaround are recorded in the story's Technical Context, not as ACs.

**Two deviations from the plan's literal AC list, both deliberate:**

1. The plan listed *"Prune enumerates only the root being pruned"* as both an `add` and as the substance of the `AC-899` modify. Creating it separately would have produced two ACs asserting the same scenario, so it is folded into AC-899 (one AC, one prune behaviour, one UAT). Hence 3 added rather than 4.
2. AC-900 and AC-896 were sharpened although the plan's modify list named only AC-892 and AC-899. Both carried unconditional claims the code no longer honours — AC-900's "the final line of the report is the shareable URL" and AC-896's "the returned URL is the site's plain published URL" are false for a non-servable-root deploy. The plan's own coverage map flags this ("AC-892/AC-900 assume a deploy always terminates in a URL"); leaving them would have left the matrix internally contradictory.

Note: `xgd ticket children` lists the four updated ACs twice. Only one file exists per UID on disk and the tree is clean — it is a branch-worktree listing artifact (branch worktrees carry no persisted ticket index by design; `rebuild-index` refuses to run here), not duplicated tickets.

No runtime code was modified — the working tree contains only ticket auto-commits.

Progress: 1 of 6 plan items complete
