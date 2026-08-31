---
uid: acceptance_criterion-deade1ff
id: AC-1415
type: acceptance_criterion
title: Every 1c command boots through a plain Vite SSR server the launcher configures
  itself, with no build-framework plugin
created_by: xgd
created_at: '2026-08-31T11:18:48.212830+00:00'
updated_at: '2026-08-31T11:18:48.212830+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e15a19ef
  kind: behavior
  regression_only: false
---

Every `1c` command boots through a plain Vite SSR server that the launcher
configures itself, with no build-framework plugin anywhere in that configuration.

- The configuration is taken from the launcher and nowhere else: the working root
  is never searched for a `vite.config.*`, so the launcher's behaviour cannot
  change because a config file exists at the root for some other purpose.
- The bundler is obtained by a direct import of `vite` by name. It is declared in
  the `dependencies` of the package whose `bin` the launcher is (`tools/generate`)
  — `dependencies`, not `devDependencies`, because the launcher imports it at run
  time. It is no longer located by walking into another package's module graph.
- No part of that configuration names an Astro specifier: no `getViteConfig`, no
  `astro`-prefixed import, and no `createRequire`/`import.meta.resolve` hop into
  Astro's package to find the bundler.
- The server is still started the way the earlier CLI guarantees require:
  middleware mode with the HMR WebSocket off, and the bundler's own log level set
  so only genuine errors reach a stream.

A successful boot alone cannot establish this: a plugin that happens to find
nothing to transform boots exactly as cleanly as no plugin at all — which was the
repository's actual state before this change. The configuration itself is the
evidence.

## Verification
Read the executable lines of the `1c` entry point (comments excluded — they
deliberately explain what it no longer does). Confirm it imports `createServer`
from `vite` and calls it, that the configuration pins the config file off, sets
middleware mode with the WebSocket disabled and the log level at error, and that
it names no `getViteConfig`, no `astro`-prefixed specifier and no `createRequire`.
Confirm `tools/generate`'s manifest declares `vite`. Then run a command through
the real binary and confirm it boots and exits 0.
