---
uid: report-a63ecc72
id: REPORT-5310
type: report
title: 'Resolver: bundle-78f4e2fe frontmatter lifecycle conflict'
created_by: xgd
created_at: '2026-09-28T07:01:59.069015+00:00'
updated_at: '2026-09-28T07:01:59.069015+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: review
  subject_uid: bundle-78f4e2fe
---

# Conflict resolution: bundle-78f4e2fe.md (BUNDLE-21)

## Conflict

Single `UU` path during cherry-pick of `bcb265bba4` ("xgd(ticket): update bundle
bundle-78f4e2fe", authored Mon Aug 31 07:23:56 2026 -0700) onto
`c88aed46b0` on branch `resync-377b581e`.

One hunk, in the frontmatter lifecycle scalars (lines 8-18):

| field | ours (HEAD) | incoming (bcb265bba4) |
|---|---|---|
| `updated_at` | `2026-08-31T19:19:50` | `2026-08-31T14:23:56` |
| `completed_at` | `2026-08-31T19:19:32` | `null` |
| `last_field_updated` | `result` | `status` |
| `status` | `free_and_reconciled` | `reconciling` |

## Resolution

**Ours, wholesale.** Staged blob is exactly stage 2 (`d51c00436b`).

## Rationale

The picked commit's entire intent was to advance the bundle
`ready_to_reconcile` → `reconciling` at 14:23. HEAD already sits at
`free_and_reconciled` at 19:19 the same day — strictly downstream on the
bundle lifecycle. The incoming intent is not lost, it is *superseded*: the
bundle went all the way through reconciliation after that commit was written.

The ours-vs-incoming blob diff confirms the direction beyond the timestamps —
ours is the completed end state and incoming is mid-flight:

- ours carries the 21-entry `orphan_commits` remap table; incoming has none
- ours carries `merged_at_commit: 96a76934e0` and `result: pass`; incoming has neither
- ours has the commit remapped to main (`working_sha: null`,
  `main_sha: 96a76934e0`); incoming still holds five un-remapped
  `working_sha` entries with `main_sha: null`

Taking incoming would have regressed `free_and_reconciled` → `reconciling`,
nulled `completed_at`, dropped `result: pass` and `merged_at_commit`, and
resurrected five stale un-remapped working shas. Lifecycle scalars must never
regress.

Bodies are byte-identical between the two sides — the blob diff shows no hunk
below `# Bundle`, including the trailing-newline state. Nothing outside the
frontmatter was in question, so no incoming content is dropped by taking ours.

## Consequence

Because ours already subsumed the picked commit's intent, the tree now equals
HEAD's tree for this path and the cherry-pick is **empty**. No unmerged stages
remain.

## Notes

- `git checkout --ours` reported the path as outside the sparse-checkout
  definition, but did write the file; staging required `git add --sparse`.
- The sequencer was deliberately **not** advanced — no `--continue`, no
  `--skip`. Resolution is staged and left for the caller.
