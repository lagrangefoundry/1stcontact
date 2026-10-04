---
uid: request-1f611f31
id: REQ-387
type: request
title: Builder (delegated worker) cannot read the client's uploaded documents
created_by: xgd
created_at: '2026-10-04T20:37:43.834612+00:00'
updated_at: '2026-10-04T20:59:36.258146+00:00'
completed_at: null
last_field_updated: story_points
status: free_coding
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-809d2084
  story_points: 3
---

## What we were trying to do
The consultant delegated a page build and told the builder to take service wording and testimonials verbatim from two client-uploaded Library documents (`role: reference`, `rights: owned`, kind `document`). The consultant can read them through `get_library_item` and `KnowledgeGet` on the `project` knowledge base.

## What stopped us
The builder reported the documents "not accessible" and put a placeholder section on the page instead. That was the right call given what it could see, but it left the first pass visibly incomplete. The builder also spent tool calls searching for the documents, which helped it hit its call limit (`outcome: exhausted`) before it ran any checks.

## What would close the gap
- Give the builder role read access to the client's Library (`list_library` / `get_library_item`) and the `project` knowledge base. Read-only is enough: the builder needs the text, not the right to place reference documents.
- Or let `Delegate` attach named Library items to the brief, so their text is handed to the worker directly.

Workaround for now: the consultant pastes the exact copy into the brief. This costs the consultant's context and depends on it remembering to do so.

---

## Decided scope (free-coded)

### 1. The builder reads the client's Library, read-only
Where the deployment has a Library (the Worker host) and delegation is on, the delegated builder is composed with the Library surface under a **read-only** grant: it is offered `list_library` and `get_library_item`, and it is **not** offered `place_on_site`, `set_upload_role` or `delete_library_item`. The grant is derived the same way the coordinator's already is (`readOnlyGrant(libraryInstanceConfig(), [LIBRARY_DECLARATION])`), so a write group added to the Library later is withheld from the builder with no edit. A host with no Library (the `1c` CLI) composes the builder exactly as before.

**Explicit supersession of [[REQ-355]]:** REQ-355's UAT `test_UAT_FC_REQ-355_the_builder_still_has_no_ledger_catalogue_or_delegation` asserted the builder has no catalogue operations at all. That is narrowed: the builder now holds the catalogue's READ operations; it still holds no catalogue write, no ledger operation and no `Delegate`.

### 2. `get_library_item` can return a document's own text, a page at a time
Today `get_library_item` returns the item's `description`, which for a document is a short digest — not enough to quote service wording or testimonials verbatim. It gains an optional `text: true` parameter. When set, the answer also carries:
- `text` — the document's own extracted text (the same text `KnowledgeGet` reads for the material), one page at a time; `null` when the item has no extracted text (pictures, fonts, a document that could not be read);
- `text_from` — the character offset this page starts at (the `from` parameter, default 0);
- `text_total` — the length of the whole text;
- `text_next` — the offset to ask for the next page, or `null` when this page reaches the end.

Pages are bounded (20,000 characters) so a long brand book cannot flood a worker's smaller context window. Without `text: true` the answer is unchanged. The consultant gets the same optional parameter (it is one surface), which is harmless and opt-in.

### Not done, and why
- **The `project` knowledge base stays out of the builder's reach.** That KB indexes the client conversation (chat transcripts) as well as uploaded material, and REQ-355 deliberately keeps workers away from the conversation so they do not form their own view of what the client wants. The Library text gives the builder the documents themselves without the conversation.
- **`Delegate` attaching Library items** would need a change to the framework's delegation toolbox (`@lagrangefoundry/ai`), out of this repo's scope; the read grant closes the gap without it.

## Why free-coded
Small, contained change to one surface and one composition site; no design document needed.

## Test plan
- `tests/test_UAT_FC_REQ-387_builder_reads_the_library.workers.test.ts` (real route inside workerd, delegation on, scripted model, document uploaded through the real `/api/material` route):
  - `..._the_builder_is_offered_the_librarys_reads_and_none_of_its_writes` — every `effect: read` Library operation is offered to the worker, no write operation is, and no `Delegate`.
  - `..._the_builder_reads_an_uploaded_documents_words_verbatim` — the worker's `list_library` finds the uploaded reference document and its `get_library_item {text: true}` returns the client's exact words (not the digest), with `text_next: null`.
- `tests/test_UAT_FC_REQ-387_library_document_text.test.ts` (production operation, doubled host): unchanged answer without the flag; paging reassembles a >2-page document exactly with `text_from`/`text_total`/`text_next`; `text: null` for an item with no text.
- Updated `test_UAT_FC_REQ-355_the_builder_still_has_no_ledger_catalogue_or_delegation`: fences ledger operations, Library operations whose `effect` is not `read`, and `Delegate`.
- Regression run: REQ-228 (both), REQ-280, REQ-281, REQ-343 (both), REQ-355 (both), REQ-364, REQ-357, REQ-173, BUG-185, BUG-118, BUG-129 pass. Failing both with and without this change on clean xgd-working (pre-existing): REQ-295 delegation `the_caller_gets_a_result…` / `a_worker_that_never_reported…`, REQ-341 `a_worker_may_manage_pages…`, REQ-122 `the_model_is_primed…`.

## Implementation notes
- `host-core.ts`: `readOnlyLibrary(lib, deps, slug)` composes the Library with `readOnlyGrant(libraryInstanceConfig(), [LIBRARY_DECLARATION])`; used by both the coordinator and the builder.
- `library-core.ts`: `LibraryDeps.text(name)`, `LIBRARY_TEXT_PAGE = 20_000`, paging in `get_library_item`. `library-surface.json` → `surface_version` 5, new `text`/`from` params and `catalogue_item` shape fields.
- `material.ts`: `materialText(store, uid)` — the single read of the `material_text` comment, now also used by `knowledge.ts`'s `materialTextView.get`; `library.ts` implements `text()` with it.
