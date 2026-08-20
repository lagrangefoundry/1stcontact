---
uid: acceptance_criterion-72db61ca
id: AC-720
type: acceptance_criterion
title: aligned-crops --sandbox renders, serves, and crops the sandbox reproduction,
  not the sites/ build
created_by: xgd
created_at: '2026-07-22T20:52:06.208123+00:00'
updated_at: '2026-08-20T07:18:02.405502+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-e15a19ef
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
When `1c aligned-crops` is invoked with `--sandbox`, the store-selection it
received is forwarded to the render and the serve it triggers, so both target the
sandbox store:
- The reproduction is rendered from and served out of the `sandbox/` tree, so the
  build the command goes on to compare against the reference is the sandbox
  reproduction rather than the `sites/` one.
- The `source` selection (`draft`/`published`, defaulting to `draft`) and the
  working directory are forwarded alongside `--sandbox`.
- Without `--sandbox`, the command falls through to the `sites/` tree (no sandbox
  routing) while still preserving the selected `source`.

Before this guarantee, `--sandbox` was ignored by the render/serve step: a
sandbox reproduction was rendered/served from `sites/`, diffing an absent or
stale site against the reference so that no valid crops could be produced.

What the command then *emits* — the drift-aligned ref/ours crop pairs and their
anchor matching — is the `aligned-crops` verb's own meaning, and belongs to the
capability that owns the verb rather than to this CLI-mechanism story (see the
capability's "CLI mechanism here, verb meaning with the verb's capability"
ownership rule, and REQ-78).

## Verification
Invoke aligned-crops with `--sandbox` set (and a `cwd`/`source`) and observe that
the options handed to its render and serve carry `sandbox` true, the same working
directory, and the selected source. Invoke it without `--sandbox` and observe the
options carry no sandbox routing while preserving the selected source.
