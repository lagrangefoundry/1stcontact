---
uid: report-e7bfabb0
id: REPORT-2984
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-21'
created_by: xgd
created_at: '2026-08-31T16:00:27.303550+00:00'
updated_at: '2026-08-31T16:00:27.303550+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-21
---

## Files resolved

- `.xgd/tickets/hot/bundle-b3b7c399.md` — **UU**, intent/bookkeeping ticket (rule **2e**).
  Resolved by taking the **ours/HEAD** side in full (`git checkout --ours`, then
  `git add --sparse`). Worktree blob verified as `bb444506b8` (exact stage-2 blob,
  no conflict markers).

### Per-fact analysis (2e)

Incoming commit `7d0a6ec833` ("xgd(ticket): update bundle bundle-b3b7c399",
2026-08-23 19:10 -0700) touches exactly four lines of frontmatter and nothing else:

| Fact | Base (stage 1) | Ours / HEAD (stage 2) | Incoming (stage 3) |
|---|---|---|---|
| `status` | `ready_to_reconcile` | `free_and_reconciled` | `reconciling` |
| `updated_at` | `2026-08-24T02:10:41` | `2026-08-31T14:23:04` | `2026-08-24T02:10:52` |
| `last_field_updated` | `created_at` | `result` | `status` |
| trailing newline | present | removed | removed |

There are **no disjoint fields on the incoming side** — every fact it changes is a
fact ours also changes, later, and further along the *same* lifecycle path
(`ready_to_reconcile` → `reconciling` → … → `free_and_reconciled`). So 2e's
"apply BOTH" and "keep the superset" branches do not arise; this is 2e's genuine
same-field conflict, resolved per-fact by later position.

Timeline: neither side carries an `intent_uid` for this bundle ticket, so
`xgd working-timeline` is not applicable — the auto-enrichment's stated fallback
("Intent unknown on one or both sides. Take the more recent commit by timestamp")
governs. Ours is `8e07e6015d` (2026-08-31 07:23:04 -0700); incoming is `7d0a6ec833`
(2026-08-23 19:10:52 -0700). **Ours is later by 7 days** and is taken.

Ours additionally carries the completion artifacts that only exist *because* the
bundle passed through `reconciling`: `completed_at`, `result: pass`,
`merged_at_commit: eef7a8b48b`, a populated `orphan_commits` map (137 old→new
pairs), and `fields.commits` collapsed from 24 pending working_shas to a single
entry bearing `main_sha`. Discarding those to reinstate `reconciling` would move
BUNDLE-20's bookkeeping *backwards*.

Bodies are byte-identical on both sides — the full ours-vs-theirs diff is confined
to frontmatter (verified: the diff's last hunk ends at `---` / `# Bundle`), and
ours already has the trailing newline removed, so that part of the incoming change
is present too. Nothing was invented; no content is in the resolution that was not
on the ours side.

## Incoming changes preserved

This is a **bookkeeping ticket, not a code file** — no implementation hunks are in
play, and the BUG-1301 precedence exception was not invoked (no hunk was dropped
on refactor grounds).

STEP 3's discard-vs-redundant test resolves to **redundant**: the incoming commit's
key change is the status transition to `reconciling`, and that transition is
**present in HEAD via a different route** — HEAD passed *through* `reconciling` and
on to `free_and_reconciled`, with the completion fields above as direct evidence
that the transition happened. The incoming fact is superseded, not lost. This is
not the STEP 3 failure case (where the incoming change is simply *absent* from
HEAD), so no `@fail` is warranted.

Consequently the resolution nets to **no diff vs HEAD** (`git diff --cached --stat
HEAD` is empty). Per STEP 4 this is expected for a superseded bookkeeping commit
and is not a failure: `git cherry-pick --skip` was **not** called, and the
cherry-pick sequencer state was left intact (`CHERRY_PICK_HEAD` confirmed still
present) for `cherry_pick_finalize_resolution` to detect the clean staged diff and
skip the commit itself.

## Flagged for post-merge review

Per the auto-enrichment rule for unknown-intent conflicts, this file is flagged:
BUNDLE-20's ticket state was decided by commit timestamp rather than by an intent
ledger position. The outcome is the strictly more advanced lifecycle state, so the
risk is low, but a reviewer may want to confirm BUNDLE-20 is legitimately
`free_and_reconciled` on main.
