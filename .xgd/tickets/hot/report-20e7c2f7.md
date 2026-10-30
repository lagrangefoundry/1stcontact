---
uid: report-20e7c2f7
id: REPORT-4859
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-23T19:03:07.343016+00:00'
updated_at: '2026-09-23T19:03:07.343016+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/bug-360c5a44.md` — **UU**, intent/bookkeeping ticket (STEP 2e).
  Three conflict regions, all of them the *same fact* changed on both sides, so the
  per-fact later-positioned-intent rule governs each. HEAD wins all three; the
  resolved blob is byte-identical to `HEAD:.xgd/tickets/hot/bug-360c5a44.md`
  (trailing-newline included, verified by diff against the HEAD blob).
  Staged with `git add --sparse` (path is outside the sparse cone — DOC-986 §2/§4.1;
  the worktree reports 11% of tracked files present).

  - **Frontmatter status block (line 8).** Same fields on both sides.
    HEAD: `updated_at 2026-09-19T15:15:28`, `completed_at 2026-09-14T10:29:01`,
    `last_field_updated: status`, `status: free_and_reconciled`.
    Incoming: `updated_at 2026-09-01T22:29:53`, `completed_at: null`,
    `last_field_updated: body`, `status: draft`.
    HEAD is later by 18 days; taking incoming would have reverted the ticket from
    `free_and_reconciled` to `draft` and unset `completed_at`.

  - **Body paragraph (line 98).** HEAD carries a paragraph stating that a reload
    callback which throws is swallowed so a failing host does not take the
    conversation with it. Incoming has no text at that position — it predates the
    decision. Kept HEAD's paragraph; nothing on the incoming side was discarded.

  - **Test-plan `panel` bullet (line 120).** Both sides assert the same property,
    reworded: incoming's "the signal is not passed on to the chat component" is
    HEAD's "the signal leaves no trace in the conversation." HEAD additionally pins
    the counter payload, the throwing-callback case, and carries an **app** bullet
    the incoming side lacks — a strict superset of the incoming bullet.

## Incoming changes preserved

Not a code file, but the substantive content of `fd72594eb0` was checked hunk by hunk
against the resolved result. The incoming commit is a **body revision dated
2026-09-01** (`last_field_updated: body`) whose narrative changes are all already
present in HEAD, having been carried forward by the later
`2ebb13af8e` (2026-09-17, seed_local_overlay) and `e8f9e7c85b` (2026-09-19) commits on
this file's HEAD-side history. Specifically, every non-conflicting hunk of
`git show fd72594eb0 -- .xgd/tickets/hot/bug-360c5a44.md` merged cleanly and is
verbatim in the resolved file:

- Symptom section gains the manual-browser-refresh observation locating the fault in
  the panel rather than the write path — **present**.
- Root cause reworded "when an assistant turn ends" → "when the assistant writes" —
  **present**.
- New **What is wanted** section (per-write signal, host-derived from the draft change
  counter, deliberately no new L1 operation) — **present in full**.
- Fix step 1 rewritten from one terminal `site_changed` event to per-`tool_activity`
  counter re-reads emitting `{kind: 'site_changed', meta: {at, changes}}` — **present**.
- Fix closing line rewritten to "Only a counter that actually moved produces a signal"
  — **present**.
- Test-plan **workerd** bullet rewritten to two write tools, a frame after each,
  interleaved rather than collected at the end — **present**.

No incoming hunk was dropped. The BUG-1301 precedence exception was **not** invoked and
was not needed: nothing on the incoming side had to be deleted to resolve this file.

Net effect: the resolved tree matches HEAD exactly for this path, so this cherry-pick
carries no staged diff. Per STEP 4 the resolution was staged and left as-is —
`--continue`/`--skip` were not invoked; `CHERRY_PICK_HEAD` (`fd72594eb0`) is intact for
the finalize step, which will detect the clean staged diff and skip the commit.
