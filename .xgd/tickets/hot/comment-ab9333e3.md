---
uid: comment-ab9333e3
id: COMMENT-2031
type: comment
title: Comment on bug BUG-43
created_by: xgd
created_at: '2026-09-01T21:54:36.482890+00:00'
updated_at: '2026-09-01T22:03:12.595049+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-360c5a44
  kind: chat_transcript
---

<!-- xgd-turn id="c0441d0b-d7c9-43f0-8a95-d9d20f9f93ef-user" -->

<!-- xgd-chat role="user" ts="2026-09-01T21:54:21.571291+00:00" -->
#### You
I am asking the AI chat to make changes to the "alpha" website. It appears to be doing things...tool use etc. But the site I am seeing does not change, and refreshing the page makes no difference.

<!-- xgd-turn id="c0441d0b-d7c9-43f0-8a95-d9d20f9f93ef-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-01T22:03:12.427351+00:00" -->
#### Claude
Now a probe that scripts a **write** tool call and checks whether it reaches the store and the rendered preview.

I found it, and it isn't the assistant — it's the preview panel.

**The server side is fine.** I drove the real Worker in workerd with a scripted model that calls a write tool (`add_page`): the tool ran, `edit.ts` wrote to D1, and an immediately following `GET /preview/<slug>/draft/<newpage>` rendered the new page. Writes land, and the very next render sees them.

**The bug is that nothing reloads the preview iframe when an assistant turn ends.** `draft` and `edit` render at request time (REQ-119), so there's no artifact to keep in step — the iframe reload *is* the update mechanism. Every other writer does it:

- `app.js:140` — palette popup: `onChanged: () => panel.frame.contentWindow?.location.reload()`
- `app.js:227` — segment editor: `onSaved: () => …reload()`

The chat pane has no equivalent. Worse, `CARETAKER_SYSTEM` tells the assistant *"The page the user is looking at re-renders after every change, so they will see it"* — which is why it confidently reports the change and never suggests reloading.

**Proposed fix** (ticket BUG-43 now titled and scoped): `streamPrompt` already reads the draft change counter before and after each turn for REQ-131's reminder; when it has moved, yield a final `site_changed` frame. `chat.js` takes an `onSiteChanged` callback, `app.js` passes the same `reload()` the other two writers pass. Gating on the counter keeps a read-only turn from resetting your scroll position for nothing.

**One thing doesn't fit, and I'd rather ask than guess:** you said refreshing the page made no difference. A full browser refresh re-mounts the iframe and re-fetches the preview, so it *should* have shown the change. Which were you refreshing — the builder page itself, or a published site / tab opened via "open in new tab"? If it was the builder page and the change genuinely wasn't there, there's a second fault and I'll keep digging before writing any code.

Say the word and I'll cut the branch and implement the fix as scoped.

<!-- xgd-chat-end -->