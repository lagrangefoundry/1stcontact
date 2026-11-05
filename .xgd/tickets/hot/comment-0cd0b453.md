---
uid: comment-0cd0b453
id: COMMENT-6231
type: comment
title: Comment on request REQ-626
created_by: xgd
created_at: '2026-11-01T17:24:22.663253+00:00'
updated_at: '2026-11-01T18:13:07.969649+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-0d6c521f
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "c87280ab-3ede-4875-8e04-8631a8860f77",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="10577cb7-54d7-4629-8c52-81b354c2c676-user" -->

<!-- xgd-chat role="user" ts="2026-11-01T17:22:59.374082+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="10577cb7-54d7-4629-8c52-81b354c2c676-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-01T17:48:36.850537+00:00" -->
#### Claude
Body is truncated; let me get the full body.

Still surveying the code — the ticket's 24-hour single-use link may need a change in the shared sign-in component, so I'm checking that now.

Good — the component already supports a per-issue lifetime and tokens are single-use, so no cross-repo change. Now the people model.

Mapping how plan-surface tools get their host dependencies, so the notify tool can be wired the same way `show_client` is.

Tracing how the control-app builds the host's per-site dependencies (`ai.ts`), where the notify binding will go.

Now checking what the redeem route does with an expired or used link, and how the builder picks its site at boot.

I have the sign-in shape. Now the test harness — finding an existing delegate/sign-in UAT to mirror its fixtures.

Found the fixtures. Now a scripted-consultant UAT that exercises a host-wired plan tool (REQ-476's `set_client_name` is the closest analogue).

The ticket is detailed enough to build from without questions; I'll record the judgement calls in the ticket body as I go. Marking it `free_coding` and cutting the branch.

Worktree is set up. Reading the remaining pieces I need: the business sender (`sending.ts`), mailer, names, and the ticket store's type rules.

Design is settled. Now finding the end of the router's `workerHost(...)` call, where the notify binding gets passed in.

Builder side: I'll mirror how `openConsoleOnStart` is passed into `mountBuilder`, adding an `openView` option read from the URL's query.

I have the full design. Checking a few remaining declaration details (tool return shapes, `OutgoingMessage`, how `index.ts` routes public pages) before writing code.

Writing `notifications.ts` now.

Fixing the subject (plain text, not HTML-escaped), then the supporting changes: `OutgoingMessage.fields`, the ticket types, and exporting `shell`.

Good. Now the `messages.ts` extra-fields hook, the ticket type declarations, and exporting `shell`:

Now the sign-in fallback: a dead notification link offers the ordinary sign-in with the same destination.

Wiring the unsubscribe route into `index.ts` beside the other public, pre-gate routes:

Now the consultant tool. Checking how `plan-core` exposes `showOperations`' ops so a second op rides along:

`...shows` spreads, so a new op in `showOperations` is exposed; I'll also give it the same first-draft-review guard `show_client` has. Editing `show-core.ts`:

Now `host-core`: a `notify` member on `HostDeps`, passed into `showDeps`.

Now declaring the tool in `plan-surface.json` (op, return shape, consultant grant):

Talker gets an `allow` list; I'll add `notify_client` there (finished-build cues go to the talker) and exclude it from `MOVING_TOOLS` as `show_client` is.

Now the priming line. Finding where the consultant's priming talks about long work:

I'll add the line to the consultant's rule 8 (honest time estimates), which is where "a first draft takes 30–45 minutes" already lives:

Server side done. Now the builder reading the view from the query on load — `app.js` option plus `main.js`:

Now a typecheck before writing tests.

Typecheck is clean. Writing the UATs; checking the `Sent` shape and names helper first.

Writing the workers UAT file:

Cleaning up a muddled assertion in test 2 (the business name is HTML-escaped in the body):

Running the workers UAT file:

Two are just name expectations (full display names come back, which is fine). Looking at the first failure and why the consultant turn recorded nothing:

The model was never called — printing what the turn returned:

The surface declares its error codes centrally; adding `NO_NOTIFY` there.

All 6 workers UATs pass. Now the builder half — a jsdom UAT mounting the real builder with the view taken from a link's query, as `main.js` does:

Passing — checking it isn't vacuous by disabling the builder change and re-running:

Builder change is restored and the test is real. Now regression scope: suites touching sign-in, show_client, the plan surface declaration, talker/roles, priming, and messages.

Running the scope in two batches (node, then workers):

Five failures; checking each for whether my change caused it:

Both look unrelated (`/api/plan` is an existing route; the page-map one is about off-system counts). Checking the pre-existing-failures memory before running a baseline:

REQ-180 is a known pre-existing failure. Baselining the other two in the main checkout (unchanged code):

All pre-existing. Now the workers batch:

Several of these could be mine (prompt budgets, talker withholding). Baselining the six files on the unchanged main checkout:

Identical 11 failures on the unchanged checkout, so none are from this change. Committing the work on the branch:

Committed. Before merging back, re-reading the ticket body (the operator can re-scope mid-build) so my update preserves it:

Unchanged since I read it. Writing the body: the original text kept intact, with an "as built" section and the test plan extended with the builder UATs.

Ticket body updated. Now the merge-back sequence: lock, merge `xgd-working` into the branch, bump the version on the branch, then merge back.

Merged cleanly (others touched `app.js` and `router.ts`). Re-running my UATs on the merged tree before bumping:

Merged (a ticket commit landed meanwhile, so it's a merge commit). Running the `free_coded` gate:

REQ-626 is built and merged into `xgd-working`. The ticket is at `free_coded` with two commits (`cd0e63ef`, `e3c4968b`), version 0.2.727 and 8 story points. The ticket body was detailed enough that I didn't need to ask anything first.

**What it does**
- **`notify()`** (new file `apps/control-app/src/notifications.ts`): emails the business's owner and every live delegate, once each, at their verified primary address.
  - The `job_done` subject and body are fixed platform text, sent from 1st Contact.
  - Each recipient gets their own sign-in link that works once, within 24 hours, and lands on the view the caller named.
  - It refuses a link that doesn't point into `/b/<businessId>/` on this origin, a repeated dedupe key, and more than 5 notifications per business per hour.
  - Every email has an unsubscribe link. Opening it only shows a confirm button; pressing the button records the opt-out, so a mail scanner following the link doesn't unsubscribe anyone.
  - The result names who was told, who was skipped and why (revoked, no verified address, opted out), or why nothing was sent. It never contains an address.
- **Deep links:** the builder now reads `?show=…` from its URL when it loads, so a link survives sign-in and opens the named draft page, question and so on. An expired or used link shows the normal sign-in form, which then returns to the same view.
- **`notify_client` tool:** the consultant names the job (one email per job) and a destination in the same form `show_client` takes. It is held back the same way `show_client` is while a draft is still building or its first review is owed. One line in the consultant's priming tells it when to use the tool. The host gets the same path (`HostDeps.notify`) to call when a job it runs ends, but nothing calls it automatically yet.

**Decisions to check**
- The talker can also call `notify_client`, because cues about finished builds reach the talker.
- An opt-out applies to one person on one business. It's stored as a ticket in the business's store, so no D1 migration was needed.
- Links name the business and the view, not the site. That works because a business has one site today; it would need revisiting if businesses get several.

**Tests:** the 9 new UATs pass. Six run against the real Worker and D1, with only the mail provider and the AI model replaced by test doubles. Three run against the real builder in jsdom; with the builder change switched off, the two that open a view fail. In the wider regression run, 14 tests fail, and every one also fails on unchanged code, so none come from this change. Two of them (REQ-466, REQ-473) are prompt-size budget checks that were already over, and the new tool description and priming line make the consultant's prompt slightly larger again.

<!-- xgd-turn id="208d8a14-3d94-43e2-8433-dc24812d23b0-user" -->

<!-- xgd-chat role="user" ts="2026-11-01T17:53:57.875426+00:00" -->
#### You
Please reread your ticket - there were some tweaks that need to be addressed

<!-- xgd-turn id="208d8a14-3d94-43e2-8433-dc24812d23b0-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-01T18:05:59.588294+00:00" -->
#### Claude
REQ-625's estimates have landed; REQ-624/627 (durable job end) haven't, so "job end" today is the first-draft hand-over, as the ticket allows. Reading REQ-625's estimate API and the hand-over point:

Finding REQ-625's estimate function, the first-draft hand-over point, and anything recording builder presence:

Design questions for the host side: how the first draft's completion is visible, and whether anything already records that a builder tab is open on a site.

Presence: every open builder tab holds an `/api/changes` SSE stream naming its site. I'll count those per (business, site, person) in the router. Looking at that route:

I'll post the note through the same end-of-reply mechanism (`owedLines`). Checking the cadence wrapper's hooks, which the host supplies per round — the natural place for a job-end check:

Now `notifications.ts`: recipients restricted to `to`, the note and its checks, presence registry, and the notifier's new argument shape.

Good — the old notifier was replaced. Now the router: presence on the change stream, and the signed-in person's id on `ClientPerson`.

Now the host side. Checking where the cadence wrapper flushes owed lines at round end (the job-end check goes there):

I'll make `owedLines` async so it can ask the host whether a promised job just ended, and also append a line for any email a tool sent. Editing `show-core.ts` first (tool + helpers):

Now the cadence wrapper:

Now `host-core`: the person's id, the promise store, the long-work check, and the job-end hook.

Typecheck clean. Now the declarations: `email_when_ready`, the reworded `notify_client` with its `note`, and `NOT_LONG`.

Escaping got tangled; building the op entries as Python objects and serialising them instead:

Now priming: update the consultant's rule 8 line and find the talker's priming.

REQ-625 reworded rule 8 around my line since; replacing just my sentence:

Code is in. Now the tests. Checking two helpers: how the talker's discovery priming is rendered, and how tests write plan milestones.

Rewriting the workers UAT file for the revised behaviour and the new cases:

Writing the new conversation-level test block, then applying both edits together:

13/13 pass on the first run, so checking the presence case isn't passing by accident — disabling the presence hook should make it fail:

Real. Restored. Now the same regression scope as before, both projects:

Same set as the earlier baseline, plus BUG-284 which wasn't in the earlier scope — baselining it on the unchanged checkout:

All pre-existing. Committing on the branch:

Now the ticket body. Re-reading it fresh, then replacing only my own "As built" section and keeping the operator's sections verbatim:

Ticket synced. Merge-back: lock, merge `xgd-working` in, re-run my UATs, bump, merge.

Both of your added sections ("who and when" and "the consultant's note") are now built and merged into `xgd-working`. REQ-626 is back at `free_coded` with four commits, version 0.2.729 and 13 story points. All 16 REQ-626 tests pass. Every other failure in the regression run also fails on the old code, so none are caused by this change.

**Who and when**
1. **Only the person who started the job is emailed.** `notify()` now takes `to` (user ids), and the conversation always passes the person signed in to it. Revoked, unverified and opted-out people are still skipped.
2. **Long work only.** A new tool, `email_when_ready`, records the promise. It is refused unless the work is the first draft, or REQ-625's estimate for the planned steps is 20 minutes or more.
3. **Promise once the talk is done.** The consultant's rule 8 and the talker's priming now say this, with your example sentence and the host's time estimate.
4. **The host sends the email itself, with no tool call.** For the first draft it goes on the reply that hands the draft over; for other work, when the last planned step is done; and only if nothing is still building. `notify_client` is now for "something needs you" emails.
5. **No email if they're in the builder.** Each open builder tab keeps a live connection to the server for its site, and the router counts those connections per business, site and person. No email is sent if the starter has one open.

**The note**
- Both tools take an optional `note`: plain text, at most 3 sentences or 400 characters, with no links, email addresses, phone numbers or formatting.
- A note that fails a check is left out, the email goes with the fixed wording, and the reason is saved on the email record for you.
- When an email goes, the host adds "I've emailed you: …" (with the note) at the end of the reply, so it's in the chat. The rules on what a note may say (no prices, no private customer data, and so on) are in each tool's description.

**Limits you should know about**
- **REQ-624/627 haven't landed.** So "job end" means the first-draft hand-over or REQ-625's step list running out. Promises, like REQ-625's step list, are kept in server memory, so a server restart before the job ends loses the promise and no email goes.
- **The "in the builder" check sees only connections held by the same server instance.** If it misses someone, they get an email they didn't need, which is the harmless way to be wrong.
- **A background tab counts as present.** That rule is "open", not "open and active", because nothing records whether a tab is visible.
- **Prompt-size checks.** REQ-466 and REQ-473 were already failing, and the new tools and priming lines push the consultant and talker prompts further past their limits.

The ticket's "As built" section is rewritten to match, and your two sections are kept word for word.

<!-- xgd-turn id="b1da173c-fd54-4ef9-b6f6-07a0e8f5c48c-user" -->

<!-- xgd-chat role="user" ts="2026-11-01T18:06:45.791744+00:00" -->
#### You
is there additional work needed by you when 624/627 land?

<!-- xgd-turn id="b1da173c-fd54-4ef9-b6f6-07a0e8f5c48c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-01T18:07:11.189395+00:00" -->
#### Claude
Checking what REQ-624 and REQ-627 say they'll provide, so the answer is concrete:

Yes. This ticket deliberately stood in for 624/627 with in-memory pieces, and three of those stop working once jobs run on a durable runner:

1. **The promise is kept in memory.** `email_when_ready` stores the promise (job, note, who started it) in a map in `host-core.ts`. Under REQ-624 a job's steps can run on a different server instance or after a restart, where that map is empty. The email would then silently never go. The promise needs to live with the job record or the site plan.

2. **The send is triggered at the end of a consultant reply.** The host checks for job end when a reply finishes: either it links to the draft, or REQ-625's step list is empty. REQ-627 says the email should go "when the last build step ends, without a consultant waiting", which by design has no reply. The job's own completion step needs to call the notifier itself. The notifier already exists and the host can call it directly, so this is about one call.

3. **The "in the builder" check only sees connections held by the same server instance.** The job's last step will usually run somewhere else, so every starter would look absent and always get an email. That's safe but makes the check pointless. Presence needs to move somewhere shared, such as the per-site coordinator REQ-624 already uses or a short-lived record in D1.

Also check when they land:
- **The 20-minute check reads REQ-625's in-memory step list.** If 624 makes that list durable, nothing changes here. If not, it has the same problem as item 1.
- **Retries won't send twice.** The one-email-per-job check runs against the recorded email tickets, which are durable. A retried step can call the notifier again safely.

I'd do all of this as part of REQ-627, which already lists the completion email in its goals, rather than open a new ticket. I haven't changed REQ-627; if you want, I can add these items to its body so whoever builds it picks them up. No code is needed here until then.

<!-- xgd-turn id="a711f5ac-f89d-4aae-8bb2-b6b11ba743a6-user" -->

<!-- xgd-chat role="user" ts="2026-11-01T18:09:00.468597+00:00" -->
#### You
Actually there is a mistake: **No email if they're in the builder.** Each open builder tab keeps a live connection to the server for its site, and the router counts those connections per business, site and person. No email is sent if the starter has one open. <-- this is wrong. I leave the builder open and go and get a cup of coffee. We should not assume that because the builder is open the user is watching it. In fact I would assume that the builder needs to stay open for the work to complete so I would always leave it open. Anyway - sorry for the flip flop EPIC-19 is wrong on this

<!-- xgd-turn id="a711f5ac-f89d-4aae-8bb2-b6b11ba743a6-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-01T18:13:03.892190+00:00" -->
#### Claude
I'll take the presence check out entirely: the email always goes when promised work ends. First recording the decision on the ticket, then the branch.

Now removing presence from the code, the tool text and the test:

Passing. Updating the ticket's "As built" section so it no longer describes presence, then committing and merging back.

The "in the builder" check is gone. When promised work ends, the email now goes to the person who started it whether or not they have the builder open.

- **Code:** I removed the connection counting from the notifications code, the router and the host, along with the wording in the tool description that said no email would go if the builder was open.
- **Tests:** `no_email_when_present` is replaced by `email_sent_with_builder_open`. It opens the starter's builder connection for the site, hands over the first draft, and checks that exactly one email goes. All 13 notification tests pass after merging the latest `xgd-working`.
- **Ticket:** I added your decision as a new section saying it supersedes item 5 and EPIC-19 on this point. The "As built" section no longer describes the presence check. REQ-626 is back at `free_coded` with six commits, version 0.2.730.

This also removes item 3 from the earlier list of work for when REQ-624/627 land. Two items remain: the promise is held in memory and needs to become durable, and the email needs to be sent from the job's completion step instead of at the end of a consultant reply.

<!-- xgd-chat-end -->