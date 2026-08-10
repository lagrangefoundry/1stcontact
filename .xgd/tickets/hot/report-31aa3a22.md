---
uid: report-31aa3a22
id: REPORT-1816
type: report
title: 'Sync-main review: reconcile-BUG-33'
created_by: xgd
created_at: '2026-08-10T11:41:35.327829+00:00'
updated_at: '2026-08-10T11:41:35.327829+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: sync_main_review
  subject_uid: reconcile-BUG-33
---

{
  "findings": [
    {
      "risk": "LOW",
      "file": "tests/req117-edit-loop-browser.test.ts",
      "description": "Branch commit 30f7fd578 [FREE-CODED] rewrites the explanatory comments main introduced in d4e2d7c98 and renames the local `control` to `input` in the REQ-121 read-off-the-control assertion (also affects tests/req115-builder-composition.test.ts and tests/reconciliation-copy-edit-gesture.test.ts). Behaviour is identical - the `await input.waitFor()` guards, the removal of the `.fields-value` click, the `inputValue()` assertion, and the `link()` re-read function are all preserved. Only main's comment wording is superseded by the branch's. Cosmetic; no regression of main's intent."
    }
  ]
}

Verification notes:
- No `<<<<<<< ` conflict markers in any .py/.yaml/.yml/.ts/.tsx/.js/.json/.md file.
- tests/reconciliation-builder-toolbar-lifetime.test.ts: briefing marked it "(deleted)" but the label is inverted. `git log --all` shows it only ever existed on this branch (26b012db3 pre-rebase, 1f7cdefe0 post-rebase); it is absent from main and from both merge-bases, and main has no deletion commit for it. It is a branch-added UAT for story-e674c60a, not a resurrection.
- Main-side change set since the old merge-base (e00ec9b33..main) contains NO code: only .xgd/tickets/hot/bug-ede1fb8c.md (M), report-65ff3391.md (A), report-f53a5001.md (M). Main's test fix d4e2d7c98 is an ancestor of the old merge-base, so the branch already carried it.
- Semantic-revert checks against d4e2d7c98's intent, all preserved in the worktree: req115 `const link = () => app.toolbar.get('open-new-tab')` re-read function with `link()` at every assertion; copy-edit-gesture `.fields-value` click removed and `await input.waitFor()` added at all three sites; req117 `.fields-value` click removed, `await input.waitFor()` added, and `textContent()` assertion replaced by `inputValue()`.
- package.json: 0.1.34 -> 0.1.35, a forward bump, not a value revert.
- No renames, moves, or symbol removals on the main side to check - main touched no source files.

Verdict: pass. No CRITICAL or HIGH findings.
