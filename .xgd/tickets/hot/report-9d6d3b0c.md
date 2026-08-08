---
uid: report-9d6d3b0c
id: REPORT-1693
type: report
title: 'Sync-main review: branch-BUG-32'
created_by: xgd
created_at: '2026-08-08T01:27:30.476435+00:00'
updated_at: '2026-08-08T01:27:30.476435+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: sync_main_review
  subject_uid: branch-BUG-32
---

{
  "findings": [
    {
      "risk": "LOW",
      "file": "tests/reconciliation-builder-workspace-mounted.test.ts",
      "description": "Sync-introduced scope-literal inconsistency, already remediated in the worktree but NOT yet committed. This branch's whole purpose (AC960) is that the component scope is written in exactly one place (WEBUI_SCOPE), with no superseded '@gendevlabs' literal in any tracked file. Main added this file (and modified tests/req118-image-selection.test.ts) after the branch performed its rename, so the replay legitimately brought in two doc-comment '@gendevlabs' references the branch had never seen. Committed HEAD still carries them (HEAD:tests/reconciliation-builder-workspace-mounted.test.ts:6 and HEAD:tests/req118-image-selection.test.ts:370); the working tree has uncommitted edits removing both. The branch's own tree guard passes only because trackedHits() prefers working-tree content for materialised files - against a clean checkout of HEAD it would fail. Not a regression of main's intent (both edits are comment-only prose, no behaviour change), and the next step (sync_main_commit) commits the worktree, which resolves it. Flagged so that commit is confirmed to include both files."
    },
    {
      "risk": "OK",
      "file": "index.html",
      "description": "Investigated as a suspected revert of main's intent and CLEARED. Main added index.html at 76992a05d; the branch deletes it at 0f308ea96 (coding_green), so it is absent from HEAD while present in main. This is deliberate, evidenced branch intent, not a semantic revert: the file carried a hardcoded importmap naming the superseded '@gendevlabs' scope, i.e. a second definition site that AC960 forbids. tests/bug32-webui-scope-rebrand.test.ts:180 documents the deletion explicitly ('a committed copy of the generator's output is itself a second definition site'). Nothing reads it - every remaining 'index.html' reference in the tree is generated site output under an outDir, not the repo root."
    },
    {
      "risk": "OK",
      "file": "tools/generate/src/cli/builder.ts",
      "description": "Conflict file, resolution verified sound; main's [FREE-CODED] work survives. Main carries fa124bf5a 'close the last cacheable response on the origin [FREE-CODED]' and 2aff9ffa3 'image selection through the copy edit loop [FREE-CODED]'. The branch removes the per-route 'cache-control' literals (including the one fa124bf5a added to the shell) but replaces them with a single res.setHeader('cache-control', NO_STORE) before routing, which Node merges into every subsequent writeHead - a superset of main's coverage, closing the json() hole main's version still had. NO_STORE was moved, not deleted (now exported from serve.ts:103). Route table is identical between main and HEAD (9 declared routes, same order and predicates), so no route or handler was dropped."
    },
    {
      "risk": "OK",
      "file": "tests/bug32-webui-scope-rebrand.test.ts",
      "description": "Briefing lists this as '(deleted)' by main, which would make its presence a resurrection of dead code. Verified NOT the case: the path has never existed in main's history (git log --diff-filter=AD main -- <path> is empty; git cat-file -e main:<path> fails). It is the branch's own new UAT, created at 998e41819 (coding_red). The briefing entry is stale/mislabelled."
    },
    {
      "risk": "OK",
      "file": "tests/reconciliation-builder-workspace-origin.test.ts",
      "description": "Conflict file, no over-aggressive resolution found. The branch replaces main's hand-maintained probe list for AC-977 with a structural one derived from the origin's own routing table, and both sides' intent survives: every route main probed is still probed, plus the JSON class main's version had no probe for at all. The one narrowing is that main's successful GET /api/copy?slug=alpha&page=home&path=0 probe is now only exercised in its 400 shapes - immaterial, since cache-control no longer varies by response path (it is set once before routing) and the route is still covered. Change originates in branch commit e7f23ecbe (fix_review), not in the conflict resolution."
    },
    {
      "risk": "OK",
      "file": ".",
      "description": "No unresolved conflict markers in any tracked file (.py/.yaml/.yml/.ts/.mts/.js/.html/.json/.md all clean), no .orig/.rej/.BACKUP debris, no stray untracked files, no rebase-merge/ or rebase-apply/ directory. Merge-base equals main HEAD (10e848c45), so the branch is fully replayed on top of main with nothing outstanding from main. Executable confirmation: the 5 affected suites (bug32-webui-scope-rebrand, reconciliation-builder-workspace-origin, reconciliation-builder-workspace-mounted, req118-image-selection, req117-edit-loop) run 34 tests, all passing."
    }
  ]
}
