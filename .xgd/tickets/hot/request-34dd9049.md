---
uid: request-34dd9049
id: REQ-150
type: request
title: '1c CLI: boot a plain Vite SSR server, not Astro''s'
created_by: xgd
created_at: '2026-08-18T19:57:23.404053+00:00'
updated_at: '2026-08-18T19:57:23.404053+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: low
  story_points: 2
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
