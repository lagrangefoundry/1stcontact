---
uid: acceptance_criterion-0f088a4d
id: AC-1416
type: acceptance_criterion
title: Astro is absent from every workspace manifest, the lockfile and every source
  file, and off disk; @astrojs/markdown-remark stays
created_by: xgd
created_at: '2026-08-31T11:18:53.491051+00:00'
updated_at: '2026-08-31T11:28:21.701474+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e15a19ef
  kind: behavior
  regression_only: false
---

Astro is absent from the repository entirely — undeclared, unlocked, unreferenced
and off disk — while the separately published markdown package it is often
confused with survives.

- No `package.json` in the workspace declares `astro` in its `dependencies`,
  `devDependencies` or `peerDependencies`. This holds for the root manifest and
  for every member under `apps/`, `packages/` and `tools/`, enumerated rather than
  taken from a fixed list, so a manifest added later is covered too.
- The lockfile carries no `astro` importer entry.
- No source file, test config or type entry names an Astro specifier: neither
  Vitest project config imports from `astro/config`, and no tsconfig lists
  `astro/client` among its ambient types. The one surviving occurrence anywhere is
  an explanatory comment.
- `astro/container` does not resolve from the installed tree, so the package is
  genuinely off disk and not merely undeclared.
- `@astrojs/markdown-remark` — a standalone markdown processor the framework
  renders callouts with, published separately from and unrelated to the framework
  — is still a declared dependency of the framework package and must stay.

Leaving the dependency declared after removing its only consumer is how a removed
integration comes back: the next config wanting a bundler plugin finds
`astro/config` already installed and reaches for it. The uninstall is what holds
the removal in place.

## Verification
Enumerate the root manifest and every workspace member manifest and confirm none
lists `astro` in any dependency field, and that at least the root plus real
members were enumerated (a scan that found nothing to check proves nothing).
Confirm `astro/container` fails to resolve. Confirm the framework manifest still
declares `@astrojs/markdown-remark` and `tools/generate` still declares `vite`.
Confirm neither Vitest project config matches `from 'astro…'` or
`import('astro…')`.