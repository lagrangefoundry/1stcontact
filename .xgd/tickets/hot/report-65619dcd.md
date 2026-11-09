---
uid: report-65619dcd
id: REPORT-11734
type: report
title: 'Report: blocked_by_handoff for story-d0a8cfad'
created_by: xgd
created_at: '2026-11-09T07:11:01.358410+00:00'
updated_at: '2026-11-09T07:11:01.358410+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: blocked_by_handoff
  subject_uid: story-d0a8cfad
  rule: code_frozen
  evidence: |-
    I couldn't fix this one: the sandbox blocked the browser install, so AC-688 is still skipped, not run and passing.

    The planner's install command was refused:

    ```
    $ pnpm --filter @1stcontact/generate exec playwright install webkit firefox
    Failed to install browsers
    Error: EPERM: operation not permitted, mkdir '/Users/martin/Library/Caches/ms-playwright/__dirlock'
    [ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL] Command failed with exit code 1: playwright install webkit firefox
    ```

    Playwright has to write to its shared browser cache at `~/Library/Caches/ms-playwright`, and that folder is outside the paths this sandbox may write to. Without the webkit and firefox builds that match the pinned Playwright 1.61.1, `test_UAT_AC688_no_layout_divergence_across_three_engines` can't run.

    **Nothing changed.** The test, the code and the Playwright pin are as they were, and I didn't edit the ACs or the story, since the test itself is correct for AC-688. The planner allowed one optional edit: making the skip name which engine failed to launch. I left it out because it is cosmetic, and changing a skip's wording risks tripping the skip-marker check (BUG-1637).

    **What you need to do:** run this outside the sandbox, from the repo root:

    ```
    pnpm --filter @1stcontact/generate exec playwright install webkit firefox
    ```

    Then re-run the AC688 test; it should run instead of skip. As a browser test it only runs at the validation gate or from your terminal.

    ## Assessment
    status: stuck
    reason: "sandbox_refusal"
    evidence: "`pnpm --filter @1stcontact/generate exec playwright install webkit firefox` → `Error: EPERM: operation not permitted, mkdir '/Users/martin/Library/Caches/ms-playwright/__dirlock'` (exit 1)"
    operator_action: "Run `pnpm --filter @1stcontact/generate exec playwright install webkit firefox` outside the sandbox, then re-run the gate for test_UAT_AC688_no_layout_divergence_across_three_engines."
    files_changed: []
  proposed_change: '(none stated: the builder made no edits and gave no verdict; see
    evidence)'
  batch_index: 0
  parent_report_uid: report-7526f59b
  anchor_ticket: bundle-0881342c
---

# Builder blocked by `code_frozen`

**Evidence**: I couldn't fix this one: the sandbox blocked the browser install, so AC-688 is still skipped, not run and passing.

The planner's install command was refused:

```
$ pnpm --filter @1stcontact/generate exec playwright install webkit firefox
Failed to install browsers
Error: EPERM: operation not permitted, mkdir '/Users/martin/Library/Caches/ms-playwright/__dirlock'
[ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL] Command failed with exit code 1: playwright install webkit firefox
```

Playwright has to write to its shared browser cache at `~/Library/Caches/ms-playwright`, and that folder is outside the paths this sandbox may write to. Without the webkit and firefox builds that match the pinned Playwright 1.61.1, `test_UAT_AC688_no_layout_divergence_across_three_engines` can't run.

**Nothing changed.** The test, the code and the Playwright pin are as they were, and I didn't edit the ACs or the story, since the test itself is correct for AC-688. The planner allowed one optional edit: making the skip name which engine failed to launch. I left it out because it is cosmetic, and changing a skip's wording risks tripping the skip-marker check (BUG-1637).

**What you need to do:** run this outside the sandbox, from the repo root:

```
pnpm --filter @1stcontact/generate exec playwright install webkit firefox
```

Then re-run the AC688 test; it should run instead of skip. As a browser test it only runs at the validation gate or from your terminal.

## Assessment
status: stuck
reason: "sandbox_refusal"
evidence: "`pnpm --filter @1stcontact/generate exec playwright install webkit firefox` → `Error: EPERM: operation not permitted, mkdir '/Users/martin/Library/Caches/ms-playwright/__dirlock'` (exit 1)"
operator_action: "Run `pnpm --filter @1stcontact/generate exec playwright install webkit firefox` outside the sandbox, then re-run the gate for test_UAT_AC688_no_layout_divergence_across_three_engines."
files_changed: []

**Proposed change**: (none stated: the builder made no edits and gave no verdict; see evidence)
