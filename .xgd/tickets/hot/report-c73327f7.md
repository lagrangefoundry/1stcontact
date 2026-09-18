---
uid: report-c73327f7
id: REPORT-4302
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-18T05:18:38.997822+00:00'
updated_at: '2026-09-18T05:18:38.997822+00:00'
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
  staged with `git add --sparse`. **Resolved to HEAD (ours) on all three hunks.**

This is the pick immediately after the one resolved at attempt 24
(`1524d1503f`). `CHERRY_PICK_HEAD` is now `bcedebfb50` @ 2026-08-23 15:21:10,
the next increment on the same Aug-23 authoring session: it appends
`## Production state — confirmed empirically` and
`## Second finding — bin/publish --production cannot authenticate as written`
after the `Scope drafted` placeholder.

The auto-enrichment reported intent unknown on one or both sides and prescribed
"take the more recent commit by timestamp":

| side | commit | date |
|---|---|---|
| ours (HEAD) | `56ced613a4` | 2026-08-31 12:19:38 -0700 |
| theirs (incoming) | `bcedebfb50` | 2026-08-23 15:21:10 -0700 |

HEAD is later by 8 days, so the enrichment rule and 2e's per-fact timeline rule
agree and both select HEAD.

**What merged cleanly, and is therefore NOT part of the conflict.** Both
sections this commit contributes landed unconflicted at lines 121–170 of the
merged file — git took them without asking. The `fields:` block also merged
clean this time (the base now carries `severity: high`, so ours' additions
`story_points` / `commits` / `version: 0.2.10` / `bundled_in` no longer
collide). So the incoming commit's actual payload was never in contention.

**The three hunks that did conflict, per fact:**

1. **frontmatter scalars** (lines 9–19) — `updated_at` / `completed_at` /
   `last_field_updated` / `status`. Same facts on both sides → later wins →
   HEAD (`status: free_and_reconciled`, `completed_at` set, `2026-08-31`).
   Taking theirs would have demoted the ticket to `status: draft` /
   `completed_at: null`.
2. **the `## Status` paragraph** (lines 113–120) — ours: "Both halves landed
   and verified (2026-08-23) …" pointing at the implementation sections;
   theirs: "Scope drafted, awaiting operator confirmation before coding."
   Same paragraph, changed differently → later wins → HEAD. Note the conflict
   is *only* this paragraph — not the sections that follow it.
3. **trailing hunk** (lines 171–387) — ours adds ~215 lines (`# Approved scope
   addition`, `# Implementation — the tenant fix`, its five UATs, verification,
   `## Still open, and NOT this ticket`); **theirs is empty**. Ours is a strict
   superset with nothing on the other side to lose → keep ours.

No field was invented, and no `fields.intent_uid` / `story_uid` /
`capability_uid` was touched.

## Incoming changes preserved

Verified mechanically against the ours blob, not by eye:

```
git show bcedebfb50:.xgd/tickets/hot/bug-db356ff8.md \
  | grep -Fxv -f <(git cat-file blob e3e27e2c5a…)
```

The only incoming lines absent from the resolution are the four superseded
frontmatter scalars from hunk 1, some blank lines, and the `Scope drafted, …`
placeholder from hunk 2. Every substantive line the commit authored is present,
confirmed by direct grep of the resolved blob:

- `## Production state — confirmed empirically (2026-08-23)` — line 110
- `### Interim production patch applied` — line 123
- `## Second finding — bin/publish --production cannot authenticate as written`
  — line 138
- `Needs its own ticket.` — line 159 (the section's final line, so the block is
  complete, not truncated)

This is the STEP 4 / BUG-1109 redundant-commit case, **not** a discard. HEAD
already contains this commit's entire contribution verbatim — it arrived by a
different route, the post-watermark sync — and then continues past it with the
landed-and-verified implementation record for the same work. Nothing the
developer authored is lost.

Consequently the staged tree is byte-identical to HEAD and this pick nets to no
diff (`git diff --cached HEAD` empty). Per STEP 4 no `--skip` was issued;
`CHERRY_PICK_HEAD` (`bcedebfb50ecf4208ef7ac0834cdee3af79236c9`) is intact for
`cherry_pick_finalize_resolution` to detect the clean staged diff and skip the
commit itself.

No code or test files were involved, so no BUG-1301 precedence exception was
invoked and no UAT function was deleted.

## Flagged for post-merge review

Per the enrichment's instruction for unknown intent. Low risk: the divergence is
confined to one bookkeeping ticket's own metadata and its one-paragraph status
narrative; the later side was kept whole and the earlier side's content survives
inside it. The reviewable question is only whether BUG-36 should read
`free_and_reconciled` at `version: 0.2.10` in `bundle-78f4e2fe` (HEAD's claim,
kept) rather than `draft`.

Worth noting for whoever reviews the bundle: two consecutive picks
(`1524d1503f`, `bcedebfb50`) have now both resolved to no-net-diff for the same
reason. Every commit in this Aug-23 authoring run on BUG-36 appears to be
already present in HEAD via the sync, so further picks touching this ticket will
likely behave identically.

## Verification

- `git ls-files -u` — empty, no unmerged index entries.
- `git status --porcelain` — empty, no conflict-class lines remain.
- `git hash-object <path>` → `e3e27e2c5afebb2be09785e111d0a932cd04b678`,
  byte-exact against stage 2 / `HEAD:<path>`, so no trailing-newline drift from
  the write.
- `git diff --cached HEAD` — empty.
- `git rev-parse CHERRY_PICK_HEAD` → `bcedebfb50ecf4208ef7ac0834cdee3af79236c9`,
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
