---
uid: acceptance_criterion-2527b709
id: AC-2103
type: acceptance_criterion
title: Document versions in the packed bundle and in the index are stamped at the
  same (whole-second) resolution, so an unchanged file never reads as skewed
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T09:04:54.438910+00:00'
updated_at: '2026-11-01T09:04:54.438910+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-c4f329d3
  kind: behavior
  regression_only: false
---

## Criterion

The packed knowledge base stamps each document's version at **whole-second precision** — the same spelling the index writes into its manifests (`YYYY-MM-DDTHH:MM:SSZ`, no fractional seconds).

So a document that has not changed since it was indexed reads as **current**, whatever the sub-second part of its file time: the agreement check never reports a stale document on a build that is in fact up to date.

## Verification

Build a fixture knowledge base whose corpus files have modification times that are not on a whole second, index it, and pack it. Assert every packed document stamp has no fractional-seconds component, equals the corresponding manifest entry for that document, and that the agreement check reports nothing stale.
