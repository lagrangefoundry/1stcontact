---
uid: report-f2a0e037
id: REPORT-6687
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-32'
created_by: xgd
created_at: '2026-10-25T22:48:20.486984+00:00'
updated_at: '2026-10-25T22:48:20.486984+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-32
---

## Files resolved

- `.xgd/tickets/hot/bug-8dfa60ea.md` (BUG-45): intent/bookkeeping ticket (2e), UU, outside the sparse cone (index-only). Resolved with `git checkout --ours` + `git add --sparse`.
  - Enrichment rule (intent unknown, so take the more recent commit by timestamp): ours `8bee1d92af` (2026-10-25T15:20:55-07:00, seed_local_overlay_batch) is later than incoming `14b3c24e77` (2026-09-01T17:09:27-07:00, "update bug bug-8dfa60ea").
  - 2e superset check: ours is a strict superset. Frontmatter: status `bundled`, `bundled_in: bundle-5607a08d`, `commits` (fd6aa2bf39), `version`, `story_points`, updated_at 2026-10-25. Incoming is still `status: draft` and has none of these fields. Body: the incoming commit's 2026-09-02 rewrite (Symptom, "What the store actually showed", four defects, Behaviour required, Test plan, Not in scope) reappears in ours as the later, evolved version ("Behaviour delivered", Evidence, Regression, both Not-in-scope items, plus a later "Superseded in part by BUG-44" section). No incoming fact is missing from ours.
  - Flagged for post-merge review, as the enrichment rule asks.

## Incoming changes preserved

No code files in this conflict. The incoming body edit is already in HEAD's later version of the ticket, so this commit is redundant and the staged diff against HEAD is empty. Finalize should skip it (BUG-1109/BUG-1122 shape). Nothing was dropped under BUG-1301.
