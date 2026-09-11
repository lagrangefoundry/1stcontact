---
uid: report-dd02267c
id: REPORT-3583
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-26'
created_by: xgd
created_at: '2026-09-09T23:43:33.073027+00:00'
updated_at: '2026-09-09T23:43:33.073027+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-26
---

## Files resolved

- `.xgd/tickets/hot/bug-6612c4b7.md` (BUG-37) — class **AA** (both added), rule **2e**
  (intent/bookkeeping ticket) plus the auto-enrichment rule for this file
  ("intent unknown on one side — take the more recent commit by timestamp").
  Resolved by taking **ours (HEAD)** via `git checkout --ours` + `git add --sparse`.

  Rationale — the two sides are not concurrent edits, they are two points on the
  *same* ticket's lifecycle:

  - **Incoming** `4677b81` (2026-08-24) — `xgd(ticket): create bug bug-6612c4b7`.
    The ticket at birth: `status: draft`, `completed_at: null`,
    `last_field_updated: created_at`, four `fields` keys, body is
    hypothesis-only and ends with a literal `## Not started — Diagnosis only.
    No branch cut, no code written.`
  - **Ours (HEAD)** `5a37f67` (2026-08-31) — `xgd(ticket): update bug bug-6612c4b7`,
    the tip of a four-commit chain on this branch
    (`501a0595` `seed_local_overlay` → `28b29740` → `a9021e47` → `5a37f67d`).
    Same `uid`, same `id`, byte-identical `created_at`
    (`2026-08-24T21:06:08.727702+00:00`) and `created_by` — i.e. HEAD's file
    directly descends from the incoming `create`, seeded onto this branch by a
    different route (hence AA rather than UU). It carries the completed work:
    `status: free_and_reconciled`, `completed_at` set, confirmed root cause,
    three recorded `commits`, `version: 0.2.13`, `bundled_in: bundle-78f4e2fe`,
    `chat_comment`.

  Per-fact check found no fact where the incoming side is later or richer.
  Every field the incoming `create` sets is present on HEAD at an equal or
  later value; HEAD adds four `fields` keys the incoming side never had.
  Applying the incoming side would have reverted an operator-owned `status`
  from `free_and_reconciled` back to `draft`, dropped `completed_at`, the
  `commits` list, `version` and `bundled_in`, and replaced a confirmed root
  cause with a hypothesis the ticket itself now records as falsified.

## Incoming changes preserved

No developer code was discarded. The incoming commit touches exactly one file
and it is a bookkeeping ticket, not an implementation file — there is no code
hunk to preserve.

The incoming commit's substance is present in HEAD, via a different route
rather than via this cherry-pick:

- Its **frontmatter** — `uid`, `id`, `type`, `title`, `created_by`,
  `created_at`, and all four original `fields` (`severity: high`,
  `priority: high`, `needs_review: false`, `auto_merge_back: true`) — is
  present verbatim on HEAD, advanced where the lifecycle advanced it.
- Its **body** survives on HEAD in two forms: the `## Symptom`,
  `## Reproduction` and `## Relationship to BUG-36` sections are carried
  forward near-verbatim, and its `## Leading hypothesis` /
  `## The deps.store complication` / `## Candidate fixes` analysis is retained
  deliberately and explicitly under HEAD's
  `## Superseded — the original hypothesis, recorded because it was wrong`,
  which quotes and then refutes each claim with measurements. Its
  `## Prerequisite — there is no telemetry` ask is discharged by HEAD's
  `## Observability — added here`.

  So the earlier analysis is not lost; it is present as the record of a
  falsified hypothesis, which is where the later author deliberately put it.
  Re-inserting it as live text would have resurrected a "Not started" section
  and a superseded root cause into a completed, reconciled ticket.

No hunk was dropped under the BUG-1301 precedence exception; no test file was
involved.

## Note for the finalize step

The resolution nets to **no staged diff vs HEAD** (`git diff --cached HEAD` is
empty) — the incoming `create`'s effect is already fully present in HEAD
through the `seed_local_overlay` + replay chain. This is the redundant-commit
case (BUG-1109/BUG-1122), not a discard: STEP 3's test distinguishes them, and
here the incoming commit's key content is demonstrably *present* in HEAD, not
absent. Per STEP 4 no `--skip` was issued; `CHERRY_PICK_HEAD`
(`4677b816199d596f493093d78959d5e6c778d6a3`) is left intact for
`cherry_pick_finalize_resolution` to detect the clean staged diff and skip the
commit itself.

## Post-merge review flag

The enrichment rule asked that this file be flagged for post-merge review. The
flag is raised here, though the per-fact analysis above found the two sides
unambiguously ordered (a `create` and the tip of that same ticket's own update
chain), not genuinely competing.
