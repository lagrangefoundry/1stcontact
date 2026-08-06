---
uid: report-b0a8dca3
id: REPORT-1442
type: report
title: 'Code Review: bundle-e0143ffa'
created_by: xgd
created_at: '2026-08-06T19:39:13.442647+00:00'
updated_at: '2026-08-06T19:39:13.442647+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: code_review
  subject_uid: bundle-e0143ffa
  anchor_uid: bundle-e0143ffa
---

# Code Review

**Result**: PASS

## Summary

The six-ticket bundle (REQ-108 pointer accent, REQ-109 relocatable output, REQ-110 `1c deploy`, REQ-111 public-site Worker, REQ-113 extensionless URLs, BUG-30 fragment relativization) is well-structured, consistently patterned after the existing L1/CLI/Worker idioms, and every new surface is wired into a reachable entry point — verified by running them, not by reading them.

The **7 test regressions that failed the previous review round are gone**: a full `vitest run` on this worktree is **1022 passed / 0 failed / 67 skipped across 156 files**, and the four suites the ticket bodies described as "pre-existing failures" (`reconciliation-1c-astro-free-render`, `reconciliation-3probe-gate`, `reconciliation-3probe-gate-evaluator`, `reconciliation-l1-fold-full-language`) pass here too — 4 files / 18 tests green, unchanged from `main`.

Remaining findings are all low-severity (a stale comment, a latent constant coupling, two documented duplications). None blocks the merge.

## Quality Gates

| Gate | Status | Evidence |
|---|---|---|
| Tests | **PASS** | `npx vitest run` → 152 files passed, 4 skipped; **1022 passed, 0 failed**, 67 skipped (1089) in 28.8s |
| Build | **PASS** | `pnpm -r build` exit 0 (7/8 projects; `tsc --noEmit` clean for `apps/public-site` + `apps/control-app`) |
| Typecheck | **PASS** | `pnpm -r typecheck` exit 0 — `packages/site-schema`, `packages/framework`, `tools/generate` all clean. Run explicitly because `-r build` does **not** cover them (they expose `typecheck`, not `build`), and `packages/framework/src/l1/render.ts` is the largest change in the bundle |
| Coverage | **PASS** | v8 coverage scoped to the changed modules (`l1/render.ts`, `site-schema/src/l1/**`, `apps/public-site/src/**`, `deploy/**`, `cli/serve.ts`): **94.47% lines**, 93.47% statements, 88.57% branches, 91.54% functions — against a 25.0% threshold (`.xgd/config.yaml:75`) |
| Lint | **PASS (vacuous)** | Quality report `report-e649b364` reports 0 errors / 0 warnings, but `.xgd/quality.yaml` names `eslint` and **eslint is neither installed nor configured** in this repo (no `eslint.config.*`, no `.eslintrc*`, absent from `package.json` devDependencies on `main` as well). The gate reports green because nothing runs. **Pre-existing on `main`, not introduced by this bundle** — recorded as a warning below rather than held against it |

### On the workflow quality reports

Every `quality` report in this reconcile carries `"suites": {}` — no suite ever executed under the gate (this is what let the previous round's 7 regressions reach review). All test/build/typecheck/coverage figures above were produced by running the commands directly in this worktree. This is an XGD tooling gap, not a defect in the reviewed code.

## External Interface Accessibility

Every new surface is reachable. Verified by invocation:

| Surface | Wiring | Evidence |
|---|---|---|
| `1c deploy` | `tools/generate/src/cli/index.ts:372` case + usage block at `:168` | `./bin/1c --help` shows the Deploy (REQ-110) section; `./bin/1c deploy xgd --dry-run` exits 0 and prints all five labelled stages ending in `https://1stcontact.io/site/xgd/draft/eb3ba04a9350/` |
| deploy module | `tools/generate/src/index.ts:10` (`export * from './deploy'`) | barrel export present |
| `public-site` Worker | `apps/public-site/src/index.ts` default handler + `SITES` R2 binding in `wrangler.toml` (top-level **and** `[[env.production.r2_buckets]]`, since named envs do not inherit) | `wrangler deploy --env production --dry-run` → 30.67 KiB bundle, `env.SITES (1stcontact-sites)  R2 Bucket` |
| `pointerAccent` L1 axis | `schema.ts:530` → `surfaceAxesShape` → `render.ts` `pointerAccentRules` → `emitNode` | Real render of `xgd`: 6 nodes carry `class="l1-N l1-pt"` and 6 `html[data-l1-pointer] .l1-N::after` rules are emitted — matching the ticket's six bands exactly. `mask-composite` count: 0, as designed |
| `L1_POINTER_SCRIPT` | `packages/framework/src/index.ts:99` | exported from the framework barrel alongside `L1_REVEAL_SCRIPT` |
| `relativizeUrl` (3 sinks) | `render.ts:159` (`cssUrl`), `:1631` (link `href`), `:1786` (`img src`) | Rendered `xgd` output contains **zero** root-absolute `url("/…")`, `src="/…"` or `href="/…"` in `index.html`, `home.html` or `theme.css` |
| `renderSite` flatness assert | `tools/generate/src/render/render.ts:216` | throws on a slug containing `/` or `\` before anything is written |

No dead module, uncalled function, or unconfigured surface found.

## Code Quality

| File | Finding | Severity |
|------|---------|----------|
| `tools/generate/src/cli/serve.ts:79` | Stale rationale: the comment still says "Cloudflare Pages serves that at `/<slug>`". REQ-113's own scope extension established this premise is **false** — there is no Cloudflare Pages in the serving path; the `public-site` Worker serves every byte from R2, and gaining the same mapping is precisely why the ticket was extended. The behaviour is correct; only the stated reason is wrong, and it is the kind of comment a future reader would act on | Low |
| `packages/framework/src/l1/render.ts:1213` | `L1_POINTER_SCRIPT` interpolates `N=${POINTER_LOBES}` but hardcodes `LAG=[0.5,0.36,0.28,0.22,0.17,0.13,0.1]` — exactly 7 entries, ~340 lines from the constant at `:875`. Raising `POINTER_LOBES` makes `LAG[i]` `undefined`, so `tx[i] += ex*undefined` → `NaN` coordinates and a silently dead accent. Latent, not live | Low |
| `tools/generate/src/deploy/r2.ts:205` | `MemoryR2Client` — a test double — lives in production source and is re-exported through the package barrel. Documented as the UAT seam and a common shape for an interface's in-memory implementation, but Coding Standards put fixtures in `tests/` | Low |
| `apps/public-site/src/content-type.ts` / `deploy/r2.ts:49`; `site-store.ts:43,48` / `deploy/manifest.ts:38` | The MIME table, `manifestKey` and `padRevision` are duplicated across the Worker and the Node deploy tool. **Acceptable**: the duplication crosses a deployment boundary the Worker bundle cannot import across, both copies say so in their doc comments, and the pair is pinned by `test_UAT_FC_REQ-111_content_types` | Informational |
| `tools/generate/src/deploy/r2.ts:78` | `WranglerR2Client` answers `list()` from a bucket-root `_index.json` side file because `wrangler r2 object` exposes no LIST. `--prune` is therefore blind to anything written by another route. Honestly documented at `R2Client.record` as the ceiling of the chosen mechanism, with the seam sized to delete outright when a real LIST client arrives | Informational |
| `tests/req113-serve-extensionless.test.ts` | Names use `test_UAT_FC_REQ113_*` (no hyphen) where every other suite in the bundle uses `REQ-113`. The naming gate accepted it (`reconciliation_test_naming_check` = pass) | Cosmetic |

No leftover debug code, commented-out blocks, or TODO stubs in any changed production file (`console.log` occurrences in `cli/index.ts` are the CLI's own output). No magic numbers left unexplained — `POINTER_LOBES`, `POINTER_FLICKER`, `POINTER_FLICKER_SPEED`, `POINTER_TEXTURE_PASSES` and `SNAPSHOT_ID_LENGTH` are all named constants carrying the reasoning for their value. `bin/verify_req108_pointer.mjs` follows the precedent of `bin/verify_req100_reveal.mjs`, which already exists on `main`.

### Security envelope (DOC-2) — unchanged

Not a checklist item (none exists), but the bundle touches the one load-bearing boundary, so it was checked directly:

- `relativizeUrl` is applied **after** `isSafeUrl` / `CSS_URL_ALLOWED` at all three sinks — it reshapes an already-vetted value and can never admit one.
- The `//` guard (`render.ts:130`) prevents `//evil.com/x` → `/evil.com/x`, and BUG-30's colon rule prevents `/javascript:x` → `javascript:x`, which would have handed back the live scheme `isSafeUrl` had just refused. Both pinned by UATs (`test_UAT_FC_BUG-30_colon_first_segment_stays_a_path`, `..._asset_and_absolute_urls_unchanged`).
- `pointerAccent` is a closed, `.strict()`, envelope-bounded typed bag; colour goes through `l1Color` and is re-checked by `cssColor` at emit; `radiusPx` is bounded `[8, 1000]` (`validate.ts:63`). No raw-CSS hole opened.
- `L1_POINTER_SCRIPT` interpolates **only renderer constants** — no instance value crosses into JS; the script learns neither a radius, a colour, nor a lobe count.
- Worker: untrusted path components never reach an R2 key unvouched (`R2SiteStore.resolve` looks a draft id **up** in `manifest.previews` and builds the prefix from the manifest's own value; the published prefix comes from `manifest.live`, which the URL cannot influence). `decodeSegment` rejects `.`, `..`, embedded separators, NUL and malformed percent-encoding. 404s are uniform across unknown-slug / unpublished / missing-object, so the server is not an existence oracle.

## Checklist Compliance

No `architecture_checklist`, `security_checklist` or `design_checklist` report exists for this project — all three queries returned empty. Sections omitted per the review contract.

## Smoke Test

| Entry point | Invocation | Result |
|---|---|---|
| `1c` CLI | `./bin/1c --help` | Exit 0; Deploy (REQ-110) usage block renders |
| `1c deploy` | `./bin/1c deploy xgd --dry-run` | **Exit 0.** Rendered 13 files / 498.5 KB, hashed `eb3ba04a9350`, planned both `out/` and `source/` uploads, printed the manifest line and `(dry-run — nothing was uploaded)`, terminating in the shareable URL. No stack trace, no network write |
| Rendered output (REQ-109) | grep over `storage/dist/sites/xgd/draft/` | Zero root-absolute `url()` / `src` / `href`; fragments emitted as `#how`, `#papers`, `#signup` |
| Pointer accent (REQ-108) | grep over emitted HTML | 6 `l1-pt` marker classes, 6 marker-gated `::after` rules, 0 `mask-composite` |
| `public-site` Worker | `wrangler deploy --env production --dry-run` | Exit 0; `SITES` R2 binding reported |

## Issues Found

**Critical (must fix)**: none.

**Warnings (should fix, non-blocking)**:
- `tools/generate/src/cli/serve.ts:79` — comment asserts a "Cloudflare Pages is the deployment target" premise that REQ-113 itself refuted. Correct it to name the `public-site` Worker.
- `packages/framework/src/l1/render.ts:1213` — `LAG` is length-coupled to `POINTER_LOBES` with no guard; a future change to the constant fails silently as `NaN`.
- `tools/generate/src/deploy/r2.ts:205` — `MemoryR2Client` (test double) ships in production source and through the public barrel.
- **Project-level, pre-existing, outside this bundle**: the lint gate is vacuous (eslint named in `.xgd/quality.yaml` but not installed or configured), and every quality report in this reconcile ran zero suites (`"suites": {}`). The second is what allowed the previous round's regressions to reach review; both are worth a tooling ticket.
