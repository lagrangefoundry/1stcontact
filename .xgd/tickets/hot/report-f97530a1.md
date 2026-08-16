---
uid: report-f97530a1
id: REPORT-2146
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-08-16T22:27:49.111071+00:00'
updated_at: '2026-08-16T22:27:49.111071+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-d9226698
  plan_item_index: '3'
---

Upgrade mutations applied for plan item 3 of 3.

**In scope (changed):** `story-5e7eb0c5` (STORY-97) and its acceptance criteria.
**Out of scope (unchanged):** AC-939 (`681fa4dd`), AC-940 (`63d8463e`), AC-942 (`62c0b208`) — census and alpha-collapse behaviour, untouched by REQ-137; all other stories including `story-c490f1cf` (item 2's target).

**Story** — rewritten to the shade model: the retrofit's second pass is hue-family fitting to one entry plus a shade on each reference (base = the member that reaches the most others, usage breaking ties; grouping in rounds; unreached members keep exact entries), "Lossless or nothing" becomes "Bounded, reported, or nothing", and "Re-runnable" is strengthened to a fixpoint. Technical Context gained the measured-bound rationale (8/255, from where the two populations of stored steps separate), the family-change refusal that makes the fixpoint hold, the re-run reach numbers (7 and 15 entries, zero steps; 210/91 slots; Δ5/Δ8), and the `--names` line reproducing `xgd`'s vocabulary. `story_kind` → `upgrade`, points → 3.

**Beyond the plan's modify list** — two further ACs on this story asserted behaviour the code no longer has, so I aligned them rather than leave the matrix self-contradictory:
- **AC-941** (`48360aec`) reported "each entry … and how many steps it carries" → each entry with its single value, plus the accepted drift the command now prints.
- **AC-945** (`66e919f9`) triggered the abort on "would not reproduce the *exact* literal" → on failing the stated bound (exact when unshaded, exact for opacity always).

**Verified against source, not the ticket:** `tools/generate/src/cli/colors.ts` (`fitShade` calling the model's `shadeHex`, `fitFamily`'s two-condition accept, `toEntry`'s reach-first base, `derivePalette`'s rounds, `cmdColorsAssign`'s per-reference gate at `SHADE_FIT_TOLERANCE = 8`), the `--names`/`--json` wiring in `index.ts`, and the stored palettes on disk (xgd 7 entries, gigabytealchemy 15, both stepless; `1stcontact` and `harbor-cafe` no palette).

**One discrepancy worth noting, not acted on:** the plan lists STORY-97 under `capability-e382c142`, but the ticket's own `capability_uid` is `capability-b4ac88fc`. I left the field alone — capability linkage isn't this prompt's scope.

```
Upgrade mutations applied for plan item 3 of 3

Target Stories: story-5e7eb0c5
Primary Story UID: story-5e7eb0c5
Stories Modified: 1
ACs Modified: 7
ACs Added: 2
ACs Removed: 0

tickets_modified:
  stories:
    - "story-5e7eb0c5"
  acceptance_criteria:
    modified: ["acceptance_criterion-3f7e1894", "acceptance_criterion-3127e56f", "acceptance_criterion-9f1e7baf", "acceptance_criterion-e7d18852", "acceptance_criterion-c9cc59fc", "acceptance_criterion-48360aec", "acceptance_criterion-66e919f9"]
    added: ["acceptance_criterion-3dc77086", "acceptance_criterion-b80e8a70"]
    removed: []

Progress: 3 of 3 plan items complete
```
