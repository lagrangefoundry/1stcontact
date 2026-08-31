---
uid: report-f41b285f
id: REPORT-2691
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T05:20:04.912158+00:00'
updated_at: '2026-08-31T05:20:04.912158+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-94e93caa.md` — **AA** (both added), intent/bookkeeping ticket
  (`request-*`, not a matrix-defining spec ticket, so rule **2e** governs, applied through
  2b's superset test). Path is outside the sparse-checkout cone (DOC-986 §2/§4.1), so the
  conflict existed only in the index with no working-tree markers; resolved with
  `git checkout --ours` + `git add --sparse`.

  **Resolution: kept OURS (HEAD), which is a strict superset of incoming.**

  The two sides' bodies are byte-identical — the full `diff -u` between index stage 2 and
  stage 3 is confined to frontmatter:

  ```
  -updated_at: '2026-08-24T02:10:41.955524+00:00'   (ours)
  +updated_at: '2026-08-23T03:29:52.048318+00:00'   (theirs)
  -status: bundled                                  (ours)
  +status: ready_to_reconcile                       (theirs)
     version: 0.2.5
  -  chat_comment: comment-18e5a285                 (ours only)
  -  bundled_in: bundle-b3b7c399                    (ours only)
  ```

  Every field on the incoming side is present on ours with the same value, including the
  identical `fields.commits` list (working_sha `31a4ca7d…`, `b404103f…`). Ours additionally
  advances `status` `ready_to_reconcile` → `bundled` and adds `chat_comment` /
  `bundled_in: bundle-b3b7c399` — i.e. the bundling bookkeeping that happened on
  2026-08-24, one day *after* the incoming commit's 2026-08-23 `updated_at`. There is no
  fact changed differently on the two sides, so no per-fact timeline arbitration was
  needed; taking ours also agrees with the enrichment rule's "take the more recent commit
  by timestamp."

  Staged blob verified as `b878b37b83d1bee451a58a1765f56f45a91c0782` (= index stage 2).

## Incoming changes preserved

Incoming commit `83973a5e64b1303e891416b0a952ac6217ee8c32`
("xgd(ticket): update request request-94e93caa") is a single-file, 127-insertion add of
`.xgd/tickets/hot/request-94e93caa.md`. Its entire content — REQ-153 "Reserve locale-shaped
page slugs", every frontmatter field and the whole narrative body (Why / What changed /
Design decisions / Acceptance criteria / Test plan / Why free-coded / Origin) — is present
verbatim in the resolved file. Nothing from the developer's side was dropped.

No hunks were dropped, so the BUG-1301 precedence exception was not invoked. No code files,
UAT test files, or spec tickets were involved in this conflict.

**Note for the finalize step:** the staged tree nets to **no diff vs HEAD**
(`git diff --cached --stat HEAD` is empty). This is the BUG-1109/BUG-1122 redundant-commit
case, not a discard: the incoming commit's content is already present in HEAD (it arrived
via the same ticket file, which HEAD then advanced further), which is exactly the
distinction STEP 3 draws. Per STEP 4, no `--skip` was called; `CHERRY_PICK_HEAD`
(`83973a5e…`) is left intact for `cherry_pick_finalize_resolution` to detect the clean
staged diff and skip the commit itself.

The 12 untracked `comment-*` / `report-*` files under `.xgd/tickets/hot/` predate this
step, are not part of the conflict, and were left untouched.
