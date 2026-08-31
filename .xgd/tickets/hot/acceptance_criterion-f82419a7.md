---
uid: acceptance_criterion-f82419a7
id: AC-1426
type: acceptance_criterion
title: The build refuses a Worker whose type program reaches a filesystem-bound module,
  naming the import chain that got there
created_by: xgd
created_at: '2026-08-31T12:12:29.978850+00:00'
updated_at: '2026-08-31T12:12:29.978850+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-d5167ced
  kind: behavior
  regression_only: false
---

## Criterion

The build refuses a Worker whose **type** program reaches a filesystem-bound module, and names the
import chain that got there.

A Worker package declares platform types and no host-runtime types, so a filesystem-bound module in
its type program is a build failure. The refusal exists because a bundle-level guard is
structurally blind to this class: a type-only import is erased before a bundler resolves it and is
**not** erased before the typechecker, so the shipped bundle stays correct while the build breaks —
and a suite that only walks runtime imports stays green throughout. That is not a hypothetical: a
single specifier importing a type from a module that merely re-exported it, while itself reaching
the filesystem, is what broke this build.

The refusal therefore walks **every** import the typechecker walks, type-only edges included, from
each Worker entry point outward. On a violation it fails and reports the shortest chain from the
entry point to the offending module, so the diagnosis is the specifier to change rather than a list
of unresolved names.

The refusal must be shown to be capable of failing: it reaches modules known to be on the Worker's
path, and it follows at least one type-only edge — the kind a runtime-import walk deliberately
skips, and the only kind that produced this failure.

## Verification

Run the build against the tree as it stands: no Worker's type program reaches a filesystem-bound
module and the build proceeds. Reintroduce the original offending specifier — a type imported from
a re-exporting module that itself reaches the filesystem — and confirm the build fails, naming that
module and printing the import chain from the Worker entry point to it.

Confirm the walk is not vacuous: it reaches modules known to be on the Worker's path, and its
recorded edges include a type-only import, which a runtime-only walk would not have.
