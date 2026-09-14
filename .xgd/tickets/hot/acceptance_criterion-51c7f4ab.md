---
uid: acceptance_criterion-51c7f4ab
id: AC-1786
type: acceptance_criterion
title: A perceptual diff runs end to end inside the deployed serverless runtime, from
  images in the object store, and reproduces the CLI's verdicts
created_by: martin-github@westhead.me
created_at: '2026-09-14T05:06:20.020946+00:00'
updated_at: '2026-09-14T05:06:20.020946+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-046cfc56
  kind: behavior
  regression_only: false
---

## Criterion
Inside the deployed serverless runtime — where no native module can load and no
filesystem exists — two images can be encoded, stored in the object store, fetched
back, decoded and diffed, and the diff reports the same mean difference, band
profile, dimensions, over-threshold percentage and ranked regions that the
command-line tool reports for the same input. The comparison code exercised there
is the same code the command line uses, not a copy or a shim.

## Verification
In a test project running in the deployed runtime against real bindings: build two
rasters with a known difference, encode them, put them in the bucket, get them
back, decode and diff. Assert the mean, bands, dimensions and percentage equal the
values the existing command-line diff tests assert for the same input, and that
the regions found and their bounding boxes match. Assert the modules imported are
those the command line imports.
