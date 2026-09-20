---
uid: request-6a3e269d
id: REQ-286
type: request
title: 'Capture budget: drop the browser quota — context, not page loads, is the scarce
  resource'
created_by: EPIC-19
created_at: '2026-09-20T19:53:00.120338+00:00'
updated_at: '2026-09-20T21:38:35.277563+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: medium
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-6258ff98
  commits:
  - working_sha: 196ebdbea5d23ba33cafebe7c215035e54a4d5c5
    reconcile_sha: null
    main_sha: null
  version: 0.2.295
  story_points: 2
---

## What changes

The consultant can look at as many live pages as the work needs. The refusal
`BUDGET: this conversation has spent its 40 live-page looks` stops existing —
no ceiling, no warning, nothing to negotiate around, and no way for a working
consultation to hit a wall mid-task. What stays metered is the thing that is
actually scarce: **tokens**.

## Why the quota goes rather than gets raised or re-shaped

[[REQ-206]] put the ceiling in deliberately and reasoned it out in
`shot.ts` — *"a responsive ladder is eight navigations, so a conversation that
captures repeatedly turns a chat into a bill"*. The reasoning was sound about a
risk that exists. The instrument is wrong in four ways, and raising the number
fixes none of them.

**1 — It is denominated in the wrong currency.** It counts browser acquisitions.
What degrades a conversation is images entering the context and staying there:

| | browser acquisitions | tokens into the conversation |
|---|---|---|
| `capture_site` | **8** | ~0 — it returns a bundle name, a url and counts |
| `screenshot` of an already-captured page | **0** | a whole image, **re-sent on every turn after** |
| `compare` | 0 | numbers only |

`screenshot` returns raw image blocks straight onto the `tool_result`
(`fidelity-core.ts` — *"THE BLOCKS ARE THE RETURN VALUE"*), and Finding 5 of
[[EPIC-19]] establishes that a warm API conversation never prunes them. So the
single most token-expensive operation in the system is **exempt by design** —
`browserBudget`'s own doc says so as a feature: *"a picture of a `reference` and
a `compare` of two of them are all free"* — while the cheapest one, going to a
webpage, is charged eight. The meter is inverted relative to the currency that
matters.

**2 — Its scope is a permanent object.** The constant is documented as *"how
many live-page looks one conversation may spend"* and the refusal says *"this
conversation has spent its 40."* [[REQ-126]] removed session recycling, so a
site's builder conversation is one conversation for the life of the site. A
per-session quota on that is a lifetime quota.

**3 — Its real behaviour is unlearnable.** The count is in-memory per isolate,
which the doc admits makes it *"a BURST bound rather than a lifetime one."* So
sometimes there are forty, sometimes eight, nothing reports which, and it resets
on an event nobody can observe. That is worse UX than either a real quota or no
quota, because no operator or model can build a model of it.

**4 — The cost it names is a rate, not a quantity.** The header names Browser
Rendering metering, the account concurrency cap and an acquisition rate limit.
Those are rate constraints, and the runaway it guards against — a model looping
on `screenshot` — happens inside one turn. A session quota is the wrong shape for
both, and it is a *second* instrument for a problem the first one already has.

And in practice the ration has been spent on nothing: until [[BUG-127]] is fixed
a capture of a real site returns black rectangles, so the observed exhaustion in
the Lagrange Foundry session was two captures' worth of refusal pages, sixteen of
forty, bought for nothing.

## What does NOT replace it

Nothing. No rate limit, no smaller quota, no per-verb pricing, no warning
threshold. This is a deliberate choice to remove the instrument until there is
evidence it is needed, rather than to redesign it now:

> *drop the browser quota until it becomes a problem — I don't think it will —
> we should focus on tokens, that is our scarce resource to manage.*

If runaway browser spend ever shows up — in the Cloudflare bill, or as
concurrency-cap errors in production — it comes back as a **rate limit with the
evidence attached**, not as a session quota.

## What is metered instead — already in flight, nothing new asked for here

- [[REQ-284]] — the cost of a picture is stated at the point of call, in tokens,
  in `fidelity-surface.json`: *"Looking is the most expensive thing you do, and
  you pay for it again on every turn after this one."* Already landed.
- **lagrange-framework REQ-169** — the occupancy gauge, so the consultant can see
  context pressure as a number rather than infer it.
- **lagrange-framework REQ-168** — apply the window in flight and age images out to
  pointers, which is the mechanism that actually bounds what a screenshot costs.
- [[REQ-283]] — the summary store, which is what makes anything falling out of the
  window recoverable.

## Scope — what is deleted

All in `apps/control-app/src/shot.ts`:

- `SESSION_BROWSER_BUDGET`
- `BrowserBudgetSpentError`
- the `BrowserBudget` interface and `browserBudget()`
- `ShotDeps.budget`
- the metering in `fidelityDeps` — `const budget = deps.budget ?? browserBudget()`
  and the `budget.meter(...)` wrap, so the launcher is the launcher again

And the prose that documents it as the answer to a question: the module header's
*"the rate limit it needed is `browserBudget` below"*, `fidelityDeps`'s *"AND THE
RATE LIMIT IS HERE"* paragraph, and `router.ts`'s *"Its budget is minted per call
— see `browserBudget`."* Each is replaced by one sentence recording that the
ceiling was removed on purpose and what took over: authorisation is still
answered by there being no route, and spend is answered in tokens.

## Scope — what is added

One prose change, in `capture_site`'s manual entry in
`tools/generate/src/cli/ai/fidelity-surface.json`: say what a capture costs in
the currency that matters. A capture hands back a **name**, not pictures, so it
is the cheap way to keep a site around and look at it later — the opposite steer
from the one the quota gave, which taxed capture at eight and let pictures
through free. Changing what the manual says is a change to the surface the
assistant is given, so `surface_version` goes 6 → 7 with it.

## Supersedes

This supersedes [[REQ-206]]'s rate-limiting decision — the part of it that says
the surface needed a ceiling and that `browserBudget` is it. Everything else
REQ-206 established stands: no HTTP route, authorisation by admitted
business-scoped turn, one surface per site, per-call audit.

Two of its UATs go with it, deleted rather than skipped:

- `test_UAT_FC_REQ-206_the_session_has_a_bounded_number_of_live_page_looks`
- `test_UAT_FC_REQ-206_a_spent_budget_refuses_one_operation_and_no_others`

The second one also proves something that is not about the budget — that reading
an already-captured reference needs no browser and keeps working. That assertion
moves into the new REQ-286 UAT rather than being lost with the file it sat in.

## Test plan

- **New UAT** — `test_UAT_FC_REQ-286_a_conversation_can_look_as_often_as_the_work_needs`:
  drive more acquisitions through `fidelityOperations` than the old ceiling
  allowed and assert every one leases and returns a picture. This is REQ-206's
  AC5 inverted, and it is the executable evidence that the ceiling is *gone*
  rather than merely raised.
- The rest of `tests/test_UAT_FC_REQ-206_the_assistant_can_see.workers.test.ts`
  is the regression scope and its assertions are untouched. Its module
  doc-comment is not: it enumerates that file's claims, so it records which two
  went and why, and keeps the gap in the numbering so the surviving claims still
  read against the acceptance criteria they were written for.

## Non-goals

- **[[BUG-127]]** — the egress guard counting origins as redirects. Independent of
  this; both should land and neither waits on the other.
- **Cheaper single-viewport captures.** With no quota there is nothing to save,
  and the responsive ladder is what makes a capture worth having. Revisit only if
  latency, not spend, becomes the complaint.
- **Bounding the warm conversation.** That is lagrange-framework REQ-168 and it is
  upstream; this ticket only stops charging for the wrong thing.