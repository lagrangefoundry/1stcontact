---
uid: request-8f459c68
id: REQ-264
type: request
title: 'The deploy verifies credentials exist, not that they work: capability probes
  and a capability report'
created_by: EPIC-5
created_at: '2026-09-16T23:57:42.205741+00:00'
updated_at: '2026-09-16T23:57:42.205741+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  story_points: 5
  epic_parent: epic-c5175c8f
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-7e515561
---

## What this is

**The deploy verifies that a credential is present. It never verifies that the
credential works.** Every hook under `bin/deploy.d/secrets/` decides between
push, keep and fail on one question — *is there a value* — and a key with the
wrong scope, the wrong account or an expired lifetime passes all three outcomes
and ships.

The operator's statement of it: *"I would prefer a deploy that checks that we
have the right keys that are up to date with the right permissions. Silently
degrading functionality on a broken deploy is not good."*

## How it was found

Attaching a domain through the `Your domain` section failed with:

```
✗ Resend refused GET /domains (401). This API key is restricted to only send emails
```

`RESEND_API_KEY` was a **Sending access** key. Resend scopes keys to *sending* or
*full access* and domain management needs the second — which `resend.ts:43` already
knows and states:

> *a deployment that could send but not manage domains would offer the toggle and
> refuse it, which is worse than not offering it*

**The hazard is documented, and nothing detects it.** `20-resend-api-key` checked
that the key existed, found that it did, and passed. The condition the docstring
names as *worse than not offering it* is exactly the condition that shipped.

## Presence is not capability, and the gap is uniform

Every credential this product holds has a permission dimension the hooks cannot
see:

| Credential | Present-but-wrong looks like |
| --- | --- |
| `RESEND_API_KEY` | sending-access key: mail sends, domain management 401s |
| `CLOUDFLARE_DNS_TOKEN` | a Workers-AI-scoped token: zone reads 401, or reads pass and `Zone:DNS:Edit` is absent so the first write fails |
| `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` | a token without Workers AI: the embedder selects REST and every embed 401s |
| `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` | revoked, out of credit, or scoped to the wrong org |

**And the failure is always late and always somewhere else.** The customer clicking
a button is the integration test. That is the actual defect; Resend is one instance.

## What to build

**A capability probe per credential**, run by the hook that already owns that
secret, against the *permission the product actually needs*:

- **Read-only and non-mutating.** A deploy must not create a DNS record to prove it
  can. Where a capability cannot be proven without writing, prove the nearest read
  and say in the report that edit is inferred rather than verified.
- **The probe is the call the product makes.** `GET /domains` for Resend is the
  exact call that failed here, which is what makes it the right probe — a
  synthetic health check that exercises a different permission proves the wrong
  thing.
- **Cheap.** One request per credential, on a deploy, is not a budget.

Known-good probes, verified by hand while scoping this:

| Credential | Probe | Proves |
| --- | --- | --- |
| Resend | `GET /domains` | full access vs sending-only |
| Cloudflare zone token | `GET /user/tokens/verify`, then `GET /zones` | active, not expired, sees the zones |
| Cloudflare AI pair | `POST /accounts/<id>/ai/run/@cf/baai/bge-small-en-v1.5` | Workers AI reachable, and the vector is 384-dim |

### Expiry, which is the *"up to date"* half

`GET /user/tokens/verify` returns `expires_on` and `not_before`. **A Cloudflare
token inside its expiry window is a deploy that will start failing on a date
nobody wrote down**, so a probe that reports active is not enough — it reports the
date, and warns inside a threshold.

**This is honestly partial and should be recorded as such**: Resend keys do not
expire, and neither Anthropic nor OpenAI exposes an expiry over the API. So
*"up to date"* is answerable for Cloudflare and unanswerable for the rest, and the
report must not imply otherwise by leaving the column blank.

### Degrading is allowed. Degrading *silently* is not.

This does not overturn [[REQ-259]]'s ruling that a missing Resend key is ordinary —
the domain still attaches, the website still serves, the toggle reports `off`. That
stays. **What changes is that the deploy says so, every time, in one place:**

- a **capability report** at the end of the deploy — every credential, what it can
  do, what it cannot, and what is consequently off in the shipped product;
- **fail** where the missing capability breaks a surface that ships anyway — the
  condition [[REQ-259]] applied to `40-cloudflare-dns-token`;
- **warn, loudly and in the report** where the product genuinely degrades.

The distinction [[REQ-259]] drew — *"a missing sending credential costs a feature;
a missing zone credential costs the section"* — is the right axis and is kept. What
was missing is that a **wrongly-scoped** credential lands in neither column today:
it costs a feature *and* reports nothing.

## The runtime half, without which the deploy report is only half true

A deploy probe fixes the deploy. It does not fix a key rotated to a narrower scope
afterwards, which is the same failure arriving later.

- **A 401 or 403 from Resend on the domain path means *this deployment cannot
  configure sending*, not *this request failed*.** It should reach the customer as
  the toggle being unavailable — the same shape as an absent key — rather than as
  Resend's English in a red box. That is `resend.ts:43`'s stated intent, applied.
- **The customer-facing string must not be the provider's.** *"This API key is
  restricted to only send emails"* is a sentence about our configuration shown to
  somebody who has no configuration. It fails this epic's standing rule that a
  customer surface never shows our machinery.

## A bug found while scoping this, and it is why the message was misleading

`resend.ts:258` — `createDomain` treats **any** 4xx as *"Resend already holds this
domain"* and falls into the idempotency path:

```ts
if (!(err instanceof ResendApiError) || err.status < 400 || err.status >= 500) throw err
const held = await call(key, fetchImpl, 'GET', '/domains')
```

So a `POST /domains` 401 entered the fallback, the fallback's `GET /domains` failed
with the same 401, and **that second error is what surfaced — the original was
discarded.** An authentication failure arrived dressed as a listing failure, on a
verb the operator had not invoked, which is why it read as unrelated to the button
they pressed.

Two things wrong and both should be fixed: the fallback should be entered only on
the statuses that actually mean *already exists*, and where the fallback itself
fails, the **original** error is the one to report.

## Not in scope

- **Rotating or re-issuing any credential.** This reports; the operator acts.
- **A probe that mutates anything** — no test record, no test send, no test domain.
- **Monitoring credentials between deploys** → [[EPIC-7]]'s territory if it is
  wanted at all; this ticket is the deploy gate and the runtime refusal.

## Falsifiers

- A hook that reports success on a credential it has only checked the presence of.
- A probe that writes, sends, or creates anything.
- A probe that exercises a permission the product does not use.
- A deploy that ships a surface whose credential cannot perform the surface's own
  operations, without failing.
- A capability that is off in the shipped product and named nowhere in the deploy
  output.
- An expiry column that reads as verified for a provider that exposes no expiry.
- A provider's error text reaching a customer.
- A Resend 401 or 403 on the domain path reaching the customer as anything other
  than *sending is unavailable*.
- `createDomain` entering its idempotency fallback on a status that does not mean
  *already exists*, or reporting the fallback's error rather than the original.

## A note on where this is parented

**Its subject is broader than this epic.** It touches Anthropic, OpenAI and the
embedder pair as much as the two DNS credentials, and deploy hooks are not DNS
management. It is parented here because [[REQ-259]] already moved
`40-cloudflare-dns-token` from `warn` to `fail` and this is the same argument
continued, and because the failure that prompted it was on this epic's surface.
Re-parent freely.