---
uid: report-b9ce3483
id: REPORT-4327
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-18T06:42:28.077214+00:00'
updated_at: '2026-09-18T06:42:28.077214+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `apps/control-app/wrangler.toml` — UU, code/config file (2c). One conflict
  hunk only. HEAD carried a 4-line comment paragraph (`THE DEPLOYED GATE'S
  CONFIGURATION...`) that the incoming side lacked; the incoming side's own
  additions (the two `observability` blocks) merged cleanly outside the hunk.
  Resolved under 2c rule 2 (non-overlapping changes: combine) — kept HEAD's
  comment AND all incoming content. This is not a HEAD-wins pick: the incoming
  side never *deleted* that comment, it simply predates it. `CHERRY_PICK_HEAD^`
  does not contain the text, and HEAD gained it in `1450d679d4`
  ("Workflow fix_review_free_coded completed"), authored after the picked
  commit. The absence on the incoming side is timeline drift, not intent.

- `package.json` — UU, scalar version field. Kept HEAD's `0.2.40` over the
  incoming `0.2.11 -> 0.2.12`. Per this file's enrichment rule ("take the more
  recent commit by timestamp"): HEAD's side is `80c9342ac1` (2026-09-01), the
  incoming commit is 2026-08-24, so HEAD is the more recent side. The branch
  reached 0.2.12 already and has since advanced through 0.2.35..0.2.40; writing
  0.2.12 back would regress the version by 28 patch releases.

  Noting the tension explicitly: 2g says scalar config conflicts go to incoming.
  That rule is not applied here because this is not a live scalar disagreement —
  see below, the incoming bump already landed on this branch via a different
  route, so "incoming wins" and "keep 0.2.40" describe the same developer
  intent at two different points on the timeline.

## Incoming changes preserved

- `apps/control-app/wrangler.toml` — VERIFIED PRESENT. The incoming commit adds
  exactly six non-comment lines; all six appear verbatim in the resolved file:
  `[observability]` / `enabled = true` / `head_sampling_rate = 1` at lines
  35-37, and `[env.production.observability]` / `enabled = true` /
  `head_sampling_rate = 1` at lines 217-219. The ordering the commit message
  and its UAT specifically pin also holds: `routes` is declared at line 209,
  BEFORE the `[env.production.observability]` table header at 217, so the
  production route is not captured by that table.

- `package.json` — PRESENT VIA A DIFFERENT ROUTE, not discarded. This is the
  BUG-1109/BUG-1122 redundant-commit case, and it covers the whole pick, not
  just this file.

## This commit is a duplicate — staged diff is empty by design

All three of the picked commit's files are already in HEAD via `a82ced7619`,
which carries the identical subject ("chore(control-app): retain invocation
logs [FREE-CODED]"). For `package.json` the two diffs are byte-identical —
same pre- and post-image blobs (`ff0bd91bcb` -> `4ed4d0a7b9`) on both
`0fe586d1f6` and `a82ced7619`. The UAT `tests/test_UAT_FC_BUG-37_observability.test.ts`
is likewise already tracked in HEAD; no test function was deleted or dropped on
either side, so 2f is not engaged and the BUG-1301 precedence exception was not
needed or used anywhere in this resolution.

HEAD additionally holds a later refinement of the same work (`1450d679d4`),
which is where the conflicting comment paragraph came from. Re-applying the
incoming text over HEAD would therefore regress a reviewed version, not add
anything.

Consequence: after resolution the index equals HEAD and the staged diff is
empty. Per STEP 4 this is not a failure and `--skip` was NOT called — the
finalize step will detect the clean staged diff and skip the commit itself.
STEP 3's discard guard is satisfied independently, by the line-level
verification above: the incoming commit's key changes are present in HEAD,
which is what distinguishes redundant from discarded.

## Sequencer state

Untouched. `CHERRY_PICK_HEAD` is intact at `0fe586d1f67c678efd5a1ff02f5978948a41bb11`.
Only `git add --sparse` was issued; no `--continue`, `--skip`, `--quit`,
`--abort`, `reset`, or `checkout <branch>`. No test suite was run.

## Flagged for post-merge review

Both files, as the enrichment metadata directs for the "intent unknown on one
or both sides" case. Neither is expected to need action given the pick is
redundant, but the `wrangler.toml` comment-vs-timeline call is the one judgment
worth a second pair of eyes.
