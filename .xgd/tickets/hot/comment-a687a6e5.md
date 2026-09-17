---
uid: comment-a687a6e5
id: COMMENT-3028
type: comment
title: Comment on epic EPIC-13
created_by: xgd
created_at: '2026-09-17T03:15:49.406040+00:00'
updated_at: '2026-09-17T03:26:13.806532+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: epic-d76e554a
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "2795cbe3-905d-4c9b-b46b-6e6a4fd63b7d",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="3ec61b5f-5d5c-476e-a28e-fdc378f0beb6-user" -->

<!-- xgd-chat role="user" ts="2026-09-17T03:15:42.725130+00:00" -->
#### You
Did you create REQ263? It should be your child.

I would like to discuss nomenclature for a moment. We are using the term email and the associated ticket type for an actual email sent to a user. We are proposing to use the word campaign to describe an outgoing email sent to many users.

Question: is a campaign a single message? Or is it multiple messages to the same group of users, perhaps overtime? If it's the latter then we need another word for the message because I don't want to overload email which seems to have been appropriate already

<!-- xgd-turn id="3ec61b5f-5d5c-476e-a28e-fdc378f0beb6-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-17T03:18:11.383811+00:00" -->
#### Claude
Re-parented REQ-263 — and it wasn't mine.

**REQ-263.** Created by the framework session `EPIC-3` (the immutability epic), which had claimed `epic_parent: ticket://lagrangefoundry/lagrange-framework/EPIC-3`. The store refuses a direct reassignment, so I cleared it and set it to `epic-d76e554a`. The framework dependency is unchanged — it's recorded in the body as `Depends on: …/REQ-160`, which is the right place for it: REQ-263 is the 1stcontact-side type-pack declaration, REQ-160 is the mechanism. It's EPIC-13's child now, and the first one.

## Nomenclature

**A campaign is a single send. The epic already commits to that**, though not in so many words — §"The Campaigns surface" records the decomposition as:

> campaign = **content × list × schedule**

Content is singular there. One campaign is *these bytes, to these people, at this time*. So the answer to your question is the former, and — this is the useful part — **the word for the message already exists in the model and it isn't `email`. It's `content`.** A content ticket is the composed bytes; it's reusable (one content may go to more than one list, or be tested against another), it's separate from `template` because a template is a *role* that gets re-filled and a marketing email is a specific thing said once.

So the stack is:

| word | what it is |
|---|---|
| **list** | the audience |
| **content** | the composed message — the bytes |
| **campaign** | one send: content × list × schedule |
| **email** | one actual message to one person |

**`email` is not at risk of overload**, because the epic already rules out the case that would cause it: per-recipient sends are *not* tickets. A campaign to 800 people produces one campaign ticket, one content ticket, and 800 events on the contact spine — **zero `email` tickets**. An `email` ticket only exists when a message owns its own body, which means one-to-one and transactional. That's exactly the reading you say it already has, and it survives.

**The industry check supports "one send" too.** Mailchimp and Klaviyo — which is where our customers' intuitions come from — both use campaign for a single send and reserve a different word (*automation*, *flow*) for the over-time series. HubSpot is the odd one out, using campaign as the umbrella over many assets. We should follow the small-business tools.

**Which leaves the word we'll need later.** When we do build multiple messages to the same list over time, it needs its own name so nobody reaches for "campaign" and collapses the distinction. My recommendation is **sequence** — an ordered set of campaigns with relative timing — over *flow* or *journey*, both of which are jargon that says less. Worth reserving now even though it's nowhere near the build.

Two things that pressure-test "campaign = one send", both resolving cleanly under the singular reading:

- **A/B test** — two campaigns, same schedule, different content, linked. Not one campaign with variants.
- **Re-send to non-openers** — a second campaign: different list (the non-openers), different schedule, same content.

Say the word and I'll record this as a Vocabulary section on the epic — the table plus the reserved `sequence`, and the note that `email` tickets are one-to-one only, which is the sentence that actually protects the term.

<!-- xgd-turn id="81140979-d498-45ad-9e38-50fcc0659977-user" -->

<!-- xgd-chat role="user" ts="2026-09-17T03:26:13.500903+00:00" -->
#### You
ok good I like those terms and that means that the body of a campaign ticket can be the message content

<!-- xgd-chat-end -->