---
uid: report-4b9ae9bf
id: REPORT-5666
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-30T06:05:13.346918+00:00'
updated_at: '2026-09-30T06:05:13.346918+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

Picked commit `0b0eb7636728ebdce55808902da294e5464a95a8` — "feat(gate): a per-contact
link, and what they did with it [FREE-CODED]" (REQ-244, author 2026-09-13 19:29:15).
16 files touched, 14 auto-merged, **2 conflicted**. Both sides free-coded, so §2c
governs (code files, incoming authoritative, integrate).

- **`tests/support/d1-site-factory.ts`** — class `UU`, 1 conflict region, materialized.
  Rule: §2c.1/2c.2 — non-overlapping changes kept from BOTH sides. Resolved by keeping
  ours' `0004_retire_site_slug.sql` list entry AND appending theirs' complete REQ-244
  contribution (comment + `0006_asset_grants.sql` entry) verbatim.

- **`package.json`** — class `UU`, 1 conflict region. Rule: incoming wins on a scalar
  (monotone version counter). `--theirs`, `version` `0.2.191`.

## Incoming changes preserved

### `tests/support/d1-site-factory.ts`

Theirs' delta from base (`:1:` → `:3:`) is **+4 lines and nothing else**: the
`[[REQ-244]]` comment and the `() => import('.../0006_asset_grants.sql?raw')` entry.
Both are present byte-identically in the resolved file (index lines 73–76,
`git show :tests/support/d1-site-factory.ts`). **No incoming REQ-244 content was
dropped.**

The rest of the ours-vs-theirs divergence in this region is **not REQ-244's work at
all** — it belongs to a commit still pending in the resync queue:

- Ours' blob is the replay (`abcdbae130`) of xgd-working's `d9b6443c6e`
  ("feat(store): the D1 store addresses a site by its key", 09-13 17:04:24) — the
  exact commit the enrichment names as the HEAD side.
- Base (`:1:`) is xgd-working's state at 18:05, i.e. *after* `b6a695ae50`
  ("Merge branch 'free-REQ-236' into xgd-working", 09-13 18:05:15).
- `git log 0b0eb76367 -- db/migrations/0005_retire_site_slug.sql` names
  **`b6a695ae50` alone** as the commit that introduced the `0005` numbering. The same
  merge also rewrote the surrounding prose (`"there is a second entry now"` →
  `"migrations landed after it"`, `"the two above"` → `"the three above"`) and added
  the five-line "NUMBERED `0005` AND NOT `0004`" paragraph.
- `b6a695ae50` is **not in HEAD's ancestry** (`git log HEAD --grep='free-REQ-236'`
  returns nothing), so the renumbering has not yet been replayed onto this branch.

So every non-REQ-244 line in theirs' side of the marker is `b6a695ae50`'s content,
which will arrive under its own pick. Carrying it in here would not preserve incoming
developer intent; it would pre-apply a *different* incoming commit.

**It would also break the fixture outright.** The resolved tree has no
`db/migrations/0005_retire_site_slug.sql`; it has `0004_retire_site_slug.sql`
(`git ls-files --cached -- db/migrations/` → `.gitkeep`, `0001_baseline.sql`,
`0002_session_rotation.sql`, `0003_contact_change_cursor.sql`,
`0004_retire_site_slug.sql`, `0004_user_acceptances.sql`, `0006_asset_grants.sql`).
A `--theirs` resolution would leave the migration list importing a path that does not
exist, failing every suite that calls `applySchema()` at setup. Every path the
resolved list references is present in the index.

Theirs' REQ-244 comment ("the same reason the four above are") was preserved verbatim
and is still accurate against ours' list — four entries precede it below the baseline
(`0002`, `0003`, `0004_user_acceptances`, `0004_retire_site_slug`). The two `0004`
files coexisting is the pre-existing state of this branch, not something this
resolution introduced; `b6a695ae50` is the commit that fixes it, and it will do so
when it is picked.

### `package.json`

Base `0.2.190` / ours `0.2.189` / theirs `0.2.191` — the version line is the sole
delta on both sides. Incoming's value taken, so incoming's bump is preserved exactly.

Two independent reasons this is the forward choice, not a rollback:

1. **The branch convention is to carry the xgd-working original's version verbatim.**
   `git show d9b6443c6e:package.json` is `0.2.189` — identical to ours, because ours
   is that commit's replay. Each replayed pick therefore reproduces the version its
   xgd-working original set, which for `0b0eb76367` is `0.2.191`.
2. **Monotone counter.** `0.2.189` → `0.2.191` moves forward; ours' value is passed
   through, not lost. Keeping ours would mean the pick contributed no bump at all —
   a silent discard of incoming content. `0.2.190` belongs to the pending
   `b6a695ae50`; leaving that number unclaimed is harmless (the field is `private`
   and purely a counter), and when `b6a695ae50` is picked its `0.2.190` will be the
   rollback to refuse at that point.

The enrichment's fallback rule ("intent unknown → take the more recent commit by
timestamp") happens to agree with `--theirs` here (theirs 19:29 vs ours 17:04). On
`tests/support/d1-site-factory.ts` that same rule would have been **wrong** — §2c and
the HARD RULES mandate integration on code files, and obeying the enrichment there
would have imported a nonexistent migration. The enrichment's request to "flag for
post-merge review" is satisfied by this report.

No UAT function on either side was deleted; no hunk was dropped under the BUG-1301
precedence exception. Ours is not kept wholesale on either file — the factory is a
genuine integration of both sides, and `package.json` takes incoming.

## Arbitration of last resort (BUG-1460)

Not applicable — STEP 3h never fired. Both conflicts had a determinate resolution
under §2c and the HARD RULES.

## Verification

- `git status --porcelain` — **no conflict class lines remain**; 19 paths staged.
- `git show :<path>` on both resolved files — no conflict markers, incoming content
  present (verified from the INDEX, not the worktree).
- `git rev-parse CHERRY_PICK_HEAD` → `0b0eb7636728ebdce55808902da294e5464a95a8`,
  intact. No `--continue`/`--skip`/`--abort` was run.
- `git diff --cached --stat HEAD` → 19 files, 1454 insertions(+), 20 deletions(-) —
  a real net change, as expected for a code pick (unlike the ticket-path picks on
  this branch, which net to zero).

## Forecast for the next pick on these paths

`b6a695ae50` ("Merge branch 'free-REQ-236' into xgd-working", 09-13 18:05:15) is the
pending commit that owns the `0004`→`0005` renumbering, the prose recount and the
`0.2.190` bump. When it is picked:

- `tests/support/d1-site-factory.ts` — its rename and prose rewrite are legitimate
  incoming content and should be **integrated**, not refused: take its
  `0005_retire_site_slug.sql` path, its "NUMBERED `0005` AND NOT `0004`" paragraph and
  its `"the three above"` recount, while **keeping the REQ-244 `0006_asset_grants.sql`
  entry this resolution added**. Check that `db/migrations/0005_retire_site_slug.sql`
  lands with it (it renames `0004_retire_site_slug.sql`); if the rename arrives, the
  list must reference `0005`, and if it does not, it must stay at `0004`. Let the
  file that exists in the index decide.
- `package.json` — its `0.2.190` is now BEHIND the staged `0.2.191`, so that one line
  is `--ours` on the monotone-counter argument. This is the one place where incoming
  loses, and only on the counter.
