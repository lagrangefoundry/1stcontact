---
uid: report-eff9e342
id: REPORT-4845
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-23T18:32:22.004852+00:00'
updated_at: '2026-09-23T18:32:22.004852+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-8b33a146.md` (REQ-172) — **UU**, class 2e
  (intent/bookkeeping ticket, `request-*`). Outside the sparse-checkout
  cone, so resolved with `git checkout --ours --` + `git add --sparse --`
  per DOC-986 §2/§4.1.

  Two conflict hunks, both resolved to **HEAD**:

  1. **Frontmatter.** Incoming (`e558098f12`, 2026-09-01T21:20:09Z) sets
     `status: free_coding`, `completed_at: null`, `updated_at`
     2026-09-01T21:20:09. HEAD carries `status: free_and_reconciled`,
     `completed_at: 2026-09-14T10:29:05Z`, `updated_at`
     2026-09-19T15:15:29 — later on every field the incoming side
     touches. Same fields changed differently on both sides = genuine
     conflict; later-positioned intent wins per 2e. Confirmed against
     the authoritative store: `xgd ticket get request-8b33a146` reports
     `Status: free_and_reconciled`.

  2. **Test plan section.** HEAD's prose is a strict superset of
     incoming's: it names both suites by filename
     (`test_UAT_FC_REQ-172_library_document_preview.test.ts` and
     `test_UAT_FC_REQ-172_material_content_type.workers.test.ts`),
     and adds the cold-load repaint, the reader-destroyed-with-detail
     case, and `[[REQ-161]]` as a wikilink rather than bare text.
     Incoming contributes no fact absent from HEAD. Superset kept per 2e.

No trailing-newline drift: both sides end without a final newline, so
`--ours` is byte-exact.

## Incoming changes preserved

No code/implementation files were in conflict — the sole conflicted path
is a bookkeeping ticket (2e), not a `xgd_source/**`, `tests/**`, or
`bin/**` file, so the 2c "incoming is authoritative" rule does not apply
and no UAT function was touched. The BUG-1301 precedence exception was
not invoked.

The incoming commit's content is deliberately not carried forward, and
this is the documented-correct outcome rather than a discarded developer
change: `e558098f12` is a ticket-status bookkeeping update from
2026-09-01 that moved REQ-172 `draft` → `free_coding` mid-flight. Every
fact it asserts has since been superseded on the branch by the ticket's
own later lifecycle — completion on 2026-09-14 and reconciliation
recorded 2026-09-19. Accepting it would have rewound a finished,
reconciled ticket to an earlier lifecycle state and shortened its test
plan.

Net effect: the staged tree is identical to HEAD for this path, so the
cherry-pick carries no net change. Left staged for the finalize step to
detect and skip; `--continue`/`--skip` not invoked, and
`CHERRY_PICK_HEAD` (`e558098f127aec0d84278d63cbc2b43cc8ccd526`) is
still present.
