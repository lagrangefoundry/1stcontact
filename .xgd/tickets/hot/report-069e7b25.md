---
uid: report-069e7b25
id: REPORT-5381
type: report
title: 'Resync resolve conflicts: 6ba006de764d843fa7f4357df2b341e72f20e2f6'
created_by: xgd
created_at: '2026-09-28T22:13:25.247078+00:00'
updated_at: '2026-09-28T22:13:25.247078+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-439cd0c8.md` — **UU**, class 2e (intent/bookkeeping
  ticket). Incoming commit `33e3d1d4aa` ("xgd(ticket): update request
  request-439cd0c8"). Resolved by taking **ours** verbatim (blob
  `a8c14c1e9b0a39ba3b2218d64a4515bd38a951a9`), because ours is a strict
  superset of theirs — 2e's "one side a strict superset: keep the superset."

  Per-fact comparison against merge base `deaeda92`:

  | fact | ours | theirs |
  |---|---|---|
  | `status` | `bundled` | `free_coded` |
  | `updated_at` | 2026-09-09T21:32:49 | 2026-08-31T23:39:02 |
  | `last_field_updated` | `status` | `status` |
  | `fields.commits[0].working_sha` | `d99c1f43…` | `d99c1f43…` (identical) |
  | `fields.version` | `0.2.24` | `0.2.24` (identical) |
  | `fields.bundled_in` | `bundle-87be4669` | *absent* |
  | body `## Resolved after implementation (2026-08-31)` (~45 lines) | present | *absent* |
  | trailing newline | present | **removed** |

  Both sides edited the same facts (`status`, `updated_at`,
  `last_field_updated`), so the later-positioned intent governs per 2e.
  Ours is later on every contested fact and additionally carries
  `bundled_in` plus the substantive body section. Theirs contributes no
  unique content: its `commits`/`version` additions are byte-identical to
  ours, and its only other delta is dropping the file's trailing newline —
  a regression, not content. No composition was required; nothing from
  theirs was discarded.

  Lifecycle sanity check: theirs is the earlier `free_coding → free_coded`
  transition; ours already advanced past it to `bundled`. Replaying the
  ledger chronologically lands on ours.

## Incoming changes preserved

No code/implementation files were in conflict — the sole conflicted path is
an intent/bookkeeping ticket (class 2e), so STEP 3's `git show $CPHEAD --
<file>` verification applies only to that ticket. Verified: every field the
incoming commit introduced (`fields.commits`, `fields.version`, and the
`status`/`last_field_updated` transition) is present in the resolved
version. The incoming `status: free_coded` value itself is superseded by
ours (`bundled`) rather than dropped — that is the intended per-fact
timeline outcome, not a discarded change.

No hunks were dropped under the BUG-1301 precedence exception; it was not
invoked. No UAT test files were touched.

## Resolution mechanics

`.xgd/tickets/**` is outside this worktree's sparse-checkout cone
(`/*`, `!/.xgd/tickets/`, `!/.xgd/tickets/**`), so the conflict existed only
in the index with no working-tree markers to edit. Staged via
`git update-index --cacheinfo 100644,a8c14c1e…,<path>` against the ours
blob, then materialised with `git checkout-index -f` so `git status` reads
clean. `CHERRY_PICK_HEAD` (`33e3d1d4aa`) left intact; no
`--continue`/`--skip`/`--quit`/`--abort` issued.

## Notes for the next step

1. **This pick resolves to an empty diff.** `git diff --cached HEAD` is
   empty: HEAD already contained the `bundled` state, so choosing ours
   collapses the pick to a no-op. Per STEP 4 this is staged and exited
   `@done` as-is; finalize should detect the clean staged diff and skip the
   commit.
2. **`skip-worktree` bit not restored.** All sibling ticket files carry `S`;
   this one is now `H`, because resolution cleared the bit.
   `git update-index --skip-worktree` was denied by the sandbox. Harmless
   for the pick, but the file will read as dirty where siblings stay quiet
   if xgd rewrites it in place.
