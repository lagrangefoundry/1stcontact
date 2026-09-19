---
uid: comment-63c3126e
id: COMMENT-3152
type: comment
title: Comment on request REQ-280
created_by: xgd
created_at: '2026-09-19T00:17:19.944630+00:00'
updated_at: '2026-09-19T00:45:20.900951+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-aa42dbaf
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "9ea5918e-02b1-43ba-826f-ec6baa2b073f",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="0e103fad-2d7e-4034-8b45-cd436a5fce5b-user" -->

<!-- xgd-chat role="user" ts="2026-09-19T00:16:41.988146+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="0e103fad-2d7e-4034-8b45-cd436a5fce5b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-19T00:41:19.225450+00:00" -->
#### Claude
Now the routes and browser API.

Now cutting the branch.

Now let me make the edits. Starting with `tickets.ts`:

Now `material.ts` — the core of the change:

Now `listMaterial` with the catch-up pass, and `storedImageOf`:

Now `storedImageOf` — the label as an alias:

Now the ingest creation site:

Now `capture-material.ts` — create branch only:

Now `imagegen.ts`:

Now the surface declaration:

Now the priming carve-out:

Now the Library tab UI:

Now let me typecheck.

Now let me write the UATs. First, the workers suite over real D1:

Now writing the workers UAT:

All 7 pass. Now the node-side surface UAT and the jsdom Library-tab UAT:

Now the node-side surface UAT:

Now the jsdom Library-tab UAT:

I'll wait for the suite to finish before committing.

The implementation is complete and the targeted suites are green; I'm waiting on the final full-suite run before committing. Summary of where things stand:

**What landed (in the `free-REQ-280` worktree, not yet committed):**

- **The label** — `<PREFIX>-<n>`, prefix derived from `kind` (`DOC` is the one entry in the table; everything else is the kind in capitals, so a fifth kind arrives labelled), number from `counters` under `material:<kind>` via the store's own atomic `nextCounter`. Stored on `fields.label`, never recomposed on read.
- **Assigned at all three births** — upload/fetch, capture adoption (create only, so a recapture keeps the number), and generated pictures — plus a one-time catch-up in `listMaterial`, oldest-first, for the Libraries that were already full when the label was invented.
- **Read in three places** — the catalogue item (`label` on `CatalogueItem`/`itemView` and in the declaration), the Library row (beside the title, in the row filter, and read-only in the detail pane as *Refer to it as*), and as an **input**: the label joins `storedImageOf`'s aliases, so `IMAGE-5` resolves through the one naming rule — in `get_library_item`, `place_on_site`, and `screenshot`/`edit_image` alike.
- **The carve-out written down** — in the library surface prose (version 1→2) and in the priming's no-vocabulary paragraph.

**Two things worth your attention:**

1. **`DOC-n` is already a namespace.** The product's own corpus addresses its method documents as `DOC-33`, and `BUG-65` forbids authored priming from naming anything in that namespace. I kept your prefix — the two never meet where either is used — but the priming carve-out spells only `IMAGE-5`; the surface prose carries both examples. Rationale is on the ticket, along with the cheap escape (one entry in `LABEL_PREFIX`; already-written labels stay valid because they're stored strings).
2. **The catch-up write is a change event**, so an open Library tab redraws those rows once with their new numbers. Correct behaviour, but it meant `REQ-201`'s change-feed fixture had to write a label — it was modelling a pre-label record without meaning to.

**Tests:** 19 new UATs across three suites (real D1 + counters; the surface over a doubled host; the Library tab in jsdom), all passing. Two pre-existing suites needed fixture updates (`REQ-221`'s recording store grew a counter; `REQ-201`'s fixture grew a label) — both were genuine consequences, not test massaging. Typecheck clean on both projects. The 13 other full-suite failures I've verified are pre-existing: 7 fail identically in the clean main checkout, and 6 more are the known worktree webui/dist-assets artifacts.

<!-- xgd-turn id="ba88b724-6c05-4736-bca1-0bfc9163d22d-user" -->

<!-- xgd-chat role="user" ts="2026-09-19T00:45:17.060667+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-chat-end -->