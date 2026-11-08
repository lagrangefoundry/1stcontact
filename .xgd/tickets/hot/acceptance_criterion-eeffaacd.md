---
uid: acceptance_criterion-eeffaacd
id: AC-2453
type: acceptance_criterion
title: The fidelity measure and round-trip agree with the fold, so a rejoined flow
  reports no phantom unmatched runs
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T13:28:31.457901+00:00'
updated_at: '2026-11-08T13:28:31.457901+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-1e340c9a
  kind: behavior
  regression_only: false
---

## Criterion
The fidelity oracle counts a flow the fold rejoined as exactly one element, and a flow the fold declined to rejoin as exactly as many elements as the fold emits nodes for it. The round-trip expected manifest projects one element per run of a multi-run node. As a result, a page with an emphasised word scores no extra `unmatched` entries attributable to its runs.

## Verification
For a capture with one varying flow and one non-varying flow, assert the oracle's element count for each matches the fold's node count; run the round-trip on a multi-run heading and assert its runs match with zero unmatched.
