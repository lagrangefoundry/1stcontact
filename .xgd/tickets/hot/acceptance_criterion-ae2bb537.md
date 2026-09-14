---
uid: acceptance_criterion-ae2bb537
id: AC-1331
type: acceptance_criterion
title: The build discovers every Worker in the tree and bundles each against the production
  environment, after the preflight passes
created_by: xgd
created_at: '2026-08-20T05:30:58.617490+00:00'
updated_at: '2026-09-14T05:30:44.608311+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-d5167ced
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

The build command builds every Worker it **discovers** in the tree — one per deployment
configuration found under the applications directory — rather than a hand-kept list, so a Worker
added to the tree is built without the command being edited. Each is bundled against the
**production** environment, and the run reports the artifact produced for each app.

Ordering is load-bearing: the environment preflight runs **first**, and a failing preflight stops
the run before any package build or bundle is emitted, propagating the preflight's environment exit
code.

The check can be explicitly skipped for an environment that cannot satisfy it, and what the skip
buys is exactly the check and nothing else. That splits into two claims, both true and only both
together:

- On a tree the preflight **would have failed** — a shared component genuinely absent — skipping it
  gets the run past the check, and the run then stops in the generated-asset stage, naming the
  component that is missing. That stage needs every component the preflight looks for, so the
  absence is a fact about the tree rather than an opinion of the check's: the run exits non-zero,
  nothing is bundled, and no bundler is invoked for any app.
- On a tree the preflight **would have passed**, skipping it leaves every remaining stage running
  normally — the package builds and one bundle per discovered app — and the build completes.

A tree containing no deployment configuration at all is refused with a message saying there is
nothing to build, rather than reporting a successful build of zero apps.

## Verification

Run the build in a tree with a complete environment: every discovered app is bundled and its
artifact reported, and the bundle for each is built against the production environment rather than
the default one. Run it with the environment deliberately incomplete: it stops at the preflight
with the environment exit code and no artifact appears. Run it with the skip option under that same
incomplete environment: the preflight stage is absent from the output and its refusal is never
reported, the run is observed to reach the generated-asset stage, and it then fails non-zero naming
the missing component with no bundle stage entered and no bundler invoked. Run it with the skip
option against a complete tree: the preflight stage is still absent from the output, the later
stages run and the build completes zero. Point it at a tree with no deployment configuration: it
refuses non-zero naming the absence.
