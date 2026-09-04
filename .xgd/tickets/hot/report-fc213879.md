---
uid: report-fc213879
id: REPORT-3374
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-02T21:53:13.985007+00:00'
updated_at: '2026-09-02T21:53:13.985007+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/bug-23d1ec27.md` — UU, intent/bookkeeping ticket (rule 2e).
  Incoming commit `5a68fc8db7` ("update bug bug-23d1ec27", `last_field_updated:
  body`). Two conflicting regions; the rest of the file merged clean.

  Per-fact resolution, not whole-file:

  1. **Frontmatter block (`updated_at` / `last_field_updated` / `status`)** —
     both sides touched the same facts, so the later-positioned intent wins:
     - HEAD: `updated_at 2026-08-31T05:05:09Z`, `last_field_updated: status`,
       `status: bundled` (with `fields.bundled_in: bundle-8eef3846`, merged
       clean from the HEAD side)
     - Incoming: `updated_at 2026-08-26T23:21:08Z`, `last_field_updated: body`,
       `status: ready_to_reconcile` (unchanged from the merge base — the
       incoming commit did not advance status; it conflicted only because git
       grouped it with the adjacent lines)

     HEAD kept: `bundled` is the downstream successor of `ready_to_reconcile`,
     recorded 5 days later and backed by the matching `bundled_in` reference.

  2. **Trailing "Note:" paragraph** — this is NOT a competing edit. Diffing the
     merge base (`ad25504e54`) against each side shows the incoming side made
     the only substantive change here (re-flowed the hard-wrapped paragraph onto
     one line, consistent with its whole-body reflow); HEAD's sole delta in this
     region was adding a terminating newline at EOF. Non-overlapping, so BOTH
     applied: incoming's re-flowed text, with HEAD's EOF newline.

  Resolved by editing the two marked regions in place; staged with
  `git add --sparse` (path is outside the sparse-checkout cone). No content was
  invented and no field present on only one side was dropped.

## Incoming changes preserved

No code/implementation files were conflicted — the incoming commit touches only
the bookkeeping ticket above.

Its substantive change is a full-body re-flow (unwrapping hard-wrapped
paragraphs; ~91 insertions / 95 deletions across the Symptom, Root cause, Fix,
Watch-for, Out-of-scope, Acceptance-criteria and Reproduce sections). That
change is preserved in full: HEAD never edited the body, so all of it merged
clean apart from the trailing paragraph, which I resolved to the incoming text.

Verified by diffing the resolved file against the incoming blob
(`5a68fc8db7:.xgd/tickets/hot/bug-23d1ec27.md`). The only differences are the
four HEAD-side facts deliberately kept above — `updated_at`,
`last_field_updated`, `status`, `fields.bundled_in` — plus the EOF newline. The
entire re-flowed body is byte-identical to the incoming version.

The staged result is a real change vs HEAD (93 insertions / 97 deletions), so
this is not the redundant-commit case; nothing was skipped. `--skip` was NOT
called and the cherry-pick sequencer state
(CHERRY_PICK_HEAD = 5a68fc8db7f64271fd4bb2068eef3775e138cf0d) is left intact for
cherry_pick_finalize_resolution.

No BUG-1301 precedence exception was needed; no test files were involved.
