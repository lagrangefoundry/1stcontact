---
uid: request-8f459c68
id: REQ-264
type: request
title: 'The deploy verifies credentials exist, not that they work: capability probes
  and a capability report'
created_by: EPIC-5
created_at: '2026-09-16T23:57:42.205741+00:00'
updated_at: '2026-09-20T18:41:14.900872+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  story_points: 5
  epic_parent: epic-c5175c8f
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-7e515561
  commits:
  - working_sha: 35a4023b50e4d56c4c432c034fa6aabb433bea83
    reconcile_sha: null
    main_sha: null
  - working_sha: 71811ba8948d3dfde3136dbef1dde9daffaf01ce
    reconcile_sha: null
    main_sha: null
  version: 0.2.229
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
---

## What was built

### The probe library — one file that knows the providers

`bin/deploy.d/lib/probe.mjs` holds every probe and is the only file that knows a
provider's API. Plain JavaScript, no transform and no dependency, for
`tools/generate/bin/smoke.mjs`'s reason: it runs from a shell before a deploy, at
the moment the toolchain is least likely to be warm. Every probe is a pure
function of a `fetch`, so the UATs drive them with a double and no suite ever
holds a real key.

`bin/deploy.d/lib/secret.sh` is the shell mechanism the hooks share —
`secret_in_store`, `capability_probe`, `capability_record`. **Four hooks carried
four byte-identical copies of `probe_store`** and this ticket was about to give
each of them a second copied block; the mechanism is shared now and only the
decision table stays in the hook, because that table is the per-credential claim
about what an absence costs.

### Four verdicts, and each hook decides what they cost

| Probe says | Means |
|---|---|
| **capable** | it can do the thing the product needs |
| **insufficient** | the credential is live but lacks that permission |
| **invalid** | the provider does not recognise it at all |
| **unproven** | nobody answered |

`unproven` never fails a deploy: a lost network is not a broken key, and the
presence guard is still the gate. Everything else is per-hook, and deliberately
asymmetric:

| Hook | insufficient | invalid |
|---|---|---|
| `20-resend-api-key` | **warn**, loudly — the key still sends, and the runtime half below makes the deployment degrade exactly as one with no key does | **fail** — the Worker would select the Resend sender and error on every message, which is worse than the absent case this hook forgives |
| `40-cloudflare-dns-token` | **fail** | **fail** — [[REQ-259]]'s argument from the other direction: `Your domain` ships either way, so a token that cannot read the zones draws a selector it cannot spend |
| `10-anthropic-api-key` | n/a | **fail** — a control app that cannot take a turn is a broken deploy that looks fine |
| `30-openai-api-key` | n/a | **fail** — absent stays ordinary and drops the tool cleanly; a dead key offers the tool and fails every call |

### What a probe cannot do, and the report says so

**A secret that lives only in Cloudflare's store cannot be read back** —
`wrangler secret list` answers with names. So a credential the operator did not
supply this run is recorded `stored`, which prints as **unverified** and never as
*ok*, with its effect recorded as *unknown — nothing was probed, so nothing is
claimed either way*. The probe therefore runs on a rotation and on a first push,
which is exactly when the value is new.

Probes are reads, so they run on a rehearsal too — `bin/deploy --dry-run` is now
a way to check the credentials before committing to a deploy, and it reaches the
same verdict by the same route including the refusal.

### The capability report

`bin/deploy` creates the row file, exports `DEPLOY_CAPABILITY_REPORT` to every
hook, and prints every row together under `==> Capabilities` after the upload and
before the deployed list. **The driver still knows no secret's name**, which is
what the hook directory exists to preserve.

Every hook writes a row in every outcome — push, keep, absent, unreadable,
degraded — because a report with a hole in it is a report whose holes are
indistinguishable from passes. Each row carries what the credential can do, what
it cannot, its expiry and what is consequently off in the shipped product, in a
sentence rather than a column.

`CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` **has a probe and deliberately
no hook**: production selects the Worker's own `AI` binding ([[BUG-73]]), so the
pair is the operator's build credential for `1c kb build` rather than something
this deploy pushes. There is no secret here to guard, and the probe exists for
the caller that has one. Its vector width is checked as well as its status,
because a model answering at another width produces an index whose vectors are
not comparable with the Worker's — and that failure is not an error, it is
plausible-looking nonsense.

### The runtime half

- **`ResendNotPermittedError`**, a subclass of `ResendApiError` thrown by the one
  `call` on 401 or 403. Its message is ours; the provider's sentence is kept on
  `detail` for the log an operator reads and never becomes the message.
- **`ResendClient.canManageDomains()`** — the same `GET /domains` the attach
  makes, answered before the section draws rather than discovered when somebody
  presses the toggle. It never throws: an unreachable provider is not a
  credential that lacks a permission, so anything other than a refusal answers
  `true`.
- **`DomainState.emailAvailable`** — false for a deployment with no credential
  *and* for one whose key is refused, because those are one state to a customer.
  Asked once, for the account holder only; a member sees a disabled control
  either way.
- **The builder does not draw the toggle when it is false**, on either state that
  draws one, and says nothing about the absence — a sentence explaining why a
  control is missing would put our configuration on a customer's screen. The
  attach then asks for no email, so the request matches what was offered.
- **The attach still gives the customer their website.** A refused sending
  credential reports `email: 'off'` and writes no mail row; refusing the whole
  attach would take away the thing they asked for to punish a configuration they
  have no part in.
- **Pressing the toggle is a 409 in our words** — `SendingNotConfiguredError`,
  replacing an `UnknownDomainError` that was a sentence about the domain for a
  condition that has nothing to do with it. 409 and not 502, because 502 says
  *press it again* and this will not come right.
- **Turning sending off always works**, and so does release: a key narrowed after
  the domain was registered cannot unregister it, and refusing over that would
  leave a customer sending from a domain they asked to stop sending from, with
  the records already down. The registration is left at Resend and logged.

### The `createDomain` bug

The fallback is entered only on 409 and 422 — the statuses that actually mean
*already exists* — and where the fallback itself fails, the **original** refusal
is what the caller gets. The fallback is a guess this module makes; the reason a
caller did not get a registration is the original error, not whatever went wrong
while we were checking a hunch.

### Two small things the shape forced

**`.gitignore` carried a bare `lib/`** — the Python build-output block, which
matches at any depth — so `bin/deploy.d/lib/` was invisible to git and the whole
shared mechanism would have been committed as nothing. It is exempted by name
rather than renamed around, because `lib/` is what the directory is.

**A corrupt row does not fail a deploy.** The report is append-only lines from
several hooks; a line that will not parse is a lost row and is dropped, because
a deploy that aborted over its own report's formatting would be the report
causing the outage it exists to prevent.

## One thing found while building it

`probe.mjs`'s *was I run as a command* check compared `process.argv[1]` against
`import.meta.url` as strings, which is `smoke.mjs`'s shape. **`/tmp` is a symlink
to `/private/tmp` on macOS and a worktree checkout can sit under one too**, so
the comparison answers *false* for a file that is plainly being run — and the
symptom is not an error, it is a report that prints nothing and exits 0. Both
sides are resolved through `realpath` now.

## Test plan

| File | Covers |
|---|---|
| `tests/test_UAT_FC_REQ-264_capability_probes.test.ts` | every probe against a `fetch` double: sending-only vs refused vs full access, zone scope and expiry, the model keys, the embedder pair's width, *nothing is written or sent*, the expiry line is never blank, an unprobed row reads as unverified, the report names what is off |
| `tests/test_UAT_FC_REQ-264_hooks_probe_capability.test.ts` | the shipped hooks under a stubbed `npx` and `node`: the probe runs before the push, each hook's own policy, a stored value is recorded rather than passed, every outcome writes a row, a rehearsal probes, no hook carries its own copy of the mechanism, and a whole `bin/deploy --dry-run` prints the rows its hooks wrote |
| `tests/test_UAT_FC_REQ-264_resend_client.test.ts` | the shipped client: 401/403 as a refusal in our words, the fallback's statuses, the original error surviving a failed fallback, `canManageDomains` |
| `tests/test_UAT_FC_REQ-264_sending_unavailable.workers.test.ts` | real D1 and the shipped routes: `emailAvailable: false` matching the no-key case, the attach still serving the website, the toggle refused at 409 with none of Resend's words, off and release never blocked |
| `tests/test_UAT_FC_REQ-264_the_toggle_is_not_offered.test.ts` | the shipped builder section in a real document: no toggle, no line about mail, no email asked for, and an answer that says nothing still draws it |

Regression scope: the REQ-144/149/196/257/259 deploy and domain suites, and
`reconciliation-platform-build-deploy-smoke` — whose fixture tree now copies
`bin/deploy.d/lib/` with the driver, because a tree holding the driver without
its machinery is a tree the real driver cannot run in.