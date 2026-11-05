---
uid: request-f2dd608f
id: REQ-656
type: request
title: 'Library: an Upload button that adds files straight to the Library'
created_by: EPIC-19
created_at: '2026-11-05T19:17:28.502314+00:00'
updated_at: '2026-11-05T19:17:28.502314+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: medium
  parent_uid: epic-95bc3b15
  story_points: 3
  auto_merge_back: true
  needs_review: false
---

## What

The Library gets an **Upload** button, so a client or operator can add their business's material straight to it without going through the conversation.

- **Upload** sits in the Library's header, next to its filters. It opens the same file picker the conversation's **+** uses: the same accepted types, several files at once, and on a phone or tablet the system's photos, camera or files choice.
- **Dropping files onto the Library** does the same, with the same drop highlight the conversation shows.
- **One upload path.** Files are processed exactly as conversation uploads are (stored, described, sorted into the upload areas, social exports unpacked), and appear in the Library as ordinary material with progress shown on their rows. No second upload implementation.
- **The consultant finds out.** On its next turn it is told the client added files to the Library, and which ones, in the same form as other background material notices. It reads them like any other material. The upload itself doesn't post a chat message or start a turn.
- Limits and refusals (file size, type, the archive limit) are the same as in the conversation, and are shown in the Library.

## Why

The operator asked for it (2026-11-05). The Library is where a client looks at their material, and it is the natural place to add more. Today the only way in is the conversation's **+** or dropping files on the conversation.

Related prompt change, made directly without a ticket: the hand-over opening now asks for business material, and the playbook (DOC-75, "Sending you files") gives the consultant exact upload instructions. Once this lands, add the Library's **Upload** to that line.

## Test plan

- UAT (builder in a browser, synthetic business): the Library's **Upload** opens a picker. Choosing two images adds two rows that finish processing, and they are the same material records a conversation upload produces.
- UAT: dropping a file on the Library adds it. A refused type shows the same refusal as the conversation.
- UAT: after a Library upload, the consultant's next turn includes the notice naming the new files, and no chat message was posted.
