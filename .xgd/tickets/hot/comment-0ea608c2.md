---
uid: comment-0ea608c2
id: COMMENT-2876
type: comment
title: Comment on bug BUG-87
created_by: xgd
created_at: '2026-09-12T20:49:52.292073+00:00'
updated_at: '2026-09-12T21:39:37.171187+00:00'
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

<!-- xgd-turn id="c0dd1e4f-3aba-486a-a997-78073555b2fb-user" -->

<!-- xgd-chat role="user" ts="2026-09-12T21:38:08.451647+00:00" -->
#### You
**The Contacts pane doesn't self-refresh.** `refresh()` (`apps/control-app/src/builder/people.js:1536`) only runs on operator actions and pane entry. A lead captured by a form while the pane is already open never appears until you reload or switch tabs. m<-- please create a req for this

**Production is not wired for this at all.** `1stcontact.io` returns 404 on `/` and 405 on `POST /api/lead` — `APEX_SITE_KEY` and `TURNSTILE_SITEKEY` are both `""` in `apps/public-site/wrangler.toml` (top-level *and* `[env.production.vars]`). The remote D1 is still at `0001_baseline` with no `accounts`/`user_emails`/`contact_events` tables and zero users. So a real beta signup on the live domain today captures nothing. <-- what does that mean - it has not been deployed to Clouodflare, is that what you mean?

`lead.ts`** throws away the outcome.** `apps/public-site/src/lead.ts:462` awaits `captureLead` but never inspects the returned `LeadOutcome` — `unknown_site` and `no_email` both return 200 with nothing written and nothing logged. Not what bit you here, but it's the failure mode that would make this genuinely invisible next time. <-- what does this mean?

<!-- xgd-turn id="c0dd1e4f-3aba-486a-a997-78073555b2fb-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-12T21:39:36.953348+00:00" -->
#### Claude
Let me check the actual deploy state before answering #2.

Now let me check the ticket tooling before creating the REQ.

There's an existing precedent for this in the codebase. Creating the REQ now.

**REQ-233** (`request-6c30c342`) — *Contacts pane shows contacts as they arrive, without a reload*, status `draft`. It scopes six behaviours (arrival, update, filter-awareness, selection survives, stable ordering, graceful degradation without `EventSource`) and points at the existing house pattern: `subscribeMaterial` in `apps/control-app/src/builder/api.js:534`, which the library tab already uses over `GET /api/material/changes?since=`. No code written — it's a scoping ticket.

Now your two questions.

## "Production is not wired" — is it not deployed?

**The workers are deployed. The content and the config aren't.** I was imprecise; here's the split:

- **Deployed:** `1stcontact-public-site` last shipped `2026-09-06T21:46:17Z`. That 405 is *our code* answering — `apps/public-site/src/index.ts:124-129` returns exactly `Method Not Allowed` with `allow: GET, HEAD`, and the live response carries that header. So the Worker is running.
- **Nothing published:** the production D1 has **zero rows in `sites`** and **zero in `site_revisions`**. No site has ever been published to production, which is why `GET /` is a 404 — there's no apex site to serve.
- **Schema behind:** production D1 is at `0001_baseline` only. No `accounts`, `user_emails`, or `contact_events` tables. Even if a lead reached `captureLead` there, `addContact` would throw on the first insert.
- **Config blank:** `APEX_SITE_KEY = ""` in both `[vars]` and `[env.production.vars]`, so `leadTarget` returns `null` and `/api/lead` doesn't exist at the apex at all — hence 405 rather than a lead handler. `TURNSTILE_SITEKEY = ""` too, so no widget gets stamped and no token is ever produced.

So: deployed code, empty database, unpublished site, unset vars. Four separate gaps, and all four have to close before a real beta signup on `1stcontact.io` captures anything. Your local dev is a different D1 entirely (`apps/control-app/.wrangler/state/…`), which is where your test actually landed.

## What the discarded `LeadOutcome` means

`captureLead` doesn't throw when it declines a submission — it *returns* the refusal as data:

```ts
const site = await businessOfSite(env, spec.siteKey)
if (!site) return { accepted: false, reason: 'unknown_site' }
...
if (email === '') return { accepted: false, reason: 'no_email', businessId: site.businessId }
```

Two ways to decline, both plain return values. On the calling side, `apps/public-site/src/lead.ts:462` does this:

```ts
await LEAD_INTAKE.captureLead({ siteKey, instanceId, fields: submitted })
```

It awaits the promise and drops the result on the floor. Nothing reads `accepted`. So the code carries on to the success acknowledgement regardless, the visitor's browser sees `response.ok`, `client.js` swaps in the success copy — and **no row was written and no log line was emitted**. The refusal exists, is correctly computed, and is then thrown away.

Concretely, that bites when the site key doesn't match a `sites` row (mis-keyed or deleted site), or when no submitted field resolves to an email — which happens if the form's email field isn't declared `type: 'email'` *and* the form definition can't be resolved, since `addressIn` then falls back to shape-matching and can come up empty.

Both are silent. Not a wrong answer to the visitor — arguably 200 is right, you don't want to leak which site keys exist — but there's no server-side record either, so you'd be debugging a form that reports success, writes nothing, and logs nothing. Note the contrast: when `captureLead` *throws*, `lead.ts:468-481` catches it, logs `lead_capture_failed`, and returns 503. The thrown path is handled well. It's only the returned-refusal path that vanishes.

That one's unticketed. Want a bug for it?

<!-- xgd-chat-end -->