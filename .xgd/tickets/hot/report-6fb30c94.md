---
uid: report-6fb30c94
id: REPORT-2932
type: report
title: 'Code Review: bundle-b3b7c399'
created_by: xgd
created_at: '2026-08-31T13:26:02.872710+00:00'
updated_at: '2026-08-31T13:26:02.872710+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: code_review
  subject_uid: bundle-b3b7c399
  anchor_uid: bundle-b3b7c399
---

# Code Review

**Result**: FAIL

## Summary

A large, coherent, unusually well-documented bundle (10 tickets, ~8.5k lines of
non-test source change): the builder moves from a Node proxy origin into workerd,
the site store moves from the filesystem to D1 + R2, `1c deploy` and its R2
manifest are deleted in favour of a D1-derived revision model, Astro is removed
from the render path entirely, Cloudflare Access is verified inside the Worker,
and site locale becomes structured data. SQL is uniformly parameterised, HTML
sinks are explicitly escaped now that the Astro compiler no longer does it, no
secret is committed, and every type-check passes.

One defect fails the review: `ACCESS_DEV_OPEN` is dead config. The guard that
reads it can never return true given the committed `wrangler.toml`, so the
documented local loop (`1c builder` → `bin/publish` → `localhost:8788`) answers
401 to every request. It fails in the safe direction, but the entry point as
documented does not work.

## Quality Gates

The injected quality reports are **not evidence** and were not relied on. Every
quality report for this reconcile records `0 tests, 0 failed`, and the build
stanza reads `"No tsconfig.json — type-check skipped (JS-only project)"` — the
repo root carries `tsconfig.base.json`, not `tsconfig.json`, and per-package
type-checking lives under `typecheck` scripts rather than `build`, so the
harness's build gate never ran and its scoped test selection never matched a
file. Gates were therefore verified directly in this session:

| Gate | Method | Result |
|------|--------|--------|
| Build / typecheck | `npm run build` (`tsc --noEmit` on control-app + public-site) | **pass**, no diagnostics |
| Build / typecheck | `tsc --noEmit -p` on `packages/framework`, `packages/site-schema`, `tools/generate` | **pass**, no diagnostics |
| Tests (node project) | 20 files covering every new REQ-143…153 UAT | **219 passed**, 1 skipped |
| Tests (workerd project) | `*.workers.test.ts` | **not verifiable here** — the pool binds a socket; this sandbox denies `listen` (EPERM) |
| Tests (browser/server) | Playwright + `node:http` suites | **not verifiable here** — no launchable browser, `listen` EPERM |
| Lint | — | not run (harness reported 0 errors in 0.0001s, i.e. no linter executed) |

The only test failures observed were environmental, every one traceable to
`listen EPERM: operation not permitted` or "no launchable browser" — not to the
changed code. A full `npm test` run in an unsandboxed environment is still
outstanding and is the one gate this review could not close.

## External Interface Accessibility

New entry points wired in: **mostly yes, one gap**.

| Entry point | Wired | Evidence |
|-------------|-------|----------|
| `1c push` | yes | `tools/generate/src/cli/index.ts:553` case + usage text:268 |
| `1c assets` | yes | `tools/generate/src/cli/index.ts:578` case + usage text:277 |
| `1c builder` (now `wrangler dev`) | yes | `tools/generate/src/cli/index.ts:676` |
| `1c deploy` removal | yes | module deleted; no dangling import remains (grep clean) |
| Access gate | yes | `apps/control-app/src/index.ts:79-82`, before routing |
| Worker route table | yes | `apps/control-app/src/index.ts:85` → `router.ts` |
| Assets binding | yes | `wrangler.toml:34-37`, `run_worker_first = true` |
| D1/R2 bindings | yes | `wrangler.toml:80-100`, repeated under `[env.production]` |
| Secret hook | yes | `bin/deploy.d/secrets/10-anthropic-api-key` |
| **`ACCESS_DEV_OPEN`** | **no** | unreachable — see Critical #1 |

Smoke-tested live: `1c` (usage), `1c list`, `1c revisions xgd` — all exit clean
with correct output, and the usage text carries the new commands.

## Code Quality

| File | Finding | Severity |
|------|---------|----------|
| `apps/control-app/wrangler.toml:67-71` + `src/index.ts:56-60` | `ACCESS_DEV_OPEN` can never take effect; local builder 401s | **Critical** |
| `apps/control-app/src/access.ts:217` | An unknown `kid` forces an uncached JWKS fetch *before* signature verification, so an unauthenticated caller can drive one outbound fetch per request with a random `kid` | Warning |
| `tools/generate/src/index.ts:9` | Orphaned comment — `// R2 artifact store + \`1c deploy\` (REQ-110).` now sits above `export * from './conformance'`; the `export * from './deploy'` it described was deleted | Warning |
| `apps/public-site/src/content-type.ts:7` | Points at `tools/generate/src/deploy/r2.ts` as the counterpart of a documented duplication; that file no longer exists (the counterpart is now `tools/generate/src/store/content-type.ts`) | Warning |
| `tools/generate/src/cli/ai/host.ts:20-24`, `ai/toolbox.ts:18-21` | Both justify the core/node split as "imports the Astro module registry … `No loader is configured for \".astro\" files\"`". REQ-148/150 in this same bundle removed Astro; the split is still right, but for `node:fs`/`node:path`, not the stated reason | Warning |
| `tools/generate/src/store/d1r2-store.ts:412,446` | An unsafe asset name is silently `continue`d on the write path rather than reported; documented, but a caller cannot tell an asset was dropped | Minor |

Positives worth recording, since they are what the rest of the review rests on:

- **SQL** — every statement in `d1r2-store.ts` is `prepare(...).bind(...)`; no
  interpolation into SQL anywhere. `claimSlug` (`:184`) closes the
  publish-race correctly with `ON CONFLICT DO NOTHING` + read-back.
- **HTML escaping** — the Astro compiler used to escape interpolations
  implicitly; `packages/framework/src/modules/html.ts` makes it explicit at each
  sink (five entities, matching the L1 emitter), and there is deliberately no
  `raw()` helper. `contact-form/component.ts` routes the form action through
  `assertSafeUrl` and escapes every other value.
- **Path confinement** — `isUnsafeName` (`d1r2-store.ts:154`) guards all four
  write paths and the read path; traversal is separately covered by AC-907 in
  `reconciliation-published-site-serving.test.ts:333`.
- **Secrets** — `ANTHROPIC_API_KEY` is a `wrangler secret`, never a var, never in
  the repo; the deploy hook carries the name and the push only.
- **Deduplication** — `publish.ts` is one implementation of publish/checkout over
  the `SiteStore` port, replacing the filesystem-only `cmdPublish`; the registry
  derives its component map from `CATALOG` rather than restating it.

## Checklist Compliance

No `architecture_checklist`, `security_checklist` or `design_checklist` report
exists (`xgd ticket list --type report --filter fields.report_kind=…` returns 0
items for each). Sections omitted per instructions.

The repo-level Security Policy (structured-only, validated by construction) is
nonetheless upheld by the change: no raw-CSS or raw-HTML escape hatch is
introduced, the renderer remains the only emitter, and the new module components
escape at every sink rather than relying on a compiler that is no longer present.

## Smoke Test

Entry points tested: `1c` (usage), `1c list`, `1c revisions <slug>` — clean exit,
correct output, new commands present in usage.

Not tested (sandbox denies socket binding): `1c builder`, `1c push`, `1c assets`,
and the Worker's HTTP surface. The `ACCESS_DEV_OPEN` defect below was established
by reading the code and config together plus confirming no `.dev.vars` exists to
override them, not by running the server.

## Issues Found

**Critical (must fix)**:

- `ACCESS_DEV_OPEN` is unreachable, and the local builder is gated shut as a
  result. `apps/control-app/src/index.ts:56-60` returns true only when
  `ACCESS_TEAM_DOMAIN` **and** `ACCESS_AUD` are both empty *and*
  `ACCESS_DEV_OPEN === '1'`. `apps/control-app/wrangler.toml:67-71` sets all
  three in the same top-level `[vars]` block. `wrangler dev` reads that block, so
  `isUnconfiguredLocalDev()` always returns `false`, `guardAccess` runs, and a
  browser on `http://localhost:8788` — which holds no `CF_Authorization` cookie
  and receives no `cf-access-jwt-assertion` header — gets
  `401 Cloudflare Access rejected this request: no Access token was presented`.
  There is no `.dev.vars` overriding it. This breaks the loop documented in
  `1c` usage (`tools/generate/src/cli/index.ts:244-248`) and in `bin/publish:26`,
  and leaves a var whose own adjacent comment (`wrangler.toml:48-49`) states it
  "has no effect at all once ACCESS_TEAM_DOMAIN / ACCESS_AUD are set" sitting two
  lines above the block that sets them.
  `tests/test_UAT_FC_REQ-145_build_artifacts.test.ts:83-84` asserts only the
  key's presence at the top level and absence under production, so nothing
  catches the contradiction.

**Warnings (should fix)**:

- `access.ts:217` — an unrecognised `kid` triggers a cache-bypassing JWKS fetch
  before any signature check, so a caller who reaches the Worker can force one
  outbound request per attempt with a randomised `kid`. Bounded in practice by
  edge Access and `workers_dev = false`, but the rotation path deserves a
  negative cache or a refresh floor so it cannot be driven by unverified input.
- `tools/generate/src/index.ts:9` — orphaned comment left by the `deploy` module
  deletion, now mislabelling the `conformance` export.
- `apps/public-site/src/content-type.ts:7` — cross-reference to the deleted
  `tools/generate/src/deploy/r2.ts`.
- `ai/host.ts:20-24` and `ai/toolbox.ts:18-21` — split rationale cites the Astro
  transform that REQ-148/150 removed in this same bundle.
- The XGD quality reports for this bundle are vacuous (`0 tests`, type-check
  skipped). Worth fixing at the harness level — a root `tsconfig.json`, or
  teaching the runner about `typecheck` scripts and the `vitest.config.mts`
  project split — so the gate stops reporting success without executing anything.

## Fix-It Prompt

Fix the critical finding only; the warnings are optional in this pass.

1. **`apps/control-app/wrangler.toml`** — remove `ACCESS_TEAM_DOMAIN` and
   `ACCESS_AUD` from the **top-level** `[vars]` block (lines 70-71), leaving that
   block as `TENANT_ID` + `ACCESS_DEV_OPEN` only. Keep both keys in
   `[env.production.vars]` (lines 115-116) exactly as they are — production is
   unaffected. This restores the intended shape: `wrangler dev` sees an
   unconfigured Access gate, `ACCESS_DEV_OPEN = "1"` takes effect, and the local
   builder serves; `wrangler deploy --env production` sees the real identifiers
   and no `ACCESS_DEV_OPEN`, so the deployed Worker still verifies every request.
   Update the comment at lines 56-66 to match — it currently describes the keys
   as living in this block.

2. **Do not change `apps/control-app/src/index.ts`.** `isUnconfiguredLocalDev()`
   is correct as written; the two-independent-mistakes property it documents is
   the thing being restored, not weakened.

3. **Add the missing assertion** to
   `tests/test_UAT_FC_REQ-145_build_artifacts.test.ts`, beside the existing
   checks at lines 83-84: assert that the top-level `[vars]` block does **not**
   define `ACCESS_TEAM_DOMAIN` or `ACCESS_AUD`, and state why — that
   `ACCESS_DEV_OPEN` is inert unless both are absent there, so populating them at
   the top level silently disables the local dev path. Without this the same
   regression recurs the next time someone fills the values in.

4. **Verify** with `npm test -- tests/test_UAT_FC_REQ-145_build_artifacts.test.ts`
   and `npm test -- tests/test_UAT_FC_REQ-147_access_gate.test.ts` (both pass
   today; both must still pass), plus `npm run build`.
