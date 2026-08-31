---
uid: report-4da40d41
id: REPORT-2985
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-21'
created_by: xgd
created_at: '2026-08-31T16:05:52.999739+00:00'
updated_at: '2026-08-31T16:05:52.999739+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-21
---

## Files resolved

- `.xgd/tickets/hot/bug-6612c4b7.md` — **AA** (both added), intent/bookkeeping
  ticket. Rules **2b** + **2e**. Path is outside the sparse-checkout cone
  (DOC-986 §2/§4.1): the conflict existed only in the index with no working-tree
  markers, so it was resolved with `git checkout --ours --` followed by
  `git add --sparse --`.

  **Resolved to OURS.** Both sides are the same ticket (`uid: bug-6612c4b7`,
  `id: BUG-37`, identical `created_at: 2026-08-24T21:06:08.727702+00:00`)
  created independently on the two branches, which is why it collided as AA
  rather than UU.

  - **Incoming** (`4677b81619`, 2026-08-24 14:06 PDT, `create bug bug-6612c4b7`)
    is the ticket's *initial* state: `status: draft`,
    `last_field_updated: created_at`, four `fields` keys, body is diagnosis-only
    and closes with "## Not started — Diagnosis only. No branch cut, no code
    written."
  - **Ours** (`501a0595d1`, 2026-08-31 07:24 PDT, `seed_local_overlay bug
    bug-6612c4b7`) is the ticket's *final* state: `updated_at` 2026-08-26T17:36,
    `status: bundled`, plus `chat_comment`, a three-entry `commits` list,
    `version: 0.2.13`, and `bundled_in: bundle-78f4e2fe` — this very reconcile
    bundle.

  Ours is a strict superset per 2e ("keep the superset") and is also the later
  side on every conflicting fact per 2e's per-fact timeline rule — its
  `updated_at` is two days after the incoming's, and it is the state the local
  overlay was seeded from. The auto-enrichment rule for this file said "take the
  more recent commit by timestamp"; ours is more recent on both the commit date
  (08-31 vs 08-24) and the ticket's own `updated_at`.

  Taking incoming would have regressed `status` from `bundled` back to `draft`
  and dropped `commits`, `version`, and `bundled_in: bundle-78f4e2fe` — i.e. it
  would have destroyed the bookkeeping for the bundle currently being
  reconciled.

  No hybrid was authored: 2e prohibits inventing content not present on either
  side, and re-inserting the incoming draft's "Leading hypothesis", "Candidate
  fixes", and "Prerequisite — there is no telemetry" sections would have
  resurrected a hypothesis that ours explicitly records as falsified.

## Incoming changes preserved

The incoming commit is a whole-file creation (144 insertions, 0 deletions). Its
content is present in HEAD via a different route, not discarded — the
STEP 4 / BUG-1109 "redundant commit" case, not the STEP 3 "discarded" case:

- The ticket itself exists at HEAD with the incoming's identity intact — same
  `uid`, same `id: BUG-37`, byte-identical
  `created_at: 2026-08-24T21:06:08.727702+00:00`. HEAD's copy *is* the incoming
  creation, carried forward and then refined by the investigation that followed.
- The incoming body's substance is explicitly retained in ours under
  "## Superseded — the original hypothesis, recorded because it was wrong",
  which restates each of the draft's claims (the dead `PREVIEWS` WeakMap as the
  cost centre, isolate-memory exhaustion as the mechanism, "Edit is the larger
  render") and records the measurement that falsified each one.
- The draft's "Prerequisite — there is no telemetry / add `[observability]`"
  instruction is present in ours as completed work under
  "## Observability — added here".
- The `## Reproduction` curl block and the `## Relationship to BUG-36` section
  are carried over essentially verbatim (the former retitled
  "Reproduction (historical)").

Consequently the staged tree has no diff against HEAD for this path (staged blob
`54e03170` == `HEAD:.xgd/tickets/hot/bug-6612c4b7.md`). Per STEP 4 this is not a
failure and `--skip` was not called; the finalize step will detect the clean
staged diff.

No BUG-1301 precedence exception was invoked — no hunk was dropped on the
grounds of a prior refactor, and no code or UAT files were involved in this
conflict.

`CHERRY_PICK_HEAD` (`4677b816199d596f493093d78959d5e6c778d6a3`) is intact; no
`--continue`, `--skip`, `--quit`, `--abort`, `reset`, or `checkout <branch>` was
run.
