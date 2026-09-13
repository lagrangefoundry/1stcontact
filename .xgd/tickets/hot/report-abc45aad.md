---
uid: report-abc45aad
id: REPORT-4161
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-13T22:45:11.058087+00:00'
updated_at: '2026-09-13T22:45:11.058087+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-909e42f8.md` — UU, intent/bookkeeping ticket (rule 2e: same field changed differently on each side → take the LATER-positioned intent, per fact). Resolved with `git checkout --ours` + `git add --sparse` (the path is outside the sparse-checkout cone on this reconcile branch, DOC-986 §2/§4.1).

Incoming commit `1bc13abacf` ("xgd(ticket): update request request-909e42f8", Aug 31 14:54 PDT), +3/-3, one conflict region in the frontmatter. Three facts, resolved individually:

- **`status`** — ours `bundled` vs incoming `free_coding`. Kept ours. These are not competing edits: they are two points on the same lifecycle path, and ours is downstream. `xgd ticket history` on both sides shows it directly — the HEAD-side `seed_local_overlay` commit `3bb3a8c5` (Sep 9 14:35 PDT) applies the *same* transition from the *same* base (`status: draft → bundled`, `last_field_updated: created_at → status`), collapsing the whole working timeline in one step. The overlay's accompanying fields corroborate the ordering: `commits:` carries the free-coded work shas `858d63202f` and `c056002a52`, and `bundled_in: bundle-87be4669` — the ticket could only reach `bundled` *after* the `free_coding` work the incoming commit announces.
- **`updated_at`** — ours `2026-09-09T21:32:49` vs incoming `2026-08-31T21:54:37`. Kept ours (later timestamp), consistent with the status fact and with the enrichment's "take the more recent commit by timestamp" rule.
- **`last_field_updated`** — both sides set `status`. Identical; no conflict in substance.

## Incoming changes preserved

No code/implementation files were involved — the only conflicted path is a bookkeeping request ticket.

The incoming commit's entire diff is the three frontmatter lines above; it touches nothing outside the conflict region, so `checkout --ours` dropped no auto-merged incoming content. Verified: `git diff HEAD` for the path is empty after the checkout.

The incoming intent — "this request has left `draft` and entered the working lifecycle" — is present in HEAD via a later route rather than absent: HEAD records the terminal state of that same lifecycle (`bundled`), along with the free-coded commits it produced. This is the redundant-commit case (BUG-1109/BUG-1122), and it is distinguishable from a discard by exactly STEP 3's test — the incoming change is superseded in HEAD by a strictly later value of the same field, not missing from it.

Per STEP 4, `--skip` was not called; the file is staged and the finalize step will detect the clean staged diff. Flagging for post-merge review as the enrichment rule requests, though the history above resolves the ordering unambiguously.
