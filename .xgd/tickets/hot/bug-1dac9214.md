---
uid: bug-1dac9214
id: BUG-117
type: bug
title: 'knowledge search: corpus_unreadable is a catch-all that reports a transient
  failure as a permanent deployment fault'
created_by: EPIC-19
created_at: '2026-09-18T21:46:07.949789+00:00'
updated_at: '2026-09-19T20:57:58.139703+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-b2c0baa8
  commits:
  - working_sha: 11e79c87d60a639e26e17ad95a5d4ab90df5c6f1
    reconcile_sha: null
    main_sha: null
  version: 0.2.264
  story_points: 2
---

Parent: [[EPIC-19]]. Reported by the builder assistant in conversation on
2026-09-18; it had no way to file it itself ([[REQ-273]]).

## What happened

Mid-session, a knowledge search came back:

> `corpus_unreadable` — an index or a store is missing or damaged. This is a
> deployment fault, not something to retry differently.

**It had been working earlier in the same session** — the assistant had already
read the Lagrange Foundry brand document through it, which is a `material`
ticket and therefore the *project* KB. So whatever changed, changed while the
session was open.

## The defect, which is independent of what broke

`corpus_unreadable` is a **catch-all**, and its declared message asserts two
things the code cannot know.

`@lagrangefoundry/ai-knowledge/src/toolbox.js:588-601`:

```js
try {
  return await call()
} catch (error) {
  if (error instanceof KnowledgeError) throw error
  if (error instanceof KnowledgeConfigError) {
    // A KB naming a store this deployment does not have.
    throw new KnowledgeError('corpus_unreadable', error.message)
  }
  if (error?.code) throw error
  throw new KnowledgeError('corpus_unreadable', error?.message ?? String(error))
}
```

The last line is the problem. **Every** unrecognised failure — a Workers AI 429
on the embedder, an R2 read timeout, a D1 hiccup, a transient network fault —
becomes the same error as a genuinely missing index. And the declared message
(`knowledge_surface.json`, `errors.corpus_unreadable`) then tells the caller:

> This is a deployment fault, **not something to retry differently**.

So a transient, retryable failure is reported to the model as permanent, with
explicit instruction not to retry. The assistant did the right thing with the
information it was given: it stopped. Had the cause been a rate limit, one retry
would have worked.

`host_detail` is `false`, so the underlying message is not passed through either
— the model gets the generic sentence and nothing to act on.

## Why this is the right thing to fix, whatever the root cause was

We do not yet know what actually failed, and finding out matters. But the
diagnosis is hampered by the same defect: the surface discarded the detail. Fix
the classification and the next occurrence diagnoses itself.

Two candidate root causes worth checking while implementing, both consistent
with "worked, then stopped":

- **The embedder.** `knowledge.ts` raises `AiNotConfiguredError` when there is no
  embedder — "nothing can be indexed or searched". A search needs the query
  embedded, so a Workers AI failure at query time fails the search. Workers AI is
  the one dependency here with a rate limit and a token that can expire.
- **A concurrent index write.** The project KB is indexed near-live
  (`ProjectKnowledge.onMaterialWritten` / `onTranscriptGrew`), and this session's
  own transcript growth triggers re-indexing. A read crossing a partially written
  index would present as exactly this.

## What this ticket wants

1. **Separate transient from permanent.** A retryable failure gets its own error
   with its own message, and that message says it is worth retrying. Keep
   `corpus_unreadable` for what it is declared to mean: an index or store that is
   genuinely missing or damaged.
2. **Stop asserting "deployment fault" for an unclassified error.** If the code
   cannot tell, the message must not claim to know. An error that reaches the
   catch-all should say the search failed and that the cause was not recognised.
3. **Carry enough detail to diagnose.** Whether that is `host_detail: true` for
   the transient case or a host-side log with the session id, the next occurrence
   must not be as opaque as this one.
4. **Establish the root cause of this instance** and fix it — separately from
   1–3 if it turns out to be ours.

## Upstream or here

The classification lives in `@lagrangefoundry/ai-knowledge`, so 1–3 are a
lagrange-framework ticket rather than a change in this repository. File it there
and consume the result. If the root cause in 4 is in this project's indexing
(the concurrent-write theory), that half is ours.


---

## Root cause (item 4) — established, and it is ours

**The Worker's REST embedder never worked.** Every knowledge `search` and
`chunk_search` over the REST transport has failed since the transport was first
selected; `get`, `outline` and `changes` kept working because none of them
embeds anything. That is exactly the "it had been working earlier in the same
session" shape the report describes — the assistant read the brand document with
`get`, then tried to `search`.

**The evidence is in our own audit.** `renderHostError` redacts the detail for a
`host_detail: false` code but `_record` keeps it (upstream BUG-50), so the four
failed calls are in R2 under `audit/<tenant>/<session>/` with the host's own
account attached:

> `Embedding for the project knowledge base failed over the REST transport:
> Illegal invocation: function called with incorrect `this` reference.`

**The mechanism.** `WorkersAiEmbedder` stores a fetch on the instance and calls
it as a method:

```js
this._fetch = fetchImpl || (typeof fetch === 'function' ? fetch : null)
...
const response = await this._fetch(url, init)   // `this` === the embedder
```

In workerd a native global invoked with a `this` that is not the global scope
throws `TypeError: Illegal invocation`. The distinction is narrow and worth
recording, because it is why nothing else in this repository is affected: a
*bare* detached call (`const f = btoa; f(x)`) is accepted — workerd resolves the
undefined receiver to the global — while a *method* call (`obj.f = btoa;
obj.f(x)`) is refused. Our own `fetch` seams (`fetch-guard.ts`, `mail.ts`,
`resend.ts`, `cloudflare.ts`, `resolver.ts`) all use the bare form and are
unaffected; upstream's `WorkersAiEmbedder` uses the method form and is not.

**Why it started when it did.** `embedderFor` prefers REST whenever both
`CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` are present. The pair was
completed in the local dev secrets file on 2026-09-17; before that the Worker
used the `AI` binding, which has no fetch in its path. The audit shows every
knowledge search succeeding up to 2026-09-15 and every one failing from
2026-09-18.

**Why no test caught it.** `@cloudflare/vitest-pool-workers` replaces
`globalThis.fetch` with a JavaScript wrapper (`(input, init) =>
originalFetch.call(globalThis, input, init)`), which is not `this`-sensitive. No
test in the workers project can observe a detached-fetch fault through `fetch`.
The rule is still observable in the same runtime through an unwrapped native
global, which is what the UAT below uses to establish it.

## What this ticket changes here

`embedderFor` hands the REST `WorkersAiEmbedder` an explicitly global-bound
fetch through the constructor's own `fetch` option — documented upstream as
"injected for tests and **for hosts that wrap it**", so this is the seam being
used as intended rather than a workaround. The binding transport is untouched.

A REST-configured deployment can search its knowledge again: both knowledge
bases, since `embedderFor` is the single place either one resolves a transport.

## Test plan

`tests/test_UAT_FC_BUG-117_rest_embedder.workers.test.ts`, in the workers
project because the claim is about workerd's receiver check and nothing else
can hold it:

1. **The rule is real.** A native global (`btoa`) invoked as a method of a
   foreign object throws `Illegal invocation` in this runtime, with the message
   the audit recorded; invoked bare or bound it does not. This is what makes the
   stand-in endpoint's receiver check a statement about workerd rather than an
   invention of the test.
2. **A REST-configured project KB indexes a material and finds it by search** —
   through `projectKnowledgeFor`, real D1, real R2, the real shared knowledge
   component, and a stand-in Workers AI endpoint that enforces the receiver rule
   the way the runtime does. This is the failing call from the report, passing.
3. **The request reached Workers AI over REST** — the account id in the path and
   the bearer token in the header — so the pass is not a silent fall back to the
   binding.

## Items 1–3 go upstream

Filed against `lagrange-framework` as directed, and consumed from there:

- the `corpus_unreadable` catch-all and its "not something to retry differently"
  message (items 1–3), in `@lagrangefoundry/ai-knowledge`;
- the detached-fetch defect itself, in `@lagrangefoundry/knowledge`
  (`WorkersAiEmbedder`) and `@lagrangefoundry/ai` (`HttpSurface._send`, same
  shape, not reached from this repository today).

Item 3's diagnostic half turns out to be already satisfied on our side: the
audit record carries the host's unredacted account even where the model's
message does not, which is how this root cause was found at all. What is missing
is what the *model* is told, and that is upstream.


### Upstream tickets filed

- `lagrange-framework` **BUG-59** (`bug-e7700d9e`) — `WorkersAiEmbedder` and
  `HttpSurface` call `fetch` as a method, which workerd refuses. The root cause;
  the fix landed here works through the declared `fetch` seam, so consuming
  theirs later is a deletion rather than a migration.
- `lagrange-framework` **BUG-60** (`bug-309ea2bd`) — `corpus_unreadable` is a
  catch-all whose declared message asserts a cause the code cannot know. Items
  1–3 of this ticket, verbatim.