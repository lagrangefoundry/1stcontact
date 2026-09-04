---
uid: acceptance_criterion-83497580
id: AC-1542
type: acceptance_criterion
title: A file the platform will not hold is refused in words the client can act on,
  and nothing is left behind
created_by: xgd
created_at: '2026-09-04T03:53:42.362695+00:00'
updated_at: '2026-09-04T03:53:42.362695+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-70a922b9
  kind: behavior
  regression_only: false
---

## Criterion

A file the platform will not hold is refused before anything is created, and the refusal is written
for the person who dragged the file rather than for a programmer.

- **Above the ceiling.** A file larger than the stated per-file limit is refused. The message states
  the file's size and the limit in megabytes and suggests a smaller version. The outcome is
  distinguishable by the calling surface as "too large" rather than as a malformed request or a
  server failure.
- **Empty.** A file of zero bytes, and a retrieved address that returns an empty document, are
  refused with a plain statement that there is nothing to store.

In both cases nothing is left behind: no material record, no stored bytes, nothing for a later
listing to show.

## Verification

Send a file one byte over the stated limit. Assert the request is refused, that the message names
both sizes in megabytes and says what to do, that the refusal is reported in the "too large" form
rather than the generic malformed-request one, that no material record exists afterwards, and that
the account's stored-object count is unchanged. Repeat with a zero-byte file and with a retrieved
address returning an empty body, asserting a refusal and no material in each case.
