---
uid: acceptance_criterion-e168bc67
id: AC-1778
type: acceptance_criterion
title: The pinned corpus exercises every decode path that could differ, and each entry
  decodes to its recorded pixels
created_by: martin-github@westhead.me
created_at: '2026-09-14T05:05:07.057790+00:00'
updated_at: '2026-09-14T05:16:33.540101+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-046cfc56
  kind: behavior
  regression_only: false
---

## Criterion
The corpus is not an arbitrary handful of images: it covers, and is shown to
cover, each decode path a codec can get wrong —

- all five per-row filters, cycled down the rows of one image
- image data split across several chunks of a single compressed stream
- a row stride that is not a whole multiple of the pixel size
- sub-byte greyscale depths and sub-byte indexed depths
- a palette with and a palette without a transparency table
- a full-page-shaped screenshot, tall enough to stand in for real input

Every entry decodes successfully and to its recorded pixels. The corpus entries
are authored by hand rather than produced by an encoder, because asking an encoder
for a specific row filter is asking it to hit one by luck.

## Verification
Assert, independently of the decoder, that the multi-filter entry really does use
all five filters and that the split-stream entry really is split across more than
one chunk — a fixture's claim about its own shape is checked, not trusted. Then
decode each entry and assert against the recorded digests.