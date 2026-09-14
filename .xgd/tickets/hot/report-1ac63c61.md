---
uid: report-1ac63c61
id: REPORT-4272
type: report
title: 'Sync-main review: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-14T10:27:22.168679+00:00'
updated_at: '2026-09-14T10:27:22.168679+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: sync_main_review
  subject_uid: reconcile-BUNDLE-27
---

{
  "findings": [
    {
      "risk": "OK",
      "file": ".xgd/tickets/hot/request-51514090.md",
      "description": "Main's only content change since the merge-base (b5b8f4c7af..55ee7052) was a purely additive `commits:` block in this ticket's frontmatter. Verified byte-identical and fully present at HEAD (lines 20-32). No deletion, rename, or value change on main to revert."
    },
    {
      "risk": "OK",
      "file": "tools/generate/src/store/reference-store.ts",
      "description": "Briefing direction artifact, NOT a deletion revert. All 54 entries the briefing marks (deleted) appear as A (added) in `git diff main HEAD`, which superficially matches the resurrection signature. Verified they are branch-authored additions: `git log main -- <paths>` returns empty for every one of them (reference-store/fs/memory/r2, cli/png.ts, cli/perceptual-core.ts, session-delta.ts, session-knowledge.ts, builder/markdown.js, builder/reader.js, tests/fixtures/png/*, tests/support/* contracts, and the REQ-155/156/160/172 and BUG-41/43 UATs). A control query on paths main does own (apps/control-app/src/ai.ts, cli/perceptual.ts) returns history, confirming the empty results are genuine and not a pathspec false negative. Main never held these files, so it cannot have deleted them; the briefing computed its diff in the branch->main direction, rendering branch-only files as (deleted)."
    }
  ]
}

## Verification basis

- Conflict markers: none. Swept every tracked file (not only .py/.yaml/.yml) for '^<<<<<<< ' and '^>>>>>>> ' - clean.
- Semantic reverts: structurally impossible. `git diff --name-status b5b8f4c7af 55ee7052` shows main's entire delta since the merge-base is two files: .xgd/config.yaml and .xgd/tickets/hot/request-51514090.md. Main made zero source changes, so there is no source-side intent to revert. config.yaml is byte-identical to main at HEAD (correct - main-only per REQ-709); the ticket's added commits block is intact.
- Over-aggressive conflict resolution / integration inconsistency: `git diff --stat 25ca06acd4 HEAD -- ':(exclude).xgd'` is empty - the branch's source tree is byte-identical pre- and post-rebase, so nothing was dropped from either side. The .xgd delta is exactly main's two files plus three tickets created by post-rebase workflow steps (comment-3462714e, report-cdef079b, report-d54c901d).
- Briefing had no conflict files and strict-advance reported no failures; both independently corroborated above.
