---
uid: report-f35e44c2
id: REPORT-5722
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-30T10:12:00.720861+00:00'
updated_at: '2026-09-30T10:12:00.720861+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

# Resync resolve conflicts — `1bf80ad12b`

Picked commit: `1bf80ad12b` — `xgd(ticket): update request request-01ea4eec`
(author 2026-09-16T01:48:29). HEAD `b1c20a37e5`. Apply target
`9ac98712a708888db67f8aff21f22b16bd98094e`. Anchor `report-377b581e`.
`prior_stage_failure` empty.

This is the FOURTH pick on `request-01ea4eec` (REQ-155) on this branch, and it is
quartet position 4 minus one: the "backward move to `bundled`" commit forecast in
REPORT-5695. The forecast held exactly.

## Files resolved

One path, `.xgd/tickets/hot/request-01ea4eec.md`, class `UU`. Resolved `--ours`
(`git checkout --ours` + `git add --sparse`). **Zero net change**:
`git status --porcelain` is completely empty and `git diff --cached --stat HEAD`
is empty, so finalize will skip the commit.

Index stages:

| stage | blob | state |
|---|---|---|
| `:1:` base   | `6294b57a6d` | `updated_at` 09-14T10:29:15.326735, `completed_at` 09-14T10:29:15.326735, `status: free_and_reconciled` |
| `:2:` ours   | `e2c2f78b19` | `updated_at` 09-19T15:15:32.210120, same `completed_at`, `status: free_and_reconciled` |
| `:3:` theirs | `2e26c89eae` | `updated_at` 09-16T01:48:29.724811, same `completed_at`, `status: bundled` |

Two free series checks both pass:

- **Base == the previous pick's theirs blob.** `6294b57a6d` is exactly the result
  of `f76ab65b3a` (REPORT-5695) — the queue is walking this path in commit order.
- **Ours has not moved.** `git diff HEAD:<path> e2c2f78b19` is empty, so the prior
  zero-net-change resolutions really netted to nothing and this pick's forecast
  holds by construction.

## Incoming changes preserved

Theirs' entire delta from base is two frontmatter fields — the body is
byte-identical on all three sides:

- `status: free_and_reconciled` → `bundled` — a **backward** lifecycle move.
  xgd-working itself re-advances the ticket to `free_and_reconciled` at its tip
  `9769d7a284` (09-19), which is the value ours already carries. Nothing is
  discarded; theirs' write is superseded by the incoming side's own later write.
- `updated_at` → 09-16T01:48:29.724811 — ours leads at 09-19T15:15:32.210120,
  three days later.

`completed_at` (`2026-09-14T10:29:15.326735`) is byte-identical on all three
sides, as is `last_field_updated: status`, `bundled_in`, and the whole 178-line
body. So there is no fact on which incoming holds content ours lacks, and the
"keeps ONLY main's version = data loss" concern is not engaged: ours *is* the
incoming side's own later state on both diverging fields.

Note the backward-lifecycle trap this path has shown throughout:
`free_and_reconciled` (09-14) → `bundled` (09-16) → `free_and_reconciled` (09-19).
A lifecycle `status` is NOT monotone on xgd-working, so an intermediate pick
reading `bundled` is not evidence that it is later.

## Arbitration of last resort (BUG-1460)

Not applicable — STEP 3h never fired. Every diverging fact was settled by the
per-fact timeline under §2e, with no unresolvable tie.

## Forecast for the remaining pick on this path

**One pick remains, and it is THE exception — it is NOT `--ours`.**

- `9769d7a284` (09-19T15:15:50.657957, xgd-working tip). Re-verified live this
  run: `git diff <ours blob> 9769d7a284:<path>` is exactly one content line,
  `updated_at` 09-19T15:15:50.657957 vs ours' 15:15:32.210120 — an **18.4 s**
  lead for incoming — plus theirs lacking ours' trailing newline. Every other
  field, including `status: free_and_reconciled` and `completed_at`, is
  byte-identical. Incoming wins that one fact; take theirs' `updated_at` (or
  theirs wholesale, keeping ours' trailing newline).

With that pick, `request-01ea4eec` is done. Do not infer the tip's outcome from
ours holding the terminal lifecycle state — that inference has failed twice on
this branch (REPORT-5605/5620, REPORT-5604/5621); always run the ours-vs-tip
diff, as was done here.

## Cost

10 Bash calls, zero denials. `CHERRY_PICK_HEAD` intact throughout.
