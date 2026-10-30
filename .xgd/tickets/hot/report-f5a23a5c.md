---
uid: report-f5a23a5c
id: REPORT-5747
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-30T13:04:50.857630+00:00'
updated_at: '2026-09-30T13:04:50.857630+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

# Resync resolve conflicts — `be55a1ab14` (REQ-259, the customer's own domain)

**Anchor:** `report-377b581e`
**Apply target:** `9ac98712a708888db67f8aff21f22b16bd98094e`
**HEAD:** `befbb25ac667c16707742fc1ac9f3adef3531939` (unmoved)
**CHERRY_PICK_HEAD:** `be55a1ab1458d114a580d18f6303f1b974179acf` (intact)
**Retry count:** 1 · **prior_stage_failure:** empty
**Result:** resolved and staged, no markers remain.

## The conflict

ONE file, ONE region: `tests/support/d1-site-factory.ts`, the first paragraph
of the `atHead()` docblock.

This is the **fifth instance of the recurring `atHead` docblock conflict** on
this branch — every incoming commit that appends a migration collides on this
exact paragraph. Previously seen on the BUG-93 pick (`3ebad1bd58`) and the
REQ-258 pick (`3d35f86d5a`), resolved identically each time.

Blobs: base `c84cc3b495` / ours `6bb35639d4` (== `HEAD:<path>`, unmoved) /
theirs `de22ede264`. Resolved blob `19a0594d88`.

## Why it is a keep-BOTH, not a pick-a-side

The two sides edit **different clauses of the same paragraph**, so HARD RULE
"non-overlapping changes: keep BOTH sides" applies at clause granularity.

**Theirs' whole delta from base is four changes, all taken:**

1. Appends `0012_sending_domains.sql` to `MIGRATIONS` with its REQ-259 comment,
   moving the `LAST IN THE LIST` marker down with it (auto-merged).
2. Rewrites the "today X" clause → `[[REQ-259]]'s unique index on
   `sending_domains.domain``.
3. Rewrites the `AN INDEX AND NOT THE COLUMN IT GUARDS` paragraph → `AN INDEX
   AND NOT THE TABLE IT GUARDS`, re-argued for `0012`'s three statements
   (auto-merged).
4. Re-points the `atHead()` bind `idx_site_domains_site_canonical` →
   `idx_sending_domains_domain` (auto-merged).

Only (2) landed inside the markers. **Taking theirs on (2) is mandatory, not
stylistic:** the auto-merge already re-pointed the query at (4), so keeping
ours' "REQ-258's partial unique index on `site_domains`" would leave the
docblock describing a query the code no longer runs.

**Ours' delta in the same paragraph is a branch-local naming fix, kept:**

Ours rewrites the *historical-example* clause — `0005` → `0004_retire_site_slug`
— and enumerates the files that came after it. Theirs does **not** touch this
clause at all: in the base→theirs diff those lines are pure context. So keeping
ours here discards nothing incoming authored.

Kept because the `0005` name is wrong **on this branch**:

```
db/migrations/  → 0004_retire_site_slug.sql   (exists)
                  0005_*                      (does NOT exist)
```

Theirs' `0005_retire_site_slug.sql` would cite a file nothing in the tree
carries. The divergence is branch-local and permanent for this run — it traces
to the two-migrations-numbered-`0004` collision from the missing `b6a695ae50`
replay, left for the REQ-236 recovery.

## Proof of no data loss (two-sided)

```
git diff <theirs de22ede264> :0:<path>
  → reduces to EXACTLY ours' pre-existing naming delta
    (0005→0004_retire_site_slug and its knock-on prose,
     the 0007-renumber note, the second-entry clause).
    Nothing theirs authored appears as a removal.

git diff <ours 6bb35639d4> :0:<path>
  → reduces to EXACTLY theirs' four changes above,
    byte-identical to the base→theirs diff.
    Nothing theirs authored is missing.
```

The resolved file is the precise union of the two deltas. Both directions
checked because the one-sided check alone cannot distinguish "integrated" from
"silently dropped a hunk".

## ⚠️ Flagged for post-merge review (NOT fixed here)

Ours' enumeration now **under-describes the list**. It reads:

> once anything ran after that file … — which is what `0006_asset_grants`,
> `0007_business_name_unique` and `0008_site_domains` all are.

Since that sentence was written, `0009_asset_grant_form_handle`, `0010_zones`,
`0011_site_domains_canonical` and now `0012_sending_domains` have also landed
after `0004_retire_site_slug`. The enumeration is stale but not *wrong* — the
three it names do all qualify.

**Deliberately left alone.** Extending it is authoring new prose, which the
role forbids ("YOU MAY NOT author new code, tests, or matrix content. Resolve
what's already in the conflict markers only."). Neither side authored a fix, so
there is nothing in the markers to take. Recording it here rather than editing.

## Forecast for the next pick

The next incoming commit that appends a migration WILL conflict on this same
paragraph again, with the same shape. The resolution is mechanical:

1. Take theirs' "today X" clause (it moves with the `atHead()` bind, which
   auto-merges).
2. Keep ours' `0004_retire_site_slug` historical clause verbatim.
3. Do NOT extend the `0006/0007/0008` enumeration.
4. Prove with the two diffs above; expect theirs→resolved to reduce to ours'
   naming delta and ours→resolved to reduce to theirs' delta.

Ours' blob has been unmoved at `6bb35639d4` across this pick, so the next
pick's base should equal theirs' `de22ede264`.
