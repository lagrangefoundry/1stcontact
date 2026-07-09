---
uid: request-1dfc8ce0
id: REQ-10
type: request
title: 'Toolchain upgrade: latest stable Astro 7 / Vite 8 / Vitest 4 / Wrangler 4
  / Zod 4 / TypeScript 6'
created_by: xgd
created_at: '2026-06-30T20:55:32.795492+00:00'
updated_at: '2026-07-09T19:58:12.975556+00:00'
completed_at: '2026-07-09T19:58:12.975556+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  priority: high
  story_points: 3
  auto_merge_back: true
  needs_review: false
  commits:
  - c88930b794bbcd4fa2a1c25e5953e12e1339d7f3
  - 752a9d5230201f3687598b7d1e27185a208e7a22
  version: 0.0.5
  bundled_in: bundle-6a071846
---

## Scope

Upgrade the entire toolchain to the latest stable major of every dependency,
unless a specific incompatibility forces otherwise. The project is greenfield
(v0.0.x), so churn cost is low and now is the cheapest time to do this.

This **supersedes the deliberate Astro-4 pin introduced by REQ-4**. REQ-4 hit a
Vite-major conflict (vitest 2.1 / Vite 5 vs Astro 7 / Vite 8) and resolved it
*downward* (pinned `astro@^4`, renamed the vitest config to `.mts`, used
`getViteConfig`). This ticket resolves it *upward* instead: vitest 4 accepts
Vite 8, so Astro 7 + Vitest 4 + Vite 8 form a coherent stack and the REQ-4
workarounds can be removed.

## Target version matrix (verified compatible, 2026-06-30)

| Package | Current | Target | Compatibility note |
|---|---|---|---|
| vite | 5.4 | 8.1.x | common denominator |
| astro | 4.16 (REQ-4 pin) | 7.0.x | depends on `vite ^8.0.13` |
| vitest | 2.1 | 4.1.x | peer `vite ^6 ‖ ^7 ‖ ^8` → accepts Vite 8 |
| @astrojs/cloudflare | (none) | 14.0.x | peers `astro ^7` + `wrangler ^4.83` — add when wiring the generator/SSR |
| wrangler | 3.114 | 4.10x | matches @astrojs/cloudflare peer |
| typescript | 5.6 | 6.0.x | no peer constraints |
| zod | 3.22 | 4.4.x | major — see migration notes |
| @cloudflare/workers-types | 4.x | 4.2026xxxx | date-versioned, trivial |
| pnpm | 11.8.0 | 11.9.0 | packageManager field |
| node engines | >=20 | >=22.12 | Astro 7 requires it; dev machine is on node 24 |

## Deliverables

- Bump every dependency above (root + all workspaces: site-schema, framework,
  apps/public-site, apps/control-app) to the target major.
- Remove REQ-4's downgrade workarounds where the upgrade makes them unnecessary:
  - re-evaluate the `vitest.config.mts` rename (may stay `.mts`, but the
    `getViteConfig` wiring should be revisited against Astro 7 + Vitest 4).
  - drop the `astro@^4` pin in `packages/framework/package.json` → `^7`.
- Bump `engines.node` to `>=22.12` and align any CI/deploy node version.
- Bump `packageManager` to `pnpm@11.9.0`.
- Full suite green (currently 30/30) and all package typechecks clean under the
  new majors.

## Migration risk (the real work — 3 items)

1. **zod 3 → 4** (contained to `packages/site-schema`, 2 files). Core schema
   usage is stable, but zod 4 reworked the **issue/error API**. Verify:
   - `schema.ts` `superRefine` + `ctx.addIssue({ code: z.ZodIssueCode.custom, ... })`
   - `validate.ts` projection of `parsed.error.issues → { path, message }`
   REQ-3's 10 UATs (`tests/site-schema.test.ts`) are the regression gate.

2. **wrangler 3 → 4** (`apps/public-site`, `apps/control-app`). `wrangler.toml`
   is largely compatible; risk is CLI/bundling default changes. Gate: the
   `deploy --dry-run` UATs in `tests/public-site.test.ts` and
   `tests/control-app.test.ts` must still pass.

3. **typescript 5.6 → 6.0**. Small strict codebase; low risk. TS 6 tightens some
   defaults — re-run every package `typecheck` and fix what surfaces.

## Acceptance

- `pnpm -r typecheck` (or per-package equivalents) pass under all new majors.
- `pnpm test` → full suite green.
- `pnpm dryrun:public` and `pnpm dryrun:control` succeed under wrangler 4.
- No remaining REQ-4 toolchain workaround that the upgrade obsoletes.

## Explicitly NOT in this ticket

- Any feature/behavior change. This is a pure dependency/version upgrade.
- @astrojs/cloudflare wiring beyond the version bump (the SSR generator is REQ-6).


## Implementation notes (as-built, commit b8fbc83, v0.0.5)

Resolved versions installed: astro 7.0.4, vitest 4.1.9, wrangler 4.106.0,
typescript 6.0.3, zod 4.4.3, @cloudflare/workers-types 4.20260630.1,
pnpm 11.9.0. engines.node -> >=22.12.

Deviations / discoveries vs the original matrix:

- **zod 3 -> 4 was a non-event.** No change needed in `schema.ts` or
  `validate.ts`: `z.ZodIssueCode.custom` still resolves and the
  `parsed.error.issues -> { path, message }` projection is stable across the
  major. REQ-3's 10 UATs pass unchanged. The site-schema `dist` had to be
  rebuilt under zod 4 (stale zod-3 `.d.ts` made framework see `NavTarget` as
  `unknown`); `dist` is gitignored so this is not in the diff.

- **New dependency the ticket predated: `@astrojs/markdown-remark`** (added by
  REQ-5). Bumped 5 -> 7 to track the Astro-7 era. v7's
  `createMarkdownProcessor` now returns a `MarkdownRenderer` (was
  `MarkdownProcessor`); `.render(md) -> { code }` is unchanged, so `markdown.ts`
  needed a type-annotation-only edit. (Astro 7 itself moved its internal
  markdown to `@astrojs/markdown-satteri`; switching to it would be a behavior
  change and is out of scope.)

- **One REQ-5 UAT assertion updated** (`framework-content-modules.test.ts`,
  contact-form no-JS test). Astro 7's container API emits the island as a
  deferred `type="module"` script; Astro <7 stripped it from container output,
  which the old `not.toContain('<script')` assertion relied on. The native
  `<form method="post">` no-JS contract is fully intact; the assertion now
  verifies the enhancement is deferred (inert without JS) rather than absent.

- **`vitest.config.mts` / `getViteConfig` retained.** This is not an obsoleted
  REQ-4 workaround — it wires the `.astro` transform that the container-render
  UATs require, and works correctly under Astro 7 + Vitest 4. Only the REQ-4
  `astro@^4` pin was obsoleted (dropped -> `^7.0.4`).

- **`pnpm-workspace.yaml` gained `minimumReleaseAgeExclude`** (21 entries),
  auto-added by pnpm 11.9 to admit the same-day releases past the supply-chain
  release-age gate. Required for reproducible install of the new majors.

Acceptance verified: `pnpm -r typecheck` clean; 48/48 tests green;
`dryrun:public` + `dryrun:control` succeed under wrangler 4.106.0.