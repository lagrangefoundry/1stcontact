---
uid: report-bf2af2aa
id: REPORT-4569
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-20T23:21:30.851880+00:00'
updated_at: '2026-09-20T23:21:30.851880+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/bug-6612c4b7.md` — **UU**, intent/bookkeeping ticket (kind `bug`, STEP 2e). Resolved to **ours** under 2e's "one side a strict superset: keep the superset" rule. Staged with `--sparse` (path is outside the resync branch's sparse-checkout cone, DOC-986 §2/§4.1, so the conflict existed only in the index with no worktree markers).

Per-fact analysis (2e requires fact-level, not whole-file, adjudication):

| Fact | Ours (HEAD `2b85aca40a`) | Theirs (`a9248d6756`) | Resolution |
|---|---|---|---|
| body (all prose sections) | identical | identical | no conflict — see below |
| `status` | `free_and_reconciled` | `free_coded` | ours (later lifecycle state) |
| `updated_at` | `2026-08-31T19:19:36` | `2026-08-24T21:55:26` | ours (later intent) |
| `completed_at` | `2026-08-31T19:19:36` | `null` | ours (superset) |
| `last_field_updated` | `status` | `body` | ours (follows `status` change) |
| `coding_sessions` | 3 entries, `working_sha_history`, `version 0.2.13`, `bundled_in: bundle-78f4e2fe` | 1 entry, `version 0.2.11` | ours (strict superset) |
| trailing newline at EOF | present | absent | ours |

No fact was changed differently-but-incomparably on the two sides, so no
later-positioned-intent tiebreak was needed beyond the timestamps above.

Note on ordering signal: `git log` makes theirs the later *commit*
(21:55:27 vs 21:06:15 UTC on 2026-08-24), and `xgd working-timeline`
agrees. That ordering is not the governing fact here — these are
resync-rewritten commits, and ours carries the strictly later *ledger*
state in-file (`updated_at` 2026-08-31, `completed_at` set, reconciled
and bundled). Taking theirs wholesale on commit timestamp would have
regressed the ticket from `free_and_reconciled` back to `free_coded`,
blanked `completed_at`, and dropped two coding-session SHAs plus the
`bundled_in` link — the exact silent-discard failure BUG-1030 warns
against. The auto-enrichment's "take the more recent commit by
timestamp" rule was therefore applied to the ledger fact, not the
commit header; flagging here for post-merge review as that rule directs.

## Incoming changes preserved

Yes — fully, and verbatim. `git show a9248d6756 -- .xgd/tickets/hot/bug-6612c4b7.md`
shows the commit's substantive payload is a single body rewrite:
`## Still outstanding (not in this ticket)` replaced by
`## Observability — added here` plus a new `## Deployment` section.

Every line of that payload is already present byte-for-byte in the
resolved file (lines 142–169), confirmed individually:

- `## Observability — added here` heading — present
- `head_sampling_rate = 1` / inheritable-list rationale paragraph — present
- `[env.production.observability]`-before-`routes` TOML-table hazard paragraph — present
- `test_UAT_FC_BUG-37_the_production_route_survives_the_new_table` reference — present
- `Verified with wrangler deploy --env production --dry-run.` — present
- `## Deployment` section (redeploy required; `dist/` is evidence, not input) — present
- `## Still outstanding (not in this ticket)` — correctly absent (removed, as theirs intends)

A direct diff of the two sides' post-frontmatter bodies yields no hunks;
the only differences between ours and theirs are the frontmatter fields
tabulated above plus the EOF newline. Nothing incoming was discarded, so
the BUG-1301 PRECEDENCE exception was not invoked and no hunk was dropped.

No UAT test file was touched by this conflict. The one UAT function name
appearing above is prose inside the ticket body referencing a test that
lives elsewhere — no test function was added, modified, or deleted here,
so STEP 2f is not implicated.

## Staging state

`git status --porcelain` is empty and `git ls-files -u` reports no
unmerged entries. Because the resolution equals HEAD, `git diff --cached
HEAD` is also empty — this cherry-pick is a no-op whose body edit already
landed in HEAD via `2b85aca40a`. Per STEP 4 this was staged and left
alone: `--skip`/`--continue`/`--quit`/`--abort` were NOT called, and
`CHERRY_PICK_HEAD` (`a9248d6756…`) remains present for the finalize step,
which will detect the clean staged diff and skip the commit.
