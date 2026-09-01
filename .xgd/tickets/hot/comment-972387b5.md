---
uid: comment-972387b5
id: COMMENT-2027
type: comment
title: Comment on request REQ-172
created_by: xgd
created_at: '2026-09-01T21:10:30.940515+00:00'
updated_at: '2026-09-01T21:19:39.435564+00:00'
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

<!-- xgd-chat-end -->