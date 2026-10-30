---
uid: report-5a1996c1
id: REPORT-5405
type: report
title: 'Resync resolve conflicts: 6ba006de764d843fa7f4357df2b341e72f20e2f6'
created_by: xgd
created_at: '2026-09-28T23:10:18.424097+00:00'
updated_at: '2026-09-28T23:10:18.424097+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-3bc4b835.md` — class **AA** (both added), intent/bookkeeping
  ticket (`request-*`), rule **2e**. Outside the sparse cone
  (`!/.xgd/tickets/**`), so resolved with `git checkout --ours --` +
  `git add --sparse --` per DOC-986 §2/§4.1.

  Incoming commit `76b69e1a` is `xgd(ticket): create request request-3bc4b835` —
  the original ticket-creation op (163 insertions, single file, `status: draft`,
  `last_field_updated: created_at`, `updated_at == created_at ==
  2026-09-01T00:50:39Z`). The HEAD side is the same ticket after its full
  lifecycle replay: `status: bundled`, `updated_at 2026-09-09T21:32:50Z`, plus
  `chat_comment`, `commits[]` (2 working shas), `version: 0.2.29`,
  `bundled_in: bundle-87be4669`, and an additional trailing prose section
  ("Note: the account/business split came after this ticket").

  `git diff :2: :3:` is deletions-only in the ours→theirs direction: every
  frontmatter difference is the incoming side sitting at an *earlier* value of
  the same field, and every body difference is content present only on the ours
  side. There is no fact on the incoming side that is absent from HEAD, so this
  is not a competing-intent conflict — HEAD is a strict superset and rule 2e's
  "keep the superset" applies. The timeline tiebreak agrees (ours
  `updated_at` 2026-09-09 > theirs 2026-09-01), as does the auto-enriched
  intent metadata's fallback ("take the more recent commit by timestamp").

## Incoming changes preserved

- `.xgd/tickets/hot/request-3bc4b835.md` — all 163 incoming lines are present in
  the resolved version. The incoming commit is the ticket's creation state; HEAD
  already contains that state plus every subsequent ledger op. Verified by
  `git diff :2: :3:` showing no incoming-only additions (all hunks are `-` lines
  or field reversions to older values). No hunk was dropped; the BUG-1301
  precedence exception was not needed.

No code, test, or config files were in conflict. `CHERRY_PICK_HEAD`
(`76b69e1a7d5caf55c09e6189f4dc1b5e6f8ef74d`) left intact for the next step.

Note for finalize: the resolution is byte-identical to HEAD (staged blob
`ec7bfaafc82c226b9d77f41ed1aa1b9e1ba0cd9d`), so `git status --porcelain` is
empty and the staged diff is clean. Per STEP 4 this was left for Python's
finalize step to skip rather than calling `--skip` here.
