---
uid: report-af46bdbc
id: REPORT-11748
type: report
title: 'Report: blocked_by_handoff for story-d0a8cfad'
created_by: xgd
created_at: '2026-11-09T07:43:18.224320+00:00'
updated_at: '2026-11-09T07:57:37.927352+00:00'
completed_at: null
last_field_updated: ruling
fields:
  report_kind: blocked_by_handoff
  subject_uid: story-d0a8cfad
  rule: code_frozen
  evidence: |-
    I couldn't run `test_UAT_AC688_no_layout_divergence_across_three_engines`: the Firefox and WebKit builds it needs still aren't installed. I made no edits.

    **What I checked:** I listed `~/Library/Caches/ms-playwright`. It holds:
    - `chromium-1228`, `chromium-1234`, `chromium-1243`, `chromium-1248` (plus the matching `chromium_headless_shell-*` builds)
    - `ffmpeg-1011`, `ffmpeg-1013`
    - `firefox-1538`
    - `webkit-2336`

    The test needs `firefox-1532` and `webkit-2311`, and neither is there. The cache is unchanged since the plan was written, so the outcome hasn't changed either.

    **What needs doing:** this is BUG-1695. Run this from a terminal outside the sandbox:

    ```
    pnpm --filter @1stcontact/generate exec playwright install webkit firefox
    ```

    As instructed, I didn't retry the install, which fails in the sandbox with a permission error on `__dirlock`, and I didn't ask for a Playwright version bump. Once both builds are installed, the test can be re-run to get its real result.

    ## Assessment
    ```yaml
    status: stuck
    failures:
      - test: tests/reconciliation-l1-substrate.test.ts::test_UAT_AC688_no_layout_divergence_across_three_engines
        status: stuck
        reason: >
          Required Playwright engine builds firefox-1532 and webkit-2311 are not installed
          (BUG-1695). The cache holds only firefox-1538 and webkit-2336, the same as at plan
          time, so the test was not run.
        evidence: "ls /Users/martin/Library/Caches/ms-playwright → chromium-*, chromium_headless_shell-*, ffmpeg-1011, ffmpeg-1013, firefox-1538, webkit-2336"
        operator_action: "pnpm --filter @1stcontact/generate exec playwright install webkit firefox"
    edits: none
    ```
  proposed_change: '(none stated: the builder made no edits and gave no verdict; see
    evidence)'
  batch_index: 0
  parent_report_uid: report-e67249b4
  anchor_ticket: bundle-0881342c
  ruling: denied
  ruling_reason: 'no valid ruling after a re-plan: the `code_frozen` request cannot
    be declined: blocked_by_ruling.files must list every file the batch edits'
---

# Builder blocked by `code_frozen`

**Evidence**: I couldn't run `test_UAT_AC688_no_layout_divergence_across_three_engines`: the Firefox and WebKit builds it needs still aren't installed. I made no edits.

**What I checked:** I listed `~/Library/Caches/ms-playwright`. It holds:
- `chromium-1228`, `chromium-1234`, `chromium-1243`, `chromium-1248` (plus the matching `chromium_headless_shell-*` builds)
- `ffmpeg-1011`, `ffmpeg-1013`
- `firefox-1538`
- `webkit-2336`

The test needs `firefox-1532` and `webkit-2311`, and neither is there. The cache is unchanged since the plan was written, so the outcome hasn't changed either.

**What needs doing:** this is BUG-1695. Run this from a terminal outside the sandbox:

```
pnpm --filter @1stcontact/generate exec playwright install webkit firefox
```

As instructed, I didn't retry the install, which fails in the sandbox with a permission error on `__dirlock`, and I didn't ask for a Playwright version bump. Once both builds are installed, the test can be re-run to get its real result.

## Assessment
```yaml
status: stuck
failures:
  - test: tests/reconciliation-l1-substrate.test.ts::test_UAT_AC688_no_layout_divergence_across_three_engines
    status: stuck
    reason: >
      Required Playwright engine builds firefox-1532 and webkit-2311 are not installed
      (BUG-1695). The cache holds only firefox-1538 and webkit-2336, the same as at plan
      time, so the test was not run.
    evidence: "ls /Users/martin/Library/Caches/ms-playwright → chromium-*, chromium_headless_shell-*, ffmpeg-1011, ffmpeg-1013, firefox-1538, webkit-2336"
    operator_action: "pnpm --filter @1stcontact/generate exec playwright install webkit firefox"
edits: none
```

**Proposed change**: (none stated: the builder made no edits and gave no verdict; see evidence)

## Ruling: denied

no valid ruling after a re-plan: the `code_frozen` request cannot be declined: blocked_by_ruling.files must list every file the batch edits
