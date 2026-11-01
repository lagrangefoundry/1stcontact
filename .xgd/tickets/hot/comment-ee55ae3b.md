---
uid: comment-ee55ae3b
id: COMMENT-5998
type: comment
title: Claude response for fix_reconciliation_review report
created_by: xgd
created_at: '2026-11-01T04:21:20.215191+00:00'
updated_at: '2026-11-01T04:21:20.215191+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-771de3d0
  kind: note
---

I've addressed both gaps from the failed reconciliation review, but none of the new tests have been run. The fixer instructions said to leave that to the workflow's full test run, which comes next. The completion report is filed as REPORT-7265.

**G1: AC-2095, AC-2096 and AC-2098 on STORY-140 had no tests.** I added `tests/reconciliation-material-text-comment.workers.test.ts`, which drives the real Worker routes:
- **AC-2095:** an upload stores exactly one `material_text` comment, and its identifier matches the `text_comment` the upload returns. That comment holds the whole document, while the material's own body is the short summary (the digest). A text over the size limit is cut and marked "truncated at N characters". An image gets no comment and `text_comment: null`.
- **AC-2096:** with no extra rebuild, the assistant's passage search finds a phrase buried deep in the document. The hit carries the material's own identifier, not the comment's. The material-level index and the Library listing show the digest, and the comment never appears as an entry of its own.
- **AC-2098:** the status endpoint reports that no key is set, with a message naming `ANTHROPIC_API_KEY`. Both the upload and fetch routes answer 503 with that message and store nothing: tickets, material and stored files are all unchanged. With a key, or a describer passed in by the host, it reports ready and never shows the key.

The browser half of AC-2098 (the banner, and the builder refusing input) already had tests in the free-coded file `test_UAT_FC_REQ-173_no_key_banner.test.ts`. I renamed it to `tests/reconciliation-builder-no-key-banner.test.ts` and renamed its tests to `test_UAT_AC2098_*`; the assertions are unchanged. I deleted `test_UAT_FC_REQ-173_text_comment.workers.test.ts`, because the new file carries all its checks, mostly in stronger form.

**G2: STORY-159 was out of date.** I removed Known gap 8 ("the deployed Worker never adopts a capture") and added a Reconciliation Decision recording that this bundle fixed it: `router.ts` now hooks capture adoption into the deployed Worker. Gaps 9 and 10 stay, since both are still true.

The new and renamed files are staged but not committed. No production code changed.

If something fails, these are the likeliest spots:
- **AC-2096:** whether the stand-in word-matching embedder ranks the deep passage high enough to come back from the search.
- **AC-2098:** I list the store's tickets without a type filter, and I couldn't confirm whether that listing includes comments. The check also compares material and stored files, so it still covers the 503 routes either way.

Two other free-coded REQ-173 files (`describer_session`, `material_digest`) are still in place. This review didn't name them, so a later check for leftover free-coded tests could flag them.
