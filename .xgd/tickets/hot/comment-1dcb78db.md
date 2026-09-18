---
uid: comment-1dcb78db
id: COMMENT-3144
type: comment
title: Comment on bug BUG-118
created_by: xgd
created_at: '2026-09-18T22:37:42.562391+00:00'
updated_at: '2026-09-18T23:00:01.411695+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-3d1ee8ac
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "d0c43753-ffe4-4d21-9434-e9564b88d665",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="ca9adf31-32d7-4cf6-a64c-91817d76cacb-user" -->

<!-- xgd-chat role="user" ts="2026-09-18T22:37:06.701999+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="ca9adf31-32d7-4cf6-a64c-91817d76cacb-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-18T23:00:00.101984+00:00" -->
#### Claude
Now the priming rule:

I have what I need. Let me record the decisions on the ticket and start.

Now the three edits. First, the result sentence:

Now the two one-line summaries:

Now the priming rule:

Now the workers UAT for the result sentence:

Now lint and typecheck:

Now update the ticket body with what changed, then commit.

Now version bump and commit on the branch:

Done. BUG-118 is at `free_coded` with commits `da74d49` and `7bd2a27` on `xgd-working`, branch merged and cleaned up.

## What changed

**1. The result of making a picture now says where the picture went** — `apps/control-app/src/imagegen.ts`, `generatedDisplay`:

> This picture is in the client's Library now, catalogued as `material-…` — `screenshot` takes that name unchanged, so you can look at what you made, and it is on the site only once you place it there. Show this picture to the person you are talking to by including this line…

Host-side through the `host_display` seam, not upstream: which of the two stores holds the bytes is not a fact the plugin can know (`store` is the host's, `origin: 'generated'` is the host's vocabulary). It names the **uid**, not the filename — the uid is the catalogue's canonical name, always means exactly one picture, and is already in the record as `ticket`, so the sentence teaches that the handle the model is holding *is* the name every way of looking at a picture accepts.

**2. The two listings disambiguate in their one-liners** — `list_library` names `list_assets`; `list_assets` names the distinction ("not everything the client has given you… only once it has been placed on the site") but *not* the tool. Deliberate asymmetry: L1 is composed by hosts with no Library at all (`1c` has no ticket store), so naming `list_library` there would put an ungranted tool in their manual.

**3. The priming rule is widened, and the belief is forbidden** — the fetch-a-fuller-entry rule now fires on *where a thing lives* and on two one-liners that sound like the same list, plus a new paragraph: never report yourself unable on the strength of one tool answering nothing.

## One correction to the ticket's diagnosis

The ticket says the Library's overview "is not in the default projection." **It is.** The framework's renderer keeps a surface's overview *whole* at both levels and drops only the per-operation reference (`toolbox/manual.js`, `surfaceBlock` — "rendering only its first paragraph was measured and rejected"), and `roles.ts` primes with `manual({ level: 'summary' })`. So the paragraph naming this exact trap was in front of the assistant the whole session.

That doesn't change the fix — the one-liners still weren't self-disambiguating and the result still said nothing — but it does mean "promote the overview into the projection" would have been a no-op. I pinned the correction with a UAT so nobody re-fixes it that way, and recorded it in the ticket body.

## Evidence

- `tests/test_UAT_FC_BUG-118_a_generated_picture_says_where_it_went.workers.test.ts` — real plugin, real D1/R2, only the image provider's HTTP substituted. It pulls the name **out of the sentence as written** and resolves it through `get_library_item` on the real catalogue, and asserts `placed_on` is empty. So the evidence is that the sentence is *true*, not that a string contains a word.
- `tests/test_UAT_FC_BUG-118_where_a_picture_lives.test.ts` — renders the actual primed summary manual with the Library composed as `host-core.ts` composes it; asserts both one-liners, the overview correction, and both halves of the priming change.

Regression green: REQ-217, REQ-208, REQ-228 ×2, REQ-171, REQ-182, BUG-63, BUG-65, REQ-126, REQ-174, REQ-237, REQ-264 and the three `reconciliation-assistant-*` suites, plus `tsc --noEmit` over `apps/control-app` and `tools/generate`.

One residual, recorded rather than absorbed: the location sentence rides on the `display` seam, which the plugin composes only where the host supplied a `materialUrl`. `router.ts` always does, so no shipped session reads the poorer result — but making it unconditional would have superseded REQ-217's standing AC that *nowhere to show it means no line*, so I left it.

<!-- xgd-chat-end -->