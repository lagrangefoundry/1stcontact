---
uid: comment-9f65d1d0
id: COMMENT-4898
type: comment
title: Comment on doc DOC-66
created_by: xgd
created_at: '2026-10-04T17:22:13.539256+00:00'
updated_at: '2026-10-04T17:27:44.662806+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: doc-8ec7a301
  kind: chat_transcript
---

<!-- xgd-cli-session ts="2026-10-04T17:22:09Z" model="claude-opus-5-5" continued_from="new" -->
*Captured by CLI Claude — paraphrased reconstruction from session memory, not raw capture.*

<!-- xgd-chat role="user" ts="2026-10-04T17:22:09Z" -->
#### You
UX conversation about naming the AI (or not). With two in the room we had no choice; with 1-1, what do people expect? Fine line between personability and over-anthropomorphising. Pronoun: gendered feels anthropomorphic, 'it' impersonal, 'they' a possibility.

<!-- xgd-chat role="assistant" ts="2026-10-04T17:22:09Z" -->
#### Claude
In 1-1 nobody addresses the AI by name, so a name only matters on third-person surfaces (revision history, portal AI-activity, notifications), and there it is about accountability, not personality. Market has moved from human first names to brand or function names, and disclosure rules (EU AI Act Art. 50, CA bot law) penalise human-sounding names. Warmth comes from behaviour, not the name. Pronouns: write around them; 'it' when forced; avoid 'they' (signals personhood, borrows from non-binary identity, ambiguous with plural); don't police users. Recommend: no name, 'I' in chat, one plain role label, never presented as human to customers.

<!-- xgd-chat role="user" ts="2026-10-04T17:22:09Z" -->
#### You
It was a two-AI, one-person scenario. AI does not speak to the owner's customers in any feature yet.

<!-- xgd-chat role="assistant" ts="2026-10-04T17:22:09Z" -->
#### Claude
Names existed only to tell the two AIs apart, and that need is gone. Watch-outs: keep any hidden delegation out of the conversation (or use role labels, not personas); at most one line of transition copy for prior users; pick a label that will work unchanged if customer-facing features arrive, so a function word like 'Assistant' rather than a coined name.

<!-- xgd-chat role="user" ts="2026-10-04T17:22:09Z" -->
#### You
Worth a short doc ticket so we don't keep revisiting it.

<!-- xgd-chat role="assistant" ts="2026-10-04T17:22:09Z" -->
#### Claude
Filed DOC-66. Label is 'Assistant' because the docs already say 'the assistant' and DOC-4 retired the caretaker framing. Includes reopen triggers: customer-facing AI speech, or more than one visible AI.

<!-- xgd-chat role="user" ts="2026-10-04T17:27:40Z" -->
#### You
No, the AI is a "Consultant", not an assistant.

<!-- xgd-chat role="assistant" ts="2026-10-04T17:27:40Z" -->
#### Claude
Agreed. The docs already use "the consultant" about 100 times (DOC-4, DOC-33, DOC-49). Assistant gets the relationship backwards: it takes instructions, while a consultant brings expertise. DOC-66 now uses "Consultant" ("your consultant" in running copy). Caveat recorded: consultant is also a human job title, so off-app surfaces must mark it as AI, and a future customer-facing role needs its own label decision.

<!-- xgd-chat-end -->