---
uid: bug-b30c59eb
id: BUG-216
type: bug
title: 'Plan panel: upload cards need an Uploaded button for files sent another way'
created_by: martin-github@westhead.me
created_at: '2026-10-17T22:54:39.394601+00:00'
updated_at: '2026-10-17T23:01:57.693180+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-95a52e8b
  severity: medium
---

## Symptom

A plan-panel card (ask) that takes an upload offers only "Upload a document" / "Upload files" (a file picker on the card) and "Skip". There are other routes to uploading — dragging files onto the chat or Library (the upload overlay), the Library tab — and none of them answer the card. The operator dropped a file by drag and drop, then had no way to tell the card it was done, and had to press Skip, which tells the agent the opposite of what happened.

## Root cause

`editor()` in `apps/control-app/src/builder/plan-panel.js` draws only the card's own picker and Skip for an upload ask. `receiveFiles()` in `app.js` (chat/Library drops) never touches the plan panel, so an upload made elsewhere leaves the ask open.

## Fix

Every card that takes an upload (`input: upload` or `accepts_upload`) gets an **"Uploaded"** button beside its upload picker and Skip (title: "I've already uploaded it another way, such as by dragging it in"). Pressing it answers the ask at once — `action: answer` with the typed answer "Uploaded to the Library" — so:

- the card closes as answered (not skipped) and its done row reads "Uploaded to the Library", with Change to reopen it, like any answer;
- the agent's next-turn plan-answers notice reports that answer, telling it the file is in the Library rather than that the client skipped.

No server change: it is an ordinary client answer through `POST /api/plan/ask`. Cards that do not take an upload get no such button.

## Why free-coded

A one-button UI fix to an existing panel.

## Test plan

`tests/test_UAT_FC_BUG-216_uploaded_button.test.ts` (jsdom, the real plan panel with a recording transport, same pattern as the REQ-364 / BUG-196 panel UATs):
- an upload ask shows Uploaded; pressing it sends one `answer` with "Uploaded to the Library" and no upload, and the card redraws answered with that text;
- an `accepts_upload` typed ask shows it too; a plain text ask does not.
Regression: the existing plan-panel UATs (REQ-364, BUG-196, BUG-211, BUG-200, REQ-399, REQ-401).
