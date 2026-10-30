---
uid: report-384ec79e
id: REPORT-5671
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-30T06:19:04.094899+00:00'
updated_at: '2026-09-30T06:19:04.094899+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `tests/support/d1-site-factory.ts` — code file (`.ts`), class `UU`, materialized
  with 2 conflict regions. Rule applied: INTEGRATE BOTH SIDES (HARD RULES for code
  files / §2c). The enrichment's fallback rule ("intent unknown on one or both
  sides — take the more recent commit by timestamp and flag for post-merge review")
  was NOT followed: it is a ticket-file rule and applying it here would have
  discarded one of two genuine free-coded changes. Both intents are known and they
  are disjoint.

The commit's other three files (`apps/control-app/src/business.ts`, the
`0006_business_name_unique.sql` → `0007_business_name_unique.sql` rename, and
`package.json`) auto-merged and were not touched.

### What each side changed

- **Ours** (HEAD `34b815b321`, "feat(business): the name is stored once, and a
  rename reports its effects"): renumbered `0005_retire_site_slug` → `0004_`,
  appended `0006_asset_grants.sql` ([[REQ-244]]) to `MIGRATIONS`, and rewrote the
  `atHead` doc comment to name those files.
- **Theirs** (incoming `b7e9c4db08`, "chore(migrations): renumber the business-name
  index to 0007"): renamed `0006_business_name_unique.sql` → `0007_`, updated the
  import path in this list, and rewrote the `atHead` doc to say the marker moves
  with the list.

The two collide only because both edit the tail of `MIGRATIONS` and the same doc
comment. They do not contradict each other — in fact ours' own comment documents
the exact wart theirs fixes: "This and `0006_asset_grants` are both numbered
`0006`". Incoming is therefore the resolution of a duplicate-number ordering that
ours introduced.

Incoming is also load-bearing, not optional: its file rename is already staged
(`R db/migrations/0006_business_name_unique.sql -> 0007_business_name_unique.sql`)
and `ls db/migrations/` confirms only `0007_business_name_unique.sql` exists on
disk. Keeping ours' `0006_business_name_unique.sql` import would have pointed the
fixture at a file that is gone and broken every suite that calls `applySchema()`.

## Incoming changes preserved

No incoming hunk was dropped. The BUG-1301 precedence exception was not used.

Verified from the INDEX (`git show :tests/support/d1-site-factory.ts`), not the
working tree:

- Incoming import path — line 87: `() => import('../../db/migrations/0007_business_name_unique.sql?raw')`
- Incoming prose, region 1 — line 81: "would refuse. LAST IN THE LIST, which is
  what `atHead` below asks about."
- Incoming prose, region 2 — line 179: "IT ASKS ABOUT THE LAST FILE IN THE LIST,
  WHICHEVER THAT IS — today `0007`'s index."
- Incoming prose, region 2 — line 184: "MOVES WITH THE LIST: a migration appended
  below without moving it re-opens exactly that hole." (the warning theirs adds and
  base/ours lacked)
- No conflict markers remain (`grep -n '<<<<<<<\|>>>>>>>'` over the staged blob:
  no matches).

Ours' changes are preserved in full alongside them — all seven entries survive in
order, each pointing at a file that exists:

    0001_baseline, 0002_session_rotation, 0003_contact_change_cursor,
    0004_user_acceptances, 0004_retire_site_slug, 0006_asset_grants,
    0007_business_name_unique

### Where the two sides genuinely disagreed, and how it was integrated

Two statements of fact could not both stand, and in each case the merged text
keeps incoming's *claim* while correcting the file names incoming could not have
known about (they are ours' renames, made after incoming branched):

1. **Region 1.** Ours' paragraph explaining that `business_name_unique` and
   `asset_grants` "are both numbered `0006`" is obsolete the moment incoming's
   rename lands. It was rewritten to record the renumber and why (`wrangler d1
   migrations apply` orders by filename, so a shared number is an ordering nobody
   declared) — the same reasoning ours already used for the `0005`→`0004` renumber
   a few lines above, and it preserves ours' point that `asset_grants` runs first.
   Incoming's one-line `atHead` cross-reference is kept verbatim.
2. **Region 2.** Incoming's doc names `0005` and `0007`; ours names
   `0004_retire_site_slug`, `0006_asset_grants` and `0006_business_name_unique`.
   The merged text uses incoming's structure and its "MOVES WITH THE LIST" warning
   with the correct post-rename file names: `0004_retire_site_slug` adds
   `sites.kind`, and `0006_asset_grants` + `0007_business_name_unique` are what run
   after it.

No test function was deleted or modified; `atHead`'s actual query and its
`idx_tenants_owner_name` bind value are identical on both sides and untouched.

## Arbitration of last resort (BUG-1460)

Not applicable — STEP 3h never fired. Both sides' intents were legible from the
diffs and the on-disk migration filenames, and the integration preserves both in
full, so no tie-break was needed.

## Forecast for later picks on this path

`tests/support/d1-site-factory.ts` is an actively free-coded file on both sides, so
unlike the ticket-file series this one carries no "ours == incoming tip, all
remaining picks are `--ours`" shortcut. Expect future conflicts here to be genuine
integrations too. The stable signal: `MIGRATIONS` is append-mostly and `atHead`'s
doc comment must name whatever is LAST in it — when a pick renumbers or appends a
migration, take incoming's file path (the rename is already staged, so ours' path
would dangle) and keep every entry ours has added, then reconcile the two doc
comments against `ls db/migrations/` rather than against either side's prose.
