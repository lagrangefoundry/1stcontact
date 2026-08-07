---
uid: report-014e91ad
id: REPORT-1556
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-08-07T04:42:20.876538+00:00'
updated_at: '2026-08-07T04:42:20.876538+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: request-66e4c630
  plan_item_index: '2'
---

All mutations applied. Working tree is clean — no runtime code was touched.

Verification: the story now has **17 unique ACs** (13 pre-existing + 4 added). The doubled rows in the `--related` listing were the view rendering pre- and post-update titles for the 5 modified ACs; direct fetch of each confirms a single ticket per UID.

**Two ACs were modified beyond the plan's `modify` list**, both required by the documentation-completeness constraint rather than by discretion:

- **AC-991** — its body asserted "Every field this surface offers is a plain-text field" and its verification step said "assert every offered field is of plain-string type". That is now false against an image region, so the AC as written would fail. Restated as the plan's delta summary directs: two shapes, plain text or a pick from a list the surface itself supplied, with the raw-code guarantee intact because a closed list is *narrower* than a free string.
- **AC-981** — read "a region that is **not copy** — a layout container, a behavior-module instance". An image region is not copy but now exposes two fields, so the qualifier was wrong. Sharpened to "a region that exposes nothing", with the image case named explicitly as excluded. This also matches the deliberate REQ-117 test change (image → painted container as the nothing-to-edit specimen), which the plan correctly assigned no plan item.

The story **title** also changed ("the words" → "the words and choose the images"), since the surface's scope prose no longer matched it.

I did **not** add an AC for the browser gesture being kind-agnostic. The plan's observation is right: the evidence is the *absence* of a diff in the editor, and no test drives it with an image. It is recorded in Technical Context instead.

```
Upgrade mutations applied for plan item 2 of 2

Target Stories: story-37a3921b
Primary Story UID: story-37a3921b
Stories Modified: 1
ACs Modified: 5
ACs Added: 4
ACs Removed: 0

tickets_modified:
  stories:
    - "story-37a3921b"
  acceptance_criteria:
    modified:
      - "acceptance_criterion-289bbf76"   # AC-986 validator generalised to any edit on this surface
      - "acceptance_criterion-97f5dee6"   # AC-988 third refusal: a choice the region never offered
      - "acceptance_criterion-9561711e"   # AC-992 origin equivalence extended to the image path
      - "acceptance_criterion-08c7ebe8"   # AC-991 field vocabulary restated (beyond plan list)
      - "acceptance_criterion-95afd919"   # AC-981 "not copy" -> "exposes nothing" (beyond plan list)
    added:
      - "acceptance_criterion-8b6792de"   # AC-1024 image region exposes picker + alt, narrowed to images
      - "acceptance_criterion-b9c7e872"   # AC-1025 current handle always among its own options
      - "acceptance_criterion-0bc092af"   # AC-1027 choosing an image bakes nothing
      - "acceptance_criterion-d4bc1184"   # AC-1026 choice updates draft + render, alt in same diff
    removed: []

Progress: 2 of 2 plan items complete
```
