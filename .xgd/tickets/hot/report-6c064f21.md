---
uid: report-6c064f21
id: REPORT-1057
type: report
title: 'Sync-main review: reconcile-BUNDLE-8'
created_by: xgd
created_at: '2026-07-29T06:03:38.623321+00:00'
updated_at: '2026-07-29T06:03:38.623321+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: sync_main_review
  subject_uid: reconcile-BUNDLE-8
---

{
  "findings": [
    {
      "risk": "OK",
      "file": ".xgd/tickets/hot/bundle-cceaba25.md",
      "description": "Sole conflict file, resolved correctly. Main's only change since the old merge-base (c8de67089..208e05117) was adding the fields.orphan_commits key (old_sha 780e0b9d -> new_sha 4020a700). That key is present verbatim at lines 49-51 of the rebased result. Diffing pre-rebase HEAD (a12690beb) against current HEAD for this file shows exactly one hunk: main's orphan_commits addition. So the resolution kept the full branch side AND grafted main's addition on top - neither side's intent was dropped. YAML frontmatter parses cleanly (uid bundle-cceaba25, id BUNDLE-8, status reconciling, 11 commits, auto_merge_back true, priority medium)."
    },
    {
      "risk": "OK",
      "file": "(whole tree)",
      "description": "No semantic reverts are possible in code on this branch. git diff c8de67089 208e05117 (old merge-base -> main) returns exactly ONE path: .xgd/tickets/hot/bundle-cceaba25.md. Main made zero code, test, config, or storage changes since the merge-base, so there is no main-side deletion, rename, value change, or move for the replay to revert. Confirmed independently: git diff a12690beb HEAD (pre-rebase HEAD -> current HEAD) yields only 4 paths - bundle-cceaba25.md plus three ticket artifacts (report-0cb6bd26, comment-95942579, report-ac0d6f55) created by post-rebase workflow commits. Every code file is byte-identical to pre-rebase HEAD, so the 191-commit replay lost nothing and composed consistently."
    },
    {
      "risk": "OK",
      "file": "(briefing)",
      "description": "No unresolved conflict markers. Grepped the full worktree and the HEAD tree for ^<<<<<<<, ^=======, ^>>>>>>> across .py/.yaml/.yml/.ts/.mjs/.json/.md - zero hits. Rebase is finished (no rebase-merge/ or rebase-apply/), worktree is clean, and main is a strict ancestor of HEAD (191 ahead, 0 behind). NOTE for future readers: the briefing's 'Changed Files' section is an INVERTED diff - it lists git diff pre_rebase_HEAD..main, not merge_base..main. Its 25 '(deleted)' entries (tests/bug*.test.ts, tests/req9*.test.ts, tests/reconciliation-*.test.ts, storage/sites/gigabytealchemy/**) are branch ADDITIONS, not main deletions. Verified: git log main -- <path> is empty for those files, i.e. they never existed in main's history, so main could not have deleted them and nothing was resurrected. Applying the briefing's stated deletion-revert procedure literally would produce 25 false CRITICALs."
    }
  ]
}
