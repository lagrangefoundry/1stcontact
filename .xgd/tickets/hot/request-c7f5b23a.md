---
uid: request-c7f5b23a
id: REQ-39
type: request
title: 'Conformance harness core: assertModuleConforms + one-module isolation + fast
  safety checks + negative-fixture self-tests (Chromium)'
created_by: xgd
created_at: '2026-07-03T23:16:47.175283+00:00'
updated_at: '2026-07-10T02:31:56.262282+00:00'
completed_at: '2026-07-10T02:31:56.262282+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  priority: high
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: 0a3e029ca8214f874f669ef83be23e673efb84bb
    reconcile_sha: null
    main_sha: null
  version: 0.0.43
  bundled_in: bundle-df065afc
---

## Goal

Build the **conformance harness core** — the `assertModuleConforms()` seam, the one-module isolation/render model, the **fast safety checks** (Chromium), and the **negative-fixture self-test suite** that proves the harness actually discriminates. This is the foundation every other conformance component depends on, and the discriminator that must be proven *before* any per-module leaf is allowed to delegate to it. Architecture: [[DOC-20]].

## Why first

Per [[DOC-20]] "Who tests the harness": if module leaves delegate to a buggy harness, 4×M leaves become rubber-stamps — the model-grading-its-own-homework failure mechanized at scale. So the harness's *own* correctness (via negative fixtures) is the gating deliverable, not an afterthought.

## Scope / behaviour

`assertModuleConforms(slug, fixtures, opts)` — the single call every thin leaf makes (interface below in [[DOC-20]]). Throws (fails the UAT) on any non-excepted violation.
- **Isolation model:** render a *one-module page* through the existing catalog-driven renderer, serve it over loopback (the same seam as `1c shot` / `values-diff`, [[REQ-13]]), drive with Playwright (already a dep).
- **`tier: 'fast'` (default), Chromium only.** Viewports default to a small set (e.g. desktop + one mobile).
- **Safety dimension checks:** no console/page errors, no unhandled rejections, no failed requests; `scrollWidth ≤ viewport.width` (no horizontal overflow); no expected-content container collapsed to 0; text not clipped.
- **`except` option:** an AC id list a fixture legitimately opts out of (declared + reasoned) — the exemption mechanism.
- **Negative-fixture self-tests:** deliberately-broken fixture modules the harness **MUST** flag red, plus a clean one it must pass. This is the proof-of-discrimination.
- Determinism: wait for fonts + network-idle, freeze animation (`prefers-reduced-motion`), before asserting.

## Dependencies
[[REQ-13]] (`1c shot` render+serve+screenshot seam), catalog-driven renderer ([[REQ-9]]). Playwright + sharp already declared.

## UATs (`test_UAT_FC_<TICKET-ID>_*`)
- `_clean_module_passes` — a well-formed fixture passes with no violations (no false positive).
- `_overflow_fixture_flagged` — a module that overflows horizontally is flagged red.
- `_console_error_fixture_flagged` — a module that throws a console/page error is flagged red.
- `_collapsed_container_flagged` — a module whose expected-content band collapses to 0 height is flagged red.
- `_except_suppresses_declared_ac` — a fixture that declares an exemption for an AC is not failed on that AC.
- `_isolation_renders_single_module` — the harness mounts exactly one module through the catalog renderer and serves it over loopback.

## Out of scope
Security fuzzing, responsive viewport axis, cross-browser engines, the module-contract template/stamp — each its own component REQ.

## Notes
Framework/test-infra **code** → full free-coding ceremony. The negative fixtures are test-infrastructure (Philosophy story-type), not shipping modules.

## Design decisions (session, REQ-39)

Confirmed with operator before coding:

1. **Console/page-error capture → extend the `BrowserDriver` seam.** The seam currently exposes `navigate/screenshot/query/responses/content` but records no console errors, `pageerror`, or unhandled rejections. Add capture of these events during `navigate()` so the CF-swap abstraction stays intact (nothing above the seam holds a raw Playwright page). `responses()` statuses already cover 'no failed requests'.

2. **One-module isolation → on-disk one-module site in a dedicated, isolated temp sandbox** (chosen for debuggability on failure). The harness `mkdtemp`s its **own** store root under the OS temp dir — never `storage/` and never the real `storage/sandbox/` — scaffolds a one-module site there, and drives the existing `cmdRender` + `startServe` seam against it via the `cwd` store context. `cli/fidelity.ts` (values-diff) is the structural template.

3. **CRITICAL — no site-data pollution.** Because the harness renders/serves only under its own `mkdtemp` root, it is structurally impossible to write into a real site. Lifecycle: **clean up the temp root on success; preserve it on failure** and log its path + the served HTML path so the exact page an assertion saw can be reopened.

## Design decision 3 (session, REQ-39) — where the harness lives + the resolver seam

- **Location:** harness lives in `tools/generate/src/conformance/`, NOT `packages/framework` (DOC-20 said 'e.g. framework/…' — illustrative). The render/serve/driver seams it composes all live in `tools/generate`, which depends on `packages/framework`, not the reverse; putting the harness in framework would invert that dependency.
- **Injectable module resolver:** the negative broken modules must render through the *same* catalog renderer (DOC-20), but they are not in the shipping registry and a console/page error cannot be provoked through content props on a real static module. So `renderSite` gains an optional `resolveModule` (default = framework `getModule`) + `extraCss`; the harness self-tests inject a tiny test-only registry of deliberately-broken `.astro` modules. Additive, default-unchanged — a generalization of the renderer, not a new module.
- **Viewport plumbing:** `BrowserDriver.navigate(url, viewport?)` gains an optional viewport (fast tier runs safety checks at desktop + one mobile, per scope) and a `diagnostics()` accessor (console errors / page errors / failed requests captured during load). Existing driver fakes updated for the new method.