---
uid: comment-cdc80199
id: COMMENT-3261
type: comment
title: Comment on story STORY-144
created_by: xgd
created_at: '2026-09-19T14:43:13.423802+00:00'
updated_at: '2026-09-19T14:43:13.423802+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: story-1500b111
  kind: note
---

# Reconciliation pass — BUNDLE-27 plan item 8 verified, no further mutation needed

Plan item 8 of report-f8336891 ("Library detail: the document reader", REQ-172 +
BUG-42's Library half) was re-entered on 2026-09-19. Every mutation the plan item
calls for is already present on this story and was verified against the code on
`reconcile-BUNDLE-27` rather than assumed:

**The five ACs the plan adds all exist and are code-accurate.**

| Plan "add" | Landed as | Verified against |
|---|---|---|
| content type decides the reader, bounded window, download link kept | AC-1811 | `builder/reader.js` `readerKind()` (markdown / pdf / text; `image/svg+xml` → `null`), `paint()`'s iframe / `md-body` / `<pre>` branches, `LOADING` note |
| expand control → modal, browsing takes it with it | AC-1812 | `mountReader().expand()` over `createModalShell`, second body registered in `bodies`, `destroy()` → `modal?.close()` |
| resolved content type on the row, older rows resolve from filename | AC-1813 | `material.ts:460` (ticket field) and `:471` (attachment) written from the one `contentType` at `:421`; `rowOf()` `:697` re-resolves via `resolveContentType` |
| markdown only through the shared render-then-sanitize seam; HTML as source; SVG stays a picture | AC-1814 | `reader.js:187` `renderSafe(source)` as the only `innerHTML`; `library.js:112` same seam for the description |
| repaint once the engines settle, incl. an open dialog; missing bytes say so | AC-1815 | `reader.js:229` `markdownReady.then(repaint)` over all registered `bodies`; `library.js:345` `MutationObserver` + `:349` `markdownReady.then(paintDescription)`; `GONE` string |

**Both ACs the plan modifies already carry the modification.** AC-1717's "the file
itself" now reads as *shown rather than named for every kind the reader can
render*, with the download link explicitly kept in the rendering cases and the
"no longer in storage" statement in place of a broken preview. AC-1718 states the
description is shown rendered while editing opens over the markdown source, and
that a committed correction is repainted rendered.

**The story body already describes the landed pane** — the content-type-decides-
the-rendering rule, the bounded expand-to-modal reader, the shared sanitize path,
plain text left unparsed, the SVG exception, and the wait on the rendering
engines — and its `## Reconciliation Decisions` section records the two
formalizations this item made where REQ-172 was silent (a reader that is still
loading says so; the expanded window closes when its detail is replaced), both
dated 2026-09-14.

Scope held: no runtime code was changed, no new story was created, and the
read-only rights record, the one-editable-field shape and the auto-commit model
are untouched, exactly as the plan's delta summary requires.
