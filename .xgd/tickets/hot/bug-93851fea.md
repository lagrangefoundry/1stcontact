---
uid: bug-93851fea
id: BUG-41
type: bug
title: 'Library: an uploaded .md is stored undescribed because the browser sends no
  content type'
created_by: xgd
created_at: '2026-09-01T20:41:58.464808+00:00'
updated_at: '2026-09-01T20:49:57.360694+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-0948105e
  severity: medium
  commits:
  - working_sha: d019bab77200d88dd613c94e0bbaa93b300ed526
    reconcile_sha: null
    main_sha: null
  version: 0.2.35
---

## Symptom

Upload a `.md` file to the Library, click it, and the detail pane says:

> **What this is** — Stored but not described: nothing here can read
> application/octet-stream. It can be found by name, not by its contents.
> File: gigabyte_alchemy_summary.md · application/octet-stream · 2811 bytes

Expected: the file's own text in the detail pane (which is what the "What this
is" body is for a textual document), alongside the material's metadata block.

## Root cause

Two independent faults, both on the ingestion path.

**1. The content type is never resolved from the filename.** Browsers have no
registered MIME type for `.md`, so `File.type` is the empty string. The upload
route (`router.ts`) falls back to `application/octet-stream`, and that string is
then used verbatim by all three downstream steps:

- `classify()` → `kindOf` returns `document` (correct, by its catch-all);
- `describe()` → `describeDocument` asks `isTextual('application/octet-stream')`,
  which is false, so it takes the `unsupported` branch and writes the degraded
  body above instead of the file's text;
- `store.attach()` → the attachment record records `application/octet-stream`
  permanently, so the wrong type is what a re-describe pass would read too.

`kindOf` already consults the extension when the type says nothing — but only to
pick `kind`, and only for fonts and images. Nothing repairs the content type
itself, so the describer keeps seeing `application/octet-stream`.

**2. A leading YAML front-matter block becomes the title.** Once the file *is*
read as text, `titleFromText` takes the first line of three or more characters —
which for a front-mattered markdown file is the `---` fence. The document's real
title, frequently sitting in that block as `title:`, is ignored.

## Fix

**Resolve the content type once, at the head of `ingest()`,** so classification,
description and the attachment record all see the same repaired value:

- a new `resolveContentType(contentType, filename)` in `material.ts` maps a
  filename extension to a content type **only** when the caller's type is absent
  or `application/octet-stream` — a type the browser or server actually stated is
  never second-guessed;
- the table covers the textual formats a client plausibly hands over (`md`,
  `txt`, `csv`, `html`, `json`, `xml`, `yaml`, …) plus `pdf`, the image types and
  the font wrappers, so the repair benefits `kind` and the describer alike;
- an unmapped extension still lands on `application/octet-stream` and still
  degrades honestly — the existing trade is preserved, not widened.

A markdown upload then reaches `describeDocument`'s textual branch and its body
becomes the file's own text, which is what the detail pane renders.

**Take the title from the front matter where there is one.** `titleFromText`
skips a leading `---` … `---` block rather than reading its fence as a title,
and prefers a `title:` declared inside that block when present. This is a
technical consequence of fault 1's fix: until markdown was read as text at all,
neither behaviour could be observed.

The attachment's recorded `content_type` becomes the resolved value, so the
Library's metadata block names the file honestly (`text/markdown`, not
`application/octet-stream`).

## Test plan

`tests/test_UAT_FC_BUG-41_markdown_material.test.ts` (node) —
`resolveContentType` repairs an absent and an `application/octet-stream` type
from the extension, leaves a stated type alone, and leaves an unknown extension
degrading as before; `describe()` of markdown returns `status: 'ok'` with the
file's text as the body; the front-matter title is preferred and the `---` fence
never becomes a title.

`tests/test_UAT_FC_BUG-41_markdown_upload.workers.test.ts` (workerd) — a `.md`
file posted to `/api/material` with an empty `File.type`, through the real route
against real D1/R2, yields `description_status: 'ok'`, a ticket body carrying the
file's own words, and an attachment record whose `content_type` is
`text/markdown`.