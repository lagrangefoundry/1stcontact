---
uid: report-4f374ecc
id: REPORT-3039
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-22'
created_by: xgd
created_at: '2026-08-31T19:50:43.064423+00:00'
updated_at: '2026-08-31T19:50:43.064423+00:00'
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
  Resolved by **keep the superset**: the OURS/HEAD side is a strict superset of
  the incoming side on every fact. Applied as `git checkout --ours` +
  `git add --sparse` (path is under `.xgd/tickets/`, sparse-checkout cone,
  DOC-986 §2/§4.1).

  Incoming commit: `7782255e4ebcea00a8d9590dfe4c846e3067c175`
  _xgd(ticket): update request request-554ac441_ (free_coded, `updated_at`
  2026-08-23T03:22:54Z, version 0.2.7).
  HEAD side: _xgd(ticket): seed_local_overlay request request-554ac441_
  (`updated_at` 2026-08-24T02:10:41Z, version 0.2.9).

  No per-fact timeline lookup was needed: the two sides do not disagree about
  any fact. Every field the incoming commit touched is present in OURS at an
  equal-or-later value, and OURS additionally carries facts the incoming side
  never had. The bodies are byte-identical over the shared prefix — the
  incoming delta (base -> theirs) touches **frontmatter only**, 10 insertions /
  3 deletions, with zero prose changes.

## Incoming changes preserved

The incoming commit's five frontmatter changes, each checked against the
resolved (OURS) file:

| Incoming change (base -> theirs) | Present in resolution? |
|---|---|
| `updated_at` -> `2026-08-23T03:22:54.455335+00:00` | yes, advanced — OURS holds `2026-08-24T02:10:41.591464+00:00`, strictly later |
| `status: free_coding` -> `free_coded` | yes, advanced — OURS holds `bundled`, free_coded's successor state (`bundled_in: bundle-b3b7c399`) |
| `working_sha_history: []` added to commit `0e390334` | yes, present verbatim in OURS |
| commits `932f362e4f60b8797557ba8f4cdd1fddeb1c9068` and `92fc26e7bcc2a941999ba0e55292cda6b092bd26` appended | yes, both present in OURS `fields.commits`, each additionally carrying `working_sha_history: []`; OURS appends two further commits (`ec144c85...`, `02bd4437...`) |
| `version: 0.2.1` -> `0.2.7` | yes, advanced — OURS holds `0.2.9`. The ticket body's own "Version bookkeeping" sections document the 0.2.7 -> 0.2.8 -> 0.2.9 progression, so 0.2.9 is a genuine continuation of the incoming 0.2.7, not a competing claim |

Nothing from the incoming side is absent. No hunk was dropped, so the BUG-1301
precedence exception was not invoked and no test function was deleted.

### Note: resolution nets to no diff vs HEAD

`git diff --cached HEAD` is empty after staging. Per STEP 4 this is **not** a
@fail and `--skip` was **not** called — the cherry-pick sequencer state is left
intact for `cherry_pick_finalize_resolution`.

STEP 3's redundant-vs-discarded test resolves to **redundant** (BUG-1109 /
BUG-1122): the incoming commit's key changes are present in HEAD, having landed
via a later route. HEAD's ticket state already advanced past every value the
incoming commit was setting — it records the incoming commit's own two SHAs in
`fields.commits`, sits two lifecycle states further on, and carries a version
two increments higher. This is the incoming intent already integrated, not
developer code overwritten.

No files were flagged for post-merge review: the enrichment's "intent unknown,
flag for review" fallback was superseded by the fact-level comparison above,
which shows the two sides are not in competition on any field.
