---
uid: report-3a368f8c
id: REPORT-11655
type: report
title: 'Reconciliation Review: commits (BUNDLE-42)'
created_by: xgd
created_at: '2026-11-09T02:11:45.904222+00:00'
updated_at: '2026-11-09T02:11:45.904222+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: reconciliation_review
  subject_uid: bundle-7ba3af93
  anchor_uid: bundle-7ba3af93
  overrides_audited: 3
  trust_boundary_overrides: 1
  gap_count: 3
---

# Reconciliation Review: Story Coverage

**Result**: FAIL
**Mode**: commits
**Surface**: (none - commits mode)
**Anchor**: bundle-7ba3af93
**Stories Reviewed**: 9 (story-5281f009, story-179b8c06, story-58b2cec4, story-47fb84e6, story-e214a00d, story-e674c60a, story-f2e5032c, story-219b4217, story-d34eccd8)

This is the second review pass. It follows REPORT-11644 (FAIL, 9 gaps), REPORT-11645 (fix_reconciliation_review), and the batch-0 code_frozen override report-0fca9951 (the bounded body read in lead.ts and the drawing caption).

Quality evidence: REPORT-11654 (report-96b5401d) passed 269/269 at c56e6bf74b. That commit comes after override head 6f7df9a1. The run covers every UAT this review relies on: AC702 (both), AC2476, AC2436 (both), AC912, AC2472, AC2479, AC2482, AC2486, AC2490, AC2499, AC2509, AC2510, AC2511 and AC2513.

## Behavior Inventory

About 75 behaviours were identified across 6 features. The inventory is the same as REPORT-11644, plus the two behaviours report-0fca9951 landed:
- `readFields` reads the body as a stream, keeping a running byte count. It cancels at MAX_BODY_BYTES and returns 413 (`apps/public-site/src/lead.ts:258-285`).
- `DRAWING_RASTER_NOTE` now says letter widths and line breaks are not evidence (`tools/generate/src/cli/picture.ts:331-335`, `fidelity-surface.json:200`).

## Previous gaps: re-verified

| Gap (REPORT-11644) | Status | Evidence |
|---|---|---|
| 1. AC-912 lead doorway | Closed | `tests/reconciliation-published-site-serving.test.ts:578+`: PUT/PATCH/DELETE/OPTIONS on page, root, `/`, `/api/lead`, `/site/<key>/api/lead`; POST near-misses rejected |
| 2. AC-2509 bounded read | Closed in code and test; **story text stale (GAP A)** | `lead.ts:263-271` uses a reader loop with cancel; the UAT at `test_reconciliation_public_lead_capture.workers.test.ts:848-872` sends a never-ending stream and asserts 413, cancellation, and bytes pulled no more than cap + chunk |
| 3. AC-2490 no UAT | Closed | `reconciliation-assistant-sees-a-stored-picture.test.ts:682`, through the real Toolbox, both orderings, Library side, PNG against itself; passed in REPORT-11654 |
| 4. AC-2486 caption | Closed in code and test; **story/AC text stale (GAP B, C)** | caption asserted at test:560-562 |
| 5. AC-2513 seam not driven | Closed | `new LeadIntake(createExecutionContext(), intakeEnv)` used as the binding (test:1127-1158) |
| 6a. AC-2510 internal stub | Closed | real `captureLead` against `unavailableD1()` (test:917-923) |
| 6b/6c/6e | Recorded | per-tenant suppression and multipart-parsed-as-urlencoded are explicit DIVERGENCEs with code issues flagged in STORY-177, and stay out of scope per the report-0fca9951 planner instruction; the rate-cap tension is in Technical Context |
| 6d. CRLF in email | Closed | per REPORT-11645; AC2511 passed |
| 7. AC-2479 / AC-2482 | Closed | aria-label, aria-labelledby and placeholder fill cases (drives-the-draft test:111-117, 463); `compare(a: draft, b: edit)` carries the caveat (test:644-645) |
| 8. AC-2499 naming order | Closed | `HEADING_AFTER_TEXT_PANEL` and `EMPTY_PANEL` (builder_page_carry test:118-124, 404) |
| 9. AC-2472 system KB / reload | Closed | real `systemKnowledge` failure asserts `kb === SYSTEM_KB` and `/refreshes it\s+on worker reload/` (embedder-transport.workers test:506-530) |

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | Embedder transport resolver (BUG-73 B1-B7) | Covered | story-5281f009 | AC-1664, AC-2468..2475 |
| 2 | capabilities.js block-scoped, parses as module (BUG-75) | Covered | story-179b8c06 | AC-702 (imports real bundle), AC-2476 |
| 3 | `after` grammar, accessible-name matching, refusals, draft-only, edit caption (REQ-216) | Covered | story-58b2cec4 | AC-2477..2482 |
| 4 | Stored image picture kind (REQ-218) | Covered | story-58b2cec4, story-47fb84e6 | AC-2026..2028, 2483..2490 |
| 5 | Drawing caption warns letter widths / line breaks are not evidence | Covered by AC and UAT; **story says OPEN** | story-58b2cec4 | GAP B, C |
| 6 | Edit render keeps dialog apparatus; page-state read/apply (REQ-215) | Covered | story-e214a00d | AC-2436 rewritten, AC-2491..2495 |
| 7 | Channel carry and Edit panel selector (REQ-215) | Covered | story-e674c60a | AC-1029, AC-1036, AC-2496..2499 |
| 8 | POST /api/lead and its controls, ack, asset delivery, form surface (REQ-223) | Covered | story-f2e5032c | AC-2500..2516 |
| 9 | Body cap enforced while reading; never-ending stream cancelled | Covered by AC-2509 and UAT; **story says code reads whole** | story-f2e5032c | GAP A |
| 10 | multipart parsed as urlencoded; per-tenant suppression | Flagged divergence | story-f2e5032c | acceptable: recorded, not absorbed |
| 11 | complained status, webhook, enum from MESSAGE_STATUSES | Covered | story-219b4217 | AC-2287, 2293, 2299 |
| 12 | public-site read-only except POST /api/lead | Covered | story-d34eccd8 | AC-912 |

## Gaps (for fix_reconciliation_review)

All three gaps are text-only. No code or test change is needed. Each ticket now states as an open defect something the code at HEAD no longer does, and a developer reading it would get the security-relevant body-read behaviour wrong. That is an ungrounded claim: neither intent nor code supports it.

**A. story-f2e5032c (STORY-177), Reconciliation Decisions: "DIVERGENCE: an undeclared large body is read whole".**
- The story says the code calls `request.arrayBuffer()` at `lead.ts:257-265` and that the comment at :243-245 is wrong. It also says "AC-2509 now states the narrowed behaviour" and flags a code issue as open.
- None of that is true at HEAD. Under override report-0fca9951, `readFields` reads through `request.body.getReader()` with a running count. It cancels the stream and returns 413 once the count passes MAX_BODY_BYTES (`lead.ts:258-285`), and the comment at :243-256 now describes this correctly. AC-2509 states the bounded read, and its UAT proves it with a never-ending stream.
- Remediation:
  - Rewrite the bullet as RESOLVED, citing report-0fca9951 and the cited lines, or replace it with a decision stating the bounded read.
  - Also fix the decision "Refused before the body is parsed". It currently says only a declared over-size body is refused without being read; it should say an undeclared one is cut off at the cap while it is read.
  - Leave the multipart and per-tenant suppression DIVERGENCE bullets as they are.

**B. story-58b2cec4 (STORY-157): "Code issue flagged — the drawing caption does not say letter widths are not evidence (REQ-218 / EPIC-1) — OPEN".**
- The section says `DRAWING_RASTER_NOTE` (`picture.ts:329-332`) lacks the warning.
- At HEAD the warning is there: `picture.ts:331-335` and `fidelity-surface.json:200` both say letter widths and line breaks are not evidence, and the AC-2486 UAT asserts it (test:560-562).
- Remediation:
  - Mark the section RESOLVED, citing report-0fca9951, in the same style as the two other resolved code-issue sections.
  - Keep the separate, still-valid divergence: drawings are rasterised in a bare `data:` document, not in the site's draft preview, which EPIC-1 says is wanted.

**C. AC-2486 (acceptance_criterion-ef95eeef): stale "Divergence and code issue" note.**
- The note says the shipped caption does not carry the warning and that the UAT "pins only the default-face and measure_drawing halves".
- Both are false at HEAD.
- Remediation: replace the note with a resolved note citing report-0fca9951. Keep the Criterion and Verification text unchanged; it is correct.

## Supersession Check (Step 4c)

PASS. REQ-215 supersedes REQ-212 section 5.7 / acceptance 12.
- AC-2436 was amended rather than superseded, because its no-script and no-acting-attribute halves still hold. Both of its UATs assert the shell, role, id and stylesheet (`test_reconciliation_l1_modals.test.ts:336-371`; `test_reconciliation_l1_modal_page_state.test.ts:99`).
- No active sibling AC still pins "no shell, no role". AC-2435 now reads "a script or the builder sets".
- AC-1029 and AC-1036 state that the toggle keeps the page. AC-912 states the lead exception.
- No active AC pins five picture kinds, field matching by name or id, or webhook handling limited to delivered and bounced.

## Ungrounded Stories

| Story | Claim | Issue |
|-------|-------|-------|
| story-f2e5032c | Undeclared large body is read whole by `request.arrayBuffer()`; code issue open | Fixed by report-0fca9951 (`lead.ts:258-285`); GAP A |
| story-58b2cec4 | Drawing caption lacks the letter-widths warning; code issue OPEN | Fixed by report-0fca9951 (`picture.ts:331-335`); GAP B |
| AC-2486 (story-58b2cec4) | Caption and UAT lack the warning | Both carry it; GAP C |

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. KB embedder transport (BUG-73) | story-5281f009 | ✓ |
| 2. capabilities.js (BUG-75) | story-179b8c06 | ✓ |
| 3. Drive the draft (REQ-216) | story-58b2cec4 | ✓ |
| 4. Stored image kind (REQ-218) | story-58b2cec4, story-47fb84e6 | ✓ |
| 5. L1 modal state (REQ-215) | story-e214a00d | ✓ |
| 6. Builder carry (REQ-215) | story-e674c60a | ✓ |
| 7. Public lead capture (REQ-223) | story-f2e5032c (new) | ✓ |
| 8. Message status + serving exception (REQ-223) | story-219b4217, story-d34eccd8 | ✓ |

## Mode Override Audit

3 overrides audited, 1 touched a trust boundary.

Limitation: OVERRIDE-AUDIT.md is outside the session's readable paths, and the Read was refused. Each override was judged on the five items as the prompt summarises them: grounding in in-scope intent, files touched within the named files, trust boundary, conformance, and the change landing with evidence that would fail on regression.

- **report-0fca9951** (batch 0; lead.ts, picture.ts, fidelity-surface.json, two tests).
  - Grounding: REQ-223 section 6 ("rejected rather than read") and EPIC-1's 2026-09-11 answer on REQ-218.
  - Scope: files_touched equals the named files; unnamed_files_touched is empty; conformance passed.
  - Trust boundary: planner_trust_boundary is true, because the public lead endpoint reads anonymous input. The change only tightens that boundary. The declared-length precheck is kept, the 413/400 messages are unchanged, the stream is cancelled past the cap, and decoding stays bytes-then-TextDecoder. Multipart handling and suppression were left alone, as instructed.
  - Evidence: the never-ending-stream UAT fails against the old `arrayBuffer` read.
  - Judged correctly.
- **report-15fed5d0** (batch 1; picture.ts, image-library.ts; AC-2487).
  - Grounding: REQ-218 "Each says which" and "says it holds no Library".
  - Scope: only the named files were touched; no trust-boundary component; conformance passed.
  - Evidence: the Worker sentence is preserved (AC2484 green), and the AC-2487 UAT drives the real CLI host.
  - Judged correctly.
- **report-b31905da** (batch 1; interact.ts; AC-2479).
  - Grounding: REQ-216 "There is no way to name a selector, an id or an attribute" and "label first, value second".
  - Scope: only interact.ts was touched; conformance passed.
  - Evidence: the AC-2479 UAT now also covers aria-label, aria-labelledby and placeholder.
  - Judged correctly.

No override_misjudged.

## Judgment Calls

- GAPS A-C are FAIL-worthy under the materiality test. A developer reading STORY-177 would believe the public endpoint buffers unbounded anonymous bodies. That is a security-relevant misstatement, and the story presents it as an open defect.
- The multipart and per-tenant suppression narrowings are explicitly recorded as divergences with code issues, and the batch-0 planner instruction kept them out of scope. They are flagged, not absorbed, so they do not fail this review.
- The Security Policy section 5 tension (the Turnstile script) is recorded in STORY-177 as a documentation follow-up. It is not a story coverage gap.
- AC-2497's post-save reload is still a stand-in (REPORT-11645, Not done). It is accepted as minor: carry across a re-delivered page is asserted, and JSDOM cannot redefine `location.reload`.
- AC-2471 and AC-2475 are static invariants ("nothing else does X", "file does not name Y"). They are accepted as before: AC-2468 and AC-2470 back AC-2471 at runtime.

## Verdict

FAIL. Code, tests and AC evidence are now sufficient for every plan item: all of REPORT-11644's evidence gaps are closed, and both absorbed divergences were fixed in code under report-0fca9951. However, three ticket texts still describe those fixed defects as open:
- STORY-177's "undeclared large body is read whole" divergence;
- STORY-157's OPEN drawing-caption code issue;
- AC-2486's divergence note.

The fix loop should mark these resolved, citing report-0fca9951 (GAPS A-C). This is text only; no code or test change is needed.
