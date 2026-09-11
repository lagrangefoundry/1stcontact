---
uid: report-9b04e3c0
id: REPORT-3615
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-26'
created_by: xgd
created_at: '2026-09-10T00:58:20.108529+00:00'
updated_at: '2026-09-10T00:58:20.108529+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-26
---

## Files resolved

- `.xgd/tickets/hot/bug-23d1ec27.md` — **UU**, intent/bookkeeping ticket (rule
  2e), genuine same-fact conflict resolved per-fact toward **HEAD (ours)**.
  Staged with `git add --sparse` (path is outside the sparse-checkout cone,
  DOC-986 §2/§4.1).

  Incoming commit this pass: `93b031a3` (`xgd(ticket): update bug bug-23d1ec27`,
  authored 2026-08-25 16:21:06 -0700). Note this is a *different* commit from the
  previous pass's `e2ef5e9`; the merge base has advanced to `90cfbfc` (which was
  that pass's incoming blob), while ours is still `52bab41` — HEAD did not move,
  because the previous pick was redundant and finalize skipped it.

  Three-way analysis:
  - **Base** (`90cfbfc`): `status: draft`, `last_field_updated: created_at`,
    `updated_at: 2026-08-24T22:25:21Z`.
  - **Incoming** (`593d49b`): changes exactly three lines — `status: draft →
    free_coding`, `last_field_updated: created_at → status`, `updated_at →
    2026-08-25T23:21:06Z`. Body untouched. This is the commit that marks the
    *start* of free-coding work (FREE-CODING.md step 2).
  - **Ours** (`52bab41`): `status: bundled`, `last_field_updated: status`,
    `updated_at: 2026-08-31T05:05:09Z`, plus `fields.commits[].working_sha:
    759cd87`, `version: 0.2.15`, `story_points: 3`,
    `bundled_in: bundle-8eef3846`, and the fully rewritten body.

  Both sides changed the **same three facts**, so rule 2e's superset branch does
  not apply and the timeline rule governs — per fact, all three of which move
  together as one status transition:

  1. **Lifecycle position.** `FREE-CODING.md:475` documents the order
     `draft → free_coding → free_coded → ready_to_reconcile`, with `bundled`
     downstream of that (set when a bundle absorbs the ticket). HEAD's `bundled`
     is strictly past the incoming's `free_coding`.
  2. **Corroborating artifacts.** HEAD carries `fields.commits[].working_sha`,
     `version: 0.2.15` and `bundled_in` — fields that only exist at or after the
     `free_coded` transition (`ticket_types.yaml:73-81`; `version` is set by
     `xgd ticket move-to-free-coded`, REQ-648). Their presence is physical
     evidence that the free-coding run this incoming commit *announces* has
     since completed.
  3. **Timestamp.** HEAD's `updated_at` is 2026-08-31, six days after the
     incoming's 2026-08-25 — which is also what the auto-enrichment's fallback
     rule ("take the more recent commit by timestamp") selects.

  All three fields therefore resolve to HEAD. The body is unconflicted in effect:
  the incoming left it at the base's older text, while HEAD carries the expanded
  version, so no body content from either side is lost.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-23d1ec27.md`: the incoming commit's intent — advance the
  ticket out of `draft` into the free-coding lifecycle — is **present in HEAD via
  a later route**, not discarded. HEAD sits at `bundled`, two transitions further
  along the same documented path, with the free-coded artifacts to prove the run
  happened. Superseding a status advance with a later status advance on the same
  lifecycle is not a loss of developer intent.

  No hunk was dropped under the BUG-1301 precedence exception. No code, test, or
  UAT files were involved in this conflict, so STEP 3's `git show` check does not
  apply to any file here.

## Net staged result

The staged tree has **no diff versus HEAD**. Per STEP 4 this is the redundant
commit case (BUG-1109/BUG-1122), not the discard case — STEP 3 distinguishes
them by asking whether the incoming commit's key change is present in HEAD, and
here it is: the status advance was superseded by later advances already in HEAD,
rather than being absent. `--skip` was not called; the cherry-pick sequencer
state (`CHERRY_PICK_HEAD` = `93b031a37e3ff42a875344ec6efdf0b62c89af6a`) is left
intact for `cherry_pick_finalize_resolution` to detect the clean staged diff and
skip the commit itself.
