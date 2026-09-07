---
uid: comment-96f1d1b9
id: COMMENT-2309
type: comment
title: Comment on chat CHAT-42
created_by: xgd
created_at: '2026-09-07T21:57:13.793986+00:00'
updated_at: '2026-09-07T22:18:41.701749+00:00'
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

<!-- xgd-chat-end -->