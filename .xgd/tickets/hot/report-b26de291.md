---
uid: report-b26de291
id: REPORT-4303
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-18T05:21:23.516252+00:00'
updated_at: '2026-09-18T05:21:23.516252+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-db356ff8.md` (BUG-36) — **UU**, class **2e** (intent/
  bookkeeping ticket: `bug-*`, not `story`/`acceptance_criterion`/`capability`,
  so 2d's ledger-replay does not apply). Out of the sparse-checkout cone, so
  staged with `git add --sparse`. **Resolved to HEAD (ours) on both hunks.**

Third consecutive pick on this one ticket (`1524d1503f` at attempt 24,
`bcedebfb50` at 25, now `1a64efded1` @ 2026-08-23 16:03:08 at 26) — successive
increments of the same Aug-23 authoring session. This one appends
`# Approved scope addition — fix the publish credential (option A)` through
`## Note — two service tokens were created and revoked`.

The auto-enrichment reported intent unknown on one or both sides and prescribed
"take the more recent commit by timestamp":

| side | commit | date |
|---|---|---|
| ours (HEAD) | `56ced613a4` | 2026-08-31 12:19:38 -0700 |
| theirs (incoming) | `1a64efded1` | 2026-08-23 16:03:08 -0700 |

HEAD is later by 8 days, so the enrichment rule and 2e's per-fact timeline rule
agree and both select HEAD.

**What merged cleanly, and is therefore NOT part of the conflict.** The entire
67-line section this commit contributes landed unconflicted at lines 163–232 of
the merged file — git took it without asking. The `## Status` paragraph, which
conflicted at attempts 24 and 25, merged clean this time too: this commit
doesn't touch it, so ours' rewrite of it is an unopposed one-sided change. So
the incoming commit's payload was never in contention.

**The two hunks that did conflict, per fact:**

1. **frontmatter scalars** (lines 9–19) — `updated_at` / `completed_at` /
   `last_field_updated` / `status`. Same facts on both sides → later wins →
   HEAD (`status: free_and_reconciled`, `completed_at` set, `2026-08-31`).
   Taking theirs would have demoted the ticket to `status: draft` /
   `completed_at: null`.
2. **trailing hunk** (lines 233–383) — ours adds ~150 lines
   (`## Implementation — landed and verified end to end`,
   `# Implementation — the tenant fix`, its five UATs, `## Verified`,
   `## Still open, and NOT this ticket`); **theirs is empty**. Ours is a strict
   superset with nothing on the other side to lose → keep ours.

No field was invented, and no `fields.intent_uid` / `story_uid` /
`capability_uid` was touched.

## Incoming changes preserved

Verified mechanically against the ours blob, not by eye:

```
git show 1a64efded1:.xgd/tickets/hot/bug-db356ff8.md \
  | grep -Fxv -f <(git cat-file blob e3e27e2c5a…)
```

The only incoming lines absent from the resolution are the four superseded
frontmatter scalars from hunk 1, some blank lines, and the `Scope drafted, …`
placeholder that ours' status rewrite replaced. Every substantive line this
commit authored is present, confirmed by direct grep of the resolved blob:

- `# Approved scope addition — fix the publish credential (option A)` — line 163
- `## Why the API token cannot simply be swapped in` — line 168
- `## The change` — line 186
- `## Note — two service tokens were created and revoked` — line 218
- `was ever attached to a policy, so neither granted anything.` — line 225 (the
  contributed block's final line, so it is complete, not truncated)

This is the STEP 4 / BUG-1109 redundant-commit case, **not** a discard. HEAD
already contains this commit's entire contribution verbatim — it arrived by a
different route, the post-watermark sync — and then continues past it with the
landed-and-verified implementation record for the same work. Nothing the
developer authored is lost.

Consequently the staged tree is byte-identical to HEAD and this pick nets to no
diff (`git diff --cached HEAD` empty). Per STEP 4 no `--skip` was issued;
`CHERRY_PICK_HEAD` (`1a64efded18ac2cf82fd680afc1fb3af601a17fd`) is intact for
`cherry_pick_finalize_resolution` to detect the clean staged diff and skip the
commit itself.

No code or test files were involved, so no BUG-1301 precedence exception was
invoked and no UAT function was deleted.

## Flagged for post-merge review

Per the enrichment's instruction for unknown intent. Low risk: the divergence is
confined to this one bookkeeping ticket's own frontmatter scalars; the later
side was kept whole and the earlier side's content survives inside it. The
reviewable question is only whether BUG-36 should read `free_and_reconciled` at
`version: 0.2.10` in `bundle-78f4e2fe` (HEAD's claim, kept) rather than `draft`.

## Pattern worth surfacing to the bundle reviewer

Three consecutive picks have now resolved to no-net-diff for the same reason,
and the conflict is shrinking monotonically as the base advances: 3 hunks at
attempt 24, 3 at 25 (one of them new), 2 now. Each pick's contributed prose
merges cleanly; only the frontmatter scalars and ours' trailing implementation
record conflict, because HEAD sits 8 days ahead of the whole Aug-23 run. Every
commit in that run appears already present in HEAD via the sync, so remaining
picks touching BUG-36 will likely behave identically. This is expected progress
through the bundle, not a stalled retry loop.

## Verification

- `git ls-files -u` — empty, no unmerged index entries.
- `git status --porcelain` — empty, no conflict-class lines remain.
- `git hash-object <path>` → `e3e27e2c5afebb2be09785e111d0a932cd04b678`,
  byte-exact against stage 2 / `HEAD:<path>`, so no trailing-newline drift from
  the write.
- `git diff --cached HEAD` — empty.
- `git rev-parse CHERRY_PICK_HEAD` → `1a64efded18ac2cf82fd680afc1fb3af601a17fd`,
  sequencer untouched.
- No full-suite quality check was run; none was applicable to a
  documentation-only ticket conflict.

## Tooling note

`git checkout --ours --sparse -- <path>`, as STEP 4 prescribes, is not valid
git — `--sparse` is an `add`-only flag and `checkout` rejects it with
`error: unknown option 'sparse'` before permissions are consulted. The genuine
checkout equivalent, `--ignore-skip-worktree-bits`, is denied under this
session's don't-ask mode. What works for an out-of-cone path, each as the sole
content of its own call:

```
git cat-file blob <stage-2-sha> > <path>
git add --sparse -- <path>
```
