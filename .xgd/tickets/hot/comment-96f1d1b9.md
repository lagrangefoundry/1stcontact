---
uid: comment-96f1d1b9
id: COMMENT-2309
type: comment
title: Comment on chat CHAT-42
created_by: xgd
created_at: '2026-09-07T21:57:13.793986+00:00'
updated_at: '2026-09-08T01:36:03.762089+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: chat-5acd1848
  kind: chat_transcript
---

<!-- xgd-turn id="b0b1f8bc-851e-4c26-b6c4-addcaf084ba9-user" -->

<!-- xgd-chat role="user" ts="2026-09-07T21:56:57.206743+00:00" -->
#### You
We are creating login messaged but even with the DMARC fixed they are going straight to the spam folder:
Original Message

| Message ID | <010001a07d7b7f98-d93d13ec-29b3-4284-b8e7-f92ef22ae519-000000@email.amazonses.com> |
| --- | --- |
| Created at: | Mon, Sep 7, 2026 at 1:07 PM (Delivered after 5 seconds) |
| From: | no-reply@1stcontact.io |
| To: | felix-1c-test@westhead.me |
| Subject: | Your invitation |
| SPF: | PASS with IP 104.30.8.74 Learn more |
| DKIM: | 'PASS' with domain 1stcontact.io Learn more |
| DMARC: | 'PASS' Learn more<br/><br/><br/> |

I don't want to get too deep into this, at this point, but this is a problem are there some small, short term changes we can make?

<!-- xgd-turn id="b0b1f8bc-851e-4c26-b6c4-addcaf084ba9-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-07T21:59:24.614212+00:00" -->
#### Claude
I'll look at what we're actually sending before advising.

Read `mail.ts`, `templates.ts` and the wrangler config. The authentication is fine — that's why fixing DMARC didn't move it. What's landing you in spam is the *content and identity* of the message, plus zero domain reputation.

## What the recipient actually sees

```
From:    no-reply@1stcontact.io      (no display name)
Subject: Your invitation
Body:    Hello,
         You have been invited to set up your account...
         [Accept your invitation]
         https://app.1stcontact.io/...
         If you were not expecting this, you can ignore it.
```

Unbranded sender, no display name, generic subject, no addressee, **no mention of who is inviting or to what**, a button plus a bare pasted URL, and an "if you weren't expecting this" disclaimer. That is structurally identical to credential-phishing. A filter doesn't need reputation data to be suspicious of it.

The irony is that `SEED_TEMPLATES` is *deliberately* business-neutral (templates.ts:344) so a plumber's mail doesn't say "1st Contact" — and that neutrality is exactly what makes ours anonymous.

## Ranked short-term fixes

**Free, no code, today — edit the `invite` template ticket in our own tenant.** This is authoring, not development; the type exists for exactly this.

1. **Subject**: `Your invitation` → `Martin Westhead invited you to 1st Contact`. Named human + brand is the single largest content signal.
2. **Body**: say who is inviting, what 1st Contact is, and sign it. Add a footer with the company name and a postal address. More real prose also drops the link-to-text ratio, which is currently terrible.
3. Keep the pasteable-URL fallback (it's load-bearing), but the surrounding prose should carry more weight than it does.

**Config-only, no code:**

4. **Display name on the sender.** `MAIL_FROM = "1st Contact <no-reply@1stcontact.io>"` in `wrangler.toml:208,342`. `mailFrom()` passes the string straight through and Resend accepts RFC 5322 form, so this is a two-line config change.
5. **Stop sending from `no-reply@`.** It's a documented negative signal at Gmail, and replies are a *positive* engagement signal you're currently making impossible. `hello@1stcontact.io` with Cloudflare Email Routing forwarding to you costs nothing.

**Small code change — the biggest technical win:**

6. **Send a `text` alternative alongside `html`.** `mail.ts` sends `html` only, and the docstring's reasoning is about not wanting a second *authored* body that can drift. That reasoning survives if the sender **derives** the text part mechanically from the HTML (strip tags, keep the URL) — one body still authored, two parts sent. HTML-only is one of the most commonly cited spam heuristics and Resend takes `text` in the same call.

**Free, but takes days not minutes:**

7. **Google Postmaster Tools** — register `1stcontact.io`. You'll get actual reputation data instead of inferring from one message.
8. **Reputation warm-up.** A brand-new domain's first few messages land in spam largely regardless. Marking "not spam" and replying on the receiving side is real signal.
9. **Check the DMARC policy is `p=quarantine`, not `p=none`** — a committed policy is itself a mild positive.

## One thing worth verifying

SPF passed on **104.30.8.74**, which is in Cloudflare's range, while the Message-ID is `@email.amazonses.com` (Resend fronts SES). That's not an SES egress IP, so the path may not be what the code implies. Worth confirming there isn't a relay hop adding a reputation-poor segment.

## If that isn't enough

`mail.ts`'s own docstring already anticipates this: *"deliverability reputation is the kind of thing that becomes a reason to move to Postmark, and when it does the change should be one adapter and no call sites."* Postmark's transactional stream has materially better shared-pool reputation than Resend's free tier. That's the real fix, and the port means it's one adapter.

---

Items 1–3 you can do right now with no ticket. Want me to file a ticket for 4–6 (display name, repliable sender, text alternative)? They're a single coherent scope, roughly 2 story points.

<!-- xgd-turn id="e1b0da43-c9b4-4307-8478-34d22598718d-user" -->

<!-- xgd-chat role="user" ts="2026-09-07T22:18:41.492759+00:00" -->
#### You
We are using Resend - check the chats and recent ticklets - I configured our DNS to report amazonses per your instructions.

Can you create an REQ to make the changes that you propose?

Lets use invite@1stcontact

Is there an API to google postmaster?

<!-- xgd-turn id="e1b0da43-c9b4-4307-8478-34d22598718d-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-07T22:21:37.794678+00:00" -->
#### Claude
Confirmed from TODO-5 and COMMENT-2300 — Resend fronts SES, so the `@email.amazonses.com` Message-ID is expected. Dropping that thread. Also relevant: TODO-5 had you publish DMARC at **`p=none`**, which is still where it is.

One thing your `invite@` choice runs into, which I need to flag before writing the ticket:

`MAIL_FROM` is a single deployment-wide address (`wrangler.toml:208,342`) used by **all three** templates. Setting it to `invite@` would send sign-in links from `invite@1stcontact.io`, which is its own small trust ding. So the ticket makes the address per-template, with `MAIL_FROM` as the fallback — which is what `mail.ts:47` already anticipated ("the day a second address is wanted... the choice belongs to the caller that knows which message this is").

Created **REQ-205** (`request-33c49c03`), status `draft`, 3 points. The ticket push failed on the sandbox proxy — it's local only, so it'll need a push from outside.

**What's in it as code:**
1. **Derived plain-text part.** `mail.ts` sends `html` only, and `Message.body` defends that on *authoring* grounds ("a second body that can disagree with the first"). That reasoning survives if the text is derived rather than authored — one body written, two parts sent, and they can't disagree because one is a function of the other. The invariant to test against: every `href` URL in the HTML appears verbatim in the text. A text part that lost the link is worse than none.
2. **Per-template `from`**, optional, falling back to `MAIL_FROM` — so `invite@1stcontact.io` doesn't also become the sign-in sender. The modal's `from` stays display-only.
3. **Display name** on the From.

Explicit non-goals, with reasons: `List-Unsubscribe` (incoherent on a sign-in link) and moving to Postmark (still the fallback, not a first move).

The operator work is recorded in the ticket rather than left implied — chiefly that **`invite@1stcontact.io` has to actually receive mail**. TODO-5 §6 left inbound as an open decision; sending from a repliable address forces it, because a repliable address that bounces is worse than `no-reply@`.

## Google Postmaster — yes, but it won't help you yet

The API is real: **Gmail Postmaster Tools API v1**, `gmailpostmastertools.googleapis.com`, OAuth scope `postmaster.readonly`. Four methods (`domains.list/get`, `domains.trafficStats.list/get`) returning daily stats: `domainReputation`, `userReportedSpamRatio`, `spf/dkim/dmarcSuccessRatio`, `deliveryErrors`, `spammyFeedbackLoops`.

Three reasons not to build against it now:

- **Volume floor.** Google only populates stats above a threshold — commonly reported as sustained 100+ messages/day *to Gmail*. Below it, `trafficStats` comes back empty. Your Resend free tier caps at **100/day total** (TODO-5), so you cannot reach the threshold without changing plan.
- **Gmail only.** Outlook's equivalent is SNDS, which is keyed on sending IP — and on Resend's shared pool you don't own the IPs, so it isn't available to you either.
- **The web UI is the whole job right now.** Verify the domain, let data collect. Nothing to integrate.

**What does work at your volume:** the DMARC `rua=` aggregate reports TODO-5 had you publish. Those arrive regardless of volume and cover every reporting receiver, not just Gmail. Worth checking where that address currently points and whether anything is parsing them.

One limit worth being clear about: **nothing except Postmaster Tools reports spam-folder placement.** Resend's webhook (REQ-198) gives you delivered/bounced/complained, and `delivered` is exactly what the message in your screenshot got. Until volume justifies Postmaster, the only real placement signal is what you just did by hand — send to a live Gmail and an Outlook account and look.

Want me to cut the branch and implement REQ-205?

<!-- xgd-turn id="05385811-8a0b-4232-bb19-8df5425dcd42-user" -->

<!-- xgd-chat role="user" ts="2026-09-08T01:36:02.827306+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-chat-end -->