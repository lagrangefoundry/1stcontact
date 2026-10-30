---
uid: report-e265c91d
id: REPORT-5756
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-30T17:01:05.203070+00:00'
updated_at: '2026-09-30T17:01:05.203070+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

# Resync resolve conflicts — `efb3a946fe` (REQ-266 revision immutability)

- **Worktree**: `/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/resync-377b581e`
- **Anchor**: `report-377b581e`
- **Apply target**: `9ac98712a708888db67f8aff21f22b16bd98094e`
- **Picked commit**: `efb3a946fee01ad62904df00200a9c3e385a87a0` — *feat(store): make a published revision immutable by enforcement [FREE-CODED]*, 2026-09-17 15:07:55 -0700
- **HEAD**: `76c34402de2a72dd4cd0aa06d9fe39856831848e` (unmoved)
- **`prior_stage_failure`**: empty; retry count 1
- **Result**: resolved, `CHERRY_PICK_HEAD` intact, no `UU` entries remain

## Conflict

ONE file, ONE region: `tests/support/d1-site-factory.ts`, the first paragraph of
the `atHead()` docblock. The other 16 paths in the pick (the new
`db/migrations/0013_revision_immutability.sql`, the three REQ-266 UATs, the
`tools/generate/src/store/**` changes) applied clean.

Index blobs:

| side | blob |
| --- | --- |
| base (`:1:`) | `de22ede2645b1199e1be83c1e4c70ca2f5621eae` |
| ours (`:2:`) | `19a0594d88e7937ceb27a368d39dd0df9cc7e9bf` (== `HEAD:<path>`, unmoved) |
| theirs (`:3:`) | `e60460cc4d7cfa1cf8623fb283f60327bc3855e3` |
| **resolved (`:0:`)** | **`e1d5cb631572458f88bd7d95f83d995491480a5a`** |

**The base blob IS the previous pick's theirs blob** (`de22ede264`, REQ-259 /
`be55a1ab14`) and ours is that pick's *resolved* blob — so the forecast recorded
for this file held by construction. This is the **fifth** instance of the same
recurring conflict on this branch (BUG-93 / `3ebad1bd58`, REQ-258 /
`3d35f86d5a`, REQ-259 / `be55a1ab14`, and one earlier).

## Theirs' delta is four changes; only one of them conflicted

1. the `0013_revision_immutability.sql` entry + its `[[REQ-266]]` comment, with
   `LAST IN THE LIST, which is what atHead below asks about` moved down onto it;
2. the "today X" clause — `[[REQ-259]]`'s unique index on
   `sending_domains.domain` → `[[REQ-266]]`'s immutability trigger on
   `site_revisions`;
3. the `AN INDEX AND NOT THE TABLE IT GUARDS` paragraph re-argued as `THE LAST
   STATEMENT OF THE LAST FILE`, for `0013`'s table-then-trigger pair;
4. the `atHead()` query itself: `type = 'index'` / `idx_sending_domains_domain`
   → `type = 'trigger'` / `site_revisions_are_immutable`.

**1, 3 and 4 auto-merged. Only 2 showed markers** — the markers were a quarter
of theirs' change, so the auto-merged regions were read before deciding.

## Resolution — STEP 2c step 1, keep BOTH

The two sides edit *different clauses of the same paragraph*, so neither side is
taken whole:

- **Theirs' "today" clause is taken.** Change 4 has *already* re-pointed the
  query at the trigger, so ours' `sending_domains.domain` wording would have
  documented a query the code no longer runs.
- **Ours' filename clause is kept.** Theirs writes ``which `0005` adds`` and
  ``a database at `0005` ``. **`db/migrations/0005_retire_site_slug.sql` does
  not exist on this branch** — verified live this run: the directory holds
  `0004_retire_site_slug.sql` (alongside `0004_user_acceptances.sql`), no
  `0005_*` at all, then `0006`–`0013`. Taking theirs verbatim would have left
  the fixture's own docblock citing a file nothing in the tree carries.

## Both-direction proof (nothing of incoming's was dropped)

- `git diff <theirs> :0:` reduces to **exactly** ours' pre-existing branch-local
  naming delta — the same five hunks as `git diff <base> <ours>`, content
  identical, offsets shifted only by theirs' 8 inserted lines. It removes
  nothing theirs authored.
- `git diff <ours> :0:` reduces to **exactly** theirs' four changes above. For
  1, 3 and 4 it is byte-identical to `git diff <base> <theirs>`; for 2 it is
  theirs' sentence grafted onto ours' surrounding prose, which is the single
  intended divergence and covers only the two `0005`-citing lines.

## Flagged for post-merge review

The naming divergence (`0005_retire_site_slug` → `0004_retire_site_slug`, and
the two-files-numbered-`0004` collision) is branch-local and will keep making
this exact paragraph conflict on every future migration-adding pick. It traces
to a missing `b6a695ae50` replay and is left for the REQ-236 recovery — it is a
naming fix, not a dropped incoming change.

Ours' enumeration ``which is what `0006_asset_grants`,
`0007_business_name_unique` and `0008_site_domains` all are`` was **not**
extended to cover `0009`–`0013`. Doing so would be authoring new prose, which
this role forbids; flagging instead.

The conflict enrichment's rule for this file was *"Intent unknown on one or both
sides. Take the more recent commit by timestamp and flag this file for
post-merge review."* On a CODE path that rule is not applicable — STEP 2c's
keep-BOTH ordering governs, and taking either side whole would have been data
loss in one direction or a dangling filename reference in the other. The file is
flagged, as the rule asks.

## Forecast for the next pick

The next migration-adding pick will conflict on this same paragraph again, with
**base == this pick's theirs blob `e60460cc4d`** and **ours == this pick's
resolved blob `e1d5cb6315`**. The resolution will again be: take theirs' "today"
clause, keep ours' `0004_retire_site_slug` filename clause and its
`0006`/`0007`/`0008` enumeration, and check changes 1/3/4 in the auto-merged
regions before deciding. Verify the filename claim with `ls db/migrations/`
rather than trusting this note.
