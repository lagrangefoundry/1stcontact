---
uid: report-26f5747e
id: REPORT-1545
type: report
title: 'Code Review: bundle-15c1f647'
created_by: xgd
created_at: '2026-08-07T04:15:34.040025+00:00'
updated_at: '2026-08-07T04:15:34.040025+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: code_review
  subject_uid: bundle-15c1f647
  anchor_uid: bundle-15c1f647
---

# Code Review

**Result**: PASS

## Summary

Re-review after the fix loop that followed REPORT-1542's FAIL. Both criticals are genuinely fixed, and I verified each independently at the real entry point rather than accepting the fix report: with `playwright` unresolvable, `1c shot xgd --json` now exits **6** with the `ENVIRONMENT` envelope and the `pnpm install` hint, and the ungated verbs (`list`, `render`) still run to completion. All four warnings are addressed. The REQ-117 edit loop and REQ-115 builder shell remain well-factored — the shared-surface invariant (editor and AI are peers through `editCopyGet`/`editCopySet`) is structural, not asserted. Remaining findings are documentation nits and one hardening suggestion; none block.

## Quality Gates

| Gate | Result |
|---|---|
| Tests (`pnpm vitest run`, full suite, this review) | **PASS** — 172 files passed / 7 skipped; **1216 passed**, 55 skipped, **0 failed** |
| Build (`pnpm build`) | **PASS** — `tsc --noEmit` clean for control-app, public-site; placeholder builds for ui-kit/builder-ui |
| Typecheck (changed packages) | **PASS** — `tools/generate`, `packages/framework`, `packages/site-schema`, `apps/control-app` all exit 0 |
| Lint | **PASS** — 0 errors, 0 warnings (REPORT-1544) |
| Coverage | threshold 25% (`.xgd/config.yaml:75`); latest scoped quality report is `pass` |

Note, unchanged from the prior review: `report-9bb20c8a` (REPORT-1544) records `"suites": {}` — a scoped run that executed 0 tests. The test figures above are from a full suite run performed during this review.

**Skips (pre-existing, documented, not a gate failure):** 55 tests skip because `@gendevlabs/webui-*` is not installed in this worktree. This is the accepted cost of REQ-115 Deliverable 0 (`tests/support/webui-installed.ts`); the skips warn loudly rather than passing silently. It means the webui-mounting ACs — including the toolbar-leak fix's durable guard `..._open_in_new_tab_matches_the_iframe_exactly` — are unproven in this tree.

## Verification of the prior FAIL

**Critical 1 — preflight primary check unreachable. FIXED.**

The load-time coupling is gone: `tools/generate/src/cli/aligned-crops.ts` no longer statically imports `playwright`/`sharp` (now `loadPlaywright()`/`loadSharp()` at first use, line 139ff), and `tools/generate/src/cli/perceptual.ts:283-303` replaces module-scope `import sharp` with a cached `loadSharp()` acquired inside each of the five call sites. A repo-wide grep confirms the only remaining references are `import type` forms, which erase at compile time.

Verified live in this worktree, with a `Module._resolveFilename` + `registerHooks.resolve` shim hiding the packages on both resolution paths (nothing on disk modified):

| Invocation | Exit | Result |
|---|---|---|
| `1c shot xgd --json` (playwright hidden) | **6** | `{"ok":false,"error":{"code":"ENVIRONMENT",...}}`, names the package and `pnpm install` |
| `1c list` (playwright hidden) | **0** | ungated verb runs, output correct |
| `1c crop --json` (sharp hidden) | **6** | `ENVIRONMENT` envelope |
| `1c render xgd` (sharp hidden) | **0** | ungated verb runs |

Before the fix both gated and ungated verbs crashed at exit 1 with a raw `Cannot find module`.

**Critical 2 — no UAT drove the real entry point. FIXED.**

`tests/reconciliation-1c-install-preflight.test.ts` adds two UATs that spawn the real `tools/generate/bin/1c.mjs` as a subprocess:

- `test_UAT_AC1013_gate_is_reachable_when_the_package_is_genuinely_absent` (:267) — asserts exit 6, the command/package/remedy in the message, the *absence* of `Cannot find module` / `Cannot find package`, empty stdout (proving the refusal precedes any work), and that the ungated `list` still exits 0.
- `test_UAT_AC1016_real_binary_emits_the_envelope_on_a_genuinely_absent_package` (:438) — parses the `--json` envelope off the binary, using `sharp` so both gated dependencies are covered across the pair.

The staging (`HIDE_HOOK`, :135) correctly hides on **both** resolution paths — CJS `Module._resolveFilename` (what the preflight probes, so the gate fires) and ESM `registerHooks.resolve` (what the module graph uses, so the gate must be reachable). Hiding only the ESM side would be the weaker test that misses the defect entirely. This is the right test, and it is the one that would have caught the original bug.

Not mirroring these into `tests/req44-install-preflight.test.ts` is the correct call: that file uses `test_UAT_FC_REQ-44_*` names, and minting a new FC-named test on a reconcile branch would create an FC orphan for the Phase-2 gate.

**Warnings — all four addressed.**

| Prior warning | Status | Evidence |
|---|---|---|
| `editor.js:22` hardcoded `'data-fc-page'` | FIXED | `apps/control-app/src/builder/editor.js:31-33,56-57` — `L1_EDIT_PAGE_ATTR` threaded through the injected bridge |
| `toolbar.js` leaked panel subscriptions, no `destroy()` | FIXED | `toolbar.js:49-63` toolbar-owned `subscribe()`/`disposeActions()` scoped to the render; `:92-97` `destroy()`; called from `app.js:145` |
| `1c copy set` re-rendered only the edit channel | FIXED | `tools/generate/src/cli/index.ts` now renders both channels, matching `/api/copy` POST (`builder.ts:255-256`) |
| Stale comments `app.js:53-54`, `editor.js:219-220` | FIXED | `app.js:53-55` now describes the live edit loop; `editor.js:230-236` correctly explains `getValues()` vs `commit()` |

## External Interface Accessibility

All new entry points wired in and invoked live:

| Entry point | Wired? | Evidence |
|---|---|---|
| `1c copy get/set` | yes | parser + usage `cli/index.ts:329`; live invocation returns the `{ok:true,data}` envelope |
| `1c builder` | yes | parser `cli/index.ts:502`; origin starts and serves |
| `/api/copy` GET+POST | yes | `cli/builder.ts:205-260`; both probed live |
| `/api/sites`, `/api/publish` | yes | `cli/builder.ts:179-193`; `/api/sites` returns the store listing |
| `/framework/edit-client.js` | yes | `cli/builder.ts:291-311`; served type-stripped, consumed by `builder/main.js` |
| `/preview/<slug>/<channel>/` | yes | returns 200 for a real site |
| control-app proxy | yes | `apps/control-app/src/index.ts:27-49` |
| `assertInstall` preflight | **yes (was NO)** | reachable and firing — see above |

## Code Quality

| File | Finding | Severity |
|------|---------|----------|
| `tools/generate/src/cli/index.ts:330` | Usage text still reads "then re-render the edit channel"; the implementation now re-renders both channels | Nit |
| `apps/control-app/src/builder/api.js:70` | Same drift: "The origin re-renders the edit channel before it answers" | Nit |
| `tools/generate/src/cli/builder.ts:265,271` | `slug` from `/preview/<slug>/…` is decoded and passed to `distDir()` unsanitized. Verified non-exploitable — the mandatory `<channel>` segment (validated against `CHANNELS`) means any escape must land inside a directory literally named `draft`/`published`/`edit`; probes with encoded `../` returned 404. A slug allowlist would make the confinement structural rather than incidental | Warning (hardening) |
| `tools/generate/src/cli/builder.ts:344` | The chrome route answers 500 when `@gendevlabs/webui-*` is absent. The body is the correct designed diagnostic (names the component and the `bin/install` command, per REQ-115 AC1), but 500 reads as "the builder broke" for what is an environment gap — the same reasoning `builder.ts:333-341` applies to `CommandError`→400 | Nit |
| `packages/framework/src/modules/contact-form/index.astro:88` | `data-l1-slot="form"` emitted unconditionally, so an edit-channel marker leaks into published output. Inert, and consistent with `carousel/index.astro:77` | Nit |

No debug leftovers, commented-out blocks or TODO stubs in the changed sources — every `console.log` hit in `cli/index.ts` is the CLI's own reporting.

Positive notes: `packages/site-schema/src/l1/edit.ts` correctly makes the address contract one definition site shared by the emitter and the client, and `copyFieldsOf`'s `type: 'string'`-only descriptor is DOC-28 §3's exposure rule expressed as a type — there is no descriptor this module can emit whose control could produce raw HTML or CSS. `applyCopyFields` is whole-or-nothing and refuses unknown keys rather than dropping them. `editCopySet` validates the resulting definition on a `structuredClone` through the shared `validateSite` before writing, so an invalid edit cannot reach disk. The `min-width` floor in `l1/render.ts:1500-1560` is correctly gated on `nowrapFromPx` with a `width: auto` reset that keeps the rung ladder overriding — the reasoning for why the reset is load-bearing is recorded in the comment.

## Checklist Compliance

No architecture, security or design checklist reports exist for this project — all three queries returned `{"items": []}`. Sections omitted per the review contract.

## Smoke Test

Entry points invoked live in this worktree (nothing on disk modified):

- `1c help` → usage includes the new `copy` and `builder` sections. **OK**
- `1c copy get xgd home 0 --json` → `{"ok":true,"data":{...,"kind":"container","fields":[],"values":{}}}` — the documented empty-field-list answer. **OK**
- `1c copy get xgd home 99 --json` → `NOT_FOUND` envelope with `path` and `hint`. **OK**
- `1c builder --port 8791` → origin starts and listens. **OK**
- `GET /api/sites` → the four-site store listing. **OK**
- `GET /framework/edit-client.js` → type-stripped bridge source. **OK**
- `GET /api/copy?slug=xgd` (missing args) → 400 `slug, page and path are required`. **OK**
- `GET /api/copy?…&path=99.99` → 400 carrying the validator's own `code`/`path`/`hint`. **OK**
- `GET /preview/xgd/draft/` → 200. **OK**
- `GET /` → 500 with the `@gendevlabs/webui-shell is not installed` diagnostic naming `bin/install`. **Expected in this tree** — the documented Deliverable 0 gap, covered by `..._absent_component_names_the_install_command`, not a code defect.
- Preflight gate at the real binary, four invocations — see the table above. **OK**

## Issues Found

**Critical (must fix)**: none.

**Warnings (should fix)**:

- `builder.ts` `/preview/<slug>` — add a slug allowlist so path confinement is structural rather than resting on the mandatory channel segment.

**Nits (optional)**:

- Stale docs at `cli/index.ts:330` and `builder/api.js:70` — both still say the edit channel alone is re-rendered.
- Consider 503 rather than 500 for the absent-webui chrome response.
