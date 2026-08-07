---
uid: report-4e92fa49
id: REPORT-1543
type: report
title: Claude fix_review_free_coded report
created_by: xgd
created_at: '2026-08-07T04:09:16.658137+00:00'
updated_at: '2026-08-07T04:09:16.658137+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_review_free_coded
  subject_uid: bundle-15c1f647
---

All review issues are fixed and verified.

## Issues fixed

**Critical 1 — the preflight's primary check was unreachable**

The load-time coupling is gone. `sharp` and `playwright` now load on first use, following the `capture/playwright-driver.ts` pattern the review pointed at:

- `tools/generate/src/cli/perceptual.ts:298` — module-scope `import sharp` replaced by a cached `loadSharp()`; the five call sites (`decodeImage`, `decodeImageBytes`, `writeRasterPng`, `writeGrayPng`, `cmdCrop`) each acquire it inside their own async body.
- `tools/generate/src/cli/aligned-crops.ts:139` — same for both packages; `loadPlaywright()` returns the namespace (`typeof import('playwright')`), not `.default`, since playwright has no default export.

Verified live, not by inspection. With the packages unresolvable, `1c shot xgd --json` now exits **6** with `{"ok":false,"error":{"code":"ENVIRONMENT",…}}` and the `pnpm install` hint; `1c list` exits **0**. Before the change both crashed at exit 1 with a raw `Cannot find package`. On a healthy tree `1c shot` still launches the browser and writes the PNG.

**Critical 2 — no UAT drove the real entry point**

Two UATs added to `tests/reconciliation-1c-install-preflight.test.ts`, both spawning the real `bin/1c.mjs`:

- `test_UAT_AC1013_gate_is_reachable_when_the_package_is_genuinely_absent` — gated verb refuses (exit 6, names command/package/remedy, no `Cannot find module`), *and* the ungated `list` still runs.
- `test_UAT_AC1016_real_binary_emits_the_envelope_on_a_genuinely_absent_package` — the `--json` envelope off the binary, using `sharp` so both gated deps are covered.

The staging (`tests/reconciliation-1c-install-preflight.test.ts:135`) hides packages on **both** resolution paths — `Module._resolveFilename` (what the preflight probes, so the gate fires) and `registerHooks.resolve` (what the module graph uses, so the gate must be reachable). Hiding only the ESM side, as one might reach for first, is the weaker test that misses the defect entirely. Nothing on disk is mutated. Mutation-checked: reverting the two source files fails exactly these two tests.

I did **not** mirror them into `tests/req44-install-preflight.test.ts` — that file uses `test_UAT_FC_REQ-44_*` names, and adding a new FC-named test in a reconcile branch would mint an FC orphan for the Phase-2 gate to flag. The substantive requirement is met by the AC-named pair.

**Warnings**

- `apps/control-app/src/builder/editor.js:20,55` — `'data-fc-page'` literal replaced by `L1_EDIT_PAGE_ATTR`, threaded through the injected bridge (`main.js:4,27`) and the seven test injection sites.
- `apps/control-app/src/builder/toolbar.js:34` — actions now subscribe through a toolbar-owned `subscribe()` disposed on each re-render; `api.destroy()` added and called from `app.js:145`. Mutation-checked against a scratch jsdom harness: 11 re-renders left **12** live `src` subscribers before, **1** after, **0** post-destroy. The scratch file was removed — the durable guard is the existing `..._open_in_new_tab_matches_the_iframe_exactly`, which skips in this tree.
- `tools/generate/src/cli/index.ts:1051` — `1c copy set` now re-renders both channels, matching `/api/copy` POST; the human line and `renderedDraft` in the payload report both.
- Stale comments corrected at `app.js:53` and `editor.js:219`.

## Gates

| Gate | Result |
|---|---|
| Tests (`pnpm vitest run`) | **PASS** — 172 files passed / 7 skipped; **1216 passed**, 55 skipped, **0 failed** (+2 = the new UATs) |
| Build (`pnpm build`) | **PASS** |
| Typecheck | **PASS** — `tools/generate`, `apps/control-app`, `packages/framework`, `packages/site-schema` all exit 0 |

## Confidence

High on both criticals — each is verified at the real entry point and mutation-checked, which is precisely the standard the review failed the work against.

One caveat I can't close from here: the 55 skips are unchanged, so the toolbar and editor warning fixes are exercised by the full suites only on a tree where `@gendevlabs/webui-*` is installed. I verified the toolbar change against a real `createDisplayPanel` (which is webui-free) and confirmed `editor.js` typechecks with all injection sites updated, but the webui-gated UATs covering them did not run here. That is the pre-existing REQ-115 Deliverable 0 cost the review already recorded, not something these fixes introduced.
