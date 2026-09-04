---
uid: acceptance_criterion-26d670bb
id: AC-1527
type: acceptance_criterion
title: A document just given to the platform is findable in the same moment it is
  recorded
created_by: xgd
created_at: '2026-09-04T03:36:28.009318+00:00'
updated_at: '2026-09-04T03:46:51.806544+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-0fb17a68
  kind: behavior
  regression_only: false
---

## Criterion

Recording a new document in the client's knowledge — a piece of material, a captured reference, or
the brief — makes that document findable before the recording operation reports back. The client
does not have to wait for anything else to happen, and no separate "refresh" step exists that a
caller could forget: a search of the client's knowledge issued immediately after the record is
reported returns that document among its results, matched on words that appear only in that
document's own content.

The report of the recording states how many documents the client's knowledge now covers, so a caller
can tell the corpus grew without searching for the document to find out.

## Verification

Against a client's knowledge, record a document whose content contains a distinctive phrase that
appears nowhere else in the corpus. As the very next action — with no refresh, rebuild or wait in
between — search the client's knowledge for that phrase and observe the new document among the
results. Observe the document count reported by the recording.