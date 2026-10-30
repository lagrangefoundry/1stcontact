---
uid: report-63d2baa5
id: REPORT-6924
type: report
title: 'Override conformance: batch 0'
created_by: xgd
created_at: '2026-10-30T21:14:48.102995+00:00'
updated_at: '2026-10-30T21:14:48.102995+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: override_conformance
  subject_uid: report-00553335
  mode_override_uid: report-d58b23f8
  parent_report_uid: report-32f5ff75
  batch_index: 0
  attempt: 0
  findings: []
---

# Override conformance

- Item 1 (named files only): PASS. files_touched = [tools/generate/src/cli/ai/fidelity-core.ts], exactly the file the override names; unnamed_files_touched is empty.
- Item 3 (consistent with intent and AC): PASS. REQ-157 requires that a captured page's text never read as an instruction; AC-2067 requires that a picture from an untrusted-provenance operation reach the model inside the untrusted frame, opened before the image and closed after it. The change makes contentBlocksFrom carry the frame onto the recovered blocks, which is what both demand.
- Item 4 (within the stated scope): PASS. The diff changes only contentBlocksFrom's body and its doc comment, following the planner's instructions exactly: leading text is prepended to a first text block or becomes its own leading block; trailing text is appended to a last text block or becomes its own trailing block; an unframed rendering is unchanged; refusals still return null; the scan is still bracket-based. host-core.ts was not touched, as instructed.
- Item 5 (trust boundary): PASS. trust_boundary_touched=true, trust_boundary_mismatch=false (the planner declared the trust boundary). From the diff, the marking is preserved on every path: the framed text-first case, the framed non-text-first case, the trailing text and non-text cases, and the unframed case (no frame to keep). Tests that assert the marking: tests/reconciliation-assistant-looking-surface.test.ts test_UAT_AC2067_a_screenshot_reaches_the_model_inside_the_untrusted_frame (end-to-end through the real host: the backend receives the open marker before the image, the close marker after it, exactly one of each) and test_UAT_AC2067_content_blocks_recovered_from_a_framed_rendering_keep_the_frame (the real Toolbox rendering plus the image-first, unframed and refusal branches). Both pass in this worktree.
- Item 6 (code_frozen, rung 1): PASS. The only file edited is the one named in files. No behaviour was added beyond what AC-2067 and REQ-157 demand: no new API, no new error handling, and no branch outside frame carrying.

Not a finding: contentBlocksFrom is applied to every tool's rendered output in host-core.ts, not only to image-returning operations. Recovery still requires a JSON array of valid content blocks containing an image, so no current non-picture operation is affected. Narrowing it to operations declared to return images would be a stricter seam.

1 override audited, 1 touched a trust boundary.