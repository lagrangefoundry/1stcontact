---
uid: comment-3d96e317
id: COMMENT-4896
type: comment
title: Comment on chat CHAT-60
created_by: xgd
created_at: '2026-10-04T17:15:06.330917+00:00'
updated_at: '2026-10-04T17:19:34.722378+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: chat-59d043bc
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "7cbb26cb-90db-47e2-b2aa-c2431b7ce156",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="d8c7b9fd-7643-47bc-9e1a-8f66d0c68aad-user" -->

<!-- xgd-chat role="user" ts="2026-10-04T17:14:39.665700+00:00" -->
#### You
I want to have a UX conversation about naming the AI (or not). In the version of the tool with two in the room we had no choice, but with a 1-1 conversation, what are people expecting these days?

there is a fine line here between personability vs over anthropomorphising 

There is another level to this too - what personal pronoun should be used? Using conventional gender pronouns feels unnecessarily Anthropomorphic - in English the AI does not have a gender. OTOH "it" starts to feel highly impersonal. "they" is always a possiblity

<!-- xgd-turn id="d8c7b9fd-7643-47bc-9e1a-8f66d0c68aad-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-04T17:16:28.808057+00:00" -->
#### Claude
The short answer: in a 1-1 conversation, people no longer expect the AI to have a personal name. I'd recommend not giving it one. Here's why, and how to handle pronouns.

**What changed when it went 1-1**

With two people in the room, the AI needed a name so people could address it and tell it apart from the other person. In a 1-1 chat nobody needs to call it anything. "You" and "I" cover the whole conversation. So the question is no longer "what's it called in the chat?" It becomes "what do we call it when we talk *about* it?" That only happens in a few places:

- **Revision history.** "Changed by ___". The revision model records `author_type`, and AI accountability is a stated goal.
- **AI activity transparency in the portal.** This is policy 27 in the architecture doc.
- **Notifications and emails.** For example, "___ fixed a broken link on your Services page."
- **Help text.**

All of these are about accountability, not personality. The label has to be clear and honest. Warmth matters much less there.

**What people expect now (2026)**

- **Big platforms** use brand names: Claude, Gemini, Copilot. These are product names, not personas.
- **Vertical SaaS has mostly dropped human first names** ("Ava", "Max"). People now read them as slightly deceptive or dated, the 2018 chatbot look. Where a name is used, it's usually a role or function word, like Shopify's "Sidekick".
- **Disclosure rules push the same way.** EU AI Act Art. 50 and California's bot-disclosure law both make a human-sounding name a liability. This matters most if the AI ever writes to the business owner's *customers*, such as lead follow-ups or form replies. For a small-business tool, the owner's credibility is on the line there.

**Personality comes from behaviour, not the name**

A name does little for warmth. What makes it feel personable is:

- tone
- remembering the business ("your Saturday hours")
- being specific
- admitting when it's unsure

You can have a warm, competent voice under a plain role label. A human name on a bland voice feels worse than no name.

**Pronouns**

I'd go in this order:

1. **Write so you rarely need one.** In chat it's "I" and "you". On third-person surfaces, use the label as the subject ("Assistant updated your hero section"), not a pronoun.
2. **When you can't avoid one, use "it".** "It" isn't as cold as it sounds when the voice itself is warm, and it's honest.
3. **I'd avoid "they".** Singular "they" strongly signals a person. That's more anthropomorphic than it looks, and some people feel it borrows from non-binary identity. It's also ambiguous next to the plural "they" (the team, the customers).
4. **Don't police users.** If an owner calls it "he" or "she", let it go. That's their relationship with the tool, not our copy.

**Recommendation**

- No personal name.
- One consistent role label for third-person surfaces, e.g. "Assistant", or something tied to the product's caretaker idea.
- "I" in conversation.
- "It" in the rare cases a pronoun is needed.
- Anything customer-facing is clearly AI and never presented as a person.

Two questions would sharpen this:

1. In the two-person version, was the other person the business owner, or someone from GenDev Labs?
2. Is the AI ever meant to speak *as* the business to the owner's customers?

If the answer to the second is yes, the naming question splits into two: one label for the owner's view, and a separate disclosure rule for the customer's view.

<!-- xgd-turn id="ec3cd87d-adc4-4248-8ce0-9091939c048c-user" -->

<!-- xgd-chat role="user" ts="2026-10-04T17:19:19.429863+00:00" -->
#### You
1 - this is a 2 AI one person scenario
2 - not in any features that we have yet

<!-- xgd-turn id="ec3cd87d-adc4-4248-8ce0-9091939c048c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-04T17:19:33.281226+00:00" -->
#### Claude
That helps. With two AIs and one person, the names did one job: they told the person which AI was talking. With a single AI, that job is gone. Nothing in the conversation needs a name now, so dropping it doesn't cost you anything.

There are three places where the old setup could come back:

- **Hidden delegation showing through.** If the one visible AI hands work to other agents behind the scenes, keep that out of the conversation: "I've checked the forms," not "the reviewer found…". The moment a second agent appears in the UI, you're back to needing names. If you ever do need to show it, use role labels like "Review" or "Build", not personas.
- **Existing users.** Anyone who used the two-AI version may already know those names. Give them one line of transition copy at most. Don't explain it at length, or the change becomes bigger than it needs to be.
- **Customer-facing features later.** None exist yet, so you don't need a disclosure rule today. Still, choose the role label now so it will work unchanged in customer-facing copy if that comes. A function word like "Assistant" will. A cute coined name will just need another rename later.

So the recommendation stands, and it's simpler than before:

- **No name.** The AI uses "I" in conversation.
- **One plain role label** wherever it's mentioned in the third person: revision history, portal activity, notifications.
- **"It"** in the rare places copy needs a pronoun.

If you'd like this written down, I can draft it as a short copy and voice guideline. That's a documentation change, so it doesn't need a ticket.

<!-- xgd-chat-end -->