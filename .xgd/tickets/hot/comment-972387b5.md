---
uid: comment-972387b5
id: COMMENT-2027
type: comment
title: Comment on request REQ-172
created_by: xgd
created_at: '2026-09-01T21:10:30.940515+00:00'
updated_at: '2026-09-01T21:42:45.258788+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-8b33a146
  kind: chat_transcript
---

<!-- xgd-turn id="c924c9ee-5721-45da-935c-bf06c95f5317-user" -->

<!-- xgd-chat role="user" ts="2026-09-01T21:10:10.967451+00:00" -->
#### You
The detail page in the library needs to display documents - right now all I get is a link letting me download the doc I just uploaded...not super helpful.

I think to be consistent with the image display we should show a text window with a scroll bar above the metadata that renders the MD. I;d like a button in the top right with two arrows pointing away from each other that opens the doc in a popup modal.

We should display .txt docs the same way please.

Is it possible for us to also display PDFs this way?

<!-- xgd-turn id="c924c9ee-5721-45da-935c-bf06c95f5317-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-01T21:16:40.447855+00:00" -->
#### Claude
**PDFs: yes, and it's the cheap option.** The file route already serves the stored content type with `content-disposition: inline` — which is exactly what the browser's built-in PDF viewer needs. An `<iframe>` pointed at that URL gives a real scrollable viewer with no library and no build step. Two honest limits: it's the *browser's* viewer, so the chrome differs slightly per browser and we don't control it; and iOS Safari renders only the first page in a frame (irrelevant while the builder is desktop-only).

I've scoped REQ-172. The shape:

**The reader window** sits in the preview slot above the metadata, bounded and scrolling, with the download link kept beneath it in every case:

| Bytes | Shown as |
|---|---|
| `image/*` | inline `<img>` — unchanged |
| `text/markdown` | rendered markdown |
| other `text/*` (plain, csv, log) | the text, preformatted |
| `application/pdf` | browser PDF viewer, in a frame |
| anything else | download link alone — unchanged |

**Expand button** top-right of the reader (⤢), opens the same content in the existing `createModalShell` at modal size. Escape/backdrop/close all shut it.

Two consequences worth flagging because they aren't things you asked for directly:

1. **The row has to say what the bytes are.** `MaterialRow` carries only `kind`, which is `document` for markdown, text and PDF alike. So the resolved content type gets duplicated onto the material ticket's fields at ingest — exactly as `filename` already is, for the identical reason (otherwise it's an `attachments()` call per row to draw the list). Existing material has no such field, so the row falls back to resolving the type from its own filename. No migration.

2. **Markdown goes through the sanitizer.** A `.md` can arrive via `/api/material/fetch`, not just from the client's disk, so it isn't necessarily trusted. I'll render through the same `renderSafe` seam the chat panel already uses (webui-chat over webui-markdown + DOMPurify) rather than writing a second one. `.txt` deliberately *isn't* put through the markdown parser — it would lose its line breaks and gain headings nobody wrote.

Confirm and I'll cut the branch and build it.

<!-- xgd-turn id="cf515d7f-c1e6-4a7c-b751-e6e7f52effde-user" -->

<!-- xgd-chat role="user" ts="2026-09-01T21:19:39.013194+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="cf515d7f-c1e6-4a7c-b751-e6e7f52effde-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-01T21:42:45.230174+00:00" -->
#### Claude
No blocking questions — the ticket is scoped and you've confirmed it. Starting.

Everything I need already exists in the worktree (`markdown.js` seam, `modal.js`). Starting with the origin change.

Now the origin change — declaring the field, writing it at ingest, and putting it on the row.

Now `MaterialRow` and `rowOf`:

Now wiring it into the Library's `preview()`:

Now the `openDetail` call site, imports, and the modal host option:

Now the CSS:

Now the tests. First the jsdom suite for the reader:

Now writing the REQ-172 jsdom suite:

Now the origin-side workers test:

Now running the tests. First the assets prerequisite, then the jsdom suite:

Both suites pass. Now the regression check on the suites I touched:

Now the full suite, to catch anything the `MaterialRow` shape change touched:

The full suite has one failure, and it pre-exists on the branch base (BUG-42's UAT file trips a scope guard). My test file would have added to it — routing the engine seams through the builder's own markdown module instead:

Full suite once more, then I'll drive the app to confirm it actually renders:

The module and stylesheet ship. Now updating the ticket body to match what actually landed:

Now committing:

Now the merge-back — lock, merge into `xgd-working`:

Green in the merged tree. Marking the ticket `free_coded` and cleaning up:

0.2.37 is free. Bumping on the branch and re-merging:

Working tree restored to its session-start state. One more full run to check whether that second failure is a flake:

Done. REQ-172 is landed and at `free_coded`.

**What the Library detail pane does now**

A document is shown rather than named. The preview slot above the metadata gains a bounded, scrolling reader window, and the download link survives in every case:

| Bytes | Shown as |
|---|---|
| `image/*` | inline `<img>` — unchanged |
| `text/markdown` | rendered markdown |
| other `text/*`, plus JSON/XML | the text itself, in a `<pre>` |
| `application/pdf` | the browser's own viewer, in a frame |
| anything else | download link alone — unchanged |

The expand button (⤢) sits in a bar above the window — not floating over it, since the window scrolls — and opens the same content at modal size through the builder's existing dialog shell, so Escape/backdrop/close already work.

**Your PDF question: yes, and it cost nothing.** The file route already served the stored content type with `content-disposition: inline`, which is exactly what the built-in viewer needs. The frame asks that route for the bytes itself, so nothing fetches them twice.

**Three things I decided that you didn't ask for directly**, all recorded in the ticket:

- **`.txt` isn't parsed as markdown** even with the engines loaded — it would lose its line breaks and gain headings nobody wrote. `.html` is shown as source for a stronger reason: rendering an uploaded document as live markup is a script-execution surface.
- **SVG stays a picture.** It decodes as text and is the one textual type the reader refuses.
- **The row now carries `content_type`**, written at ingest beside `filename` from the same variable the attachment gets. Rows without it resolve from their own filename, so your existing corpus works with no backfill.

Markdown goes through the `renderSafe` seam the chat panel already uses, and repaints on BUG-42's `markdownReady` signal so a cold load doesn't strand you looking at escaped source.

**Test results.** 16 new UATs across two files (jsdom for the pane, workerd for the origin contract), all passing. Two things in the full suite you should know about, neither caused by this change:

- `bug32-webui-scope-rebrand` fails — **pre-existing**, verified by running it at the branch base. BUG-42's UAT file names the component scope outside the two permitted locations. I didn't fix it: it's another ticket's UAT file, and silencing a guard there is your call. My test avoids the problem by reaching the engine seams through `builder/markdown.js`, which is a permitted location.
- One `reconciliation-*` suite fails per full run, but a *different* one each time, and both pass in isolation. Load-dependent flake, not a regression.

Commits `eb6655c3` and `324b55bf` (version 0.2.37), merged into `xgd-working`, branch cleaned up. Your working-tree changes are untouched. I haven't promoted to `ready_to_reconcile` — that's yours.

<!-- xgd-chat-end -->