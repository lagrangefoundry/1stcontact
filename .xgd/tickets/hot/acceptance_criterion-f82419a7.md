---
uid: acceptance_criterion-f82419a7
id: AC-1426
type: acceptance_criterion
title: The build refuses a Worker whose type program reaches a filesystem-bound module,
  naming the module it cannot type
created_by: xgd
created_at: '2026-08-31T12:12:29.978850+00:00'
updated_at: '2026-09-10T05:19:03.501247+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-d5167ced
  kind: behavior
  regression_only: false
---

## Criterion

The build refuses a Worker whose **type** program reaches a filesystem-bound module, and names the
module it cannot type.

A Worker package declares platform types and no host-runtime types, so a filesystem-bound module in
its type program is a build failure. The refusal exists because a bundle-level guard is
structurally blind to this class: a type-only import is erased before a bundler resolves it and is
**not** erased before the typechecker, so the shipped bundle stays correct while the build breaks —
and a suite that only walks runtime imports stays green throughout. That is not a hypothetical: a
single specifier importing a type from a module that merely re-exported it, while itself reaching
the filesystem, is what broke this build.

The refusal is the build's typecheck stage itself, which walks **every** import the typechecker
walks, type-only edges included. Its observable outcome is that the build fails naming the
offending module — the one whose host-runtime dependency it cannot type. The build prints no import
chain, and nothing in the repository composes one; a criterion that claimed otherwise would be
asking for production code no intent behind this story requests.

The chain from a Worker entry point to that module — the specifier to change, rather than a list of
unresolved names — is the property's **own instrument**: a type-program walk from each Worker entry
point outward, following type-only edges, reporting the shortest chain to any filesystem-bound
module it reaches. Being the instrument, it must be shown to be capable of failing: it reaches
modules known to be on the Worker's path, and it follows at least one type-only edge — the kind a
runtime-import walk deliberately skips, and the only kind that produced this failure.

## Verification

Run the build's typecheck against the tree as it stands, over the real Worker's own tsconfig: it
exits zero.

Walk each Worker entry point's type program, type-only edges included, and confirm it reaches no
filesystem-bound module — reporting, for any it does reach, the shortest import chain from the
entry point to it. Confirm the walk is not vacuous: it reaches modules known to be on the Worker's
path, and its recorded edges include a type-only import, which a runtime-only walk would not have.

Reintroduce the original offending specifier in a fixture that differs from a correct one by that
single specifier and nothing else — a type imported from a module that re-exports it while itself
reaching the filesystem — and confirm the typecheck fails, naming the filesystem-bound dependency
of the offending module, while the corrected specifier typechecks clean. Confirm the walk over the
offending fixture reports the chain from its entry point to the offending module, and that the
corrected fixture does not reach that module at all.
