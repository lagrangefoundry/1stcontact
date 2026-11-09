---
uid: report-3edf91ec
id: REPORT-11724
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-11-09T06:33:40.533433+00:00'
updated_at: '2026-11-09T06:33:40.533433+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-0881342c
  plan_item_index: '2'
---

Plan item 2 is done: I added a delivery-ladder section to STORY-83 (story-d0a8cfad) and created 5 new ACs under it. No existing ACs were changed or removed.

The intent ticket (REQ-222) and the renderer code agree on everything this item covers, so nothing needed resolving beyond the ticket body. The new ACs say:

- **AC-2529, srcset and sizes:** with a publish manifest, the `<img>` gets a `srcset` and a `sizes` worked out from the node's layout width. Without one, the plain `src` is emitted as before.
- **AC-2530, width and height:** the `<img>` gets `width`/`height` from the picture's measured size whenever the manifest has an entry for it.
- **AC-2531, background images:** the base rule uses the smallest-width rendition, and a wider-breakpoint rule is emitted only where the choice changes. Renditions are picked for a 2× screen.
- **AC-2532, layer stack:** a per-width background override keeps the scrim and gradient layers. A rendition URL that fails sanitisation falls back to the original URL instead of dropping the image.
- **AC-2533, document and URL safety:** the site document gains no delivery fields, and rendition URLs get the same safety checks as any `src`.

Three behaviours the ticket doesn't mention are recorded in the story under "Reconciliation Decisions":
- `width`/`height` are stamped even when no `srcset` survives.
- A fluid width with a maximum still gets a `sizes`.
- Unsafe `srcset` entries are dropped one at a time, and the attribute is kept if at least two survive.

**Code issue to follow up:** REQ-222's 2026-09-11 and 2026-09-12 sections say the renderer wraps the `<img>` in a `<picture>` with a WebP `<source>` first. This bundle's code emits no `<picture>` or `<source>` anywhere. This item's AC list doesn't include it, so I added no AC for it. The story notes it as outstanding, and nothing here retracts it.

Each ticket write logged a blocked connection to `github.com:22`. The writes themselves succeeded locally, but they may not have reached the remote.

```
Upgrade mutations applied for plan item 2 of 6

Target Stories: story-d0a8cfad
Primary Story UID: story-d0a8cfad
Stories Modified: 1
ACs Modified: 0
ACs Added: 5
ACs Removed: 0

tickets_modified:
  stories:
    - "story-d0a8cfad"
  acceptance_criteria:
    modified: []
    added: ["acceptance_criterion-511b0694", "acceptance_criterion-e432172c", "acceptance_criterion-cde4f58c", "acceptance_criterion-df2932d3", "acceptance_criterion-f4fe3573"]
    removed: []

Progress: 2 of 6 plan items complete
```