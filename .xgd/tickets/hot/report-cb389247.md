---
uid: report-cb389247
id: REPORT-5761
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-30T19:04:57.974944+00:00'
updated_at: '2026-09-30T19:04:57.974944+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

# Resync resolve conflicts — pick 36f33e2b47 (REQ-235)

Picked commit: `36f33e2b47` "feat(activity): raw log store, session inference, and the surface signal [FREE-CODED]" (author 2026-09-17 19:09:14 -0700). HEAD `3a248e3268`. Apply target `9ac98712a708888db67f8aff21f22b16bd98094e`. `prior_stage_failure` empty.

Three UU paths (all CODE/config). All other paths of the pick (activity.ts, log.ts, 0018_activity_log.sql, router.ts, wrangler.toml, builder/*, two REQ-235 UATs, …) applied cleanly and are staged. Real net change is staged, which is expected for a code pick.

## apps/control-app/src/index.ts: INCOMING (theirs) for the whole file

- Ours' ENTIRE delta from base (`:1:` 98553b4e60 → `:2:` 868512b4e9) is one comment block in the Access-gate `else` branch: the long `actingEmail` comment (with the "ON THIS BRANCH AND NOT AFTER THE `if`" paragraph) is replaced by a shorter version.
- Provenance: ours' shorter text is the ORIGINAL BUG-59 wording (`79eb3f7677` / xgd-working `2ca6ef1a16`, 09-07 13:22). The longer wording in base/theirs came from xgd-working merge commits (`bd28544e5d`, `f9f3948bb8`, `1df204d18b`, 09-07 13:23–14:34) that the resync never replayed, because the replay skips merge commits. The xgd-working tip still has the long wording (`grep -c 'signed in to create'` = 1). So ours is a STALE rollback of an incoming merge-resolution, not a main-side edit, and nothing of ours' is lost.
- Theirs extracts `handleFetch` and wraps `fetch` in the request log (`beginRequest`/`finish`/`drain`), binds `business`/`actor` onto the log, adds `closeSessions` on every cron tick plus `pruneRecords` on the daily tick, and adds imports from `./activity` and `./log`. Both modules are staged by this pick.
- Proof: `git diff --stat <theirs fb4b883e37> -- apps/control-app/src/index.ts` is empty, so the file is byte-identical to incoming.

## package.json: OURS (0.2.252), a monotone version counter

- base 0.2.247 / theirs 0.2.248 / ours 0.2.252; both `:1:`→side diffs are this one line only.
- Retirement proof: HEAD's `3cfe1f30d2` "chore: bump version to 0.2.249 [FREE-CODED]" is literally `-0.2.248` / `+0.2.249`, so HEAD already consumed incoming's value and bumped past it. The higher value comes from xgd-working version-bump commits already integrated on this resync branch, NOT from main. Taking 0.2.248 would re-introduce a retired value.
- `git diff --stat <ours 305618cb2a> -- package.json` is empty.

## tests/support/d1-site-factory.ts: KEEP BOTH (2c step 1), 3 regions

1. MIGRATIONS list tail: kept ours' entries (`0014_dns_changes`, `0015_inbound_mail`, `0016_gutter_collection`) and applied theirs' two changes: (a) removed the `LAST IN THE LIST` marker from the previous last entry (0016), (b) appended theirs' `[[REQ-235]]` `0018_activity_log.sql` entry with the marker, verbatim. Theirs' `0017_dns_changes.sql` line was NOT taken: on this branch the file is `db/migrations/0014_dns_changes.sql` (checked with `ls db/migrations/`: no 0017 exists), and ours already imports it. This is a branch-local naming difference, not a dropped change.
2. atHead docblock, "today X" clause: took theirs (`[[REQ-235]]'s idx_log_records_business, the activity log's operator read`) and kept ours' remaining clauses (`0004_retire_site_slug` wording; `0005_retire_site_slug.sql` does not exist on this branch).
3. `.bind(...)`: theirs, `idx_log_records_business`. Coherence check: `grep -n CREATE db/migrations/0018_activity_log.sql` shows the file's LAST statement is `CREATE INDEX … idx_log_records_business` (line 147), so it matches what the query asks.

Proof in both directions:
- `git diff <ours af262153f5> :0:<path>` shows exactly theirs' delta: marker moved, 0018 entry added, today clause, bind. Nothing else.
- `git diff <theirs 27c6ef6cfa> :0:<path>` shows only ours' pre-existing branch-local deltas: 0004/0014 filenames, the 0007 renumbering note, and ours' paragraph wording. No incoming line is missing.

## Flagged for post-merge review (not fixed; fixing would mean writing new prose)

- d1-site-factory.ts: the "THE LAST STATEMENT OF THE LAST FILE" paragraph still says "`0016` creates two indexes". The last file is now `0018`, which creates two tables and then three indexes. Incoming's own version (which said `0017`) was already stale on its side too.
- d1-site-factory.ts: a stale `// LAST IN THE LIST` comment above `0015_inbound_mail` came from an earlier pick (REQ-268). There is now exactly one other, correct marker above 0018.
- d1-site-factory.ts: the 0016 entry's "because `atHead` now asks about its last statement" is no longer true.
- index.ts: the xgd-working merge-commit wording of the BUG-59 comment was never replayed onto the resync branch. It arrives here via incoming, which is correct, but other merge-commit-only resolutions may be missing elsewhere (see the REQ-236 `b6a695ae50` gap).
- The auto-enrichment's "take the more recent commit by timestamp" rule was ignored on all three paths. On CODE paths the policy's 2c keep-BOTH/incoming-authoritative rule governs, and on package.json retirement governs, not the timestamp. The enrichment's "flag for post-merge review" request is met by the list above.

State after resolution: no unmerged paths, CHERRY_PICK_HEAD intact (`36f33e2b47`), HEAD unmoved (`3a248e3268`).
