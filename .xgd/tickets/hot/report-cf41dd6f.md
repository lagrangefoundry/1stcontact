---
uid: report-cf41dd6f
id: REPORT-357
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-07-09T21:59:09.880273+00:00'
updated_at: '2026-07-09T21:59:09.880273+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-adc60ee8
  plan_item_index: '1'
---

All mutations applied and verified. Here is the completion report.

```
Upgrade mutations applied for plan item 1 of 8

Target Stories: story-a224111f (STORY-55)
Primary Story UID: story-a224111f
Stories Modified: 1
ACs Modified: 2
ACs Added: 6
ACs Removed: 0

tickets_modified:
  stories:
    - "story-a224111f"   # STORY-55 — body + story_kind=upgrade
  acceptance_criteria:
    modified:
      - "acceptance_criterion-405a5205"  # AC-500: logoTreatment now plain|gold|gradient (text-wordmark only)
      - "acceptance_criterion-46a9c79b"  # AC-438: chrome contract now lists structured art-direction dials + gradient fields
    added:
      - "acceptance_criterion-17029d3e"  # hero headingTreatment (plain/accent/gold/gradient)
      - "acceptance_criterion-a3447328"  # hero height/scrim/contentAnchor/subheadColor/subheadSize + markdown subhead
      - "acceptance_criterion-1550b79d"  # header align/logoSize/xl-spacing + display-wordmark (tight tracking, true weight)
      - "acceptance_criterion-c0f7dd88"  # footer layout (center|spread)
      - "acceptance_criterion-139cc347"  # generalized gradient text treatment {direction, stops[]}
      - "acceptance_criterion-f67e9ebc"  # expanded palette roles (secondary/neutralCool/accentLight/accentDeep/accentMid)
    removed: []

Progress: 1 of 8 plan items complete
```

## Notes on code-alignment precision

Reading the code (not just the plan) surfaced two points where I sharpened the ACs beyond the plan's wording to keep them accurate to what the code actually does:

- **`accentMid` is optional but NOT defaulted.** `packages/framework/src/tokens/defaults.ts` backfills `secondary`, `neutralCool`, `accentLight`, `accentDeep` (so those `--color-*` properties always emit), but `accentMid` is only in the site-schema as an optional role — its `--color-accent-mid` is emitted **only when the site declares it**. The plan's proposed AC said all five are "filled from defaults"; the palette AC now states the four-vs-one distinction correctly.
- **`scrim` applies to the `bg-image` variant** (`{bgImage && scrim !== 'none'}` in `hero/index.astro`) and **`contentAnchor` only affects a `fold`-height band** — both scoping facts are now in the hero AC rather than stated as unconditional.

Both existing header/contract ACs were sharpened rather than left stale: `logoTreatment` gained its third `gradient` value, and the chrome-contract AC now enumerates the structured art-direction dial surface. No runtime code was modified; no new stories were created; all six behaviors are generalizations landing on the existing STORY-55 chrome/theme buckets (CLAUDE.md generalize-first), consistent with the reconciliation plan's upgrade classification.
