---
uid: report-76bee997
id: REPORT-7209
type: report
title: 'Override conformance: batch 0'
created_by: xgd
created_at: '2026-11-01T02:11:02.073749+00:00'
updated_at: '2026-11-01T02:11:02.073749+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: override_conformance
  subject_uid: STORY-159
  mode_override_uid: report-4a2f1de4
  parent_report_uid: report-2db26efc
  batch_index: 0
  attempt: 0
  findings: []
---

# Override conformance

- Item 1 (named files only): PASS. files_touched = [apps/control-app/src/router.ts], unnamed_files_touched is empty, and router.ts is the one file the override names. `git diff 06095b4cfb HEAD` outside .xgd changes only this file (+20/-1).
- Item 3 (consistent with intent/AC): PASS. The batch wires adoptCapture into the fidelity surface so a finished bundle becomes a findable reference ticket, as REQ-166 asks and AC-2080 tests (reference.adopted === true, member set equal to the bundle's list).
- Item 4 (within the planner's stated scope): PASS. The diff does exactly what the planner instructions say: sessionFidelity takes `tickets` from its one call site; `adopt(bundle)` calls adoptCapture(tickets, references.bundle(bundle), {}, {index, describeImage}) with the same seams /api/material uses (router.ts:771-772); the indexer is resolved per adoption; `adopt` is passed after the launch options; no clientDomain is passed (REQ-474 is out of scope); shot.ts, fidelity-core.ts, capture-material.ts, the test and the AC are untouched.
- Item 5 (trust boundary): PASS. trust_boundary_touched is false and trust_boundary_mismatch is false.
- Item 6 (code_frozen, rung 2): PASS. The reference state at reconcile-src-BUNDLE-34:apps/control-app/src/router.ts:596-647 builds the same per-adoption `adopt` closure and passes it to fidelityDeps after the launch options. The batch adds a strict subset of that: no clientDomain/clientSiteHosts (REQ-474), no `scope` argument to the indexer (that indexer signature does not exist in this tree), no lowDetail or REQ-218 merges. It adds no new branch, error handling or API beyond what AC-2080 needs.

Note (not a finding): the new comment paraphrases the reference's comment about per-adoption resolution. It describes the prescribed behaviour, and no reference code beyond the planner-specified call shape was carried over.

1 override audited, 0 touched a trust boundary.