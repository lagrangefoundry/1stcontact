---
uid: report-24ac3f0a
id: REPORT-3060
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-22'
created_by: xgd
created_at: '2026-08-31T20:35:04.415523+00:00'
updated_at: '2026-08-31T20:35:04.415523+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-22
---

## Files resolved

- `.xgd/tickets/hot/request-b88b79fe.md` — **AA** (both added), intent/bookkeeping ticket
  (`request-*`), so rule **2e** applies, resolved with `git checkout --ours` +
  `git add --sparse` (path is outside the sparse-checkout cone, DOC-986 §2/§4.1 —
  the conflict existed only in the index, with no working-tree markers).

  **Rule applied: 2e "one side is a strict superset — keep the superset."** Verified by
  word-level diff of index stage `:3` (incoming) against stage `:2` (ours) rather than by
  line count. The only text present *solely* on the incoming side is:
  - the older frontmatter scalars — `updated_at: 2026-08-20T23:16:27`,
    `last_field_updated: body`, `status: draft`; and
  - markdown emphasis/wrapping artifacts — `*"…"*` where ours has `_"…"_`, and blockquote
    `>` continuation markers left over from ours reflowing hard-wrapped lines.

  No sentence, section, acceptance criterion or field of the incoming body is absent from
  ours. Ours contains the identical body (reflowed) **plus** the entire `# What was built`
  section, `status: bundled`, `fields.version: 0.2.16`,
  `fields.bundled_in: bundle-8eef3846`, and `fields.commits[].working_sha`.

  The timeline rule points the same way and did not need to arbitrate any per-fact
  disagreement: the HEAD-side commits touching this file are dated 2026-08-31
  (`1aa73c2027` seed_local_overlay, `721f738667` update), while the incoming commit
  `97327f55c1d75dfef7bf44d407e7b73949eef6e6` is dated 2026-08-23. This also matches the
  auto-enrichment's "take the more recent commit by timestamp" instruction for this file.

  Nothing was invented: the resolved file is byte-identical to index stage `:2`. No
  `fields.intent_uid` / `story_uid` / `capability_uid` was touched.

## Incoming changes preserved

The incoming commit `97327f55c1d75dfef7bf44d407e7b73949eef6e6`
("xgd(ticket): update request request-b88b79fe") touches **exactly one file** — this
ticket — with 98 insertions and no code/implementation files. There is therefore no
code file to check for discarded developer changes.

Its content is **present in HEAD via a later route, not discarded** (the STEP 3
redundant-vs-discarded distinction): every line the incoming commit contributes is the
REQ-154 ticket body at its `draft` state, and HEAD already carries that same body verbatim
in substance — reflowed to unwrapped lines — having subsequently advanced the ticket to
`bundled` and appended the `# What was built` record. Confirmed by the word-level diff
above: the incoming side contributes no unique prose.

Consequently the staged tree nets to **no diff vs HEAD** (`git diff --cached --stat HEAD`
is empty). Per STEP 4 this is not a failure and `--skip` was **not** called; the commit is
genuinely redundant rather than discarded, and Python's
`cherry_pick_finalize_resolution` step will detect the clean staged diff and skip the
commit itself. `CHERRY_PICK_HEAD` was left intact — no `--continue`, `--skip`, `--quit`,
`--abort`, `reset` or `checkout <branch>` was run.

No BUG-1301 precedence exception was invoked; no test function was deleted; no UAT or
other test file was part of this conflict.
