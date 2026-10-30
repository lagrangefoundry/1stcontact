---
uid: report-874771ba
id: REPORT-6932
type: report
title: 'Code Review: bundle-5607a08d'
created_by: xgd
created_at: '2026-10-30T21:51:17.266187+00:00'
updated_at: '2026-10-30T21:51:17.266187+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: code_review
  subject_uid: bundle-5607a08d
  anchor_uid: bundle-5607a08d
  overrides_audited: 3
  trust_boundary_overrides: 2
  aligned_to_tip_audited: 1
---

# Code Review

**Result**: PASS

## Summary
BUNDLE-32 (BUG-45, BUG-44, BUG-47, REQ-157, REQ-176, REQ-174, BUG-49, REQ-177) is integrated and the latest scoped quality run is green at the commit currently checked out. Three code_frozen overrides and one aligned_to_tip ruling were audited against OVERRIDE-AUDIT.md and all pass. Since the ruling, every production change sits inside one of the granted overrides. The untrusted-content frame on the screenshot path is kept, and AC2067 tests assert it.

3 overrides audited, 2 touched a trust boundary.

## Quality Gates
Latest quality report report-9769f3a0 (commit cebfc7d5d6): lint success (0 errors, 0 warnings); build success (JS-only, type-check skipped); preflight pass; javascript-vitest 230 passed, 0 failed, 0 skipped. `git diff cebfc7d5d6 HEAD -- tools apps packages tests` is empty, so that report covers HEAD. Spot re-run here: `tests/reconciliation-assistant-looking-surface.test.ts -t AC2067|AC2031|AC2034` gave 4 passed. The REQ-174 suites could not run locally because the sandbox refuses local port binding (listen EPERM in startBuilder). That is the environment, not the code; the quality report covers them.

## External Interface Accessibility
The new entry points are wired in:
- `contentBlocksFrom` is called from the single tool-dispatch path at host-core.ts:525.
- `workerHost(..., fidelity)` (ai.ts:171,216) is fed per site by `sessionFidelity` in router.ts:149-150, which goes through `shot.ts` `fidelityDeps`.
- `nodeDeps` passes `junctions: lib.fileJunctions(...)` (host.ts:216).
- The fidelity surface is gated on `opts.origin`.
- `1c serve` is removed (REQ-177): `1c serve` reports `Unknown command`.

## Code Quality
| File | Finding | Severity |
|------|---------|----------|
| apps/control-app/src/router.ts:122-153 | `chatHost` memoises one host for the module's lifetime, and its `fidelity` closes over the `origin` from the FIRST request. A later request on a different origin (custom domain vs workers.dev) screenshots drafts against the first origin. | Warning |
| tools/generate/src/cli/ai/host-core.ts:525 | `contentBlocksFrom` runs on EVERY tool result, not only on image-returning operations. An untrusted text result (e.g. captured page text) that holds a JSON array of `{type:'image'}` blocks between its first `[` and last `]` would be lifted into a real image block. The frame is now kept, so the result is still marked untrusted, but restricting recovery to the operations declared to return images would be tighter. | Warning |
| tools/generate/src/cli/ai/fidelity-core.ts:150-179 | Clear, documented, bracket-based as instructed; handles leading and trailing text correctly in both block-type cases; unframed input is returned unchanged; refusals return null. | OK |
| tools/generate/src/cli/ai/host.ts:213-216 | Only the `junctions` line was ported, with an explanatory comment; no extra tip additions. | OK |

No debug code, no commented-out blocks, no TODO stubs and no `_v2` files in the override diffs. 328f474f91 was reverted by 4ea164bc3b with zero net production change.

## Checklist Compliance
No architecture_checklist, security_checklist or design_checklist reports exist, so those checks were skipped.

## Mode Override Audit
3 overrides audited, 2 touched a trust boundary.

### report-d58b23f8 (code_frozen, fidelity-core.ts; trust_boundary_touched=true) — PASS
1. `unnamed_files_touched` is empty; only fidelity-core.ts changed (commit 6e231519ed).
2. Quality pass at cebfc7d5 (230/0).
3. Consistent with REQ-157 ("a captured page's text must never be able to read as an instruction") and AC-2067.
4. Stays within the planner's scope: prepend/append rules exactly as instructed, doc comment updated, bracket scan kept, host-core.ts:525 untouched.
5. The frame is kept on every recovered path: leading text joins the first text block or becomes its own block, trailing text likewise, and parse-failure or non-image payloads fall back to the original framed text. Tests that assert it: `test_UAT_AC2067_a_screenshot_reaches_the_model_inside_the_untrusted_frame` and `test_UAT_AC2067_content_blocks_recovered_from_a_framed_rendering_keep_the_frame` (tests/reconciliation-assistant-looking-surface.test.ts:820,867), both passing here.
6. Rung 1; the behaviour is demanded by AC-2067.

### report-c89e2900 (code_frozen, host.ts + system-knowledge.ts; trust_boundary_touched=false) — PASS
1. `unnamed_files_touched` is empty. Production changes (commit ad89f57959): host.ts `logDir` → `junctions: lib.fileJunctions(...)`, and a comment-only edit in system-knowledge.ts.
2. Quality pass.
3. Consistent with REQ-174 and AC-2054..2057: `git grep -il caretaker` outside .xgd now finds only tools/generate/src/cli/ai/roles.ts.
4. Within scope. Only the junctions line was ported; cases, extraSurfaces, workerKnowledge and audit were not.
5. Not touched.
6. Production files touched ⊆ `files`.

Note (not a failure): tests/reconciliation-assistant-consultant-role.test.ts was also edited, and the override's `files` does not name it. It is a test file, outside code_frozen's scope. The edit lets `system` be a string or a list of text blocks and keeps the 'consultant' and no-legacy assertions. Conformance verdict: pass.

### report-be7d1be4 (code_frozen, host-core/fidelity-core/ai.ts/router.ts/shot.ts; planner_trust_boundary=true; conformance fields not recorded) — PASS
1. Commit 2a45c2722a touched ai.ts, router.ts, fidelity-core.ts and host-core.ts in production, all of them named. shot.ts was not changed; its existing `fidelityDeps` is consumed.
2. Quality pass.
3. Consistent with REQ-157 and AC-2031/2034/2025: image blocks reach the model, and the Worker composition root is shot.ts.
4. Within scope. No BUG-256 refusal tracking, adopt, lowDetail or REQ-218/208/219 code was ported. The `RouterDeps.launch` seam and the `BLOBS` null-gate are the minimum the instructed `deps.launch ? {launch} : {}` call needs.
5. The report has no computed `trust_boundary_touched`, so it is counted as touched (the planner declared true). This port FIRST DROPPED the untrusted frame, which was a regression; report-d58b23f8 fixed it. At HEAD the marking is kept and the AC2067 tests above assert it.
6. Rung: ports reference-state behaviour that AC-2031/2034/2025 demand.

### aligned_to_tip report-c8fd0348 (story-31204812, AC-2045..2050) — PASS
1. Every tip_evidence entry exists at `reconcile-src-BUNDLE-32` and is production code: bundle.ts:95-99 (readCapture throws on a missing capture.json), egress-guard.ts:228+, playwright-driver.ts:101-110, cf-driver.ts:231-232 and :280, fidelity-core.ts:245-253 and :309-357. Weakness: fidelity-core.ts:245-253 (the REQ-216 caption) is only loosely tied to the ruled ACs.
2. The other in-window intents (BUG-45, BUG-44, BUG-47, REQ-176, REQ-174, BUG-49, REQ-177) say nothing about capture egress, redirect caps or readCapture, so none requires the retired behaviour. The erratum comment exists on REQ-157 (comment-989911e3).
3. All six ACs were rewritten and are `active`; none was deleted. Production commits since the ruling: ad89f57959 (c89e2900 grant), 6e231519ed (d58b23f8 grant), and 328f474f91 + 4ea164bc3b, which net to zero. The ruling itself edited no production code.

Unease, recorded here and not as a failure:
- (a) AC-2048 now states the redirect-hop guard applies on the Worker host only. A model-chosen URL on the Node host can therefore be redirected into private address space without the hop being checked. That is an SSRF gap against REQ-157's "refused for private address space"; the out-of-window BUG-127 at the tip addresses it.
- (b) AC-2049/2050 say a capture that trips a cap still returns a reference, which reads against REQ-157's "capture_site is refused for ... over-large responses and redirect loops".
- (c) AC-2049 encodes counting distinct origins as the redirect cap, the defect BUG-127 later fixes.
- (d) The bundle's `reconcile_error` records that this ruling's plan was once rejected ("no failing test ... belongs to acceptance_criterion-2b82c3cf"); the ruling was recorded anyway.

Recommend a follow-up upgrade story to bring BUG-127 and the Node redirect guard into scope.

## Smoke Test
Entry points tested:
- `node tools/generate/bin/1c.mjs --help`: prints usage, exit OK.
- `1c serve`: `Unknown command: serve`, as REQ-177 intends.
- Chat/Worker routes are exercised by the passing worker suites in the quality report; they were not run here because the sandbox blocks local port binding.

## Issues Found
**Critical (must fix)**:
- None.

**Warnings (should fix)**:
- router.ts:122-153: the memoised chat host keeps the first request's origin for fidelity screenshots.
- host-core.ts:525: content-block recovery applies to every tool result; limit it to the operations declared to return images.
- REQ-157 capture egress: the Node host has no redirect-hop guard and a capture that trips a cap is not refused (both accepted by the aligned_to_tip ruling). Track as an upgrade (BUG-127).
