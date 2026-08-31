---
uid: report-e7833a84
id: REPORT-2967
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-21'
created_by: xgd
created_at: '2026-08-31T15:29:17.192246+00:00'
updated_at: '2026-08-31T15:29:17.192246+00:00'
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

Incoming commit `bcedebfb` ("xgd(ticket): update bug bug-db356ff8",
2026-08-23 15:21) appended two sections to the BUG-36 body and bumped
`updated_at` / `last_field_updated: body`:

- `## Production state — confirmed empirically (2026-08-23)` (including the
  `### Interim production patch applied` subsection and its
  `INSERT OR IGNORE INTO tenants ...` SQL)
- `## Second finding — bin/publish --production cannot authenticate as written`

Both sections are present **verbatim** in the HEAD blob — `git diff <theirs>
<ours>` shows them as unchanged context lines, not as removals. This is the
next step in the same ticket's own history as the previous conflict in this
bundle (scope path 27/0, incoming `1524d150`, whose blob `a541a6d9` is this
conflict's merge base), and HEAD already carries the whole chain.

The only per-fact divergences are the ticket's own progress state, where HEAD
is strictly later:

| Fact | Incoming (2026-08-23 22:21Z) | HEAD (2026-08-26 17:36Z) |
|---|---|---|
| `status` | `draft` | `bundled` |
| `last_field_updated` | `body` | `status` |
| `fields` | — | adds `story_points`, `commits`, `version: 0.2.10`, `bundled_in: bundle-78f4e2fe` |
| `## Status` paragraph | "Scope drafted, awaiting operator confirmation before coding." | "Both halves landed and verified", followed by the Approved-scope-addition and Implementation sections |

Per 2e (same field changed differently → later-positioned intent wins per fact),
HEAD wins each of those: it is the later commit by timestamp, and its narrative
records the very work this draft was proposing as having landed
(`fields.commits.working_sha: ea48502d`, `bundled_in: bundle-78f4e2fe`). Taking
the incoming side for those facts would regress the ticket from `bundled` back
to `draft` and delete the implementation record.

No code/implementation files were involved in this conflict, and no BUG-1301
precedence drops were needed.

Note for the finalize step: the staged tree is byte-identical to HEAD
(`git diff --cached HEAD` is empty). This is the redundant-commit case of
STEP 4, not a discard — the incoming commit's key changes are present in HEAD
(via the earlier post-watermark sync of this same ticket), not absent. Per
STEP 4 no `--skip` was issued; the cherry-pick sequencer state is left intact.
