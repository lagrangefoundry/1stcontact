---
uid: bug-3faf6859
id: BUG-68
type: bug
title: 'Image generation: an out-of-credits OpenAI account is reported to the client
  as a deployment fault'
created_by: martin-github@westhead.me
created_at: '2026-09-09T23:53:50.877405+00:00'
updated_at: '2026-09-10T00:10:43.383280+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-653c41af
  severity: medium
---

## Symptom

In the **Lagrange Foundry** builder session (`chat-d73a11e1`, local dev, 2026-09-09
23:46 UTC) the assistant tried twice to generate a hero image and then told the
client:

> "The image generator is down right now — a deployment issue on my end, nothing
> to retry."

The two tool results behind that sentence:

```
23:46:08.318Z  aspect_ratio "16:9"
  Error: CreateImage failed (unknown_aspect_ratio). That is not a shape this
  generator offers. The host reports: Backend "openai" does not support
  "aspectRatios": 16:9 is not among 1:1, 3:2, 2:3

23:46:13.947Z  aspect_ratio "3:2"   ← model corrected itself, correctly
  Error: CreateImage failed (generator_unavailable). The image generator could
  not be reached. This is a deployment fault rather than something to retry
  differently.
```

The sentence the client read is false. Nothing is down and nothing is
misdeployed.

## Root cause

**The OpenAI account has no credits.** Probed directly with the same key the dev
server uses (`~/Documents/secrets/1c.dev.env`), against
`POST https://api.openai.com/v1/images/generations`:

```
HTTP 429
{"error":{"message":"You have no credits remaining. Add credits to continue
using the API at https://platform.openai.com/settings/organization/billing/.",
"type":"insufficient_quota","param":null,"code":"credit_balance_exhausted"}}
```

The key itself is fine and `gpt-image-1` is reachable — `GET /v1/models/gpt-image-1`
answers `200`. This is billing, not credentials and not deployment.

### How a billing failure became "a deployment fault"

Three framework mechanisms compose into it, and each is individually reasonable:

1. `classifyRefusal` (`components/imagegen/js/src/refusal.js`) recognises only
   content-policy shapes as refusals. A 429 with `insufficient_quota` is
   correctly *not* a refusal, so it falls through to `raiseForResponse`, which
   raises `ImageGenError("openai image request failed with HTTP 429: You have no
   credits remaining…")`.
2. `ImagegenToolbox.create_image` (`components/ai_imagegen/js/src/toolbox.js`)
   has one bucket for everything that is not a refusal: auth failure, quota
   exhaustion, rate limit, transient 5xx and a dead socket all become
   `generator_unavailable`. Its declared sentence asserts *"This is a deployment
   fault rather than something to retry differently."* — true for a missing key,
   wrong for this, and wrong for a 429 rate limit or a transient 5xx.
3. `imagegen_surface.json` declares `generator_unavailable` with
   `host_detail: false`, so the toolbox runtime
   (`components/ai/js/src/toolbox/runtime.js::renderHostError`) drops the
   provider's own message before the model sees it. The `_record` call one line
   up stores the **rendered** string, not the original — so the reason is not
   logged either.

**The provider said exactly what was wrong, in one actionable sentence, and the
stack threw that sentence away.** Diagnosing it required going to the OpenAI API
by hand with the key. That is the defect: an operator has no path from the
symptom to the cause.

Note also that `this.generated += 1` runs before `backend.generate(...)`, so a
429 that generated nothing still spends one of the session's ten permitted
images.

### Secondary: the aspect ratio round trip

The first call was spent discovering that `16:9` is not on offer. The
`aspect_ratio` parameter's description is *"The shape of the image, as
width:height. Defaults to 1:1 (square)."* — it never names the accepted set, so
the model has to guess and learn from a failure. It recovered correctly
(`16:9` → `3:2`), which is the taxonomy working as designed, but a call is burnt
every time. The declaration is deliberately provider-neutral, so the accepted set
cannot be written into it as a literal; it would have to be projected from
`backend.capabilities.aspectRatios` when the surface is composed.

## What to do

**Operationally, now:** add credits to the OpenAI account. That alone restores
image generation; nothing in this repository is broken.

**In code — and the fix is upstream, not here.** `apps/control-app/src/imagegen.ts`
is wiring only, and says so explicitly: *"If any of that ever needs more than
wiring, the finding belongs upstream rather than in a local workaround."* The
error taxonomy, the detail suppression and the parameter description are all
`lagrange-framework`'s. Three candidate changes, in order of value:

1. **Do not discard the provider's account of a failure.** Either give
   `generator_unavailable` `host_detail: true`, or — since some of these strings
   could carry vendor identity, which this surface is built to withhold — have
   the host log the original before rendering. Today it is lost in both
   directions at once.
2. **Split the bucket.** Quota/billing exhaustion is a distinct, actionable,
   non-retryable-but-not-deployment condition and deserves its own declared code
   with its own sentence. A rate limit is retryable and currently tells the model
   the opposite.
3. **Project the accepted aspect ratios into the parameter description** at
   surface-composition time, so the first call is not spent finding them.

**No code change lands in this repository under this ticket.**

## Test plan

None. No `xgd_source`/`apps` code is changed here — this ticket is a diagnosis,
and the code fix belongs to `lagrange-framework`.

## Evidence

- Transcript: `comment-ca74b1b7` on `chat-d73a11e1` (local miniflare D1), lines
  around the two `xgd-tool name="CreateImage"` entries.
- `wrangler secret list --env production` → only `ANTHROPIC_API_KEY` and
  `RESEND_API_KEY`; production has no image tool at all, so this reproduces only
  in local dev today.
- Direct probes of `/v1/models/gpt-image-1` (200) and `/v1/images/generations`
  (429 `credit_balance_exhausted`).

## Where the reason is exposed today: nowhere

Asked directly — *does the image tool return the issue anywhere?* — the answer is
no, in all three directions at once:

- **To the model:** no. `host_detail: false` makes `renderHostError` drop the
  detail before the sentence is built.
- **To the durable audit trail:** no. `Toolbox._record` stores the *rendered*
  string in `outcome.error`, so the audit inherits the model's redaction.
- **To the logs:** no. There is no `console.*` on the failure path in
  `toolbox/runtime.js`, and `apps/control-app/src/ai.ts` never sees the error
  object — only the string the runtime already flattened.

The two audit objects from the failing turn are in local R2 at
`audit/biz_5b101742d436573a04a2512fb7ecdbb5/site-unnamed/`, and read side by side
they show the defect exactly:

```json
// 1788997568.318-0000.json   — unknown_aspect_ratio, host_detail: true
"error": "Error: CreateImage failed (unknown_aspect_ratio). That is not a shape
          this generator offers. The host reports: Backend \"openai\" does not
          support \"aspectRatios\": 16:9 is not among 1:1, 3:2, 2:3"

// 1788997573.947-0001.json   — generator_unavailable, host_detail: false
"error": "Error: CreateImage failed (generator_unavailable). The image generator
          could not be reached. This is a deployment fault rather than something
          to retry differently."
```

Same tool, same turn, seconds apart. The first is diagnosable from the audit
alone. The second is not, and `You have no credits remaining` appears in no
record this system keeps.

**`host_detail` is doing two jobs and only one of them was designed.** Its stated
purpose is to decide what the *model* is told — and for this error that judgement
is right, because the customer must not read "you have no credits remaining"
about the business they are buying from. But because the audit record is written
from the rendered string rather than from the exception, the same flag silently
decides what the *operator* is told, and there the judgement is wrong. One flag,
two audiences, no way to answer them differently.

## The fix, restated

This sharpens item 1 of *What to do* above rather than replacing it. **Do not
flip `host_detail` to `true`** — the model's sentence should stay vague, for the
reason the flag exists. Split the audiences instead:

- `Toolbox._record` should carry the **unrendered** failure — at minimum
  `describeFailure(error).detail` — alongside the rendered `outcome.error` it
  already stores. The audit is operator-facing and is exactly where an
  unredacted provider message belongs; it is already tenant-scoped in R2 and is
  never shown to a customer.
- With that in place the customer keeps a vague, non-alarming sentence, the model
  keeps a sentence it cannot leak a vendor name from, and an operator reading the
  audit for a failed turn sees `credit_balance_exhausted` and knows to top up.

Both changes are in `lagrange-framework` (`components/ai/js/src/toolbox/`).
Still no code change in this repository.
