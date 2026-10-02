---
uid: comment-d6e18197
id: COMMENT-4646
type: comment
title: Comment on bug BUG-172
created_by: xgd
created_at: '2026-10-02T00:31:29.782240+00:00'
updated_at: '2026-10-02T00:38:04.028450+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-60f2c4f8
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "98f3c834-3a7b-4ca5-b75b-676ec7368510",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="cc60a2cb-1894-494b-bdfb-086c51fafb04-user" -->

<!-- xgd-chat role="user" ts="2026-10-02T00:28:27.759992+00:00" -->
#### You
Please investigate this (1) we need to talk about budgets I have NO IDEA why we have a budget for capture it is EXTREMELY CHEAP our costs are tokens and it is entirely mechanical I suspect we should just kill this
(2) where we have budgets (like for tokens for example) they have to be per business

<!-- xgd-turn id="cc60a2cb-1894-494b-bdfb-086c51fafb04-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-02T00:38:02.606791+00:00" -->
#### Claude
Found the capture byte cap; now checking where it's consumed and how token budgets are scoped.

Investigation done; recording the findings on BUG-172.

You're right about (1). The capture byte budget isn't controlling any cost, and it's also what causes BUG-172. I've added the findings to the ticket but haven't changed any code yet.

## (1) The capture budget

**Why BUG-172 happens:** there's a 32 MiB limit on how many bytes one capture may download (`MAX_RESPONSE_BYTES` in `tools/generate/src/cli/capture/egress-guard.ts`). It counts the whole capture, not one page load. A single `capture_site` call loads the page many times: once per screen width, plus extra height probes, plus up to three retries. Each load is counted separately, so the same hero images get counted again and again. An image-heavy marketing page goes over 32 MiB after a few widths. After that every request is refused, including the page itself on the next width. A refused page fails the whole capture, so nothing is saved.

The "already delivered more than 33554432 bytes" message is true, but the bytes are the earlier widths, not other work. example.com is small enough never to hit the limit, which is why the control capture worked.

**What it protects:** nothing that matters. It isn't a security control. The real safeguards are the address checks that keep captures off internal networks and the redirect-loop limit, and both stay. The 60-second limit on a whole capture (`MAX_CAPTURE_MS`) already stops one from running forever.

**Proposed fix:**
- Delete the byte limit and everything that only exists to support it.
- Rewrite the one BUG-127 test that relied on it to fail a capture another way.
- Add a BUG-172 test showing a capture that downloads well over 32 MiB in total gets saved.

The three requests in the original report (naming the resource, keeping partial captures, a page-only mode) stop mattering once the limit is gone.

## (2) Per-business budgets

There are currently no spending budgets at all, per business or otherwise.

- **Token spend is already recorded per business** in `apps/control-app/src/spend.ts`, and the operator spend reports use it. Nothing sets or enforces a limit against it.
- **The other "budgets" are technical limits, not cost controls.** None is a money budget, so none of them has a business to belong to:
  - how full a model's context may get on one request (`budget-core.ts`)
  - how long one conversation turn may run (`turn-clock-core.ts`)
  - how many images one session may generate (`imagegen.ts`, described in the code as a guard against runaway loops)
  - how many turns the AI participants in a group chat may take on their own (`group-core.ts`)
  - several limits on how much text gets shown

So a per-business token budget would be a new feature: an allowance set per business and checked against the spend that's already recorded. That's a separate request, not part of this bug.

**Decisions for you:**
1. Should I go ahead and remove the capture byte limit under BUG-172? It's small, about 2 story points.
2. Do you want a ticket filed for per-business token allowances? I won't create one unless you say so.

<!-- xgd-chat-end -->