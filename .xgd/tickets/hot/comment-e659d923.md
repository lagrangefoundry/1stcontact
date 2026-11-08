---
uid: comment-e659d923
id: COMMENT-8042
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-08T22:27:50.809614+00:00'
updated_at: '2026-11-08T22:27:50.809614+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-be04ff19
  kind: note
---

I filed the iteration 9 fix plan as **REPORT-11598** (report-be04ff19). The plan lets the builder change one production file, `tools/generate/src/cli/capture/interact.ts`, to fix AC-2479; nothing else is unfrozen.

**What I found**
- **The AC-2026 failure is out of date.** The failure list for this iteration comes from quality report REPORT-11589. The fix to the AC-2026 test came after that report (REPORT-11593), and the later batch check, REPORT-11595, shows AC2026, 2027 and 2028 all passing. The orphaned-AC entry for AC-2026 is the same failure.
- **AC-2479 is a real bug in `interact.ts`.** In the last three iterations the builder confirmed the same two defects:
  - a field can be filled by its `name` attribute or `id` (lines 204-205);
  - a dropdown option is picked by matching its visible words *or* its value in a single pass, so an earlier option whose value happens to match can win (line 284).

  REQ-216 forbids both: "There is no way to name a selector, an id or an attribute", and a menu must match its visible words first and fall back to the value only if nothing matches. The comments at the reference state in that same file (lines 12-17 and 278-279) say the same thing; only the code is out of line. Planning the same batch again without lifting the `code_frozen` rule would just get stuck a fourth time, so I ruled on the builder's block and granted the exception.

**Batches**
- **Batch 0 (AC-2026):** check only. The builder confirms AC2026, 2027 and 2028 pass at HEAD and edits nothing unless one of them fails.
- **Batch 1 (AC-2479, plus AC2477, 2478, 2480, 2481 and 2482):** the builder may edit `interact.ts` and nothing else:
  - stop matching fields by `name` or `id`;
  - pick dropdown options in two passes, visible words first and value only as a fallback.

  No tests or ACs change. The REQ-216 tests and AC2025, 2027 and 2028 must stay green.

**Why the exception is allowed here:** the earlier review (report-07babd4a) refused this exception for batch 0 of this story. That refusal was about other files and about the code that marks screenshots as untrusted content. This exception is on batch 1, the batch that has held AC-2479 all along. It covers one different file, and that file does nothing to escape or mark untrusted content. A later review could still disagree with that call.

**Two weak tests I flagged (passing, but proving less than they claim):**
- `test_UAT_FC_REQ-216_a_menu_is_set_by_the_words_a_person_reads_on_it` uses a dropdown with only one option, so it would pass even with the current one-pass bug.
- `test_UAT_AC2027_all_five_kinds…` is named for five picture kinds, but there are now six.

I made no AC or story changes. The report was created locally, but at the same moment the sandbox blocked a connection to `github.com:22`, so it may not have synced to GitHub.