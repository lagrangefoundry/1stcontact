---
uid: report-319dba6c
id: REPORT-11665
type: report
title: 'Reconciliation Review: commits (BUNDLE-42)'
created_by: xgd
created_at: '2026-11-09T02:34:57.041411+00:00'
updated_at: '2026-11-09T02:34:57.041411+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: reconciliation_review
  subject_uid: bundle-7ba3af93
  anchor_uid: bundle-7ba3af93
  overrides_audited: 4
  trust_boundary_overrides: 2
  gap_count: 0
---

# Reconciliation Review: Story Coverage

**Result**: PASS
**Mode**: commits
**Surface**: (none - commits mode)
**Anchor**: bundle-7ba3af93
**Stories Reviewed**: 9 (story-5281f009, story-179b8c06, story-58b2cec4, story-47fb84e6, story-e214a00d, story-e674c60a, story-f2e5032c, story-219b4217, story-d34eccd8)

This is the third review pass. It follows REPORT-11655 (FAIL, 3 text-only gaps A-C) and REPORT-11656 (fix_reconciliation_review, text only). A test_fix iteration ran after that: fix plan REPORT-11660 (report-a57cb65b), a verification-only batch with no production change.

**Code at HEAD is unchanged since the last review's evidence.** `git diff --stat c56e6bf74b HEAD -- . ':!.xgd'` is empty, so no production or test file has changed since quality run REPORT-11654. A newer scoped quality run, REPORT-11664 (report-b9b31fc6) at 600afcce04, passed 269/269 with lint and build clean.

## Behavior Inventory

About 75 behaviours across 6 features. The inventory is unchanged from REPORT-11655, including the bounded body read (`apps/public-site/src/lead.ts:243-285`, re-read at HEAD) and the drawing caption warning (`tools/generate/src/cli/picture.ts:331-335`, `fidelity-surface.json:200`).

## Previous gaps: re-verified

| Gap (REPORT-11655) | Status | Evidence |
|---|---|---|
| A. STORY-177 "undeclared large body is read whole" | Closed | The story now has "Bounded body read — RESOLVED", citing report-0fca9951, lead.ts:258-285, the precheck at :247-250, and the AC-2509 never-ending-stream UAT. The "Refused before the body is parsed" decision now says an undeclared or lying body is cut off at 8 KiB while it is read. lead.ts:260-277 at HEAD matches this. |
| B. STORY-157 drawing-caption code issue OPEN | Closed | The section heading now ends "RESOLVED", and the caption-content half of Reconciliation Decisions is marked RESOLVED. The bare `data:` document divergence (EPIC-1's wanted draft-preview rasterisation) is still recorded, which is correct. |
| C. AC-2486 stale divergence note | Closed | The criterion now states the letter-widths/line-breaks warning, the Verification asserts it, and the note is "Resolved", citing 40ae57dd34, REPORT-11648 and REPORT-11652. |

REPORT-11655 had already confirmed REPORT-11644's gaps 1-9 closed. Nothing has changed since that would reopen them.

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | Embedder transport resolver: REST/binding/half-pair error/single resolver/EmbeddingFailedError (BUG-73 B1-B7) | Covered | story-5281f009 | AC-1664, AC-2468..2475 |
| 2 | capabilities.js block-scoped, parses as module (BUG-75) | Covered | story-179b8c06 | AC-702, AC-2476 |
| 3 | `after` grammar, accessible-name matching, refusals, draft-only, edit caption (REQ-216) | Covered | story-58b2cec4 | AC-2477..2482; name/id matching removed under report-b31905da |
| 4 | Stored image picture kind (REQ-218) | Covered | story-58b2cec4, story-47fb84e6 | AC-2026..2028, AC-2483..2490 |
| 5 | Drawing caption says letter widths / line breaks are not evidence | Covered | story-58b2cec4 | AC-2486; story and AC now say resolved |
| 6 | CLI host says it holds no Library; no image store refuses as ENVIRONMENT | Covered | story-58b2cec4 | AC-2487, under report-15fed5d0 |
| 7 | Edit render keeps dialog apparatus; page-state read/apply (REQ-215) | Covered | story-e214a00d | AC-2436 amended, AC-2491..2495 |
| 8 | Channel carry and Edit panel selector (REQ-215) | Covered | story-e674c60a | AC-1029, AC-1036, AC-2496..2499 |
| 9 | POST /api/lead: tenant from URL, seam, controls, frozen ack, provenance, asset delivery, form surface (REQ-223) | Covered | story-f2e5032c | AC-2500..2516 |
| 10 | Body capped while read; never-ending stream cancelled | Covered | story-f2e5032c | AC-2509; story text now accurate |
| 11 | multipart accepted but parsed as urlencoded; suppression is per tenant | Flagged divergence | story-f2e5032c | Recorded with code issues flagged, not absorbed. Out of scope per the planner instruction in report-0fca9951/report-edd5b890 |
| 12 | complained status, webhook mapping, enum derived from MESSAGE_STATUSES | Covered | story-219b4217 | AC-2287, AC-2293, AC-2299 |
| 13 | public-site read-only except POST /api/lead | Covered | story-d34eccd8 | AC-912 |

## Ungrounded Stories

None. The three ungrounded claims in REPORT-11655 have been corrected.

## Supersession Check (Step 4c)

PASS, unchanged from REPORT-11655. REQ-215 supersedes REQ-212 section 5.7 / acceptance 12.
- AC-2436 was amended rather than superseded, because its no-script and no-acting-attribute halves still hold.
- No active AC still pins any of the following:
  - "no shell, no role" in the edit render;
  - five picture kinds;
  - field matching by name or id;
  - a channel toggle that returns to the root;
  - a fully read-only public-site;
  - webhook handling limited to delivered and bounced.

## Evidence Sufficiency (Step 5b)

No test or code has changed since REPORT-11655's evidence check. Every UAT it relied on passed again in REPORT-11664 (269/269). Accepted as before:
- **AC-2497**: the post-save reload is simulated by re-delivering the page. The planner flags it as weak-observation in REPORT-11660. It is accepted as minor because carry across a re-delivered page is asserted and JSDOM cannot redefine `location.reload`.
- **AC-2471 and AC-2475**: static invariants.
  - AC-2475 is a fact about a committed config file, so reading the file is the behaviour itself.
  - AC-2471 is backed at runtime by AC-2468 and AC-2470, which tell the REST and binding transports apart by observable outcome.
- **`tests/test_UAT_FC_REQ-223_internal_seam.test.ts`** is an FC orphan whose behaviour AC-2513's real-entrypoint test now proves. It is left to the orphan gate and is not a story coverage gap.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. KB embedder transport (BUG-73) | story-5281f009 | ✓ |
| 2. capabilities.js (BUG-75) | story-179b8c06 | ✓ |
| 3. Drive the draft (REQ-216) | story-58b2cec4 | ✓ |
| 4. Stored image kind (REQ-218) | story-58b2cec4, story-47fb84e6 | ✓ |
| 5. L1 modal state (REQ-215) | story-e214a00d | ✓ |
| 6. Builder carry (REQ-215) | story-e674c60a | ✓ |
| 7. Public lead capture (REQ-223) | story-f2e5032c (STORY-177, new) | ✓ |
| 8. Message status + serving exception (REQ-223) | story-219b4217, story-d34eccd8 | ✓ |

## Mode Override Audit

4 overrides audited, 2 touched a trust boundary. The two trust-boundary records are one grant, recorded twice: report-edd5b890 and report-0fca9951. Both carry planner_trust_boundary true for the public lead endpoint; trust_boundary_touched is false and conformance passed.

Limitation: OVERRIDE-AUDIT.md lies outside the session's readable paths, and the Read was refused again. Each override was judged on the five items as the prompt summarises them: grounding in in-scope intent, files touched within the named files, trust boundary, conformance, and the change landing with evidence that would fail on regression.

- **report-0fca9951** (batch 0; lead.ts, picture.ts, fidelity-surface.json, two tests).
  - Grounding: REQ-223 section 6 and EPIC-1's 2026-09-11 answer on REQ-218.
  - Scope: files_touched equals the named files; unnamed_files_touched is empty; conformance passed.
  - Trust boundary: the change only tightens the anonymous-input boundary. The declared-length precheck is kept, the stream is cancelled past the cap, decoding stays bytes-then-TextDecoder, and the 413/400 messages are unchanged (verified at lead.ts:243-285 at HEAD). Multipart and suppression were left alone, as instructed.
  - Evidence: the never-ending-stream UAT fails against `arrayBuffer()`, as REPORT-11660 records (it hung before the fix).
  - Judged correctly.
- **report-edd5b890** (the same batch-0 grant, re-recorded at head 76e6c954 in fix iteration 2).
  - Same justification and file list as report-0fca9951.
  - No production or test file changed after it: the diff from c56e6bf74b to HEAD is empty. Fix plan REPORT-11660 ruled at rung 1 that the in-scope intent was already met and that code_frozen stands; it declined the no-op REPORT-11659 request.
  - No unnamed files and no trust-boundary change.
  - Judged correctly.
- **report-15fed5d0** (batch 1; picture.ts, image-library.ts; AC-2487).
  - Grounding: REQ-218's "says it holds no Library" and the ENVIRONMENT refusal.
  - Scope: only the named files were touched; fidelity-core.ts was excluded as instructed; no trust-boundary component; conformance passed.
  - Evidence: the Worker sentence is preserved (AC-2484 green) and the AC-2487 UAT drives the real CLI host.
  - Judged correctly.
- **report-b31905da** (batch 1; interact.ts; AC-2479).
  - Grounding: REQ-216 "no way to name a selector, an id or an attribute" and "label first, value second".
  - Scope: only interact.ts was touched; conformance passed.
  - Evidence: the diff removes name/id from `fillNames` and makes option matching two-pass, and AC-2479 asserts both.
  - Judged correctly.

No override_misjudged.

## Judgment Calls

- **Multipart-as-urlencoded and per-tenant suppression** narrow REQ-223. They are explicitly recorded as DIVERGENCEs with code issues flagged in STORY-177 and stated in AC-2512. The planner instruction in both batch-0 override records put them out of scope. They are flagged, not silently absorbed, so they do not fail this review. This matches REPORT-11655, which keeps the verdict deterministic.
- **The Security Policy section 5 tension** (the Turnstile script from challenges.cloudflare.com) is recorded in STORY-177 as a documentation follow-up. It is not a story coverage gap.
- **BUG-73's root-cause hypothesis** is not proven, and STORY-138 documents the transport behaviour, not the diagnosis. That is correct for reconciliation.

## Verdict

PASS. The stories accurately and completely document the behaviour surface of BUNDLE-42. They match the operator's intent in BUG-73, BUG-75, REQ-215, REQ-216, REQ-218 and REQ-223. The remaining narrowings are flagged as divergences rather than absorbed, and every plan item produced its story. The three text gaps from REPORT-11655 are corrected, and code and tests are unchanged since the evidence that already satisfied Step 5b (re-confirmed by REPORT-11664, 269/269). A developer reading these stories would have a correct mental model of what this code does and what the operator intended.