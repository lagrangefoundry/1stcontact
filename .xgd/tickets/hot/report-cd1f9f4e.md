---
uid: report-cd1f9f4e
id: REPORT-5744
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-30T12:09:37.225223+00:00'
updated_at: '2026-09-30T12:09:37.225223+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

# Resync conflict resolution — `3d35f86d5a` (REQ-258)

Picked commit: `3d35f86d5a69823dd736d5000cfe4c9d998cc538`
"feat(domains): a custom domain serves a site, end to end [FREE-CODED]"
(author 2026-09-16 11:18:34 -0700, 20 files).

HEAD `74f83d14ea2065ca05c764fd980d391a1864b15f`; apply target
`9ac98712a708888db67f8aff21f22b16bd98094e`; anchor `report-377b581e`;
`prior_stage_failure` empty (first attempt, `no_progress_count=1`).

19 of the commit's 20 files applied cleanly — including the new
`db/migrations/0011_site_domains_canonical.sql`, `apps/control-app/src/serving.ts`
and all three new REQ-258 UAT files. One `UU` path, one region.

## Files resolved

### `tests/support/d1-site-factory.ts` — `UU`, 1 region — INTEGRATED (2c step 1, keep BOTH)

Stages: base `b2d0970e85`, ours `832773c4ce`, theirs `c84cc3b495`.

**What each side changed.**

- Theirs (the pick) makes two edits: it appends
  `0011_site_domains_canonical.sql` to `MIGRATIONS` with its REQ-258 rationale
  and moves the "LAST IN THE LIST" marker note off `0010_zones` onto it, and it
  re-points `atHead()` from `0010`'s `zones` table to `0011`'s partial unique
  index `idx_site_domains_site_canonical` — rewriting the query and the two
  docblock paragraphs that explain it.
- Ours' whole delta from base is branch-local migration NAMING plus two prose
  edits that follow from it: `0005_retire_site_slug.sql` →
  `0004_retire_site_slug.sql`, the "NUMBERED `0005` AND NOT `0004`" note
  replaced by a "NUMBERED `0007` AND NOT `0006`" note on
  `0007_business_name_unique`, "the three above" → "the two above", "migrations
  landed after it" → "there is a second entry now", and the matching
  `0005`→`0004` substitutions in the `applySchema` and `atHead` docblocks.

**Only the `atHead` docblock's first paragraph conflicted**, and the two sides
edited *different clauses of the same paragraph*: theirs rewrote the "today X"
clause and the "no such table"→"no such object" clause; ours rewrote the
historical-example clause's filename and appended an enumeration to it. That is
2c step 1 — non-overlapping edits git flagged only because they are neighbours.
Both are kept. This is the same region, and the same shape, as the BUG-93 pick
resolved earlier in this run.

Everything else auto-merged, and the auto-merge was checked rather than trusted
(an auto-merged region keeps ours whenever incoming did not touch it *in this
commit*, which says nothing about whether ours is current):

- `MIGRATIONS` now reads `0001, 0002, 0003, 0004_user_acceptances,
  0004_retire_site_slug, 0006_asset_grants, 0007_business_name_unique,
  0008_site_domains, 0009_asset_grant_form_handle, 0010_zones,
  0011_site_domains_canonical` — every one of those files exists in the tree at
  this commit (`0011` staged by this pick), so the dynamic imports all resolve.
- `atHead()`'s body is theirs verbatim (`type = 'index' AND name = ?` /
  `.bind('idx_site_domains_site_canonical')`), so the docblock's "today" clause
  had to become theirs' or it would describe a query the code no longer runs. It
  is theirs'. `0011` was read to confirm the substance: its two statements are
  `ALTER TABLE site_domains ADD COLUMN canonical` then
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_site_domains_site_canonical …
  WHERE canonical = 1 AND status = 'active'` — so theirs' "partial unique index
  on `site_domains`" and its "AN INDEX AND NOT THE COLUMN IT GUARDS, because
  `0011`'s two statements land in order and the index is the second" are both
  exactly right, and theirs' "no such **object**" is required: the query no
  longer asks about a table.

**The one place theirs was not taken verbatim, and why it is a naming fix rather
than a dropped incoming change.** Theirs' historical clause names `0005` three
times (`which \`0005\` adds; once anything came after \`0005\`, a database at
\`0005\`…`). **`db/migrations/0005_retire_site_slug.sql` does not exist on this
branch** — `git ls-tree HEAD db/migrations/` lists `0004_retire_site_slug.sql`,
and that is also how `db/migrations/0001_baseline.sql` refers to it. Left as
theirs wrote it, the docblock would cite a filename nothing in the tree carries.
So the clause keeps ours' `0004_retire_site_slug` while the sentence around it
stays theirs'. Identical reasoning to the BUG-93 pick.

## Incoming changes preserved

`git diff c84cc3b495 :0:tests/support/d1-site-factory.ts` reduces to exactly
ours' branch-local naming delta. Accounting for every `-` line:

1. `…the list stays a list because migrations landed after it.` — base prose
   ours supersedes with "there is a second entry now". Theirs has no hunk here.
2. `same reason as the three above` → `the two above` — base prose, ours' edit.
3. The `NUMBERED 0005 AND NOT 0004` block and
   `0005_retire_site_slug.sql?raw` — base content; ours' renumbering. Not
   authored by the pick.
4. Two `0005` → `0004` substitutions in the `applySchema` docblock — base
   prose, ours' edit.
5. The three `0005` references in the `atHead` docblock — base prose that
   theirs carried through unchanged; replaced with this branch's actual
   filename, as above.

**No line the picked commit introduced is absent.** Both of its hunks are
present in full: the `[[REQ-258]]` comment plus the
`0011_site_domains_canonical.sql` entry with `LAST IN THE LIST` moved onto it,
the removal of that marker note from `0010_zones`' comment, the rewritten
`atHead()` query, theirs' "today `[[REQ-258]]`'s partial unique index on
`site_domains`" opening, theirs' "no such object at all", and theirs' whole "AN
INDEX AND NOT THE COLUMN IT GUARDS" paragraph verbatim. The diff above shows no
hunk in either region except the naming clause, i.e. the rest is byte-identical
to theirs.

2f: no test function was deleted — this is a fixture module with no `it(`,
`test(` or `describe(` at all, and the commit's three new UAT files
(`test_UAT_FC_REQ-258_a_bound_host_serves_one_site.workers.test.ts`,
`test_UAT_FC_REQ-258_runtime_routes_survive_a_deploy.test.ts`,
`test_UAT_FC_REQ-258_serving_a_custom_domain.workers.test.ts`) applied cleanly.

No hunk was dropped, so the BUG-1301 precedence exception did not fire.

## Arbitration of last resort (BUG-1460)

Not applicable — STEP 3h never fired. The region integrated under 2c step 1 with
no incompatible pair to arbitrate.

## Flagged for post-merge review (not fixed here)

1. **Ours' enumeration clause is now short of the list.** Ours added "— which is
   what `0006_asset_grants`, `0007_business_name_unique` and `0008_site_domains`
   all are" to the historical clause; since then `0009`, `0010` and (with this
   pick) `0011` also land after `0004_retire_site_slug`. The sentence is still
   true as written — those three *are* things that ran after that file — but it
   is no longer the full set. Extending it would be authoring new prose, which
   this session may not do, so it is kept verbatim and flagged.
2. **Two migrations numbered `0004`.** This branch carries
   `0004_user_acceptances.sql` and `0004_retire_site_slug.sql` — the collision
   xgd-working resolved by renaming the latter to `0005`. That rename arrived in
   `b6a695ae50` ("Merge branch 'free-REQ-236' into xgd-working"), which is
   missing from ours' ledger for this path while the replays of its neighbours
   are present. Same `b6a695ae50` gap already recorded on the REQ-247 pick
   (REPORT-5707) and on the BUG-93 pick. Renaming a migration is not this pick's
   business — `3d35f86d5a` does not touch `retire_site_slug`, and the file is
   referenced from `0001_baseline.sql` too — so the branch's live filename
   stands and the numbering collision is left for the REQ-236 recovery.

## Enrichment

The auto-enrichment said "Intent unknown on one or both sides. Take the more
recent commit by timestamp and flag this file for post-merge review." Ours
(REQ-257's `zones`/Cloudflare-client commit, replayed onto a main-rooted branch)
is the more recent side, so the naive rule pointed at main — which on a code path
runs straight into the HARD RULE that keeping only main's version is data loss.
Ignored, as on every previous code pick in this run. The commit's own message
settled the substance instead: it states `0011` adds `canonical` plus a partial
unique index because "two hosts reach one site the moment `www` is written", which
is exactly what the conflicted docblock has to describe.

## Exit state

No unmerged entries (`git ls-files -u` empty); `CHERRY_PICK_HEAD` intact at
`3d35f86d5a`; HEAD unmoved at `74f83d14ea`. Staged net change 20 files,
+2657/-116 — real content, as expected for a code pick.
