---
uid: acceptance_criterion-85d2653a
id: AC-1825
type: acceptance_criterion
title: 'The capture pipeline holds no storage of its own: the store is supplied and
  there is no host-filesystem fallback'
created_by: martin-github@westhead.me
created_at: '2026-09-19T13:37:14.371562+00:00'
updated_at: '2026-09-19T13:37:14.371562+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-177897a0
  kind: behavior
  regression_only: false
---

## Criterion

The capture pipeline carries no storage of its own. Where a bundle goes is
supplied by the caller and there is **no fallback** to the host filesystem, so
the same pipeline runs unchanged in a runtime that has no filesystem at all —
which is what makes the deployed capture above possible rather than a second
implementation of it.

Observably: capture cannot be started without naming the store the bundle goes
into; the modules that make up the capture pipeline, and the bundle codec in
particular, reach no host-filesystem facility by any route (import, require, or
re-exported helper); and the only component that knows about the operator's
directory tree is the local backing itself, constructed by the command line
because the command line is the thing that knows it is on a laptop.

## Verification

Assert structurally against the shipped sources, because the claim is a property
of the module graph rather than of one run: no capture-pipeline module names a
host-runtime builtin as an import, and the bundle codec contains no
filesystem verb or dynamic-require call anywhere in its code (comments excluded,
so the module may still explain the verbs it no longer calls). The end-to-end
consequence is carried by the deployed-runtime capture criterion, which cannot
pass if any of those paths remains.
