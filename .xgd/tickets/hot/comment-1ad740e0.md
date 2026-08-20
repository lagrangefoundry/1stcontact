---
uid: comment-1ad740e0
id: COMMENT-1287
type: comment
title: Claude response for uat_coverage_check report
created_by: xgd
created_at: '2026-08-20T10:40:48.589465+00:00'
updated_at: '2026-08-20T10:40:48.589465+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-dcb63f31
  kind: note
---

Reassessment complete. **REPORT-2417 (`report-dcb63f31`) — PASS**, 0 violations, 0 warnings, 0 needs_review. Capability `uat_coverage: pass`.

## What happened between invocations

A fix loop ran at 10:28 (REPORT-2416, commit `5a571a753`) and closed both violations I raised at 10:10. I re-verified each rather than accepting the claim.

**AC-1343** — `test_UAT_AC1343_deliberately_legal_compositions_are_not_rejected` now drives real `validateSite` over the unbound seam, the mixed two-seam case (proving the rule is per-seam, not per-page), and the empty starter. Asserts `errors` is `[]` by name, so a failure says which over-tightening caused it.

**AC-1344** — five new tests. The important one, `conformance_discriminates_in_both_shipping_shapes`, calls the **real `assertModuleConforms`** twice over a deliberately-throwing catalog entry, standalone and `mountInL1`, comparing the reported *AC set* rather than pass/fail — so a mounted run that quietly checked an easier obligation wouldn't slip through.

## The check I made a point of running

REPORT-2415 warned specifically against resolving these by editing the ACs down to what the tests already did. `xgd ticket history` shows the only change to AC-1344 is `uat_coverage: fail → pass` — the criterion prose is **byte-identical**. Same for AC-1343. Closed with tests, correctly.

## Execution

req93: **13 passed, 2 EPERM, 2 skipped**. The decisive detail is that AC-1344's headline claim now runs green *here* — the repair routes the discriminator through the `isolation` dimension with a core that throws during SSR, so it fails before `startServe` and needs neither socket nor browser. The arms that can't run fail loudly or skip via `it.runIf`; none passes silently. I also confirmed `extraCss` is genuinely honoured (`types.ts:65` → `harness.ts:198` → `render.ts:256`), so the skipped mounted-defect arm isn't vacuous.

**No regression**: the production change only extracts `conformanceL1HostDocument()` and re-exports it — no logic change. Re-running the conformance-dependent surface gave 19 passed / 2 EPERM, identical to pre-fix; the req39 failure is the same socket timeout.

## Two things that outlive this capability

Both are environment/tooling, not matrix defects, and neither blocks the pass:

- **AC-703, AC-888 and one AC-1344 arm cannot execute in a sandboxed worktree** — `listen EPERM` from `tools/generate/src/cli/serve.ts:54`. Fourth consecutive cycle. If these need to be provable in CI sandboxes, the loopback-serve dependency is the thing to address.
- **`.xgd/uat_index.json` is still empty** (`{"acs": {}}`). Followed literally, Step 1b would report 103 fabricated `uat-add` gaps; I hand-scanned `tests/` instead, as did the prior cycle. Worth a tooling ticket.
