---
uid: comment-2d692a23
id: COMMENT-5494
type: comment
title: Comment on bug BUG-226
created_by: xgd
created_at: '2026-10-18T22:09:16.229544+00:00'
updated_at: '2026-10-18T22:16:43.548483+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-f49e32b5
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "963ab3e8-1f55-4bb1-b09f-7d8dee67c5bc",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="bb8f3614-4e09-484d-9f58-ea4fc44c497c-user" -->

<!-- xgd-chat role="user" ts="2026-10-18T22:07:47.110551+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="bb8f3614-4e09-484d-9f58-ea4fc44c497c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-18T22:16:43.052791+00:00" -->
#### Claude
I'm reading the `make_alternatives` and `choose_look` code paths to settle where the content baseline should live before I write anything.

I've mapped the schema; now checking for an existing L1 text/image walker to reuse rather than writing a new one.

Found `l1PlainText` to reuse. Checking whether `readPageFiles` hands back a composed `l1` for decomposed pages, then I'll write the ticket scope.

Plan settled. Updating the ticket with the implemented scope (appending, keeping existing body), then cutting the branch.

Now writing the content check into `editAlternativeChoose`.

`NOT_APPROVED` ("well-formed; what it needs is the client's yes") fits exactly, so I'll reuse it rather than add an error code, and map it to a declared `CONTENT_CHANGED` refusal on the plan surface.

Now the builder guidance note in `l1-surface.json`.

Now the UATs. Checking whether image `src` must name a held asset (affects the fixture) and what `starterHomePage` produces.

Remote `https` sources skip the held-asset rule, so the fixture can use them. Writing the new UAT file and updating the existing REQ-391 choose calls.

Known fresh-worktree artifact gap (`control-app/src/generated` is gitignored). Copying it from the main checkout and rerunning.

8/8 pass. Now the wider regression scope: typecheck, the REQ-391 node suite, and the surface-declaration/priming suites touched by the JSON edits.

Typecheck clean. Before committing, checking my notes on this project's version-bump and `free_coded` gate quirks.

Commit on the branch (no manual bump — the gate bumps itself), then lock and merge.

Merged (0 overlay candidates). Now the gate, letting it bump the version itself.

One thing the ticket body doesn't yet say: the existing REQ-391 choose UATs were changed. Adding that.

BUG-226 is fixed. `choose_look` no longer copies a look onto the real page when the look's words or pictures differ from the page's. The ticket is at `free_coded`, merged into xgd-working, version 0.2.537.

**What happens now**
- `choose_look` compares every text element's words and every picture's `src` and `alt` on the look against the page. If anything differs, it refuses with `CONTENT_CHANGED` and nothing is written. The refusal lists what would change, for example: "1 picture and 1 piece of text", then what is on the page now and what the look has instead.
- To go ahead, the consultant tells the client what would change and, if they still want that look, calls `choose_look` again with `content_changes_seen: true`.
- The comparison ignores position and element ids, so restyling that wraps, re-nests or reorders elements is never flagged. A look that only changed styling is chosen as before.
- I changed the builder's note on `make_alternatives`: a look changes how the page looks, never what it says.

**Decisions I made**
- **The page itself is the baseline.** The ticket's notes suggested recording a baseline when the looks are made. I compare against the page as it is when choosing instead. The look starts as a copy of the page, and if the page was edited since, choosing would overwrite that edit too, which is the same loss. No new stored state was needed.
- **No new error code inside the site code.** I reused the existing `NOT_APPROVED` ("the request is fine; what it needs is the client's yes"). The plan surface reports it to the consultant as `CONTENT_CHANGED`.
- **Not done:** marking a look "incomplete" when its builder was aborted, the third option in the ticket. The content check covers the harm in this bug. A half-styled look still appears in the carousel.
- **Not compared:** component settings, only text and pictures.
- **"Before" looks get the same check.** If the client confirmed content changes and later wants the page back, choosing the "Before" look will list those changes and ask once more.

**Behaviour change in existing tests:** the REQ-391 choosing tests use looks with different headlines, so they now pass `content_changes_seen: true`. Choosing a look with different content is no longer unconditional; the ticket body records this.

**Tests:** the three new tests and the five existing REQ-391 choosing tests pass (8/8). Twelve other test files for the plan and page-editing tools also pass (98 tests), and the typecheck is clean.

<!-- xgd-chat-end -->