---
uid: bug-4bf3a33b
id: BUG-29
type: bug
title: 'Ticket store: repair stale fields.commits SHAs from resync rebase drift'
created_by: xgd
created_at: '2026-07-28T17:26:37.106511+00:00'
updated_at: '2026-07-29T03:28:09.043197+00:00'
completed_at: null
last_field_updated: body
status: fixed
fields:
  severity: high
  auto_merge_back: true
  needs_review: false
  priority: medium
---

## Symptom

Operator report: after `xgd resync run` executed in this project (version
0.14.1448), "all the intent tickets turned purple" on the dashboard's
"Next cycle" reconcile tile.

Root cause diagnosed and fixed upstream in xgendev's own repo (BUG-875,
building on the stranded BUG-864 fix): `resync`'s SHA-remap ticket writers
(`sha_remap.update_ticket_commits`, `resync/remap_commits.rewrite_open_tickets_commits`)
were not scoped to the explicit repo root — every `ticketing.list()`/
`ticketing.update()` call fell back to ambient project-root resolution,
and resync's per-commit cherry-pick loop was also live-writing
`reconcile_sha` per commit (unintended for resync). Together this caused
`fields.commits` in this project's tickets to go stale/wrong after the
resync rebase.

This ticket tracks the same BUG-868-style *data repair* pass for this
project's ticket store (as opposed to the xgendev code fix itself, which
lives upstream and takes effect here only after the operator's `xgd`
install is rebuilt from a fixed xgd-working).

## Scope (surveyed 2026-07-28)

`find_commit_orphaned_intents()` / `find_stale_commit_intents()`
(xgendev's `bundle_preview.py`) against this repo:
- **0 orphaned** (SHA doesn't exist as a git object at all)
- **46 stale** (SHA exists as a git object but unreachable from
  `main`/`xgd-working` — i.e. re-authored by the resync rebase, not lost)

## Remediation plan

For each of the 46 tickets: resolve the old (unreachable) SHA's commit
message, search `main`/`xgd-working` history for the re-authored
equivalent commit (same content, different SHA post-rebase), repoint
`fields.commits` to the reachable SHA, and correct `status` if the fix's
actual landing point (main vs. xgd-working-only) warrants it. Anything
that can't be matched with confidence gets flagged explicitly, not
guessed.

## Test plan

N/A — ticket-data repair only, via the ticketing API. No source code
changes in this project as part of this ticket.


## Repair completed (2026-07-28)

Resolved all 46 stale tickets (0 were fully orphaned). For every `fields.commits`
entry: resolved the old (unreachable, resync-rebased-away) SHA's exact commit
message, matched it against a single unambiguous commit reachable from `main`
and/or `xgd-working`, and repointed `working_sha`/`main_sha` accordingly.
`reconcile_sha` was cleared to `null` on every entry — cross-checked against
each ticket's own pre-repair (corrupted) `reconcile_sha` value first: 38 of the
46 entries that had one already held exactly the same SHA my independent
git-log matching computed as the correct `working_sha` (0 disagreements) —
direct confirmation of the root cause (BUG-875 upstream): resync's per-commit
loop was live-writing the rebased SHA into `reconcile_sha` instead of leaving
that to an actual reconcile.

Two entries needed manual resolution (message-matching alone was insufficient):
- **REQ-94** (`request-16253634`): `fields.commits` pointed at a ticket-only
  bookkeeping commit (`fc8ee995b`, "xgd(ticket): update request
  request-16253634"), not code. Its immediate parent commit
  (`bb7bf22be`, "feat(gate): reconcile l1-gate, values-diff and perceptual
  diff") was the actual fix; found its re-authored equivalent
  (`34f0b80d6`, reachable on `xgd-working`) and pointed there instead.
- **REQ-36** (`request-d05379d0`): one of its 27 commit-list entries
  (`1b560dec5`) was likewise a ticket-only bookkeeping commit with no code
  of its own — its adjacent real commit (`bd6988a67` → `70a6cf8e6`) was
  already separately tracked elsewhere in the same ticket's list, so this
  entry was dropped rather than duplicated.

Verified via `find_commit_orphaned_intents`/`find_stale_commit_intents`
(xgendev's `bundle_preview.py`): 62 → down to 0 orphaned. Stale count 46 → 11 —
the remaining 11 are tickets whose commits are now confirmed reachable on
**both** `main` and `xgd-working` (fully landed), so they no longer show up
as *incorrect* data — `find_stale_commit_intents` still flags them only
because their `status` (10x `bundled`, 1x `draft`) doesn't reflect that they
already reconciled. That is a status-correction question, out of scope for
"fix the mislabeled commits" — flagged separately, not acted on here pending
operator direction: request-d05379d0, request-105ad942, request-bec9d101,
request-52fc5c06, request-dfc95a22, request-94c792c0, request-87dc7504,
request-807a7b1d, request-56d62b72, request-f243b6b9, request-58e96ad1.

No source code changed in this project as part of this ticket — ticket-data
repair only, via the ticketing API (`worktree_ticket_context`-scoped writes,
`bump_updated_at=False` label-only re-binds, matching `remap_commits.py`
convention).


## BUNDLE-5 status repair (2026-07-28)

Confirmed via `xgd/merged/BUNDLE-5` tag (reachable from `main`, dated
2026-07-13): the bundle's code genuinely merged successfully two weeks ago.
Comparison against BUNDLE-1/3/4 (correctly `free_and_reconciled`, members
too) showed BUNDLE-5 was the only one stuck at `ready_to_reconcile` with
members at `bundled` — its ticket file's last write was 11:42:28 on
2026-07-13, *before* the merge completed at 15:06:44 that day. The
post-merge status-update step never ran for this bundle. Pre-existing
incident from 2026-07-13, unrelated to the recent resync — surfaced by
the commits repair, not caused by it.

Fixed: repointed BUNDLE-5's own `fields.commits` (same message-matching
method as the 46), and set `status=free_and_reconciled` on BUNDLE-5 and its
7 members (REQ-51..REQ-57).

Stale count 11 → 4: REQ-36 (request-d05379d0, under active discussion with
operator — may not be a bug) and 3 tickets belonging to a different,
not-yet-investigated bundle (request-56d62b72, request-f243b6b9,
request-58e96ad1).


## Audit for silent bundle-sweeps + fixes (2026-07-28, continued)

Root-caused why some "stale" tickets (REQ-36, and BUNDLE-5's members) had
commits already on `main` despite never advancing: a separate,
independent bug from this ticket's SHA-drift scope. See xgendev-main
BUG-878 for the full root cause — reconcile's window computation
(`_compute_cherry_pick_window`) walks a contiguous chronological range
from a watermark forward, and its "rogue commit" safety gate only blocks
on an explicit cross-bundle conflict (`bundled_in` set to a different
bundle), not on ticket readiness. A ticket sitting in `draft`/`free_coded`
with `bundled_in=None` (i.e. never bundled — the normal state for most
tickets) is indistinguishable to that gate from a genuinely-safe
co-traveler, so its already-committed code can get silently swept into
a later, unrelated bundle's reconcile.

Confirmed via committer-date forensics (author date == committer date
until the sweeping reconcile touches it) that this is a *logic* bug, not
a data-corruption symptom — unrelated to BUG-864/875's SHA-remap issue,
despite surfacing via the same investigation.

Audited all 15 non-terminal-status tickets in this project with recorded
commits, checking whether any/all of their commits are already reachable
on `main`. Two affected, matching the sweep pattern:

- **REQ-36** (`request-d05379d0`): all 26 commits on `main`, swept via
  BUNDLE-5's reconcile (07-13). Fixed: `status` → `free_and_reconciled`
  (operator confirmed this work is genuinely complete).
- **REQ-88** (`request-7ff1bacd`): 1 of 9 commits swept via BUG-5's
  reconcile (07-27) — very recent, same day as the resync incident that
  started this whole investigation, though a separate mechanism. Fixed:
  removed the swept commit entry from `fields.commits` (operator
  decision — it already landed via BUG-5, doesn't need to be tracked as
  REQ-88's own pending work). REQ-88 independently advanced
  `free_coded` → `ready_to_reconcile` via the live dispatcher process
  running against this project mid-session (confirmed via ticket file
  git history, timestamped before my own edit) — unrelated to this
  repair, and correct given its remaining 8 commits are clean.

Also found and fixed: **BUG-5** itself was stuck at `status=reconciling`
despite its `xgd/merged/BUG-5` tag confirming a completed merge on
07-27 — the same "post-merge status update never ran" pattern as
BUNDLE-5. Its own `fields.commits` pointer was also stale (dangling
`d893b318...`, superseded); repaired to the correct reachable pair
(`e91921a96...` on `xgd-working`, `e280f4dec...` on `main`) and promoted
to `free_and_reconciled`.

Stale count 4 → 3 (REQ-36 resolved; the remaining 3 —
request-56d62b72, request-f243b6b9, request-58e96ad1 — belong to a
different, not-yet-investigated bundle, unrelated to today's work).

**Note**: confirmed a live dispatcher process is actively running
against this project during this session (it independently promoted
REQ-88's status while this investigation was in progress). Further
manual ticket-data edits carry a small race risk against concurrent
dispatcher writes — worth keeping in mind for any follow-up work here.


## Correction (2026-07-28)

The "live dispatcher actively running against this project" note above is
wrong — retracted. Checked `cwd` via `lsof` on every dispatcher/reconcile
process running at the time; none pointed at this project. The REQ-88 and
bug-fe8af80a status transitions (free_coded → ready_to_reconcile) around
20:02:33 were the operator acting directly, not an automated process.


## BUNDLE-7 members repaired — stale/orphaned count now zero (2026-07-28)

REQ-83, REQ-84, REQ-86 (all `bundled_in: bundle-31e474b9` / BUNDLE-7):
confirmed genuinely reconciled, not swept-in. BUNDLE-7 itself is already
`free_and_reconciled` with `merged_at_commit` reachable from `main`, and
its `skipped_commits` ledger explicitly lists these three tickets'
original pre-repair SHAs — confirming its reconcile recognized their
content as already-applied and correctly skipped re-applying it. Their
`fields.commits` were already correct from the original 46-ticket bulk
repair; only needed the status flip. Set all three to
`free_and_reconciled`.

`find_commit_orphaned_intents`/`find_stale_commit_intents`: **0 orphaned,
0 stale.** Full repair arc: 62 orphaned / 46 stale (initial) → 0 / 11
(after commits-data repair) → 0 / 4 (after BUNDLE-5) → 0 / 3 (after
REQ-36, REQ-88, BUG-5) → 0 / 0 (after BUNDLE-7). This ticket's scope is
complete.
