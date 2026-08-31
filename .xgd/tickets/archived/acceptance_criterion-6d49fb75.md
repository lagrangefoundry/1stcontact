---
uid: acceptance_criterion-6d49fb75
id: AC-898
type: acceptance_criterion
title: A dry run prints the complete plan, writes nothing, and does not disturb the
  real deploy that follows
created_by: xgd
created_at: '2026-08-06T18:39:44.710694+00:00'
updated_at: '2026-08-16T07:23:18.249881+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-5349d01f
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

With the dry-run option, the deploy performs and reports the full plan — every
stage it would run, including each upload group and the shareable URL it would
return — while making no change to shared storage: no snapshot objects, no
deploy index, no recorded keys. The report states plainly that it was a dry run.
A subsequent real deploy of the same unchanged site is unaffected by the
rehearsal: it produces the same content id and is *not* reported as already
deployed.

## Verification

Dry-run a deploy. Assert the result reports no uploaded objects, that shared
storage contains nothing and no deploy index exists, and that the printed report
names the upload stages, says "dry-run", and contains the URL. Then run a real
deploy and assert it produces the same content id, is not flagged as already
deployed, and this time does write objects.