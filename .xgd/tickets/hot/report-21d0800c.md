---
uid: report-21d0800c
id: REPORT-4533
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-20T20:12:27.435654+00:00'
updated_at: '2026-09-20T20:12:27.435654+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-b88b79fe.md` (REQ-154) — class **AA** (both added);
  intent/bookkeeping ticket (`request-*`) → **rule 2e**. Resolved by keeping the
  **HEAD side**, which is a strict superset of the incoming side. Staged with
  `git add --sparse` (path is under `.xgd/tickets/`, sparse-checkout is on).

  Why AA: the incoming commit `97327f55c1` is a *file creation*
  (`new file mode`, `--- /dev/null`) of the ticket at its original
  2026-08-20 draft state, so both sides independently "added" the path.

## Incoming changes preserved

No code/implementation files were in conflict, so STEP 3's incoming-authoritative
check (rule 2c) does not apply. For the one ticket file, the incoming side
contributes nothing absent from HEAD — verified mechanically, not by eye:

- **Prose**: both sides' bodies were canonicalised (blockquote markers stripped,
  `_`/`*` emphasis markers stripped, list items split on blank lines, whitespace
  collapsed) and compared block-by-block. All **25** canonical blocks from the
  incoming side are present in HEAD; **0** missing. The apparent textual deltas
  are entirely line-wrapping and `*`→`_` emphasis-marker changes introduced by
  HEAD-side commit `0897d894` (2026-08-30), whose diff is a pure rewrap with no
  content change.

- **Frontmatter**: no key exists on the incoming side that is absent from HEAD.
  HEAD adds three: `fields.commits`, `fields.version` (0.2.16),
  `fields.bundled_in` (bundle-8eef3846).

- **Shared keys that differ** — all three are lifecycle advancement, not competing
  intent, since the incoming side is the ticket's own earlier draft state:
  - `status`: HEAD `bundled` vs incoming `draft`
  - `updated_at`: HEAD `2026-08-31T05:05:09` vs incoming `2026-08-20T23:16:27`
  - `last_field_updated`: HEAD `status` vs incoming `body`

  Rule 2e's per-fact later-intent tiebreak and the auto-enrichment rule
  ("take the more recent commit by timestamp") both select the HEAD side.

- HEAD additionally carries the entire `# What was built` section (AC3's fourth
  option, files table, test plan, AC status), absent on the incoming draft.

No BUG-1301 precedence exception was invoked; no hunk was dropped; no test
function was deleted.

## Post-merge review flag

The enrichment metadata classified intent as unknown on one/both sides and asked
that the file be flagged for post-merge review. Flagging it here: the resolution
discards nothing, but the choice rests on the incoming commit being the ticket's
original creation rather than a competing later edit.

## Staging state

`git status --porcelain` is empty: the resolution is byte-identical to HEAD, so
the staged diff is clean (`git diff --cached --quiet HEAD` passes). Per the
workflow instructions, `--skip` was NOT called — the finalize step is expected to
detect the clean staged diff and skip the commit. `CHERRY_PICK_HEAD`
(`97327f55c1d75dfef7bf44d407e7b73949eef6e6`) is intact; no
`cherry-pick --continue/--skip/--quit/--abort` was run.
