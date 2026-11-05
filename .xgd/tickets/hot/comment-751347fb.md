---
uid: comment-751347fb
id: COMMENT-7812
type: comment
title: Comment on bug BUG-354
created_by: xgd
created_at: '2026-11-05T16:29:52.708027+00:00'
updated_at: '2026-11-05T19:14:30.439956+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-43726c51
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "d2f96529-d15d-4d3e-8ea6-4321fcb3cdf0",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="8d849b57-b66b-4f74-9b88-f4b3e52d720c-user" -->

<!-- xgd-chat role="user" ts="2026-11-05T16:29:22.430547+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="8d849b57-b66b-4f74-9b88-f4b3e52d720c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-05T16:38:09.000460+00:00" -->
#### Claude
Reading the builder's opening logic to find what moves the pane to Input on load.

Still investigating — looking for the existing REQ-442 test harness so I can reproduce the bug in a test.

Writing a jsdom reproduction test now, mirroring the ticket's three cases.

Simple harness doesn't reproduce it; now checking the real boot path (businesses + remembered site), which the test didn't use.

Found the affected site's live session log in the dev store; checking its replayed records for show links and open jobs.

I couldn't reproduce this offline, so I'm parking the test outside the shared checkout and recording what I found on the ticket.

I haven't changed any code yet. My reproduction of the bug passes on the current code, so I don't know what is moving the pane, and the ticket says to find that cause rather than add a second "open in View" rule.

**What I ruled out:**
- **The jsdom test cases from the ticket pass on the current code.** A site with a draft, last left on Input, with open questions and a `#show=questions` link in the chat, opens on View. With `?show=questions` it opens on Input, and a site with no draft opens on Input.
- **This site's real plan, rendered through the builder, also opens on View.** I tried it with and without the published flag, and with the remembered pane set to Input.
- **Candidates 1 and 2 don't apply to this site.** Its plan has no open questions. Its session log has no consultant view switches at all; the only links in it are `#show=draft…`, which lead to View. No `?show=` was in the URL.
- **The dev request log has no "client opened Input" report (`POST /api/plan/seen`) for this business, ever.** Every route that moves the pane to Input sends that report: a chat link, a How you can help line, or the client clicking Input. So the pane gets to Input some other way: either the remembered pane is applied at startup, or the "before the first draft" rule fires. Either way, the "open in View once there's a draft" rule never takes effect for this site.
- **The plan request succeeds on every load today, and dev is running the same builder code as the repo.**

I've added these findings to BUG-354. The test is parked outside the repo, and I'll put it back once I can make it fail.

To reproduce it, I need three things from you:
1. **How do you open it?** A plain reload of `/b/<business>/`, the operator console's Open, the business switcher, or a link from an email?
2. **Is it on Input from the very first paint,** or does it show View and then jump to Input a moment later (for example, when the chat or the plan panel finishes loading)?
3. **In devtools on that page:** what does `localStorage` hold for the `site:panel` key (the `mode` value)? Are there any console errors on load?

<!-- xgd-turn id="500eef24-976a-441e-9265-2579d5b2527c-user" -->

<!-- xgd-chat role="user" ts="2026-11-05T18:47:58.295883+00:00" -->
#### You
It actually doesn't matter. I just logged in to the site 1st Contact is the first app that comes up and I am always dropped into the Input mode. I reloaded there and I think I saw the View mode before it settled. I can't seem to reproduce that though

```
Loading the script '<URL>' violates the following Content Security Policy directive: "script-src 'self' 'sha256-Usukg76vL5Gu+JojW0v41+PSgA8MbzL2vYCkqNNOhwk=' 'sha256-vP6A0hNgndgbAg0wMKLOdvejKQ4cDUEOtLYM1zYhnwk=' 'sha256-cJ6/ZKeyA7XImd5pXu/LXhke/j16qqyKKDC867/KRnk='". Note that 'script-src-elem' was not explicitly set, so 'script-src' is used as a fallback. The policy is report-only, so the violation has been logged but no further action has been taken.
:8789/favicon.ico:1  Failed to load resource: the server responded with a status of 404 ()

```

I see that in the console log

```
{
    "1c-builder:business:id": "biz_51a6746495c8057e886ff98d4208e6b9",
    "1c-builder:site:split:site:split": "{\"splitPct\":40.158527876280544,\"collapsedSide\":null,\"mode\":\"split\"}",
    "1c-builder:site:plan-fold:plan-seen:site_62d3d0097bbc7b6e86bdcdb3728389a3": "[]",
    "1c-builder:site:opened-views:site_62d3d0097bbc7b6e86bdcdb3728389a3": "[\"input\",\"view\"]",
    "1c-builder:site:panel:site": "site_62d3d0097bbc7b6e86bdcdb3728389a3"
}

```

<!-- xgd-turn id="500eef24-976a-441e-9265-2579d5b2527c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-05T18:51:04.868830+00:00" -->
#### Claude
Checking which plan views can reach the builder with `drafted: false`.

Checking the actual plan stored for the site in your storage (`site_62d3…`); it may not be the site I examined before.

Found it: the plan for `site_62d3…` has no `milestones` at all, so `drafted` comes back false. Checking whether the site has draft pages anyway.

Updating the ticket with the cause before reporting.

I found the cause, and it isn't in the pane code. The builder is working as specified, but the site tells it there is no draft.

**What's happening:**
- **The site is the "1st Contact" business's own** (`site_62d3…`). Its plan has no `milestones` record at all, so the builder is told the site is not drafted. The site itself is at version 60 with a page on it.
- **That turns on the "before the first draft, open in Input" rule.** It's a host choice, so it isn't remembered. That's why your storage has no saved pane mode, and why the "client opened Input" report never fires.
- **The View you saw on reload is the default pane** shown for a moment before the plan arrives.
- **Why the milestone is missing:** the site was built in September. The "first draft" milestone only started being recorded on 2026-10-03, and nothing filled it in for sites that already existed.
- **My first attempt couldn't reproduce it** because I was looking at a different site, which does have the milestone.

**It isn't just this site.** The local dev store has 10 plans with no first-draft milestone. Five belong to sites that have clearly been edited (versions 60, 37, 426, 38 and 9), and they will all open on Input the same way. The version-9 one had its plan updated on 10-28, after recording started. That suggests some edits still don't record the milestone, for example direct editor changes rather than consultant build rounds. I haven't confirmed this.

I've added all of this to BUG-354. No code has changed yet. There are two ways to fix it:

1. **Fix the data.** Run a one-off migration that records the first-draft milestone for every plan whose site has been edited past its starter. This makes `drafted` true and leaves the code alone. It doesn't help if some edit path still skips the milestone.
2. **Fix the signal.** Count a site as drafted if the milestone is recorded *or* the site has been changed past its starter. This needs one extra lookup of the site's version when the plan is read, so the plan view would no longer come from the plan record alone. It covers old sites and any edit path that skips the milestone.

I'd go with **option 2**, plus a test that rebuilds your case: an edited site with no milestones should open on View. Option 1 alone leaves the same problem in place for any edit that skips the milestone. Do you want option 2, or would you rather treat it as a data fix?

<!-- xgd-turn id="be0536e3-9d39-492f-b776-f984bdbee743-user" -->

<!-- xgd-chat role="user" ts="2026-11-05T19:03:01.486958+00:00" -->
#### You
Ah - yes we should not be signalling this on the "first draft" milestone - that could change arbitrarily. Just look at the draft site...is there anything there to look at? If so show it to me. Simple as that

<!-- xgd-turn id="be0536e3-9d39-492f-b776-f984bdbee743-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-05T19:14:30.237558+00:00" -->
#### Claude
There's already a `nothingBuilt` check ("site still holds only the starter page"). I'm using that as "anything to look at". Checking where it's used.

Plan: the server decides `drafted` from the draft pages (not the milestone), reusing the existing `nothingBuilt` check. Checking which tests pin the old milestone behaviour, then I'll cut the branch.

Scoping the ticket to the new direction, then cutting the branch.

Now the code change in the worktree.

Type-check is clean. Next: the new UAT, and REQ-408's test seeds the starter page that provisioning really writes.

Both pass. Checking that the new UAT fails on the old code.

Both fail on the old code and pass on the fix. Checking other server suites that read `drafted` from the wire.

Several node tests build views with `panelView`. Running them, along with the builder tests that use `drafted`.

That REQ-408 case tests `drafted` against the milestone, which is exactly what you've overruled. I'll run the rest of the list first to see everything that depends on it.

While that runs, here's the REQ-408 node case.

Still used, so the import stays. Waiting on the per-file run.

Three other suites failed. Checking whether my change caused them.

These look unrelated. Running the same three on the unchanged `xgd-working` checkout to confirm.

I'll have `panelView` take `drafted` as an input from its caller (default `false`), so every view still carries the field. The router passes the real answer from the draft.

All green apart from the two failures that also fail on `xgd-working`. Committing.

First the commit, then a ticket-body update, then the merge recipe.

Now merging back: lock, merge `xgd-working` into the branch, bump the version, then fast-forward.

Ticket is at free_coded. Cleaning up the branch.

The builder now opens a site on View whenever there's something in the draft to look at. The "first draft" milestone no longer decides it.

**The rule now:** the only site that opens on Input is one that still holds just the grey starter page ("Your site will appear here as it's created."). That's the same check that already stops a publish of an empty site. Your 1st Contact site has a real page, so it will open on View. When a brand-new site gets its first real section, the pane switches to View.

**What changed:**
- The server reads the site's pages when it builds the plan view and sets `drafted` from them.
- The milestone is still recorded for the consultant's own use, but it no longer affects which pane opens.
- The pane code was right all along, so it's unchanged.

**One cost:** every plan request now also reads the site's pages once.

**Tests:** I added two server tests:
- a built site whose plan has no milestones reports a draft;
- a site holding only the starter page reports none, even with the milestone set.

Both fail on the old code and pass on the new. One REQ-408 test checked that the milestone set `drafted`, which is the rule you've overruled, so I removed it and noted the reason on the ticket. The REQ-408 server test now starts its new site from the real grey starter page. All the other tests that touch this pass, except two suites that already fail the same way without my change (`REQ-398_progress_banner` and `reconciliation-published-site-serving`).

**State:** the change is merged into `xgd-working` (commits `9c2e9f37`, `b6bdaf66`, version 0.2.783) and BUG-354 is at `free_coded`. Dev serves a frozen copy of the code, so you won't see this on :8789 until you run `bin/deploy --env dev`.

<!-- xgd-chat-end -->