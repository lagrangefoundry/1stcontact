---
uid: report-b5be9c7c
id: REPORT-6912
type: report
title: 'Reconciliation Review: commits (BUNDLE-32)'
created_by: xgd
created_at: '2026-10-30T20:41:04.790458+00:00'
updated_at: '2026-10-30T20:41:04.790458+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: reconciliation_review
  subject_uid: bundle-5607a08d
  anchor_uid: bundle-5607a08d
  overrides_audited: 3
  trust_boundary_overrides: 1
  override_misjudged:
  - report_uid: report-be7d1be4
    rule: code_frozen
    batch_index: '0'
    reason: 'item 5 (trust boundary): the granted diff 13aa65737c (fidelity-core.ts
      contentBlocksFrom + host-core.ts box.run wrapper) returns the block array carved
      out of the Toolbox''s rendering and drops the <<<untrusted>>> frame on every
      screenshot/picture result; at HEAD (production code identical to 13aa65737c
      since 53d17b5ccd reverted 0a0f97f216) marking is not preserved on that path,
      and the only test on it (AC-2067) asserts the frame''s ABSENCE. Recording the
      gap as BUG-316 does not satisfy item 5.'
---

# Reconciliation Review: Story Coverage

**Result**: FAIL
**Mode**: commits
**Surface**: 
**Anchor**: bundle-5607a08d (BUNDLE-32: BUG-45, BUG-44, BUG-47, REQ-157, REQ-176, REQ-174, BUG-49, REQ-177)
**Stories Reviewed**: 11. These are the 9 named stories plus story-b3de4571 (STORY-107) and story-325da65f (STORY-145), which plan items 1 and 3 target.

3 overrides audited, 1 touched a trust boundary.

This is a re-review after the fix loop for report-84f2f9bc (F1), at HEAD 153a83dddc.

**What changed since report-84f2f9bc:**
- **Production code:** 53d17b5ccd reverted the ungranted production hunks of 0a0f97f216 in `fidelity-core.ts` and `cli/index.ts`. `git diff 0a0f97f216^ HEAD -- apps tools packages` is empty, so no production code remains without an audited grant.
- **Tickets:**
  - AC-2067 (acceptance_criterion-827e8986) was rewritten to the running code, which delivers bare blocks with no frame, and marked as a known gap.
  - AC-2064 (acceptance_criterion-d60382f0) was aligned to the help text that has the leftover `serve` mentions.
  - story-58b2cec4 and story-e15a19ef record both divergences under Reconciliation Decisions.
  - BUG-316 (bug-d9778adf) was filed.
- **Quality:** quality report report-e0d7ff2f (commit 6141359474) passes 230/230, including test_UAT_AC2064_* and test_UAT_AC2067_*. Tests and production code are unchanged since that commit.

At story level the matrix is now sound. The review still fails **hard**, on the mode-override audit only.

## F1 — report-be7d1be4 is still misjudged on item 5 (trust boundary)

The production code this grant produced is unchanged; it is exactly commit 13aa65737c:
- `tools/generate/src/cli/ai/fidelity-core.ts`: `contentBlocksFrom` (about lines 120-155) slices the JSON array out of the Toolbox's rendered text and returns `parsed` bare.
- `tools/generate/src/cli/ai/host-core.ts:521-526` returns `contentBlocksFrom(payload) ?? payload` as the `tool_result` content.

Every operation in `fidelity-surface.json` is declared `provenance: untrusted` (lines 131, 146, 165, 186, 215 and 244). The Toolbox wraps such results in `<<<untrusted>>>` … `<<</untrusted>>>`, and the AC-2067 UAT itself asserts that the rendering carries the frame. The granted change discards that frame, so every screenshot reaches the model unmarked, including one of an arbitrary third-party URL.

**Checklist item 5:**
- `trust_boundary_touched` is true. The report never had it computed (the `files_touched`, `trust_boundary_*` and `conformance_verdict` fields are absent although `planner_trust_boundary` is true). Computed by hand against `override_audit.trust_boundary_patterns`, the added production lines match `provenance` ("marks its provenance"), and the change functionally removes the untrusted marking.
- I cannot confirm that marking is preserved on every affected path. It is demonstrably **not** preserved.
- The only test on this path, `test_UAT_AC2067_a_screenshot_reaches_the_model_as_the_bare_blocks_without_the_frame` (tests/reconciliation-assistant-looking-surface.test.ts), asserts the frame's **absence**. No test asserts that the frame is kept.

Aligning AC-2067 to the code and filing BUG-316 makes the divergence visible at story level, and that part is done well. It does not change the checklist outcome: the audit judges the granted diff, and that diff still drops the trust-boundary marking. The verdict is deterministic. The code is the same as when report-9ddac478 judged this item failed, so the verdict is the same.

The other items for report-be7d1be4 still pass:
- **Item 1:** only the named files were touched.
- **Items 3, 4 and 6:** the diff is a faithful, scoped port of the reference state's REQ-206 behaviour for AC-2031, AC-2034 and AC-2025. No BUG-256, adopt or lowDetail code came with it.
- **Item 2:** the quality run is green.

**Remediation for the fix loop and the test_fix planner.** The only route that clears item 5 without regressing AC-2031 is (a):
- **(a) Grant the framing in a new batch.** `code_frozen` is denied for batch 0 of story-58b2cec4 (report-1312a88f, report-07babd4a), so this must be a new batch.
  - The grant should be at **rung 1**. REQ-157 says, in its Grant and safety section (bundle body, about line 685): "a captured page's text must never be able to read as an instruction". That is an in-scope intent demanding the behaviour.
  - **Files:** `tools/generate/src/cli/ai/fidelity-core.ts` only. Carry the text before and after the recovered array onto the first and last blocks. The reverted 0a0f97f216 hunk and BUG-316's Fix section give the shape.
  - The `mode_override` report must have the computed `trust_boundary_touched`, `files_touched` and `conformance_verdict` fields.
  - **Same pass:** rewrite AC-2067 and its two UATs back to asserting that the frame opens before the image and closes after it, as BUG-316's test plan describes. Update story-58b2cec4 Technical Context and Reconciliation Decisions to say the frame is kept. Close or resolve BUG-316 against that change.
- **(b) Revert 13aa65737c's `contentBlocksFrom` application in host-core.ts.** This restores the framed text but loses the image block that AC-2031 and REQ-157 require. It is not recommended.

## Behavior Inventory

About 47 behaviours across 7 features:
- the asset store without a registry (BUG-44/45)
- placement (BUG-47)
- the Library row and wording (REQ-176)
- the fidelity surface: see, compare and capture (REQ-157)
- the consultant role (REQ-174)
- kb account discovery (BUG-49)
- removal of `1c serve` (REQ-177)

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | No asset registry; the legacy key is ignored; the listing is the store's bytes | Covered | story-c46abfa6 | AC-2009, AC-1018; AC-1019 superseded_by bundle-5607a08d |
| 2 | get_asset by id or by handle, in the listing's shape; NOT_FOUND | Covered | story-c46abfa6 | AC-2010 |
| 3 | add, write and remove change bytes only and are journalled; conflict and force rules | Covered | story-c46abfa6 | AC-2011 |
| 4 | No alt on assets; the manual tells the truth; the absence note points at the site-asset area | Covered | story-c46abfa6 | AC-2012, AC-1022 |
| 5 | write_image is never a stand-in for a supplied file | Covered | story-b3de4571 | AC-2014, AC-1104 |
| 6 | placed_on is written only when a promotion lands; union; ingest writes no site field | Covered | story-aacb7060 | AC-2015, AC-2016 |
| 7 | Promotion is journalled; a refusal at the rights gate journals nothing | Covered | story-aacb7060 | AC-2017 |
| 8 | The pill, the Used on row and the filter read placed_on and agree, including across a site switch | Covered | story-1500b111 | AC-1715, AC-1716, AC-1717, AC-2018 |
| 9 | Type icon; no kind pill; one-line row | Covered | story-1500b111 | AC-2019, AC-2020 |
| 10 | Purpose / Site asset / Background information come from one constant | Covered | story-325da65f | AC-1725, AC-2021 |
| 11 | "Live on the site" is not implemented | Covered (correctly absent) | story-1500b111 | |
| 12 | Second surface, picture vocabulary, rev-<id> channel, bound to one site, grant narrowed | Covered | story-58b2cec4 | AC-2022 to AC-2030 |
| 13 | The screenshot image block reaches the backend; 1024px box downsample; byte ceiling; SSE strip | Covered | story-58b2cec4 | AC-2031 to AC-2034 |
| 14 | The screenshot reaches the model WITHOUT the untrusted frame | Covered (divergence flagged) | story-58b2cec4 | AC-2067 is a known gap; intent–code conflict recorded; BUG-316. Grant-level problem in F1 |
| 15 | No looking operation changes the site | Covered | story-58b2cec4 | AC-2035 |
| 16 | compare equals `1c diff`; common-rectangle crop; viewport follows the actual side; labelled fallback | Covered | story-47fb84e6 | AC-2036 to AC-2038, AC-2041, AC-2042; the real CLI is the oracle |
| 17 | check_fidelity equals `1c gate`; five verdicts, each with its next step | Covered | story-47fb84e6 | AC-2039, AC-2040, AC-2043 |
| 18 | capture_site, list/describe, egress guard, pre-flight, REFUSED plus audit | Covered (divergence flagged) | story-31204812 | AC-2044 to AC-2053; conflict with REQ-157 AC6 recorded; BUG-315 |
| 19 | Consultant role, preamble, reminder, legacy alias on read, straggler guard | Covered | story-a58a0974 | AC-1051, AC-2054 to AC-2057, AC-2066 |
| 20 | kb account discovery and its diagnoses | Covered | story-c4f329d3 | AC-1306, AC-2058, AC-2059 |
| 21 | `1c serve` removed; help offers the builder; startServe fixture kept | Covered (stragglers flagged) | story-e15a19ef | AC-1017, AC-2064, AC-2065; two `serve` prose mentions in USAGE are recorded as a code issue |

## Ungrounded Stories

None.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. Site Asset Store (registry removed) | story-c46abfa6, story-b3de4571 | ✓ |
| 2. Promotion & Library placement | story-aacb7060, story-1500b111 | ✓ |
| 3. Library row & overlay wording | story-1500b111, story-325da65f | ✓ |
| 4. Fidelity surface: see | story-58b2cec4 | ✓ |
| 5. Fidelity surface: compare & judge | story-47fb84e6 | ✓ |
| 6. Fidelity surface: capture + egress guard | story-31204812 | ✓ |
| 7. Consultant role | story-a58a0974 | ✓ |
| 8. KB account discovery | story-c4f329d3 | ✓ |
| 9. 1c serve removed | story-e15a19ef | ✓ |

## Supersession Check (Step 4c)

PASS. AC-1019 is `superseded` with superseded_by_uid bundle-5607a08d. The other ACs the plan touches were rewritten in place and no longer pin retracted behaviour: AC-1018, 1020, 1022, 1104, 1105, 1711, 1715, 1716, 1717, 1725, 1017, 1051 and 1306.

## Mode Override Audit

3 overrides audited, 1 touched a trust boundary.

- **report-c89e2900** (code_frozen, story-a58a0974): PASS. No production code has changed since the last audit. It touched only the named host.ts (logDir→junctions) and system-knowledge.ts (a comment). trust_boundary_touched is false and conformance_verdict is pass.
- **report-be7d1be4** (code_frozen, story-58b2cec4): **MISJUDGED, item 5.** See F1.
- **report-c8fd0348** (aligned_to_tip, story-31204812): PASS.
  - Item 1: the tip evidence exists at `reconcile-src-BUNDLE-32` and is production code.
  - Item 2: no later in-window intent requires the retired behaviour, and the erratum comment is on REQ-157.
  - Item 3: the six ACs were rewritten in place and are still active; no ticket edit since the last review touches them.

## Judgment Calls

- The AC-2067 and AC-2064 alignments, the Reconciliation Decisions entries and BUG-316 follow remediation (b) and (c) of report-84f2f9bc. At story level they are correctly flagged divergences, not silent absorption, so they are not story-coverage findings.
- An active AC that pins the *absence* of an untrusted frame is uncomfortable, because fixing BUG-316 will deliberately break it. That is why remediation (a) rewrites AC-2067 in the same pass as the grant.
- report-07babd4a already records the denial for batch 0. This review re-reports the misjudgment because the granted diff is still the code at HEAD and the checklist judges that diff. A recorded follow-up bug does not satisfy item 5.

## Verdict

FAIL.

The stories now represent the intent faithfully and completely:
- All nine plan items produced stories.
- Supersession is correct.
- The REQ-157 divergences on capture_site and on the screenshot frame, and the REQ-177 help leftovers, are recorded rather than absorbed.
- Every active AC has a passing UAT (230/230).

The review fails hard on the override audit. The code_frozen grant report-be7d1be4 still fails item 5: its diff drops the untrusted-content frame on the picture path to the model, and no test asserts that marking is preserved. Clear it by granting the framing at rung 1 (REQ-157) in a new batch scoped to `fidelity-core.ts`, with the computed trust-boundary fields, and restoring AC-2067 to require the frame in the same pass (remediation (a) in F1).
