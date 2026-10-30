---
uid: report-9476e34e
id: REPORT-5516
type: report
title: 'Resync resolve conflicts: ed7b3cc779 (REQ-159 bookkeeping)'
created_by: xgd
created_at: '2026-09-29T08:28:12.671287+00:00'
updated_at: '2026-09-29T08:28:12.671287+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-119dd4af.md` (REQ-159) — **UU**, intent/bookkeeping
  ticket → rule **§2e** (later-positioned intent wins, per fact). Two conflicting
  facts, both resolved to the **HEAD** side:

  | fact | HEAD | incoming (ed7b3cc779) | kept |
  |---|---|---|---|
  | `updated_at` | `2026-09-09T21:32:49` | `2026-09-02T17:48:26` | HEAD |
  | `fields.bundled_in` | `bundle-87be4669` | `bundle-203b1dc2` | HEAD |

  Timeline (`xgd working-timeline bundle-87be4669 ed7b3cc779`):
  incoming commit `ed7b3cc779` = `2026-09-02T17:48:27`; HEAD-side
  `bundle-87be4669` = `2026-09-11T10:28:15` (and the HEAD-side ticket edit
  `c14f78d6d2` = `2026-09-09T21:35`). HEAD is later-positioned on both facts.

  Substantively this is a supersession, not a competing intent. Both bundles
  carry the same title and member set (`REQ-164 + REQ-159 + REQ-165 + REQ-163 +
  REQ-161 + 2 more`). `bundle-203b1dc2` (BUNDLE-23, created 2026-09-02) is
  `ready_to_reconcile` and was later archived (`64a726eda0`);
  `bundle-87be4669` (BUNDLE-26, created 2026-09-09) is `free_and_reconciled`,
  `completed_at 2026-09-11T10:28:16`, `main_sha 66e172dd4c`. REQ-159 reached
  main through the latter, so adopting the incoming pointer would re-label a
  reconciled request as a member of a superseded, unreconciled bundle.

## Incoming changes preserved

No code or test files were in this conflict — the incoming commit is a
ticket-metadata update only (3 changed lines, `git show ed7b3cc779`).

Incoming's substantive intent **is** preserved: its third change,
`status: ready_to_reconcile` → `status: bundled`, merged cleanly because HEAD
already carries `status: bundled`. So the assertion the commit was making
("REQ-159 is now bundled") stands in the resolved file. Only the *identity* of
the bundle was not adopted, and only because a later intent replaced it.

No developer-authored code was discarded; nothing under the BUG-1301 precedence
exception was dropped.

## Staging state

Resolution is **net-zero** against HEAD — `git diff --cached HEAD` is empty,
since HEAD already held the later value of every conflicting fact. Staged and
left for `resync_cherry_pick_finalize_resolution` per STEP 4; no `--continue`,
`--skip`, `--quit` or `--abort` was called and `CHERRY_PICK_HEAD`
(`ed7b3cc779`) is still present.

Consistent with the rest of this run: `f3c81c5df5`, the immediately preceding
commit in this same REQ-159 bookkeeping chain, is already in the anchor's
`skipped_commits`.
