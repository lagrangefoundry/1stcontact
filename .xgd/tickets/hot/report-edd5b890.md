---
uid: report-edd5b890
id: REPORT-11657
type: report
title: 'Report: mode_override for report-0758e7c5'
created_by: xgd
created_at: '2026-11-09T02:14:30.167650+00:00'
updated_at: '2026-11-09T02:14:30.167650+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: mode_override
  subject_uid: report-0758e7c5
  anchor_ticket: bundle-7ba3af93
  rule: code_frozen
  batch_index: 0
  parent_report_uid: report-44dcbef8
  quality_mode: reconcile
  justification: REQ-223 s6 and the EPIC-1 2026-09-11 REQ-218 answer, both in scope,
    require a body capped while it is read and a drawing caption warning that letter
    widths and line breaks are not evidence; the frozen code does neither, so the
    code is wrong and the tests are right.
  files:
  - apps/public-site/src/lead.ts
  - tools/generate/src/cli/picture.ts
  - tools/generate/src/cli/ai/fidelity-surface.json
  - tests/test_reconciliation_public_lead_capture.workers.test.ts
  - tests/reconciliation-assistant-sees-a-stored-picture.test.ts
  rung: 1
  tip_evidence:
  - file: apps/public-site/src/lead.ts
    lines: 243-265
  - file: tools/generate/src/cli/picture.ts
    lines: 329-332
  external_cause: null
  planner_trust_boundary: true
  granted_head: 76e6c9544dbf471141e48f6a11e1f4e00f5511b8
---

# Mode override granted: code_frozen

REQ-223 s6 and the EPIC-1 2026-09-11 REQ-218 answer, both in scope, require a body capped while it is read and a drawing caption warning that letter widths and line breaks are not evidence; the frozen code does neither, so the code is wrong and the tests are right.

Planner instructions for the batch:

Nothing is failing; the evidence gap is that AC-2509 (just tightened) and AC-2486 state REQ-223 s6 and EPIC-1 2026-09-11 intent that neither the code nor the tests pin. RED first. In the AC-2509 UAT, add a POST whose body has no content-length and is a ReadableStream that never ends (it enqueues a chunk on every pull), and assert 413, that the stream was cancelled, and that the bytes pulled are no more than MAX_BODY_BYTES plus one chunk. In the AC-2486 UAT, assert the SVG caption says letter widths and line breaks are not evidence. GREEN next. In apps/public-site/src/lead.ts readFields, replace the request.arrayBuffer() read with a reader loop that keeps a running byte count and cancels the stream and returns the existing 413 as soon as the count passes MAX_BODY_BYTES; keep the declared-length precheck and the bytes-then-TextDecoder decode; correct the comment at about :243-245 so it describes the bounded read truthfully. In tools/generate/src/cli/picture.ts, extend DRAWING_RASTER_NOTE to say that letter widths and line breaks in the drawing are therefore not evidence, keeping the default-face and measure_drawing halves, and make the same change wherever fidelity-surface.json carries that caption text. Do not touch multipart handling or bounce/complaint suppression; those stay as divergences recorded in STORY-177. All dependency tests must stay green.
