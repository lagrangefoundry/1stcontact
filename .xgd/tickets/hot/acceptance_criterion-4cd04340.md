---
uid: acceptance_criterion-4cd04340
id: AC-1018
type: acceptance_criterion
title: Every file in the site's asset store is listed, and nothing marks any of them
  as undeclared
created_by: xgd
created_at: '2026-08-07T04:29:35.825531+00:00'
updated_at: '2026-10-26T01:09:49.686587+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-c46abfa6
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Asking a site for its assets returns every file present in the site's asset
store — and nothing else. Each entry reports:

- an id: the file's own name in the store,
- a handle naming the file in the site-local form a page holds,
- a usage kind,
- present-on-disk: true.

No entry carries a declared-in-definition, registered or alt field: the site
definition does not declare assets, so there is no second class of asset to
report. A file is listed whatever the site definition contains, including a
definition that still carries the retired site-level `assets` key, whose
contents neither add, remove nor annotate any entry.

## Verification

Build a site whose asset store holds several files, then ask the site for its
assets. Assert every file is present, each entry's id is its filename and it is
flagged on-disk, and no entry carries a registered/declared or alt field. Repeat
with a stored definition whose legacy `assets` key names a file that is not in
the store and gives alt text for one that is: assert the answer is unchanged —
the named-but-absent file is not listed and no entry carries the alt text.
