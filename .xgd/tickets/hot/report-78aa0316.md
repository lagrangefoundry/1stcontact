---
uid: report-78aa0316
id: REPORT-4137
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-13T21:16:49.886647+00:00'
updated_at: '2026-09-13T21:16:49.886647+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/doc-e70ef718.md` — class **AA** (both added, no merge base),
  doc ticket → rule **2e** (intent/bookkeeping ticket, per-fact resolution).
  Path is outside the sparse-checkout cone, so staged with `git add --sparse`.

  Per-fact analysis (`git diff :2: :3:` — the ONLY differences between the two
  sides were three metadata lines; the document body is byte-identical):

  | fact | ours (HEAD) | theirs (incoming 89e17d73) | kept |
  |---|---|---|---|
  | body / §6.3 text | corrected wording | corrected wording | identical — no conflict |
  | `fields.system_kb` | absent (retired) | `true` | **ours** |
  | `last_field_updated` | `system_kb` | `body` | **ours** |
  | `updated_at` | `2026-08-31T19:42:51Z` | `2026-08-31T00:50:27Z` | **ours** |

  Rationale: the incoming commit's own narrative is *"content edit: correct 6.3"* —
  a body edit, and that body edit is already in HEAD verbatim. HEAD additionally
  carries a strictly later operation, `93713dfb2a` (2026-08-31 12:42:51 -0700),
  whose narrative is *"field: retire system_kb boolean; membership moves to
  doc_kind (DOC-39 3.3)"*. That is the later-positioned intent for the only
  contested fact (`system_kb`), so ours wins on that fact; ours wins on the
  bookkeeping lines that follow from it. No fact from the incoming side was
  discarded — the two sides were not competing over the body at all.

## Incoming changes preserved

- `.xgd/tickets/hot/doc-e70ef718.md`: **yes, fully.** The incoming commit
  89e17d73 is a duplicate of `fcf96a0a71`, which is already in this branch's
  history for this file (identical subject, body, and author timestamp
  2026-08-30 17:50:28 -0700). The §6.3 correction it introduces — "Seed
  material, not a policy… it was never a claim about what the finished corpus
  should contain" — is present verbatim in HEAD's blob at lines 236-250, and
  `git diff :2: :3:` confirms the resolved body is byte-identical to the
  incoming body. `git diff HEAD` after resolution is empty.

  This is the BUG-1109/BUG-1122 redundant-commit case, not a discard: the
  incoming commit's key change is present in HEAD via a different route, so
  STEP 3's guard is satisfied. Per STEP 4 the staged diff is left netting to
  zero and `--skip` was NOT called — the finalize step will detect the clean
  staged diff and skip the commit.

  No BUG-1301 precedence exception was needed; no hunk was dropped.
