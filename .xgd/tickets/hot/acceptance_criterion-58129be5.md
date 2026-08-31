---
uid: acceptance_criterion-58129be5
id: AC-1427
type: acceptance_criterion
title: The build generates the uncommitted derived artifacts before it typechecks,
  so a fresh checkout builds
created_by: xgd
created_at: '2026-08-31T12:12:34.129356+00:00'
updated_at: '2026-08-31T12:12:34.129356+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-d5167ced
  kind: behavior
  regression_only: false
---

## Criterion

The build generates the control application's derived artifacts **before** it typechecks, so a
fresh checkout has the files the rest of the tree imports.

Two of those artifacts — the browser import map and the precompiled module chrome the render
composes its stylesheet from — are produced by a generator and deliberately **not** committed, on
the standing rule that a checked-in copy of a generator's output is a second definition site. The
Worker's own source imports them. So on a tree that has only just been cloned, the typecheck has
nothing to read until the generator has run, and a build ordered the other way round fails on a
correct tree — a failure that reports a missing module and means a missing build stage.

The generation stage runs after the environment preflight (which can still stop the run before
anything is emitted) and before the package builds and typechecks, and it is reported as its own
named stage so an operator reading the output can see which stage produced which artifact.

## Verification

On a tree with the generated artifacts deleted, run the build: it completes, and the typecheck does
not report the generated modules as missing. Confirm the generation stage is reported before the
typecheck stage in the run's own output. Confirm the generated artifacts are absent from version
control, so the preceding case is the ordinary state of a fresh checkout rather than a contrived
one. Confirm a failing environment preflight still stops the run before the generation stage
emits anything.
