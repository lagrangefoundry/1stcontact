---
uid: comment-009bd3d8
id: COMMENT-8057
type: comment
title: Claude response for batch_fix_assessment report
created_by: xgd
created_at: '2026-11-09T02:15:10.944607+00:00'
updated_at: '2026-11-09T02:15:10.944607+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-14d98511
  kind: note
---

Nothing new needed fixing in this pass. The fix I made last time is already committed in `40ae57dd34`, so the working tree was clean when this pass started. Against the current HEAD, all 73 tests in the batch scope pass, including AC-2509 and AC-2486, across 8 files.

What is in HEAD:
- **Body cap (`apps/public-site/src/lead.ts`):** `readFields` reads the body chunk by chunk and counts bytes as they arrive. Once the count passes `MAX_BODY_BYTES` it cancels the stream and returns the existing 413. The declared-length check and the bytes-then-decode step are unchanged, and the comment describes the capped read.
- **AC-2509 test:** it sends a body with no declared length that never ends. It checks for a 413, that the stream was cancelled, and that no more than `MAX_BODY_BYTES` plus one chunk was read. Against the old code this test hung.
- **Drawing caption (`tools/generate/src/cli/picture.ts`):** `DRAWING_RASTER_NOTE` now says that letter widths and line breaks in the drawing are not evidence of how it looks on the site. The default-face and `measure_drawing` parts are kept, and the caption text in `fidelity-surface.json` matches.
- **AC-2486 test:** it checks that the SVG caption says this. The old caption failed it.

Multipart handling and bounce/complaint suppression are untouched. The ACs needed no update.

```yaml
## Assessment
status: fixed
commit: 40ae57dd34
files_changed:
  - apps/public-site/src/lead.ts
  - tools/generate/src/cli/picture.ts
  - tools/generate/src/cli/ai/fidelity-surface.json
  - tests/test_reconciliation_public_lead_capture.workers.test.ts
  - tests/reconciliation-assistant-sees-a-stored-picture.test.ts
red_evidence: "AC2486 failed on the missing 'letter widths and line breaks' caption; AC2509 hung on the never-ending stream under request.arrayBuffer()"
green_evidence: "8 files / 73 tests passed at HEAD, covering every AC in the batch scope"
upstream_changes: none
```