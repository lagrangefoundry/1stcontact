---
uid: report-0da316d2
id: REPORT-5669
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-30T06:13:40.942589+00:00'
updated_at: '2026-09-30T06:13:40.942589+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

# Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e

Picked commit `dc192d05e3` — *feat(business): the name is stored once, and a
rename reports its effects [FREE-CODED]* (REQ-237).
Ours / HEAD `a6160e9308`, whose tip for the conflicted path is
*feat(gate): a per-contact link, and what they did with it [FREE-CODED]* (REQ-244).
Anchor `report-377b581e`. `prior_stage_failure` empty.

One conflicted path, class `UU`, 2 regions, both integrated. This is a CODE
conflict between two free-coded features, so the HARD RULES for code files and
STEP 2c govern: both features are preserved. The enrichment's fallback rule
("intent unknown on one or both sides — take the more recent commit by
timestamp") is not applicable to a code file and was not followed; obeying it
would have deleted one of two genuine features.

## Files resolved

### `tests/support/d1-site-factory.ts` — integrated (both features kept)

Stages: base `6df0a5289a` / ours `b6104096cf` / theirs `98d6279989`.
Base→theirs was +18/−6, base→ours +10/−11. Of theirs' three hunks, one
auto-merged and two conflicted.

**Region 1 — the `MIGRATIONS` list.** Ours adds
`0006_asset_grants.sql` (REQ-244); theirs adds `0006_business_name_unique.sql`
(REQ-237). Both entries are now in the list, so neither feature's migration is
skipped by the fixture.

Theirs' side of the marker also carried `0005_retire_site_slug.sql` and the
`NUMBERED 0005 AND NOT 0004` comment block. **Those are not part of this pick's
delta** — they are already present in the base blob, and appear on theirs' side
only because ours diverges from base there. Ours' path was kept:

- `db/migrations/0005_retire_site_slug.sql` **does not exist in ours' tree**
  (`git ls-tree HEAD db/migrations/` lists `0004_retire_site_slug.sql`), so
  importing `0005_…` would fail the fixture at load time for every suite.
- The two filenames hold the **same blob**, `07ca9602ef` — it is a pure rename,
  not a content difference.
- The rename is owned by a commit this resync has not replayed yet:
  `b6a695ae50` *Merge branch 'free-REQ-236' into xgd-working* is the only commit
  in `git log dc192d05e3 -- db/migrations/0005_retire_site_slug.sql`. When that
  commit is picked it renames the file and updates this import; nothing is lost
  by not anticipating it here.
- `git grep -n '0005_retire_site_slug'` over `apps tests tools packages db`
  returns nothing, so the resolved tree carries no dangling reference.

Ordering: `0006_business_name_unique.sql` is placed **last**. Both new files are
numbered `0006`, and `wrangler d1 migrations apply` orders by filename, so
`0006_asset_grants` runs before `0006_business_name_unique` in every real
environment; the list now says the same rather than inventing its own order. A
comment records that reasoning, because it is a fact created by this merge that
neither side's prose stated.

**Region 2 — `atHead()`'s doc comment.** The function BODY auto-merged to theirs
(ours never touched it), so the incoming implementation is in place verbatim:

```
SELECT name FROM sqlite_master WHERE type = 'index' AND name = ?   -- idx_tenants_owner_name
```

Only the prose conflicted. Theirs' comment was kept — its point is the incoming
feature's actual argument (the marker must be whatever the LAST file in the list
leaves behind, not `sites.kind` specifically) — with its migration numbers
corrected to the filenames ours' tree really has: `0004_retire_site_slug` adds
`kind`, and both `0006_asset_grants` and `0006_business_name_unique` run after
it. Ours' version of this comment asserted `kind` is a sufficient marker, which
is now false on ours' own list: ours had added `0006_asset_grants` after the
`kind` migration without updating the marker, so a database stopped at
`0004_retire_site_slug` already answered "at head" and silently skipped
`asset_grants`. Theirs' generalization **fixes a latent bug in ours** and is
correct for the integrated list, since `idx_tenants_owner_name` is created by
the last entry (`db/migrations/0006_business_name_unique.sql`,
`CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_owner_name`).

## Incoming changes preserved

Every hunk of base→theirs is present in the resolution:

1. `() => import('../../db/migrations/0006_business_name_unique.sql?raw'),` plus
   its five-line REQ-237 comment — present (list entry, last position).
2. `atHead()`'s new body, the `sqlite_master` index probe bound to
   `idx_tenants_owner_name` — present (auto-merged, verified from the index).
3. `atHead()`'s rewritten doc comment, including its header line *"Whether the
   database already holds what the LAST migration leaves behind"* (auto-merged)
   and the "it asks about the last file in the list, whichever that is"
   argument — present, with migration numbers mapped onto ours' filenames.

Nothing from theirs was dropped. The only theirs-side text not carried is the
base-inherited `0005_retire_site_slug` import and its renumbering comment, which
belong to `b6a695ae50` rather than to this pick, as argued above.

Ours' `0006_asset_grants.sql` entry (REQ-244) is likewise intact, so STEP 2b's
"keep the superset" is satisfied in both directions. No test function was
removed (STEP 2f); this file is a fixture helper and no assertion was touched.

Verified from the INDEX rather than the worktree:
`git show :tests/support/d1-site-factory.ts` has no `<<<<<<<`/`>>>>>>>`, lists
all seven migration imports in order, and binds `idx_tenants_owner_name`.
`git status --porcelain` shows no `UU` lines and the path is staged `M`.
`CHERRY_PICK_HEAD` is intact at `dc192d05e3d011e19d5c160cd7e141f5c2279098`.
Staged net change for the path is +25/−7 — a real integration, as expected for a
code conflict, not the zero-net-change outcome the ticket-file picks produce.

## Arbitration of last resort (BUG-1460)

Not applicable — STEP 3h never fired. Both sides' intent was legible from the
enriched subjects and the diffs, the two features touch disjoint concerns
(different migration files; attribute versus content of the same helper), and
the one apparent head-on collision — which `retire_site_slug` filename to import
— resolved on a fact rather than a judgement: only one of the two filenames
exists in ours' tree, and the other is introduced by a commit still queued for
replay.

## Forecast for remaining picks on this path

`b6a695ae50` (*Merge branch 'free-REQ-236' into xgd-working*) is the pick that
renames `0004_retire_site_slug.sql` → `0005_retire_site_slug.sql`. When it
arrives it should be taken as the incoming rename (it is genuine intent this
branch has not received), and this file's import plus the `atHead` comment's
`0004_retire_site_slug` reference should move to `0005_` with it. That is the
one remaining pick where `--ours` on this path would be wrong.
