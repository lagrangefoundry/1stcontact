---
uid: report-a496d4d7
id: REPORT-11668
type: report
title: 'Code Review: bundle-7ba3af93'
created_by: xgd
created_at: '2026-11-09T02:43:26.088113+00:00'
updated_at: '2026-11-09T02:43:26.088113+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: code_review
  subject_uid: bundle-7ba3af93
  overrides_audited: 3
  trust_boundary_overrides: 0
  anchor_uid: bundle-7ba3af93
---

# Code Review

**Result**: PASS

## Summary
The free-coded bundle (BUG-73 embedder resolver, BUG-75 capabilities bundle, REQ-215 carry, REQ-216 drive-the-page, REQ-218 stored pictures, REQ-223 public lead capture) is wired in, follows existing patterns, and passes the workflow quality gates. Three code_frozen overrides were audited against OVERRIDE-AUDIT.md; all pass. 3 overrides audited, 0 touched a trust boundary.

## Quality Gates
Workflow quality report (2026-11-09T02:27:03Z): lint success, build success, preflight pass, overall success. Local re-run could not reproduce: (a) bare `xgd quality run` now requires a scope; (b) `xgd quality run --paths` fails with `VitestPlugin.run_tests() got an unexpected keyword argument 'test_paths'` (an xgd bug, not a project bug); (c) `--stories` ran but Workers-pool tests failed because the sandbox refuses local port binding (`listen EPERM 127.0.0.1`). Of the node-pool failures seen locally, `test_UAT_FC_REQ-146_every_error_path_out_of_the_router_is_scrubbed` is confirmed to fail on `main` too: its match, `refuseNonOwner(..., error: string)`, is at main:apps/control-app/src/router.ts:1193, and this bundle's router diff does not add it. AC2239 and AC2105 are on files this bundle does not change; not confirmed on main.

## External Interface Accessibility
Yes. public-site lead endpoint: apps/public-site/src/index.ts:9,104 (`handleLead` at LEAD_PATH). Control-app lead: worker.ts:3 imports `captureLead`. Embedder resolver is used by router.ts:39, knowledge.ts:15, session-knowledge.ts:18, system-knowledge.ts:12. REQ-218 image library is merged into the session fidelity deps at router.ts:~338 (`mergeImageLibraries({site, library})`).

## Code Quality
| File | Finding | Severity |
|------|---------|----------|
| apps/public-site/src/lead.ts:252-285 | Bounded reader loop: running byte count, cancel + 413 past MAX_BODY_BYTES, bytes-then-TextDecoder decode kept; comment now matches the code. | OK |
| tools/generate/src/cli/picture.ts:162 | `readonly code = 'ENVIRONMENT'` follows the existing `PageInteractionError.code` convention (interact.ts:60), which the Toolbox already renders as `failed (CODE)`; the in-loop concern (report-8f82e191) about a second code path does not hold. | OK |
| tools/generate/src/cli/image-library.ts:154-158 | mergeImageLibraries now drops `undefined` parts so `holds` is accurate; a part that is not passed is skipped instead of throwing at list(). Small, justified behaviour change. | Info |
| tools/generate/src/cli/capture/interact.ts:276-293 | Two-pass option choice; the landed check is reduced to `selectedIndex===chosen`, which matches the chosen option. | OK |
No debug code, TODO stubs or commented-out blocks found in the reviewed files.

## Checklist Compliance
No architecture, security or design checklist reports exist; section skipped.

## Mode Override Audit
3 overrides audited, 0 touched a trust boundary.
| Report | Rule | Batch | Item 1 named files | Item 2 deps green | Item 3 intent/AC | Item 4 scope | Item 5 trust boundary | Item 6 code_frozen | Verdict |
|---|---|---|---|---|---|---|---|---|---|
| report-0fca9951 (record report-edd5b890) | code_frozen | 0 | pass (unnamed empty) | pass (workflow quality check) | pass: REQ-223 s6 body capped while read (AC-2509); EPIC-1 2026-09-11 caption (AC-2486) | pass: multipart and suppression untouched | pass (not touched) | pass: rung 1, only named files edited | PASS |
| report-15fed5d0 | code_frozen | 1 | pass | pass | pass: REQ-218 no-Library wording, ENVIRONMENT refusal (AC-2487) | pass: fidelity-core/host-core not edited; Worker sentence unchanged (AC2484) | pass | pass | PASS |
| report-b31905da | code_frozen | 1 | pass | pass | pass: REQ-216 no selector/id/name; words before value (AC-2479) | pass: interact.ts only | pass | pass | PASS |
No blocked_by_handoff (superseded) or aligned_to_tip reports were injected.

## Smoke Test
Entry points: public-site POST lead endpoint, control-app fidelity `screenshot` of kind `image`. Not invoked locally: the sandbox blocks local port binding, which wrangler/miniflare need. They are covered by the Workers UATs in the workflow quality run (test_reconciliation_public_lead_capture, test_UAT_FC_REQ-223_lead_endpoint).

## Issues Found
**Critical (must fix)**:
- None.

**Warnings (should fix)**:
- `test_UAT_FC_REQ-146_every_error_path_out_of_the_router_is_scrubbed` is red on main (router.ts:1193 `error: string` matches the structural regex). It predates this bundle and is not a finding against it.
- `xgd quality run --paths` is broken for the vitest plugin (unexpected kwarg `test_paths`). This is a bug in xgd itself.
