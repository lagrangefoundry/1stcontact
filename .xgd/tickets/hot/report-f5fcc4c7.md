---
uid: report-f5fcc4c7
id: REPORT-2411
type: report
title: 'Code Review: bundle-77b28def'
created_by: xgd
created_at: '2026-08-20T08:42:54.705645+00:00'
updated_at: '2026-08-20T08:42:54.705645+00:00'
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

The implementation remains high quality — the `SiteStore` port, `shade.ts`, the palette
popup and routes, the KB commands and the `bin/build|deploy|smoke` scripts are
well-structured, fully wired, and carry unusually good rationale at their seams. The
previous round's C1/C2 are genuinely fixed and I re-ran both to confirm. The bundle fails
again on the **same class of defect the fix loop did not sweep for**: this review ran the
whole `node` project for the first time in this reconcile and found **5 further reproducible
failures in 3 test files the bundle never touched** — two of them caused directly by the
bundle's own changes, one by the upstream drift the last fix loop only half-corrected.

## Quality Gates

| Gate | Reported | Verified here |
|------|----------|---------------|
| Lint | success, 0 errors / 0 warnings | not re-run |
| Build | "success" — stdout `No tsconfig.json — type-check skipped (JS-only project)` | **no type-check ran** (W1, still open) |
| Tests | "pass" (report-6decd207: *0 tests, 0 failed*) | **FAIL — 5 confirmed failures** |
| Coverage | not measured by any attached report | not measured |

The attached quality evidence is still degenerate: the most recent report for this bundle,
`report-6decd207`, records `"suites": {}` and its own title says **0 tests**. It asserts a
passing gate having executed nothing. That is W2 from the last review, unchanged.

### Confirmed failures — reproduced on this worktree, deterministic

These are **not** sandbox artifacts. Each fails in milliseconds with an assertion, not a
240s timeout, and each reproduces in isolation.

**C1 — `tests/bug32-webui-scope-rebrand.test.ts::test_UAT_AC960_component_scope_is_written_in_exactly_one_place`**
```
AssertionError: the scope in use is restated outside its declaration and the
declared browser-source exception: expected [ …(3) ] to deeply equal []
+ [ "tests/reconciliation-platform-build-deploy-smoke.test.ts",
+   "tools/generate/src/cli/kb.ts",
+   "tools/generate/src/store/fs-store.ts" ]
```
AC-960 is an executable architectural invariant: `WEBUI_SCOPE` (`@lagrangefoundry`,
declared once at `tools/generate/src/cli/webui.ts:138`) must appear in no other tracked
file except the declared browser-source exception. **All three offending files are new in
this bundle**, so the bundle introduced the violation:
- `tools/generate/src/cli/kb.ts:14, :389, :496` — in doc comments
- `tools/generate/src/store/fs-store.ts:30` — in a doc comment
- `tests/reconciliation-platform-build-deploy-smoke.test.ts:455, :464, :469, :471, :475, :542, :558` — in code

The test counts prose deliberately (`bug32-webui-scope-rebrand.test.ts:195-210`): a
restatement in a comment is exactly the second definition site the rule exists to forbid.

**C2 — `tests/reconciliation-copy-edit-typography.test.ts` — 2 failed**
```
:333  AC-1117  expected [ 'text', 'color', 'fontSizePx', …(3) ]
               to deeply equal [ 'text', 'fontSizePx', …(3) ]
:785  AC-991   0.0/color: expected [ 'string','enum','integer','boolean' ] to include 'color'
```
REQ-140 widened the copy-field surface with a fifth field shape. This is stated in the
bundle's own source: `packages/site-schema/src/l1/edit.ts:187` types the union as
`'string' | 'enum' | 'integer' | 'boolean' | 'color'`, and `:170` says plainly *"REQ-140's
`'color'` is the first entry whose value is not a scalar."* The untouched typography suite
still encodes the superseded four-shape closed set at `:255` and the old field list at
`:333`. AC-991's own title — *"every field is one of four closed shapes"* — is now factually
false, and reconciliation did not update it.

**C3 — `tests/reconciliation-builder-assistant-pane.test.ts` — 2 failed**
```
:332  AC-1065  received messages carry an extra { meta: { ts } }
:405  AC-1066  received message carries an extra { meta: { ts } }
```
This is the **same** `meta.ts` drift the previous review raised as W3 and the fix loop
addressed — but only in `tests/test_UAT_FC_REQ-122_chat_panel.test.ts`. The fix report
established the provenance correctly (the installed `webui-chat` writes `meta.ts`; nothing
in this repo passes one) and then did not sweep for other files asserting whole message
records. Two more were sitting there.

### Not verifiable in this environment (NOT counted against the bundle)

This sandbox denies `listen` (`Error: listen EPERM: operation not permitted 127.0.0.1`,
reproduced directly). Every port-binding suite therefore times out rather than running:
REQ-140 (3), REQ-135 (3), REQ-139 (2), REQ-42 (4), clean-page-urls (6), copy-edit-gesture (6),
builder-request-time-render (6), image-selection (3), background-selection (2), req88 (2),
req85 (2), and the whole **workerd project** (`--project workers` aborts at startup, so
`test_UAT_FC_REQ-141_workers_runtime.workers.test.ts` and
`reconciliation-site-storage-port.workers.test.ts` have still never been observed by anyone).
These need an environment that permits `listen`. I am not claiming they pass, and equally I
do not count them against the bundle.

## External Interface Accessibility

Every new entry point is wired in; no dead modules. Re-verified this round:

| Surface | Wired | Evidence |
|---------|-------|----------|
| `1c preflight` | yes | `tools/generate/src/cli/index.ts:494` |
| `1c kb build/export/status` | yes | `index.ts:656`, `KB_USAGE` on unknown sub (`:699`) |
| `1c changes <slug>` | yes | `index.ts:1287`, handler `:1355` |
| `1c palette get/set/add/rm/rename` | yes | `index.ts:1283`, handlers `:1423-1431` |
| `/api/palette` GET+POST | yes | `builder.ts:389-437`, closed op vocabulary, 400 on unknown verb |
| `SiteStore` / `fsSiteStore` | yes | injected at `index.ts:1312`, `builder.ts:624` |
| `bin/build`, `bin/deploy`, `bin/smoke` | yes | executable, `--help` documented, `bin/build:84` calls `bin/1c preflight` |
| `kb/knowledge_bases.json` | yes | tracked declaration; `/kb/system/` correctly gitignored as derived |

## Code Quality

| File | Finding | Severity |
|------|---------|----------|
| `tools/generate/src/store/site-store.ts` | Port is total-async, path-free, single-write-verb, with the rationale for each stated at the seam | none (good) |
| `tools/generate/src/store/journal-model.ts` | Window arithmetic split from storage so both adapters share one implementation; `normalizeJournal` deliberately total | none (good) |
| `packages/site-schema/src/l1/shade.ts` | One implementation of the shade axis, zero runtime imports so the browser runs the same code the renderer does | none (good) |
| `packages/framework/src/l1/render.ts:1866` | `l1PaintsSurface` probe hex never emitted; segmentation stays derived from `surfaceDecls` | none (good) |
| `tools/generate/src/cli/builder.ts:389` | Palette routes are thin transports over the same `editPalette*` the CLI uses; guards run server-side against the definition on disk | none (good) |
| `tools/generate/src/cli/edit.ts:1547` | `requirePaletteValue` validates through `l1OpaqueHexSchema`, then `validateOrThrow` re-validates the whole definition before write | none (good) |
| `apps/control-app/src/builder/*.js` | No `innerHTML`/`insertAdjacentHTML`/`eval` sinks; DOM built via `createElement` | none (good) |
| `tools/generate/src/cli/kb.ts:198` | `optedIn` requires the strict boolean so a mis-parsed `"true"` fails loudly rather than silently joining the corpus | none (good) |
| `tools/generate/src/cli/kb.ts`, `store/fs-store.ts` | Restate the `@lagrangefoundry` scope literal in prose — violates AC-960 | **critical (C1)** |
| — | No leftover debug code, commented-out blocks, TODO stubs, `_v2` files or duplicated helpers in the changed set | none |

## Checklist Compliance

No `architecture_checklist`, `security_checklist` or `design_checklist` report exists (all
three queries returned `{"items": []}`). Sections omitted per instructions.

Against the standing policies in the session context, the security invariant (DOC-2) is
intact: nothing here opens a raw-CSS/HTML hole, the `/api/palette` op vocabulary is closed
and validated server-side, palette values go through the L1 zod schema before any write,
and no new behavior module was authored — the colour work lands as L1 axes and CLI/API
verbs, which is where CLAUDE.md puts it.

## Smoke Test

| Entry point | Result |
|-------------|--------|
| `vitest run --project node` (full) | **run** — the decisive evidence; 5 real failures above |
| `vitest run --project workers` | **crashes at startup** — `listen EPERM`, sandbox restriction |
| `bin/build --help`, `bin/deploy --help`, `bin/smoke --help` | **not run** — session permission layer denies direct script execution. Not evidence either way; the scripts do have UATs (`test_UAT_FC_REQ-144_deploy_scripts.test.ts`, `reconciliation-platform-build-deploy-smoke.test.ts`), which is stronger evidence and which did execute |

## Issues Found

**Critical (must fix)**:
- **C1** — `test_UAT_AC960` fails: three files new in this bundle restate the `@lagrangefoundry`
  scope outside its single declaration site.
- **C2** — `reconciliation-copy-edit-typography.test.ts` fails 2 tests: REQ-140 added a fifth
  field shape `'color'`; the suite still encodes the four-shape closed set and the old field list.
- **C3** — `reconciliation-builder-assistant-pane.test.ts` fails 2 tests on the `meta.ts` drift
  that was only half-swept last round.

**Warnings (should fix, systemic — NOT for this fix loop)**:
- **W1** — Nothing type-checks the test suite. No root `tsconfig.json`, and `tests/` is not a
  workspace package, so `pnpm -r build` never sees it and the gate reports
  `type-check skipped (JS-only project)`.
- **W2** — The quality evidence attached to this bundle still does not support its claim:
  `report-6decd207` records `"suites": {}` and 0 tests while reporting success.
- **W4** — The port-bound and workerd UATs this bundle adds have now gone three rounds without
  ever being observed passing by anyone. They need a run in an environment permitting `listen`.

## Fix-It Prompt

All three are fixable without touching production behaviour. **Before fixing, note the pattern
that has now recurred twice: the named file is rarely the only one. Grep the whole tree for each
defect class and fix every instance, not just the ones cited.**

1. **C1 — the scope literal.** `WEBUI_SCOPE = '@lagrangefoundry'` is declared once at
   `tools/generate/src/cli/webui.ts:138` and AC-960 forbids restating it anywhere else
   (comments included — see `bug32-webui-scope-rebrand.test.ts:195-210`).
   - `tests/reconciliation-platform-build-deploy-smoke.test.ts:455, :464, :469, :471, :475, :542, :558`
     — import `WEBUI_SCOPE` from `../tools/generate/src/cli` (the file already imports from
     there) and compose the specifiers as `` `${WEBUI_SCOPE}/${browser}` ``. This is what
     `bug32-webui-scope-rebrand.test.ts:30` itself does.
   - `tools/generate/src/cli/kb.ts:14, :389, :496` and `tools/generate/src/store/fs-store.ts:30`
     — these are prose. Reword to name the component without its scope
     (e.g. "the `knowledge` component", "`ticketing`'s `docs_store.js`"). Do **not** add an
     exclusion to the test to make it pass; the exclusion is the failure mode AC-960 exists to
     prevent, and the test says so at `:36-41`.
   - Then re-run `vitest run --project node tests/bug32-webui-scope-rebrand.test.ts` and confirm
     the `writers` list is empty.

2. **C2 — the fifth field shape.** REQ-140 legitimately widened the surface:
   `packages/site-schema/src/l1/edit.ts:187` now types `'string' | 'enum' | 'integer' | 'boolean' | 'color'`.
   The implementation is correct; the stale assertions are the defect. **Do not narrow the
   implementation back to four shapes.**
   - `tests/reconciliation-copy-edit-typography.test.ts:255` — add `'color'` to `CONTROL_SHAPES`.
   - `:333` — add `'color'` to the expected field list, in the position the surface actually
     emits it (between `'text'` and `'fontSizePx'`, per the received value).
   - AC-991's title and body still say *"four closed shapes"*. Update the AC text via
     `xgd ticket update` so the matrix matches the code — this is a reconciliation gap, and
     leaving it means the next reconcile re-derives the same contradiction.
   - Grep for other suites asserting the four-shape set or an exact copy-field list:
     `grep -rn "CONTROL_SHAPES\|'integer', 'boolean'" tests/`.

3. **C3 — the `meta.ts` drift.** Provenance was already established last round: the installed
   `webui-chat` writes `meta: { ts }`; nothing in this repo passes one. Apply the *same*
   remedy the last loop applied in `chat_panel.test.ts` — project to the fields under test
   rather than comparing whole records.
   - `tests/reconciliation-builder-assistant-pane.test.ts:332` and `:405`.
   - Record the reason in-file, as the last fix did. Do not delete the assertions.
   - **Sweep**: `grep -rn "getMessages()" tests/` and check every whole-record comparison,
     so this does not surface a third time.

4. **Re-run and report honestly.** Run `vitest run --project node` — the *whole* project, not a
   `-k` filter and not a file list. It takes ~30 minutes in this sandbox because the port-bound
   suites each time out; that is expected and is not a failure to fix. Report the real
   pass/fail tally, and state explicitly which suites could not be exercised because the
   environment denies `listen`. A filtered run reported as a passing gate is what let all three
   of these through.

Do not attempt W1/W2/W4 — they are systemic, outside this bundle's diff, and belong with the
operator.
