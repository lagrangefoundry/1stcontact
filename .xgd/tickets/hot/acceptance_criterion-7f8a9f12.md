---
uid: acceptance_criterion-7f8a9f12
id: AC-1512
type: acceptance_criterion
title: Each reference names its source in its readable text and points its reader
  only there, never at an internal record
created_by: xgd
created_at: '2026-09-04T02:27:22.843317+00:00'
updated_at: '2026-09-04T02:41:24.339720+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-0d7d3aad
  kind: behavior
  regression_only: false
---

## Criterion

Every generated reference names, in its readable text and not only in its metadata, the source its facts came from, and states that it is rebuilt from that source on every build so an edit made to it by hand is lost.

The only place a generated reference points its reader is that source. It contains no reference to an internal ticket or engineering record, in any part of the document: retrieval returns passages rather than whole documents, so an assistant reading one passage mid-conversation must still be able to say where the fact came from and where to go to change it — and must never send the client's assistant to an internal record it cannot open and would be the wrong reader for.

## Verification

Read each generated reference and assert its readable text names its source of truth and warns that hand edits are lost. Assert no generated document contains an internal ticket or engineering-record reference anywhere in its text or metadata, including inside definitions lifted from sources whose own prose carries such references.