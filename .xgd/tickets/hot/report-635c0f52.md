---
uid: report-635c0f52
id: REPORT-7269
type: report
title: 'Reconciliation Review: commits'
created_by: xgd
created_at: '2026-11-01T04:31:14.692938+00:00'
updated_at: '2026-11-01T04:31:14.692938+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: reconciliation_review
  subject_uid: bundle-fd009b93
  anchor_uid: bundle-fd009b93
  overrides_audited: 3
  trust_boundary_overrides: 0
  gaps:
  - id: G3
    type: evidence_source_inspection
    story: STORY-140 (story-6ccaedd5)
    acs:
    - AC-2098
    summary: 'tests/reconciliation-builder-no-key-banner.test.ts:195 test_UAT_AC2098_the_blocked_builder_is_visibly_dimmed_by_the_class_the_app_sets
      reads apps/control-app/src/builder/builder.css with readFileSync (line 38) and
      regex-matches the stylesheet text (`/\.builder-shell--blocked\s*\{[^}]*opacity/`,
      `/\.builder-banner\s*\{/`). It is source inspection: it passes whenever the
      text exists, whether or not the class is applied or the rule takes effect. The
      previous fix turned it into AC-2098 evidence when it renamed the former FC file
      (test_UAT_FC_REQ-173_no_key_banner.test.ts) to AC-named tests.'
    remediation: 'Do not keep a source-inspection test under an AC name. Either (a)
      delete this one test, because visual dimming is not a claim of AC-2098 and the
      AC''s banner/inert/no-input claims are already proven behaviourally by the other
      four tests in the file plus test_UAT_AC2098_with_no_key_the_status_route_says_so_and_both_ingestion_routes_refuse_with_503_storing_nothing;
      or (b) make it behavioural: inject builder.css into the jsdom document as a
      <style> element, mount the builder with aiStatus {ai:false}, and assert getComputedStyle(app.shell.element).opacity
      is below 1 (and is 1 when ai is true). Do not leave it as an un-AC-named test,
      because unit tests are prohibited. Production code must not change.'
---

# Reconciliation Review: Story Coverage

**Result**: FAIL
**Mode**: commits
**Surface**: (none)
**Anchor**: bundle-fd009b93
**Stories Reviewed**: 7 listed (STORY-106, STORY-146, STORY-159, STORY-144, STORY-103, STORY-104, STORY-141), plus STORY-140, which plan item 7 also modified

3 overrides audited, 0 touched a trust boundary.

## Scope of this pass

This is the re-review after fix_reconciliation_review (REPORT-7265) acted on the previous review (REPORT-7264, gaps G1 and G2). I re-read the bundle intent: REQ-178 including the 2026-09-04 DOC-42 amendment, and the section outline of REQ-175, REQ-166, BUG-46 and REQ-173. I checked every change since the previous review: `git diff 84a773ed02..HEAD` touches no code or tests, and since the first override grant (06095b4cfb) only ai.ts, router.ts and host-core.ts changed in apps/, tools/ and packages/. I re-verified the fixed gaps against the stories, the tests and the latest quality report (report-387e8531).

## Behavior Inventory

31 behaviours across 13 commits (6 feature commits; 7 version bumps or merges carrying no behaviour), plus 3 production fixes under code_frozen overrides. These are unchanged from REPORT-7264, whose 31-row coverage map I re-validated for the items below.

## Coverage Map (delta from REPORT-7264)

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 16 | capture_site adopts the bundle as a reference ticket on the deployed Worker | Covered | STORY-159 | G2 resolved. The stale Known gap 8 is gone and the Reconciliation Decision 'Deployed adoption wired; former Known gap 8 resolved' matches router.ts sessionFidelity. Gaps 9 and 10 stay flagged and are still true. |
| 29 | material_text comment written once, bounded, marked when truncated | Covered | STORY-140 | G1 resolved: test_UAT_AC2095_* (route upload, independent store read, truncation at MAX_EXTRACTED_TEXT_CHARS, image gets no comment) passes |
| 30 | Chunk index reads full text; hits carry the material uid; document index reads the digest | Covered | STORY-140 | G1 resolved: test_UAT_AC2096_* (chunk_search hit uid is the material's, not the comment's; the doc index and /api/material show the digest) passes |
| 31 | No key: /api/status, banner plus inert shell, ingestion 503 storing nothing | Covered, evidence defect | STORY-140 | G1 resolved for every AC claim: the status, upload 503, fetch 503, unchanged holdings and the key-configured inverse are in the workers test; the banner, inert shell, no session and no upload are in the jsdom tests. All pass. One of the six AC-2098 tests is source inspection (G3). |

All other rows are as in REPORT-7264: covered, with intent-silent behaviour recorded under Reconciliation Decisions and intent divergences flagged.

## Evidence Sufficiency (Step 5b)

Latest quality report report-387e8531 (commit 34bbda8d86): 227 passed, 0 failed, 0 skipped; lint, build and preflight clean. Every AC this bundle added or modified has at least one passing AC-named UAT in that run: AC-2068-2098 (AC-2098 has 6), AC-1090, AC-1092, AC-1740, AC-1748, AC-1750-1753, AC-2044, AC-1723, AC-1052, AC-1063, AC-1688, AC-1689 and AC-1699. The jsdom banner tests are under `describe.skipIf(!WEBUI_INSTALLED)`, but they ran: the run shows 0 skipped.

I scanned every test file carrying these AC names for mocks and source reads. The readFileSync calls in the page-composition and assistant-conversation tests read stored page JSON, rendered output and archived transcripts. That is data and output, not source. vi.mock appears only on the Playwright module (an external browser boundary), and vi.spyOn only on console.warn (observing a log). The new tests/reconciliation-material-text-comment.workers.test.ts drives route() in workerd against real D1/R2 and mocks nothing internal.

**FAIL (G3):** tests/reconciliation-builder-no-key-banner.test.ts:195 `test_UAT_AC2098_the_blocked_builder_is_visibly_dimmed_by_the_class_the_app_sets` reads `apps/control-app/src/builder/builder.css` (line 38) and regex-matches its text for `.builder-shell--blocked { ... opacity` and `.builder-banner {`. That is a source-inspection assertion: it passes whether or not the class is applied or the rule takes effect. It became AC evidence when the previous fix renamed the former FC file's tests to test_UAT_AC2098_*. The AC's own claims are fully proven by the other five AC-2098 tests, so the fix is to delete this test, or to make it behavioural (inject the stylesheet into jsdom and assert the computed opacity of the blocked shell). It must not stay as source inspection under an AC name.

## Supersession Check (Step 4c)

The result is unchanged and is a PASS. AC-1692 is `superseded` by bundle-fd009b93, as REQ-173 requires. The REQ-178 DOC-42 amendment retracts 'every business lapsed is refused no_entitlement' (AC-1750), but none of the bundle's 13 commits carries it: apps/control-app/src/identity.ts:477 still returns `no_entitlement`. STORY-146 records the divergence and the follow-up under Reconciliation Decisions. Superseding AC-1750 now would leave the bundled behaviour with no AC, so this is recorded, not absorbed.

## Mode Override Audit

3 overrides audited, 0 touched a trust boundary. None misjudged.

| Report | Story | Rule | 1 named files | 2 earlier tests | 3 intent | 4 scope | 5 trust boundary | 6 rung |
|---|---|---|---|---|---|---|---|---|
| report-8ad43fd3 | STORY-141 | code_frozen | pass (production: ai.ts only) | pass (report-387e8531, 227/0) | pass: REQ-173 says the digest instruction is the describer's only system content | pass | pass (false) | pass, rung 2 |
| report-2b2e5e10 | STORY-103 | code_frozen | pass (host-core.ts only) | pass | pass: BUG-46 defines live as an open turn; the fix takes upstream live in place of an undefined .length | pass | pass (false) | pass, rung 2 |
| report-4a2f1de4 | STORY-159 | code_frozen | pass (router.ts only) | pass | pass: REQ-166 says the Worker adopts the capture | pass; no clientDomain passed (REQ-474 is out of scope) | pass (false) | pass, rung 2 |

Item 1 was verified directly: `git diff --stat 06095b4cfb HEAD -- apps tools packages` lists only those three files.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. Page authoring (REQ-175) | STORY-106 | ✓ |
| 2. Accounts & entitlement (REQ-178) | STORY-146 | ✓ |
| 3. Capture to material (REQ-166) | STORY-159 | ✓ (G2 resolved) |
| 4. Library (REQ-166) | STORY-144 | ✓ |
| 5. Conversations (BUG-46) | STORY-103 | ✓ |
| 6. Assistant pane (BUG-46) | STORY-104 | ✓ |
| 7. Material description (REQ-173) | STORY-141 + STORY-140 | ✓ (G1 resolved; G3 is an evidence defect on AC-2098) |

## Judgment Calls

- G1 and G2 from REPORT-7264 are resolved. The new AC-2095 and AC-2096 UATs would fail if the comment were missing, duplicated or unbounded, or if a deep-text hit carried the comment's uid.
- AC-2098 says the 503 refusal comes 'before reading the request's bytes'. No test asserts that ordering directly; the unchanged-holdings assertion proves the observable outcome. I treat this as an internal detail, not a gap.
- G3 is a mechanical failure of the source-inspection rule, not a coverage hole. It is a small fix, but evidence rules are non-negotiable, and the test bears the AC name.
- REQ-178 amendment, STORY-159 gaps 9 and 10, STORY-103 residual eviction risk: unchanged from REPORT-7264, all flagged, not absorbed.

## Verdict

FAIL. The stories faithfully and completely represent the bundle's intent, and the previous gaps G1 and G2 are fixed. One evidence defect remains:

1. **G3:** tests/reconciliation-builder-no-key-banner.test.ts:195 (AC-2098, STORY-140) asserts by regex over builder.css source text. Delete it (AC-2098 is fully proven by the other five tests) or make it behavioural through computed style on the mounted builder. Production code must not change.
