---
uid: comment-653c41af
id: COMMENT-2384
type: comment
title: Comment on bug BUG-68
created_by: xgd
created_at: '2026-09-09T23:55:11.183338+00:00'
updated_at: '2026-09-10T18:55:05.771856+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-3faf6859
  kind: chat_transcript
---

<!-- xgd-turn id="966db559-a9b0-48d5-b5ac-4a65afd9cb6c-user" -->

<!-- xgd-chat role="user" ts="2026-09-09T23:55:00.395822+00:00" -->
#### You
"The image generator is down right now — a deployment issue on my end, nothing to retry." <-- latest transcript from Lagrange Foundry Site tab

CreateImage(A dramatic foundry scene: a large crucible tilting forward to pour glowing molten metal into a line of seven iron molds …)

⎅ Error: CreateImage failed (unknown_aspect_ratio). That is not a shape this generator offers. The host reports: Backend "openai" does not support "aspectRatios": 16:9 is not among 1:1, 3:2, 2:3

⏺

CreateImage(A dramatic foundry scene: a large crucible tilting forward to pour glowing molten metal into a line of seven iron molds …)

⎅ Error: CreateImage failed (generator_unavailable). The image generator could not be reached. This is a deployment fault rather than something to retry differently.

<!-- xgd-turn id="966db559-a9b0-48d5-b5ac-4a65afd9cb6c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-10T00:01:15.665746+00:00" -->
#### Claude
**The account is out of credits.** Nothing is down and nothing is misdeployed — the sentence the client read is false.

I probed the generations endpoint with the same key the dev server uses:

```
POST /v1/images/generations → HTTP 429
{"error":{"message":"You have no credits remaining. Add credits to continue
using the API at https://platform.openai.com/settings/organization/billing/.",
"type":"insufficient_quota","code":"credit_balance_exhausted"}}
```

The key itself is fine — `GET /v1/models/gpt-image-1` answers 200.

**How a billing failure got dressed up as a deployment fault.** Three framework mechanisms compose into it:

1. `classifyRefusal` only recognises content-policy shapes, so a 429 `insufficient_quota` correctly isn't a refusal and becomes a plain `ImageGenError` carrying OpenAI's message verbatim.
2. `ImagegenToolbox.create_image` has **one bucket** for everything non-refusal — dead key, no credits, rate limit, transient 5xx, dead socket all become `generator_unavailable`, whose declared sentence asserts *"a deployment fault rather than something to retry differently."*
3. `imagegen_surface.json` declares that code `host_detail: false`, so `renderHostError` strips OpenAI's explanation before the model sees it — and `_record` stores the *rendered* string, so it isn't logged either.

The provider said exactly what was wrong in one actionable sentence, and the stack discarded it in both directions at once. Diagnosing it needed a hand-rolled curl.

Two smaller things in the same episode:

- The first call was burnt discovering that `16:9` isn't offered. The `aspect_ratio` description never names the accepted set (`1:1`, `3:2`, `2:3`), so the model guesses and learns from a failure. It recovered correctly — the taxonomy works — but the set would have to be projected from `backend.capabilities.aspectRatios` at composition time, since the declaration is deliberately provider-neutral.
- `this.generated += 1` runs *before* `generate()`, so a 429 that produced nothing still spent one of the session's ten images.

**Also worth knowing:** `wrangler secret list --env production` shows only `ANTHROPIC_API_KEY` and `RESEND_API_KEY`. Production has no image tool at all — this only reproduces in local dev.

BUG-68 now carries the full diagnosis, kept at `draft`. **No code lands here**: `apps/control-app/src/imagegen.ts` is wiring only and says so — the taxonomy, the suppression and the parameter description are all `lagrange-framework`'s. The three candidate upstream fixes are written up in the ticket. Say the word if you want framework tickets filed for them.

The immediate unblock is topping up the OpenAI account.

<!-- xgd-turn id="f75194c1-e61b-4681-b327-8fc85e0a9f33-user" -->

<!-- xgd-chat role="user" ts="2026-09-10T00:07:50.515548+00:00" -->
#### You
There is an 

OPENAI_API_KEY in 

~/Documents/secrets/1c.dev.env

That is included in the server start up

<!-- xgd-turn id="f75194c1-e61b-4681-b327-8fc85e0a9f33-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-10T00:08:16.409151+00:00" -->
#### Claude
Yes — that's the key I probed with. It's loaded into the running server via `wrangler dev --env-file $HOME/Documents/secrets/1c.dev.env`, and it's valid: `GET /v1/models/gpt-image-1` returns 200.

The transcript proves it independently. In `ImagegenToolbox.create_image`, `this.backend()` runs *before* `negotiate(...)` — and constructing `OpenAIImageBackend` throws when there's no key. Your first call got past construction and failed on the aspect ratio, so the credential resolved fine. The surface was composed, which only happens when `resolvePlugins` can answer `OPENAI_API_KEY`.

The key is not the problem. The 429 is:

```
{"code":"credit_balance_exhausted",
 "message":"You have no credits remaining. Add credits to continue using the
  API at https://platform.openai.com/settings/organization/billing/."}
```

Top up the account at that URL and generation works again — no restart needed, nothing to change in the repo.

The thing worth fixing is that you had to ask me. `generator_unavailable` is declared `host_detail: false`, so OpenAI's one-sentence explanation was dropped before the model saw it and never logged server-side either. That's BUG-68, and the fix is upstream in `lagrange-framework`.

(The production worker is a separate matter — `wrangler secret list --env production` shows only `ANTHROPIC_API_KEY` and `RESEND_API_KEY`, so deployed sessions have no image tool at all. Deliberate per `bin/deploy.d/secrets/30-openai-api-key`, which deploys without it and says so, but flagging it in case you expected otherwise.)

<!-- xgd-turn id="3e8af836-9220-458c-9a05-d4d18a01822b-user" -->

<!-- xgd-chat role="user" ts="2026-09-10T00:09:23.751094+00:00" -->
#### You
This is not really an error that we want a customer to see but it is important that its exposed does our image tool return the issue?

<!-- xgd-turn id="3e8af836-9220-458c-9a05-d4d18a01822b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-10T00:10:53.617374+00:00" -->
#### Claude
**No. It returns it nowhere** — not to the model, not to the audit trail, not to logs.

I pulled the two audit objects from that turn out of local R2. They sit side by side and show the defect exactly:

```json
// 1788997568.318-0000.json   — unknown_aspect_ratio, host_detail: true
"error": "…The host reports: Backend \"openai\" does not support
          \"aspectRatios\": 16:9 is not among 1:1, 3:2, 2:3"

// 1788997573.947-0001.json   — generator_unavailable, host_detail: false
"error": "…The image generator could not be reached. This is a deployment
          fault rather than something to retry differently."
```

Same tool, same turn, five seconds apart. The first is diagnosable from the audit alone. The second isn't, and `You have no credits remaining` appears in no record this system keeps.

**`host_detail` is doing two jobs and only one of them was designed.** Its stated purpose is deciding what the *model* is told — and for this error that judgement is right, exactly as you say: a customer must not read "you have no credits remaining" about the business they're buying from. But `Toolbox._record` writes `outcome.error` from the *rendered* string rather than from the exception, so the same flag silently decides what the *operator* is told too. One flag, two audiences, no way to answer them differently.

So the fix isn't to flip the flag. It's to split the audiences:

- `_record` should carry the **unrendered** failure — at minimum `describeFailure(error).detail` — alongside the rendered `outcome.error` it already stores.
- The audit is operator-facing, tenant-scoped in R2, and never shown to a customer. That is precisely where an unredacted provider message belongs.

Then the customer keeps a vague, non-alarming sentence, the model keeps one it can't leak a vendor name from, and whoever reads the audit for a failed turn sees `credit_balance_exhausted` and knows to top up.

I've updated BUG-68 with the audit evidence and this sharpened recommendation. Both changes land in `lagrange-framework` (`components/ai/js/src/toolbox/`) — still nothing to code here.

One caveat on scope: I only traced the `CreateImage` path. `host_detail: false` is also on `store_unavailable`, and any other surface using it has the same blind spot — worth a sweep when the framework fix goes in.

<!-- xgd-turn id="e68e8494-2e1d-4239-9d7a-3d1174ec5a85-user" -->

<!-- xgd-chat role="user" ts="2026-09-10T17:12:38.005719+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="e68e8494-2e1d-4239-9d7a-3d1174ec5a85-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-10T17:15:02.634490+00:00" -->
#### Claude
I've scoped it. One blocking question before I cut a branch, plus two things you should know.

## The blocking question: which repo, which ticket?

There is **no honest 1stcontact-side fix**. I checked the seams:

- The audit sink is ours (`ai.ts` → R2), but it receives `outcome.error` already flattened to the rendered string. The exception never reaches us.
- `ToolboxSurface.invoke` is overridable, so I *could* wrap the plugin-built instance in `imagegen.ts` and log the raw error before the runtime renders it. That is precisely the "local workaround" that file forbids in its own header — and it would fix one surface while `store_unavailable` and every other `host_detail: false` error stayed blind.

The real fix is ~6 files in `lagrange-framework`, and it's a direct sequel to that repo's **BUG-39** ("Declared error codes discard the host's own diagnosis") — the ticket that *introduced* `host_detail`. BUG-39 fixed the model's view and left the audit reading from the rendered string, so the flag silently kept redacting for the operator too.

But `lagrange-framework` has its own ticket store (297 tickets, its own BUG-39/REQ-141/BUG-48). A `test_UAT_FC_BUG-68_*` landing there has no matrix entry and gets eliminated as drift. The established pattern is paired tickets — 1stcontact REQ-208 ↔ framework REQ-141 for this very component.

**So: may I create a framework ticket for the code, keeping BUG-68 as the 1stcontact-side diagnosis?** I won't create one without you saying so. If you'd rather I land it under some existing framework ticket, name it and I'll use that.

## Two things to know

**This is a cross-language contract change, not a five-line patch.** The audit record is pinned byte-for-byte in `components/ai/conformance/fixtures.json`:

```
{"duration_ms":0.25,…,"outcome":{"error":"Error: WidgetUpdate is read-only here.","ok":false,…}}
```

Adding an unredacted field to `OutcomeRecord` means JS `audit.js`/`runtime.js`, the Python twins `audit.py`/`runtime.py`, the corpus fixtures, and UATs in both languages. Well-bounded, but it's a real change.

**I can't make the fix reach 1stcontact.** `src/generated/ai-workers.js` re-exports from `/Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/` — a *copy*, not a link, and that path is outside my sandbox's write set. You'll need to run the install yourself afterwards for the dev server to pick it up.

## What I'd implement, if you say go

1. **`_record` carries the unredacted detail** — `outcome.error` keeps the rendered string exactly as today; a sibling field carries `describeFailure(error).detail` unconditionally. The audit is tenant-scoped in R2 and never customer-visible, so that's where the provider's own sentence belongs. `host_detail` goes back to meaning only what it was designed to mean: what the *model* is told.
2. **Split `generator_unavailable`** in `ai_imagegen` — quota/billing exhaustion gets its own declared code. Today a 429 rate limit tells the model "nothing to retry", which is the opposite of true.

I'd **defer** projecting the accepted aspect ratios into the parameter description — it needs capability→declaration projection at composition time and touches the generated manual. Worth doing, but it's a separate shape from this bug. Say if you want it folded in.

<!-- xgd-turn id="a7708df1-3932-499a-a70e-cf74bad7f236-user" -->

<!-- xgd-chat role="user" ts="2026-09-10T18:39:27.272721+00:00" -->
#### You
Oh you didn't say that - please create a ticket in lf for the fix

<!-- xgd-turn id="a7708df1-3932-499a-a70e-cf74bad7f236-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-10T18:54:22.971798+00:00" -->
#### Claude
Now the JS implementation.

Now the audit record docs and the debug stream projection.

Now the Python peers.

Now the imagegen quota classification, in both languages.

Now the Python peers for imagegen.

Now the sur

<!-- xgd-chat-end -->