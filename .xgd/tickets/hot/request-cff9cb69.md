---
uid: request-cff9cb69
id: REQ-414
type: request
title: 'Chat: uploads become attachments in the composer and go with the next message,
  instead of a note the consultant never sees'
created_by: EPIC-19
created_at: '2026-10-19T21:10:06.195763+00:00'
updated_at: '2026-10-19T21:10:06.195763+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  story_points: 5
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
---

## What's wrong today

When the client drops a file into the chat, it's uploaded straight away and a note (`uploadNote`, `apps/control-app/src/builder/app.js` around line 1648) is painted into the conversation *as if it were a message from the client*. But nothing is sent. The consultant doesn't know about the file until the client's next message. So it looks as though the consultant ignored it, and the transcript shows a "message" the model never received (operator, 2026-10-19, EPIC-19).

## What should happen: attachments in the composer, like ChatGPT

1. **A dropped or picked file appears as a chip in the composer**, not in the transcript. It's uploaded as soon as it's added, as now, and shows a thumbnail or file icon, its label once it has one (`IMAGE-12`, `DOC-3`), and a remove ×.
2. **What it's for is chosen on the chip.** "For the site" or "For reference" (BUG-196's roles), defaulting the way uploads do today. Changing it before sending uses the existing role-change path.
3. **It's sent with the next message.** The consultant's turn receives the client's words and the attachments together, each named with its label, role and filename, e.g. *"Attached: IMAGE-12 (for the site), shopfront.jpg"*. The transcript shows the files inside the client's message, as thumbnails or chips, never as a separate fake message.
4. **Files with no text can be sent.** Sending only attachments is allowed and starts a normal turn, so the consultant can acknowledge it briefly: *"Got it, four portraits. Want them in the team section?"*
5. **Removing a chip before sending** takes the file out of the message. The Library item stays, because it's already uploaded; the client can delete it from the Library.
6. **Uploads while the consultant is working** become chips the same way, and go out with whatever the client sends next, so BUG-224's queue applies to them too.
7. **Unchanged:** uploads that answer a panel question are answers, and reach the consultant through its per-turn notice. Edits the client makes in Edit mode don't trigger a turn. A file over the size limit, or of a type we don't accept, is refused on the chip with the reason.
8. **The upload-confirmation wording (BUG-181) moves onto the chip**, e.g. "IMAGE-3 · ready to use on your site", and stops being a chat message.

## Test plan

UATs `test_UAT_FC_<id>_*`:
- dropping a file adds a chip and adds nothing to the transcript;
- sending text plus a chip gives the consultant one turn that names the attachment's label and role;
- sending only a chip starts a turn;
- removing a chip before sending leaves the turn with no attachment;
- choosing "For reference" on the chip makes the Library item reference-only;
- after a reload, the attachment appears inside the client's message, not as a separate message.
