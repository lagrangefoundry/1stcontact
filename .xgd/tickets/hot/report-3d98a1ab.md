---
uid: report-3d98a1ab
id: REPORT-11653
type: report
title: 'Override conformance: batch 0'
created_by: xgd
created_at: '2026-11-09T01:58:47.123807+00:00'
updated_at: '2026-11-09T01:58:47.123807+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: override_conformance
  subject_uid: report-0758e7c5
  findings: []
  mode_override_uid: report-0fca9951
  parent_report_uid: report-44dcbef8
  batch_index: 0
  attempt: 0
---

# Override conformance

Override report-0758e7c5 (code_frozen, rung 1, batch 0).

- Item 1: pass. `unnamed_files_touched` is empty, and every production file changed (lead.ts, picture.ts, fidelity-surface.json) is named in `files`.
- Item 3: pass. The lead.ts read loop counts bytes as they arrive and returns 413 once the count passes MAX_BODY_BYTES, as REQ-223 §6 requires ("a large body must be rejected rather than read", AC-2509). DRAWING_RASTER_NOTE and the copy in fidelity-surface.json now say letter widths and line breaks are not evidence, as the EPIC-1 2026-09-11 answer to REQ-218 requires (AC-2486). The default-face and measure_drawing parts are kept.
- Item 4: pass. The diff follows the planner's instructions: the declared-length precheck and the bytes-then-TextDecoder decode are kept, the comment is corrected, and multipart handling and bounce/complaint suppression are untouched.
- Item 5: pass. `trust_boundary_touched` is false and `trust_boundary_mismatch` is false.
- Item 6: pass. Rung 1. No file outside `files` is edited, and nothing is added that no intent in scope demands. The 400 on a failed read was in the code before this change.

Note, not a finding: when a read fails, the code returns 400 without cancelling the reader, while the 413 path does cancel it. This is harmless because the request is thrown away.

1 override audited, 0 touched a trust boundary.