---
uid: report-771de3d0
id: REPORT-7265
type: report
title: 'Fix reconciliation review: bundle-fd009b93'
created_by: xgd
created_at: '2026-11-01T04:21:06.757972+00:00'
updated_at: '2026-11-01T04:21:06.757972+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_reconciliation_review
  subject_uid: bundle-fd009b93
  needs_more_work: false
  progress_made: true
---

## Stories created
None

## Stories modified
- STORY-159 (story-31204812), for G2: removed the stale Known gap 8 ("the deployed Worker never adopts a capture") from the REQ-166 code-issues list. The header now says the former item 8 was resolved in BUNDLE-34. Added a Reconciliation Decision, "Deployed adoption wired; former Known gap 8 resolved". It says `router.ts` `sessionFidelity` binds `adopt` over the request's TicketStore, calling `adoptCapture` with the same indexer and describer seams `/api/material` uses, with the indexer resolved per adoption (override report-4a2f1de4). AC-2080 passes. Known gaps 9 and 10 are kept unchanged and are still true. The Technical Context bullet on REQ-166 adoption now names the router.ts binding.

## Stories deleted
None

## ACs superseded
None

## FC orphans renamed/deleted
No fc_orphan_check report exists for this anchor. The two REQ-173 FC files the review named as the basis for G1 were turned into AC-named evidence anyway:
- tests/test_UAT_FC_REQ-173_no_key_banner.test.ts was renamed (git mv) to tests/reconciliation-builder-no-key-banner.test.ts. Its tests are renamed to test_UAT_AC2098_*. Assertions are unchanged; this covers the banner half of AC-2098 (banner shows the message, shell inert, banner outside the inert subtree, no session, no upload).
- tests/test_UAT_FC_REQ-173_text_comment.workers.test.ts was deleted. Every assertion in it is carried, strengthened, into tests/reconciliation-material-text-comment.workers.test.ts (see Code changes).
The other REQ-173 FC files (describer_session, material_digest) were not named by this review and were left alone.

## Code changes
- New file tests/reconciliation-material-text-comment.workers.test.ts (workers project, story-6ccaedd5 / STORY-140), for G1:
  - test_UAT_AC2095_*: uploads through route(). Asserts text_comment is non-null; through an independent store, exactly one material_text comment whose uid matches the answer; the comment holds the full text, first line to last, including the deep sentence; the material body is the digest and lacks that sentence. A text over MAX_EXTRACTED_TEXT_CHARS yields one comment with the leading text plus "truncated at N characters". An image gives text_comment null and no comment.
  - test_UAT_AC2096_*: the indexer refreshes the KB at ingest. With no further rebuild, CoRankedKnowledge.chunk_search (the chat host's passage search) returns a hit whose uid is the material's, not the comment's, and whose chunks contain the deep phrase. The document index reads the digest and has no entry for the comment. GET /api/material lists the material but not the comment, and /api/material/item body is the digest.
  - test_UAT_AC2098_*: /api/status reports ai false with the ANTHROPIC_API_KEY message. Upload and fetch both answer 503 with that same message. Ticket list, material list and private R2 keys are unchanged afterwards. With a key, ai is true, message is null and the secret is never present. With an injected describer, ai is true.
- No production code changed.

## Confidence
High for G2 (a matrix text edit, verified against router.ts lines 180-209). High-moderate for G1: the new UATs drive the real Worker routes, and the APIs they call were checked against source (chunk_search hit shape {uid: parent_uid, chunks}, aiConfigured, status route, listMaterial and readMaterial). They were not executed in this fixer per instructions. If one fails, the most likely cause is chunk ranking with the stub embedder in AC-2096 or the store.list() no-type call in AC-2098.
