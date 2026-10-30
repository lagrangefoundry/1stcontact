---
uid: report-9dc00e43
id: REPORT-5797
type: report
title: 'Resync resolve conflicts: ec118d67626fd31cfce67ca88dc9908ecdde70ed'
created_by: xgd
created_at: '2026-10-02T13:05:19.282404+00:00'
updated_at: '2026-10-02T13:05:19.282404+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

# Resync resolve conflicts — pick `1e054221f2` (REQ-306, turn ledger)

- Picked commit: `1e054221f24abdded3ed92181c234aba4d3f132b` — *feat(turns): record a turn before it can die, so its death is legible [FREE-CODED]* (2026-09-22 19:49:14 -0700), 18 paths.
- HEAD: `1296ee2ac8`. Apply target: `ec118d67626fd31cfce67ca88dc9908ecdde70ed`. Retry count 1, `prior_stage_failure` empty.
- Conflicted: `apps/control-app/src/builder/chat.js`, `db/migrations/manifest.json`, `package.json`, `tests/support/d1-site-factory.ts`. All four now staged; no `UU` remains; cherry-pick left in progress for the workflow to finalize.

## Method: the developer's own merge is the resolution

xgd-working merge `1d206a13a1` (*Merge branch 'free-REQ-306' into xgd-working*, 2 min after the pick; second parent IS the picked commit) lists exactly these four files under `# Conflicts:`. Resync never picks merge commits, so that resolution cannot arrive through the queue; it was applied here.

Input check: stage-2 (ours) blobs of `chat.js` (`7735f67ff2`), `manifest.json` (`293dded05b`) and `package.json` (`e9651b9049`) are byte-identical to the merge's first parent, so the merge blob is the resolution of this exact conflict.

| Path | Resolution |
|---|---|
| `apps/control-app/src/builder/chat.js` | merge blob `fbe7a63ed1` — both sides kept (ours: BUG chat-moment fix; theirs: REQ-306 turn-death panel) |
| `db/migrations/manifest.json` | merge blob `e5b47624ed` — keeps ours' `0020_asset_digest.sql` AND adds theirs' entry as `0021_turn_log.sql` |
| `package.json` | merge blob `1e93d17683` — `version` 0.2.336 (base .326 / ours .335 / theirs .327; ours had already passed theirs, and the merge bumped once more) |
| `tests/support/d1-site-factory.ts` | merge delta (`merge^1 → merge`) replayed onto ours with `git merge-file`; one residual region = the recurring `atHead()` docblock paragraph: theirs' "today `[[REQ-306]]`'s `idx_turn_log_tenant`…" clause + ours' branch-local `0004_retire_site_slug` wording |

## One change outside the conflicted files (developer's, not authored here)

The merge renumbered the incoming migration because REQ-304 already holds `0020`: `db/migrations/0020_turn_log.sql` → `db/migrations/0021_turn_log.sql`, with an added `WHY 0021 AND NOT 0020` header paragraph. That rename is part of the conflict's resolution (the manifest entry and the factory import both name `0021_turn_log.sql`), so it was applied: staged file is the merge's blob, and its sha256 `6bb8acbc…52c6b` equals the manifest entry. `0020_asset_digest.sql` on HEAD hashes to the manifest's `c7e9dbcf…edb5`. Nothing in `apps db tests tools` still references `0020_turn_log`.

## Proof nothing incoming was dropped

- `git diff --cached --stat <merge>` over all 18 pick paths differs on only three files: `builder.css` (190), `router.ts` (4), `d1-site-factory.ts` (60).
- For each, the changed lines of `staged → merge` are IDENTICAL to those of `HEAD → merge^1` (compared as sorted-order `+/-` line dumps: 60 vs 60 lines, 170 vs 170 lines, `diff` empty). I.e. the only distance from the developer's merge is distance this branch already had before the pick (migration naming `0004_retire_site_slug` / `0014_dns_changes`, css ordering) — none of it is REQ-306 content.
- `0021_turn_log.sql`'s last statement is `CREATE INDEX … idx_turn_log_tenant`, which is what the merged `atHead()` binds.
- Staged vs HEAD: 18 files, +2070/-30 (pick itself: +2059/-27; the difference is the merge's renumber prose).

## Tests

`vitest run` on the four non-workers suites the pick touches (REQ-306 console turn health, REQ-306 panel says the turn died, BUG-123, BUG-46): 4 files, 22 tests, all pass. The two REQ-306 `*.workers.test.ts` suites cannot run in this role (workerd `listen EPERM`) — NOT verified.

## Flags for post-merge review

1. `d1-site-factory.ts` keeps REQ-304's paragraph "`pragma_table_info` RATHER THAN `sqlite_master`, BECAUSE THE LAST FILE ADDS A COLUMN" although `atHead()` is back on `sqlite_master`. The developer's merge left it that way; applied faithfully, not edited.
2. `manifest.json` (unchanged context, same as HEAD and xgd-working) names `0005_retire_site_slug.sql` / `0017_dns_changes.sql`, while this branch's files are `0004_retire_site_slug.sql` / `0014_dns_changes.sql`. Pre-existing branch-local naming drift, not touched.
3. Enrichment's "take the more recent commit by timestamp" was not used on any path; keep-both via the developer merge governs.

## Forecast

Next related picks: `f0b4898040` (*bump version for the turn ledger after merge renumber*), then `40b5ae7972` / `78b52cefea` (re-bumps). With `package.json` now at the merge's .336 they should apply clean or conflict on the `version` line only (incoming wins if higher).
