---
uid: report-30e0d138
id: REPORT-5133
type: report
title: 'Resync resolve conflicts: d7587990b588ef6c03b752fe16afa93745aa9da3'
created_by: xgd
created_at: '2026-09-26T21:26:03.286128+00:00'
updated_at: '2026-09-26T21:26:03.286128+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-554ac441.md` — **UU**, intent/bookkeeping ticket
  (`request-*`, STEP 2e). Incoming commit `7782255e` is a pure ticket
  bookkeeping update; HEAD's version of the file is a **strict superset** of it
  on every fact, so the superset was kept (`git checkout --ours`, then
  `git add --sparse`).

  Fact-by-fact comparison against merge base `735995e4`:

  | fact | incoming (`0dc6fa73`) | HEAD (`85e97c81`) | verdict |
  |---|---|---|---|
  | `status` | `free_coded` | `free_and_reconciled` | HEAD is downstream in the lifecycle |
  | `updated_at` | `2026-08-23T03:22:54` | `2026-08-31T14:22:34` | HEAD later |
  | `completed_at` | `null` | `2026-08-31T14:22:34` | HEAD later |
  | `fields.commits` | 4 entries (`54b3e76a`, `0e390334`, `932f362e`, `92fc26e7`) | same 4 + `ec144c85` + `02bd4437` | HEAD superset |
  | `fields.version` | `0.2.7` | `0.2.9` | HEAD later |
  | `fields.bundled_in` | absent | `bundle-b3b7c399` | HEAD only |
  | `fields.chat_comment` | absent | `comment-98e86f10` | HEAD only |
  | body | identical to merge base | base body + "Follow-up: `bin/build` failed on a type-only reach into node" section incl. AC 12 | HEAD superset |

  No fact is present on the incoming side and absent from HEAD, so this is the
  strict-superset branch of 2e rather than a genuine per-fact intent conflict.
  Taking the incoming side wholesale would have regressed
  `free_and_reconciled` → `free_coded`, dropped `completed_at`, `bundled_in`,
  `chat_comment`, two commit entries, the version bump to `0.2.9`, and the
  entire follow-up section with acceptance criterion 12.

## Incoming changes preserved

No code files were in conflict — the single conflicted path is a bookkeeping
ticket, and no hunk was dropped under the BUG-1301 precedence exception.

Every change the incoming commit `7782255e` makes is already recorded in the
resolved file:

- `status` advanced past `free_coded` to `free_and_reconciled`.
- Both commit entries the incoming side adds — `932f362e4f60b8797557ba8f4cdd1fddeb1c9068`
  and `92fc26e7bcc2a941999ba0e55292cda6b092bd26` — are present in
  `fields.commits` (each with the richer `working_sha_history: []` form).
  Both also appear in the resync anchor's orphan map
  (`932f362e` → `3a7e8985`, `92fc26e7` → `ffc78a37`), confirming their work
  reached this branch under remapped shas.
- `version` is `0.2.9`, i.e. past the incoming `0.2.7`.

The resolved working-tree file is byte-identical to the HEAD side, so the
staged diff against HEAD is empty. Per the workflow's STEP 4 note this was
left staged without invoking `--skip`; `CHERRY_PICK_HEAD` (`7782255e`) is
still present for the finalize step.
