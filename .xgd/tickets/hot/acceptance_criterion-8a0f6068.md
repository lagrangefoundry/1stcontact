---
uid: acceptance_criterion-8a0f6068
id: AC-1684
type: acceptance_criterion
title: A file over the ceiling, or with no bytes at all, is refused in words a client
  can act on and leaves no material behind
created_by: martin-github@westhead.me
created_at: '2026-09-11T04:08:02.121791+00:00'
updated_at: '2026-09-11T04:08:02.121791+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-6ccaedd5
  kind: behavior
  regression_only: false
---

## Criterion

A file the platform will not store is refused **before anything is created**, in words a
non-technical client can act on.

- A file above the per-file ceiling is refused with a message stating the file's size and the
  limit in units a person reads (megabytes, not bytes), and suggesting what to do about it.
  The message contains no raw byte counts and no diagnostic text addressed to a programmer.
  The refusal is reported as a request that was too large, distinctly from an ordinary
  malformed request.
- A file with no bytes at all is refused with a message saying there is nothing to store.

In both cases the count of the account's material is the same after the refusal as before it:
no record, no attached bytes, nothing to clean up.

## Verification

Count the account's material. Send a file one byte over the ceiling, assert the refusal is
reported as too-large, assert the message states both sizes in megabytes and offers a remedy,
and assert it contains no long raw byte count. Send a zero-byte file and assert the refusal
says there is nothing to store. Re-count the account's material after each and assert it is
unchanged.
