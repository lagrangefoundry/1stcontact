---
uid: acceptance_criterion-c8728ae8
id: AC-1328
type: acceptance_criterion
title: One invocation runs two runtimes, routed by filename, with real bindings in
  the Workers one
created_by: xgd
created_at: '2026-08-20T05:10:46.263361+00:00'
updated_at: '2026-08-20T05:24:45.360888+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-3f4a5f2b
  kind: behavior
  regression_only: false
---

## Criterion

One test invocation runs two runtimes, and a test file's runtime is legible from its name alone.

- A test file whose name carries the workers marker runs inside the Workers runtime. It reports
  the Workers user agent; it reaches a real database binding, applies a schema, reads that schema
  back out of the database's own catalogue, round-trips a row, and has a primary key enforced by
  the database rather than by the test; and it reaches a real object-store binding, writing and
  reading back an object whose size and entity tag are computed by the object store and whose
  stored metadata survives the round trip.
- Every other test file runs in the runtime that has a filesystem, and reports a user agent that
  is not the Workers one.
- The two runtimes' inclusion rules agree with each other: no file is claimed by both, and none
  by neither. The composing configuration declares no suite of its own, so a test placed there
  could not run in neither runtime unnoticed.
- The Workers runtime declares the same compatibility date and flags the deployed Workers
  declare, and names its bindings as the deployed Workers name them — so a test cannot pass on
  behaviour a deployed Worker does not have.

## Verification

Run the full invocation and assert both runtimes executed. In the Workers-marked test, assert the
user agent, the database round trip including schema read-back and key enforcement, and the
object-store round trip including the server-computed size and entity tag. In an unmarked test,
use a filesystem module at load time — so the file could only have loaded where one exists — and
assert the user agent is not the Workers one. Assert the two inclusion rules partition the test
files and that the composing configuration contributes none of its own. Assert the Workers
runtime's compatibility settings and binding names match those the deployed Workers declare.