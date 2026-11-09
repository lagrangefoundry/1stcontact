---
uid: comment-2d8479dc
id: COMMENT-8144
type: comment
title: Claude response for batch_fix_assessment report
created_by: xgd
created_at: '2026-11-09T19:22:42.598824+00:00'
updated_at: '2026-11-09T19:22:42.598824+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-db289e41
  kind: note
---

I fixed the one failure in this batch, `override_conformance::item_5`, by adding a test. No production code changed.

**Why it failed:** the earlier fix changed `app.js`, `library.js` and `image-editor.js` so that every way out of the image modal (Close, Escape, the backdrop) tells the caller the modal is gone. The same change made a rename arriving on the change feed update the open name field, the picture's alt text and an open modal. A material's name is untrusted text, because the describer can write it from content fetched off the web. Those code paths matched the gate's trust-boundary patterns, but no test proved the name still can't run as markup on them.

**What I added:** a new test in `tests/reconciliation-library-image-modal.test.ts`, inside the AC-2556 block: `test_UAT_AC2556_a_name_carrying_markup_stays_inert_text_through_the_feed_the_modal_and_the_chat_opener`. It uses a hostile name, `<img src="x" onerror=…><b>bold</b>`, and checks three paths:
1. **Library change feed:** the rename arrives on the feed into the open detail. The name field, the list row and the picture's alt text all show it as literal text, and no element is injected.
2. **Library modal, opened, closed with Escape and opened again:** the field, the dialog's accessible name and the picture's alt text are literal, with no injected element. This also proves the reopen fix works.
3. **Chat picture on the builder's own `/b/<business>/` address, opened and closed with Close twice:** same checks. At the end the `onerror` handler has never run.

If any of these places switched to parsing the name as HTML, the injected `<img>` or `<b>` would appear and the test would fail.

**Results:**
- `reconciliation-library-image-modal.test.ts`: 9 of 9 passed, none skipped.
- The three REQ-220 jsdom files plus `reconciliation-library-role-correction` and `reconciliation-library-tab`: 31 of 31 passed. I did not run the two `.workers.test.ts` REQ-220 suites, but they aren't affected because only a test file changed.
- ESLint did not run: it isn't installed locally and the sandbox blocks npm from downloading it.

No ticket changes were needed: AC-2556 already covers the name being shown in the pane, the modal and the feed, and this test only adds evidence for it.

```yaml
## Assessment
status: fixed
failures:
  - test_name: override_conformance::item_5
    fix: >
      Added test_UAT_AC2556_a_name_carrying_markup_stays_inert_text_through_the_feed_the_modal_and_the_chat_opener
      (tests/reconciliation-library-image-modal.test.ts), asserting untrusted title text stays inert on every
      path the batch's production diff touched: feed rename into pane field/alt, Library modal reopen after
      Escape, chat-opened modal on a scoped address reopened after Close.
    verified: "vitest: image-modal file 9/9 passed; 5 related REQ-220 and Library suites 31/31 passed"
production_changes: none
ticket_changes: none
```