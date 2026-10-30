---
uid: report-c0c20682
id: REPORT-5758
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-30T18:05:21.728925+00:00'
updated_at: '2026-09-30T18:05:21.728925+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

# Resync resolve conflicts — `7b68d0294a` (REQ-268 gutter collection)

**Branch** `resync-377b581e` · **HEAD** `3cfb09007a201d133622680767a3b18e9a5b55cf`
**Apply target** `9ac98712a708888db67f8aff21f22b16bd98094e` · **Anchor** `report-377b581e`
**Picked commit** `7b68d0294a988128099393c3e718bb91ec454b6c` — *feat(gutter): sign the
mark, derive it, exclude it, collect it [FREE-CODED]*, 2026-09-17 16:58:17 -0700
**prior_stage_failure** empty · **retry count** 1 (`cherry_pick_no_progress_state.json`)

## Outcome

`pass`. One conflicted path, resolved keep-BOTH (STEP 2c step 1). Cherry-pick left
intact for the caller to finalize: `CHERRY_PICK_HEAD` still
`7b68d0294a98…`, no `UU` entries remain, 15 paths staged.

## The conflict

Only `tests/support/d1-site-factory.ts` conflicted, and only ONE region inside it:
the first paragraph of the `atHead()` docblock. This is the **sixth instance** of a
conflict this branch produces on every incoming commit that appends a migration
(prior: BUG-93 `3ebad1bd58`, REQ-258 `3d35f86d5a`, REQ-259 `be55a1ab14`,
REQ-266 `efb3a946fe`).

Index blobs: base `de2ef47e70` / ours `e528bc73d4` (== `HEAD:<path>`, unmoved) /
theirs `261aba9b94` → **resolved `d5d3728633`**.

The other 14 paths of this pick applied clean (`apps/control-app/src/**`,
`apps/public-site/src/lead.ts`, `packages/framework/src/gutter/marker.ts`,
`packages/framework/src/modules/contact-form/fields.ts`, the REQ-268 UAT,
`db/migrations/0016_gutter_collection.sql`, `package.json`). Note `package.json`
auto-merged this time — no version-counter conflict.

### Theirs' delta is four changes; only one of them conflicts

1. The `0016_gutter_collection.sql` entry in `MIGRATIONS` + its comment — **auto-merged**.
2. The "today X" clause of the `atHead()` docblock: `[[REQ-266]]`'s immutability
   trigger → `[[REQ-268]]`'s `idx_users_synthetic` — **THE CONFLICT**.
3. The `THE LAST STATEMENT OF THE LAST FILE` paragraph, re-argued for `0016`
   (two indexes rather than `0015`'s table-then-index) — **auto-merged**.
4. The `atHead()` query's bind: `idx_inbound_suppressions_live` →
   `idx_users_synthetic` — **auto-merged**.

Because (4) has *already* re-pointed the query, taking theirs on clause (2) is
mandatory, not stylistic: ours' wording would describe a query the code no longer
runs. Verified against the incoming file itself —
`db/migrations/0016_gutter_collection.sql` creates two indexes and its LAST
statement is `CREATE INDEX IF NOT EXISTS idx_users_synthetic ON users (synthetic,
created_at)`, so theirs' paragraph and bind are internally coherent.

### Ours' delta is branch-local migration renumbering

Ours differs from base only in the `0005_retire_site_slug` → `0004_retire_site_slug`
naming divergence and its knock-on prose (five regions: the `0001`–`0009` paragraph,
the `MIGRATIONS` entry + its renumber comment, the `0007`-not-`0006` comment, the
re-runnable paragraph's two `0005`→`0004` mentions, and the `atHead()` docblock's
historical clause). Verified live this run: `db/migrations/` holds
`0004_retire_site_slug.sql` and **no** `0005_*`, so theirs' `0005` would cite a file
nothing in the tree carries.

## Resolution

Grafted theirs' clause (2) onto ours' preserved filename clause — one line replaced,
nothing else in the region touched:

```
 * IT ASKS ABOUT THE LAST FILE IN THE LIST, WHICHEVER THAT IS — today
 * [[REQ-268]]'s `idx_users_synthetic`, the sweep's own index. It used to ask for
 * `sites.kind`, which `0004_retire_site_slug` adds; once anything ran after
 * that file, ...
```

### Proved in BOTH directions

- `git diff 261aba9b94 :0:<path>` (theirs → resolved) reduces to **exactly** ours'
  five-region naming delta, identical to the base→ours diff. It contains no hunk
  touching the `0016` entry, the re-argued paragraph or the `.bind(...)` — so nothing
  theirs authored was removed.
- `git diff e528bc73d4 :0:<path>` (ours → resolved) is **exactly** theirs' four
  changes, byte-identical to the base→theirs diff apart from the grafted hunk's
  context lines (ours' preserved filename clause). All four of theirs' changes are
  present.

So nothing incoming was dropped; the HARD RULE is satisfied, and the only
non-incoming content in the result is the pre-existing branch-local naming fix.

## Flagged for post-merge review

The enrichment for this file says *"Intent unknown on one or both sides. Take the
more recent commit by timestamp and flag this file for post-merge review."* The
timestamp half is inapplicable on a CODE path — STEP 2c's keep-BOTH ordering governs,
and both sides edited different clauses of the same paragraph. The flag half is
honoured here:

1. **Incoming left a stale marker comment.** Theirs ADDED
   `// LAST IN THE LIST, which is what atHead below asks about.` above the `0016`
   entry without removing the identical comment above `0015` (line 141). The comment
   now appears twice and one of them is false. Applied faithfully — this is
   incoming's own defect, not a merge artifact, and fixing it would be authoring.
2. **Ours' historical enumeration is not extended.** The clause "which is what
   `0006_asset_grants`, `0007_business_name_unique` and `0008_site_domains` all are"
   stops at `0008`; `0009`–`0016` have since landed. Left as-is deliberately —
   extending it is new prose, which this role forbids.
3. **The two-files-numbered-`0004` collision persists**
   (`0004_retire_site_slug.sql` + `0004_user_acceptances.sql`, no `0005_*`). Still
   traced to a missing `b6a695ae50` replay and still left for the REQ-236 recovery.

## Forecast for the next pick on this path

Next incoming commit that appends a migration should show base == this pick's theirs
blob `261aba9b94` and ours == this pick's resolved blob `d5d3728633`, with the same
one-region conflict and the same graft.

⚠️ **That chain-check only holds for CONSECUTIVE picks touching this path.** This
run broke REQ-266's forecast (predicted base `e60460cc4d` / ours `e1d5cb6315`;
actual `de2ef47e70` / `e528bc73d4`) because the REQ-267 inbound-mail pick landed on
HEAD in between, adding the `0014`/`0015` entries and moving ours. When the blobs
don't match the forecast, that is intervening picks, not a failed resolution —
re-derive from `git ls-files -u`.
