---
uid: report-b500e766
id: REPORT-3129
type: report
title: 'Code Review: bundle-8eef3846'
created_by: xgd
created_at: '2026-08-31T23:51:40.380819+00:00'
updated_at: '2026-08-31T23:51:40.380819+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: code_review
  subject_uid: bundle-8eef3846
  anchor_uid: bundle-8eef3846
---

# Code Review

**Result**: PASS

## Summary

Two free-coded commits: `92c6465d56` (BUG-39 — collapse four hand-maintained pre-streaming model doubles into one shared streaming double) and `08bfb7de4f` (REQ-154 — a Browser Rendering `BrowserDriver` behind the existing seam). Both land as described: the code is well-structured, matches the surrounding driver/deps-injection patterns exactly, introduces no parallel implementations, and every claim in the anchor ticket that I could execute in this environment checks out. The reservations below are about *verification coverage in this worktree*, not about the code.

## Quality Gates

Latest quality report: `report-d6e0da9e` (REPORT-3126, commit `7ea2a93ab0`).

| Gate | Reported | Verified independently |
|------|----------|------------------------|
| Lint | success — 0 errors, 0 warnings | — |
| Build | success | **skipped by the harness**: `"No tsconfig.json — type-check skipped (JS-only project)"` |
| Tests | `suites: {}` — **0 tests executed** | ran targeted suites myself (below) |
| Overall | success | — |

No gate reports a failure, so the gate condition is met. But it is met **vacuously** — the harness ran no tests and no type-check, so I re-ran the affected suites directly.

### Suites I ran and that pass

| Suite | Result |
|-------|--------|
| `test_UAT_FC_REQ-154_no_playwright_in_the_worker.test.ts` | pass |
| `test_UAT_FC_REQ-154_page_scripts.test.ts` | pass |
| `reconciliation-cloud-browser-capture-preconditions.test.ts` | pass |
| (the three above, combined) | 20 passed, 2 skipped |
| `shot.test.ts` + `req61-ladder-screenshots.test.ts` | 4 passed, 10 skipped |

### Suites blocked by the sandbox, not by defects

Every remaining suite fails on `Error: listen EPERM: operation not permitted` — this review sandbox forbids binding a socket. Two groups:

- **workerd suites** (`*.workers.test.ts`) — miniflare cannot boot; the runner dies before any test executes. This covers `test_UAT_FC_REQ-154_cloud_eyes`, `reconciliation-cloud-browser-capture`, `reconciliation-cloud-browser-capture-absent`, `reconciliation-self-origin-capture`.
- **Node suites that start a server** — `startBuilder` (`tools/generate/src/cli/builder.ts:363`) or `serveDir`: REQ-122, REQ-127, REQ-131, `BUG-39_model_double_contract`, `reconciliation-assistant-conversation*`, `reconciliation-draft-change-journal`, `req36-capture-settle`, `capture.test.ts`.

The stack traces are uniformly `net.Server.listen` → EPERM, never an assertion. This is an environment limitation of the review sandbox and is **not** counted against the change; it is recorded so the next reader knows AC3 and AC6 were verified by reading the UATs rather than by executing them.

### Type-check

`npx tsc --noEmit` in both `apps/control-app` and `tools/generate` reports exactly one error, and it is pre-existing and environmental:

```
src/ai.ts(33,24): error TS7016: Could not find a declaration file for module './generated/ai-workers.js'
```

That import is unchanged from `main` (`git show main:apps/control-app/src/ai.ts` line 33 is identical). `tools/generate/src/cli/assets.ts:170` emits `generated/ai-workers.d.ts`, and this worktree has `ai-workers.js` + `importmap.json` but no `.d.ts` — a partial `./bin/1c assets` run, which the anchor ticket itself flags as a fresh-worktree condition. Nothing in this bundle causes or worsens it.

## External Interface Accessibility

New entry points wired in: **yes**, with one deliberate deferral.

| Surface | Wired |
|---------|-------|
| `previewRenderer` | exported `apps/control-app/src/router.ts:114`, consumed by `shot.ts` and the workerd UAT — and it is the *same memoised* renderer the `/preview/*` route uses, which is the point |
| `previewOriginResolver` | `tools/generate/src/cli/preview.ts:196`, consumed by `shotPreview` (`shot.ts:118`) |
| `screenshotUrl` / `resolveViewport` / `VIEWPORTS` | `capture/screenshot.ts`, consumed by both `shot.ts` (Node CLI) and `apps/control-app/src/shot.ts` (Worker); re-exported from the capture barrel |
| `cf-driver` (`CfBrowserDriver`, `withBrowserSession`) | reached by deep path from `apps/control-app/src/shot.ts:19`; deliberately **not** in the barrel (barrel re-exports `playwright-driver`) |
| `page-scripts` | consumed by both drivers; single-source pinned by a UAT |
| `[browser]` binding | declared for default **and** `[env.production]` in `wrangler.toml`; `BROWSER?: Fetcher` on `RouterEnv` (`router.ts:172`) and `ShotEnv` (`shot.ts:33`) |
| `shotUrl` / `shotPreview` | exported and exercised by workerd UATs, but **no HTTP route calls them** — see warning 2 |

## Code Quality

| File | Finding | Severity |
|------|---------|----------|
| `tools/generate/src/cli/capture/cf-driver.ts` | Clean. One `request` listener doing both egress recording and the fulfil/continue decision is correct — with interception armed only one listener may resolve a request, and the comment says so. Resolver error → `500`, never `continue()`, which is the right failure direction. | none |
| `tools/generate/src/cli/capture/cf-driver.ts:174` | `requestedUrls` records *all* requests including in-process-fulfilled ones, so it is "requested", not strictly "egressed". Byte-for-byte the same semantics as `playwright-driver.ts:90`, so the conformance dimension sees a consistent signal across both drivers. Not a defect. | none |
| `tools/generate/src/cli/capture/cf-driver.ts:138` | `navigate()` overwrites `this.context` with no guard, so a second `navigate()` on one driver would strand the first context. The "one navigation per driver" invariant is documented but not enforced — and `playwright-driver.ts:60` has exactly the same shape. Consistent with the existing pattern, not introduced here. | info |
| `tools/generate/src/cli/capture/cf-driver.ts:345` | `withBrowserSession` — `finally` clears the timer and closes the browser on success, throw and timeout. The doc is honest that the race does not cancel `fn`, and explains why that is fine (closing the browser is what frees the resource). | none |
| `tools/generate/src/cli/capture/page-scripts.ts` | Extraction is faithful — `FONT_BARRIER` / `SETTLE_CSS` are byte-identical to the deleted originals; `SETTLE_SCROLL` / `IMAGES_DECODED` correctly rewritten from TS arrow functions to ES5-ish page-JS expressions, with the reason (two `evaluate` overloads that disagree on function types) written down. | none |
| `tools/generate/src/cli/capture/preview.ts` `previewOriginResolver` | Per-host ownership, `draft`/`edit` only, everything else `null` → 404. `published` excluded with a stated reason. | none |
| `apps/control-app/src/shot.ts` | Single composition root; the only file naming `@cloudflare/puppeteer`, pinned by a UAT. | none |
| `tools/generate/src/cli/shot.ts` | Viewport presets moved but re-exported, so every existing importer keeps its path; `resolveViewport` preserves the original unknown-viewport error message verbatim. | none |
| `tests/support/scripted-model-client.ts` | The wire contract is written down in the module header — the actual fix for BUG-39, since the defect was a drifted transcription. | none |
| `tests/support/fake-puppeteer.ts` | Legitimate boundary fake: it *drives* the driver (emits the navigation request through the driver's own interception handler, parses the fulfilled document for subresources, re-emits each against the real `baseURI`) rather than answering it. Everything on our side of the seam is real. | none |
| All changed test files | No `.skip`, `.todo` or `.only` introduced. The two previously-passing REQ-122 tests are genuinely strengthened — both now assert the scripted answer reached the stream, so neither can pass on the transport alone. | none |

No debug code, no commented-out blocks, no TODO stubs, no `_v2` files, no duplicated helpers. The BUG-39 commit is a net deletion of duplicated protocol, which is the correct direction.

### Not a finding: the palette UAT

`git diff main..HEAD` appears to delete `test_UAT_AC1458_renaming_an_entry_to_its_own_current_name_succeeds_as_a_no_op` and to revert `story-ee073693`. It does neither. `git log main..HEAD -- tests/reconciliation-palette-management.test.ts` is empty — no commit on this branch touches the file. Main-side commit `5078d6810d` ("test: cover palette self-rename no-op (AC-1458)") landed after this branch's merge-base `198f8ca0b9`. Pure merge-base artifact.

## Checklist Compliance

No architecture, security or design checklist reports exist for this project (`xgd ticket list --type report --filter fields.report_kind=<kind>` returns `items: []` for all three). Sections omitted.

Against the standing **Security Policy** (structured-only, validated by construction), the one security-relevant surface here is REQ-154's AC3, and the chosen mechanism strengthens rather than weakens it: the per-**host** ownership rule in `OriginResolver` makes reaching the Access-gated origin unreachable rather than merely unlikely, holds no credential, and answers a resolver error `500` instead of falling through to the network. `test_UAT_FC_REQ_154_no_request_to_our_host_ever_reaches_the_network` asserts exactly that, including the two same-host paths (`/favicon.ico`, `/builder/app.js`) a per-path rule would have leaked.

## Smoke Test

| Entry point | Result |
|-------------|--------|
| `./bin/1c shot` (no args) | `Missing required <slug> argument.` — clean argument validation, no stack trace |
| `1c shot` viewport resolution | covered by `shot.test.ts`, passing |
| `shotUrl` / `shotPreview` | not invocable from this sandbox (needs workerd); covered by workerd UATs |

No entry point crashes or stack-traces on basic invocation.

## Issues Found

**Critical (must fix)**: none.

**Warnings (should fix)**:

1. **The quality gate passed vacuously.** `report-d6e0da9e` records `suites: {}` (0 tests) and a build stage that skipped type-checking with `"No tsconfig.json — type-check skipped (JS-only project)"`. This is a TypeScript monorepo with `tsconfig.base.json` and per-package tsconfigs but no root `tsconfig.json`, so the harness misclassifies it as JS-only. The gate therefore proves nothing about this change on its own. This is an XGD harness-configuration issue, not a defect in the bundle, and I compensated by running the suites directly — but it will keep reporting green regardless of what lands until the harness is pointed at a tsconfig and a test command.

2. **`apps/control-app/src/shot.ts` is not reachable from the Worker's HTTP entry point.** No route calls `shotUrl` or `shotPreview`, so the capability is not user-reachable in this bundle. I am not failing on this: the deferral is explicit and reasoned in both the ticket and the code (a metered, concurrency-capped session exposed over HTTP is a rate-limiting and authorisation decision, assigned to REQ-157), none of REQ-154's six ACs asks for a route, the module is exercised end-to-end by workerd UATs against real D1/R2 and the real `PreviewRenderer`, and the binding is declared and dry-run verified. The accessibility check exists to catch *forgotten* wiring, and this is staged wiring. Recorded so REQ-157 is not closed without it.

3. **This worktree is missing `apps/control-app/src/generated/ai-workers.d.ts`.** `tools/generate/src/cli/assets.ts:170` emits it; only `ai-workers.js` and `importmap.json` are present, so `tsc --noEmit` reports TS7016. Pre-existing on `main` and unrelated to this bundle — run `./bin/1c assets` to clear it.
