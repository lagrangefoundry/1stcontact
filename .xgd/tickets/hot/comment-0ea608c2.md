---
uid: comment-0ea608c2
id: COMMENT-2876
type: comment
title: Comment on bug BUG-87
created_by: xgd
created_at: '2026-09-12T20:49:52.292073+00:00'
updated_at: '2026-09-12T22:10:21.711560+00:00'
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

<!-- xgd-turn id="697ac89d-9420-430e-a391-01fbbeaa8de0-user" -->

<!-- xgd-chat role="user" ts="2026-09-12T21:51:08.738876+00:00" -->
#### You
We should not be exposing technical issues to the user - this needs to be logged. - I have started an epic (EPIC-1) for logging in lagrange framework, Lets consider what, if anything it makes sense to do now, in advance of that landing so this isn't lost

<!-- xgd-turn id="697ac89d-9420-430e-a391-01fbbeaa8de0-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-12T21:52:21.417894+00:00" -->
#### Claude
Let me look at EPIC-1 and the logging that exists today.

EPIC-1 is an empty draft — Untitled, `(new ticket)`, no body. So there's nothing to align a design to yet, which actually settles the question: **do the small thing now, in the idiom that already exists, and don't invent anything EPIC-1 would have to adopt or delete.**

## The convention is already there

This isn't a gap waiting on EPIC-1. There's an established house idiom — `console.warn(JSON.stringify({ event: '<snake_name>', ...context }))` — in ~14 call sites across both workers: `admission_denied`, `scope_refused`, `invite_refused`, `person_record_refused`, `signin_rate_limited`, `email_webhook_refused`, `lead_capture_failed`. It's documented as a rule at `apps/control-app/src/identity.ts:931-934`.

More to the point, **this exact bug class already has a precedent fix in this codebase.** Read `identity.ts:918-930` — `denyAdmission` was filed from a silent refusal that locked an operator out of their own deployment "with nothing in the running system saying why." The resolution was the principle you just stated:

> Deciding and recording are now the same statement, so a reason cannot be computed without being reported.

And it pre-answers the disclosure worry: the visitor is told one thing because telling them more would be an oracle; the operator reading the invocation log is not the visitor, and the log is ours. So the 200 stays — you're right that the visitor shouldn't see the technical reason.

## What's actually being dropped

Larger than I said earlier. `LeadOutcome` (`apps/control-app/src/lead.ts:99-111`) carries three kinds of news, and `await` with no assignment discards all of them:

| Outcome | Written? | Visitor sees | Currently logged |
|---|---|---|---|
| `unknown_site` | no | success | nothing |
| `no_email` | no | success | nothing |
| `assetSkipped` | contact yes, asset no | success | nothing |

That third one is the one I'd underweighted: `already_sent` / `suppressed` / `no_address` / `not_offered` means the form *promised a download*, the visitor was told it was coming, and it never left the building. Silently.

## Recommendation

Do it now. Roughly ten lines at `apps/public-site/src/lead.ts:462` — capture the outcome instead of dropping it, and `console.warn` a structured line when `accepted === false` or `assetSkipped` is set. Nothing else changes: same 200, same `acknowledge(shape)`, no new module, no helper, no abstraction.

Three reasons not to wait:

1. **It's not a bet on EPIC-1's design.** It's consistency with 14 existing call sites. If EPIC-1 replaces the idiom, this is one more mechanical edit in a migration that has to touch all 14 anyway — and `grep -rn "JSON.stringify({ event:"` is the complete, self-maintaining inventory of what to migrate.
2. **Waiting has a running cost.** Between now and EPIC-1 landing, every mis-keyed site and every undelivered asset stays invisible.
3. **EPIC-1 can't be designed well from zero examples.** One more real call site with real fields is input to that epic, not debt against it.

What I would *not* do now: build a logger abstraction, add a log sink, change any visitor-facing response, or touch the honeypot and rate-limit paths — those are silent *by design* (an attacker who could distinguish them gets a probe), and that reasoning is written into the code at `lead.ts:400-405`.

One thing worth flagging as genuinely EPIC-1's: a Worker invocation log is not somewhere an operator looks. For a lead that vanishes, the business arguably needs it surfaced *in the app*. That's a real gap and the right place for it is the epic, not here.

Want me to scope this into BUG-87 and implement it? It's code, so it needs the ticket body written and a branch cut first.

<!-- xgd-turn id="fd336965-945e-4990-828a-b57c046726f1-user" -->

<!-- xgd-chat role="user" ts="2026-09-12T21:58:38.175613+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="fd336965-945e-4990-828a-b57c046726f1-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-12T22:10:20.866221+00:00" -->
#### Claude
Let me look at the existing test suite for this area before I decide the test approach.

I have what I need — no blocking questions. Let me record my decisions and scope the ticket.

Ticket scoped. Now cutting the branch.

Baseline is green (12 tests). Now the implementation.

Now the implementation.

Now the UAT.

All 4 pass. Let me verify they're real evidence by checking they fail without the fix.

Confirmed RED — three fail with `expected [] to have a length of 1`, exactly the silence. Restoring.

Two failures. Let me confirm they're pre-existing and not mine.

Both fail without my changes — pre-existing. Restoring and committing.

Now the lock-and-merge step.

The lock is held by another live session (BUG-89). I won't clear someone else's lock — let me wait for it.

While that waits, let me re-verify the diff.

Two things: I passed the whole ticket file including frontmatter. Fixing that first.

Body clean. The lock has been released — proceeding with lock, merge, free_coded, clean.

BUG-89 claimed 0.2.180 while I was merging. Re-bumping.

Now verifying the merged state on `xgd-working`.

Done. **BUG-87** is at `free_coded` on `xgd-working`, version `0.2.181`.

## What I built

Two reporters inside `captureLead` (`apps/control-app/src/lead.ts`), plus four touched lines at the decision points:

| event | fires on | carries |
|---|---|---|
| `lead_not_captured` | `unknown_site`, `no_email` | `reason`, `site`, `form`, and for `no_email` also `submittedFields` |
| `lead_asset_not_sent` | `already_sent`, `suppressed`, `no_address` | `reason`, `site`, `form`, `business`, `contact` |

97 lines added to `lead.ts`, most of it the comment explaining why.

## Decisions I made, since you asked me to

**Logged where it's decided, not at the call site.** This is the one choice that changes the outcome rather than the style. `captureLead` has *two* callers — `public-site` over the service binding and the builder preview in-process at `router.ts:3216` — so a line written at either call site leaves the other silent. That's precisely the failure `identity.ts:918` documents after `denyAdmission` was filed from the same shape of bug, and its rule applies: deciding and recording are the same statement. One implementation, both callers covered by construction. It also means I left `public-site/src/lead.ts:462` alone entirely — once the record exists at the source, the discarded return value is harmless, and the minimal diff is the better one.

**`not_offered` is not logged.** It's set on every submission to a form that promises nothing, i.e. most of them. Logging it would bury the three skips that mean something under a line per ordinary submission — and a log nobody can read is the state we're fixing.

**`warn`, not `error`.** A refusal is a decision this code reached deliberately. The thrown path keeps its existing `lead_capture_failed` at `error`.

**Field names, never field values.** `no_email` is almost always a form whose address field was authored without `type: 'email'`, and "which fields did this form actually send" is answered completely by the names. The values would answer it no better and would turn an operational log into a store of whatever strangers typed, expiring on Cloudflare's schedule rather than the business's. One UAT asserts the submitted values appear nowhere in the line.

**Nothing new invented.** House `console.warn(JSON.stringify({ event, … }))` idiom, no helper, no module, no dependency — so EPIC-1 inherits a 15th call site to migrate rather than an abstraction to reconcile with. The visitor-facing acknowledgement is untouched and still frozen.

## Tests

`tests/test_UAT_FC_BUG-87_lead_outcome_logged.workers.test.ts` — 4 UATs driving `worker.fetch` inside workerd against real D1/R2 with the real `captureLead` behind the binding, reusing REQ-223's `seedFormSite`/`applySchema` rather than founding a second fixture.

I checked they're real evidence: with the fix reverted, three fail with `expected [] to have a length of 1` — the silence itself. The fourth (accepted submission stays quiet) passes either way by design; it's the guard against `not_offered` noise.

- Lead scope: **25 passed** (4 new + REQ-223's 12 + BUG-78's 9), re-verified after merge.
- Full suite: **3805 passed, 2 failed** — `bug32-webui-scope-rebrand` and `test_UAT_FC_BUG-67_backend_settings`. Both fail identically with my changes stashed, so they're pre-existing and unrelated. I didn't touch them.
- `tsc --noEmit` clean for control-app.

## Two things worth knowing

**A version race.** BUG-89 — another live session — claimed `0.2.180` while I held the merge lock, so the gate rejected my first `move-to-free-coded`. I re-bumped to `0.2.181`, recommitted, re-merged, and both SHAs are on the ticket. Nothing lost, but that session is actively landing work on `xgd-working` alongside this.

**I did not clear anyone's lock.** BUG-89 held the merge lock when I first reached for it; I waited rather than forcing it.

**REQ-233** (the Contacts-pane live-refresh ticket from earlier) is still at `draft`, untouched — separate ticket, separate work, and explicitly out of scope in BUG-87's body.

`free_coded` is a resting state; promotion to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->