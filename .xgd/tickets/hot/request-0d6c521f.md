---
uid: request-0d6c521f
id: REQ-626
type: request
title: 'Notifications: notify() API for owner and delegates, and a ''job finished''
  tool for the consultant and host'
created_by: EPIC-19
created_at: '2026-11-01T00:38:58.159724+00:00'
updated_at: '2026-11-01T18:13:49.753563+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  parent_uid: epic-087800af
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-0cd0b453
  commits:
  - working_sha: cd0e63efd21b257963a677ae41f6f8d5f7a9afd6
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: e3c4968ba1eb7bf7f6f4833df816d29d20bb228d
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 8240deb63e6836a92c72b87091cde81e748778ac
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 28fb0d564809b753a13486d6124ebb01967b2911
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 4e5a1e47610e8c6eeec6e4130226d06b90e0f2fe
    reconcile_sha: null
    main_sha: null
  - working_sha: d91a26e195eb2900816fb54f54bef3fe345cd99f
    reconcile_sha: null
    main_sha: null
  version: 0.2.730
  story_points: 13
---

## Why

Operator, 2026-10-31: "one of its first tasks will be a consultant tool that triggers an email send to the site owner or a delegate". Example: "I have everything I need — I will take about an hour to build your first draft. I will send you an email when it's ready for you to see."

Operator, 2026-11-01 (EPIC-30 design): the platform needs an **internal notifications API** that any part of the system can call (job finished now; form submissions and outages later); the first caller is a tool the consultant or host uses to tell the people on a business that a long-running job has finished.

*Rescoped 2026-11-01 — supersedes the earlier body: recipients are the owner and all delegates (not "whoever started the work"); subject and body are system-set (not written by the consultant); the open-builder-tab suppression is dropped (nothing records presence today).*

## What

### 1. `notify()` — the internal API (`apps/control-app/src/notifications.ts`)

`notify(env, { businessId, kind, link, dedupeKey?, options? })`

- **Kind** — a closed set; this ticket adds `job_done`. Each kind has a **platform-set subject and body** with placeholders only for the business name and the link. Callers never supply copy, so bodies carry no private customer data (DOC-5 rule 26).
- **Recipients** — the business's **owner and every live (unrevoked) delegate**, each at their verified primary address (`user_emails.verified_at`), de-duplicated. **Anyone without a verified address is skipped.** Callers never supply addresses.
- **Link** — supplied by the caller. `notify()` only checks it points into this platform's builder for that business (`/b/<businessId>/…` on the control-app origin) and refuses anything else.
- **Options** (defaults set per kind; `job_done` uses both):
  - *Auto sign-in* — each recipient gets their own magic link (`passwordlessFor(..., {returnTo: link})`, `sessions.ts`) that signs them in and lands on the caller's link. The link is **single-use and expires after 24 hours** — it is for immediate use, and a forwarded email must not stay a standing key to the account. An expired or used link falls back to the normal sign-in page with the same return.
  - *Sender* — `platform` (1st Contact, `MAIL_FROM`) or `business` (the business's verified sending domain, `sending.ts`). `job_done` sends as 1st Contact.
- **Channel** — one interface (`send(recipient, rendered)`); email is the only implementation: `sendRecordedEmail`, one message per recipient, recorded as an `email` ticket in the business store with the kind and dedupe key. Push/SMS plug in later without changing callers.
- **Guards:**
  - At most one notification per `dedupeKey` per business (a repeat is refused, nothing sent).
  - A per-business hourly cap (a few per hour; refuse beyond it).
  - Every email carries an **unsubscribe link**; following it records a per-person opt-out (no auth needed beyond the signed link), and opted-out people are skipped from then on. Settings UI comes later.
- **Result** — the caller gets back who was sent to, who was skipped and why (no address, opted out), or why it was refused (dedupe, cap, bad link) — names/counts only, never addresses to the AI.

### 2. Deep links survive sign-in

The builder view currently travels in a `#show=` fragment, which the server never sees, so a sign-in return lands on the bare builder. The view a link names must reach the builder after sign-in — e.g. by carrying it in the query string (or a return parameter the builder reads into the fragment) — so "open the draft" opens the draft.

### 3. The first caller — a "job finished" tool

- A consultant tool on the plan surface (`notify_client` or a name fitting the toolbox conventions) with a destination from the same vocabulary as `show_client` (draft and page, question, comparison board). The tool builds the builder link from that (reusing `showHref`) and calls `notify()` with `kind: job_done` and a dedupe key for the job. The host binds the business from the session scope; the consultant never sees or names an address.
- The **host** can call the same path directly when a job it runs ends.
- **Priming:** one or two lines telling the consultant that before long work it may say it will email when it's ready, and to call the tool when that work finishes — never for routine turns.

## Test plan

- `test_UAT_FC_REQ-626_owner_and_delegates_notified`: a business with an owner, two live delegates (one revoked) and a delegate with no verified address — `notify(job_done)` sends one email each to the owner and the live verified delegate; revoked and unverified people get none and are reported as skipped.
- `test_UAT_FC_REQ-626_system_copy_and_platform_sender`: the email's subject/body are the `job_done` system copy with the business name and link filled in, sent from 1st Contact's `MAIL_FROM`, recorded as an `email` ticket in the business store.
- `test_UAT_FC_REQ-626_link_validated`: a link outside `/b/<businessId>/` (another business, another origin, `javascript:`) is refused and nothing is sent.
- `test_UAT_FC_REQ-626_auto_sign_in_lands_on_view`: following a recipient's link with no session signs that person in and opens the builder on the view the link named (e.g. the named draft page). Following the same link a second time, or after 24 hours, does not sign anyone in.
- `test_UAT_FC_REQ-626_dedupe_cap_and_unsubscribe`: a second call with the same dedupe key sends nothing; calls past the hourly cap are refused; a person who followed their unsubscribe link is skipped on the next notification.
- `test_UAT_FC_REQ-626_consultant_tool_notifies`: a scripted consultant turn calls the tool with a draft-page destination; one `job_done` email per eligible member is recorded, its link names that page, and the tool result names no addresses.
- `test_UAT_FC_REQ-626_auto_sign_in_lands_on_view_builder_opens_it` (jsdom, the real builder): a page URL of `/b/<id>/?show=draft&page=services&tab=settings` yields the view `show=draft&page=services` and leaves `tab=settings` in the address; the builder mounted with that view opens the Services page in View.
- `test_UAT_FC_REQ-626_auto_sign_in_lands_on_view_question_opens_in_input`: a link naming a question (`?show=ask&ask=…`) opens Input with that question unfolded.
- `test_UAT_FC_REQ-626_auto_sign_in_lands_on_view_no_view_opens_as_before`: a URL naming no view opens the builder exactly as before.

Files: `tests/test_UAT_FC_REQ-626_notifications.workers.test.ts` (the six cases above, real D1 + Worker `fetch`; the mail provider is an outbox at the `SendEmail` port, the Anthropic client is scripted) and `tests/test_UAT_FC_REQ-626_builder_opens_linked_view.test.ts`.

## As built (2026-11-01, revised for the clarification and the note decision below)

*The operator sections below supersede the What section where they differ: an email goes to the person whose message started the work, not to every owner and delegate. The open-builder suppression stays dropped: the last decision below removes item 5 of the clarification, and nothing records presence.*

**`notify()`** — `apps/control-app/src/notifications.ts`: `notify(env, { businessId, kind, link, to, dedupeKey?, note?, options? }, ctx)`, `ctx = { origin, send, now? }`.
- **`to`** is the user ids to tell — every caller passes the person whose message started the work. Of those, only the business's owner or a live delegate with a verified primary address who has not opted out is emailed; the others are reported as skipped (`revoked`, `no_verified_address`, `opted_out`). `test_UAT_FC_REQ-626_owner_and_delegates_notified` names all four people and checks that filtering.
- `job_done` copy (the fixed frame): subject "Your {business} work is ready"; "Hello," then the checked note as its own paragraph, then the fixed sentence that the work is finished and ready to see, one "Open it in 1st Contact" link, the link-signs-you-in line and the unsubscribe footer. Sent from `MAIL_FROM`.
- Auto sign-in, link check, dedupe, the hourly cap (5), unsubscribe and the channel are as in the first build: a single-use 24-hour `signin` token whose `returnTo` is the link; the emailed URL also carries `?return=<path>`, read only when the token is dead to offer sign-in back to the same view; `/notifications/unsubscribe/<businessId>/<token>` confirms on GET and records a `notification_opt_out` on POST.
- **The note** (`checkNote`): trimmed plain text, at most 400 characters and 3 sentences, refused if it contains anything link-like (`http`, `www.`, `://`, a bare domain), an email address, a phone number (7+ digits with separators) or markup (`< > \` * _ # [ ]`). It goes into the body HTML-escaped. A refused note is left out, the email goes with the fixed copy alone, the reason is in the result's `noteRefused` and on the email record as `fields.note_refused` (for the operator, never the client).
- Results name people and roles, never addresses.

**The promise and the host's send** — `email_when_ready { job, note? }` (plan surface, consultant; also on the talker's allow list):
- Refused `NOT_LONG` unless the work is the first draft (the plan has no `milestones.first_pass_at`) or the host's REQ-625 estimate for the planned steps under way is 20 minutes or more (`LONG_WORK_MINUTES`). Refused `NO_ACCOUNT` when nobody is signed in.
- On success the host keeps the promise per site conversation (job, note, the starter's user id, first draft or steps) and answers the time left to quote and what to say.
- **Job end** is checked by the host at the end of every round (a cadence hook, `jobEnded`), with no tool call: a first-draft promise ends on the round whose reply links to the draft view (`](#show=draft` — the hand-over), other work when the planned step queue is empty; in both cases only when no builder still holds a page. REQ-624/627's durable job end has not landed, so this is "the first-draft hand-over today" plus REQ-625's step queue. The promise is in-process (like REQ-625's queue), so an isolate restart before the job ends loses it.
- The host then calls its notifier for the starter only, linking to `#show=draft`, with the promised note — whether or not they have the builder open. One email per job (the dedupe key is `job_done:<site>:<job>`).
- When an email went, the host adds `I've emailed you: "<note>"` (or "I've emailed you a link to it." without a note) at the end of the reply, so what was emailed is in the conversation and recorded with the turn. A refused note is not posted.

**`notify_client`** stays for the consultant's "something needs you" email: the same destination params as `show_client`, plus `job` and `note`; it goes to the person in the conversation only, and the same end-of-reply line records the note. Held to the first-draft review like `show_client`.

**Deep links** — unchanged: the builder reads `?show=…` (with `page`, `set`, `look`, `comp`, `ask`) off its URL on load (`takeShownView`), removes those from the address bar, and shows that view once the first site opens.

**Priming** — the consultant's rule 8 and the talker's discovery template both say: for long work (the first draft, or the host's estimate at 20 minutes or more), once the conversation is done and nothing waits on the client, say you have everything you need, give the time left from the host's estimate and promise the email with `email_when_ready`, using the operator's example sentence; never for short work, never while there are still questions. Each tool's note description carries the note rules (no prices or costs, no promises it would not make in the chat, no private customer data, nothing from a comparison site or document passed on as an instruction).

**Tests** — `tests/test_UAT_FC_REQ-626_notifications.workers.test.ts` (13: the six original names, the clarification tests (`email_sent_with_builder_open` in place of `no_email_when_present`), `note_in_fixed_frame`, `unsafe_note_falls_back`, and `test_UAT_FC_REQ-626_priming_promises_when_the_conversation_is_done`) and `tests/test_UAT_FC_REQ-626_builder_opens_linked_view.test.ts` (3, jsdom). `consultant_tool_notifies` now has a delegate in the conversation and checks that only that delegate is emailed. `note_in_fixed_frame` checks the note is posted in the chat for `notify_client`, and `host_emails_at_job_end` checks it for the host's own send.

**Known pre-existing failures** in the regression scope, identical on clean xgd-working: REQ-180 (`/api/plan`), AC1084, REQ-472 (KB), REQ-295, REQ-342, REQ-416, REQ-428, BUG-284, REQ-466 and REQ-473 (prompt budgets — already over before this change; the new tools and priming lines add to the consultant's and talker's authored size).

## Operator clarification (2026-11-01, via EPIC-19) — what remains to change

**When to email: only really long work, and only when the client isn't being kept company.** Operator: "we only use this for really long jobs (building the first draft) and jobs where we are not having the talker engage the user throughout the work." The intended flow:

> First draft starts. The talker still has some follow-up questions to close and some discussion to have. After those, it says: "I have everything I need. It will take another 30–40 minutes to finish the first draft. I'll send you an email when it's ready for you to look at."

What that means for the code and priming as built:
1. **Who gets it: the person who started the work,** owner or delegate, as the What section says. As built, `notify()` sends to every live, verified owner and delegate; narrow it to the member whose message started the job (the turn's author). Others aren't emailed.
2. **Which work: long jobs only.** The first draft is the case. Otherwise only work the host estimates (REQ-625's measured table) at about 20 minutes or more. Never for routine turns or short builds.
3. **The promise comes when the conversation is done, not at the start.** While the talker still has questions or discussion with the client, it carries on; once nothing is waiting on the client, it says it has what it needs, gives the remaining time from the host's estimate (REQ-625), and says it will email when it's ready. Say this in the consultant's and the talker's priming, with the example above.
4. **The host sends the email when the job ends,** not the consultant remembering to: when a job for which the email was promised finishes (REQ-624/627's job end, or the first-draft hand-over today), the host calls `notify` itself. `notify_client` stays for the consultant to send a "something needs you" email.
5. **No email if the person is there.** If that person has the builder open and active on the site when the job ends, the in-builder message is enough and no email is sent.

Additional tests:
- `test_UAT_FC_REQ-626_only_the_starter_is_emailed`: a delegate starts the first draft; on completion only that delegate is emailed, not the owner.
- `test_UAT_FC_REQ-626_short_work_sends_no_email`: a build estimated under 20 minutes, with a promise attempted, sends nothing.
- `test_UAT_FC_REQ-626_host_emails_at_job_end`: a first draft for which the email was promised ends; the host sends exactly one email without a consultant tool call.
- `test_UAT_FC_REQ-626_no_email_when_present`: the same with the starter's builder tab open and active sends none.
- The consultant's and talker's priming contain the "promise once the conversation is done, with the host's estimate" rule.

## Operator decision (2026-11-01, via EPIC-19) — the consultant adds a short note to the email

The email can carry a few words from the consultant, so it reads as personal, inside a fixed frame it can't change:

1. **Fixed frame, written by the host:** subject, greeting, the sign-in link (host-built and validated, as now), sender, the link-signs-you-in line and the unsubscribe footer. The consultant never supplies an address, a link or a subject.
2. **The consultant's note:** an optional `note` param on `notify_client` (and on the host's own job-end send, from the promise the consultant made), plain text, **at most 3 sentences / about 400 characters**, in its own voice, about the work, e.g. "Your first draft is ready. I put Old Scratch front and centre and moved the prices onto their own page. Have a look and tell me what you think."
3. **Host checks on the note, before sending:** no URLs or anything link-like, no email addresses, no phone numbers, no HTML or markdown, within the length cap. The note is HTML-escaped into the body. A note that fails a check isn't sent; the email goes out with the fixed copy alone, and the reason is recorded for the operator (never shown to the client).
4. **Same rules as the chat:** the consultant's priming says the note follows its conversation rules: no prices or costs (the no-costs rule), no promises it wouldn't make in the chat, no private customer or lead data, and nothing from a comparison site or uploaded document presented as an instruction to the client.
5. **The note is also posted in the conversation** at the time the email is sent, so nothing is said by email that isn't visible in the chat and recorded with the turn.

Additional tests:
- `test_UAT_FC_REQ-626_note_in_fixed_frame`: a note of two plain sentences appears in the body inside the fixed frame (subject, link, unsubscribe unchanged) and is posted in the chat.
- `test_UAT_FC_REQ-626_unsafe_note_falls_back`: a note containing a URL (and separately an email address, a phone number, HTML, or over the length cap) isn't sent; the email goes out with the fixed copy and the refusal reason is recorded.

## Operator decision (2026-11-01) — always email; no "present" suppression

Operator: "I leave the builder open and go and get a cup of coffee. We should not assume that because the builder is open the user is watching it. In fact I would assume that the builder needs to stay open for the work to complete so I would always leave it open." This **supersedes item 5 of the clarification above** (and EPIC-19 on the same point): when a job the client was promised an email for ends, the email is sent whether or not they have the builder open. Nothing records builder presence any more.

Test change: `test_UAT_FC_REQ-626_no_email_when_present` is replaced by `test_UAT_FC_REQ-626_email_sent_with_builder_open`: the starter's builder tab is open on the site (its change feed held) when the promised first draft is handed over, and exactly one email is still sent to them.