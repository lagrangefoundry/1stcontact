---
uid: report-801212cd
id: REPORT-1430
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-08-06T19:13:45.431340+00:00'
updated_at: '2026-08-06T19:13:45.431340+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-66115f6b
---

All 9 UATs pass, no runtime code was modified.

## Verification performed

Rather than accept a first-run green as proof, I ran three targeted mutations against the implementation and confirmed each is caught by exactly the right test (runtime code restored afterwards — `git diff` is empty):

| Mutation | Expected failure | Observed |
|---|---|---|
| Disable the mapping in both halves | all mapping ACs | 8 failed, AC-917 correctly still passed (it is the "nothing that resolved before moves" invariant) |
| Remove only the trailing-slash exclusion | AC-921 | AC-921 alone failed |
| Examine the whole path for a dot instead of the last segment | AC-918 | AC-918 alone failed |

Both halves are driven at the real boundary: local preview over the server's loopback address (and over a **raw socket** for traversal, since `fetch` normalises `..` before a byte leaves the client — the encoded-only version would have been a weaker test), and the deployed half through the Worker's real entry point over bytes a real `1c deploy` wrote. The `FakeBucket` records read keys, so "the mapping is a last resort" and "a rejected URL is never offered a page candidate" are observed as facts about which lookups happened, not inferred from status codes.

## Two things worth flagging

**Pre-existing failures on this branch, unrelated to this story.** The full suite has 7 failures across `reconciliation-l1-navigation`, `reconciliation-l1-control-and-texture`, and `reconciliation-l1-shared-axis-groups`. I verified these reproduce identically with my file removed — they come from earlier plan items in this bundle, not from this work.

**Typecheck.** My file produces exactly two `tsc` errors under `tsconfig.base.json` — `R2Bucket` and `ExecutionContext` at the binding cast. These are identical in kind and location to the ones `reconciliation-serve-deployed-snapshot.test.ts` and `req113-worker-extensionless-urls.test.ts` already produce (Workers globals aren't in that base config; the tree has 269 such errors and the real build is per-package `pnpm -r build`). I matched the established sibling pattern rather than introducing a new one.

I did not touch the two `test_UAT_FC_REQ-113_*` files — under the FC orphan invariant, renaming or deleting those is the reconciliation review's job, not this step's.

```
UATs generated for story story-66115f6b (plan item 5 of 5)

Story: story-66115f6b
Test file(s) created:
  - tests/reconciliation-clean-page-urls.test.ts

Tests written: 9
Tests passed: 9
Tests failed: 0

test_files_created:
  - "tests/reconciliation-clean-page-urls.test.ts"
```

| AC | Test |
|---|---|
| AC-915 | `test_UAT_AC915_local_preview_serves_a_slug_only_page_url_as_html` |
| AC-916 | `test_UAT_AC916_deployed_site_serves_the_slug_only_url_on_both_forms_and_for_head` |
| AC-917 | `test_UAT_AC917_an_exact_match_always_wins_in_both_environments` |
| AC-918 | `test_UAT_AC918_only_the_last_segment_decides_eligibility` |
| AC-919 | `test_UAT_AC919_a_slug_only_url_with_no_page_behind_it_still_returns_not_found` |
| AC-920 | `test_UAT_AC920_a_mapped_response_is_typed_from_the_page_that_answered` |
| AC-921 | `test_UAT_AC921_a_page_has_one_clean_url_and_it_is_the_slash_free_one` |
| AC-922 | `test_UAT_AC922_local_preview_confinement_is_unchanged_by_the_mapping` |
| AC-923 | `test_UAT_AC923_a_url_the_address_grammar_rejects_never_reaches_the_mapping` |
