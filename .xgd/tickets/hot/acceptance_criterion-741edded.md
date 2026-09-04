---
uid: acceptance_criterion-741edded
id: AC-1555
type: acceptance_criterion
title: A failure to read a file costs findability only; the upload still succeeds
created_by: xgd
created_at: '2026-09-04T04:12:48.461184+00:00'
updated_at: '2026-09-04T04:23:05.678979+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-724e4e8c
  kind: behavior
  regression_only: false
---

## Criterion

A failure while reading a file costs that file's findability and nothing else: the client's upload
still succeeds.

When whatever was reading the file is reached and fails — it throws, times out, is rate limited, or
returns nothing usable — the request that submitted the file still succeeds, the bytes are still
kept, and a material record is still created. That record states:

- an outcome distinguishing "reached and failed" from "nothing was configured", because one waits
  for a retry and the other for configuration,
- a description saying the description could not be produced, and carrying the reason so it is
  legible to whoever looks at the record,
- no producer.

No reading failure is ever reported to the client as a failed upload.

## Verification

Ingest an image with a describer that throws a recognisable error, and separately one that returns
an empty answer. Assert in each case that the response is a success carrying the created material,
the outcome is the reached-and-failed value and not the nothing-configured value, the description
carries the failure's own wording where there was one, and the stored bytes read back intact.