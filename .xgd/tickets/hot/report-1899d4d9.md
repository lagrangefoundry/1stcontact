---
uid: report-1899d4d9
id: REPORT-7485
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T07:33:08.970542+00:00'
updated_at: '2026-11-01T07:33:08.970542+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/request-b813aa4a.md` (REQ-179). UU, intent/bookkeeping ticket (request, rule 2e), outside the sparse cone (no working-tree markers). Resolved to the HEAD (ours) blob `4fcc0134b8`, written into the index and kept skip-worktree. **Flagged for post-merge review** per the enrichment rule.
  - Rule 2e, strict superset: running `git diff` of incoming blob `14755bcaa7` against HEAD blob `4fcc0134b8` shows HEAD has only additions. HEAD contains the incoming commit's whole body amendment word for word: the section "Reopened 2026-09-04: the switcher must render for a lapsed account ([[DOC-42]])". HEAD then adds the later "Implementation delta" and "Acceptance, in test terms" subsections.
  - The frontmatter differs only in facts HEAD advanced later: `updated_at` 2026-11-01, `status: bundled` (incoming: `draft`), `last_field_updated: status`, `story_points: 4`, a second commit entry (`5bace72f8a`), `version: 0.2.69` (incoming: `0.2.61`), `depends_on: [REQ-178]` and `bundled_in: bundle-94dbe947`.
  - Enrichment rule (intent unknown, so take the more recent commit by timestamp): the HEAD side is 756eaf4a54 (2026-10-31, seed_local_overlay_batch). It is newer than incoming 2b1d448186 (2026-09-04). This gives the same answer as the superset rule.

## Incoming changes preserved

Every incoming change is present. The incoming commit's only content change (the appended "Reopened 2026-09-04" section) is in the resolved file unchanged. The incoming `status: draft` / `version: 0.2.61` / `updated_at` values were later moved forward on HEAD as part of the ticket's lifecycle. They have been superseded, not discarded. The resolution matches HEAD exactly (no staged diff), so this commit is redundant (BUG-1109/BUG-1122 shape), not discarded. Finalize can skip the commit.

The unstaged `.xgd/_changes/log.ndjson` / `meta.json` changes and the untracked `.xgd/tickets/hot/report-bf816cff.md` were already there before this resolution. They are not part of the conflict and were left alone.
