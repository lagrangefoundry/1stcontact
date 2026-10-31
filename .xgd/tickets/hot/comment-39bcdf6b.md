---
uid: comment-39bcdf6b
id: COMMENT-5862
type: comment
title: Comment on request REQ-619
created_by: xgd
created_at: '2026-10-31T19:08:59.997664+00:00'
updated_at: '2026-10-31T19:43:51.983935+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-d13cd7a8
  kind: chat_transcript
---

<!-- xgd-cli-session ts="2026-10-31T19:08:54Z" model="claude-opus-5-5" continued_from="new" -->
*Captured by CLI Claude — paraphrased reconstruction from session memory, not raw capture.*

<!-- xgd-chat role="user" ts="2026-10-31T19:08:54Z" -->
#### You
Going through a full site build on production. 1) Upload links in questions - can we have them upload multiple documents? 2) I am finding Open Questions and "What you have told us" confusing. When I answer a question it seems to disappear (it's going to the What you have told us section, but that's further down the page). I think we should have one list; when a question is answered automatically collapse it and check the box.

<!-- xgd-chat role="assistant" ts="2026-10-31T19:08:54Z" -->
#### Claude
1) Several files per upload already exists but is only on by default for upload_role: site asks; background documents (business card, price list) take one file unless the consultant sets `multiple`. Proposal: every upload ask takes several files and the `multiple` setting is removed; decided at draw time so existing asks change too. 2) Merge into one list headed Questions, in posting order; an answered ask stays in place, ticked and folded; skipped likewise; an 'N of M answered' count by the heading; the N-new badge and reopen-to-change stay. Fold and tick machinery already exists (REQ-401), so this is mostly removing the second section. One ticket under EPIC-19 for both.

<!-- xgd-chat role="user" ts="2026-10-31T19:08:54Z" -->
#### You
The text box on the last question is not being rendered at a proper size, it is about 1/3 of a character high. Yes and fold this in too please.

<!-- xgd-chat role="assistant" ts="2026-10-31T19:08:54Z" -->
#### Claude
Likely cause: the long-answer box's grow() sets an inline height from scrollHeight in a microtask after the block is built; if the block isn't laid out then (Input view hidden, item folded, not yet attached) scrollHeight is 0 and the box is pinned at 0px plus padding with overflow hidden. Fix: three-row minimum in the stylesheet, grow() never sets a height below it, and re-grow when shown. Folded into the same ticket as item 3.

<!-- xgd-chat role="user" ts="2026-10-31T19:43:47Z" -->
#### You
Counting skipped as dealt with is right; I do not want to be directed to revisit something I explicitly skipped.

<!-- xgd-chat role="assistant" ts="2026-10-31T19:43:47Z" -->
#### Claude
Recorded in the ticket body: skipped counts toward N of M answered, is never highlighted or badged as outstanding, folds like an answered ask, and can still be reopened by the client.

<!-- xgd-chat-end -->