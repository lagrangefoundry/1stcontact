---
uid: acceptance_criterion-b1bcd8ef
id: AC-961
type: acceptance_criterion
title: The shared UI components are served byte-identical from an installed copy that
  lives outside this repository
created_by: xgd
created_at: '2026-08-07T01:43:56.030367+00:00'
updated_at: '2026-08-07T23:16:14.677178+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
---

## Criterion

The workspace loads its shared UI components from an installed copy that resides
outside this repository. The bytes the workspace serves for a component are
byte-identical to the bytes of that installed copy, and no component source
exists inside this repository — the components are consumed, never copied,
patched or wrapped.

The copy that is consumed must be the right one, not merely a copy with the right
name. For every component the workspace uses, the installed package that gets
resolved declares itself — in its own published identity — as that component
under the scope this repository consumes; a same-named package left behind under
a scope the components were previously published under does not satisfy this,
even though it resolves and mounts.

This is asserted, not skipped. On a machine where the components are not
installed, or are installed only under a superseded scope, this criterion fails
and names the component it could not account for. It does not report that there
was nothing to check.

## Verification

For each component the workspace uses, request its module over the workspace
origin and compare the response bytes to the installed file's bytes: they are
identical. Assert the installed file's resolved location is outside this
repository's directory. For each component, additionally read the resolved
package's own declared identity and assert it equals that component's name under
the scope in use — checked per component, so a failure names which one. Assert
the components are reported as installed, as an outcome of the check rather than
as a precondition for running it. Independently, scan the repository's own
sources and assert no component source file is present, and that resolution was
not redirected, aliased or stubbed to reach a copy inside the repository.
