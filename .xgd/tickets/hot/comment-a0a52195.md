---
uid: comment-a0a52195
id: COMMENT-807
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-07T21:02:10.901594+00:00'
updated_at: '2026-08-07T21:02:10.901594+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-92b9aee8
  kind: note
---

**Result: FAIL** — REPORT-1627 (`report-92b9aee8`), level=uat, 2 violations / 1 warning / 0 needs_review.

**What I checked.** CAP-85 has one story (STORY-99, feature) with 22 active ACs, all tracing to BUNDLE-16 (REQ-117 + REQ-115 + REQ-44, `free_and_reconciled`) — the only intent that has ever touched this tree. I mapped every AC to its `test_UAT_AC<n>_*` test and read both suites in full (`tests/reconciliation-builder-workspace-{chrome,origin}.test.ts`).

**The findings:**

1. **violation / coverage / AC-1029 → uat-add.** No UAT exists at all — grep for `1029` across `tests/`, `apps/`, `packages/`, `tools/` returns zero. The AC was added at 2026-08-07T20:47Z by the preceding `ac`-level cycle and the uat level hasn't caught up. AC-968's test does incidentally hit `setMode('edit')`, but AC-1029's own body explicitly disclaims AC-968/AC-969 as evidence ("deliberately mode-agnostic"). The production code is fine (`apps/control-app/src/builder/app.js:64-69`).

2. **violation / consistency / AC-972 → uat-edit.** The test POSTs `{slug:'beta'}` straight to `/api/publish`; it never publishes *from the workspace*. So the AC's leading clause — "the site currently displayed, not a default" — is untested, and nothing touches `publishAction` (`toolbar.js:196`) where `panel.getSite()` supplies the slug. Notably the behaviour *is* proven elsewhere, by `test_UAT_FC_REQ-115_publish_button_calls_publish_for_the_shown_site` — but that's free-coded and not AC-traceable, so it doesn't discharge the matrix obligation.

3. **warning / consistency / AC-973 → uat-edit.** The divider is never dragged (`setSplit()` is the model setter; no pointer events anywhere in the file) and "renders as a rail" is asserted as `isCollapsed()`. Honestly documented as a jsdom limit, and the reopen-to-previous-width core is proven — hence a warning, not a violation.

**Two things I deliberately did not raise.** The `req115-*`/`req117-*` FC suites duplicate the reconciliation suites nearly test-for-test, but that coexistence is repo-wide convention (47 reconciliation files vs 97 `req*`; DOC-2 itself cites a retained FC suite as canonical), so it's recorded as an observation rather than an exclusivity violation. And I ran the chrome suite — `1 passed | 9 skipped`, because the `@gendevlabs/webui-*` components aren't installed here. That's the coverage gap the story's Technical Context declares explicitly, handled correctly by the suites, so it's ledger context, not a finding. I flagged in the editor notes that the new AC-1029 test must follow the same discipline rather than mocking a panel to get a green run.
