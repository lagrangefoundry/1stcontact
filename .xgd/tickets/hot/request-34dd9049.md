---
uid: request-34dd9049
id: REQ-150
type: request
title: '1c CLI: boot a plain Vite SSR server, not Astro''s'
created_by: xgd
created_at: '2026-08-18T19:57:23.404053+00:00'
updated_at: '2026-08-20T02:58:29.298468+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  priority: low
  story_points: 5
  depends_on:
  - REQ-148
  auto_merge_back: true
  needs_review: false
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
as a real dependency of `tools/generate` (whose `bin` the launcher is) and as a root
devDependency for the Vitest configs.

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