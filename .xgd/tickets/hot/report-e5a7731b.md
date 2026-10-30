---
uid: report-e5a7731b
id: REPORT-4698
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T10:20:03.730231+00:00'
updated_at: '2026-09-21T10:20:03.730231+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-78370159.md` — UU, intent/bookkeeping ticket
  (STEP 2e, request-*). Three conflict hunks, resolved per-fact:
  1. **Frontmatter block** (`updated_at` / `last_field_updated` / `status`).
     Same facts changed on both sides → genuine conflict, later-positioned
     intent wins. HEAD: `updated_at 2026-09-09T21:32:50Z`, `status: bundled`.
     Incoming (`d3a61cf519`, `2026-09-01T00:42:19Z`): `status: free_coding`.
     HEAD is later on every field; taking incoming would regress the ticket
     out of `bundled`. **Kept HEAD.**
  2. **"Existing acceptance criteria this supersedes" → blob-addressing
     bullet.** Same paragraph on both sides, but HEAD's is a strict
     later refinement of incoming's: it covers `[[REQ-163]]` *and*
     `[[REQ-162]]` (incoming covers only REQ-163), and adds that both
     suites were already failing before this ticket plus which claims
     remain asserted. Incoming's text is a proper subset of the same
     assertion. **Kept HEAD.**
  3. **Trailing `to keep asking.`** — byte-identical text on both sides;
     the only real difference was HEAD lacking a newline at EOF. **Kept
     the line, took incoming's trailing newline.**

No DU/UD/AA conflicts. No code files, no spec tickets, no UAT test files
in this conflict set — 2c/2d/2f did not apply, and no test function was
deleted.

## Incoming changes preserved

`d3a61cf519` is a body-expansion commit (+155/-22). Every one of its
prose additions is already present verbatim in the resolved file,
because HEAD's version of this ticket descends from it:

- "**The rights record is shown read-only.**" paragraph — present.
- "**One overlay instance, two watchers** — not one overlay per entry
  point." — present.
- "### The role is a new field, and it narrows the rights [[DOC-38]]
  §10.1 infers" section with all three load-bearing bullets — present.
- Chat-route-drop expansion ("It is the client's own turn, because it
  is…") and the delta-fires clause — present.
- '### "Put it on the site" means the bytes are on the site' section and
  its three bullets — present.
- The `role` field on `POST /api/material`, the origin-contract routes,
  and the "Fixed on the way: blob reads addressed by the wrong key"
  section — present.

The only incoming text not reproduced literally is hunk 2's shorter
blob-addressing paragraph, which is superseded in place by HEAD's
expanded version of the same paragraph — same claim, wider scope. No
incoming assertion was discarded. The BUG-1301 precedence exception was
not invoked; nothing was deleted.

Net effect of the staged tree versus HEAD is a single added newline at
end of file; the incoming commit is otherwise already absorbed. Staging
is clean (`M  .xgd/tickets/hot/request-78370159.md`, no conflict-class
lines) and `CHERRY_PICK_HEAD` (`d3a61cf519`) is intact.
