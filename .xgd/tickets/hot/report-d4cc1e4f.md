---
uid: report-d4cc1e4f
id: REPORT-1542
type: report
title: 'Code Review: bundle-15c1f647'
created_by: xgd
created_at: '2026-08-07T03:56:02.937131+00:00'
updated_at: '2026-08-07T03:56:02.937131+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: code_review
  subject_uid: bundle-15c1f647
  anchor_uid: bundle-15c1f647
---

# Code Review

**Result**: FAIL

## Summary

The REQ-117 edit loop and the REQ-115 builder shell are strong work: well-factored, the shared-surface invariant (editor and AI are peers through `editCopyGet`/`editCopySet`) is real and structural, and the code reads consistently with its surroundings. The REQ-44 install preflight, however, does not work at the entry point. Its primary check — "unresolvable declared dependency" — can never run, because the CLI's module graph statically imports the very packages the check exists to detect the absence of. Verified empirically, not by inspection: with `playwright` unresolvable, `1c shot xgd --json` exits **1** with a raw `Cannot find module` crash — verbatim the failure REQ-44 was filed to replace. All 16 preflight UATs pass because every one of them injects a resolver and calls `assertInstall`/`checkInstall` directly, never the real entry point.

## Quality Gates

| Gate | Result |
|---|---|
| Tests (`pnpm vitest run`) | **PASS** — 172 files passed / 7 skipped; 1214 passed, 55 skipped, **0 failed** |
| Build (`pnpm build`) | **PASS** — `tsc --noEmit` clean for control-app, public-site |
| Typecheck (changed packages) | **PASS** — `tools/generate`, `packages/framework`, `packages/site-schema` all exit 0 |
| Lint | PASS (0 errors, 0 warnings per REPORT-1540) |
| Coverage | threshold 25% — not re-measured; latest scoped quality report is `pass` |

Note on the quality report: `report-8ab8792b` (REPORT-1540) records `"suites": {}` — a scoped run that executed 0 tests. The figures above are from a full suite run performed during this review, not from that report.

**Skips worth naming (not a gate failure, but a coverage gap in this worktree):** 26 of 31 tests in the chrome/composition/browser suites skip because the `@gendevlabs/webui-*` components are not installed here. This is the accepted, documented cost of REQ-115 Deliverable 0, and the skips warn loudly rather than pass silently — but it means AC959, AC967-AC976, AC1002 and the four `req117-edit-loop-browser` UATs are unproven in this tree.

## External Interface Accessibility

| Entry point | Wired? | Evidence |
|---|---|---|
| `1c copy get/set` | yes | parser `cli/index.ts:1010`, usage text present, exports at `cli/index.ts:18-19` |
| `1c builder` | yes | parser `cli/index.ts:497`, usage text present |
| `/api/copy` GET+POST | yes | `cli/builder.ts:205-260` |
| `/api/sites`, `/api/publish` | yes | `cli/builder.ts:179-193` |
| `/framework/edit-client.js` | yes | `cli/builder.ts:291-311`, consumed by `builder/main.js:3-4` |
| control-app proxy | yes | `apps/control-app/src/index.ts:27-49` |
| `assertInstall` preflight | **NO — unreachable for its primary check** | see Critical 1 |

## Code Quality

| File | Finding | Severity |
|------|---------|----------|
| `tools/generate/src/cli/index.ts:53-54` | Static imports of `./perceptual` and `./aligned-crops` make the whole CLI module graph depend on `sharp`/`playwright` at load time, defeating the preflight and breaking every command | **Critical** |
| `tests/req44-install-preflight.test.ts`, `tests/reconciliation-1c-install-preflight.test.ts` | All preflight UATs inject a resolver; none drive the real entry point with a genuinely absent dependency, so the defect above passes CI | **Critical** |
| `apps/control-app/src/builder/editor.js:22` | Hardcodes `'data-fc-page'` rather than using `L1_EDIT_PAGE_ATTR`, contradicting the one-definition-site contract the attribute module is built on | Warning |
| `apps/control-app/src/builder/toolbar.js:135, 60-61` | `panel.on(...)` subscriptions are never unsubscribed; `render()` re-creates actions on every mode/site change, accumulating listeners bound to detached nodes. Toolbar has no `destroy()`, and `app.js:141-147` never calls one | Warning |
| `tools/generate/src/cli/index.ts:1049` | `1c copy set` re-renders only the `edit` channel; `/api/copy` POST (`builder.ts:255-256`) re-renders both, with a comment explaining that one-channel rendering leaves View silently stale. The CLI path still has the bug the builder path fixed | Warning |
| `apps/control-app/src/builder/app.js:53-54` | Stale comment: "Edit is a registered stub ... the editing itself is REQ-117 (T3)". Editing now works | Nit |
| `apps/control-app/src/builder/editor.js:219-220` | Comment describes `commit()` flushing the buffer, but `commit()` is never called — only `getValues()` | Nit |
| `packages/framework/src/modules/contact-form/index.astro:88` | `data-l1-slot="form"` is emitted unconditionally, so an edit-channel marker leaks into published output. Consistent with `carousel/index.astro:77`, so noted rather than flagged | Nit |

Positive notes: `resolveStaticFile` (`cli/serve.ts:68`) correctly factors confinement so a traversal guard cannot be present on one tree and missing on another, and its `path.normalize` + `path.join` ordering means encoded `..` sequences clamp inside the root (verified by reasoning and by `..._static_trees_refuse_traversal`). `editCopySet` (`cli/edit.ts`) validates the whole resulting definition through the shared `validateSite` before writing, on a `structuredClone`, so an invalid edit cannot reach disk. The `min-width` floor in `l1/render.ts` is correctly gated on `nowrapFromPx` with a `width: auto` reset that keeps the rung ladder overriding.

## Checklist Compliance

No architecture, security or design checklist reports exist for this project — all three queries returned `{"items": []}`. Sections omitted per the review contract.

## Smoke Test

Entry points invoked live in this worktree:

- `1c help` -> prints usage including the new `copy` and `builder` sections. **OK**
- `1c page list xgd --json` -> `{"ok":true,"data":{"pages":[...]}}`. **OK**
- `1c copy get xgd home 0 --json` -> `{"ok":true,"data":{"target":{...},"kind":"container","fields":[],"values":{}}}` — the documented empty-field-list answer for a container. **OK**
- `1c shot xgd --json` (healthy tree) -> preflight passes, browser launches, PNG written. **OK**
- `1c shot xgd --json` **with `playwright` unresolvable** -> exit **1**, message `Cannot find module 'file:///.../playwright/index.mjs'`. No `ENVIRONMENT` code, no exit 6, no `{"ok":false,...}` envelope despite `--json`, no `pnpm install` hint. **FAIL**
- `1c list --json` **with `playwright` unresolvable** -> exit **1**, identical crash, even though `list` is an offline verb the ticket and the usage text both state is never gated. **FAIL**

Method for the last two: a Node `module.registerHooks` resolve hook that raises `ERR_MODULE_NOT_FOUND` for the resolved `playwright` path. Nothing in the repo or `node_modules` was modified.

## Issues Found

**Critical (must fix)**:

1. **The install preflight's primary check is unreachable.** `tools/generate/src/cli/index.ts:53-54` statically imports `./perceptual` and `./aligned-crops`. `perceptual.ts:22` does `import sharp from 'sharp'` and `aligned-crops.ts:20-21` does `import playwright from 'playwright'` / `import sharp from 'sharp'`, all at module scope. `bin/1c.mjs` loads the CLI via `server.ssrLoadModule('/tools/generate/src/cli/index.ts')`, so when either package is absent the module graph throws during load, the bin's `catch` prints `err.message` and sets `exitCode = 1`, and `assertInstall(command)` at `index.ts:382` is never reached. The consequence is exactly the state REQ-44 exists to prevent: the ticket asks for a check that "fails loudly with a clear 'run `pnpm install`' message rather than crashing mid-render inside Playwright or Vite", and the observed behaviour is the raw `Cannot find module 'playwright'` crash at exit 1. Only the second check (lockfile drift) works, because it runs in the case where every package still resolves. Collateral: the same coupling breaks the ungated offline verbs (`list`, `render`, `serve`, `builder`, ...) that `index.ts`'s usage text explicitly promises "are never gated".

2. **No UAT exercises the preflight through the real entry point.** Every test in `tests/req44-install-preflight.test.ts` and `tests/reconciliation-1c-install-preflight.test.ts` calls `assertInstall`/`checkInstall` directly with an injected `resolve`, against synthetic trees. That is a legitimate way to test the pure functions — and the ticket says so — but it means nothing tests that dispatch can reach them. Issue 1 is invisible to the entire suite as a result.

**Warnings (should fix)**:

- `editor.js:22` hardcodes `'data-fc-page'`, drifting from `L1_EDIT_PAGE_ATTR`. The bridge object is already injected at `main.js:27`; the attribute name can ride along with it.
- `toolbar.js` leaks panel subscriptions on every re-render and exposes no `destroy()`.
- `1c copy set` (`index.ts:1049`) re-renders only the edit channel, leaving the draft channel stale — the defect `/api/copy` was fixed for in commit `9fe83e746`.
- Stale comments at `app.js:53-54` and `editor.js:219-220`.

## Fix-It Prompt

Fix issue 1 by removing the load-time coupling, then prove it with a test that would have caught it.

1. **Make the heavy dependencies lazy.** In `tools/generate/src/cli/aligned-crops.ts`, delete the module-scope `import playwright from 'playwright'` and `import sharp from 'sharp'` (lines 20-21) and load them inside the function that uses them (`cmdAlignedCrops`, around line 180) with `const playwright = (await import('playwright')).default` / `const sharp = (await import('sharp')).default`. Do the same for `tools/generate/src/cli/perceptual.ts:22`. `capture/playwright-driver.ts:101` and `:340` already use exactly this dynamic-import pattern — follow it rather than inventing a new one. Keep `import type` forms where only types are needed; those erase at compile time and cost nothing.

2. **Verify the gate now fires.** After the change, `1c shot <slug> --json` with `playwright` unresolvable must produce the `ENVIRONMENT` envelope (`{"ok":false,"error":{"code":"ENVIRONMENT",...}}`) and exit **6**, with the hint naming `pnpm install`. `1c list --json` must succeed unchanged, since `list` loads neither package.

3. **Add the missing UAT** to `tests/reconciliation-1c-install-preflight.test.ts` (and mirror it in `tests/req44-install-preflight.test.ts`): drive the real entry point — `run([...])` from `tools/generate/src/cli/index.ts` — with a genuinely unresolvable dependency rather than an injected resolver, and assert (a) a gated verb refuses with `ENVIRONMENT` / exit 6 before doing any work, and (b) an ungated verb still runs to completion. Name it against the AC it proves (AC1013 covers "refuses before doing any work"; AC1016 covers "environment exit 6 and json envelope"). Both ACs are currently satisfied only at the function level, which is why they read as passing today.

4. While in the file, address the warnings above if cheap — in particular make `1c copy set` (`tools/generate/src/cli/index.ts:1049`) re-render both channels the way `/api/copy` POST does at `tools/generate/src/cli/builder.ts:255-256`, and replace the `'data-fc-page'` literal in `apps/control-app/src/builder/editor.js:22` with the injected `L1_EDIT_PAGE_ATTR`. Do not change the preflight's own logic: `checkInstall` and `assertInstall` in `tools/generate/src/cli/preflight.ts` are correct and well-tested. The defect is entirely in what the entry point loads before it can call them.
