---
uid: report-2ab7f078
id: REPORT-1019
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-07-29T04:06:11.976028+00:00'
updated_at: '2026-07-29T04:06:11.976028+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-cceaba25
  plan_item_index: '2'
---

Upgrade mutations applied for plan item 2 of 5

**Target Stories:** story-8acc338d (STORY-84)
**Primary Story UID:** story-8acc338d
**Stories Modified:** 1
**ACs Modified:** 2
**ACs Added:** 5
**ACs Removed:** 0

```yaml
tickets_modified:
  stories:
    - "story-8acc338d"          # STORY-84, story_kind feature -> upgrade
  acceptance_criteria:
    modified:
      - "acceptance_criterion-7785b92a"   # AC-689 — now full-language document (text/image/box/surface + band + font table)
      - "acceptance_criterion-304cae4c"   # AC-691 — box/image pin height; text height stays natural
    added:
      - "acceptance_criterion-39597704"   # AC-729 — image leaf: resolved src + alt, axes, id, visibility; no src/geometry -> residual
      - "acceptance_criterion-70f63c60"   # AC-730 — standalone painted surface -> box leaf
      - "acceptance_criterion-6a5e0eec"   # AC-731 — run-composited surfaces: band + backing boxes emitted first
      - "acceptance_criterion-fc2b37b5"   # AC-732 — text pixel-mover families + painted-families-only font table
      - "acceptance_criterion-0d993a36"   # AC-733 — signal-not-drop typed residuals; form control always a residual
    removed: []
```

Notes on judgment calls, grounded in the intent tickets and their comments (read before the code):

- **Opt-in residual channel recorded as intent, not accident.** REQ-92's implementation comment states the out-collector was a deliberate design decision (keeps `foldToL1`'s published return shape unchanged). AC-733 therefore pins both branches — collector supplied → one typed residual per unexpressed element; omitted → same document, no channel — matching `test_UAT_FC_REQ-92_drop_stays_silent_without_the_collector`.
- **Transform/mask non-folding is a stated invariant, not a gap.** The commit and ticket both record that the captured box is post-transform, so folding those axes would double-apply. Written into AC-732 and the story's Technical Context rather than left as an undocumented omission.
- **Gate-side residual presentation left alone.** BUG-6's contract spans the fold and the gate; only the fold half is documented here. The story's Out-of-scope now names the gate's residual channel explicitly, so plan item 3 (STORY-86) carries it without duplication.
- **Image `src`/`alt` plumbing** (extract → field → manifest) is expressed as an observable outcome on AC-729, not as a values-diff change — it adds no comparison axis.
- The stale "fold currently emits text leaves only" divergence note in the story's Technical Context was replaced with the closing statement: only form controls and unclassifiable text-free elements remain residuals by design.

No new story tickets were created; no runtime code was touched.

Progress: 2 of 5 plan items complete
