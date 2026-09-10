---
uid: comment-653c41af
id: COMMENT-2384
type: comment
title: Comment on bug BUG-68
created_by: xgd
created_at: '2026-09-09T23:55:11.183338+00:00'
updated_at: '2026-09-10T00:01:15.809145+00:00'
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

<!-- xgd-chat-end -->