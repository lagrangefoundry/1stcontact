---
uid: report-62ab1e53
id: REPORT-2429
type: report
title: 'Code Review: bundle-77b28def'
created_by: xgd
created_at: '2026-08-20T12:20:07.992845+00:00'
updated_at: '2026-08-20T12:20:07.992845+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: code_review
  subject_uid: bundle-77b28def
  anchor_uid: bundle-77b28def
---

# Code Review

**Result**: PASS

## Summary

The three critical defects from the previous round (C1 scope literal, C2 fifth field shape,
C3 `meta.ts` drift) are genuinely fixed, and I re-ran all four affected suites to confirm —
25/25 pass. I then swept the whole sandbox-runnable node set myself (182 files, 4 batches):
**1279 passed, 36 skipped, 19 failed, and every one of the 19 traces to this sandbox's
`listen` denial, not to the bundle**. The implementation itself remains high quality: the
`SiteStore` port, the journal split, `shade.ts`, the palette routes and the `bin/*` scripts
are well-structured, fully wired, and all four CLI entry points now execute cleanly — the
first round in which the smoke tests actually ran.

## Quality Gates

| Gate | Reported (report-52e26d8d) | Verified here |
|------|---------------------------|---------------|
| Lint | success, 0 errors / 0 warnings | not re-run — accepted |
| Build | "success", stdout `No tsconfig.json — type-check skipped (JS-only project)` | **no type-check ran** (W1, systemic, still open) |
| Tests | "pass" — title says *0 tests, 0 failed*, `"suites": {}` | **re-run independently — see below** (W2, systemic, still open) |
| Coverage | not measured by any attached report | not measured |

The attached quality evidence is still degenerate (W2), so it is not what this verdict rests
on. The verdict rests on the run below.

### The sweep I actually ran

`vitest run --project node` over the 182 sandbox-runnable files, in 4 batches of ~46
(`--testTimeout=20000 --hookTimeout=20000`). The 62 port-binding files were separated first
by grepping for `listen(` / `createServer` / origin helpers.

| Batch | Result |
|-------|--------|
| 1 (46 files) | 243 passed, 3 skipped, **1 failed** — `AC703` isolation, `listen EPERM` |
| 2 (46 files) | 306 passed, 3 skipped, **7 failed** — 6 × clean-page-urls `listen EPERM`, 1 × AC845 (see below) |
| 3 (46 files) | 378 passed, 22 skipped, **6 failed** — req39 / req42 / req48 / req113, all `listen EPERM` |
| 4 (44 files) | 352 passed, 8 skipped, **5 failed** — req85 / req88 / req93 conformance, all `listen EPERM` |
| **Total** | **1279 passed, 36 skipped, 19 failed** |

**Zero assertion failures attributable to the bundle.** I verified the nature of each failing
group directly rather than assuming: e.g. `req39` + `req48` in isolation report
`Error: listen EPERM: operation not permitted 0.0.0.0` and a timeout, not an assertion.

### The one failure that was not obviously EPERM — run to ground

`tests/reconciliation-l1-navigation.test.ts::test_UAT_AC845_declared_identifier_is_an_in_page_navigation_target`
fails in batch 2 with a real, fast assertion — `expected '' to be '#how'` at 43–83ms — which
is exactly the signature that is NOT a sandbox artifact. So I bisected it:

- the file **alone**: 10/10 pass;
- the file + batch 1 (47 files, 1 EPERM test): **passes**;
- the file + the half of batch 2 that contains it (23 files, no EPERM): **passes**;
- the file + `reconciliation-clean-page-urls.test.ts` alone (its 6 EPERM hangs): **passes**;
- the file + all 46 of batch 2: **fails, reproducibly** (twice).

The mechanism is `settle()` at `tests/reconciliation-l1-navigation.test.ts:77` — a fixed
`setTimeout(resolve, 20)` — being starved when six co-running tests are each parked 20s on a
denied `listen`. It is a pre-existing brittleness in a file **this bundle does not touch**
(`git log main..HEAD -- tests/reconciliation-l1-navigation.test.ts` is empty), and it would
not arise in an environment that permits `listen`. Recorded as W5, not counted against the bundle.

### Not exercisable in this environment (NOT counted against the bundle)

`listen` is denied here (`Error: listen EPERM: operation not permitted`), so 62 port-bound
files and the **entire `workers` project** cannot run — I confirmed `--project workers` still
aborts at startup on `listen EPERM 127.0.0.1`. **23 of those 62 are the bundle's own UATs**,
including its headline ones: `test_UAT_FC_REQ-133_palette_popup.test.ts` reports
`13 skipped` with a suite-level `listen EPERM`. This is W4, now in its third round.

**What materially reduces that risk this round**: every blocked capability also has a
reconciliation suite in the runnable set, and I ran those directly — they pass.

| Capability | Executed evidence |
|-----------|-------------------|
| REQ-142 store port | `reconciliation-site-storage-port` + `test_UAT_FC_REQ-142_site_store_port` |
| REQ-131 journal | `reconciliation-draft-change-journal` |
| REQ-133 palette | `reconciliation-palette-popup-surface`, `reconciliation-colour-census-and-retrofit` |
| REQ-123 KB | `reconciliation-system-knowledge-base` |
| REQ-144 build/deploy | `test_UAT_FC_REQ-144_deploy_scripts` |
| — | **7 files, 110/110 pass** |
| REQ-140 colour row | `reconciliation-copy-edit-colour-row` |
| REQ-139 locked controls | `reconciliation-copy-edit-control-availability` |
| BUG-35 tracking | `reconciliation-copy-edit-tracking` |
| REQ-137 shade model | `reconciliation-colour-palette-overlay`, `reconciliation-colour-retrofit-shade-model`, `test_UAT_FC_REQ-137_palette_shade` |
| — | **6 files, 38/38 pass** |

### Previous round's criticals — re-verified

`bug32-webui-scope-rebrand` + `reconciliation-copy-edit-typography` +
`reconciliation-builder-assistant-pane` + `test_UAT_FC_REQ-122_chat_panel`:
**4 files, 25/25 pass, 1.18s.** C1, C2 and C3 are closed. I also confirmed independently
that `@lagrangefoundry` now appears only in `tools/generate/src/cli/webui.ts` (the single
declaration) and in `apps/control-app/src/builder/{app,chat,editor}.js` (the declared
browser-source exception) — `.xgd/**` is excluded by the guard itself at
`bug32-webui-scope-rebrand.test.ts:236-246`, so the review reports quoting the scope are not
violations.

## External Interface Accessibility

Every new entry point is wired in; no dead modules.

| Surface | Wired | Evidence |
|---------|-------|----------|
| `1c preflight` | yes | `tools/generate/src/cli/index.ts:494` |
| `1c kb build/export/status` | yes | `index.ts:656`, `KB_USAGE` at `kb.ts:737` |
| `1c changes <slug>` | yes | `index.ts:1287`, handler `:1353` |
| `1c palette get/set/add/rm/rename` | yes | `index.ts:1283`, handlers `:1420-1433` |
| `/api/palette` GET+POST | yes | `builder.ts:389-437`; closed op vocabulary, 400 on unknown verb |
| `SiteStore` / `fsSiteStore` / `memorySiteStore` | yes | injected at construction; both adapters live |
| assistant palette tools | yes | `ai/toolbox.ts:222` (read), `:298-316` (the four writes) |
| `caretakerReminder` journal line | yes | `ai/roles.ts:104-115`, called with `since` |
| `l1PaintsSurface` | yes | `render.ts:1866`, consumed by `segmentKind` at `:1897` |
| `bin/build`, `bin/deploy`, `bin/smoke` | yes | executable, `--help` documented, all three run |

## Code Quality

| File | Finding | Severity |
|------|---------|----------|
| `tools/generate/src/store/site-store.ts` | Port is total-async, path-free, single-write-verb, with the rationale for each stated at the seam | none (good) |
| `tools/generate/src/store/journal-model.ts` | Window arithmetic split from storage so both adapters share one implementation | none (good) |
| `tools/generate/src/cli/segments.ts` | Segment derivation **moved** out of `ai/toolbox.ts` rather than copied — one derivation, three consumers | none (good) |
| `packages/site-schema/src/l1/shade.ts` | One implementation of the shade axis, zero runtime imports so the browser runs the renderer's code | none (good) |
| `packages/framework/src/l1/render.ts:1866` | `l1PaintsSurface` probe hex never emitted; segmentation stays derived from `surfaceDecls` | none (good) |
| `tools/generate/src/cli/builder.ts:400-437` | Palette route is a thin transport over the same `editPalette*` the CLI uses; op vocabulary closed server-side | none (good) |
| `tools/generate/src/cli/edit.ts:1546` | `requirePaletteValue` validates through `l1OpaqueHexSchema`, then `validateOrThrow` re-validates the whole definition before write | none (good) |
| `packages/site-schema/src/l1/edit.ts:1135` | `locked` is enforced on the **write** side, not only rendered read-only | none (good) |
| `apps/control-app/src/builder/*.js` | No `innerHTML` / `insertAdjacentHTML` / `eval` / `new Function`; DOM built via `createElement` + `textContent` | none (good) |
| changed set (36 production files) | No `TODO` / `FIXME` / `debugger` / commented-out blocks; no `_v2` files; no `.only` / `.skip(` in `tests/` | none |
| `tests/reconciliation-copy-edit-typography.test.ts:741` | Function name still reads `..._four_closed_shapes_...` though the set is now five and AC-991's own text was already updated to five | **warning (W6)** |

Async conversion checked for missed call sites (the classic hazard when a sync→async change
merges clean): no unawaited `store.write` / `store.read` call sites found.

## Checklist Compliance

No `architecture_checklist`, `security_checklist` or `design_checklist` report exists — all
three queries returned 0 items. Sections omitted per instructions.

Against the standing policies in the session context, DOC-2's structured-only invariant holds:
palette entries are hex-only via `l1OpaqueHexSchema` (`palette.ts:59`), objects are `.strict()`
(`:82`, `:110`), the `/api/palette` op vocabulary is closed and validated server-side, nothing
opens a raw-CSS/HTML hole, and no new behavior module was authored — the colour work lands as
L1 axes plus CLI/API verbs, which is where CLAUDE.md puts it.

## Smoke Test

| Entry point | Result |
|-------------|--------|
| `bin/1c --help` | **pass** — full usage, includes the new `kb` and `preflight` sections |
| `bin/build --help` | **pass** — documents stages and exit 6 |
| `bin/deploy --help` | **pass** — documents hooks and the `DEPLOY_*` contract |
| `bin/smoke --help` | **pass** — documents flags and skip-counting |
| `vitest run --project node` | **run in 4 batches** — 1279 passed / 19 EPERM-caused failures |
| `vitest run --project workers` | **crashes at startup** — `listen EPERM`, sandbox restriction |

## Issues Found

**Critical (must fix)**: none.

**Warnings (should fix — systemic, outside this bundle's diff, for the operator not the fix loop)**:
- **W1** — Nothing type-checks the test suite. No root `tsconfig.json` and `tests/` is not a
  workspace package, so `pnpm -r build` never sees it and the gate reports
  `type-check skipped (JS-only project)`.
- **W2** — The quality evidence attached to this bundle still does not support its own claim:
  `report-52e26d8d` records `"suites": {}` and 0 tests while reporting success. Three rounds
  running, every reviewer has had to run the suite themselves to get a real answer.
- **W4** — 62 port-bound files and the whole `workers` project have still never been observed
  by anyone, including 23 of this bundle's own UATs (REQ-133's 13 skip outright). Mitigated
  but not closed by the 148 passing reconciliation tests tabled above. Needs one run in an
  environment permitting `listen`.
- **W5** — `tests/reconciliation-l1-navigation.test.ts:77` uses a fixed `setTimeout(…, 20)`,
  which starves under concurrency. Pre-existing, untouched by this bundle; worth replacing
  with a `hashchange`-awaited promise so it stops producing false criticals for reviewers.
- **W6** — `reconciliation-copy-edit-typography.test.ts:741` still names itself
  `test_UAT_AC991_every_field_is_one_of_four_closed_shapes_and_markup_stays_literal` while the
  set is five and AC-991's ticket text already says five. Traceability is intact (the `AC991`
  token is what links it), so this is cosmetic — but it is the last trace of the C2 contradiction.
