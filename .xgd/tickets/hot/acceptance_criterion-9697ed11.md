---
uid: acceptance_criterion-9697ed11
id: AC-1332
type: acceptance_criterion
title: A rehearsal runs the same hooks and composes the same deploy invocation, uploads
  nothing, and is reported as rehearsed
created_by: xgd
created_at: '2026-08-20T05:31:03.038826+00:00'
updated_at: '2026-08-20T15:29:18.522227+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-d5167ced
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

A rehearsal is the same path as a real deploy, not a second one. Asked to rehearse, the deploy
command runs the **same hooks in the same order** with the same context, composes the **same**
deployment invocation with a single additional flag, and uploads nothing. It announces at the
start that it is rehearsing and that hooks are being told to change nothing, and its closing
report names each Worker with a marker distinguishing "rehearsed, not uploaded" from a real
deploy — a real deploy instead reports each Worker with the environment it went to, and points at
the command that proves it serves.

## Verification

Rehearse a deploy of a known app and observe: the hooks run, each is told this is a rehearsal, the
composed invocation differs from a real deploy by the rehearsal flag alone, nothing is uploaded,
and the closing report marks the Worker as rehearsed rather than deployed. Compare the hook
sequence and the invocation against a real deploy of the same app to confirm they are the same
apart from that flag.