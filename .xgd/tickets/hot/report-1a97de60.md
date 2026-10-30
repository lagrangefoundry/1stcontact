---
uid: report-1a97de60
id: REPORT-4726
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T14:10:54.115751+00:00'
updated_at: '2026-09-21T14:10:54.115751+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-119dd4af.md` — **UU**, intent/bookkeeping ticket
  (`request-*`), resolved under §2e (per-fact, later-positioned intent).
  Outside the sparse-checkout cone, so staged with `git add --sparse`
  (DOC-986 §2/§4.1).

  Both sides carry the same subject (`xgd(ticket): update request
  request-119dd4af`), so the auto-enrichment reported "intent unknown" and
  fell back to "more recent commit by timestamp". Author timestamps point at
  the incoming side (Aug 31 20:36 vs 15:18), but that fallback is the wrong
  instrument here: HEAD's content does not originate from its replayed Aug 31
  commit. `xgd ticket history` on both sides shows why.

  - HEAD lineage: `c14f78d6d2` *seed_local_overlay* (Sep 9 14:35) sets
    `status: draft → bundled` and adds `bundled_in: bundle-87be4669`,
    `chat_comment`, `commits[].working_sha`, `version: 0.2.23`. Then
    `b04d6bb88c` (Aug 31 15:18, replayed) contributes **only** a trailing
    newline.
  - Incoming lineage: `1d262a55` (Aug 31 15:18) → `f3c81c5df5` (Aug 31
    20:36), the latter setting `status: free_coded → ready_to_reconcile`.

  `1d262a55` is the pre-replay twin of HEAD's `b04d6bb88c`, and its real
  payload (the `[[REQ-158]]` → `1c kb` body edit) is *already present in
  HEAD's base* — absorbed by the Sep 9 overlay. That establishes the overlay
  as downstream of the Aug 31 working commits, so the ticket's own
  `updated_at` (Sep 9 21:32 vs Sep 1 03:36 UTC) is the correct per-fact
  recency signal, not the replayed commit dates.

  Per-fact outcome:
  - `status`, `updated_at`, `last_field_updated` — same field, changed
    differently on both sides: genuine conflict, later-positioned intent wins
    → **HEAD** (`bundled`, Sep 9). `ready_to_reconcile` and `bundled` are
    both pre-reconcile waypoints (the change log shows
    `ready_to_reconcile → free_and_reconciled` and
    `bundled → free_and_reconciled`); `bundled` is the later resting state.
  - `bundled_in: bundle-87be4669` (and `chat_comment`, `commits`, `version`)
    — present only on HEAD: non-overlapping addition, kept. Taking the
    incoming `status` while retaining `bundled_in` would have left the ticket
    internally incoherent.
  - Trailing newline — genuine per-fact disagreement, resolved to the
    **incoming** side (no trailing newline). Verified by byte inspection:
    the Sep 9 overlay blob `97468957db` ends without a newline, as does the
    incoming blob `9a35495`; only the replayed `b04d6bb88c` adds one. Both
    the source-timeline last word and the newest genuine xgd write agree on
    the no-newline form, so keeping the newline would have left the file in a
    state xgd itself does not emit.

  Corroboration: the resolved blob hashes to `97468957db` — byte-for-byte the
  Sep 9 overlay snapshot, i.e. exactly what xgd last wrote for this ticket
  locally. The staged diff vs HEAD is one line (the newline); the diff vs the
  incoming side is the three frontmatter facts above.

## Incoming changes preserved

No code/implementation files were in conflict; this is a bookkeeping ticket
resolved per §2e, and STEP 3's code-file verification does not apply.

One incoming fact was deliberately **not** carried forward, and this is not
the BUG-1301 precedence exception — it is §2e's per-fact timeline rule
operating as designed:

- `f3c81c5df5`'s payload intent, `status: free_coded → ready_to_reconcile`
  (`updated_at` Sep 1 03:36 UTC), is superseded by the Sep 9 21:32 UTC
  overlay state `status: bundled` + `bundled_in: bundle-87be4669`. The
  incoming value is an earlier waypoint on the same lifecycle road, not a
  competing destination, and it carries no companion fields that HEAD lacks.

The incoming side's other contribution — the trailing-newline form — **is**
preserved in the resolved file.

Nothing was discarded that exists only on the incoming side: `f3c81c5df5`
touches exactly two regions (the status frontmatter block and the final
newline), and both were adjudicated explicitly above.
