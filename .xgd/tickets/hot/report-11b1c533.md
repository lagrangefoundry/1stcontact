---
uid: report-11b1c533
id: REPORT-11395
type: report
title: 'Fix reconciliation review: bundle-c0301347'
created_by: xgd
created_at: '2026-11-08T10:16:33.879043+00:00'
updated_at: '2026-11-08T10:16:33.879043+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_reconciliation_review
  subject_uid: bundle-c0301347
  needs_more_work: true
  progress_made: true
---

## Stories created
None (new ACs under existing stories instead: AC-2410 measure_drawing shares the fidelity surface's browser source; AC-2411 200-node / 120-glyph measurement caps with truncation warnings — both under story-d2bee21c).

## Stories modified
- story-58b2cec4: corrected the three places claiming a no-BLOBS Worker still edits; Reconciliation Decisions added for the AC-2024 narrowing (flagged divergence from REQ-206: no BLOBS means no chat at all per REQ-160; looking-surface BLOBS check is defence in depth) and the AC-2372 outside-address wording.
- story-a58a0974: Reconciliation Decisions for 'not a TS constant' (structural), unregistered-provider test through the host, placeholder clause kept and tested, AC-2375 guard clause moved here.
- story-39c992d3: Reconciliation Decision — when to generate and how the result is presented ('don't regenerate what the client has; report as a draft') is left to model judgement; no instruction exists to assert.
- story-d2bee21c: five Reconciliation Decisions (AC-2393 message, AC-2403 dropped misspelt recorded comments, caps, omission of unreadable nodes, shared browser source).
- ACs rewritten/narrowed: AC-2024, AC-2031, AC-2372, AC-2373 (item 2); AC-2374, AC-2375, AC-2377 (item 3); AC-2097 (item 4); AC-2383, AC-2391 (item 5); AC-2393, AC-2397, AC-2398, AC-2401, AC-2402, AC-2403, AC-2407 (item 6); AC-2371 verification extended (item 1).

## Stories deleted
None

## ACs superseded
- AC-1492 (acceptance_criterion-535253fa), owned by story-e07c589b (STORY-128), authored by REQ-162 → superseded_by request-68718201 (REQ-208, origin: generated).

## FC orphans renamed/deleted
None (no fc_orphan_check report exists for this anchor).

## Code changes
Tests only (production code untouched):
- tests/test_reconciliation_outgoing_messages_text_part_and_sender.workers.test.ts — AC-2371: tokened `from` passes verbatim; route delivery `from` asserted at the Resend boundary.
- tests/reconciliation-assistant-looking-surface-business.workers.test.ts — AC-2372 capture_site through a Worker turn (adoption, no-adopt fallback, network continuation); AC-2024 real no-BLOBS 500 outcome; defence-in-depth case renamed to UAT convention.
- tests/reconciliation-assistant-looking-surface-worker.workers.test.ts — AC-2031 Worker twin.
- tests/reconciliation-assistant-looking-surface.test.ts — AC-2031 four assertions; AC-2373 no-ceiling + 41 Node looks.
- tests/reconciliation-assistant-session-priming.test.ts — AC-2374 openSession unregistered provider; placeholder left as written (vi.doMock of priming.json — riskiest new test).
- tests/reconciliation-assistant-priming-names-no-documents.test.ts — AC-2377 retitle rebuild.
- tests/reconciliation-material-description-session.workers.test.ts — AC-2097 JPEG media type, description_model equals request model, no session/junction remains after success and failure.
- tests/reconciliation-consultant-image-generation.workers.test.ts — AC-2391 tool results lack the key, standalone echo case; AC-2383 vocabulary present before attach via route().
- tests/test_reconciliation_measure_drawing.test.ts — items 6(a)–(g) cases (scripted-driver browserMeasurer, caps, unreadable nodes, misspelt recorded comment, Chromium scale/rotate/x-list, real-host tool list, shared browser source).

## Outstanding — production-code gap (needs planner exception)
- Gap 5(a): AC-2380 / REQ-208 property 1 is contradicted by code — the material body carries 'Provider: <vendor>' / 'Model: <id>' (ai-imagegen toolbox.js:757-758) and imagegen.ts:260 indexes it into the session KB. Fix requires scrubbing those lines in generatedMaterialStore.create (code frozen). Not touched.
- Gap 3(f): scoped quality for story-3cf3d57b (and story-a58a0974) must be re-run: `xgd quality run --stories story-3cf3d57b`. Tests are linked by test_UAT_AC<n> naming; not run here per instructions.

## Confidence
Moderate. Every matrix/evidence gap except 5(a) has been acted on, but none of the new tests were executed in this call (several are non-trivial: vi.doMock JSON swap, puppeteer-shaped capture browser, prototype-wrapped SessionManager). The next review will still FAIL on 5(a) until the planner grants a scoped exception to scrub the vendor from the generated material body.
