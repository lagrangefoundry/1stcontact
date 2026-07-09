---
uid: report-f4642d08
id: REPORT-315
type: report
title: 'Code Review: bundle-6a071846'
created_by: xgd
created_at: '2026-07-09T19:57:33.331851+00:00'
updated_at: '2026-07-09T19:57:33.331851+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: code_review
  subject_uid: bundle-6a071846
  anchor_uid: bundle-6a071846
---

# Code Review

**Result**: PASS

## Summary

The bundle (REQ-1, REQ-3, REQ-4, REQ-5, REQ-10) scaffolds the 1stcontact.io monorepo, the `@1stcontact/site-schema` data contract, the `@1stcontact/framework` token system + 6-module Phase-0 catalog, and a toolchain upgrade to Astro 7 / Vitest 4 / Wrangler 4 / Zod 4 / TS 6. The implementation is clean, consistently structured, and thoroughly documented with DOC-7/REQ traceability. All quality gates pass; all new interfaces are wired and exercised. Two minor, non-blocking observations noted below.

## Quality Gates

Source: latest regression quality report (report-3dc5fc57 / REPORT-313).

- **Lint**: success, 0 errors / 0 warnings
- **Build**: success. Verified locally: `pnpm -r build` clean across all 7 buildable packages (framework has no precompile by design — Astro components are compiled by the consuming app).
- **Tests**: 43/43 regression-selected pass, 0 failed. Verified locally: full suite `pnpm test` → 15 files, 91 tests, all pass (~8s).
- **Preflight**: pass, no violations.

## External Interface Accessibility

New entry points wired in: **yes**. No gaps.

- All 6 Phase-0 modules registered in `packages/framework/src/modules/registry.ts` (`MODULES` array → keyed `<id>@<version>` map) and re-exported through `packages/framework/src/index.ts`.
- `getModule(id, version)` resolves each; throws a clear catalog-miss error otherwise.
- Both Workers wired: `apps/public-site` (apex + `*.1stcontact.io` wildcard routes) and `apps/control-app` (`app.1stcontact.io`), each with its own `wrangler.toml` production env.
- CI (`ci.yml`: install + build + test + both dry-run deploys) and deploy (`deploy.yml`: push-to-`xgd-stable`, both Cloudflare secrets exposed, `wrangler deploy` for both Workers, concurrency group) workflows present and correct.
- `site-schema` exports `validateSite`, all types, and error/result types via `src/index.ts`.

## Code Quality

| File | Finding | Severity |
|------|---------|----------|
| packages/framework/src/modules/hero/index.astro | `subhead` is declared `type: 'markdown'` in `hero/meta.ts` and typed as markdown content, but is rendered as plain text `{subhead}` rather than via `renderMarkdown()` (as `contact-form` and `text-block` do). Markdown syntax in a hero subhead would render literally. Reconciled UATs pass against the as-built behavior. | Warning |
| packages/framework/src/buildInfo.ts | `BUILD_YEAR = 2026` hardcoded. Intentional and documented (deterministic render output, no `new Date()` at render time per REQ-4). Will need a bump/automation strategy eventually, but correct for now. | Info |

Overall: structure and naming are consistent across modules (shared `dials.ts` enums, uniform surface/spacing CSS-class conventions, `set:html` for validated markdown). No leftover debug code, commented-out blocks, TODO stubs, or duplicate logic. `deepMerge`/token-CSS generation, the discriminated-union validator result, and the memoised markdown processor are all sound.

## Smoke Test

Entry points tested:
- `pnpm test` → 91/91 pass.
- `pnpm -r build` → clean (all workers typecheck, site-schema emits).
- `bin/project/xgd_version_bump --help` → prints full usage; bare invocation performs a patch bump (verified, then reverted — working tree restored to v0.0.5, `git status` clean).
- Worker handlers return placeholder 200 responses (covered by REQ-1 UATs).

## Issues Found

**Critical (must fix)**: none.

**Warnings (should fix)**:
- `hero` subhead markdown is not rendered through `renderMarkdown()` despite being declared markdown — inconsistent with the other markdown-bearing modules. Low impact (hero subheads are typically plain), so this is a should-fix, not a blocker. If markdown in hero subheads is intended, route it through `renderMarkdown()` + `set:html` like `contact-form`/`text-block`; otherwise change the meta/content type to `string` to remove the mismatch.
