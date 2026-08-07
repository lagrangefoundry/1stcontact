---
uid: acceptance_criterion-0ceb3be6
id: AC-948
type: acceptance_criterion
title: The edit render carries the same content as the preview render, and the page
  deliberately does not work
created_by: xgd
created_at: '2026-08-06T21:25:35.172889+00:00'
updated_at: '2026-08-07T18:00:46.642553+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-af36c2cb
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Rendering a site's edit channel produces a page carrying the same content as the
preview render of the same definition — the same copy, the same images, the same
module instances — with every means of using it removed:

- **No navigable link target.** A linked region keeps its link element, so the
  page's structure, styling and geometry are unchanged, but carries no
  destination, no new-tab instruction and no accompanying window-opener
  protection. Clicking it cannot navigate.
- **No form destination and no submit verb**, so nothing on the page can send
  anything anywhere.
- **No behaviour or motion code.** The page references no behaviour bundle and no
  motion code, and no behaviour bundle is written into the edit channel's output
  location beside it — a bundle left in the directory is one stray reference from
  the page working again.

The preview render of the same definition, by contrast, carries a real link
destination, a real form destination and verb, and a behaviour bundle.

## Verification

Render both the preview and the edit channel of the same seeded site through the
command line. Assert the same copy appears in both. Assert the preview output
carries a link destination, a form destination and verb, and a behaviour-bundle
reference; assert the edit output carries none of those, that its link element
survives around the same copy, and that no behaviour bundle file exists in the
edit channel's output directory.