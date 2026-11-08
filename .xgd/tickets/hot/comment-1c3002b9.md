---
uid: comment-1c3002b9
id: COMMENT-7935
type: comment
title: Comment on request REQ-663
created_by: xgd
created_at: '2026-11-07T20:48:00.745747+00:00'
updated_at: '2026-11-07T21:18:39.921689+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-6acdeb5a
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "e3db7e29-5219-4c5a-a723-1e2ef6a48d74",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="a53ecffc-c215-4b49-b252-5bd42fe057e1-user" -->

<!-- xgd-chat role="user" ts="2026-11-07T20:47:30.573768+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
If this bug is a dupe, please close it as wont_fix with an explanation in its body referencing the duplicate

<!-- xgd-turn id="a53ecffc-c215-4b49-b252-5bd42fe057e1-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-07T21:14:40.670721+00:00" -->
#### Claude
Reading the ticket and the code it builds on (REQ-660's message records, REQ-259's sending setup). This isn't a duplicate. Next I'll check how From is computed today before cutting the branch.

Neither REQ-661 nor REQ-662 has committed anything yet. I'm checking their worktrees for in-progress UI so the Senders list fits into it.

Now reading the message routes, the domain routes and the tests that cover them.

Plan is clear now. I'm checking which existing tests depend on the sending toggle I'm removing, then I'll write the code.

Designing now: a `senders` D1 table, a `sender` field on each message, and From resolved at send time. Reading the message record code to add the field.

Writing the migration and the `senders.ts` module.

Writing the migration and wiring it into the test factory.

Now adding the `sender` field to message records and resolving From through it.

Now updating `message-send.ts` (the context, the prepared From and reply-to).

Now `domains.ts`: attaching always turns sending on, the toggle function goes, and existing attached domains get switched on.

Removing the `/api/domain/email` toggle route from the router and adding the senders routes.

Now the routes themselves in `message-routes.ts`.

Server side typechecks. Now the builder UI: removing the toggles from `domain.js`, then a Senders section.

Now `domain.js`: the toggles come out and the mail line now points to Senders.

Writing the Senders section (`builder/senders.js`) and mounting it in Settings until REQ-661's Paperwork tab exists.

Adding CSS beside the domain rules, then the UAT file.

Now running the existing domain and message suites to see what the change breaks.

REQ-660's message suite passes untouched. Two REQ-259 failures look like real regressions rather than toggle cases, so I'm looking at those first.

Now adapting the existing tests that pin the removed toggle. Reading the REQ-264 cases first.

Existing suites are green. Now the REQ-663 UATs; first checking how REQ-660's suite drives a real send and captures the From.

Writing the REQ-663 workers UAT file.

That message was meant for the REQ-661 session, not this one. I'll send REQ-662 a short note at the end about the senders routes it will use. Running the new suite now.

All 10 pass on the first run, so I'll make sure they can actually fail: I'm temporarily breaking the per-message sender lookup.

The breakage was caught and the file is restored. Now a jsdom UAT for the Senders section itself.

Now the wider regression set: every suite REQ-660 adapted, plus Settings, sign-in and invite suites.

zsh doesn't word-split `$F`, so vitest got one long filename. Re-running with `${=F}`.

The identity suite fails on `users.email` missing from the schema, which looks pre-existing. Fixing form_reply, then baselining that suite in the main checkout.

Confirmed: the identity suite fails identically on clean xgd-working. Now the node-side regression suites and REQ-223 again.

`invite-control` fails the same way on clean xgd-working. BUG-58 passes there, so I'm linking the shared webui packages into the worktree to check it's only a location artifact.

Still failing after the link, so it might be mine (a broken builder module would stop `.shell` rendering). Checking the JS and the failure artifacts.

To separate my change from the worktree location, I'm putting the four builder files back to their base versions in the worktree for one run.

BUG-58 fails with my builder changes removed too, so it's the worktree environment. My files are restored. Re-running the suites the form_reply fix touches.

Clean. One small improvement before committing: when a form reply blocks removing a sender, the refusal should name the form, not just "Reply to a form".

xgd-working has moved to 0.2.811. Committing the work on the branch first.

Now updating the ticket body with an "As implemented" section (keeping the existing text), then merging.

Merging back: lock, merge xgd-working into the branch, bump the version on the branch, then fast-forward.

Making the edits: Senders becomes a group in the Email list, the message's Sender select lists the business's senders and is saved with the message, and the Settings mount is removed.

Removing the interim Settings mount: restoring `settings.js` to its pre-REQ-663 version, which xgd-working didn't change.

Now a UAT for the Paperwork wiring. Reading REQ-661's tab-test harness to reuse it.

Adding a Paperwork-wiring case to the section test, driving `createPaperworkPanel` directly.

34 pass, including the six REQ-663 cases. Tidying: moving the mid-file import to the top.

Committing the merge with only the conflict resolution staged; the Paperwork adaptation goes in its own commit so reconcile keeps it.

Now the full regression scope again on the merged tree, plus REQ-661's suites, typecheck and node syntax checks.

All 563 tests across 62 files pass on the merged tree. Committing the adaptation, then the version bump (checking how REQ-661 did theirs).

Rebased cleanly. Confirming the code is identical to what I tested:

The code is byte-identical. Fast-forwarding xgd-working.

Landed. Updating the ticket body for the Paperwork placement, then moving it to `free_coded`.

REQ-663 is built and merged into xgd-working (v0.2.812), and the ticket is at `free_coded` with its three commits recorded. It isn't a duplicate. The one loose end is the `free-REQ-663` branch: `xgd branch clean` refused because REQ-662 holds the merge lock right now. The branch is fully merged; run `xgd branch clean --stale` once REQ-662 has released the lock.

**What it does**
- **Senders.** A sender is the part before the @, typed by the client, at a domain chosen from the business's domains that are verified for sending. The domain can never be typed. A sender can have a display name and a reply-to. The first one becomes the default.
  - Addresses like `no-reply@` or `info@` show a spam warning but still save.
  - Every sender carries the note that replies go to that address.
  - Removing a sender a message uses is refused, naming those messages. So is removing the default while other senders exist.
- **Who an email is from.** A message uses the sender it names, else the default. A business with no sender of its own (including a site only on `<name>.1stc.site`) sends exactly as today: `invite@` for invites, `MAIL_FROM` for sign-in, and the platform address under the business name for order emails. When one of the business's senders is used, replies go to it or its reply-to.
- **Attaching a custom domain turns sending on**, with no toggle. The `/api/domain/email` route and the checkbox are removed. Until Resend verifies the domain, mail keeps the platform address. Existing domains attached with sending off are switched on the next time the account holder opens the domain section. Releasing removes only what we wrote, and an existing `_dmarc` record is left alone.
- **Where it shows.** REQ-661's Paperwork tab landed while I was working, so the Senders list is a group in its Email mode, and each message's Sender field now offers the business's senders or "Default sender". Settings has no Senders section.
- **Email assistant.** Its `list_senders` tool (item 7) is REQ-662's to wire. It can read `GET /api/senders` and set a message's sender with `PUT /api/messages/<key> {sender}`. I sent the REQ-662 session those shapes.

**Changes to check**
- I removed the `no-reply@<verified domain>` From. A verified domain on its own no longer changes who mail is from; the business has to add a sender. That's my reading of item 6.
- Fixing a regression the tests found: when one business attaches a subdomain of an apex another business already sends from, the attach now succeeds as a website and leaves mail alone. Without that fix, it was refused once sending became automatic.

**Tests**
- There are 16 new `test_UAT_FC_REQ-663_*` tests, covering every case in the ticket's test plan. I deliberately broke the per-message sender lookup to make sure they can fail.
- I adapted the REQ-259 and REQ-264 tests that pinned the toggle, and retired the four cases that only exercised it.
- The regression scope passes on the merged code: 563 tests in 62 files, plus the typecheck.
- Three failures are not from this change:
  - `reconciliation-identity-invite-provision-admission` (27 failures) and `reconciliation-identity-invite-control` (1) fail the same way on clean xgd-working.
  - `BUG-58_invite_modal_fits` fails in the branch worktree even with my builder files reverted, and passes in the main checkout.

The ticket body keeps your text and adds an "As implemented" section describing all of this.

<!-- xgd-turn id="c374846d-1398-4ad7-80b2-cdd78d189858-user" -->

<!-- xgd-chat role="user" ts="2026-11-07T21:17:38.604386+00:00" -->
#### You
Triggered by: martin-github@westhead.me

please complete the free-coding of this ticket

Blocking details:
- branch `free-REQ-663` still exists at `/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-REQ-663`
- branch HEAD: `273453ee5a2b0d8c24e51fcc96a1ca47456d5f9b`

<!-- xgd-turn id="c374846d-1398-4ad7-80b2-cdd78d189858-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-07T21:18:34.681603+00:00" -->
#### Claude
Clean and fully merged. Running the teardown.

Free-coding of REQ-663 is now complete. The last step was removing the `free-REQ-663` branch: it now runs cleanly because REQ-662 has released the merge lock, and it removed the worktree and deleted the branch.

- **Ticket:** status is `free_coded`, version 0.2.812, with three commits recorded: `bcd7417b9b…`, `f1b6795bd4…` and `273453ee5a…`. All three are on xgd-working.
- **Branch and worktree:** both are gone, and the merge lock is free.
- **Ticket body:** the "As implemented" section describes the final code, including the move of the Senders list into the Paperwork tab. Every `test_UAT_FC_REQ-663_*` test is listed there against the behaviour it covers, so there was no missing language to add.

The ticket can stay at `free_coded`; moving it to `ready_to_reconcile` is your decision.

<!-- xgd-chat-end -->