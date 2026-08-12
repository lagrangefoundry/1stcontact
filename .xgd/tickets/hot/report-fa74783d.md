---
uid: report-fa74783d
id: REPORT-1836
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-08-12T16:28:23.817364+00:00'
updated_at: '2026-08-12T16:28:23.817364+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: request-5946d045
  plan_item_index: '2'
---

All mutations are committed and the tree is clean. No runtime code was touched.

## What I changed and why

**Story body** (`story-3bf94bd4`, now `story_kind: upgrade`) — two additions to *In scope* and three corrections to *Technical Context*:

- New bullet **"Choosing an image by looking at it"** — the grid, the file-name label, the value/label split, the tooltip, the unservable tile, the keyboard.
- New bullet **"A dialog that composes two controls and still saves once"** — per-field routing, one merged change, no editing box when there's no text.
- **Deleted the "Known limitation, upstream" bullet.** It asserted that "an image picker shows the asset's handle rather than a friendly name or a thumbnail." That is now false, and it was the one statement in the story the commit directly contradicts.
- **Rewrote "Kind-agnosticism proved"** — it claimed the field list "is handed straight to the shared component," which is no longer true. The claim survives in a stronger form: routing is by descriptor, never by region kind, and an image region proves it by carrying both a grid field and a form field at once.
- **Added** the picker-drawn-here staging post (per Decision 1 in the ticket chat), the two-controls composition including the values-filtering defect, and the value/label invariant with duplicate names tolerated deliberately.

**Six ACs modified.** The substantive ones: `AC-1028` gains pre-selection as a requirement in its own right (being merely *present* in the list was the weaker claim, and the failure it now excludes is an alt-text edit silently swapping the image); `AC-1044`'s lone-control rule is *qualified* rather than extended — an image region's form is a lone `alt` field that deliberately no longer opens, which the ticket body does not spell out but the source comment does; `AC-1043`'s narrowing is re-keyed on the absence of *either* editing surface, plus the grid's own bounded-scroll obligation to keep Save reachable.

**Five ACs added** — `AC-1112` through `AC-1116`: the grid replacing the dropdown, file-name labelling with tooltip fallback, thumbnails serving the origin's real bytes, the unloadable-tile tolerance, and the single-selection group with focus on open. Each is phrased at an observable boundary with no function or file names.

I also scanned the 18 untouched ACs on this story for stale `<select>`/handle-as-label claims — none found, so nothing outside the plan's lists needed touching.

## One observation for the next stage

Querying this branch's store, the six ACs I updated each appear **twice** in the story's children (same UID, two rows — 35 rows for 29 ACs). It's a query-layer artifact, not corruption: branch worktrees never persist a ticket index by design, so a record updated on the branch shows up in both main's cold index and the branch's own scan. `main`'s store lists each once, and `rebuild-index` refuses to run on a branch. Flagging it because the UAT-generation stage that follows reads exactly this children list, and its "one test per AC, no extras" rule is easier to satisfy if it knows six entries are doubled.

```
Upgrade mutations applied for plan item 2 of 2

Target Stories: story-3bf94bd4
Primary Story UID: story-3bf94bd4
Stories Modified: 1
ACs Modified: 6
ACs Added: 5
ACs Removed: 0

tickets_modified:
  stories:
    - "story-3bf94bd4"
  acceptance_criteria:
    modified:
      - "acceptance_criterion-26ffac6d"   # AC-1028
      - "acceptance_criterion-e2413484"   # AC-997
      - "acceptance_criterion-43e5a016"   # AC-1000
      - "acceptance_criterion-8acf277e"   # AC-1043
      - "acceptance_criterion-472674ff"   # AC-1044
      - "acceptance_criterion-170a171f"   # AC-1050
    added:
      - "acceptance_criterion-ed355bc1"   # AC-1112
      - "acceptance_criterion-2c69d77c"   # AC-1113
      - "acceptance_criterion-22ed9987"   # AC-1114
      - "acceptance_criterion-624507a8"   # AC-1115
      - "acceptance_criterion-cc097b48"   # AC-1116
    removed: []

Progress: 2 of 2 plan items complete
```
