---
uid: request-8ccd3a3e
id: REQ-37
type: request
title: 1c launcher script + quiet HMR-port collision
created_by: xgd
created_at: '2026-07-03T18:28:17.498615+00:00'
updated_at: '2026-07-09T23:59:12.098190+00:00'
completed_at: '2026-07-09T23:59:12.098190+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  commits:
  - cf37056212f3f7908d463764b4db4a0db7747d48
  version: 0.0.33
  bundled_in: bundle-adc60ee8
---

## Behavior

Make the `1c` CLI easy to invoke and quiet under concurrent use.

### 1. `bin/1c` launcher

A `bin/1c` shell wrapper dispatches to `tools/generate/bin/1c.mjs` so operators
type `1c <cmd>` instead of `node tools/generate/bin/1c.mjs <cmd>`.

- Resolves the repo root from the script's own location → works from any CWD.
- Deliberately preserves the caller's working directory (no `cd`): the CLI roots
  Vite at the repo but resolves `sites/`/`dist/` paths relative to CWD, so the
  wrapper behaves identically to invoking node directly.
- To type bare `1c`, add `bin/` to PATH or alias it (documented in-script).

### 2. HMR WebSocket disabled in the launcher's SSR server

The launcher's Vite SSR server no longer opens Vite's HMR WebSocket. Under
Vite 8 the ws server is gated on `server.ws`, not `hmr` — so `hmr: false` alone
left the server binding the fixed HMR port 24678. A long-running `1c serve`
holds 24678, which made every *other* `1c` invocation log a non-fatal
`[vite] WebSocket server error: Port 24678 is already in use`. Passing
`server.ws: false` returns Vite's no-op WebSocket stub; the CLI never needs HMR,
and `ssrLoadModule` is unaffected.

## Acceptance

- `./bin/1c list` runs from the repo root and from a subdirectory (CWD preserved).
- With port 24678 occupied (as by a running `1c serve`), `1c list` exits 0 and
  emits no "Port 24678 is already in use" error.

## Coverage

- `tests/req37-launcher.test.ts` → `test_UAT_FC_REQ-37_launcher_does_not_error_on_occupied_hmr_port`
  spawns the real launcher with 24678 occupied and asserts exit 0 + no port error.