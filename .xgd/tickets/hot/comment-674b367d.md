---
uid: comment-674b367d
id: COMMENT-5795
type: comment
title: Comment on request REQ-480
created_by: xgd
created_at: '2026-10-28T00:19:22.617907+00:00'
updated_at: '2026-10-28T00:46:56.599919+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-ada3ada9
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "07c074dc-3975-4a53-81b1-aa4ba166fc15",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="fe3325ef-2ca5-46e4-b217-6ba7fa14ce59-user" -->

<!-- xgd-chat role="user" ts="2026-10-28T00:16:27.634638+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="fe3325ef-2ca5-46e4-b217-6ba7fa14ce59-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-28T00:46:52.612572+00:00" -->
#### Claude
Reading the existing session/activity code first — there's already a session inference in `activity.ts` that I should reuse.

I'm mapping the data sources (contact page, chat transcripts per panel, plan stage history) before deciding the design. I'll have an explorer sweep the codebase while I read the plan module.

Setting up the branch while the explorer works.

`readChats` and the transcript-segment parser in `first-draft-cut.ts` already do the reading I need, so I'll reuse them. Next: the plan change-log paging (`planAt`) and the contact detail route.

Site sessions are `site-<sites.id>` and plans key on the same id, so the join is direct. Now the client side: the contact page's History section and how admin-only routes are fetched.

Writing the code now. First, the existing session-cutting loop in `activity.ts` gets extracted so the timeline and the `session.recorded` closer share one rule.

Now the `activity.ts` refactor:

Now exposing the transcript reader from `first-draft-cut.ts`, then the timeline module itself.

Now the operator-only route, beside the existing `/api/admin/sites`:

I'll put the renderer in `people.js` itself so it uses the panel's existing `el`/`formatWhen` helpers and history-line classes (no new CSS).

Removing the duplicated panel-label table — the server already sends labels in `site.panels`:

Typecheck is clean. Now the UATs — finding how existing workers tests drive an `/api/admin/` route as the platform operator.

All 8 pass on the first run, so I'll check they can actually fail: break the per-panel reply rule on purpose and re-run.

My test arithmetic was off (10:06:30 → 12:00 is 1 h 54 min, not 2 h 54). Fixing the expectation:

A 90-second reply rounding to "2 min" hides the detail the operator needs, so I'm making short spans read as minutes and seconds.

zsh didn't split the file list, so only one suite ran. Re-running with a proper array:

BUG-52 and BUG-53 fail on the main checkout too (BUG-53 names a Library class, not mine). BUG-58 and REQ-450 pass there but fail in my worktree, and both mount the people panel, so I'm reading those.

Now the workers suites in the regression scope (activity log, people, admin routes, first-draft copy, timeline paging, one-login):

All 73 pass. Typecheck and lint next.

Ticket updated. Committing the work on the branch:

Now the merge-back: lock, bring `xgd-working` into the branch, bump the version, then fast-forward back.

Other work landed on `xgd-working` since the cut, so I'll re-run my suites on the merged tree before publishing.

Fast-forwarded. Moving the ticket to `free_coded`:

REQ-480 is implemented and merged into `xgd-working`, and the ticket is at `free_coded`. It isn't deployed anywhere yet. Production and dev (a frozen snapshot) only change when you deploy.

**What you'll see.** Each tester's contact page in 1st Contact's Contacts now has a **Time with the builder** section, just above History, where REQ-479's feedback will land. Only you, as platform operator, see it. Press **Show the timeline** and you get, for each of the tester's sites:
- **Sessions:** start, end and length, with the time away between them.
- **Stages:** time in each stage, and how much of that they spent in sessions.
- **Abandon point:** where they stopped, with the stage and the last four messages.
- **Panel use:** message counts per assistant panel.
- **Reply times:** a collapsible list for every message; replies taking a minute or more are marked **Slow reply**.

Below the sites is a count of visits and time per builder tab. There are no cost figures anywhere.

**How it works.** It's worked out each time you open it, from records that already exist, and nothing new is stored. Messages and replies come from the saved chat transcripts, stages from the site plan's change history, and tabs from the existing activity summaries. The 30-minute session rule now lives in one shared function (`splitAtIdle` in `activity.ts`), which the existing activity summaries also use and which REQ-479 can use for "minutes into the current session".

**Decisions I made:**
- **Whose messages:** the chat records don't say who typed a message, so a tester's messages are those in the conversations of businesses they belong to. That's exact while each tester has their own business; in a shared business, both people would see the same messages.
- **Settings assistant:** its messages count toward each of the business's sites, so one sitting that moves between panels is one session.
- **Session end:** a session ends at the later of the tester's last message and the reply to it.
- **Loads on request:** it reads every conversation the tester has had, so opening a contact doesn't fetch it. An existing test (REQ-450) also requires that opening a contact makes no admin calls.

**Known limits:**
- **Queued messages:** a message typed while a turn is already running is timed from when its own turn starts, not when it was typed, so its reply time comes out shorter than the tester's actual wait. The typed time only exists in the live session data. Fixing this needs a ticket in the framework repo, not a change here; I haven't filed one.
- **Old stages:** stage history older than what the plan's change log keeps isn't shown.

**Tests:**
- **New UATs, all pass:** 8 tests on the timeline route and 2 on the contact page. I broke the per-panel reply rule and the start-message filter on purpose and the tests failed, so they do catch real errors.
- **Related existing suites:** 9 workers files (73 tests) all pass; typecheck is clean.
- **Failures in the related node suites, none caused by this change:** BUG-52 and BUG-53 also fail on a clean checkout (BUG-53 is about a Library class). REQ-115, BUG-58 and the workspace-origin suite fail only inside the branch worktree, because webui files aren't served there; they pass on the main checkout.

The ticket body now describes what was built, including these decisions and limits.

<!-- xgd-chat-end -->