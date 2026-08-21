---
uid: request-34dd9049
id: REQ-150
type: request
title: '1c CLI: boot a plain Vite SSR server, not Astro''s'
created_by: xgd
created_at: '2026-08-18T19:57:23.404053+00:00'
updated_at: '2026-08-21T20:13:27.357237+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  priority: low
  story_points: 5
  depends_on:
  - REQ-148
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: 258381e2d49405bd016b3b8828b87653d66ea4e7
    reconcile_sha: null
    main_sha: null
  - working_sha: aa64b3e15b44b425aa1394edd18d0915fdba0324
    reconcile_sha: null
    main_sha: null
  - working_sha: c36373c10b87e81815aa7bff01d786e5e554178f
    reconcile_sha: null
    main_sha: null
  version: 0.2.2
---

# `1c` CLI: boot a plain Vite SSR server, not Astro's

## Why

`tools/generate/bin/1c.mjs` boots a Vite dev server configured through **Astro's**
`getViteConfig()`, and loads the CLI through `ssrLoadModule`. The only reason for the Astro
plugin is that the render path imported `.astro` module components and therefore needed
Astro's transform.

[[REQ-148]] removes the last `.astro` file from the repository: the two behavior-module
components become plain TypeScript functions, and the conformance fixtures convert with
them. After that lands, the Astro plugin in the CLI bootstrap transforms nothing.

## What to change

Replace `getViteConfig()` with a plain `createServer()` Vite SSR config (TypeScript +
workspace resolution only). Everything the current bootstrap works around because of Astro
should go with it:

- the inline Astro config passed solely to gate Astro's logger (`logLevel: 'error'`), and
  the "Missing pages directory" WARN it exists to suppress;
- the `createRequire(import.meta.resolve('astro/package.json'))` dance used to locate Vite;
- possibly the stdout→stderr diversion, if no bootstrap chatter remains to divert (verify
  against a `--json` command before removing it — it is defense in depth for *any* boot
  noise, not only Astro's).

Then check whether `astro` can be dropped as a dependency of `packages/framework` and/or the
repo root. `@astrojs/markdown-remark` is a separate package and stays.

## Why it is separate from REQ-148

REQ-148 is already a wide conversion (both behavior modules, 12 test fixtures, the render
seam, ~8 test files). The CLI bootstrap is a distinct risk surface — every `1c` command runs
through it — and it keeps working untouched after REQ-148. Changing it in the same commit
would mix a mechanical conversion with a launcher rewrite, and a boot regression would be
hard to attribute.

## Acceptance criteria (provisional)

1. Every `1c` command runs through a Vite SSR server configured with no Astro plugin.
2. Boot emits nothing on stdout or stderr for a quiet command; `--json` still emits a single
   clean document.
3. `1c assets` still bootstraps on a fresh checkout without loading the CLI barrel (the
   cycle REQ-145 documented).
4. No test regresses — in particular the CLI output-hygiene reconciliation UATs.

## Origin

[[CHAT-25]] / [[REQ-148]] Q4: deliberately deferred so the conversion and the launcher
rewrite fail independently.

---

## Settled scope (agreed with the operator at implementation time)

The survey below was run against the branch with [[REQ-148]] already landed. It found that
"drop the Astro dependency" is not confined to the bootstrap: four other sites still resolve
`astro` after the launcher is rewritten. The operator chose the **full removal** reading —
`astro` leaves the repository entirely — and authorised the reconciliation-UAT rewrite that
requires.

### Where `astro` is still load-bearing after the bootstrap rewrite

| Site | What it uses Astro for | Disposition |
|---|---|---|
| `vitest.node.config.mts` | the whole node project config is `getViteConfig({...})` | → plain `defineConfig` from `vitest/config`; the Astro plugin transforms nothing now |
| `tests/req89-astro-lazy.test.ts` | `spyOn(experimental_AstroContainer, 'create')` ×2 | → static "no `astro` specifier in the render graph" scan |
| `tests/reconciliation-1c-astro-free-render.test.ts` | the same spy ×3 — **reconciliation UAT AC-739** | → same static scan (operator-authorised rewrite) |
| `tests/test_UAT_FC_REQ-141_project_routing.test.ts` | asserts `vitest.node.config.mts` *contains* `from 'astro/config'` | → assert it names no Astro specifier at all |
| `tools/generate/tsconfig.json`, `packages/framework/tsconfig.json` | `types: ["astro/client"]` | → `vite/client` (or dropped where unused) |
| `pnpm-workspace.yaml` | `@astrojs/compiler-*` build-approval entries | → removed with the dependency |

### Why the container spies are replaceable rather than merely deleted

`experimental_AstroContainer` cannot be spied on once `astro` is uninstalled, so AC-739's
measurement has to change form. The replacement is the check [[REQ-148]] already introduced
in `test_UAT_FC_REQ-148_astro_free_render.test.ts`: no source file on the render graph names
an `astro` specifier, statically or dynamically. This is **strictly stronger** than the spy
— the spy proved "no container for *this* render", the scan proves "no container is
reachable from *any* render" — so AC-739's guarantee survives the rewrite rather than being
weakened by it. The render-output assertions in both files (module markup, folded theme CSS,
`capabilities.js`) are kept exactly as they are.

### `vite` becomes a direct dependency

`vite` is not currently a direct dependency of anything — it arrives transitively through
`astro`, which is precisely why the bootstrap needs
`createRequire(import.meta.resolve('astro/package.json'))` to find it. With `astro` gone the
launcher must be able to `import { createServer } from 'vite'` directly, so `vite` is added
as a real dependency of `tools/generate` — whose `bin` the launcher is, and which imports it
at run time, so `dependencies` rather than `devDependencies` is the correct field.

No *root* `vite` entry is needed. Both Vitest configs take `defineConfig` from
`vitest/config`, and Vitest carries its own Vite; only the launcher imports the package by
name.

### The stdout→stderr diversion

Kept, and re-justified in the source. AC-2 is a claim about the observable streams, not
about the absence of the guard; the diversion is cheap defense in depth against *any* boot
chatter (Vite's own dependency-optimisation notices, a future plugin's) and removing it
would trade a real protection for a cosmetic one. Its comment is rewritten so it no longer
describes itself as an Astro workaround.

## Test approach

New UATs in `tests/test_UAT_FC_REQ-150_plain_vite_bootstrap.test.ts`, driving the real
`1c` binary as a subprocess (the launcher is the entry point; nothing about it is
observable in-process):

- the launcher's source names no Astro specifier, and neither does any Vitest config;
- `1c help` / `1c list` boot with a clean stdout and an empty stderr;
- a `--json` command emits exactly one parseable document on stdout;
- `1c assets --json` still bootstraps without loading the CLI barrel (REQ-145's cycle);
- no `package.json` in the repo declares `astro`, and `@astrojs/markdown-remark` still does.

Regression scope: `tests/req37-launcher.test.ts`, `tests/req89-astro-lazy.test.ts`,
`tests/reconciliation-1c-astro-free-render.test.ts`,
`tests/reconciliation-1c-cli-output-hygiene.test.ts`,
`tests/reconciliation-1c-install-preflight.test.ts`,
`tests/test_UAT_FC_REQ-141_project_routing.test.ts`,
`tests/test_UAT_FC_REQ-148_astro_free_render.test.ts`, plus the full node suite.
---

## Implementation status (2026-08-20)

All source changes are written and verified. The cycle is **blocked on one command the
session cannot run**, described under "Outstanding" below.

### Verified

Measured by running the node suite twice in this worktree against the same `node_modules`:
once with the change stashed (exact branch-base baseline) and once with it applied, where
the post-install tree was simulated by linking `vite` out of the pnpm store and moving the
`astro` links aside (both reversed afterwards — `node_modules` is gitignored, so nothing
about this reaches the commit).

| Run | Test files | Tests |
|---|---|---|
| baseline (change stashed) | 13 failed / 217 passed / 4 skipped | 59 failed / 1631 passed / 67 skipped |
| with the change applied | 13 failed / 218 passed / 4 skipped | 59 failed / 1636 passed / 67 skipped |

The failure counts are **identical**, and the deltas are exactly the new UAT file and its
five tests. The 59 pre-existing failures (`test_UAT_FC_REQ-129_l1_authoring` and others) are
baseline breakage on this branch point and are untouched by this work.

The declared regression scope was then run on its own against the simulated tree —
`req37-launcher`, `req89-astro-lazy`, `req119-request-time-render`,
`reconciliation-1c-astro-free-render`, `reconciliation-1c-cli-output-hygiene`,
`reconciliation-1c-install-preflight`, `test_UAT_FC_REQ-141_project_routing`,
`test_UAT_FC_REQ-145_build_artifacts`, `test_UAT_FC_REQ-148_astro_free_render`,
`test_UAT_FC_REQ-150_plain_vite_bootstrap` — **10 files, 48 tests, all passing**.

Statically confirmed as well: no source file in the repository imports `astro` or any
`astro/*` subpath (the only surviving occurrence is one explanatory comment), and no
`package.json` declares `astro`. `@astrojs/markdown-remark` is untouched.

### Outstanding — `pnpm install`

`pnpm-lock.yaml` is tracked and still lists `astro` in all three importers, and both
`.github/workflows/ci.yml` and `deploy.yml` run `pnpm install --frozen-lockfile`. Committing
the manifest edits without regenerating the lockfile would therefore land a commit that
fails CI on contact. Only pnpm can regenerate it — hand-editing a lockfile of this size is
not a defensible substitute, and the symlink scaffolding used for verification above does
not touch it.

`pnpm install*` is on this environment's hard-deny list, so the session cannot run it. The
remaining steps — install, full-suite re-run on the real tree, version bump, `[FREE-CODED]`
commit, merge back to `xgd-working`, `move-to-free-coded` — are otherwise ready to go.