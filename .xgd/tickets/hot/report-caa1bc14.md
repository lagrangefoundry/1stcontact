---
uid: report-caa1bc14
id: REPORT-3596
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-26'
created_by: xgd
created_at: '2026-09-10T00:03:19.257484+00:00'
updated_at: '2026-09-10T00:03:19.257484+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-26
---

## Files resolved

Incoming commit: `0fe586d1f6` — "chore(control-app): retain invocation logs [FREE-CODED]" (2026-08-24 14:55:11 -0700, BUG-37).

Both sides are `free_coded`, so the exception in STEP 2 applies: later working-timeline position wins per fact. HEAD's side of both files is 2026-08-31 (REQ-162), later than the incoming 2026-08-24.

- **`apps/control-app/wrangler.toml`** — UU, class 2c (code/config). Rule applied: 2c.2, *non-overlapping changes → combine*. The two sides edited adjacent regions inside `[env.production]`, not the same fact:
  - Incoming inserted `[env.production.observability]` immediately after `routes` (and `[observability]` at the top level).
  - HEAD added a four-line comment preamble ("THE DEPLOYED GATE'S CONFIGURATION…") in front of `[env.production.vars]`.

  Resolved by keeping BOTH: the incoming observability tables stay where the commit places them, followed by HEAD's comment preamble attached to `[env.production.vars]`. No content was invented and nothing from either side was dropped. The ordering constraint the commit message calls out — the production table declared AFTER `routes`, because a TOML table header would otherwise capture the `routes` array and silently un-declare the production route — is preserved in the resolved file.

- **`package.json`** — UU, class 2g (config scalar). Rule applied: scalar conflict on `version`, resolved by the both-sides-`free_coded` timeline exception rather than the plain "incoming wins" default. HEAD's `0.2.20` (2026-08-31, `510d408238`) is kept over the incoming `0.2.12` (2026-08-24). The incoming bump is `0.2.11` → `0.2.12`; HEAD has since advanced past it, so taking the incoming value would have been a version regression, not a preserved developer intent.

## Incoming changes preserved

Verified against `git show 0fe586d1f6 -- <file>` for each file before staging.

**`apps/control-app/wrangler.toml`** — all three incoming hunks are present in the resolved file:
- `[observability]` with `enabled = true` / `head_sampling_rate = 1`, plus its full comment block, at the top level (line 35).
- `[env.production.observability]` with the same two keys and its comment block, after `routes` (line 197).
- No incoming line is absent.

**`package.json`** — the incoming hunk's *intent* (the `0.2.12` version bump) is present in HEAD's ancestry, superseded by the later `0.2.20`. This is a superseded scalar, not a discarded change.

## Note: this commit's effect already landed on HEAD

The staged diff vs HEAD is empty (`git diff --cached --stat HEAD` → no output). This is the redundant-commit case (BUG-1109/BUG-1122), NOT a STEP 3 discard, and the distinguishing evidence is direct:

- HEAD already contains commit **`a82ced7619`**, with the identical subject, identical author, identical timestamp (2026-08-24 14:55:11 -0700), and identical `--stat` (`wrangler.toml` +29, `package.json` 1±, `tests/test_UAT_FC_BUG-37_observability.test.ts` +78) as the incoming `0fe586d1f6`. It arrived on HEAD through a prior sync route.
- `git show a82ced7619 -- apps/control-app/wrangler.toml` places `[env.production.observability]` after `routes` and immediately before the "THE DEPLOYED GATE'S CONFIGURATION" comment — exactly the arrangement this resolution produces. The resolution reproduces HEAD's existing structure rather than diverging from it.
- The commit's UAT file, `tests/test_UAT_FC_BUG-37_observability.test.ts`, is already present in the worktree and traces to `a82ced7619`. It never conflicted. `git diff HEAD 0fe586d1f6 -- tests/test_UAT_FC_BUG-37_observability.test.ts` is empty — the two copies are byte-identical.

No test function was deleted, and no hunk was dropped under the BUG-1301 precedence exception. Per STEP 4, `--skip` was NOT called; the files are staged and the cherry-pick sequencer state (`CHERRY_PICK_HEAD` = `0fe586d1f67c678efd5a1ff02f5978948a41bb11`) is left intact for `cherry_pick_finalize_resolution`.

## Post-merge review flag

Both files were flagged by the enrichment metadata as "intent unknown on one or both sides → flag for post-merge review". Recording that here: the resolutions are low-risk (a comment-block combine and a version scalar kept at HEAD's higher value), and both net to zero change against HEAD.
