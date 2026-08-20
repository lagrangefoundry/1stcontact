---
uid: acceptance_criterion-44e80e3c
id: AC-1335
type: acceptance_criterion
title: Deploy targets default to every discovered app, honour named apps, and refuse
  an unknown one listing those that exist
created_by: xgd
created_at: '2026-08-20T05:31:16.393986+00:00'
updated_at: '2026-08-20T05:57:19.914254+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-d5167ced
  kind: behavior
  regression_only: false
---

## Criterion

Deploy targets are selected from the apps discovered in the tree. With no app named, every
discovered app is deployed. With one or more apps named, only those are deployed and the others are
untouched. An app name that matches nothing discovered is refused before any hook runs and before
anything is uploaded, with a message naming the unknown app **and** listing the apps that do exist.
The target environment defaults to production and can be named explicitly; naming the environment
option with no value is refused.

## Verification

Rehearse with no app named and confirm every discovered app appears in the report. Rehearse naming
one app and confirm only that one appears. Rehearse naming an app that does not exist: the command
exits non-zero, its message names that app and lists the real ones, and no hook output appears.
Rehearse with the environment option and no value: the command exits non-zero saying the option
needs one.