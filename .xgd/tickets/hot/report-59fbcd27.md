---
uid: report-59fbcd27
id: REPORT-4096
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-11T23:34:45.607066+00:00'
updated_at: '2026-09-11T23:34:45.607066+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-6612c4b7.md` (BUG-37) — **AA (both added)**, intent/bookkeeping
  ticket → rules **2b** ("one side is strictly a superset: keep the superset") and **2e**.
  Resolved to **OURS** wholesale via `git checkout --ours` + `git add --sparse` (no
  hand-edit of the ticket file, so no stale frontmatter could be reintroduced).

  Both sides are the *same document at two points in its own lifecycle*, not two
  independent authorings — this is AA only because the reconcile branch received the
  ticket by a route other than the creation commit:

  - **Incoming** `4677b81` *"xgd(ticket): create bug bug-6612c4b7"*, 2026-08-24T14:06:08-07:00
    — the ticket's original **draft** snapshot: `status: draft`, `completed_at: null`,
    `last_field_updated: created_at`, body is the leading hypothesis. Pure creation
    (144 insertions, 0 deletions); commit message carries no free-text narrative.
  - **Ours** `5a37f67` *"xgd(ticket): update bug bug-6612c4b7"*, authored
    2026-08-31T12:19:36-07:00 — the same ticket completed: `status: free_and_reconciled`,
    `completed_at` set, three recorded `commits`, `version: 0.2.13`,
    `bundled_in: bundle-78f4e2fe`, body is the confirmed root cause.

  Ours is later on both the enrichment's stated timestamp rule and per-fact superset
  test, so no composition was required or possible.

## Incoming changes preserved

Not a code file — no implementation hunks to carry. Per-fact audit of all five conflict
hunks confirms nothing on the incoming side is lost as disjoint intent:

1. **Frontmatter lifecycle** — incoming's `draft` / `completed_at: null` /
   `last_field_updated: created_at` are strictly *superseded* by ours; keeping them would
   reopen a reconciled ticket.
2. **`fields:`** — incoming contributes nothing ours lacks. Its four keys
   (`severity: high`, `priority: high`, `needs_review: false`, `auto_merge_back: true`)
   are present on ours with **identical values**; ours additionally carries
   `chat_comment`, `commits`, `version`, `bundled_in`. Strict superset.
3. **Body (lines 50–289)** — incoming's leading hypothesis (dead `PREVIEWS` WeakMap →
   isolate-memory exhaustion) is not discarded: ours retains it verbatim in substance
   under *"## Superseded — the original hypothesis, recorded because it was wrong"*,
   together with the measurements that falsified it. The title edit
   ("Edit mode 503s" → "Edit mode dies") is ours' own later correction to the same fact.
4. **"Compare against `/preview/xgd/draft/`, which is reported working."** — dropped on
   ours as part of its own re-edit of that same paragraph, which ours retitled
   *"## Reproduction (historical)"*. Same-fact edit by the later side, not a disjoint
   addition.
5. **"## Not started — Diagnosis only. No branch cut, no code written."** — incoming-only,
   and now factually false: the work landed (three `working_sha` entries, `version 0.2.13`,
   `status: free_and_reconciled`). Carrying it forward would corrupt the ticket. Remainder
   of the hunk is a whitespace rewrap of text identical on both sides.

**Net staged diff vs HEAD is empty.** Per STEP 4 this is not a failure and `--skip` was
not called: this is the redundant case, not the discarded case, and STEP 3's test
distinguishes them — the incoming commit's content is *present in HEAD* via a later route
(`5a37f67`, the update commit that evolved this very ticket from the incoming snapshot and
preserves its diagnosis under "Superseded"), rather than absent. The finalize step will
detect the clean staged diff and skip the commit.

No hunk was dropped under the BUG-1301 precedence exception. No UAT files were involved.
CHERRY_PICK_HEAD left intact (`4677b816199d596f493093d78959d5e6c778d6a3`).
