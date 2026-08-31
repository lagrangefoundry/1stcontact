---
uid: acceptance_criterion-fda70dbc
id: AC-907
type: acceptance_criterion
title: A URL component that is empty, dot-shaped, separator-bearing or malformed returns
  not-found and reaches no stored bytes
created_by: xgd
created_at: '2026-08-06T18:49:03.282127+00:00'
updated_at: '2026-08-31T11:53:02.050771+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-d34eccd8
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

A requested path whose components include an empty segment, a single or double
dot, an escaped path separator, a NUL, or malformed percent-encoding returns
not-found without any storage read being attempted. The same applies to a site
name whose shape is outside what the addressing scheme permits, and to any path
that does not begin with the segment every site is served under.

Traversal-shaped input therefore cannot steer a request at bytes belonging to
another site, another revision, or the store's own bookkeeping. Each path
component is decoded exactly once, so a percent-encoded separator becomes a
rejection rather than an extra path segment.

## Verification

Drive the public entry point with each malformed and traversal-shaped path form,
including their percent-encoded spellings, and assert not-found in every case.
Assert with an instrumented store that no lookup of stored bytes was attempted
for these requests, and that a well-formed request in the same suite does read.
Assert a single-encoded space in an object name survives decoding into the key
it names rather than being rejected, so the rule is about shape and not about
encoding as such.
