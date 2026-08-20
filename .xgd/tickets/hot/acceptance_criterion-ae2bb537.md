---
uid: acceptance_criterion-ae2bb537
id: AC-1331
type: acceptance_criterion
title: The build discovers every Worker in the tree and bundles each against the production
  environment, after the preflight passes
created_by: xgd
created_at: '2026-08-20T05:30:58.617490+00:00'
updated_at: '2026-08-20T05:30:58.617490+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-d5167ced
  kind: behavior
  regression_only: false
---

## Criterion

The build command builds every Worker it **discovers** in the tree — one per deployment
configuration found under the applications directory — rather than a hand-kept list, so a Worker
added to the tree is built without the command being edited. Each is bundled against the
**production** environment, and the run reports the artifact produced for each app.

Ordering is load-bearing: the environment preflight runs **first**, and a failing preflight stops
the run before any package build or bundle is emitted, propagating the preflight's environment exit
code. The check can be explicitly skipped for an environment that cannot satisfy it, in which case
the remaining stages run normally.

A tree containing no deployment configuration at all is refused with a message saying there is
nothing to build, rather than reporting a successful build of zero apps.

## Verification

Run the build in a tree with a complete environment: every discovered app is bundled and its
artifact reported, and the bundle for each is built against the production environment rather than
the default one. Run it with the environment deliberately incomplete: it stops at the preflight
with the environment exit code and no artifact appears. Run it with the skip option under the same
incomplete environment: the later stages proceed. Point it at a tree with no deployment
configuration: it refuses non-zero naming the absence.
