---
uid: report-038d1b9f
id: REPORT-3067
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-22'
created_by: xgd
created_at: '2026-08-31T20:50:25.493437+00:00'
updated_at: '2026-08-31T20:50:25.493437+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-22
---

Cherry-pick 5af1ff949d4069fada2d2f0b4e17871aec5980c6 ("xgd(ticket): update bug
bug-db356ff8"), scope path .../cherry_pick_one_attempt/37/0. One conflicted path.

## Files resolved

- `.xgd/tickets/hot/bug-db356ff8.md` — class **UU**, intent/bookkeeping ticket
  (STEP 2 rule **2e**). Path is outside the sparse-checkout cone
  (`.gitignore`-adjacent sparse rules exclude `/.xgd/tickets/**`), so resolved
  with `git checkout --ours --` followed by `git add --sparse --`.

  Resolved **per fact**, which resolved uniformly to the HEAD side because HEAD
  is a strict superset:

  | Fact | Base | Ours (HEAD) | Theirs (incoming) | Taken |
  |---|---|---|---|---|
  | body: `## Status` rewrite | old text | new text | new text | identical on both sides — kept |
  | body: `# Implementation — the tenant fix` appendix (112 lines) | absent | present | present | byte-identical on both sides — kept |
  | `updated_at` | 2026-08-23T23:42:40 | 2026-08-26T17:36:27 | 2026-08-24T01:48:23 | ours (later) |
  | `status` | draft | **bundled** | draft (untouched) | ours — only HEAD changed it |
  | `last_field_updated` | body | **status** | body (untouched) | ours — only HEAD changed it |
  | `fields.story_points`, `fields.commits`, `fields.version`, `fields.bundled_in` | absent | added | absent | ours — additions only HEAD made |

  No fact was changed differently by both sides, so the timeline tiebreak was
  not needed for any field; where it would have applied (`updated_at`) the HEAD
  side is also the later one, agreeing with the enrichment block's
  "take the more recent commit by timestamp" rule.

  No `fields.intent_uid` / `story_uid` / `capability_uid` was touched, and no
  content absent from both sides was introduced.

## Incoming changes preserved

No code/implementation files were in this conflict — the single conflicted path
is a bookkeeping ticket. The incoming commit's entire substantive change is
nonetheless present in the resolution, verified against
`git show 5af1ff94 -- .xgd/tickets/hot/bug-db356ff8.md`:

- the `## Status` paragraph rewrite ("Both halves landed and verified
  (2026-08-23)…") — present at line 106 of the resolved file;
- the whole `# Implementation — the tenant fix` appendix, including the
  `storeFor` snippet with the `err.reason !== 'unknown'` guard (line 291), the
  `test_UAT_FC_BUG-36_tenant_bootstrap.workers.test.ts` five-UAT list (line 326),
  the REQ-149 supersession note, and the `## Still open, and NOT this ticket`
  section (line 367).

A direct `git diff` of the incoming blob against the resolved file shows the two
differ only in the six frontmatter facts tabled above (plus a trailing-newline
byte); the body is byte-identical. Nothing developer-authored was discarded.

Only the incoming `updated_at` value itself is not carried, superseded by HEAD's
later `2026-08-26T17:36:27` — that is the intended per-fact outcome, not a drop.

No hunk was dropped under the BUG-1301 precedence exception; no test function on
either side was deleted.

## Note for the finalize step

The staged tree is identical to HEAD (`git diff --cached --stat HEAD` is empty).
This is the redundant-commit case of BUG-1109/BUG-1122: the incoming commit's
body change had already reached this branch by another route (HEAD's
`seed_local_overlay` commit for the same ticket carries the same appendix), and
HEAD then advanced the ticket to `status: bundled` with its bundling fields on
top. Per STEP 4 this is not a failure and `--skip` was NOT called; the
cherry-pick sequencer state is untouched and `CHERRY_PICK_HEAD` still reads
5af1ff949d4069fada2d2f0b4e17871aec5980c6. Finalize should detect the clean
staged diff and skip the commit.
