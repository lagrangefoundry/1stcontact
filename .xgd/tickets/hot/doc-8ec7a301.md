---
uid: doc-8ec7a301
id: DOC-66
type: doc
title: AI naming & pronouns — no name, "I" in conversation, "Consultant" in third
  person
created_by: CHAT-60
created_at: '2026-10-04T17:21:58.583241+00:00'
updated_at: '2026-10-04T17:27:35.017153+00:00'
completed_at: null
last_field_updated: title
status: null
fields:
  doc_kind: architecture
---

**Status: DECIDED** (CHAT-60, 2026-10-04). Written so we stop revisiting the question. Reopen it only if one of the triggers in §5 fires.

## 1. Decision

- **The AI has no personal name.** In conversation it refers to itself as "I" and to the client as "you".
- **On third-person surfaces it is called "Consultant"** (in running copy, "your consultant"), and the label is applied consistently. Third-person surfaces are revision history ("Changed by Assistant"), portal AI-activity transparency (DOC-5 policy 27), notifications, emails and help text.
- **Pronoun: write copy so none is needed.** Make the label the subject ("Your consultant updated your hero section"). Where a pronoun is unavoidable, use **"it"**. Do not use "he", "she" or "they".
- **We do not correct users.** If an owner calls it "he" or "she", that is their relationship with the tool. Our copy does not argue with it.

## 2. Why the old version had names, and why that no longer applies

The earlier version had two AIs and one person in the conversation. The names did one job: telling the person which AI was speaking. In a 1-1 conversation nothing needs to be addressed by name, so that job is gone. The only remaining question is what to call the AI when we refer to it in the third person, and that is a question of accountability, not personality.

## 3. Reasoning

- **Personability comes from behaviour, not a name.** Warmth comes from tone, remembering the business ("your Saturday hours"), being specific and admitting uncertainty. A plain label on a warm voice beats a human name on a bland one.
- **Human first names read as dated or deceptive** in 2026 vertical SaaS. The current pattern is brand names (Claude, Gemini, Copilot) or function words (e.g. Shopify's "Sidekick"). A human-sounding name also raises the disclosure bar (EU AI Act Art. 50, California's bot-disclosure law).
- **"It" over "they".** Singular "they" strongly signals a person, which makes it more anthropomorphic than it looks. Some people also read it as borrowing from non-binary identity. It is ambiguous next to the plural "they" (the team, the customers). "It" is honest, and it does not feel cold when the voice is warm. Writing around pronouns makes the question mostly moot.
- **"Consultant" is the product's own word for the role.** The docs already call the AI "the consultant" (DOC-4, DOC-33 *The Consultation Playbook*, DOC-49), and the relationship is advisory: the consultant leads the client from nothing to a live site. "Assistant" was rejected because it gets the relationship backwards. An assistant takes instructions; a consultant brings expertise and a point of view. The "caretaker" framing is retired (DOC-4).
- **The cost: "consultant" is also a human job title**, so it sits a little closer to anthropomorphism than a function word would. That is acceptable because it is a role, not a persona. It does mean that wherever the label could be mistaken for a person (emails, notifications, anything read outside the app), the copy or UI must also mark it as AI.

## 4. Rules that follow

- **Hidden delegation stays hidden.** If the visible AI hands work to other agents, the conversation reports it as its own work ("I've checked the forms"), not "the reviewer found…". If a second agent must ever appear in the UI, give it a role label ("Review", "Build"), never a persona name.
- **Transition copy for prior users:** at most one line if users of the two-AI version ask where the names went. No explanation beyond that.
- **Revision and audit surfaces** always show the AI as the author with the "Consultant" label, so client-authored and AI-authored changes stay distinguishable (DOC-5 policies 13 and 27).

## 5. Reopen only if

- **The AI speaks to the owner's customers** (lead replies, follow-ups, form responses). No current feature does. If one is added, it needs its own disclosure rule: content written as the business must be clearly AI-assisted and never presented as a person. "Consultant" is unlikely to carry over unchanged. Talking to the owner's customers is a different role from advising the owner, so the label needs a fresh decision then.
- **More than one AI becomes visible** in the same conversation again.
