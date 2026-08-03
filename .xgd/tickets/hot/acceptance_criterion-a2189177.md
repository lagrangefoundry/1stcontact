---
uid: acceptance_criterion-a2189177
id: AC-740
type: acceptance_criterion
title: A font family served by a cross-origin stylesheet reaches the captured bundle
  as mirrored face files
created_by: xgd
created_at: '2026-08-03T00:24:30.598679+00:00'
updated_at: '2026-08-03T00:53:41.458948+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-244827df
  kind: behavior
  regression_only: false
---

## Criterion
When a page paints text in a family whose `@font-face` declarations are served by
a stylesheet from another origin (the common hosted-font case), the written
capture bundle records that family with the local path(s) of its mirrored face
file(s), and those files are present among the bundle's mirrored assets.

Bounded by what actually mirrored:
- a family whose face files were never retrieved records an empty file list —
  the capture never invents a handle it does not hold;
- families declared by a same-origin stylesheet are recorded as well; the two
  sources are combined rather than one replacing the other, with no duplicate
  file entry for a family.

## Verification
Capture a page whose only web font is declared cross-origin and inspect the
written bundle: the family's recorded file list names a mirrored face file that
exists in the bundle. Negative control: a declared face whose file was never
retrieved leaves that family's file list empty. Union control: a page declaring
one face same-origin and one cross-origin records both, each once.