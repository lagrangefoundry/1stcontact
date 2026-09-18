---
uid: comment-b2c0baa8
id: COMMENT-3141
type: comment
title: Comment on bug BUG-117
created_by: xgd
created_at: '2026-09-18T22:30:39.317470+00:00'
updated_at: '2026-09-18T22:46:26.172372+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-1dac9214
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "6870ab8c-55e5-49b0-8a4a-624ab66e7eac",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="97eaecdd-af6e-48c7-a6ea-2e915ad6904e-user" -->

<!-- xgd-chat role="user" ts="2026-09-18T22:30:03.974217+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="97eaecdd-af6e-48c7-a6ea-2e915ad6904e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-18T22:46:26.091040+00:00" -->
#### Claude
Done — and the root cause turned out to be findable, which changed the shape of the work.

## What actually broke

Not the index. The audit records for the four failed calls (R2 `audit/<tenant>/<session>/`) carry the host's unredacted account even though `host_detail: false` hid it from the model:

> `Embedding for the project knowledge base failed over the REST transport: Illegal invocation: function called with incorrect 'this' reference.`

`WorkersAiEmbedder` keeps its fetch on the instance and calls it as a method (`await this._fetch(url, init)`), so the receiver is the embedder — and workerd refuses a native global invoked that way. **Every** embed over REST failed, in both knowledge bases. `get`, `outline` and `changes` don't embed, which is exactly the "it worked earlier in the same session" shape the report describes: the assistant read the brand document, then tried to search.

It started when the `CLOUDFLARE_*` pair was completed in the dev secrets file on 2026-09-17 — before that `embedderFor` chose the `AI` binding, which has no fetch in its path. The audit shows every search succeeding to 09-15 and every one failing from 09-18.

One detail worth keeping: the rule is narrower than "detached fetch is unsafe". A *bare* call (`const f = btoa; f(x)`) is accepted — workerd resolves an undefined receiver to the global. Only a call through another object's property is refused. Our own fetch seams (`fetch-guard.ts`, `mail.ts`, `resend.ts`, `cloudflare.ts`, `resolver.ts`) are all the bare form, so none of them needed touching. I checked rather than assumed.

## The fix here

`embedderFor` injects a global-bound fetch through the constructor option upstream declares for exactly this ("injected for tests and for hosts that wrap it"). One function, one seam, no new dependency — and when upstream fixes its default, this is a deletion rather than a migration. Binding transport untouched.

## Why no test caught it

`@cloudflare/vitest-pool-workers` replaces `globalThis.fetch` with a JS wrapper that has no receiver check. No workers-pool test can see this defect *through fetch*. The UAT therefore establishes the rule live against `btoa` — a native global the pool hasn't replaced, quoting the runtime's own message — then applies that same rule to a stand-in Workers AI endpoint and drives a real REST-configured project KB through real D1, real R2 and the real knowledge component: index a material, search, find it. It fails before the fix with the production error verbatim.

3 UATs in `tests/test_UAT_FC_BUG-117_rest_embedder.workers.test.ts`. Regression scope (BUG-73, REQ-158/159/160) green, `tsc --noEmit` clean.

## Items 1–3 → upstream, as the ticket directed

- `lagrange-framework` **BUG-59** — the detached-fetch defect in `WorkersAiEmbedder`, plus the identical shape in `ai`'s `HttpSurface._send` (latent; not reached from here), with the pool-masking note so their test doesn't get written blind.
- `lagrange-framework` **BUG-60** — the `corpus_unreadable` catch-all and its "not something to retry differently" message.

Item 3's diagnostic half is already satisfied on our side: the audit keeps the host detail even where the model's message doesn't, which is the only reason this was diagnosable. What's missing is what the *model* is told, and that's theirs.

BUG-117 is `free_coded`, commit `11e79c87d6`, version 0.2.264, 2 points. The running dev server still has the old bundle — it needs a restart (or any source touch) before search works again.

<!-- xgd-chat-end -->