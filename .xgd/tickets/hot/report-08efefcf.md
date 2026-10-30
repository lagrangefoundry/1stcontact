---
uid: report-08efefcf
id: REPORT-5160
type: report
title: 'Resync resolve conflicts: d7587990b588ef6c03b752fe16afa93745aa9da3'
created_by: xgd
created_at: '2026-09-26T22:22:35.911405+00:00'
updated_at: '2026-09-26T22:22:35.911405+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-23fd6e61.md` — **AA** (both added), intent/bookkeeping ticket
  (STEP 2e). Body text is byte-identical on both sides; the only divergence is lifecycle
  frontmatter, in two hunks:
  - `updated_at` / `completed_at` / `status`: HEAD `2026-08-31T14:22:44Z`,
    `status: free_and_reconciled`; incoming (`7fb577286f`) `2026-08-20T12:51:32Z`,
    `completed_at: null`, `status: reconciling`.
  - `fields.bundled_in`: HEAD has `bundle-b3b7c399`; incoming has the key absent.

  Rule applied: per-fact later-positioned intent. Both hunks touch the *same* facts, so
  this is a genuine conflict resolved per fact rather than a combine — and on both facts
  HEAD is the later intent (11 days newer) and is strictly downstream in the ticket
  lifecycle (`reconciling` → `free_and_reconciled`, plus the `bundled_in` back-reference
  that bundling writes). Taking the incoming side would have regressed the ticket's status
  and dropped `bundled_in`. Resolved with `git checkout --ours`, staged with
  `git add --sparse`.

## Incoming changes preserved

No code/implementation files were in conflict, so STEP 3's `git show $CPHEAD -- <file>`
verification has no code target.

For the one conflicted file, the incoming side contributed no content and no new facts —
only an older snapshot of three lifecycle fields that HEAD has since advanced past, and the
absence of a field HEAD has since gained. Nothing from the incoming commit is discarded
that represents forward intent; the BUG-1301 precedence exception is not invoked and no
test function was removed.

Post-resolution state: `git status --porcelain` is empty and `git diff --cached HEAD` is
empty — the resolution is a net no-op against HEAD, because HEAD already carries the
strictly later state of every fact this commit touches. `CHERRY_PICK_HEAD`
(`7fb577286f7919b819583a27f010f5e11167060d`) is left in place for the finalize step, which
will detect the empty staged diff and skip the commit. No `--continue`/`--skip`/`--quit`/
`--abort` was issued.
