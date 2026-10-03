---
uid: comment-a8814b4a
id: COMMENT-4851
type: comment
title: Comment on bug BUG-184
created_by: xgd
created_at: '2026-10-03T19:47:43.117847+00:00'
updated_at: '2026-10-03T20:18:01.424717+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-61c677c2
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "e9dac2b4-db68-4088-b84a-55ed6a7e2454",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="8495cfd8-9641-4ec8-be0c-7b56036e07e9-user" -->

<!-- xgd-chat role="user" ts="2026-10-03T19:40:30.467986+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="8495cfd8-9641-4ec8-be0c-7b56036e07e9-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-03T20:18:00.034654+00:00" -->
#### Claude
Now I'll find where library titles are derived.

Ticket is scoped and the `free-BUG-184` branch is cut. Now editing `titleFromText` and adding the UAT.

The 4 new UATs pass. The BUG-41 file fails at import because `./generated/ticketing` doesn't exist in a fresh worktree (a known artifact). I'll generate it and rerun.

It's gitignored build output, so I'll copy it in from the main checkout for the regression run, then remove it.

All 13 pass. Before committing I'll check my notes on version bumping for this project.

The newer note says to skip the manual bump: `move-to-free-coded` does the bump itself if `--version` is omitted. I'll commit, merge back, and promote.

BUG-184 is fixed and merged into `xgd-working`. The ticket is at `free_coded` (version 0.2.453); promoting it to `ready_to_reconcile` is your call.

**Cause:** library titles for text and markdown uploads come from the document's first line with at least three characters, and a logo's `<img …>` tag counted as one. That code is `titleFromText` in `apps/control-app/src/describe.ts`.

**What changed:** HTML tags and comments are now removed from each line before a title is picked:
- A line that is only markup, such as a logo or `<p align="center">`, is skipped. The title then comes from the next line with text, normally the first heading.
- Where markup wraps text, only the text is kept: `<h1>Acme <small>Letterhead</small></h1>` becomes `Acme Letterhead`.
- If no line has any text, the first image `alt` value is the title. The filename is used only when there's no `alt` either.
- A title declared in front matter still wins first, and PDFs are unchanged.

**Tests:** four new tests in `tests/test_UAT_FC_BUG-184_markup_title.test.ts` pass, and so do the existing nine for markdown uploads, 13 in total.

**Already-uploaded documents:** the letterhead and invoice template keep their `<img …>` titles. The fix only applies when a document is described, so they'll need re-uploading or re-describing.

The ticket body has the full root cause, fix and test plan.

<!-- xgd-chat-end -->