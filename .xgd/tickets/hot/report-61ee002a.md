---
uid: report-61ee002a
id: REPORT-3040
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-22'
created_by: xgd
created_at: '2026-08-31T19:52:55.093940+00:00'
updated_at: '2026-08-31T19:52:55.093940+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-22
---

## Files resolved

- `.xgd/tickets/hot/request-554ac441.md` (REQ-149) — class **UU**, rule **2e**
  (intent/bookkeeping ticket, `.xgd/tickets/hot/request-*.md`).
  Resolved by **keep the superset**, with rule 2e's per-fact later-intent
  tiebreak applied to the single genuinely differing field. Applied as
  `git checkout --ours` + `git add --sparse` (path is under `.xgd/tickets/`,
  sparse-checkout cone, DOC-986 §2/§4.1).

  Incoming commit: `a74ac03993024fbbffb13bf95ca29a0605894043`
  _xgd(ticket): update request request-554ac441_ (free_coded, authored
  2026-08-22 20:24:39 -0700 = 2026-08-23T03:24:38Z), 53 insertions / 3 deletions.
  HEAD side: `6546223f1d7b1f780fac3c614b1cc39c1175ae57`, from
  _xgd(ticket): seed_local_overlay request request-554ac441_
  (`updated_at` 2026-08-24T02:10:41Z, status `bundled`, version 0.2.9).

  Merge base for this attempt is `0dc6fa73`, which was the INCOMING blob of the
  previous attempt (scope `9/0`, commit `7782255e`) — that commit finalized as
  redundant, so HEAD is unchanged at `6546223f` and this is the next commit in
  the same ticket's working-timeline sequence.

## Incoming changes preserved

The incoming commit makes three changes. Each checked against the resolved
(OURS) file:

| Incoming change (base -> theirs) | Present in resolution? |
|---|---|
| Appended the ~50-line section _"Follow-up: `bin/build` failed on a type-only reach into node"_ — cause, "why no test caught it", **acceptance criterion 12**, and the 0.2.7 version-bookkeeping note | **yes, byte-identical.** The theirs -> ours diff renders this entire region as unchanged CONTEXT (hunk `@@ -439,3 +449,87 @@`), not as +/- lines, which is what proves the bytes match. Confirmed in the working tree: the AC-12 sentence _"including through a type-only import"_ is present |
| `updated_at` -> `2026-08-23T03:24:38.640592+00:00` | yes, advanced — OURS holds `2026-08-24T02:10:41.591464+00:00`, strictly later |
| `last_field_updated: status` -> `body` | **no — OURS's `status` kept, by the 2e per-fact tiebreak.** See below |

Nothing substantive from the incoming side is absent. No hunk was dropped for
obsolescence, so the BUG-1301 precedence exception was not invoked, and no test
function was deleted.

### The one differing fact: `last_field_updated`

This is the only field where the two sides state different things rather than
one side simply being further along. It is a derived annotation naming which
field the accompanying write touched:

- INCOMING sets `body`, because that commit's write was the body append above.
- OURS sets `status`, because OURS's write — which is LATER (2026-08-24 vs
  2026-08-23) — advanced the ticket to `bundled`.

Rule 2e for a same-field disagreement is "take the side from the
later-positioned intent, per fact". OURS is the later intent, so `status`
stands. Two supporting reasons this is not merely a coin-flip on timestamps:

1. The field is bound to `updated_at`. The resolution keeps OURS's later
   `updated_at`; pairing that with the incoming's `body` would describe a write
   that is no longer the most recent one, producing an internally inconsistent
   record present on NEITHER side — which 2e prohibits ("inventing content not
   present on either side").
2. OURS's later write is real and independently evidenced: status `bundled`,
   `bundled_in: bundle-b3b7c399`, two further commits (`ec144c85`, `02bd4437`),
   and version 0.2.9 — none of which the incoming side has.

### Note: resolution nets to no diff vs HEAD

`git diff --cached HEAD` is empty after staging. Per STEP 4 this is **not** a
@fail and `--skip` was **not** called; `CHERRY_PICK_HEAD` is verified still
present at `a74ac039` for `cherry_pick_finalize_resolution`.

STEP 3's redundant-vs-discarded test resolves to **redundant** (BUG-1109 /
BUG-1122): the incoming commit's substantive change — the AC-12 follow-up
section — is present in HEAD byte-for-byte, having landed via a later route.
HEAD carries that section plus a further follow-up (ACs 13-16) the incoming side
had not yet written. This is the incoming intent already integrated, not
developer prose overwritten.

This is the second consecutive commit for this ticket to finalize as redundant
(after `7782255e` at scope `9/0`), consistent with HEAD's overlay already
holding the ticket at a later state than the working-timeline commits being
replayed.

No file was flagged for post-merge review: the enrichment's "intent unknown,
take the more recent commit and flag" fallback is satisfied without a flag — the
more recent commit IS HEAD, and the fact-level comparison above shows the sides
compete on exactly one derived bookkeeping field, resolved by 2e's stated rule.
