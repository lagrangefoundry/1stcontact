---
uid: report-6f21549d
id: REPORT-5134
type: report
title: 'Resync resolve conflicts: d7587990b588ef6c03b752fe16afa93745aa9da3'
created_by: xgd
created_at: '2026-09-26T21:27:42.371174+00:00'
updated_at: '2026-09-26T21:27:42.371174+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-554ac441.md` — **UU**, intent/bookkeeping ticket
  (`request-*`, STEP 2e). Incoming commit `a74ac039` ("xgd(ticket): update
  request request-554ac441", `last_field_updated: body`) appends one body
  section; HEAD's version is a **strict superset** of it, so the superset was
  kept (`git checkout --ours`, then `git add --sparse`).

  Stages: base `0dc6fa73` (the blob the previous queue entry `7782255e` left),
  ours `85e97c81`, theirs `de1dfccc`.

  Fact-by-fact:

  | fact | incoming (`de1dfccc`) | HEAD (`85e97c81`) | verdict |
  |---|---|---|---|
  | `status` | `free_coded` | `free_and_reconciled` | HEAD downstream in lifecycle |
  | `updated_at` | `2026-08-23T03:24:38` | `2026-08-31T14:22:34` | HEAD later |
  | `completed_at` | `null` | `2026-08-31T14:22:34` | HEAD later |
  | `last_field_updated` | `body` | `status` | HEAD's `status` edit is the later one (Aug 31 vs Aug 23), so `status` is the later truth for this derived marker |
  | `fields.commits` | 4 entries (`54b3e76a`, `0e390334`, `932f362e`, `92fc26e7`) | same 4 + `ec144c85` + `02bd4437` | HEAD superset |
  | `fields.version` | `0.2.7` | `0.2.9` | HEAD later |
  | `fields.bundled_in` | absent | `bundle-b3b7c399` | HEAD only |
  | `fields.chat_comment` | absent | `comment-98e86f10` | HEAD only |
  | body | base + "Follow-up: `bin/build` failed on a type-only reach into node" (incl. AC 12) | that same section **verbatim** + a second "Follow-up: the deploy secret guard asked the wrong question" section (ACs 13–16) | HEAD superset |

  No fact is present on the incoming side and absent from HEAD, so this is the
  strict-superset branch of 2e, not a genuine per-fact intent conflict. Taking
  incoming wholesale would have regressed `free_and_reconciled` → `free_coded`,
  dropped `completed_at`, `bundled_in`, `chat_comment`, two commit entries, the
  `0.2.9` bump, and the entire second follow-up section with ACs 13–16.

## Incoming changes preserved

No code files were in conflict — the single conflicted path is a bookkeeping
ticket, and no hunk was dropped under the BUG-1301 precedence exception.

Everything incoming commit `a74ac039` contributes is already in the resolved
file:

- The body section it adds ("Follow-up: `bin/build` failed on a type-only reach
  into node", Cause / Why no test caught it / Acceptance criterion 12 / Version
  bookkeeping) appears byte-identical in HEAD — it shows up as unchanged context
  in `diff theirs ours`, with HEAD's additions beginning only after it.
- The frontmatter facts it sets (`status: free_coded`, `version: 0.2.7`, commit
  entries `932f362e` and `92fc26e7`) are all present or superseded by later
  values in HEAD. Both of those working shas also appear in the resync anchor's
  orphan map (`932f362e` → `3a7e8985`, `92fc26e7` → `ffc78a37`), confirming the
  underlying work reached this branch under remapped shas.

The resolved working-tree file is byte-identical to the HEAD side, so the staged
diff against HEAD is empty. Per the workflow's STEP 4 note this was left staged
without invoking `--skip`; `CHERRY_PICK_HEAD` (`a74ac039`) is still present for
the finalize step.
