---
uid: report-35f9c73a
id: REPORT-4732
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T14:24:38.865163+00:00'
updated_at: '2026-09-21T14:24:38.865163+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-909e42f8.md` (REQ-164) — **UU**, intent/bookkeeping
  ticket (§2e). One conflict hunk, confined to the frontmatter lifecycle block;
  the entire body merged cleanly.

  Conflicting facts and resolution (per-fact, later-positioned intent wins):

  | field | HEAD (kept) | incoming `6e301eb747` |
  |---|---|---|
  | `updated_at` | `2026-09-09T21:32:49` | `2026-09-01T18:14:18` |
  | `last_field_updated` | `status` | `body` |
  | `status` | `bundled` | `ready_to_reconcile` |

  HEAD carries the later-positioned intent by eight days and one lifecycle step
  (`ready_to_reconcile` → `bundled`). Corroborated structurally: the
  *unconflicted* `fields:` block already carries `bundled_in: bundle-87be4669`,
  so taking incoming's `status: ready_to_reconcile` would have left the ticket
  claiming membership in a bundle it denied being in. The four fields form one
  coherent fact-set and were taken together; mixing them (e.g. incoming's
  `last_field_updated: body` under HEAD's `updated_at`) would describe an edit
  that did not occur at that timestamp.

## Incoming changes preserved

Incoming's substantive change was a whitespace/markup reflow of the ticket body:
prose unwrapped from hard-wrapped lines, `**bold**`/`*italic*` emphasis converted
to `_underscore_` form, and the `js` language tag dropped from one fence.

`git diff 6e301eb747 HEAD -- .xgd/tickets/hot/request-909e42f8.md` returns **only**
the frontmatter hunk above — every byte of the body is identical between the
incoming commit and the resolved result. The reflow is fully present.

No hunk was dropped; the BUG-1301 precedence exception was not invoked.

## Net effect

The resolved file is byte-identical to HEAD: an earlier commit in this resync
queue had already landed the same body reflow through a different path, and the
metadata resolution kept HEAD's side. `git status --porcelain` is empty and
`git diff HEAD --stat` is empty. Per the stage-only contract, `--skip` was not
called — finalize should detect the clean staged diff and skip the commit.
No conflict-class (UU/AA/DU/UD/AU/UA) entries remain; CHERRY_PICK_HEAD is intact
at `6e301eb7477b1c0258bcc014f300f4a29851fdf8`.
