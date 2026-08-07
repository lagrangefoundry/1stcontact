---
uid: acceptance_criterion-b1bcd8ef
id: AC-961
type: acceptance_criterion
title: The shared UI components are served byte-identical from an installed copy that
  lives outside this repository
created_by: xgd
created_at: '2026-08-07T01:43:56.030367+00:00'
updated_at: '2026-08-07T21:19:34.141000+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

The workspace loads its shared UI components from an installed copy that resides
outside this repository. The bytes the workspace serves for a component are
byte-identical to the bytes of that installed copy, and no component source
exists inside this repository — the components are consumed, never copied,
patched or wrapped.

## Verification

For each component the workspace uses, request its module over the workspace
origin and compare the response bytes to the installed file's bytes: they are
identical. Assert the installed file's resolved location is outside this
repository's directory. Independently, scan the repository's own sources and
assert no component source file is present.