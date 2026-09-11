---
uid: acceptance_criterion-c1ab33b4
id: AC-1687
type: acceptance_criterion
title: With no indexer configured the file is still stored, and both the answer and
  the deployment log say it cannot be found
created_by: martin-github@westhead.me
created_at: '2026-09-11T04:08:15.743889+00:00'
updated_at: '2026-09-11T04:08:15.743889+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-6ccaedd5
  kind: behavior
  regression_only: false
---

## Criterion

A deployment with no indexer configured still stores the client's file, and says — twice, to
two audiences — that nothing will find it.

On such a deployment an ingestion succeeds: the material is created and readable afterwards,
exactly as it is when an indexer is present. In addition:

- the answer returned to the caller states that the material was **not** indexed, so a
  surface can tell the client "stored, but not yet findable" without a second request;
- the deployment emits one warning for that ingestion, naming the material that was stored
  and the missing configuration that has to be supplied to fix it.

An ingestion on such a deployment is never reported to the client as a failure.

## Verification

Ingest a file on a deployment configured with no indexer. Assert the ingestion succeeds and
that reading the material back afterwards returns a real record. Assert the answer reports
the material as not indexed. Capture the deployment's warnings and assert exactly one was
emitted for this ingestion, that it names the material's identifier, that it says the
material was not indexed, and that it names the configuration to add. One warning per
affected ingestion, not per request and not per boot.
