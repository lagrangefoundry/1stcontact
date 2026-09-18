---
uid: bug-1dac9214
id: BUG-117
type: bug
title: 'knowledge search: corpus_unreadable is a catch-all that reports a transient
  failure as a permanent deployment fault'
created_by: EPIC-19
created_at: '2026-09-18T21:46:07.949789+00:00'
updated_at: '2026-09-18T22:41:31.706379+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-b2c0baa8
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