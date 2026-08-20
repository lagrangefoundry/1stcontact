---
uid: report-9d10c604
id: REPORT-2397
type: report
title: 'Code Review: bundle-77b28def'
created_by: xgd
created_at: '2026-08-20T07:17:51.145789+00:00'
updated_at: '2026-08-20T07:17:51.145789+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: code_review
  subject_uid: bundle-77b28def
  anchor_uid: bundle-77b28def
---

# Code Review

**Result**: FAIL

## Summary

The implementation itself is of high quality — the new `SiteStore` port, the palette
popup routes, `shade.ts`, the KB commands and the `bin/build|deploy|smoke` scripts are
well-structured, consistently patterned and fully wired into their usage contexts. The
bundle fails on **evidence**, not on design: two changes in it break test files the bundle
did not touch — the deletion of the example sites (`storage/sites/harbor-cafe`) and the
sync→async conversion of the edit/toolbox layer — producing 7 reproducible test failures
on this worktree. Neither was caught, because every quality report attached to this bundle
is a single-test scoped run and the build stage type-checks nothing.

## Quality Gates

| Gate | Reported | Verified here |
|------|----------|---------------|
| Lint | success, 0 errors / 0 warnings (report-04a97bcb) | not re-run |
| Build | "success" — stdout: `No tsconfig.json — type-check skipped (JS-only project)` | **no type-check ran** (see Issues, W1) |
| Tests | "pass" | **FAIL — 7 confirmed failures** (below) |
| Coverage | `coverage: null`, `lines_total: 0` | not measured by any attached report |

The attached quality reports do not evidence the gate they claim. The most recent
(report-04a97bcb) ran **0 tests**. report-bf64c110 ran with `-k test_UAT_FC_REQ-139_locked_controls`,
which **deselected all 1644 tests** — REQ-139's UATs were never executed by the gate (its real
test names are `test_UAT_FC_REQ-139_a_gradient_painted_run_...` etc., which the filter cannot match).

### Confirmed failures (reproduced on this worktree)

**F1 — `tests/reconciliation-colour-retrofit-shade-model.test.ts` — 2 failed**
```
Error: ENOENT: no such file or directory, lstat '.../storage/sites/harbor-cafe'
  seedSandbox tests/reconciliation-colour-retrofit-shade-model.test.ts:107  (called from :315)
  seedTemp    tests/reconciliation-colour-retrofit-shade-model.test.ts:115  (called from :1028)
```
Commit `dd12a1f4b` deletes the example sites `1stcontact` and `harbor-cafe` (deliberately, and
the commit message says so). This test file is **not touched by the bundle** and still copies
fixtures out of `storage/sites/harbor-cafe`. `storage/sites/` now holds only `gigabytealchemy`
and `xgd`. The bundle updated two other suites for this deletion and missed this one.

**F2 — `tests/test_UAT_FC_REQ-122_tool_surface.test.ts` — 5 failed**
```
TypeError: call(...).replace is not a function          (:116, via :179)
AssertionError: expected [] to include 'NOT_FOUND'      (:225, :236)
TypeError: .toMatch() expects to receive a string, but got object   (:245)
```
REQ-142 made every toolbox operation `async`, and `Toolbox.run` now awaits `surface.invoke`
— stated explicitly at `tools/generate/src/cli/ai/toolbox.ts:351-356`. This test file is **not
touched by the bundle**: `box` is typed `run: (...) => string` (:101) and `call()` returns
`box.run(...)` unawaited (:105-107), so every assertion now runs against a Promise.

**F3 (warning, attribution uncertain) — `tests/test_UAT_FC_REQ-122_chat_panel.test.ts` — 1 failed**
```
expected [...] to deeply equal [...]   — received messages carry an extra { meta: { ts } }   (:179)
```
The bundle touches neither `chat.js` nor the chat message model (`getChat()` comes from the
installed webui component, delivered out of band). This looks like upstream drift rather than
a bundle regression, but it must be confirmed, not assumed.

### Not verifiable in this environment (NOT counted against the bundle)

The full-suite run in this sandbox aborted with `Error: listen EPERM: operation not permitted
127.0.0.1`. Every suite that binds a port (`startBuilder`, e.g. `test_UAT_FC_REQ-140_segment_colour.test.ts:432`)
timed out at 240s as a result: REQ-140 (3), REQ-135 (3), REQ-42 (4), REQ-109 (1), REQ-39 (1),
plus skips in REQ-115/REQ-119/capture. These are **sandbox artifacts, not evidence of defects** —
and equally, this review could not confirm those UATs pass. They need a run in an environment
that permits `listen`.

## External Interface Accessibility

Every new entry point is wired in. No dead modules found.

| Surface | Wired | Evidence |
|---------|-------|----------|
| `1c preflight` | yes | switch case `tools/generate/src/cli/index.ts:494`; in USAGE |
| `1c kb build/export/status` | yes | switch case `index.ts:656`; in USAGE; `KB_USAGE` on unknown sub |
| `1c changes <slug>` | yes | dispatch `index.ts:1290`, handler `:1354`; in USAGE |
| `1c palette get/set/add/rm/rename` | yes | dispatch `index.ts:1283`, handlers `:1420-1431`; in USAGE |
| `/api/palette` GET+POST | yes | `tools/generate/src/cli/builder.ts:388-437`, closed op vocabulary, 400 on unknown verb |
| `/framework/site-schema-shade.js` | yes | `builder.ts` FRAMEWORK_SOURCES + route regex |
| `shared-store.ts` exports | yes | re-exported `index.ts:210-222`, consumed by `preflight` |
| `SiteStore` / `fsSiteStore` | yes | injected at `index.ts:1312` (`editOptions`) and `builder.ts:624` (`builderStore`) |
| `bin/build`, `bin/deploy`, `bin/smoke` | yes | executable, `--help` documented, `bin/build` calls `bin/1c preflight` |
| `kb/knowledge_bases.json` | yes | tracked declaration; `/kb/system/` correctly gitignored as derived |
| Removed `fsDraftStore` / `DraftStore` | clean | no stale references — only explanatory prose in `preview.ts:26` and `site-store.ts:11` |

## Code Quality

| File | Finding | Severity |
|------|---------|----------|
| `tools/generate/src/store/site-store.ts` | Port is total-async, path-free, single-write-verb; rationale documented at the seam | none (good) |
| `packages/site-schema/src/l1/shade.ts` | One implementation of the shade axis, no runtime imports so the browser runs the same code — correct call | none (good) |
| `packages/framework/src/l1/render.ts:1861` | `l1PaintsSurface` probe hex is never emitted; segmentation stays derived from `surfaceDecls` | none (good) |
| `tools/generate/src/cli/builder.ts:388` | Palette routes are thin transports over the same `editPalette*` functions the CLI uses — no parallel implementation; guards run server-side | none (good) |
| `apps/control-app/src/builder/*.js` | No `innerHTML` / `insertAdjacentHTML` / `eval` sinks; DOM built via `createElement` | none (good) |
| `tools/generate/src/cli/edit.ts` | `editPalette*` take `value: unknown` and validate internally — correct for the untrusted POST body | none (good) |
| — | No leftover debug code, commented-out blocks, TODO stubs, `_v2` files or duplicate helpers found in the changed set | none |

Deleting the example sites is defensible and documented in `dd12a1f4b`; the objection is only
that the sweep for dependents was incomplete (F1).

## Checklist Compliance

No `architecture_checklist`, `security_checklist` or `design_checklist` report exists
(all three queries returned 0 items). Sections omitted per instructions.

Against the standing policies in the session context: the security invariant is intact —
nothing in this bundle opens a raw-CSS/HTML hole, the palette write path validates references
against the site's own palette with bounded `shade`/`alpha` and refuses unknown keys, and the
`/api/palette` op vocabulary is closed. No new behavior module was authored; the colour work
lands as L1 axes and CLI/API verbs, which is where the CLAUDE.md guidance puts it.

## Smoke Test

| Entry point | Result |
|-------------|--------|
| `node tools/generate/bin/1c.mjs --help` | exit 0 — renders, including the new KB and preflight sections |
| `node tools/generate/bin/smoke.mjs --help` | exit 0 — renders usage and exit-code contract |
| `bin/build --help`, `bin/deploy --help`, `1c preflight`, `1c kb status` | **not run** — the session's permission layer denied direct script execution and these `node` invocations; not a code failure, and not evidence either way |

## Issues Found

**Critical (must fix)**:
- **C1** — `tests/reconciliation-colour-retrofit-shade-model.test.ts` fails (2 tests): seeds fixtures
  from `storage/sites/harbor-cafe`, deleted by this bundle.
- **C2** — `tests/test_UAT_FC_REQ-122_tool_surface.test.ts` fails (5 tests): calls the now-async
  `Toolbox.run` synchronously.

**Warnings (should fix)**:
- **W1** — Nothing in the pipeline type-checks the test suite, which is the reason C2 escaped.
  There is no root `tsconfig.json` (only `tsconfig.base.json`), so the quality gate's build step
  reports `type-check skipped (JS-only project)`; and `tests/` is not a workspace package
  (`pnpm-workspace.yaml` lists `apps/*`, `packages/*`, `tools/*`), so `pnpm -r build` — `bin/build`
  stage 2 — never sees it. A file-wide sync→async signature change is exactly the class of defect
  a type-check catches and a scoped test filter cannot.
- **W2** — The quality evidence attached to this bundle does not support its claim: the latest
  report ran 0 tests, and report-bf64c110's `-k` filter deselected all 1644. A UAT filter derived
  from a name no test carries silently proves nothing while reporting `success`.
- **W3** — `tests/test_UAT_FC_REQ-122_chat_panel.test.ts` fails on an unexpected `meta.ts` on chat
  messages. Probably upstream webui drift rather than this bundle; confirm before changing anything.
- **W4** — The browser-backed UATs this bundle adds (REQ-140, REQ-135) were never observed passing:
  not by the attached quality reports, and not by this review (sandbox denies `listen`).

## Fix-It Prompt

Fix C1 and C2. Both are test-side; do not change production code for them.

1. **C1 — `tests/reconciliation-colour-retrofit-shade-model.test.ts`.** The site
   `storage/sites/harbor-cafe` no longer exists (deleted by `dd12a1f4b`, deliberately). Two call
   sites still seed from it:
   - `:315` — `const bare = seedSandbox('harbor-cafe', 'shade939-bare')`
   - `:1028` — `const bareDir = seedTemp(cwd, 'harbor-cafe', 'small-bare')`

   Both use it as a *bare* specimen: a site carrying **no colour literals at all** (see the comment
   at `:313-314`). Replace it with a synthesised bare site rather than repointing at another stored
   site — this is the arrangement `dd12a1f4b` chose for the two suites it did update, and
   `tests/reconciliation-colour-census-and-retrofit.test.ts:97` and
   `tests/reconciliation-colour-palette-overlay.test.ts:526` show the established pattern; follow it.
   Do not restore the deleted sites — `test_UAT_FC_REQ-140_the_dead_example_sites_are_gone_from_the_store`
   asserts they stay gone. Keep the surviving `xgd` seed at `:314` as-is.

2. **C2 — `tests/test_UAT_FC_REQ-122_tool_surface.test.ts`.** `Toolbox.run` now returns a Promise
   (REQ-142; stated at `tools/generate/src/cli/ai/toolbox.ts:351-356`). Update the test's harness:
   - `:101` — `box` is typed `{ run: (tool, input) => string }`; make it `=> Promise<string>`.
   - `:105-107` — `call()` must be `async` and `await box.run(...)`.
   - `:114-118` — `callJson()` must be `async` and `await call(...)` before `.replace`.
   - Every call site of `call` / `callJson` becomes `await`ed, and the `it(...)` bodies `async`
     (failures observed at `:179`, `:225`, `:236`, `:245`; check the whole file, not only those).
   Do not make `Toolbox.run` synchronous again — async is the intended REQ-142 outcome.

3. **Re-run and report honestly.** Run at minimum:
   `pnpm test tests/reconciliation-colour-retrofit-shade-model.test.ts tests/test_UAT_FC_REQ-122_tool_surface.test.ts`
   and paste the real output. If the environment forbids `listen`, say which suites could not be
   exercised rather than reporting a filtered run as a passing gate.

4. **Do not fix W3 speculatively.** First establish whether `meta.ts` on chat messages comes from
   the installed webui component or from this repo. If it is upstream, record that and leave the
   assertion alone or loosen it deliberately — do not delete the assertion to make the run green.

W1/W2 are systemic and outside this bundle's diff; do not attempt them in the fix loop. They are
worth raising with the operator separately.
