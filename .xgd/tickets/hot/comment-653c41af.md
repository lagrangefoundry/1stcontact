---
uid: comment-653c41af
id: COMMENT-2384
type: comment
title: Comment on bug BUG-68
created_by: xgd
created_at: '2026-09-09T23:55:11.183338+00:00'
updated_at: '2026-09-10T00:09:23.835640+00:00'
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

<!-- xgd-chat-end -->