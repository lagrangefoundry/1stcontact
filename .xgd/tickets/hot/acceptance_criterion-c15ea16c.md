---
uid: acceptance_criterion-c15ea16c
id: AC-1019
type: acceptance_criterion
title: A declared asset contributes its identity and description, and is listed even
  with no file present
created_by: xgd
created_at: '2026-08-07T04:29:40.678466+00:00'
updated_at: '2026-08-07T18:45:07.739459+00:00'
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

An asset the site definition declares is listed with the identity and descriptive
text (alt) the definition gives it, flagged as declared. Where a file for it is
also present, the two sources merge into a single entry — one entry per handle,
never two — carrying the definition's metadata and present-on-disk: true. Where no
file for it exists, the entry is still listed, flagged present-on-disk: false, so
the disagreement between the two sources is visible rather than silently resolved.

## Verification

Ask for the assets of a site whose definition declares one asset that also exists
on disk and one that does not. Assert the on-disk declared asset appears exactly
once, carrying the definition's identity and alt text with both flags true; assert
the declared-but-absent asset appears with declared true and on-disk false.