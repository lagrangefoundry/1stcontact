---
uid: comment-0ea608c2
id: COMMENT-2876
type: comment
title: Comment on bug BUG-87
created_by: xgd
created_at: '2026-09-12T20:49:52.292073+00:00'
updated_at: '2026-09-12T20:56:28.713276+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-406260eb
  kind: chat_transcript
---

<!-- xgd-turn id="33428754-6c0c-4b69-a36b-08b3e7b803c2-user" -->

<!-- xgd-chat role="user" ts="2026-09-12T20:49:30.318101+00:00" -->
#### You
I just put 1c-beta-test@westhead.me into the beta list form on first contact. I got a success metric, but I do not see the email address added as a contact?

<!-- xgd-turn id="33428754-6c0c-4b69-a36b-08b3e7b803c2-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-12T20:56:28.475335+00:00" -->
#### Claude
I'll investigate the beta list form submission path.It did land. Here's what actually happened.

**The contact exists** — in your local dev D1 (`apps/control-app/.wrangler/state/.../*.sqlite`), created at `2026-09-12T20:47:00.057Z`, two minutes before you asked:

```
usr_2d7520eca21e64711c1b1cdc97aab36f | 1c-beta-test-1@westhead.me | lead | biz_51a6746495c8057e886ff98d4208e6b9
```

with both contact events written: `contact.created` and `form.submitted` (provenance: site `site_62d3d…`, channel `draft`, page `home.json`, form `beta-form`, label "Apply to join the early beta"). So the capture path worked end to end.

Three reasons you didn't see it:

1. **The stored address is `1c-beta-test-1@westhead.me`, not `1c-beta-test@westhead.me`.** There is no suffixing logic anywhere in `lead.ts`/`people.ts` — the value is stored verbatim, so that `-1` came from what was actually submitted (browser autofill is the likely culprit). If you were scanning for the exact address you typed, it reads wrong.

2. **It's the *last* row, not the first.** `peopleOf` orders `created_at ASC` (`apps/control-app/src/people.ts:338`) and `people.js` never reverses it — so the newest contact lands at the bottom of a 7-row list, under `alice@plumbing.example` from May.

3. **The Contacts pane doesn't self-refresh.** `refresh()` (`apps/control-app/src/builder/people.js:1536`) only runs on operator actions and pane entry. A lead captured by a form while the pane is already open never appears until you reload or switch tabs.

Two things worth noting beyond your question:

- **Production is not wired for this at all.** `1stcontact.io` returns 404 on `/` and 405 on `POST /api/lead` — `APEX_SITE_KEY` and `TURNSTILE_SITEKEY` are both `""` in `apps/public-site/wrangler.toml` (top-level *and* `[env.production.vars]`). The remote D1 is still at `0001_baseline` with no `accounts`/`user_emails`/`contact_events` tables and zero users. So a real beta signup on the live domain today captures nothing.
- **`lead.ts` throws away the outcome.** `apps/public-site/src/lead.ts:462` awaits `captureLead` but never inspects the returned `LeadOutcome` — `unknown_site` and `no_email` both return 200 with nothing written and nothing logged. Not what bit you here, but it's the failure mode that would make this genuinely invisible next time.

I haven't changed anything. Which of these do you want on BUG-87 — the ordering/refresh UX, the discarded `LeadOutcome`, or the production config gap? (The last one may already be covered by BUG-84/`bug-d763b461`, which records the same 405.)

<!-- xgd-chat-end -->