---
uid: request-cff9cb69
id: REQ-414
type: request
title: 'Chat: uploads become attachments in the composer and go with the next message,
  instead of a note the consultant never sees'
created_by: EPIC-19
created_at: '2026-10-19T21:10:06.195763+00:00'
updated_at: '2026-10-19T23:05:48.079161+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  priority: high
  story_points: 5
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-9b186146
  commits:
  - working_sha: f05f875ad00b450cc98e335db0487df85cbba6a9
    reconcile_sha: null
    main_sha: null
  - working_sha: 11454f43a7c0f86a26f672faa49ed3bacb5e24e2
    reconcile_sha: null
    main_sha: null
  version: 0.2.545
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
- after a reload, the attachment appears inside the client's message, not as a separate message.- a refused file says why on its chip, and is not sent;
- a file added while the consultant is working goes out with the next message.

## What landed

- **`apps/control-app/src/builder/attachments.js`** (new): the tray. A file dropped on the conversation, or picked with the **📎 Attach files** button above the text box, becomes a chip with a thumbnail or icon, its label once uploaded, a role select (*For the site* / *For reference*), a status line, and a remove ×. Pictures and fonts default to *For the site*; anything else defaults to *For reference* (the overlay's own split).
- **The message format.** On send, each chip adds one line under the client's text: `📎 Attached: IMAGE-12 (for the site), \`shopfront.jpg\``. The consultant receives exactly this text, and the transcript records it, so the two always agree. A chip with no text is a message by itself (▶ is enabled while a chip is waiting).
- **In the transcript.** Attachment lines inside the client's own bubble are drawn as chips (label, role, filename, plus a thumbnail from the Library for pictures). This happens live, for queued and interposed messages, and after a reload. A label this page didn't upload is resolved against the Library list, read once.
- **Chip wording** ([[BUG-181]] moved onto the chip): `Uploading…`, *"ready to use on your site once sent"*, *"I'll read it — it won't appear on your site"*, *"stored, but I can't search it yet"*, or the origin's refusal sentence for a refused file. A refused chip stays, showing the reason, until the client removes it, and is never sent.
- **While the consultant is working**, Enter or ▶ with chips waiting goes through the chat's own `interpose` (or `queue` where interposition isn't offered), so [[BUG-224]]'s handling applies to them.
- **Switching conversation** clears waiting chips. Their Library items stay.
- **The Library's upload overlay is unchanged** but now watches only the Library. A chat drop no longer raises it. `upload.js` lost its "which entry point" plumbing.

## Design decisions made during implementation

- **Uploaded as `reference`, and widened to `site` when the message is sent** through the existing role-change path (`POST /api/material/role`, which places the picture exactly as an upload would). This is required by item 2. The origin refuses to narrow a file whose bytes already reached the site (`AlreadyOnSiteError`), so a picture placed on upload could never be switched back to *For reference* from the chip. Widening is always allowed. A side effect is that a removed chip leaves a reference-only Library item.
- **A placement that fails softly at send** (the origin's `site_asset_error`) is stated in the attachment line itself: *"— It's in your Library, but isn't ready to use on the site yet: <reason>"*. The consultant and the client both see it, which keeps BUG-181's "don't claim it's usable when it isn't". If the role change itself is refused, the line says *for reference*.
- **No framework change.** `@lagrangefoundry/webui-chat` has no attachment support. The tray sits above its input bar and takes over Enter and ▶ (capture phase) only while a sendable chip is waiting. Otherwise the composer is untouched. A text over the length bound is left to the composer's own refusal, and the chips stay for the retry.
- **The settings conversation and group-chat rooms have no tray.**

## Superseded behaviour (explicit)

This ticket replaces the REQ-161 "chat-route drop appears in the conversation" behaviour and the upload note (`uploadNote`/`placedName`, removed from `app.js`). The tests that pinned that note were moved onto the new surfaces, keeping their intent:
- REQ-161: the chat no longer raises the overlay; a Library drop puts nothing in the conversation; the chat-note failure test is removed (now covered by the REQ-414 refused-chip UAT).
- BUG-181: "ready to use, never on your site" is asserted on the chip; the failed copy is asserted on the sent attachment line.
- REQ-287: the label naming is asserted on the chip name and the attachment line.
- REQ-221: a refused chat drop reports on its chip and only there.

## Tests

`tests/test_UAT_FC_REQ-414_composer_attachments.test.ts` (8 UATs, real builder and real `webui-chat`, only HTTP injected). The retargeted BUG-181, REQ-161, REQ-221 and REQ-287 files also pass. Regression: every node suite that mounts the builder or chat (111 files). The 21 failures there were confirmed pre-existing by re-running those suites on the original sources (worktree origin-serving suites, REQ-127, BUG-64, BUG-53, BUG-52, REQ-180, BUG-58, REQ-259, REQ-391).