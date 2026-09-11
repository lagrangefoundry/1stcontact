---
uid: report-b76f6bbf
id: REPORT-3921
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-09-11T05:03:33.483760+00:00'
updated_at: '2026-09-11T05:03:33.483760+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-87be4669
  plan_item_index: '10'
---

Story and all five criteria are committed. Grounding, for the record: I read REQ-163's and REQ-161's bodies from the bundle ticket first (the gate's "ships here, unrouted" decision, the "What was built" correction on copying bytes, and REQ-161's free-name and don't-lose-the-upload clauses), then the landed code (`promoteToSiteAsset`, `freeAssetName`, `readBlob`, the router's `placeOnSite`/upload route, `classify`'s role narrowing) and the two FC suites' promotion tests via `git show` — the files aren't in this worktree yet, as the plan noted.

Three judgment calls worth naming:

- **The intent contradicts itself and the later passage won.** REQ-163's decisions section says promotion "writes a `site_assets` row pointing at the existing blob"; its own "What was built" section withdraws that, with the bucket-boundary reason. The criteria assert a copy, stated as an observable property (the asset reads back from the site, the material stays private) rather than as a storage mechanism. Recorded as a Reconciliation Decision.
- **Two behaviors the intent is silent on were formalized**: refusing material with no bytes behind it, and scrubbing platform secrets out of the reported placement failure — the latter as a clause of the failure criterion, since a success response carrying a caught error's message is the one shape that looks like it escapes the origin's redaction guarantee.
- **The role/overlay boundary was kept off this story.** The end-to-end "marked just-for-reading cannot reach a site" assertion is stated here as a consequence of the rights record (which is the gate's claim); the drop areas and the conversation reporting stay with plan item 12, and the declared `role` field with item 13.

```
Story #10 created for reconciliation bundle-87be4669

Story UID: story-aacb7060 (STORY-143)
Title: Site-Asset Promotion: Only Material The Client May Publish Reaches Their Public Site
Type: feature
Acceptance Criteria: 5 created (AC-1709 … AC-1713)

Progress: 10 of 17 plan items complete
```
