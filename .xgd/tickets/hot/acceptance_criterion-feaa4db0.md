---
uid: acceptance_criterion-feaa4db0
id: AC-1021
type: acceptance_criterion
title: Each asset reports what it can be used for, so a caller can narrow to one kind
created_by: xgd
created_at: '2026-08-07T04:29:50.005796+00:00'
updated_at: '2026-08-10T08:15:41.746657+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-c46abfa6
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Each entry reports a usage kind derived from the file itself: image for the raster
and vector picture formats a page can display, font for the web font formats, and
a residual kind for everything else (a stylesheet, an unrecognised file). The
listing itself narrows nothing — it returns every asset of every kind — so a
caller needing one kind filters on this value while a caller browsing the whole
store still sees fonts and stylesheets.

## Verification

Ask for the assets of a site whose directory holds pictures, a web font and a
stylesheet. Assert each entry's kind matches its file: pictures as image, the font
as font, the stylesheet as the residual kind; and assert the unfiltered listing
contains all of them.