---
uid: report-bb5efb04
id: REPORT-12043
type: report
title: 'Override conformance: batch 1'
created_by: xgd
created_at: '2026-11-09T22:28:05.696516+00:00'
updated_at: '2026-11-09T22:28:05.696516+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: override_conformance
  subject_uid: story-58b2cec4
  findings: []
  mode_override_uid: report-c0389fea
  parent_report_uid: report-45273bd1
  batch_index: 1
  attempt: 0
---

# Override conformance

- Item 1: PASS — files_touched is only tools/generate/src/cli/capture/screenshot.ts, the named file; unnamed_files_touched is empty.
- Item 3: PASS — wrapping driver.screenshot (and the factory() lease) so it fails as the one bounded ImageNotRenderableError is what BUG-80 and AC-2565 case (c) demand; the decode refusal (size.ok false) is left unwrapped, keeping AC2485's wording, and the finally still closes every driver that was leased.
- Item 4: PASS — the diff does exactly what the planner instructions say (shot inside a wrapped region, lease through the same refusal, no double wrap of the decode refusal, only screenshot.ts edited); screenshotAndMeasure and the page-shot path are untouched.
- Item 5: PASS — trust_boundary_touched is false and trust_boundary_mismatch is false.
- Item 6: PASS — rung 1; only the named file is edited; every added line (the shared unrenderable helper, the lease wrap, the shot wrap, the BrowserDriver type import that the declaration needs) serves AC-2565's requirement that any browser failure on this path becomes a bounded refusal.

1 override audited, 0 touched a trust boundary.