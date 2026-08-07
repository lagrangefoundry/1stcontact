---
uid: acceptance_criterion-4cd04340
id: AC-1018
type: acceptance_criterion
title: A file present in the site's assets is listed even when the site definition
  never declared it
created_by: xgd
created_at: '2026-08-07T04:29:35.825531+00:00'
updated_at: '2026-08-07T18:45:06.783228+00:00'
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

Asking a site for its assets returns every file present in the site's draft asset
area, whether or not the site definition declares it. Each such entry reports:

- a handle naming the file,
- an identity (for an undeclared file, the file's own name),
- a usage kind,
- present-on-disk: true,
- declared-in-definition: false.

This is the state every real site is in — a full asset directory beside an empty
declared registry — so a listing that reported only declared assets would name
nothing at all on the sites actually being built.

## Verification

Build a site whose asset directory holds several files and whose definition
declares none of them, then ask the site for its assets. Assert every file is
present in the answer, and that each undeclared file's entry carries its own
filename as its identity and is flagged as on-disk and undeclared.