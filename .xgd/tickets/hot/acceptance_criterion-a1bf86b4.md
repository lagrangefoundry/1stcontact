---
uid: acceptance_criterion-a1bf86b4
id: AC-1330
type: acceptance_criterion
title: Preflight reports every shared component and package, and refuses an incomplete
  environment naming what is absent and its remedy
created_by: xgd
created_at: '2026-08-20T05:30:53.978782+00:00'
updated_at: '2026-08-20T15:29:16.837382+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-d5167ced
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

The environment preflight reports **every** shared component and **every** declared package on one
run, each marked present or absent, and distinguishes a component consumed by the browser from one
consumed by the server — because the two break differently. On a complete tree it succeeds and
states the counts it checked. On an incomplete tree it refuses with an environment-specific exit
code (distinct from a general failure), names each absent component, says for a browser component
that the import map would otherwise name a module nothing serves, and names the command that
installs them.

Both halves — declared packages and shared components — are reported before either refuses, so an
operator missing one of each learns both in a single run rather than one install at a time.

## Verification

Run the preflight against a tree whose shared component store is complete: it lists every
component and package with a present marker and reports the totals. Run it with one component made
unresolvable: it exits with the environment code, its message names that component and the surface
it serves, and its remedy names the install command. Repeat with a browser component and a server
component to confirm the report distinguishes them.