---
uid: request-3b78151f
id: REQ-44
type: request
title: 'Tooling hygiene: pnpm install after lockfile change; fail loud on out-of-sync
  node_modules'
created_by: xgd
created_at: '2026-07-03T23:31:56.269585+00:00'
updated_at: '2026-08-07T04:16:35.381020+00:00'
completed_at: '2026-08-07T04:16:35.381020+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  commits:
  - working_sha: b37afa2cccec1e11501cd5735b7ecf2d81e3a2a1
    reconcile_sha: null
    main_sha: null
    working_sha_history:
    - 10771a22bcdb05d24caf990feb41e3c34bd00c3f
  - working_sha: 6493570b7e572628b6e5ec0c65db13f3ccb521a1
    reconcile_sha: null
    main_sha: null
    working_sha_history:
    - a7fbde3b3be9bfd1d9efb0815172f62f1e0f2552
  version: 0.1.16
  bundled_in: bundle-15c1f647
  chat_comment: comment-ef79939e
---

## Problem

`node_modules` can drift from the committed `pnpm-lock.yaml`, silently breaking the `1c` browser tooling. Observed this session: the REQ-38 `1c diff` work added `sharp` to `tools/generate/package.json` + the lockfile (commit `b76cf7f`), but the operator's working tree was never re-installed. `node_modules` lagged the lockfile, a reconcile pruned `playwright` (a *declared* dep), and `1c shot` / `1c diff` / `1c capture` all failed with `Cannot find module 'playwright'` (Vite logged "lockfile has changed"). A manual `pnpm install` fixed it and changed **no** tracked file — confirming the manifests were correct all along; only the on-disk install was stale.

Root cause: **declaring a dependency (package.json + lockfile) does not materialize it** — that needs `pnpm install`. When a dep lands via a workflow commit but no install follows, `node_modules` silently drifts.

## Scope

The original ask spanned two systems. It is split:

- **This ticket (1stcontact)** — the fail-loud preflight in the `1c` CLI. Defence in depth: it catches a stale tree whatever caused it (a workflow commit, a plain `git pull`, an interrupted install), and needs nothing from XGD.
- **XGD** — the "re-install after a commit changes the dependency manifests" rule. Filed separately against the xgd repo. XGD core must stay language-agnostic: it detects that *some* declared manifest path changed and delegates the actual install to the language plugin, which owns `pnpm`/`npm`/`pip`/`swift` knowledge.

## Ask (this ticket)

A cheap preflight in the `1c` CLI that runs before any command which needs a declared runtime dependency (`playwright`, `sharp`), and **fails loudly** with a clear "run `pnpm install`" message rather than crashing mid-render inside Playwright or Vite.

Two independent checks, both reported:

1. **Unresolvable declared dependency** — a package listed in `tools/generate/package.json` `dependencies` does not resolve from disk. This is the exact `Cannot find module 'playwright'` failure, caught before the browser launches.
2. **Lockfile drift** — `pnpm-lock.yaml` differs from the snapshot pnpm wrote at last install (`node_modules/.pnpm/lock.yaml`). This is an exact oracle, not an mtime heuristic: pnpm copies the lockfile verbatim on install, so byte-inequality means the tree was never installed at the committed lockfile.

Commands gated (each declares only what it actually loads, so an offline verb is never blocked by a dep it does not use):

| command | requires |
|---|---|
| `capture`, `shot`, `values-diff`, `adopt-gaps` | `playwright` |
| `crop` | `sharp` |
| `diff`, `gate`, `aligned-crops` | `playwright`, `sharp` |

`render`, `serve`, `builder`, `repro`, `refold`, `l1-gate`, `responsive-diff` and the structured-edit verbs are offline and stay ungated.

## Behaviour

- The failure is a `CommandError` with a new `ENVIRONMENT` code → exit **6**, so an AI caller branches on the outcome without parsing prose (the REQ-11 contract). In `--json` mode it is the standard `{"ok":false,"error":{code,message,hint}}` envelope.
- The message names *which* check failed and *which* packages, and the hint is the literal command to run.
- Drift alone fails: an install that is merely behind the lockfile is reported even when every dep still happens to resolve, because that is precisely the state that lets the next prune remove a declared package.
- Both checks are pure functions of `(repoRoot, resolver)`, so the UATs exercise them against synthetic trees with no install to mutate.

## Evidence
Surfaced during the faelan reproduction ([[REQ-21]]); related tooling: [[REQ-38]] (`1c diff`, added `sharp`), the generate CLI.


## XGD-side ticket

The install-after-manifest-change half is filed as **REQ-745** in the `lagrangefoundry/xgd` repo: "Re-install dependencies after a workflow commit changes a manifest (plugin-delegated, core stays language-agnostic)". It proposes two new `TestFrameworkPlugin` methods — `dependency_manifest_paths()` and `sync_dependencies()` — so XGD core detects the change from plugin-declared paths and delegates the install, learning nothing about pnpm.


## Plugin-side ticket

Also filed: **REQ-22** in `lagrangefoundry/xgd-plugin-sdk` — the plugin contract half of REQ-745. Note for this project: the worktree install runs `pnpm install --frozen-lockfile --prefer-offline --ignore-scripts`, so `sharp` and `playwright` postinstall steps (native binary, browser download) are skipped in XGD worktrees. That produces a tree where the package directory exists and its artifact does not — which the preflight above cannot see, because the module still resolves. REQ-22 carries that decision.