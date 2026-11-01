---
uid: acceptance_criterion-0bc4c461
id: AC-2108
type: acceptance_criterion
title: Priming carries the grant-projected summary manual, never a capability the
  session was not granted, and a tool's full entry is one DescribeTools call away
created_by: xgd
created_at: '2026-11-01T09:27:29.547003+00:00'
updated_at: '2026-11-01T09:51:04.119002+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
---

## Criterion

The tool guide a session is primed with is the **summary** level of the manual, projected against this session's actual grant, on every host and on every priming path (with or without a knowledge base):

- it keeps what a model chooses with — each granted group with what it is for, and each granted operation with one line — and drops what it only needs to call with: parameter tables, return shapes and the errors an operation fails with;
- it is a fraction of the full reference for the same grant, not a re-wrapping of it;
- it names no operation the session was not granted;
- every capability group of the site surface carries a description, because under a summary the group's description *is* the prose and a group without one renders as a bare title;
- the full entry of any named tool is reachable in the same session through a `DescribeTools` operation offered alongside the granted tools, so dropping the detail from priming loses nothing but the tokens.

## Verification

For the consultant's grant on the site surface, compare the summary manual with the full manual: the summary is less than half the full manual's length, still names each granted group and operation, and contains neither the parameter marker `(string, required)` nor `Fails with`, both of which the full manual contains. Every group in the site surface declaration has a non-empty description. The tools offered to a consultant session include `DescribeTools`. Read the priming the real host assembles: its manual is the summary level, not the full reference.