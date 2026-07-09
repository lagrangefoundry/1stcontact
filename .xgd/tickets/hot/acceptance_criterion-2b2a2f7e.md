---
uid: acceptance_criterion-2b2a2f7e
id: AC-547
type: acceptance_criterion
title: Launcher runs clean when the HMR port is already occupied
created_by: xgd
created_at: '2026-07-09T23:21:42.147641+00:00'
updated_at: '2026-07-09T23:21:42.147641+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-5c2f2faa
  kind: behavior
  regression_only: false
---

## Criterion
When Vite's fixed HMR port (24678) is already bound — as it is by a long-running `1c serve` — any other launcher invocation still completes successfully (exit code 0) and emits no "Port 24678 is already in use" (or otherwise port-in-use) error on stderr. The launcher's SSR server never attempts to bind the HMR WebSocket port.

## Verification
Occupy port 24678, then spawn the launcher with a simple command (e.g. `list`); assert the process exits 0 and its stderr contains neither "is already in use" nor "24678".
