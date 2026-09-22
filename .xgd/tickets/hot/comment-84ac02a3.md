---
uid: comment-84ac02a3
id: COMMENT-3660
type: comment
title: Comment on request REQ-300
created_by: xgd
created_at: '2026-09-22T21:54:12.525194+00:00'
updated_at: '2026-09-22T22:12:59.373907+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-279636f6
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "be0b8ed8-10b8-4b6d-94b9-c1a43e4a3720",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="e26adbc1-4ff7-40dc-bd8e-d84a4a1a08aa-user" -->

<!-- xgd-chat role="user" ts="2026-09-22T21:52:12.501348+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="e26adbc1-4ff7-40dc-bd8e-d84a4a1a08aa-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-22T22:11:12.567974+00:00" -->
#### Claude
Ticket read. Let me check a couple of remaining details before I write the scope into the ticket.

Now I'll record the scope on the ticket (appending, preserving the reporter's text).

Now the extraction in `scaffold.ts`:

Now `editPageAdd` in `edit.ts`:

Now the declared surface prose:

The full node suite is running. While it does, here's where things stand.

**What I found and fixed** — the ticket's option 1, as preferred:

- `tools/generate/src/cli/scaffold.ts` — the L1 document that was inlined in `starterHomePage` (and therefore reachable only by site creation) is now a named `starterDocument(heading)`. Site creation's output is byte-unchanged.
- `tools/generate/src/cli/edit.ts` — `editPageAdd` seeds `l1: starterDocument(title)` on a served page, so `add_page` (and `1c page add`) produce a page that is paintable the moment it exists. Email pages keep `defaultEmailDocument` — one shape per kind, no flag.
- `tools/generate/src/cli/ai/l1-surface.json` — `add_page`'s declaration said *"The page arrives with nothing on it"*, which is the sentence that made this read as a wall rather than a missing second step. It now states what the page arrives with and how to replace it, plus an `add_page → describe_page → set_l1` sequence. Surface version 11 → 12.

**Evidence** — `tests/test_UAT_FC_REQ-300_new_page_is_paintable.test.ts`, 8 UATs through the grant's own operations and the real renderer. Verified RED first: without the fix, 7 of 8 fail with exactly the errors in your report (`Page 'services' has no L1 document.` from both `set_l1` and `set_page_style`). All 8 pass with it, as do the page-authoring/scaffold/surface suites (BUG-92, REQ-102, REQ-175, REQ-247, REQ-252, REQ-248, REQ-126, BUG-44) and `tsc --noEmit`.

Two notes for you:

1. **Your live site's two existing empty pages are not retro-fitted.** Nothing creates a document-less page any more, but those two keep their state — they're recoverable by deleting and re-adding them. I deliberately left option 2 (`set_l1` at `0` creating the root) out: it invents document-level values the caller never asked for, and delete-and-re-add is one call. Say the word if you'd rather I add it.
2. The worktree needed `./bin/1c assets` before three suites would even import (`src/generated/knowledge` is gitignored). Unrelated to this change, but worth knowing for fresh worktrees.

<!-- xgd-turn id="8108fd63-b370-450f-bca5-bafdf73b31bd-user" -->

<!-- xgd-chat role="user" ts="2026-09-22T22:12:58.879012+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-chat-end -->