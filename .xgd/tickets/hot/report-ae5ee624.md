---
uid: report-ae5ee624
id: REPORT-11744
type: report
title: 'Report: blocked_by_handoff for story-d0a8cfad'
created_by: xgd
created_at: '2026-11-09T07:38:24.583629+00:00'
updated_at: '2026-11-09T07:38:24.583629+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: blocked_by_handoff
  subject_uid: story-d0a8cfad
  rule: code_frozen
  evidence: |-
    I made no edits and did not run the test, so `test_UAT_AC688_no_layout_divergence_across_three_engines` stays failing: the Firefox and WebKit builds it needs are not installed. This is still BUG-1695.

    - **Required:** playwright-core 1.61.1 (`node_modules/.pnpm/playwright-core@1.61.1/.../browsers.json`) needs `firefox-1532` and `webkit-2311`. This machine runs Darwin 25, so the mac14 WebKit build (`2251`) doesn't apply.
    - **Installed:** `~/Library/Caches/ms-playwright` has `firefox-1538` and `webkit-2336`, which are newer builds for a different Playwright release. Neither required build is there. Chromium `1228` is present.
    - **Not run:** the planner said to run the test only if both builds were present. It also can't run in this session, because browsers can't launch inside the sandbox.

    I didn't retry the install (it failed earlier with EPERM on `__dirlock`) or ask for a Playwright upgrade.

    To fix it, run this from a terminal outside the sandbox:
    ```
    pnpm --filter @1stcontact/generate exec playwright install webkit firefox
    ```
    Then re-run `test_UAT_AC688_no_layout_divergence_across_three_engines` through the validation gate.

    ```yaml
    ## Assessment
    status: stuck
    blocked_by:
      rule: environment (BUG-1695) — not a mode rule
      evidence: "ls ~/Library/Caches/ms-playwright shows firefox-1538 and webkit-2336 only; playwright-core@1.61.1 browsers.json requires firefox revision 1532 and webkit revision 2311 (no revisionOverride applies on Darwin 25). Browser tests also cannot launch in this sandbox."
      proposed_change: "No code or test change. Operator action: `pnpm --filter @1stcontact/generate exec playwright install webkit firefox` from a terminal, then re-run test_UAT_AC688_no_layout_divergence_across_three_engines via the validation gate."
    ```
  proposed_change: '(none stated: the builder made no edits and gave no verdict; see
    evidence)'
  batch_index: 0
  parent_report_uid: report-35a5eb9d
  anchor_ticket: bundle-0881342c
---

# Builder blocked by `code_frozen`

**Evidence**: I made no edits and did not run the test, so `test_UAT_AC688_no_layout_divergence_across_three_engines` stays failing: the Firefox and WebKit builds it needs are not installed. This is still BUG-1695.

- **Required:** playwright-core 1.61.1 (`node_modules/.pnpm/playwright-core@1.61.1/.../browsers.json`) needs `firefox-1532` and `webkit-2311`. This machine runs Darwin 25, so the mac14 WebKit build (`2251`) doesn't apply.
- **Installed:** `~/Library/Caches/ms-playwright` has `firefox-1538` and `webkit-2336`, which are newer builds for a different Playwright release. Neither required build is there. Chromium `1228` is present.
- **Not run:** the planner said to run the test only if both builds were present. It also can't run in this session, because browsers can't launch inside the sandbox.

I didn't retry the install (it failed earlier with EPERM on `__dirlock`) or ask for a Playwright upgrade.

To fix it, run this from a terminal outside the sandbox:
```
pnpm --filter @1stcontact/generate exec playwright install webkit firefox
```
Then re-run `test_UAT_AC688_no_layout_divergence_across_three_engines` through the validation gate.

```yaml
## Assessment
status: stuck
blocked_by:
  rule: environment (BUG-1695) — not a mode rule
  evidence: "ls ~/Library/Caches/ms-playwright shows firefox-1538 and webkit-2336 only; playwright-core@1.61.1 browsers.json requires firefox revision 1532 and webkit revision 2311 (no revisionOverride applies on Darwin 25). Browser tests also cannot launch in this sandbox."
  proposed_change: "No code or test change. Operator action: `pnpm --filter @1stcontact/generate exec playwright install webkit firefox` from a terminal, then re-run test_UAT_AC688_no_layout_divergence_across_three_engines via the validation gate."
```

**Proposed change**: (none stated: the builder made no edits and gave no verdict; see evidence)
