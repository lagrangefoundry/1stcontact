---
uid: report-4ee8405d
id: REPORT-5661
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-30T05:46:54.919239+00:00'
updated_at: '2026-09-30T05:46:54.919239+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-03519106.md` — class `UU`, outside the sparse cone
  (no working-tree file, conflict exists only in the index). Rule applied:
  **STEP 2 §2e (intent/bookkeeping ticket)** — "one side a strict superset:
  keep the superset", corroborated by the per-fact timeline rule. Resolved
  **`--theirs` (INCOMING)** via `git checkout --theirs` + `git add --sparse`.
  Staged blob is byte-identical to `:3:` (`1ad8304982`).

Picked commit: `045e64a7329dafdc03b3d7d4a64f8fa56cf3e26b` — "xgd(ticket): update
request request-03519106" (author 2026-09-13 18:07:53 -0700). Retry count 1
(first attempt), `prior_stage_failure` empty. HEAD `abcdbae1308d7311533a9c8824ceef61e2d07505`.

Index stages: base `c0a918e632` / ours `d737774c93` / theirs `1ad8304982`.

**This resolution stages a REAL net change** (`+21/-6` vs HEAD), unlike the long
run of zero-net-change picks earlier in this resync — finalize will commit it.

## Incoming changes preserved

No code files were in conflict, so STEP 3's code-file check is not the operative
one; the substantive question was whether ours held anything incoming lacked.
It did not — **incoming is a strict superset of ours on every axis**, and the
direct ours→theirs diff contains no field or section present on ours alone:

Frontmatter (per-fact timeline, all leading on incoming):
- `updated_at`: theirs `2026-09-14T01:07:53.828967+00:00` vs ours
  `2026-09-14T00:04:01.018374+00:00` — ours is **one hour earlier**.
- `status`: theirs `free_coded` vs ours `free_coding` (forward move).
- `commits`: present on theirs only — two entries,
  `d9b6443c6e70d519e7a6fa0648def35ed82944c9` and
  `b6a695ae503af92eab79834ba188beb585c411e6`, both with
  `reconcile_sha: null` / `main_sha: null`.
- `version: 0.2.190`: present on theirs only.
- `last_field_updated` (`status` vs `body`) is not an independent fact — it only
  records which field that side's own last write touched.

Body — the part that would have been real data loss:
- The `## Migration` section's migration number, `0005_retire_site_slug.sql` vs
  ours' `0004_…` (three occurrences), and
- the whole paragraph **"It is numbered `0005` and not `0004`."** explaining that
  REQ-240 landed its own `0004_user_acceptances.sql` on `xgd-working` while this
  work was on a branch, that `wrangler d1 migrations apply` orders by filename,
  and that renumbering was free because neither file had been applied to a shared
  database.

**Why ours' `0004` body is not a main-side decision.** Ours' side is simply
BEHIND, not divergent. The base (`:1:`, the picked commit's parent =
`b6a695ae50`, the `free-REQ-236` merge) already carries the `0005` text, so the
renumber is incoming history that main never received:

- ours-side ledger for the path tops out at `ac74437e8f` (author 09-13 17:04:01),
  which mirrors incoming's `d396ec3d80` (same author date) — the two ledgers are
  a mirrored import and ours stops one commit before the merge.
- The renumber itself arrived on `xgd-working` in `b6a695ae50` (09-13 18:05:15),
  the only commit that adds `db/migrations/0005_retire_site_slug.sql`. That
  commit is **still in this resync queue** — HEAD currently holds
  `db/migrations/0004_retire_site_slug.sql` *and*
  `db/migrations/0004_user_acceptances.sql`, i.e. the exact duplicate-number
  collision the incoming paragraph documents, while `xgd-working` holds
  `0005_retire_site_slug.sql` and no such collision.
- `b6a695ae50` is also one of the two `working_sha` entries incoming adds to the
  ticket's `commits` list, with `main_sha: null` — incoming's own record that it
  has not reached main.

So ours' body describes the *pre-renumber* state that the queue is about to
advance past, not a later main-side judgement. Because theirs does not touch the
body while ours does, git auto-merged the body to OURS and only the frontmatter
showed as conflicting — taking `--ours` on the frontmatter would have silently
kept that stale body and permanently dropped the renumber paragraph. Under the
HARD RULES ("a resolution that keeps ONLY main's version is data loss") and §2e's
superset rule, incoming wins on both halves.

Note this pick is a genuine departure from the `--ours` outcomes recorded earlier
in this resync run. Those were `--ours` because HEAD already held the superseding
state; here HEAD holds an *earlier* state, so the same per-fact rule points the
other way. The enrichment's fallback ("intent unknown → take the more recent
commit by timestamp") also agrees with `--theirs` here.

## Arbitration of last resort (BUG-1460)

Not applicable — STEP 3h never fired. The superset relation was unambiguous in
both directions (frontmatter and body), and no fact required a tie-break.

## Verification

- `git status --porcelain` → `M  .xgd/tickets/hot/request-03519106.md` (no
  `UU`/`AA` lines remain).
- `git ls-files -s -- <path>` → stage 0, blob `1ad8304982` == `:3:`.
- `git diff --cached --stat HEAD` → `1 file changed, 21 insertions(+), 6 deletions(-)`.
- `git rev-parse CHERRY_PICK_HEAD` → `045e64a7329dafdc03b3d7d4a64f8fa56cf3e26b`
  (sequencer state intact; no `--continue`/`--skip`/`--abort` was run).

## Forecast for the remaining picks on this path

Two incoming commits remain, both strictly forward from the blob just staged, so
both are `--theirs`:

- `45b3fc90a6` (09-13 18:07:58) — adds `story_points: 13`, `updated_at`
  01:07:58, `last_field_updated: story_points`. Its parent state is exactly the
  blob now staged, so **it should auto-merge and never reach the resolver**.
- `dd8c698b60` (09-20 11:30:53, incoming tip) — `story_points: 13`, `updated_at`
  2026-09-20T18:30:53, `status: ready_to_reconcile`.

No tip exception: every remaining diff is additive/forward relative to ours.
Re-verify cheaply with `git diff <ours blob> <sha>:<path>` — if every `+` line is
a new field or a later-valued version of one, resolve `--theirs` immediately.
