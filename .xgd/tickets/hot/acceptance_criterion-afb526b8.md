---
uid: acceptance_criterion-afb526b8
id: AC-749
type: acceptance_criterion
title: An element whose text wraps into several runs gives each run its own box and
  glyph extent
created_by: xgd
created_at: '2026-08-03T00:25:10.927422+00:00'
updated_at: '2026-08-03T00:25:10.927422+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-244827df
  kind: behavior
  regression_only: false
---

## Criterion
Where one element's text is captured as more than one run (a heading wrapping
across lines), each run records its OWN box and its own glyph extent, measured
from the line it occupies — not the shared parent element's box.

No two runs in a capture share an identical glyph extent unless the text they
describe genuinely occupies the same rect. An element holding exactly one run is
unchanged: it continues to record the element's own box and glyph extent.

## Verification
Capture a page whose hero heading wraps onto two lines: the two recorded runs
carry different vertical positions, each matching its own line, and different
glyph extents. Control: a single-line heading on the same page records the
element box and glyph extent as before, with the rest of that page's captured
values unchanged.
