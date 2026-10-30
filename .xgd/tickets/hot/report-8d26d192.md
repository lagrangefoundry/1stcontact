---
uid: report-8d26d192
id: REPORT-5501
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T07:40:25.968817+00:00'
updated_at: '2026-09-29T07:40:25.968817+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bug-360c5a44.md` — **UU**, intent/bookkeeping ticket
  (`bug-*`, §2e). Three conflict hunks, all resolved to the HEAD side
  because HEAD is a strict superset per fact:

  1. **Frontmatter.** Incoming carried `updated_at: 2026-09-01T22:29:53Z`,
     `completed_at: null`, `last_field_updated: body`, `status: draft`.
     HEAD carries `updated_at: 2026-09-19T15:15:28Z`,
     `completed_at: 2026-09-14T10:29:01Z`, `last_field_updated: status`,
     `status: free_and_reconciled`. Same facts changed on both sides →
     later-positioned intent wins (HEAD is 18 days newer and records the
     ticket as completed and reconciled; taking incoming would have
     regressed lifecycle state to `draft`).
  2. **Fix section.** Incoming had nothing; HEAD adds a paragraph stating
     that a preview-reload callback which throws is swallowed so the turn
     still streams its answer in full. Addition present on one side only →
     keep it (incoming simply predates it).
  3. **Test plan.** Both sides share the panel bullet. HEAD additionally
     carries *"carrying the counter"*, the throwing-callback assertion, and
     a third **app** bullet (a turn reporting two writes reloads the frame
     twice; a turn reporting none leaves it alone). Incoming's *"The signal
     is not passed on to the chat component"* is the same assertion HEAD
     phrases as *"The signal leaves no trace in the conversation"* — not a
     competing fact. Superset kept.

  Net effect: the staged tree is byte-identical to HEAD
  (`git diff --cached HEAD` empty). No net change to commit; finalize will
  detect this. `git ls-files -u` is empty — no unmerged index entries
  remain. CHERRY_PICK_HEAD (`fd72594eb0`) left in place, untouched.

  Note: this worktree is an 11% sparse checkout and
  `.xgd/tickets/hot/bug-360c5a44.md` is outside the cone, so staging
  required `git add --sparse` (DOC-986 §2/§4.1).

## Incoming changes preserved

Incoming commit `fd72594eb0` ("xgd(ticket): update bug bug-360c5a44",
2026-09-01 22:29 UTC) touched exactly one file, the conflicted ticket.
Every substantive edit it carried is present verbatim in the resolved
(= HEAD) version — verified by grepping `git show HEAD:<path>` for each
distinctive incoming string, 6/6 matched:

- Symptom now cites the operator-confirmed manual browser refresh, locating
  the fault in the panel rather than the write path.
- Root cause reworded from "when an assistant turn ends" to "when the
  assistant writes".
- New `## What is wanted` section (per-write signal, host-derived from the
  draft change counter, deliberately not an L1 tool).
- Fix step 1 rewritten to per-write emission: iterate the model's stream and
  re-read the counter after every `tool_activity` event.
- "Only a counter that actually moved produces a signal" rationale for
  read-only turns.
- Test plan: two write tools emit one `site_changed` frame each, interleaved
  with tool activity; panel invokes `onSiteChanged` once per signal.

No hunk was dropped. The BUG-1301 precedence exception was not invoked and
no UAT test function was deleted — this conflict touches no test files.
