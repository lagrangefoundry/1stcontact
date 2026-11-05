---
uid: comment-75b9a23a
id: COMMENT-7813
type: comment
title: Comment on bug BUG-356
created_by: xgd
created_at: '2026-11-05T18:45:20.976450+00:00'
updated_at: '2026-11-05T18:55:01.231914+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-2568c791
  kind: chat_transcript
---

<!-- xgd-cli-session ts="2026-11-05T18:45:17Z" model="claude-opus-5-5" continued_from="new" -->
*Captured by CLI Claude — paraphrased reconstruction from session memory, not raw capture.*

<!-- xgd-chat role="user" ts="2026-11-05T18:45:17Z" -->
#### You
I love these moving hero images, the drop in is excellent. But the consultant is not very good at this on its own: hero movement was not suggested for the first draft, and the initial hero movement was so subtle I didn't even see it. This is a conversation the AI needs to explicitly have with the client; there are a few examples we have now. I can't be there to suggest these and they are very impressive. Details: the translucent photo overlay is only used on desktop, so tablet and phone look very different, and it is a slightly different size from the image/video on desktop, which looks odd.

<!-- xgd-chat role="assistant" ts="2026-11-05T18:45:17Z" -->
#### Claude
The transcript shows no signature_effect decision at any point. REQ-638's DOC-82 cutover removed BUG-306's first-build hold, and no plan piece names the effect; only a playbook line saying 'offer it when it helps' remains. The video tool's guidance tells the model the whole clip should be subtle, which produced the faint first clip. Filed BUG-356: the effect becomes part of the look conversation, with a specific proposal for the client's photo; a showcase of examples curated by the operator; the guidance reworded so the reveal is bold and only the loop is subtle; and the made clip's movement measured and reported. Open question: should marking the look done be refused until the effect is chosen or declined? The overlay problem is a consequence of BUG-355's video-under-overlay workaround, so it was added to BUG-355 as item 4.

<!-- xgd-chat role="user" ts="2026-11-05T18:54:58Z" -->
#### You
I struggle with refusing 'The look' until the client decides. I don't want to be too draconian. I want to make sure the subject has been raised, the client is given options, and it's clear that if she doesn't like them she doesn't have to keep them. Forcing a decision feels harsh; I'd lean towards the consultant choosing and letting the client decline it.

<!-- xgd-chat role="assistant" ts="2026-11-05T18:54:58Z" -->
#### Claude
Updated BUG-356: no refusal and no hold. The consultant picks an effect, records it as 'defaulted', and builds it into the first draft unless the client has already said no. When it shows the draft it names what moves, offers the alternatives, and says the effect comes off whenever they like. A decline parks the decision and restores the still photo, and nothing asks again. The default is the safeguard: a consultant that never raises the subject still ships an effect the client can see and remove.

<!-- xgd-chat-end -->