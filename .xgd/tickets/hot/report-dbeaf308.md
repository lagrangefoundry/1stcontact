---
uid: report-dbeaf308
id: REPORT-2966
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-21'
created_by: xgd
created_at: '2026-08-31T15:28:07.361587+00:00'
updated_at: '2026-08-31T15:28:07.361587+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-21
---

## Files resolved

- `.xgd/tickets/hot/bug-db356ff8.md` — UU, intent/bookkeeping ticket (STEP 2e).
  Resolved to the HEAD side because HEAD is a strict superset of the incoming
  version. Path is outside the sparse-checkout cone, so the conflict existed
  only in the index: resolved with
  `git checkout --ours --ignore-skip-worktree-bits` then `git add --sparse`
  (`--sparse` is not a valid `git checkout` option in this git version;
  `--ignore-skip-worktree-bits` is the equivalent).

## Incoming changes preserved

Incoming commit `1524d150` ("xgd(ticket): update bug bug-db356ff8",
2026-08-23 15:13) fleshed out the BUG-36 draft: it set the title
("control-app: fresh deployment 503s until bin/publish runs, so the builder
never boots"), added `fields.severity: high`, and replaced the `(new ticket)`
placeholder body with the Symptom / Diagnosis / Immediate unblock / Proposed fix
/ Test plan / Status sections.

`git diff <theirs> <ours>` is purely additive from theirs to ours: every line the
incoming commit added is present verbatim in the HEAD blob. The only per-fact
divergence is the ticket's own progress state, where HEAD is the strictly later
side:

| Fact | Incoming (2026-08-23) | HEAD (2026-08-26) |
|---|---|---|
| `status` | `draft` | `bundled` |
| `updated_at` | 2026-08-23T22:13:33Z | 2026-08-26T17:36:27Z |
| `last_field_updated` | `severity` | `status` |
| `fields` | — | adds `story_points`, `commits`, `version: 0.2.10`, `bundled_in: bundle-78f4e2fe` |
| `## Status` section | "Scope drafted, awaiting operator confirmation before coding." | "Both halves landed and verified", plus the Production-state, Second-finding, Approved-scope-addition and Implementation sections |

Per 2e (same field changed differently → later-positioned intent wins per fact),
HEAD wins each of those: it is the later commit by timestamp, and its narrative
records the very work the incoming draft was proposing as having landed
(`fields.commits.working_sha: ea48502d`, `bundled_in: bundle-78f4e2fe`). Taking
the incoming side for those facts would regress the ticket from `bundled` back to
`draft` and delete the implementation record.

No code/implementation files were involved in this conflict, and no BUG-1301
precedence drops were needed.

Note for the finalize step: the staged tree is byte-identical to HEAD
(`git diff --cached HEAD` is empty). This is the redundant-commit case of
STEP 4, not a discard — the incoming commit's key changes are present in HEAD
(via the earlier post-watermark sync of this same ticket), not absent. Per
STEP 4 no `--skip` was issued; the cherry-pick sequencer state is left intact.
