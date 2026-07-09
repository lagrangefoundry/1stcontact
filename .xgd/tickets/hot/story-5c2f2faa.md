---
uid: story-5c2f2faa
id: STORY-64
type: story
title: 1c launcher (bin/1c) + collision-free SSR server
created_by: xgd
created_at: '2026-07-09T23:21:15.025789+00:00'
updated_at: '2026-07-09T23:30:43.878489+00:00'
completed_at: null
last_field_updated: status
status: reconciling
fields:
  intent_uid: bundle-adc60ee8
  capability_uid: CAP-52
  story_kind: feature
  story_points: 1
---

## Story
**As an** operator of the site-generation toolchain, **I want** a short `1c` launcher I can run from any directory, and an SSR server that doesn't collide on Vite's HMR port, **so that** I can invoke the CLI ergonomically from anywhere and running one long-lived command (e.g. `1c serve`) doesn't spam every other invocation with port-in-use errors.

## Description
Provides a `bin/1c` shell launcher that dispatches to the generate CLI (`tools/generate/bin/1c.mjs`) so operators type `1c <cmd>` instead of `node tools/generate/bin/1c.mjs <cmd>`. The launcher resolves the repo root from the script's own location, so it works no matter which directory it is invoked from, while deliberately preserving the caller's working directory — the CLI roots its build tooling at the repo but resolves `sites/`/`dist/` inputs and outputs relative to the caller's CWD, so the launcher behaves identically to invoking node directly. Adding `bin/` to `PATH` (or aliasing) to type a bare `1c` is documented in-script.

Separately, the launcher's Vite SSR server no longer opens Vite's HMR WebSocket. Under Vite 8 the ws server is gated on `server.ws` rather than `hmr`, so a long-running `1c serve` that holds the fixed HMR port (24678) previously caused every other `1c` invocation to emit a non-fatal "Port 24678 is already in use" error. The CLI never needs HMR, so the ws server is disabled and invocations run clean under concurrent use.

In scope: launcher location-independence, CWD preservation, and the HMR-port-collision fix. Out of scope: the behavior of the individual `1c` subcommands (render/serve/capture/shot/diff/values-diff), which are covered by their own stories.

## Technical Context
This is CLI ergonomics and process configuration for the generate toolchain that hosts the headless-browser vision commands (CAP-52). It adds no framework-module or capture behavior; it makes the shared `1c` entrypoint invocable from any CWD and quiet under concurrent use. The landed regression coverage (`tests/req37-launcher.test.ts`) exercises the HMR-port fix directly; the location-independence and CWD-preservation behaviors are asserted here per the operator's stated acceptance even though the committed UAT focuses on the port collision.

## Dependencies
None.

## Story Points
1