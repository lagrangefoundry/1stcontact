---
uid: comment-c8161601
id: COMMENT-5846
type: comment
title: Claude response for fix_reconciliation_review report
created_by: xgd
created_at: '2026-10-30T20:14:18.592794+00:00'
updated_at: '2026-10-30T20:14:18.592794+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-56c0d21d
  kind: note
---

The fixes aren't finished yet: four agents are still working through the rest of the review, and none has reported back. Once they all have, I'll file the completion report.

Done so far:

- **Trust-boundary code fix** in `tools/generate/src/cli/ai/fidelity-core.ts`. Before, `contentBlocksFrom` lost the Toolbox's `<<<untrusted>>>` … `<<</untrusted>>>` frame when it turned a screenshot result back into image blocks. Now the frame is put back around them, so a picture of an untrusted page reaches the model inside the same frame as any other untrusted result. The test for this is part of the fidelity agent's work.
- **AC-1717** now says "which sites it is used on (every one)", to cover a file placed on more than one site.

Still in progress:

1. **Fidelity compare, judge and see.** Make the compare and judge UATs check against the real `1c diff` and `1c gate` (AC-2036/2039/2040). Tighten AC-2035 and add the Worker branch to AC-2024. Create a new trust-boundary AC with a UAT. Update the stale text in story-58b2cec4.
2. **capture_site (G1).** Rewrite the AC-2046/2048/2049/2050 titles to match what the code does and rename the stale UATs. Record the gap against REQ-157 AC6 under Reconciliation Decisions. File one follow-up bug ticket at `draft`. Add the mid-capture refusal assertion to AC-2051.
3. **Assets and library.** Activate AC-2014 and AC-2021 and give them UATs. Tighten the tests for AC-1022, 1018, 1104, 2017, 1725, 2020 and 2019.
4. **Consultant role and `1c serve`.** Tighten AC-2056 and AC-2054. Add a new AC with a UAT for the per-turn reminder wording. Tighten AC-2064. Remove the leftover `serve` entries from the CLI help in `index.ts`, which REQ-177 calls for.

Per the fixer instructions, nobody (me or the agents) is running the test suites; the workflow runs the full suite after this step, so none of the new or changed tests have been run yet. No FC orphan report exists for this bundle, so FC file cleanup isn't part of this pass.

The consultant and `serve` agent has finished. Still waiting on the other three.

The capture_site agent has finished. Its follow-up bug is BUG-315. Two agents are still running: fidelity compare/see and assets/library.

The assets/library agent has finished. One agent is still running: fidelity compare/see, which includes the trust-boundary AC and its test.

I've acted on every finding from the failed review (REPORT-6902), but none of the new or changed tests has been run yet. The instructions said not to run tests, so the workflow's full test run will be their first execution. I filed the completion report as REPORT-6904 with `needs_more_work=false` and `progress_made=true`. During that, something tried to reach `github.com:22` and the sandbox blocked it. The report was still created locally, but it may not have been pushed.

**Production code changes**
- **Trust boundary (the misjudged override):** in `tools/generate/src/cli/ai/fidelity-core.ts`, `contentBlocksFrom` used to drop the untrusted-content frame around screenshot results. It now keeps the frame, so a picture of a third-party page reaches the model marked as untrusted like every other untrusted result. The new AC-2067 covers this, with two UATs: one checks the result the model actually receives, one tests `contentBlocksFrom` directly.
- **`1c serve` straggler:** the two leftover `serve` mentions are gone from the help text in `tools/generate/src/cli/index.ts`.

**Matrix and test changes, by review section**
- **G1, capture_site:**
  - Rewrote the titles of AC-2046, 2048, 2049 and 2050 to match what the code does, and renamed the UATs that had stale names.
  - Recorded the conflict with REQ-157 AC6 under the story's Reconciliation Decisions, and filed the follow-up bug BUG-315 at `draft`.
- **AC-2051 (also G1):** we couldn't make it assert what the review asked. The code never writes a mid-capture refusal's URL into the audit record. The test now asserts what does happen, and the missing journalling is listed in BUG-315 instead.
- **G2:** AC-2014 and AC-2021 are now `active` and have UATs.
- **G3:** tightened the UATs for all the ACs the review named.
  - AC-2036, 2039 and 2040 now compare against the real `1c diff` and `1c gate` on the same bundle.
  - AC-2035 now runs all six operations, including `check_fidelity`.
  - AC-2024 now has a Worker-without-browser case.
  - The rest (AC-2056, 2064, 1022, 1018, 1104, 2017, 1725, 2020, 2019, 2054) are tightened along the lines the review asked for.
- **G4:** new AC-2066 plus a UAT checking the per-turn reminder says "client" and not the old word.
- **G5:** the stale note in story-58b2cec4 is updated. I also fixed the minor AC-1717 wording ("sites", plural).

**Things to look at if the next run fails**
- **Riskiest new tests:** the ones comparing against `1c diff`/`1c gate`, and AC-2035's `check_fidelity` run, which depends on a fake browser returning real values.
- **AC-2017:** no upload produces a site-role file that can't be republished. The test therefore edits the material's ticket and calls `promoteToSiteAsset` directly rather than going through the upload route. A reviewer may object to that.
- **Still outstanding:**
  - A second stale help-text note on story-e15a19ef: `crop` is still listed among the commands that check the installed tree, though REQ-156 says it no longer does.
  - The old first-block-only `rule()` helper in `test_UAT_FC_REQ-176_library_row_and_wording.test.ts`.
  - Known gap 6 on the capture_site story (NOT_FOUND paths unreachable), which BUG-315 doesn't cover.

Code and test edits are uncommitted in the working tree, for the workflow to pick up. The ticket changes committed themselves.
