---
uid: report-8d8842b6
id: REPORT-437
type: report
title: 'Code Review: bundle-df065afc (REQ-45/39/40/46/47/48)'
created_by: xgd
created_at: '2026-07-10T02:29:37.773347+00:00'
updated_at: '2026-07-10T02:29:37.773347+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: code_review
  subject_uid: bundle-df065afc
  anchor_uid: bundle-df065afc
---

# Code Review — bundle-df065afc

**Result**: PASS

## Summary
Implementation quality across all six tickets (REQ-45/39/40/46/47/48) is high: every capability lands as a generalization of an existing module (no new modules, per CLAUDE.md), token-backed with `.strict()` preserved, and each new dial defaults to prior behaviour so omitting sites are unchanged. The REQ-46 content-safety boundary is a clean single-source definition (`packages/framework/src/modules/safety.ts`) mirroring the REQ-40 `SECURITY_PROBE`, wired into every raw `href`/`src`/`action`/`set:html` sink. The prior review (report-dcb274b8) FAILED on one bundle-caused regression (`test_UAT_AC425`); that has been fixed (report-7cd2ed11) and verified green. The only remaining full-suite red — `test_UAT_AC424` — is confirmed **pre-existing** and not attributable to this bundle.

## Quality Gates
- **Lint**: success (0 errors, 0 warnings) — report-1518e945 / report-0e2e0f11.
- **Build**: success — report-1518e945.
- **Preflight**: pass.
- **Tests (reconcile filtered gate)**: pass — javascript-vitest 96/96, 457 deselected (report-1518e945).
- **Tests (full suite `vitest run`, executed during this review)**: **552 passed | 1 failed (553)**. Duration ~24s.

### The single full-suite failure — pre-existing, NOT bundle-caused (non-blocking)
`tests/reconciliation-platform-scaffold.test.ts > test_UAT_AC424_identifiers_normalized_to_1stcontact` fails at line 254: `expect(existsSync('sites/1stcontact')).toBe(true)`. Verified pre-existing and out of scope for this bundle:
- The `sites/` directory does not exist on `main` either (`git ls-tree main -- sites/` is empty) — the test fails identically on `main`.
- The test file is **untouched** by this bundle (`git diff main..HEAD -- tests/reconciliation-platform-scaffold.test.ts` is empty; file predates the bundle on `main`).
- The bundle touches nothing under `sites/`, worker configs, or platform scaffold — only `packages/framework`, `tools/generate`, `storage/sites/gigabytealchemy`, and tests.
- No code change within this fidelity/conformance bundle can create `sites/1stcontact`; it belongs to the 1stcontact platform-scaffold work, tracked separately.
This matches the prior reviewer's own assessment of AC424. The prior blocker (AC425, a stale-fixture deep-equal against REQ-45's new `tracking` `.default()` group) is now GREEN.

## External Interface Accessibility
All new surfaces wired in — no dead modules:
- **REQ-46 safety** exported from `packages/framework/src/index.ts`: `ContentSafetyError`, `isUnsafeUrl`, `assertSafeUrl`, `assertSafeHtml`; re-exported (with `renderMarkdown`) via `tools/generate/src/index.ts`.
- **Boundary applied at every sink**: `markdown.ts` (`assertSafeHtml` before `set:html`), `nav.ts` (`assertSafeUrl` on `kind:'url'` targets), and the raw href/src/action sinks in hero / services-grid / contact-form / header / footer.
- **REQ-39/40 conformance harness** exported from `tools/generate/src/conformance/index.ts` (`assertModuleConforms`, `serveOneModulePage`, security/safety probes, payload builders) and surfaced via the package index.
- **REQ-48 CLI**: `1c values-diff` gains `--ignore <regex,…>` and `--compare-years` (ignore-masks); help text updated and parsed in `cli/index.ts`.

## Code Quality
| File | Finding | Severity |
|------|---------|----------|
| packages/framework/src/modules/safety.ts | Clean single-source "unsafe" definition; scheme allowlist + dangerous-tag/handler/url-attr regexes mirror the harness probe; loud, field-naming errors | OK |
| packages/framework/src/modules/markdown.ts | Load-bearing "raw HTML is the validator's concern" comment correctly removed; renderer now owns rejection | OK |
| packages/framework/src/modules/{hero,services-grid,contact-form,header,footer}, nav.ts | Every URL/HTML sink wrapped; consistent with surrounding patterns | OK |
| REQ-45 dials (contentWidth/tracking/subheadLeading/submitForeground/subheadSize/captionSize) | Generalize existing modules; each defaults to prior behaviour; `tracking` typography group uses schema `.default()` to keep pre-existing themes valid | OK |
| tools/generate/src/cli/capture/*, values-diff.ts | Large but structured extension of the existing projection/severity pipeline; no new modules | OK |

No leftover debug code, commented-out blocks, or TODO stubs observed in the production changes. No parallel/v2 implementations — reuse-first respected.

## Smoke Test
- `node tools/generate/bin/1c.mjs --help` → exit 0; renders the values-diff section including the new REQ-48 `--ignore` / `--compare-years` flags.
- `vitest run tests/reconciliation-module-conformance-nobrowser.test.ts` → 1 passed (harness discriminates without a browser).

## Checklist Compliance
No architecture / security / design checklist reports exist for this anchor — sections skipped per the review contract.

## Issues Found
**Critical (must fix)**: none.

**Warnings (should fix)**:
- `test_UAT_AC424` fails in the full suite because `sites/1stcontact` is absent. Pre-existing and independent of this bundle (fails on `main` too); belongs to the 1stcontact platform-scaffold work. Recommend tracking as a separate item so the full-suite green line is restored, but it does not block promotion of this bundle.
- The reconcile regression gate runs a filtered evidence set (96/553); it did not execute AC424/AC425. The AC425 miss was caught only by a full-suite run. Consider widening the reconcile filter or adding a full-suite gate so schema-level `.default()` changes cannot slip a regression past the filter again.
