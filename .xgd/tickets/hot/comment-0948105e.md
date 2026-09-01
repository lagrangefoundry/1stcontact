---
uid: comment-0948105e
id: COMMENT-2025
type: comment
title: Comment on bug BUG-41
created_by: xgd
created_at: '2026-09-01T20:43:36.563000+00:00'
updated_at: '2026-09-01T20:50:16.833255+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-93851fea
  kind: chat_transcript
---

<!-- xgd-turn id="18295f10-1ce4-4852-8245-d93aaa830a84-user" -->

<!-- xgd-chat role="user" ts="2026-09-01T20:43:29.146822+00:00" -->
#### You
I uploaded a .md file to the Library. When I click on a .md file, I expect to see the file itself in the detail panel (plus the metadata front matter) What I see is: What this is

Stored but not described: nothing here can read application/octet-stream. It can be found by name, not by its contents. File: gigabyte_alchemy_summary.md · application/octet-stream · 2811 bytes

<!-- xgd-turn id="18295f10-1ce4-4852-8245-d93aaa830a84-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-01T20:50:16.709974+00:00" -->
#### Claude
Now the implementation. Adding `resolveContentType` to `material.ts`:

Now wire it into `ingest()`:

Now the front-matter title in `describe.ts`:

Now the workerd end-to-end UAT:

Fixed and landed on `xgd-working` as `d019bab772`; BUG-41 is at `free_coded`.

**What was wrong.** Two faults, one visible:

1. Browsers register no MIME type for `.md`, so `File.type` arrives empty and the upload route substitutes `application/octet-stream`. That string then went verbatim to all three downstream steps — `classify`, `describe`, and the attachment record. `describeDocument` asked `isTextual('application/octet-stream')`, got `false`, and wrote the "nothing here can read…" body you saw. `kindOf` already consulted the extension when the type said nothing, but only to pick `kind`, and only for fonts and images — nothing repaired the type itself.

2. Once markdown *is* read as text, the old title rule took the first line of three or more characters — which for a front-mattered file is the `---` fence.

**The fix.** A new `resolveContentType(contentType, filename)` in `material.ts`, called once at the head of `ingest()` so classification, description and the attachment record cannot disagree. It consults the extension **only** when the caller's type is absent or `application/octet-stream`; a type the browser or server actually stated is returned untouched, parameters and all. The table covers the textual formats a client plausibly hands over plus PDF, the image types and the font wrappers. An unmapped extension still lands on `application/octet-stream` and still degrades honestly.

`titleFromText` now skips a leading closed `---` block, prefers a `title:` declared inside it, and never mistakes a rule line for a heading.

So your file now shows its own text in the detail pane, titled from its front matter, with the metadata block reading `text/markdown`.

**Evidence.** Two new UAT files — a node one for the resolution rules and the describer, and a workerd one that posts a `.md` with an empty `File.type` through the real route against real D1/R2 and reads the ticket back through an independently constructed store. That one deliberately wires **no** describer: reading a text file must not need a model. 9 new tests pass; the adjacent REQ-161/REQ-163 material suites (53 tests) still pass. The one `tsc` error in `session-knowledge.ts` is pre-existing on `xgd-working`, unrelated.

One caveat worth knowing: this fixes the pipeline going forward. The already-uploaded `gigabyte_alchemy_summary.md` keeps its degraded body and its `application/octet-stream` attachment record — re-uploading it is the quickest way to see the fix. A re-describe pass over `description_status = unsupported` is the general answer, and it's out of scope here.

<!-- xgd-chat-end -->