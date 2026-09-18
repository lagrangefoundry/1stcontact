---
uid: report-fba5d224
id: REPORT-4349
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-18T08:09:32.425757+00:00'
updated_at: '2026-09-18T08:09:32.425757+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-b88b79fe.md` (REQ-154) — **UU**, intent/bookkeeping ticket (`request-*`), rule **2e** + the enrichment's "intent unknown → take the more recent commit by timestamp" directive.

  Only one conflict region existed, in the frontmatter (line 9); the body merged clean because the incoming commit never touched it (incoming diff vs base is frontmatter-only: 3 insertions, 3 deletions).

  Per-fact resolution — the two sides changed the **same three fields** (`updated_at`, `last_field_updated`, `status`):

  | fact | base | ours (HEAD) | theirs (incoming `baf484270955`) | kept |
  |---|---|---|---|---|
  | `status` | `draft` | `bundled` | `free_coding` | ours |
  | `updated_at` | `2026-08-20T23:16:27Z` | `2026-08-31T05:05:09Z` | `2026-08-26T23:27:04Z` | ours |
  | `last_field_updated` | `body` | `status` | `status` | identical either way |

  Ours is the later-positioned side on every measure available: HEAD-side commit `d86cbfd7ca67` is dated 2026-09-14, the incoming commit is dated 2026-08-26; ours' `updated_at` is 5 days later than theirs. Ours is also strictly ahead on the *same* lifecycle track — `draft → free_coding → bundled` — so keeping `bundled` subsumes the incoming fact rather than competing with it.

  Corroborating: the HEAD side additionally carries `fields.commits` (working_sha `29c0e86dd321`), `fields.version: 0.2.16` and `fields.bundled_in: bundle-8eef3846`, plus the full "What was built" body section. None of those are touched by the incoming commit, so they are HEAD-only, non-overlapping content and were kept unchanged. Reverting `status` to `free_coding` would have contradicted the `bundled_in` field sitting beside it.

  Resolved with `git checkout --ours` (the whole-file HEAD content is exactly the correct per-fact composition here, since every HEAD-only field/section is retained and the only overlapping facts resolve to ours) and staged with `git add --sparse` (`.xgd/tickets/` is outside the sparse-checkout cone on reconcile branches, DOC-986 §2/§4.1).

## Incoming changes preserved

No code or implementation files were in this conflict — the incoming commit `baf484270955` ("xgd(ticket): update request request-b88b79fe") changes exactly one file, and that file is a bookkeeping ticket. No developer-authored code exists in this commit to discard.

STEP 3 status for the one file: the incoming commit's key change is the advancement of `status` off `draft`. That change **is present in HEAD**, via a later route — HEAD advanced the same field past the incoming's value to `bundled`, and recorded the bundling bookkeeping (`commits`, `version`, `bundled_in`) that only exists downstream of the `free_coding` state the incoming was setting. This is the redundant case, not the discarded case: the incoming's intent is realised in HEAD, so no revision is required and no @fail condition is met.

No hunks were dropped under the BUG-1301 precedence exception; no UAT or test files were involved.

Consequently the staged tree nets to **no diff vs HEAD** (`git diff --cached --stat HEAD` is empty). Per STEP 4 this is not a failure — `--skip` was deliberately not called; the cherry-pick sequencer state (`CHERRY_PICK_HEAD` = `baf484270955fda15caa97f8a6ee76d9871b6913`) is intact and left for `cherry_pick_finalize_resolution` to handle.

`git status --porcelain` is empty: no UU/AA/DU/UD lines remain, and no conflict markers remain in the working-tree file.
